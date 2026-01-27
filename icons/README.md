# Relai Icons

This directory contains the Relai extension icons featuring a glowing neon circuit board design.

## Files

- `icon-source.png` - Original high-resolution source image
- `icon16.png` - 16x16 (browser toolbar)
- `icon48.png` - 48x48 (extensions page)
- `icon128.png` - 128x128 (Chrome Web Store listing)

## Generating Icon Sizes

If you need to update the icon, place a new source image and resize using `sips` (macOS):

```bash
# From the icons/ directory
sips -z 128 128 icon-source.png --out icon128.png
sips -z 48 48 icon-source.png --out icon48.png
sips -z 16 16 icon-source.png --out icon16.png
```

Or using ImageMagick (cross-platform):

```bash
convert icon-source.png -resize 128x128 icon128.png
convert icon-source.png -resize 48x48 icon48.png
convert icon-source.png -resize 16x16 icon16.png
```

## Design Guidelines

The Relai icon features:
- Glowing neon circuit board aesthetic
- Warm amber/orange tones matching the WALL-E inspired UI
- High contrast for visibility in toolbar
- Distinctive design that stands out from generic AI assistant icons
