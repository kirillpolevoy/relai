# Relai - WALL-E Inspired Design

## Design Philosophy

Inspired by **WALL-E** - the resourceful robot collecting memories in a forgotten world. Relai is your companion for preserving and transferring conversations between AI platforms, with warm retro-futuristic aesthetics that feel nostalgic yet purposeful.

### Aesthetic Pillars

1. **Warm Retro-Futurism** - Amber and orange tones evoke old CRT monitors
2. **Utilitarian Purpose** - Every element supports the core workflow
3. **Organic Technical** - Soft rounded edges meet precise functionality
4. **Memory Preservation** - Design communicates saving and organizing

### Color Palette

```
WALL-E Dark Palette:
  --walle-black:       #1a1612  (deep brown-black, primary background)
  --walle-gray-900:    #2d2820  (warm dark panels)
  --walle-gray-800:    #3d3528  (hover states)
  --walle-gray-700:    #4d4538  (borders)
  --walle-brown:       #8b7355  (secondary text)

WALL-E Warm Accents:
  --walle-yellow:      #ffa41b  (primary accent, glowing warmth)
  --walle-orange:      #ff7b00  (hover states, active elements)
  --walle-amber:       #d4a574  (metadata, timestamps)
  --walle-cream:       #f5f1e8  (primary text)
  --walle-rust:        #c97d46  (secondary actions)
```

### Typography

- **Primary**: -apple-system, SF Pro Display (clean, readable)
- **Headers**: Bold weight with generous letter-spacing
- **Body**: Regular weight, warm cream color
- **Style**: Clean hierarchy, ample whitespace, readable at small sizes

### Key Changes

#### Copy Improvements (Copy Doctor Principles)

**Before** → **After**

- "AI Context Bridge" → "RELAI"
- "Saved Contexts" → "SAVED" (numbered workflow section)
- "Quick Actions" → "CAPTURE" (workflow step ①)
- "Send to" → "SEND TO" (workflow step ③)
- "Local Only" → "LOCAL" with status indicator
- "No saved contexts yet" → "No conversations captured yet. Click ① above to save your first one."
- Platform names shown in full (ChatGPT, Claude, Gemini, Perplexity)
- Remove CTX-1 badge (was too technical)
- "just now" → relative timestamps (5m ago, 2h ago)

**Why?**
- Workflow-oriented (numbered steps ①②③)
- Full platform names for clarity
- Conversational empty states
- Warm, approachable language
- Clear user journey

#### Visual Changes

1. **Header**
   - Large "RELAI" title with glow effect
   - Pulsing amber status dot labeled "LOCAL"
   - Subtitle: "NO SERVERS · NO TRACKING · 100% LOCAL"
   - Warm gradient shadow effect

2. **Workflow Sections**
   - ① CAPTURE - Single large button to capture current tab
   - ② SAVED - List of saved conversations with metadata
   - ③ SEND TO - Grid of platform buttons for transfer
   - Numbered circles with amber glow effect

3. **Conversation Cards**
   - Rounded corners (8px)
   - Soft hover glow (warm orange)
   - Platform name, timestamp, message count
   - Title truncation with ellipsis
   - Staggered fade-in animations

4. **Platform Buttons**
   - 2x2 grid layout
   - Full platform names (not abbreviations)
   - Rounded corners (8px)
   - Warm glow on hover
   - Platform-specific colors (ChatGPT green, Claude orange, etc.)

5. **Context Detail Modal**
   - Warm border glow
   - Full message preview
   - Grid of "Send to" buttons
   - Export/delete actions
   - Smooth transitions

#### Interactions

- **Hover effects**: Warm amber/orange glows, subtle scale transforms
- **Active states**: Gentle press feedback with scale transforms
- **Animations**: Fade-ins, pulsing status dot, smooth transitions
- **Toast notifications**: Warm amber/orange on dark background
- **Loading states**: Gentle opacity animations

### Icon Design

Current icon features:
- Glowing neon circuit board aesthetic
- Warm amber/orange tones
- High contrast for toolbar visibility
- Matches the warm retro-futuristic theme

### Technical Details

- No build step required
- System fonts (SF Pro on macOS)
- CSS custom properties for theming
- Smooth animations with cubic-bezier easing
- Responsive grid layouts
- Webkit scrollbar styling

### Files Structure

```
popup/
  popup.html  - Numbered workflow sections (①②③)
  popup.css   - WALL-E color palette and warm styling
  popup.js    - Full platform names, improved UX

icons/
  icon16.png   - Toolbar icon
  icon48.png   - Extension page icon
  icon128.png  - Web store icon
  icon-source.png - Original high-res source
```

## Current Features

1. **Capture Workflow** - Save conversations from any supported platform
2. **View Saved** - Browse all captured conversations with metadata
3. **Send To Platform** - Transfer context to any AI platform with auto-paste
4. **Export/Import** - Backup and restore your conversation history
5. **Multi-strategy Extraction** - Reliable message capture across platforms
6. **Title Extraction** - Accurate conversation titles from all platforms

## Usage

1. Open any AI chat (ChatGPT, Claude, Gemini, Perplexity)
2. Click the Relai extension icon
3. Click **"Capture from this tab"** (workflow step ①)
4. View saved conversations (workflow step ②)
5. Click a conversation, then choose platform to send to (workflow step ③)
6. Context auto-pastes into the new platform

## Design Inspiration

- WALL-E (warm retro-futuristic aesthetic, memory preservation theme)
- Retro CRT monitors (amber glow, warm tones)
- Vintage computing interfaces (tactile, purposeful)
- Memory box aesthetic (preserving precious conversations)

---

**Result**: A Chrome extension that feels like a warm, trustworthy companion for preserving and sharing your AI conversations - not a cold, technical tool.
