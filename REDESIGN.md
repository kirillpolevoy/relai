# AI Context Bridge - Retro TE Redesign

## Design Philosophy

Inspired by **Teenage Engineering** products (OP-1, Pocket Operator), this redesign transforms the extension into a precision instrument that feels tactile and purposeful.

### Aesthetic Pillars

1. **Industrial Utilitarian** - Every element serves a function
2. **Retro Technical** - Monospace typography, technical labels, grid systems
3. **Refined Brutalism** - Bold borders, high contrast, no decoration
4. **Precision Hardware** - Feels like operating a physical device

### Color Palette

```
TE Black:     #1a1a1a (primary background)
TE Gray-900:  #2a2a2a (panels)
TE Gray-800:  #3a3a3a (hover states)
TE Gray-700:  #4a4a4a (borders)
TE Orange:    #ff6b35 (primary accent)
TE Green:     #06ffa5 (status indicators)
TE Red:       #e63946 (danger actions)
```

### Typography

- **Primary**: Space Mono (monospace, technical)
- **Display**: Space Mono Bold (headers, labels)
- **Style**: All-caps, generous letter-spacing, tabular numerals

### Key Changes

#### Copy Improvements (Copy Doctor Principles)

**Before** → **After**

- "Saved Contexts" → "MEMORY BANK"
- "Quick Actions" → "CONTROLS"
- "Open AI Chat" → "LAUNCH"
- "Local Only" → "LOCAL" with status dot
- "No saved contexts yet" → "NO CAPTURES"
- "Visit ChatGPT..." → "PRESS 🔄 ON AI PLATFORM"
- "All data stays in your browser..." → "NO SERVERS · NO TRACKING · 100% BROWSER"
- Platform names → 3-letter abbreviations (GPT, CLD, GEM, PRP)
- "just now" → "NOW"
- "5m ago" → "5M"

**Why?**
- Active, imperative language
- Remove qualifying words
- Every word earns its place
- Specific over vague
- Terse, technical precision

#### Visual Changes

1. **Header**
   - Model badge "CTX-1" (OP-1 inspired)
   - Pulsing green status dot
   - Bold orange border accent

2. **Memory Bank**
   - Counter display with zero-padding (00, 01, 02...)
   - Platform abbreviations instead of emoji
   - Condensed metadata (5M, 12 MSG)
   - Staggered fade-in animations

3. **Controls**
   - Large, tactile buttons with icons
   - Top border animation on hover
   - Deliberate press feedback

4. **Launch Grid**
   - 4x1 grid of square platform buttons
   - Subtle orange glow on hover
   - Abbreviations only (GPT, CLD, GEM, PRP)

5. **Modal**
   - Orange border for emphasis
   - Grid-based layout for send actions
   - Reduced visual noise

#### Interactions

- **Hover effects**: Border color changes, subtle backgrounds
- **Active states**: Physical press feedback (translateY)
- **Animations**: Staggered list items, pulsing status dot
- **Toast notifications**: High-contrast orange on black

### Icon Design

New extension icon features:
- Black background with orange border
- Dual nodes connected by data bridge
- Animated data flow indicators
- "CTX-1" model badge
- Subtle grid pattern background

### Technical Details

- No build step required
- Google Fonts: Space Mono
- CSS custom properties for theming
- Webkit scrollbar styling
- Animation-delay for stagger effects

### Files Modified

```
popup/popup.html  - Complete restructure
popup/popup.css   - Full retro styling (650 lines)
popup/popup.js    - Updated for new HTML structure
icons/icon*.png   - New TE-inspired icons
```

## Usage

1. Reload the extension in `chrome://extensions/`
2. Click the extension icon to see the new interface
3. Experience precision-crafted interactions

## Inspiration References

- Teenage Engineering OP-1 (synthesizer UI)
- Teenage Engineering Pocket Operators (minimalist displays)
- Retro hardware interfaces (Roland, Korg)
- Technical documentation aesthetics
- Industrial design language

---

**Result**: A Chrome extension that feels like operating a piece of precision hardware, not a disposable web app.
