# AI Context Bridge 🔄

**Privacy-first context sharing between AI assistants.**

A Chrome extension that lets you seamlessly share conversation context between ChatGPT, Claude, Gemini, and Perplexity — without any external servers or tracking.

## Why?

Power users often switch between AI assistants:
- Claude for deep reasoning
- ChatGPT for quick iterations
- Perplexity for research
- Gemini for Google integration

But every time you switch, you lose context and have to re-explain everything. AI Context Bridge solves this.

## Features

- **🔒 100% Local** - All data stays in your browser (IndexedDB). No servers, no tracking, no cloud sync.
- **📥 Capture Context** - Save any conversation with one click
- **📤 Send to Any AI** - Open ChatGPT, Claude, Gemini, or Perplexity with context pre-loaded
- **📋 Paste Context** - Manually paste saved context into any chat
- **💾 Export/Import** - Backup your contexts as JSON
- **🌙 Dark Mode** - Respects system preferences

## Supported Platforms

| Platform | Capture | Paste | Auto-inject |
|----------|---------|-------|-------------|
| ChatGPT  | ✅ | ✅ | ✅ |
| Claude   | ✅ | ✅ | ✅ |
| Gemini   | ✅ | ✅ | ✅ |
| Perplexity | ✅ | ✅ | ✅ |

## Installation

### From Source (Developer Mode)

1. Clone this repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/ai-context-bridge.git
   ```

2. Open Chrome and go to `chrome://extensions/`

3. Enable "Developer mode" (toggle in top right)

4. Click "Load unpacked" and select the `ai-context-bridge` folder

5. The extension icon should appear in your toolbar

### From Chrome Web Store

*Coming soon*

## Usage

### Capture Context

1. Have a conversation on any supported AI platform
2. Click the 🔄 floating button (bottom-right)
3. Select "📥 Capture Context"
4. Your conversation is now saved locally

### Get Second Opinion

1. While on any AI platform, click the 🔄 button
2. Select "Send to [Platform]" (e.g., "Send to Claude")
3. A new tab opens with your context ready to paste

### Manual Paste

1. Click the 🔄 button on any AI platform
2. Select "📋 Paste Context Here"
3. Your most recent saved context is pasted into the input

### Manage Contexts

Click the extension icon in your toolbar to:
- View all saved contexts
- Delete old contexts
- Export/import backups
- Open any AI platform directly

## Privacy & Security

**This extension is designed with privacy as the #1 priority:**

- ✅ **No external servers** - Everything runs locally in your browser
- ✅ **No analytics/tracking** - Zero telemetry, no Mixpanel, no nothing
- ✅ **No cloud sync** - Your data never leaves your device
- ✅ **Open source** - Audit the code yourself
- ✅ **Minimal permissions** - Only requests what's necessary

### Permissions Explained

- `storage` - Save contexts to browser's local storage
- `activeTab` - Read/inject into the current AI chat page
- `scripting` - Run content scripts on AI platforms
- `host_permissions` - Only for the 4 supported AI domains

## Development

### Project Structure

```
ai-context-bridge/
├── manifest.json          # Extension manifest (v3)
├── src/
│   ├── background/        # Service worker
│   ├── content-scripts/   # Platform-specific extractors
│   ├── storage/           # IndexedDB wrapper
│   └── utils/             # Shared utilities
├── popup/                 # Extension popup UI
├── styles/                # Shared CSS
└── icons/                 # Extension icons
```

### Building

No build step required! This is a vanilla JS extension.

### Testing Locally

1. Make changes to the code
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Test on any supported AI platform

### Adding a New Platform

1. Create a new file in `src/content-scripts/` (e.g., `newplatform.js`)
2. Implement the extractor class (see `chatgpt.js` for reference)
3. Add the domain to `manifest.json` under `host_permissions` and `content_scripts`
4. Update `PLATFORMS` in `service-worker.js` and `platforms.js`

## Roadmap

- [ ] Firefox support
- [ ] Safari support
- [ ] Keyboard shortcuts
- [ ] Context tagging/search
- [ ] Side-by-side comparison view
- [ ] MCP (Model Context Protocol) integration

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

Built in response to the growing need for AI tool interoperability. Inspired by the [Model Context Protocol](https://modelcontextprotocol.io/) and the vision of portable AI memory.

---

**Made with ❤️ for AI power users who want their context to follow them.**
