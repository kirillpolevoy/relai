# Relai Screenshots for Chrome Web Store

This directory contains promotional screenshots optimized for Chrome Web Store submission.

## Screenshots

1. **01-hero.html** - Transfer Conversations in 3 Steps
2. **02-privacy.html** - 100% Local, No Servers
3. **03-platforms.html** - Works With All Major AIs
4. **04-autopaste.html** - Context Auto-Pastes—Press Enter
5. **05-saved.html** - Access Conversations Anytime

## How to Generate Screenshots

### Method 1: Using Browser (Recommended)

1. Open each HTML file in Chrome:
   ```bash
   open screenshots/01-hero.html
   open screenshots/02-privacy.html
   open screenshots/03-platforms.html
   open screenshots/04-autopaste.html
   open screenshots/05-saved.html
   ```

2. For each file:
   - Press `Cmd+Option+I` (Mac) or `F12` (Windows) to open DevTools
   - Press `Cmd+Shift+M` (Mac) or `Ctrl+Shift+M` (Windows) for responsive mode
   - Set dimensions to **1280 x 800**
   - Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows)
   - Type "screenshot" and select "Capture screenshot"
   - Save as `01-hero.png`, `02-privacy.png`, etc.

### Method 2: Using Playwright (Automated)

If you have Node.js installed:

```bash
# Install Playwright
npm init -y
npm install -D playwright

# Create screenshot script
cat > take-screenshots.js << 'EOF'
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.setViewportSize({ width: 1280, height: 800 });

  const files = [
    '01-hero',
    '02-privacy',
    '03-platforms',
    '04-autopaste',
    '05-saved'
  ];

  for (const file of files) {
    console.log(`Capturing ${file}...`);
    await page.goto(`file://${__dirname}/${file}.html`);
    await page.waitForTimeout(2000); // Let animations play
    await page.screenshot({ path: `${file}.png` });
  }

  await browser.close();
  console.log('Done!');
})();
EOF

# Run it
node take-screenshots.js
```

## Chrome Web Store Requirements

- **Dimensions**: 1280x800px (16:10 aspect ratio) ✓
- **Format**: PNG or JPEG
- **File size**: Under 5MB each
- **Count**: Minimum 1, recommended 5 ✓

## Design Features

All screenshots use the WALL-E aesthetic:

- **Colors**: Warm amber (#ffa41b), orange (#ff7b00), brown-black (#1a1612)
- **Typography**: Space Grotesk (display), JetBrains Mono (code)
- **Effects**: Glowing accents, ambient animations, grain texture
- **Style**: Retro-futuristic with warm, nostalgic tones

## Tips for Best Results

1. **Let animations play**: Wait 2-3 seconds after loading before capturing
2. **High DPI**: Capture on Retina/4K display if possible for sharpness
3. **Consistent lighting**: All screenshots use same ambient glow treatment
4. **Text readability**: All text meets WCAG contrast requirements

## Usage in Store Listing

Upload these screenshots in order to Chrome Web Store Developer Console:

1. Hero (01) - Shows the complete workflow
2. Privacy (02) - Emphasizes data privacy
3. Platforms (03) - Shows platform support
4. Auto-paste (04) - Demonstrates key feature
5. Saved (05) - Shows conversation management

Each screenshot tells part of the story and can stand alone if users only view 1-2 images.
