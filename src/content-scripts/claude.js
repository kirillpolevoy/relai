/**
 * AI Context Bridge - Claude Content Script
 *
 * Extracts and injects conversation context for Claude (claude.ai)
 */

class ClaudeExtractor {
  constructor() {
    this.platformId = 'claude';
    this.isInitialized = false;
    this.floatingButton = null;
  }

  async init() {
    if (this.isInitialized) return;

    // Wait for conversation to potentially load
    await this.waitForElement('[data-testid="user-message"], .font-user-message', 3000).catch(() => {});

    // Floating button disabled - using popup only
    // this.injectFloatingButton();
    this.setupMessageListener();
    this.checkForPendingContext();

    this.isInitialized = true;
    console.log('[AI Context Bridge] Claude extractor initialized');
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

  /**
   * Check if there's pending context to paste (from "send to" flow)
   */
  async checkForPendingContext() {
    const response = await chrome.runtime.sendMessage({
      type: 'GET_PENDING_CONTEXT',
      payload: { platform: this.platformId }
    });

    if (response?.context) {
      // Wait a bit for input to be ready
      setTimeout(async () => {
        const text = this.formatContextForPaste(response.context);
        await this.injectIntoInput(text);
        this.showNotification('Context ready - press Enter to send', 'success');
      }, 1000);
    }
  }

  /**
   * Extract messages from Claude conversation
   */
  extractMessages() {
    const messages = [];

    console.log('[Claude] Starting message extraction');

    // Strategy 1: Try class-based extraction (Claude Code environment)
    const userMessages = document.querySelectorAll('[class*="font-user"]');
    const assistantMessages = document.querySelectorAll('.font-claude-response, [class*="font-claude-response"]');

    console.log('[Claude] Class-based: Found', userMessages.length, 'user messages,', assistantMessages.length, 'assistant messages');

    if (userMessages.length > 0 || assistantMessages.length > 0) {
      // Combine and sort by DOM position
      const allMsgs = [
        ...Array.from(userMessages).map(el => ({ el, role: 'user' })),
        ...Array.from(assistantMessages).map(el => ({ el, role: 'assistant' }))
      ].sort((a, b) => {
        const position = a.el.compareDocumentPosition(b.el);
        return position & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
      });

      allMsgs.forEach(({ el, role }) => {
        const content = el.innerText?.trim();
        if (content && content.length > 0) {
          console.log(`[Claude] Extracted ${role} message (${content.length} chars):`, content.substring(0, 50));
          messages.push({ role, content });
        }
      });

      if (messages.length > 0) {
        console.log('[Claude] Class-based extraction succeeded:', messages.length, 'messages');
        return messages;
      }
    }

    // Strategy 2: Try data-testid (claude.ai web)
    console.log('[Claude] Trying data-testid strategy...');
    const allMessageElements = document.querySelectorAll('[data-testid*="message"]');
    console.log('[Claude] Found message elements:', allMessageElements.length);

    if (allMessageElements.length > 0) {
      allMessageElements.forEach((el, index) => {
        const testId = el.getAttribute('data-testid') || '';
        let role = null;

        if (testId.includes('user')) {
          role = 'user';
        } else if (testId.includes('assistant') || testId.includes('claude')) {
          role = 'assistant';
        }

        const content = el.innerText?.trim();

        if (role && content) {
          console.log(`[Claude] Extracted ${role} message:`, content.substring(0, 50));
          messages.push({ role, content });
        }
      });
    }

    console.log('[Claude] Final message count:', messages.length);
    console.log('[Claude] Breakdown:', messages.filter(m => m.role === 'user').length, 'user,', messages.filter(m => m.role === 'assistant').length, 'assistant');

    return messages;
  }

  /**
   * Extract conversation title
   */
  extractTitle() {
    console.log('[Claude] Extracting title...');

    // Strategy 1: Try h1 in header (most reliable)
    const h1 = document.querySelector('h1');
    if (h1) {
      const title = h1.textContent.trim();
      if (title && title.length > 0 && title !== 'Claude') {
        console.log('[Claude] Title from h1:', title);
        return title;
      }
    }

    // Strategy 2: Try document title
    const docTitle = document.title.replace(' - Claude', '').replace('Claude', '').trim();
    if (docTitle && docTitle.length > 0) {
      console.log('[Claude] Title from document.title:', docTitle);
      return docTitle;
    }

    // Strategy 3: Try sidebar active conversation (often truncated, so last resort)
    const activeConvo = document.querySelector('[class*="active"] [class*="truncate"], nav a[aria-current="page"]');
    if (activeConvo) {
      const title = activeConvo.textContent.trim();
      if (title && title.length > 0 && !title.startsWith('New chat')) {
        console.log('[Claude] Title from sidebar:', title);
        return title;
      }
    }

    // Strategy 4: Fallback to first user message
    const firstUserMsg = document.querySelector('.font-user-message, [data-testid="user-message"]');
    if (firstUserMsg) {
      const text = firstUserMsg.innerText?.trim();
      if (text) {
        const fallbackTitle = text.length > 50 ? text.substring(0, 50) + '...' : text;
        console.log('[Claude] Title from first message:', fallbackTitle);
        return fallbackTitle;
      }
    }

    console.log('[Claude] No title found, returning null');
    return null;
  }

  /**
   * Inject text into Claude input
   */
  async injectIntoInput(text) {
    // Claude uses a contenteditable div or ProseMirror editor
    const selectors = [
      '[contenteditable="true"]',
      '.ProseMirror',
      'textarea',
      '[data-testid="composer-input"]'
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
      // Contenteditable / ProseMirror
      // Clear existing content
      input.innerHTML = '';

      // Create paragraph with text
      const p = document.createElement('p');
      p.textContent = text;
      input.appendChild(p);

      // Dispatch input event
      input.dispatchEvent(new InputEvent('input', {
        bubbles: true,
        cancelable: true,
        inputType: 'insertText',
        data: text
      }));
    }
  }

  /**
   * Inject floating button
   */
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
        <button class="acb-menu-item" data-action="send" data-platform="gemini">
          💎 Send to Gemini
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
    const platformName = {
      'chatgpt': 'ChatGPT',
      'claude': 'Claude',
      'gemini': 'Gemini',
      'perplexity': 'Perplexity'
    }[context.source] || context.source;

    const lines = [
      `I'm sharing a conversation I had with ${platformName}. Here's the full context:\n`,
      `---\n`
    ];

    for (const msg of context.messages) {
      const role = msg.role === 'user' ? '**User**' : '**Assistant**';
      lines.push(`${role}: ${msg.content}\n`);
    }

    lines.push(`\n---\n`);
    lines.push(`Please help me continue this conversation or answer any follow-up questions about it.`);

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
      console.log('[Claude] Received message:', message.type);

      if (message.type === 'CAPTURE_CONTEXT') {
        console.log('[Claude] Handling CAPTURE_CONTEXT');
        // Don't extract here - let captureContext() do it once
        this.captureContext().then(() => {
          console.log('[Claude] Capture completed');
          sendResponse({ success: true });
        }).catch(err => {
          console.error('[Claude] Capture failed:', err);
          sendResponse({ success: false, error: err.message });
        });
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

// Initialize
const extractor = new ClaudeExtractor();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => extractor.init());
} else {
  extractor.init();
}
