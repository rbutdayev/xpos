#!/bin/bash

# This script generates all icon formats from your logo (icon.png)

echo "Generating icon formats from your logo..."
echo ""

# Check if icon.png exists
if [ ! -f "icon.png" ]; then
    echo "❌ Error: icon.png not found!"
    echo ""
    echo "Please copy your logo to this location:"
    echo "  fiscal-printer-bridge/electron/assets/icon.png"
    echo ""
    echo "Your logo should be:"
    echo "  - PNG format"
    echo "  - 512x512 pixels (or larger, square)"
    echo "  - Transparent background (recommended)"
    exit 1
fi

echo "✓ Found icon.png"
echo ""

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "❌ ImageMagick not installed!"
    echo ""
    echo "To install ImageMagick:"
    echo "  macOS: brew install imagemagick"
    echo "  Ubuntu/Debian: sudo apt-get install imagemagick"
    echo ""
    exit 1
fi

echo "✓ ImageMagick found"
echo ""

# Get current icon.png size
CURRENT_SIZE=$(sips -g pixelWidth icon.png 2>/dev/null | tail -n1 | awk '{print $2}')
echo "Current icon.png size: ${CURRENT_SIZE}x${CURRENT_SIZE}"

# Resize to 512x512 if needed (creating a copy first)
if [ "$CURRENT_SIZE" != "512" ]; then
    echo "Resizing to 512x512..."
    cp icon.png icon-original.png
    convert icon-original.png -resize 512x512 -background transparent -gravity center -extent 512x512 icon.png
    echo "✓ Resized (original saved as icon-original.png)"
fi

echo ""
echo "Generating icon formats..."

# Generate small icons
echo "  - Creating icon-16.png (16x16)..."
convert icon.png -resize 16x16 icon-16.png

echo "  - Creating tray-icon.png (32x32)..."
convert icon.png -resize 32x32 tray-icon.png

echo "  - Creating tray-icon-Template.png (22x22)..."
convert icon.png -resize 22x22 tray-icon-Template.png

# Create ICO for Windows
echo "  - Creating icon.ico (Windows, multi-size)..."
convert icon.png -define icon:auto-resize=256,128,96,64,48,32,16 icon.ico

echo ""

# Create ICNS for macOS (only on macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "Creating icon.icns for macOS..."

    mkdir -p icon.iconset

    sips -z 16 16 icon.png --out icon.iconset/icon_16x16.png 2>/dev/null
    sips -z 32 32 icon.png --out icon.iconset/icon_16x16@2x.png 2>/dev/null
    sips -z 32 32 icon.png --out icon.iconset/icon_32x32.png 2>/dev/null
    sips -z 64 64 icon.png --out icon.iconset/icon_32x32@2x.png 2>/dev/null
    sips -z 128 128 icon.png --out icon.iconset/icon_128x128.png 2>/dev/null
    sips -z 256 256 icon.png --out icon.iconset/icon_128x128@2x.png 2>/dev/null
    sips -z 256 256 icon.png --out icon.iconset/icon_256x256.png 2>/dev/null
    sips -z 512 512 icon.png --out icon.iconset/icon_256x256@2x.png 2>/dev/null
    sips -z 512 512 icon.png --out icon.iconset/icon_512x512.png 2>/dev/null
    cp icon.png icon.iconset/icon_512x512@2x.png

    iconutil -c icns icon.iconset
    rm -rf icon.iconset

    echo "  ✓ Created icon.icns"
else
    echo "⚠️  Skipping icon.icns (macOS only)"
    echo "   You need to run this on macOS to create .icns file"
fi

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║                                                          ║"
echo "║                 ✅ Icons Generated!                      ║"
echo "║                                                          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "Created files:"
echo "  ✓ icon.png (512x512) - Main icon"
echo "  ✓ icon-16.png (16x16) - Small menu icon"
echo "  ✓ icon.ico (multi-size) - Windows icon"
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "  ✓ icon.icns (multi-size) - macOS icon"
fi
echo "  ✓ tray-icon.png (32x32) - Windows tray"
echo "  ✓ tray-icon-Template.png (22x22) - macOS tray"
echo ""
echo "Next step:"
echo "  cd ../.."
echo "  npm run electron:build"
echo ""
