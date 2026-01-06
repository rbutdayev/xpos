#!/bin/bash

# XPOS Kiosk App - Build Script
# Builds for macOS ARM + Intel and Windows x64

set -e  # Exit on error

echo "=================================="
echo "XPOS Kiosk App - Build Script"
echo "=================================="
echo "Build started: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""
echo "This script will:"
echo "  1. Install dependencies (if needed)"
echo "  2. Clean ALL caches (prevents stale builds)"
echo "  3. Build Electron + React from scratch"
echo "  4. Verify build outputs"
echo "  5. Create macOS DMG installer"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed!${NC}"
    echo "Please install Node.js from https://nodejs.org"
    exit 1
fi

echo -e "${GREEN}✓${NC} Node.js version: $(node --version)"
echo -e "${GREEN}✓${NC} npm version: $(npm --version)"
echo ""

# Step 1: Install dependencies
echo "Step 1: Installing dependencies..."
if [ ! -d "node_modules" ]; then
    npm install
    echo -e "${GREEN}✓${NC} Dependencies installed"
else
    echo -e "${YELLOW}→${NC} Dependencies already installed (skipping)"
fi
echo ""

# Step 2: Clean previous builds and ALL caches
echo "Step 2: Cleaning previous builds and caches..."
echo -e "${YELLOW}→${NC} Removing dist directories..."
rm -rf dist dist-electron

echo -e "${YELLOW}→${NC} Removing Node.js caches..."
rm -rf node_modules/.cache
rm -rf .vite

echo -e "${YELLOW}→${NC} Removing TypeScript build info..."
rm -f tsconfig.tsbuildinfo
rm -f tsconfig.electron.tsbuildinfo
rm -f src/renderer/tsconfig.tsbuildinfo

echo -e "${YELLOW}→${NC} Removing Electron builder cache..."
rm -rf ~/.electron-builder/cache/*

echo -e "${YELLOW}→${NC} Removing Vite cache in renderer..."
rm -rf src/renderer/.vite
rm -rf src/renderer/node_modules/.vite

echo -e "${GREEN}✓${NC} All build directories and caches cleaned"
echo ""

# Step 3: Build source code
echo "Step 3: Building source code..."
npm run build
echo -e "${GREEN}✓${NC} Source code built"
echo ""

# Step 3.5: Verify build outputs
echo "Step 3.5: Verifying build outputs..."
if [ ! -d "dist/electron" ] || [ ! -d "dist/renderer" ]; then
    echo -e "${RED}✗${NC} Build verification failed!"
    echo "Expected directories not found:"
    [ ! -d "dist/electron" ] && echo "  - dist/electron/ (missing)"
    [ ! -d "dist/renderer" ] && echo "  - dist/renderer/ (missing)"
    echo ""
    echo "Build output:"
    ls -la dist/ 2>/dev/null || echo "  dist/ directory does not exist"
    exit 1
fi

echo -e "${YELLOW}→${NC} Checking Electron main process..."
if [ -f "dist/electron/electron/main.js" ]; then
    echo -e "${GREEN}  ✓${NC} dist/electron/electron/main.js"
else
    echo -e "${RED}  ✗${NC} dist/electron/electron/main.js (missing!)"
    exit 1
fi

echo -e "${YELLOW}→${NC} Checking React renderer..."
if [ -f "dist/renderer/index.html" ]; then
    echo -e "${GREEN}  ✓${NC} dist/renderer/index.html"
    ASSET_COUNT=$(ls dist/renderer/assets/*.js 2>/dev/null | wc -l)
    echo -e "${GREEN}  ✓${NC} dist/renderer/assets/ ($ASSET_COUNT JS files)"
else
    echo -e "${RED}  ✗${NC} dist/renderer/index.html (missing!)"
    exit 1
fi

echo -e "${GREEN}✓${NC} Build verification passed"
echo ""

# Step 4: Build installers
echo "Step 4: Building installers..."
echo ""

# Build for both platforms
echo "Building for macOS (ARM64 only)..."
npm run package:mac
echo -e "${GREEN}✓${NC} macOS ARM64 build complete"
echo ""

echo "Building for Windows (x64)..."
npm run package:win
echo -e "${GREEN}✓${NC} Windows x64 build complete"
echo ""

# Step 5: Show build results
echo "=================================="
echo "Build Complete!"
echo "=================================="
echo "Build finished: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""
echo "Output directory: dist-electron/"
echo ""

if [ -d "dist-electron" ]; then
    echo "Build artifacts:"
    echo ""

    # Show DMG files
    if ls dist-electron/*.dmg 1> /dev/null 2>&1; then
        for file in dist-electron/*.dmg; do
            SIZE=$(ls -lh "$file" | awk '{print $5}')
            NAME=$(basename "$file")
            echo -e "${GREEN}✓${NC} $NAME ($SIZE)"

            # Calculate SHA256 checksum for verification
            if command -v shasum &> /dev/null; then
                CHECKSUM=$(shasum -a 256 "$file" | awk '{print $1}')
                echo "  SHA256: $CHECKSUM"
            fi
        done
        echo ""
    fi

    # Show other build files
    if ls dist-electron/*.{exe,zip} 1> /dev/null 2>&1; then
        for file in dist-electron/*.{exe,zip}; do
            if [ -f "$file" ]; then
                SIZE=$(ls -lh "$file" | awk '{print $5}')
                NAME=$(basename "$file")
                echo -e "${GREEN}✓${NC} $NAME ($SIZE)"
            fi
        done
        echo ""
    fi

    # Calculate total size
    TOTAL_SIZE=$(du -sh dist-electron | awk '{print $1}')
    echo "Total output size: $TOTAL_SIZE"
fi

echo ""
echo -e "${GREEN}✓${NC} Ready for distribution!"
echo ""
echo "To test the DMG:"
echo "  1. Open the .dmg file in Finder"
echo "  2. Drag xPOS Kiosk.app to Applications"
echo "  3. Launch from Applications folder"
echo ""
