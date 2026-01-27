# Relai 🔄

**Share AI conversations locally. No servers, no tracking, 100% private.**

A Chrome extension that lets you seamlessly share conversation context between ChatGPT, Claude, Gemini, and Perplexity — without any external servers or tracking.

![Relai Extension](icons/icon128.png)

## Why Relai?

Power users often switch between AI assistants:
- Claude for deep reasoning
- ChatGPT for quick iterations
- Perplexity for research
- Gemini for Google integration

But every time you switch, you lose context and have to re-explain everything. **Relai solves this.**

## Features

- **🔒 100% Local** - All data stays in your browser. No servers, no tracking, no cloud sync.
- **📥 Capture Conversations** - Save any conversation with one click
- **🔄 Send to Any AI** - Transfer context to ChatGPT, Claude, Gemini, or Perplexity
- **💾 Export/Import** - Backup your contexts as JSON
- **🎨 Retro-Futuristic UI** - WALL-E inspired design with warm amber tones

## Supported Platforms

| Platform | Capture | Send To | Status |
|----------|---------|---------|--------|
| ChatGPT  | ✅ | ✅ | Fully supported |
| Claude   | ✅ | ✅ | Fully supported |
| Gemini   | ✅ | ✅ | Fully supported |
| Perplexity | ✅ | ✅ | Fully supported |

## Installation

### From Source (Developer Mode)

1. Clone this repository:
   ```bash
   git clone https://github.com/kirillpolevoy/ai-context-bridge.git
   cd ai-context-bridge
   ```

2. Open Chrome and go to `chrome://extensions/`

3. Enable "Developer mode" (toggle in top right)

4. Click "Load unpacked" and select the project folder

5. The Relai icon should appear in your toolbar

### From Chrome Web Store

*Coming soon*

## Usage

### Quick Start

1. **Capture** - Open any AI chat (ChatGPT, Claude, etc.) and click the Relai extension icon
2. Click **"Capture from this tab"** to save the conversation
3. **Send** - Click on a saved context, then click **"Send to [Platform]"** to transfer it

### Detailed Workflow

#### ① Capture a Conversation

1. Have a conversation on any supported AI platform
2. Click the Relai extension icon in your toolbar
3. Click the **"Capture from this tab"** button
4. Your conversation is saved locally

#### ② View Saved Contexts

1. Click the Relai icon to open the popup
2. See all your saved conversations in the **"SAVED"** section
3. Click any context to view details

#### ③ Send to Another AI

1. Open a saved context by clicking it
2. Click one of the **"Send to"** buttons (ChatGPT, Claude, Gemini, Perplexity)
3. A new tab opens with the context auto-pasted
4. Press Enter to send

### Manage Your Data

Open the Relai popup to:
- **Export** - Download all contexts as JSON backup
- **Import** - Restore from a previous backup
- **Clear All** - Delete all saved contexts

## Privacy & Security

**Relai is designed with privacy as the #1 priority:**

- ✅ **No external servers** - Everything runs locally in your browser
- ✅ **No analytics/tracking** - Zero telemetry, no collection, period
- ✅ **No cloud sync** - Your data never leaves your device
- ✅ **Open source** - Audit the code yourself
- ✅ **Minimal permissions** - Only requests what's necessary

### Permissions Explained

- `storage` - Save contexts to browser's local storage (IndexedDB)
- `activeTab` - Read/inject content on the current AI chat page
- `scripting` - Run content scripts on AI platforms
- `host_permissions` - Only for the 4 supported AI domains:
  - `https://chat.openai.com/*` and `https://chatgpt.com/*`
  - `https://claude.ai/*`
  - `https://gemini.google.com/*`
  - `https://www.perplexity.ai/*`

## Development

### Project Structure

```
ai-context-bridge/
├── manifest.json          # Extension manifest (v3)
├── src/
│   ├── background/        # Service worker
│   │   └── service-worker.js
│   └── content-scripts/   # Platform-specific extractors
│       ├── chatgpt.js
│       ├── claude.js
│       ├── gemini.js
│       └── perplexity.js
├── popup/                 # Extension popup UI
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── styles/                # Shared styles
│   └── overlay.css
└── icons/                 # Extension icons
```

### Building

No build step required! This is a vanilla JavaScript extension.

### Testing Locally

1. Make changes to the code
2. Go to `chrome://extensions/`
3. Click the refresh icon (🔄) on the Relai extension card
4. Hard refresh any open AI platform tabs (Cmd+Shift+R / Ctrl+Shift+R)
5. Test the changes

### Adding a New Platform

1. Create a new file in `src/content-scripts/` (e.g., `newplatform.js`)
2. Implement the extractor class with these methods:
   - `extractMessages()` - Extract conversation messages
   - `extractTitle()` - Get conversation title
   - `injectIntoInput()` - Paste text into input field
   - `checkForPendingContext()` - Check for context to auto-paste
3. Add the domain to `manifest.json`:
   - Add to `host_permissions` array
   - Add to `content_scripts` array
4. Update `PLATFORMS` object in `src/background/service-worker.js`

## Technical Details

### How It Works

1. **Content Scripts** run on each AI platform page
2. **Extract** conversation messages by querying the DOM
3. **Store** contexts in IndexedDB (browser's local database)
4. **Background Service Worker** manages storage and tab operations
5. **Auto-inject** when "Send to" flow opens a new platform tab

### Data Format

Contexts are stored as:

```javascript
{
  id: "uuid",
  source: "chatgpt" | "claude" | "gemini" | "perplexity",
  title: "Conversation title",
  messages: [
    { role: "user", content: "..." },
    { role: "assistant", content: "..." }
  ],
  url: "https://...",
  timestamp: 1234567890
}
```

## Recent Improvements

- ✅ **Multi-strategy title extraction** - Captures accurate conversation titles from all platforms
- ✅ **Improved context formatting** - Better prompts when transferring between AIs
- ✅ **Fixed duplicate extraction** - Messages no longer captured multiple times
- ✅ **Claude message extraction** - Now captures both user and assistant messages correctly

## Roadmap

- [ ] Firefox support
- [ ] Safari support
- [ ] Context search/filtering
- [ ] Keyboard shortcuts (Ctrl+Shift+C to capture)
- [ ] Side-by-side comparison view
- [ ] Tags and organization
- [ ] MCP (Model Context Protocol) integration

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit with descriptive messages
5. Push to your fork
6. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

Built for AI power users who want their context to follow them across platforms. Inspired by the [Model Context Protocol](https://modelcontextprotocol.io/) and the vision of portable AI memory.

Special thanks to the open source community and everyone who provided feedback during development.

---

**Made with ❤️ for AI power users**

*"Your conversations, your control"*
