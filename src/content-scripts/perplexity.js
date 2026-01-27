/**
 * AI Context Bridge - Perplexity Content Script
 *
 * Extracts and injects conversation context for Perplexity AI
 */

class PerplexityExtractor {
  constructor() {
    this.platformId = 'perplexity';
    this.isInitialized = false;
    this.floatingButton = null;
  }

  async init() {
    if (this.isInitialized) return;

    await this.waitForElement('[class*="prose"], [class*="answer"]', 3000).catch(() => {});

    // Floating button disabled - using popup only
    // this.injectFloatingButton();
    this.setupMessageListener();
    this.checkForPendingContext();

    this.isInitialized = true;
    console.log('[AI Context Bridge] Perplexity extractor initialized');
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

    // Perplexity has a Q&A structure
    // Look for question/query blocks and answer blocks
    const queryBlocks = document.querySelectorAll('[class*="query"], [class*="question"], .whitespace-pre-wrap');
    const answerBlocks = document.querySelectorAll('[class*="prose"], [class*="answer"], [class*="response"]');

    // Try to pair queries with answers
    if (queryBlocks.length > 0 && answerBlocks.length > 0) {
      const maxPairs = Math.max(queryBlocks.length, answerBlocks.length);

      for (let i = 0; i < maxPairs; i++) {
        if (queryBlocks[i]) {
          const content = queryBlocks[i].innerText?.trim();
          if (content) {
            messages.push({ role: 'user', content });
          }
        }
        if (answerBlocks[i]) {
          const content = answerBlocks[i].innerText?.trim();
          if (content && content.length > 20) {
            messages.push({ role: 'assistant', content });
          }
        }
      }
    }

    // Fallback: try thread-based structure
    if (messages.length === 0) {
      const threads = document.querySelectorAll('[class*="thread-message"], [class*="message-block"]');
      threads.forEach((thread, i) => {
        const content = thread.innerText?.trim();
        if (content) {
          messages.push({
            role: i % 2 === 0 ? 'user' : 'assistant',
            content
          });
        }
      });
    }

    return messages;
  }

  extractTitle() {
    // Perplexity often shows query in header
    const titleEl = document.querySelector('h1, [class*="title"]');
    if (titleEl) {
      const text = titleEl.textContent.trim();
      if (text && text !== 'Perplexity') return text;
    }

    const docTitle = document.title.replace(' - Perplexity', '').trim();
    if (docTitle && docTitle !== 'Perplexity') return docTitle;

    return null;
  }

  async injectIntoInput(text) {
    const selectors = [
      'textarea',
      '[contenteditable="true"]',
      'input[type="text"]',
      '[class*="input"]'
    ];

    let input = null;
    for (const selector of selectors) {
      input = document.querySelector(selector);
      if (input && (input.tagName === 'TEXTAREA' || input.contentEditable === 'true')) {
        break;
      }
    }

    if (!input) {
      throw new Error('Could not find input field');
    }

    input.focus();

    if (input.tagName === 'TEXTAREA' || input.tagName === 'INPUT') {
      input.value = text;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      input.innerText = text;
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
        <button class="acb-menu-item" data-action="send" data-platform="gemini">
          💎 Send to Gemini
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
      if (message.type === 'CAPTURE_CONTEXT') {
        const messages = this.extractMessages();
        if (messages && messages.length > 0) {
          this.captureContext();
          sendResponse({ success: true });
        } else {
          sendResponse({ success: false, error: 'No messages found' });
        }
        return true;
      }

      if (message.type === 'PASTE_CONTEXT') {
        this.injectIntoInput(message.payload.text)
          .then(() => sendResponse({ success: true }))
          .catch(err => sendResponse({ success: false, error: err.message }));
        return true;
      }
    });
  }
}

const extractor = new PerplexityExtractor();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => extractor.init());
} else {
  extractor.init();
}
