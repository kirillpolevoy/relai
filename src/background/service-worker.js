/**
 * AI Context Bridge - Background Service Worker
 *
 * Handles message passing, storage management, and tab operations.
 * All data stays local - no external API calls.
 */

const PLATFORMS = {
  chatgpt: {
    id: 'chatgpt',
    name: 'ChatGPT',
    newChatUrl: 'https://chatgpt.com/'
  },
  claude: {
    id: 'claude',
    name: 'Claude',
    newChatUrl: 'https://claude.ai/new'
  },
  gemini: {
    id: 'gemini',
    name: 'Gemini',
    newChatUrl: 'https://gemini.google.com/app'
  },
  perplexity: {
    id: 'perplexity',
    name: 'Perplexity',
    newChatUrl: 'https://www.perplexity.ai/'
  }
};

// In-memory storage for quick access (backed by chrome.storage.local)
let contextCache = [];
let pendingContext = null; // Context waiting to be pasted in target platform

/**
 * Initialize storage on startup
 */
async function initStorage() {
  const data = await chrome.storage.local.get(['contexts']);
  contextCache = data.contexts || [];
  console.log('[AI Context Bridge] Loaded', contextCache.length, 'contexts from storage');
}

/**
 * Save context to storage
 */
async function saveContext(context) {
  const record = {
    id: context.id || crypto.randomUUID(),
    source: context.source,
    title: context.title || 'Untitled',
    messages: context.messages,
    url: context.url,
    timestamp: Date.now()
  };

  // Add to cache (most recent first)
  contextCache.unshift(record);

  // Keep only last 50 contexts
  if (contextCache.length > 50) {
    contextCache = contextCache.slice(0, 50);
  }

  // Persist to chrome.storage.local
  await chrome.storage.local.set({ contexts: contextCache });

  return record;
}

/**
 * Get all contexts
 */
function getAllContexts() {
  return contextCache;
}

/**
 * Get latest context
 */
function getLatestContext() {
  return contextCache[0] || null;
}

/**
 * Delete a context
 */
async function deleteContext(id) {
  contextCache = contextCache.filter(c => c.id !== id);
  await chrome.storage.local.set({ contexts: contextCache });
}

/**
 * Clear all contexts
 */
async function clearAllContexts() {
  contextCache = [];
  await chrome.storage.local.set({ contexts: [] });
}

/**
 * Format context for pasting
 */
function formatContextForPaste(context) {
  const lines = [`[Previous conversation from ${context.source}]\n`];

  for (const msg of context.messages) {
    const role = msg.role === 'user' ? 'User' : 'Assistant';
    lines.push(`**${role}:** ${msg.content}\n`);
  }

  lines.push(`\n[End of context. Please continue helping with this topic.]`);
  return lines.join('\n');
}

/**
 * Open target platform and set pending context
 */
async function sendToPlatform(context, targetPlatform) {
  const platform = PLATFORMS[targetPlatform];
  if (!platform) {
    throw new Error(`Unknown platform: ${targetPlatform}`);
  }

  // Save context first
  await saveContext(context);

  // Set as pending for the target platform
  pendingContext = {
    context,
    targetPlatform,
    timestamp: Date.now()
  };

  // Store pending context
  await chrome.storage.local.set({ pendingContext });

  // Open new tab with target platform
  await chrome.tabs.create({ url: platform.newChatUrl });

  return { success: true };
}

/**
 * Get pending context for a specific platform
 */
async function getPendingContext(platform) {
  const data = await chrome.storage.local.get(['pendingContext']);
  const pending = data.pendingContext;

  if (!pending || pending.targetPlatform !== platform) {
    return null;
  }

  // Clear pending context after retrieval (one-time use)
  await chrome.storage.local.remove(['pendingContext']);
  pendingContext = null;

  return pending.context;
}

/**
 * Message handler
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { type, payload } = message;

  switch (type) {
    case 'SAVE_CONTEXT':
      saveContext(payload)
        .then(record => sendResponse({ success: true, context: record }))
        .catch(err => sendResponse({ success: false, error: err.message }));
      return true;

    case 'GET_ALL_CONTEXTS':
      sendResponse({ contexts: getAllContexts() });
      return true;

    case 'GET_LATEST_CONTEXT':
      sendResponse({ context: getLatestContext() });
      return true;

    case 'DELETE_CONTEXT':
      deleteContext(payload.id)
        .then(() => sendResponse({ success: true }))
        .catch(err => sendResponse({ success: false, error: err.message }));
      return true;

    case 'CLEAR_ALL':
      clearAllContexts()
        .then(() => sendResponse({ success: true }))
        .catch(err => sendResponse({ success: false, error: err.message }));
      return true;

    case 'SEND_TO_PLATFORM':
      sendToPlatform(payload.context, payload.targetPlatform)
        .then(result => sendResponse(result))
        .catch(err => sendResponse({ success: false, error: err.message }));
      return true;

    case 'GET_PENDING_CONTEXT':
      getPendingContext(payload.platform)
        .then(context => sendResponse({ context }))
        .catch(err => sendResponse({ context: null, error: err.message }));
      return true;

    case 'EXPORT_ALL':
      const exportData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        contexts: getAllContexts()
      };
      sendResponse({ data: exportData });
      return true;

    case 'IMPORT_DATA':
      (async () => {
        try {
          const imported = payload.data;
          if (!imported.contexts || !Array.isArray(imported.contexts)) {
            throw new Error('Invalid import format');
          }
          for (const ctx of imported.contexts) {
            await saveContext(ctx);
          }
          sendResponse({ success: true, count: imported.contexts.length });
        } catch (err) {
          sendResponse({ success: false, error: err.message });
        }
      })();
      return true;

    default:
      sendResponse({ error: 'Unknown message type' });
      return true;
  }
});

// Initialize on install/startup
chrome.runtime.onInstalled.addListener(() => {
  initStorage();
  console.log('[AI Context Bridge] Extension installed');
});

chrome.runtime.onStartup.addListener(() => {
  initStorage();
});

// Also init immediately
initStorage();
