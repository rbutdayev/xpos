#!/bin/bash
set -e

echo "=== Quick Build & Test Script ==="
echo ""

# Clean
echo "1. Cleaning..."
rm -rf dist dist-electron node_modules/.cache .vite
echo "   ✓ Cleaned"

# Build Electron
echo "2. Building Electron..."
npx tsc -p tsconfig.electron.json
echo "   ✓ Electron built"

# Build React
echo "3. Building React..."
npx vite build
echo "   ✓ React built"

# Verify
echo "4. Verifying..."
if [ -f "dist/electron/electron/main.js" ]; then
    echo "   ✓ Electron main.js exists"
else
    echo "   ✗ Electron main.js MISSING!"
    exit 1
fi

if [ -f "dist/renderer/index.html" ]; then
    echo "   ✓ React index.html exists"
else
    echo "   ✗ React index.html MISSING!"
    exit 1
fi

echo ""
echo "=== Build Complete! ==="
echo "Run: npm start"
