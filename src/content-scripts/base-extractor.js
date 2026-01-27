/**
 * AI Context Bridge - Base Content Script Extractor
 *
 * Base class for extracting conversations from AI chat interfaces.
 * Each platform implements its own selectors and parsing logic.
 */

class BaseExtractor {
  constructor(platformId) {
    this.platformId = platformId;
    this.isInitialized = false;
    this.floatingButton = null;
  }

  /**
   * Initialize the extractor - called when content script loads
   */
  async init() {
    if (this.isInitialized) return;

    // Floating button disabled - using popup only
    // this.injectFloatingButton();
    this.setupMessageListener();
    this.observeConversation();

    this.isInitialized = true;
    console.log(`[AI Context Bridge] Initialized for ${this.platformId}`);
  }

  /**
   * Inject the floating action button
   */
  injectFloatingButton() {
    if (document.getElementById('acb-floating-btn')) return;

    const button = document.createElement('div');
    button.id = 'acb-floating-btn';
    button.className = 'acb-floating-btn';
    button.innerHTML = `
      <div class="acb-btn-icon">
        <span class="acb-icon-inner">CTX</span>
      </div>
      <div class="acb-btn-menu" id="acb-btn-menu">
        <div class="acb-menu-header">
          <span class="acb-menu-badge">CTX-1</span>
          <span class="acb-menu-title">CONTEXT BRIDGE</span>
        </div>

        <div class="acb-menu-section">
          <div class="acb-menu-label">ACTIONS</div>
          <button class="acb-menu-item acb-primary" data-action="capture">
            <span class="acb-item-icon">▼</span>
            <span>Save This Conversation</span>
          </button>
          <button class="acb-menu-item acb-primary" data-action="paste">
            <span class="acb-item-icon">▲</span>
            <span>Load Saved Conversation</span>
          </button>
        </div>

        <div class="acb-menu-divider"></div>

        <div class="acb-menu-section">
          <div class="acb-menu-label">TRANSFER TO</div>
          <button class="acb-menu-item" data-action="send-chatgpt" data-platform="chatgpt">
            <span class="acb-item-abbr">GPT</span>
            <span>ChatGPT</span>
          </button>
          <button class="acb-menu-item" data-action="send-claude" data-platform="claude">
            <span class="acb-item-abbr">CLD</span>
            <span>Claude</span>
          </button>
          <button class="acb-menu-item" data-action="send-gemini" data-platform="gemini">
            <span class="acb-item-abbr">GEM</span>
            <span>Gemini</span>
          </button>
          <button class="acb-menu-item" data-action="send-perplexity" data-platform="perplexity">
            <span class="acb-item-abbr">PRP</span>
            <span>Perplexity</span>
          </button>
        </div>
      </div>
    `;

    // Hide current platform option
    document.body.appendChild(button);

    // Hide current platform in menu
    const currentPlatformBtn = button.querySelector(`[data-platform="${this.platformId}"]`);
    if (currentPlatformBtn) {
      currentPlatformBtn.style.display = 'none';
    }

    // Event listeners
    button.querySelector('.acb-btn-icon').addEventListener('click', (e) => {
      e.stopPropagation();
      button.classList.toggle('acb-expanded');
    });

    button.querySelectorAll('.acb-menu-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = item.dataset.action;
        this.handleAction(action, item.dataset);
        button.classList.remove('acb-expanded');
      });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!button.contains(e.target)) {
        button.classList.remove('acb-expanded');
      }
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
      case 'send-chatgpt':
      case 'send-claude':
      case 'send-gemini':
      case 'send-perplexity':
        await this.sendToPlatform(data.platform);
        break;
    }
  }

  /**
   * Capture current conversation context
   */
  async captureContext() {
    try {
      const messages = this.extractMessages();
      if (messages.length === 0) {
        this.showNotification('No messages found to capture', 'warning');
        return;
      }

      const context = {
        source: this.platformId,
        messages: messages,
        url: window.location.href,
        title: this.extractTitle() || this.generateTitleFromMessages(messages)
      };

      // Send to background script to save
      const response = await this.sendMessageSafe({
        type: 'SAVE_CONTEXT',
        payload: context
      });

      if (response?.success) {
        this.showNotification(`Captured ${messages.length} messages`, 'success');
      } else {
        this.showNotification('Failed to save context', 'error');
      }
    } catch (error) {
      console.error('[AI Context Bridge] Capture error:', error);
      this.showNotification('Error capturing context', 'error');
    }
  }

  /**
   * Paste saved context into current chat
   */
  async pasteContext() {
    try {
      const response = await this.sendMessageSafe({
        type: 'GET_LATEST_CONTEXT'
      });

      if (!response?.context) {
        this.showNotification('No saved context found', 'warning');
        return;
      }

      const formattedText = this.formatContextForPaste(response.context);
      await this.injectIntoInput(formattedText);

      this.showNotification('Context pasted', 'success');
    } catch (error) {
      console.error('[AI Context Bridge] Paste error:', error);
      this.showNotification('Error pasting context', 'error');
    }
  }

  /**
   * Send context to another platform
   */
  async sendToPlatform(platformId) {
    try {
      // First capture current context
      const messages = this.extractMessages();
      if (messages.length === 0) {
        this.showNotification('No messages to send', 'warning');
        return;
      }

      const context = {
        source: this.platformId,
        messages: messages,
        url: window.location.href,
        title: this.extractTitle() || this.generateTitleFromMessages(messages)
      };

      // Save and open in new platform
      const response = await this.sendMessageSafe({
        type: 'SEND_TO_PLATFORM',
        payload: { context, targetPlatform: platformId }
      });

      if (response?.success) {
        this.showNotification(`Opening ${platformId}...`, 'success');
      }
    } catch (error) {
      console.error('[AI Context Bridge] Send error:', error);
      this.showNotification('Error sending to platform', 'error');
    }
  }

  /**
   * Format context for pasting
   */
  formatContextForPaste(context) {
    const header = `[Previous conversation from ${context.source}]\n\n`;

    const messages = context.messages.map(msg => {
      const role = msg.role === 'user' ? 'User' : 'Assistant';
      return `**${role}:** ${msg.content}`;
    }).join('\n\n---\n\n');

    const footer = `\n\n[End of previous context. Please continue helping with this topic.]`;

    return header + messages + footer;
  }

  /**
   * Generate title from messages
   */
  generateTitleFromMessages(messages) {
    const firstUserMsg = messages.find(m => m.role === 'user');
    if (!firstUserMsg) return 'Untitled';

    const text = firstUserMsg.content;
    return text.length > 50 ? text.substring(0, 50) + '...' : text;
  }

  /**
   * Show notification toast
   */
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

  /**
   * Safely send message to background script with error handling
   */
  async sendMessageSafe(message) {
    try {
      return await chrome.runtime.sendMessage(message);
    } catch (error) {
      // Extension context invalidated (extension was reloaded)
      if (error.message.includes('Extension context invalidated')) {
        this.showNotification('Extension was reloaded. Please refresh this page.', 'warning');
        console.warn('[AI Context Bridge] Extension context invalidated. Page refresh needed.');
        return null;
      }
      // Other errors
      console.error('[AI Context Bridge] Message send failed:', error);
      this.showNotification('Communication error. Try reloading the page.', 'error');
      return null;
    }
  }

  /**
   * Set up message listener for background script communication
   */
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
        return true; // Keep channel open for async response
      }

      if (message.type === 'GET_MESSAGES') {
        const messages = this.extractMessages();
        sendResponse({ messages });
        return true;
      }
    });
  }

  /**
   * Observe for conversation changes (to update UI, etc.)
   */
  observeConversation() {
    // Subclasses can override for platform-specific observation
  }

  // ============ ABSTRACT METHODS - Must be implemented by subclasses ============

  /**
   * Extract messages from the current conversation
   * @returns {Array} Array of {role: 'user'|'assistant', content: string}
   */
  extractMessages() {
    throw new Error('extractMessages() must be implemented by subclass');
  }

  /**
   * Extract conversation title
   * @returns {string|null}
   */
  extractTitle() {
    throw new Error('extractTitle() must be implemented by subclass');
  }

  /**
   * Inject text into the chat input
   * @param {string} text - Text to inject
   */
  async injectIntoInput(text) {
    throw new Error('injectIntoInput() must be implemented by subclass');
  }
}

// Export for use in platform-specific scripts
window.BaseExtractor = BaseExtractor;
