# App Icons

This directory should contain the application icons in the following formats:

## Required Icons

1. **icon.png** - Main app icon (512x512 px, PNG format)
2. **icon.ico** - Windows icon (multi-size ICO file)
3. **icon.icns** - macOS icon (ICNS format)
4. **icon-16.png** - Small icon for menu (16x16 px)
5. **tray-icon.png** - System tray icon for Windows (32x32 px)
6. **tray-icon-Template.png** - System tray icon for macOS (22x22 px, black/transparent)

## How to Create Icons

### Option 1: Use Online Icon Generator
1. Create a 512x512 PNG icon with your design
2. Use a tool like [Icon Kitchen](https://icon.kitchen/) or [CloudConvert](https://cloudconvert.com/) to generate:
   - `.ico` file for Windows
   - `.icns` file for macOS

### Option 2: Use Command Line Tools

**For macOS (.icns):**
```bash
# Install iconutil (comes with Xcode)
mkdir icon.iconset
sips -z 16 16 icon.png --out icon.iconset/icon_16x16.png
sips -z 32 32 icon.png --out icon.iconset/icon_16x16@2x.png
sips -z 32 32 icon.png --out icon.iconset/icon_32x32.png
sips -z 64 64 icon.png --out icon.iconset/icon_32x32@2x.png
sips -z 128 128 icon.png --out icon.iconset/icon_128x128.png
sips -z 256 256 icon.png --out icon.iconset/icon_128x128@2x.png
sips -z 256 256 icon.png --out icon.iconset/icon_256x256.png
sips -z 512 512 icon.png --out icon.iconset/icon_256x256@2x.png
sips -z 512 512 icon.png --out icon.iconset/icon_512x512.png
cp icon.png icon.iconset/icon_512x512@2x.png
iconutil -c icns icon.iconset
```

**For Windows (.ico):**
```bash
# Install ImageMagick
brew install imagemagick  # macOS
# or
sudo apt-get install imagemagick  # Linux

# Convert
convert icon.png -define icon:auto-resize=256,128,96,64,48,32,16 icon.ico
```

## Temporary Solution

For now, you can:
1. Find a printer icon (🖨️) image online
2. Download as PNG (512x512)
3. Convert to required formats
4. Place all files in this directory

## Design Guidelines

- Use a simple, recognizable printer icon
- Include XPOS branding if desired
- Use high contrast colors for system tray icons
- Keep it simple for small sizes (16x16, 22x22)
