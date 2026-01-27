/**
 * Relai - ChatGPT Content Script
 *
 * Extracts and injects conversation context for ChatGPT (chat.openai.com, chatgpt.com)
 */

// Import base extractor (injected via manifest)
const script = document.createElement('script');
script.src = chrome.runtime.getURL('src/content-scripts/base-extractor.js');
script.onload = () => script.remove();
(document.head || document.documentElement).appendChild(script);

class ChatGPTExtractor {
  constructor() {
    this.platformId = 'chatgpt';
    this.isInitialized = false;
    this.floatingButton = null;
  }

  async init() {
    if (this.isInitialized) return;

    // Wait for page to load
    await this.waitForElement('[data-message-author-role]', 5000).catch(() => {});

    // Floating button disabled - using popup only
    // this.injectFloatingButton();
    this.setupMessageListener();
    this.checkForPendingContext();

    this.isInitialized = true;
    console.log('[Relai] ChatGPT extractor initialized');
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
        reject(new Error('Timeout waiting for element'));
      }, timeout);
    });
  }

  /**
   * Check if there's pending context to paste (from "send to" flow)
   */
  async checkForPendingContext() {
    console.log('[ChatGPT] Checking for pending context...');
    console.log('[ChatGPT] Platform ID:', this.platformId);

    const response = await chrome.runtime.sendMessage({
      type: 'GET_PENDING_CONTEXT',
      payload: { platform: this.platformId }
    });

    console.log('[ChatGPT] Pending context response:', response);

    if (response?.context) {
      console.log('[ChatGPT] Found pending context, will inject in 1s');
      // Wait a bit for input to be ready
      setTimeout(async () => {
        try {
          console.log('[ChatGPT] Formatting context...');
          const text = this.formatContextForPaste(response.context);
          console.log('[ChatGPT] Text length:', text.length);
          console.log('[ChatGPT] Injecting into input...');
          await this.injectIntoInput(text);
          console.log('[ChatGPT] Injection successful!');
          this.showNotification('Context ready - press Enter to send', 'success');
        } catch (err) {
          console.error('[ChatGPT] Failed to inject context:', err);
          this.showNotification('Failed to paste context', 'error');
        }
      }, 1000);
    } else {
      console.log('[ChatGPT] No pending context found');
    }
  }

  /**
   * Extract messages from ChatGPT conversation
   */
  extractMessages() {
    const messages = [];

    console.log('[ChatGPT] Starting message extraction');

    // ChatGPT uses data-message-author-role attribute
    const messageElements = document.querySelectorAll('[data-message-author-role]');
    console.log('[ChatGPT] Found message elements:', messageElements.length);

    messageElements.forEach((el, index) => {
      const role = el.getAttribute('data-message-author-role');
      console.log(`[ChatGPT] Message ${index + 1}: role="${role}"`);

      if (role === 'user' || role === 'assistant') {
        // Find the text content container
        const contentEl = el.querySelector('.markdown, .whitespace-pre-wrap');

        if (contentEl) {
          const content = contentEl.innerText.trim();
          console.log(`[ChatGPT] Message ${index + 1}: Found content (${content.length} chars)`);
          messages.push({
            role: role,
            content: content
          });
        } else {
          console.log(`[ChatGPT] Message ${index + 1}: No content element found (.markdown or .whitespace-pre-wrap)`);

          // Try fallback - get text from parent element
          const fallbackContent = el.innerText?.trim();
          if (fallbackContent && fallbackContent.length > 0) {
            console.log(`[ChatGPT] Message ${index + 1}: Using fallback content (${fallbackContent.length} chars)`);
            messages.push({
              role: role,
              content: fallbackContent
            });
          }
        }
      }
    });

    console.log('[ChatGPT] Total messages extracted:', messages.length);
    console.log('[ChatGPT] Breakdown:', messages.filter(m => m.role === 'user').length, 'user,', messages.filter(m => m.role === 'assistant').length, 'assistant');

    return messages;
  }

  /**
   * Extract conversation title
   */
  extractTitle() {
    // Try to get from sidebar or header
    const titleEl = document.querySelector('nav a.bg-token-sidebar-surface-secondary');
    if (titleEl) {
      return titleEl.textContent.trim();
    }

    // Fallback: try to get from document title
    const docTitle = document.title.replace(' - ChatGPT', '').trim();
    if (docTitle && docTitle !== 'ChatGPT') {
      return docTitle;
    }

    return null;
  }

  /**
   * Inject text into ChatGPT input
   */
  async injectIntoInput(text) {
    // Find the textarea/contenteditable input
    const input = document.querySelector('#prompt-textarea, textarea[placeholder*="Message"]');

    if (!input) {
      throw new Error('Could not find input field');
    }

    // Focus and set value
    input.focus();

    if (input.tagName === 'TEXTAREA') {
      input.value = text;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      // Contenteditable div
      input.innerText = text;
      input.dispatchEvent(new InputEvent('input', { bubbles: true }));
    }

    // Trigger React state update
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype, 'value'
    )?.set;

    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(input, text);
      input.dispatchEvent(new Event('input', { bubbles: true }));
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
      <div class="acb-btn-menu" id="acb-btn-menu">
        <div class="acb-menu-header">Relai</div>
        <button class="acb-menu-item" data-action="capture">
          📥 Capture Context
        </button>
        <button class="acb-menu-item" data-action="paste">
          📋 Paste Context Here
        </button>
        <div class="acb-menu-divider"></div>
        <div class="acb-menu-label">Get Second Opinion</div>
        <button class="acb-menu-item" data-action="send" data-platform="claude">
          🟠 Send to Claude
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

    // Toggle menu
    button.querySelector('.acb-btn-icon').addEventListener('click', (e) => {
      e.stopPropagation();
      button.classList.toggle('acb-expanded');
    });

    // Menu actions
    button.querySelectorAll('.acb-menu-item').forEach(item => {
      item.addEventListener('click', async (e) => {
        e.stopPropagation();
        await this.handleAction(item.dataset.action, item.dataset);
        button.classList.remove('acb-expanded');
      });
    });

    // Close on outside click
    document.addEventListener('click', () => {
      button.classList.remove('acb-expanded');
    });

    this.floatingButton = button;
  }

  /**
   * Handle menu actions
   */
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
      if (message.type === 'CAPTURE_CONTEXT') {
        // Don't extract here - let captureContext() do it once
        this.captureContext();
        sendResponse({ success: true });
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

// Initialize when DOM ready
const extractor = new ChatGPTExtractor();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => extractor.init());
} else {
  extractor.init();
}
