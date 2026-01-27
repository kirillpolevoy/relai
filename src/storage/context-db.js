/**
 * Relai - Local IndexedDB Storage
 *
 * Privacy-first: All data stays in browser, never sent to external servers.
 * Uses IndexedDB for persistent local storage of conversation contexts.
 */

const DB_NAME = 'ai-context-bridge';
const DB_VERSION = 1;
const STORE_NAME = 'contexts';

class ContextDB {
  constructor() {
    this.db = null;
  }

  async init() {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('source', 'source', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('title', 'title', { unique: false });
        }
      };
    });
  }

  /**
   * Save a conversation context
   * @param {Object} context - The context to save
   * @param {string} context.source - Source AI (chatgpt, claude, gemini, perplexity)
   * @param {string} context.title - Conversation title/summary
   * @param {Array} context.messages - Array of {role, content} messages
   * @param {string} context.url - Original URL
   */
  async saveContext(context) {
    await this.init();

    const record = {
      id: context.id || crypto.randomUUID(),
      source: context.source,
      title: context.title || 'Untitled Conversation',
      messages: context.messages,
      url: context.url,
      timestamp: Date.now(),
      metadata: context.metadata || {}
    };

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(record);

      request.onsuccess = () => resolve(record);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all saved contexts
   */
  async getAllContexts() {
    await this.init();

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = request.result.sort((a, b) => b.timestamp - a.timestamp);
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get a specific context by ID
   */
  async getContext(id) {
    await this.init();

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get the most recent context (for quick "second opinion")
   */
  async getLatestContext() {
    const all = await this.getAllContexts();
    return all[0] || null;
  }

  /**
   * Delete a context by ID
   */
  async deleteContext(id) {
    await this.init();

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear all contexts
   */
  async clearAll() {
    await this.init();

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Export all data (for user backup)
   */
  async exportAll() {
    const contexts = await this.getAllContexts();
    return {
      version: DB_VERSION,
      exportedAt: new Date().toISOString(),
      contexts
    };
  }

  /**
   * Import data from backup
   */
  async importData(data) {
    if (!data.contexts || !Array.isArray(data.contexts)) {
      throw new Error('Invalid import data format');
    }

    for (const context of data.contexts) {
      await this.saveContext(context);
    }

    return data.contexts.length;
  }
}

// Singleton instance
const contextDB = new ContextDB();
export default contextDB;
