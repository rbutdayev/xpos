#!/bin/bash
set -e

echo "=== Quick Build (No Tests) ==="

# Clean
rm -rf dist

# Build Electron with skipLibCheck
echo "Building Electron..."
npx tsc -p tsconfig.electron.json --skipLibCheck

# Build React
echo "Building React..."
npm run build:renderer

# Verify
if [ -f "dist/electron/electron/main.js" ] && [ -f "dist/renderer/index.html" ]; then
    echo "✓ Build SUCCESS!"
    echo ""
    echo "Run: npm start"
else
    echo "✗ Build FAILED - files missing"
    exit 1
fi
