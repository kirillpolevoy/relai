/**
 * AI Context Bridge - Popup Script
 *
 * Manages the popup UI for viewing and managing saved contexts.
 */

const PLATFORM_ABBR = {
  chatgpt: 'GPT',
  claude: 'CLD',
  gemini: 'GEM',
  perplexity: 'PRP'
};

const PLATFORM_NAMES = {
  chatgpt: 'ChatGPT',
  claude: 'Claude',
  gemini: 'Gemini',
  perplexity: 'Perplexity'
};

let currentContextId = null;

/**
 * Initialize popup
 */
async function init() {
  await loadContexts();
  setupEventListeners();
}

/**
 * Load and display saved contexts
 */
async function loadContexts() {
  const response = await chrome.runtime.sendMessage({ type: 'GET_ALL_CONTEXTS' });
  const contexts = response.contexts || [];

  const listEl = document.getElementById('contexts-list');
  const counterEl = document.getElementById('context-count');

  // Update counter
  counterEl.textContent = String(contexts.length).padStart(2, '0');

  if (contexts.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">◯</div>
        <p class="empty-title">NO CAPTURES</p>
        <p class="empty-hint">PRESS 🔄 ON AI PLATFORM</p>
      </div>
    `;
    return;
  }

  listEl.innerHTML = contexts.map(ctx => `
    <div class="context-item" data-id="${ctx.id}">
      <span class="context-platform">${PLATFORM_ABBR[ctx.source] || 'UNK'}</span>
      <div class="context-info">
        <div class="context-title">${escapeHtml(ctx.title || 'UNTITLED')}</div>
        <div class="context-meta">
          <span>${formatTime(ctx.timestamp)}</span>
          <span>${ctx.messages?.length || 0} MSG</span>
        </div>
      </div>
      <span class="context-arrow">›</span>
    </div>
  `).join('');

  // Add click handlers
  listEl.querySelectorAll('.context-item').forEach(item => {
    item.addEventListener('click', () => openContextModal(item.dataset.id));
  });
}

/**
 * Open context detail modal
 */
async function openContextModal(contextId) {
  const response = await chrome.runtime.sendMessage({ type: 'GET_ALL_CONTEXTS' });
  const context = response.contexts.find(c => c.id === contextId);

  if (!context) return;

  currentContextId = contextId;

  const modal = document.getElementById('modal');
  const titleEl = document.getElementById('modal-title');
  const bodyEl = document.getElementById('modal-body');

  titleEl.textContent = context.title || 'Untitled';

  bodyEl.innerHTML = context.messages.map(msg => `
    <div class="modal-message">
      <div class="modal-message-role">${msg.role === 'user' ? 'USER' : 'ASSISTANT'}</div>
      <div class="modal-message-content">${escapeHtml(truncate(msg.content, 500))}</div>
    </div>
  `).join('');

  modal.classList.remove('hidden');
}

/**
 * Close modal
 */
function closeModal() {
  document.getElementById('modal').classList.add('hidden');
  currentContextId = null;
}

/**
 * Send context to platform
 */
async function sendToPlatform(platform) {
  if (!currentContextId) return;

  const response = await chrome.runtime.sendMessage({ type: 'GET_ALL_CONTEXTS' });
  const context = response.contexts.find(c => c.id === currentContextId);

  if (!context) return;

  await chrome.runtime.sendMessage({
    type: 'SEND_TO_PLATFORM',
    payload: { context, targetPlatform: platform }
  });

  closeModal();
  window.close();
}

/**
 * Copy context to clipboard
 */
async function copyContext() {
  if (!currentContextId) return;

  const response = await chrome.runtime.sendMessage({ type: 'GET_ALL_CONTEXTS' });
  const context = response.contexts.find(c => c.id === currentContextId);

  if (!context) return;

  const text = formatContextForCopy(context);
  await navigator.clipboard.writeText(text);
  showToast('Copied to clipboard');
}

/**
 * Delete context
 */
async function deleteContext() {
  if (!currentContextId) return;

  await chrome.runtime.sendMessage({
    type: 'DELETE_CONTEXT',
    payload: { id: currentContextId }
  });

  closeModal();
  await loadContexts();
  showToast('Context deleted');
}

/**
 * Export all contexts
 */
async function exportAll() {
  const response = await chrome.runtime.sendMessage({ type: 'EXPORT_ALL' });
  const data = response.data;

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `ai-context-bridge-export-${new Date().toISOString().split('T')[0]}.json`;
  a.click();

  URL.revokeObjectURL(url);
  showToast('Exported successfully');
}

/**
 * Import contexts from file
 */
async function importData(file) {
  try {
    const text = await file.text();
    const data = JSON.parse(text);

    const response = await chrome.runtime.sendMessage({
      type: 'IMPORT_DATA',
      payload: { data }
    });

    if (response.success) {
      await loadContexts();
      showToast(`Imported ${response.count} contexts`);
    } else {
      showToast('Import failed: ' + response.error);
    }
  } catch (err) {
    showToast('Invalid file format');
  }
}

/**
 * Clear all contexts
 */
async function clearAll() {
  if (!confirm('Are you sure you want to delete all saved contexts?')) return;

  await chrome.runtime.sendMessage({ type: 'CLEAR_ALL' });
  await loadContexts();
  showToast('All contexts cleared');
}

/**
 * Capture context from current tab
 */
async function captureFromCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  try {
    await chrome.tabs.sendMessage(tab.id, { type: 'CAPTURE_CONTEXT' });
    showToast('Captured!');
    setTimeout(() => loadContexts(), 500);
  } catch (error) {
    showToast('Open an AI chat first');
  }
}

/**
 * Paste context to current tab
 */
async function pasteToCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  try {
    await chrome.tabs.sendMessage(tab.id, { type: 'PASTE_CONTEXT' });
    showToast('Pasted!');
  } catch (error) {
    showToast('Open an AI chat first');
  }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Modal close
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal').addEventListener('click', (e) => {
    if (e.target.id === 'modal') closeModal();
  });

  // Modal actions
  document.getElementById('modal-send-chatgpt').addEventListener('click', () => sendToPlatform('chatgpt'));
  document.getElementById('modal-send-claude').addEventListener('click', () => sendToPlatform('claude'));
  document.getElementById('modal-send-gemini').addEventListener('click', () => sendToPlatform('gemini'));
  document.getElementById('modal-send-perplexity').addEventListener('click', () => sendToPlatform('perplexity'));
  document.getElementById('modal-copy').addEventListener('click', copyContext);
  document.getElementById('modal-delete').addEventListener('click', deleteContext);

  // Capture/Paste from current tab
  document.getElementById('btn-capture').addEventListener('click', captureFromCurrentTab);
  document.getElementById('btn-paste').addEventListener('click', pasteToCurrentTab);

  // Data actions
  document.getElementById('btn-export').addEventListener('click', exportAll);
  document.getElementById('btn-clear').addEventListener('click', clearAll);

  // Import
  document.getElementById('btn-import').addEventListener('click', () => {
    document.getElementById('import-file').click();
  });
  document.getElementById('import-file').addEventListener('change', (e) => {
    if (e.target.files[0]) {
      importData(e.target.files[0]);
      e.target.value = '';
    }
  });
}

/**
 * Format context for clipboard
 */
function formatContextForCopy(context) {
  const lines = [`[Context from ${context.source}]\n`];

  for (const msg of context.messages) {
    const role = msg.role === 'user' ? 'User' : 'Assistant';
    lines.push(`**${role}:** ${msg.content}\n`);
  }

  return lines.join('\n');
}

/**
 * Show toast notification
 */
function showToast(message) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.remove(), 2500);
}

/**
 * Utility: Escape HTML
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Utility: Truncate text
 */
function truncate(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Utility: Format timestamp
 */
function formatTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;

  if (diff < 60000) return 'NOW';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}M`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}H`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}D`;

  return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }).replace('/', '/');
}

// Initialize on load
document.addEventListener('DOMContentLoaded', init);
