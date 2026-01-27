/**
 * AI Context Bridge - Gemini Content Script
 *
 * Extracts and injects conversation context for Google Gemini
 */

class GeminiExtractor {
  constructor() {
    this.platformId = 'gemini';
    this.isInitialized = false;
    this.floatingButton = null;
  }

  async init() {
    if (this.isInitialized) return;

    await this.waitForElement('[data-message-id], .conversation-container', 3000).catch(() => {});

    this.injectFloatingButton();
    this.setupMessageListener();
    this.checkForPendingContext();

    this.isInitialized = true;
    console.log('[AI Context Bridge] Gemini extractor initialized');
  }

  waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const element = document.querySelector(selector);
      if (element) return resolve(element);

      const observer = new MutationObserver((mutations, obs) => {
        const el = document.querySelector(selector);
        if (el) {
          obs.disconnect();
          resolve(el);
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });
      setTimeout(() => {
        observer.disconnect();
        reject(new Error('Timeout'));
      }, timeout);
    });
  }

  async checkForPendingContext() {
    const response = await chrome.runtime.sendMessage({
      type: 'GET_PENDING_CONTEXT',
      payload: { platform: this.platformId }
    });

    if (response?.context) {
      setTimeout(async () => {
        const text = this.formatContextForPaste(response.context);
        await this.injectIntoInput(text);
        this.showNotification('Context ready - press Enter to send', 'success');
      }, 1000);
    }
  }

  extractMessages() {
    const messages = [];

    // Gemini uses various selectors - try multiple strategies
    const selectors = [
      // User queries
      { user: '[data-message-author="user"], .query-content, .user-query', assistant: '[data-message-author="model"], .model-response, .response-content' },
      // Alternative structure
      { user: '.query-text', assistant: '.response-text' }
    ];

    for (const selector of selectors) {
      const userMsgs = document.querySelectorAll(selector.user);
      const assistantMsgs = document.querySelectorAll(selector.assistant);

      if (userMsgs.length > 0 || assistantMsgs.length > 0) {
        const allMsgs = [
          ...Array.from(userMsgs).map(el => ({ el, role: 'user' })),
          ...Array.from(assistantMsgs).map(el => ({ el, role: 'assistant' }))
        ].sort((a, b) => {
          const position = a.el.compareDocumentPosition(b.el);
          return position & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
        });

        for (const { el, role } of allMsgs) {
          const content = el.innerText?.trim();
          if (content) {
            messages.push({ role, content });
          }
        }

        if (messages.length > 0) break;
      }
    }

    // Fallback: look for turn-based structure
    if (messages.length === 0) {
      const turns = document.querySelectorAll('[class*="turn"], [class*="message"]');
      let currentRole = 'user';

      turns.forEach(turn => {
        const content = turn.innerText?.trim();
        if (content && content.length > 10) {
          messages.push({ role: currentRole, content });
          currentRole = currentRole === 'user' ? 'assistant' : 'user';
        }
      });
    }

    return messages;
  }

  extractTitle() {
    // Try to get from conversation title
    const titleEl = document.querySelector('[class*="conversation-title"], [class*="chat-title"]');
    if (titleEl) return titleEl.textContent.trim();

    const docTitle = document.title.replace(' - Gemini', '').replace('Gemini', '').trim();
    if (docTitle) return docTitle;

    return null;
  }

  async injectIntoInput(text) {
    const selectors = [
      '.ql-editor',
      '[contenteditable="true"]',
      'textarea',
      'rich-textarea',
      '[data-placeholder]'
    ];

    let input = null;
    for (const selector of selectors) {
      input = document.querySelector(selector);
      if (input) break;
    }

    if (!input) {
      throw new Error('Could not find input field');
    }

    input.focus();

    if (input.tagName === 'TEXTAREA') {
      input.value = text;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      input.innerHTML = `<p>${text}</p>`;
      input.dispatchEvent(new InputEvent('input', { bubbles: true }));
    }
  }

  injectFloatingButton() {
    if (document.getElementById('acb-floating-btn')) return;

    const button = document.createElement('div');
    button.id = 'acb-floating-btn';
    button.className = 'acb-floating-btn';
    button.innerHTML = `
      <div class="acb-btn-icon">🔄</div>
      <div class="acb-btn-menu">
        <div class="acb-menu-header">AI Context Bridge</div>
        <button class="acb-menu-item" data-action="capture">
          📥 Capture Context
        </button>
        <button class="acb-menu-item" data-action="paste">
          📋 Paste Context Here
        </button>
        <div class="acb-menu-divider"></div>
        <div class="acb-menu-label">Get Second Opinion</div>
        <button class="acb-menu-item" data-action="send" data-platform="chatgpt">
          🤖 Send to ChatGPT
        </button>
        <button class="acb-menu-item" data-action="send" data-platform="claude">
          🟠 Send to Claude
        </button>
        <button class="acb-menu-item" data-action="send" data-platform="perplexity">
          🔍 Send to Perplexity
        </button>
      </div>
    `;

    document.body.appendChild(button);

    button.querySelector('.acb-btn-icon').addEventListener('click', (e) => {
      e.stopPropagation();
      button.classList.toggle('acb-expanded');
    });

    button.querySelectorAll('.acb-menu-item').forEach(item => {
      item.addEventListener('click', async (e) => {
        e.stopPropagation();
        await this.handleAction(item.dataset.action, item.dataset);
        button.classList.remove('acb-expanded');
      });
    });

    document.addEventListener('click', () => {
      button.classList.remove('acb-expanded');
    });

    this.floatingButton = button;
  }

  async handleAction(action, data) {
    switch (action) {
      case 'capture':
        await this.captureContext();
        break;
      case 'paste':
        await this.pasteContext();
        break;
      case 'send':
        await this.sendToPlatform(data.platform);
        break;
    }
  }

  async captureContext() {
    const messages = this.extractMessages();
    if (messages.length === 0) {
      this.showNotification('No messages found', 'warning');
      return;
    }

    const context = {
      source: this.platformId,
      messages,
      url: window.location.href,
      title: this.extractTitle()
    };

    const response = await chrome.runtime.sendMessage({
      type: 'SAVE_CONTEXT',
      payload: context
    });

    if (response?.success) {
      this.showNotification(`✓ Captured ${messages.length} messages`, 'success');
    } else {
      this.showNotification('Failed to save', 'error');
    }
  }

  async pasteContext() {
    const response = await chrome.runtime.sendMessage({
      type: 'GET_LATEST_CONTEXT'
    });

    if (!response?.context) {
      this.showNotification('No saved context', 'warning');
      return;
    }

    const text = this.formatContextForPaste(response.context);
    await this.injectIntoInput(text);
    this.showNotification('✓ Context pasted', 'success');
  }

  async sendToPlatform(platformId) {
    const messages = this.extractMessages();
    if (messages.length === 0) {
      this.showNotification('No messages to send', 'warning');
      return;
    }

    const context = {
      source: this.platformId,
      messages,
      url: window.location.href,
      title: this.extractTitle()
    };

    await chrome.runtime.sendMessage({
      type: 'SEND_TO_PLATFORM',
      payload: { context, targetPlatform: platformId }
    });

    this.showNotification(`Opening ${platformId}...`, 'success');
  }

  formatContextForPaste(context) {
    const lines = [`[Context from ${context.source}]\n`];
    for (const msg of context.messages) {
      const role = msg.role === 'user' ? 'User' : 'Assistant';
      lines.push(`**${role}:** ${msg.content}\n`);
    }
    lines.push(`\n[Please continue helping with this topic.]`);
    return lines.join('\n');
  }

  showNotification(message, type = 'info') {
    const existing = document.querySelector('.acb-notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `acb-notification acb-notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('acb-notification-hide');
      setTimeout(() => notification.remove(), 300);
    }, 2500);
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'PASTE_CONTEXT') {
        this.injectIntoInput(message.payload.text)
          .then(() => sendResponse({ success: true }))
          .catch(err => sendResponse({ success: false, error: err.message }));
        return true;
      }
    });
  }
}

const extractor = new GeminiExtractor();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => extractor.init());
} else {
  extractor.init();
}
