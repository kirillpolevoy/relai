/**
 * Relai - Platform Definitions
 *
 * Configuration and metadata for supported AI platforms.
 */

export const PLATFORMS = {
  chatgpt: {
    id: 'chatgpt',
    name: 'ChatGPT',
    icon: '🤖',
    color: '#10a37f',
    domains: ['chat.openai.com', 'chatgpt.com'],
    newChatUrl: 'https://chatgpt.com/',
    description: 'OpenAI ChatGPT'
  },
  claude: {
    id: 'claude',
    name: 'Claude',
    icon: '🟠',
    color: '#d97706',
    domains: ['claude.ai'],
    newChatUrl: 'https://claude.ai/new',
    description: 'Anthropic Claude'
  },
  gemini: {
    id: 'gemini',
    name: 'Gemini',
    icon: '💎',
    color: '#4285f4',
    domains: ['gemini.google.com'],
    newChatUrl: 'https://gemini.google.com/app',
    description: 'Google Gemini'
  },
  perplexity: {
    id: 'perplexity',
    name: 'Perplexity',
    icon: '🔍',
    color: '#20b2aa',
    domains: ['www.perplexity.ai', 'perplexity.ai'],
    newChatUrl: 'https://www.perplexity.ai/',
    description: 'Perplexity AI'
  }
};

/**
 * Detect current platform from URL
 */
export function detectPlatform(url) {
  const hostname = new URL(url).hostname;

  for (const [id, platform] of Object.entries(PLATFORMS)) {
    if (platform.domains.some(domain => hostname.includes(domain))) {
      return platform;
    }
  }

  return null;
}

/**
 * Get other platforms (for "send to" options)
 */
export function getOtherPlatforms(currentPlatformId) {
  return Object.values(PLATFORMS).filter(p => p.id !== currentPlatformId);
}

/**
 * Get platform by ID
 */
export function getPlatform(id) {
  return PLATFORMS[id] || null;
}
