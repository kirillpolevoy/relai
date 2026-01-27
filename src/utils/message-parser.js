/**
 * Relai - Message Parser Utilities
 *
 * Common utilities for parsing and formatting conversation messages
 * across different AI platforms.
 */

/**
 * Normalize messages to a common format
 * @param {Array} messages - Raw messages from any source
 * @returns {Array} Normalized messages with {role, content, timestamp}
 */
export function normalizeMessages(messages) {
  return messages.map(msg => ({
    role: normalizeRole(msg.role),
    content: msg.content || msg.text || '',
    timestamp: msg.timestamp || Date.now()
  }));
}

/**
 * Normalize role names across platforms
 */
export function normalizeRole(role) {
  const roleMap = {
    // ChatGPT
    'user': 'user',
    'assistant': 'assistant',
    'system': 'system',
    // Claude
    'human': 'user',
    'Human': 'user',
    'Assistant': 'assistant',
    // Gemini
    'model': 'assistant',
    // Generic
    'ai': 'assistant',
    'bot': 'assistant'
  };

  return roleMap[role] || role;
}

/**
 * Format messages for display
 */
export function formatMessagesForDisplay(messages, maxLength = 100) {
  return messages.map(msg => ({
    ...msg,
    preview: msg.content.length > maxLength
      ? msg.content.substring(0, maxLength) + '...'
      : msg.content
  }));
}

/**
 * Format messages for injection into another AI
 */
export function formatMessagesForInjection(messages, targetPlatform) {
  const header = `[Context from previous conversation]\n\n`;

  const formatted = messages.map(msg => {
    const roleLabel = msg.role === 'user' ? 'User' : 'Assistant';
    return `${roleLabel}: ${msg.content}`;
  }).join('\n\n');

  const footer = `\n\n[End of context. Please continue this conversation.]`;

  return header + formatted + footer;
}

/**
 * Generate a title from conversation content
 */
export function generateTitle(messages) {
  // Find first user message
  const firstUserMsg = messages.find(m => m.role === 'user');
  if (!firstUserMsg) return 'Untitled Conversation';

  const content = firstUserMsg.content;

  // Take first line or first 50 chars
  const firstLine = content.split('\n')[0];
  if (firstLine.length <= 50) return firstLine;

  return firstLine.substring(0, 50) + '...';
}

/**
 * Calculate conversation statistics
 */
export function getConversationStats(messages) {
  const userMessages = messages.filter(m => m.role === 'user');
  const assistantMessages = messages.filter(m => m.role === 'assistant');

  const totalChars = messages.reduce((sum, m) => sum + m.content.length, 0);
  const avgLength = messages.length > 0 ? Math.round(totalChars / messages.length) : 0;

  return {
    totalMessages: messages.length,
    userMessages: userMessages.length,
    assistantMessages: assistantMessages.length,
    totalCharacters: totalChars,
    averageMessageLength: avgLength
  };
}

/**
 * Truncate conversation to fit token limits (rough estimate)
 * Assumes ~4 chars per token
 */
export function truncateToTokenLimit(messages, maxTokens = 8000) {
  const charsPerToken = 4;
  const maxChars = maxTokens * charsPerToken;

  let totalChars = 0;
  const result = [];

  // Keep messages from the end (most recent)
  for (let i = messages.length - 1; i >= 0; i--) {
    const msgChars = messages[i].content.length;
    if (totalChars + msgChars > maxChars) break;
    totalChars += msgChars;
    result.unshift(messages[i]);
  }

  return result;
}
