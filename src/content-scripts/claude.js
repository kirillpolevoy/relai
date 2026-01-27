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

    // First, let's see what the page structure actually looks like
    console.log('[Claude] Body children count:', document.body.children.length);
    console.log('[Claude] Looking for common container patterns...');

    // Try to find the actual conversation area with broader selectors
    const possibleContainers = [
      document.body,  // Fallback: search entire body
      document.querySelector('[class*="conversation"]'),
      document.querySelector('main'),
      document.querySelector('[role="main"]'),
      document.querySelector('#root'),
      document.querySelector('[class*="chat"]'),
      document.querySelector('[class*="message"]')
    ].filter(el => el !== null);

    console.log('[Claude] Found', possibleContainers.length, 'possible containers');

    const conversationContainer = possibleContainers[0];
    if (!conversationContainer) {
      console.log('[Claude] No conversation container found at all');
      return messages;
    }

    console.log('[Claude] Using container:', conversationContainer.tagName, conversationContainer.className?.substring(0, 50));

    // Try multiple selector strategies for Claude's UI
    const selectors = [
      // Strategy 1: data-testid attributes
      { user: '[data-testid="user-message"]', assistant: '[data-testid="assistant-message"]' },
      // Strategy 2: class-based
      { user: '.font-user-message', assistant: '.font-claude-message' },
      // Strategy 3: role-based divs
      { user: '[data-role="user"]', assistant: '[data-role="assistant"]' }
    ];

    for (const [index, selector] of selectors.entries()) {
      console.log(`[Claude] Trying selector strategy ${index + 1}:`, selector);
      const userMsgs = document.querySelectorAll(selector.user);
      const assistantMsgs = document.querySelectorAll(selector.assistant);
      console.log(`[Claude] Strategy ${index + 1} found: ${userMsgs.length} user, ${assistantMsgs.length} assistant`);

      if (userMsgs.length > 0 || assistantMsgs.length > 0) {
        // Combine and sort by DOM position
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

        if (messages.length > 0) {
          console.log(`[Claude] Strategy ${index + 1} succeeded, extracted ${messages.length} messages`);
          break;
        }
      }
    }

    // Fallback: Try to parse conversation from general structure
    if (messages.length === 0) {
      console.log('[Claude] All strategies failed, trying fallback');
      const turns = document.querySelectorAll('[class*="turn"], [class*="message-row"]');
      console.log('[Claude] Fallback found turns:', turns.length);

      turns.forEach(turn => {
        const isUser = turn.classList.toString().includes('human') ||
                       turn.classList.toString().includes('user') ||
                       turn.querySelector('[class*="user"]');
        const content = turn.innerText?.trim();
        if (content && content.length > 0) {
          messages.push({
            role: isUser ? 'user' : 'assistant',
            content
          });
        }
      });

      console.log('[Claude] Fallback extracted:', messages.length, 'messages');
    }

    // If still no messages, log sample of DOM structure for debugging
    if (messages.length === 0) {
      console.log('[Claude] No messages found. Sampling DOM structure:');

      // Look for any divs that might be messages
      const allDivs = conversationContainer.querySelectorAll('div');
      console.log('[Claude] Total divs in container:', allDivs.length);

      // Sample data attributes
      const divsWithData = Array.from(allDivs).filter(div =>
        Array.from(div.attributes).some(attr => attr.name.startsWith('data-'))
      ).slice(0, 5);
      console.log('[Claude] Sample divs with data attributes:',
        divsWithData.map(div => ({
          data: Array.from(div.attributes)
            .filter(a => a.name.startsWith('data-'))
            .map(a => `${a.name}="${a.value}"`)
            .join(' '),
          textPreview: div.innerText?.substring(0, 50)
        }))
      );

      // Sample class names
      const classNames = new Set();
      for (let i = 0; i < Math.min(50, allDivs.length); i++) {
        const classes = allDivs[i].className;
        if (classes && typeof classes === 'string') classNames.add(classes);
      }
      console.log('[Claude] Sample unique class names (first 15):',
        Array.from(classNames).slice(0, 15)
      );
    }

    return messages;
  }

  /**
   * Extract conversation title
   */
  extractTitle() {
    // Try sidebar active conversation
    const activeConvo = document.querySelector('[class*="active"] [class*="truncate"], nav a[aria-current="page"]');
    if (activeConvo) {
      return activeConvo.textContent.trim();
    }

    // Try document title
    const docTitle = document.title.replace(' - Claude', '').replace('Claude', '').trim();
    if (docTitle) return docTitle;

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
      console.log('[Claude] Received message:', message.type);

      if (message.type === 'CAPTURE_CONTEXT') {
        console.log('[Claude] Handling CAPTURE_CONTEXT');
        const messages = this.extractMessages();
        console.log('[Claude] Extracted messages:', messages?.length);

        if (messages && messages.length > 0) {
          this.captureContext().then(() => {
            console.log('[Claude] Capture completed');
            sendResponse({ success: true });
          }).catch(err => {
            console.error('[Claude] Capture failed:', err);
            sendResponse({ success: false, error: err.message });
          });
        } else {
          console.warn('[Claude] No messages found');
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

// Initialize
const extractor = new ClaudeExtractor();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => extractor.init());
} else {
  extractor.init();
}
