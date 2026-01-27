# Icons

This directory contains extension icons.

## Required Files

Chrome extensions need PNG files at these sizes:
- `icon16.png` - 16x16 (toolbar)
- `icon48.png` - 48x48 (extensions page)
- `icon128.png` - 128x128 (Chrome Web Store)

## Generating PNGs

The SVG source files are included. Convert them using:

```bash
# Using ImageMagick
convert icon16.svg icon16.png
convert icon48.svg icon48.png
convert icon128.svg icon128.png

# Or using Inkscape
inkscape icon16.svg -o icon16.png -w 16 -h 16
inkscape icon48.svg -o icon48.png -w 48 -h 48
inkscape icon128.svg -o icon128.png -w 128 -h 128
```

## Temporary Workaround

For development, you can use any 16x16, 48x48, and 128x128 PNG files, or comment out the icon references in `manifest.json`.
