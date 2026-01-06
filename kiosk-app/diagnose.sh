#!/bin/bash

echo "=== XPOS Kiosk Diagnostic ==="
echo ""

echo "1. Current directory:"
pwd
echo ""

echo "2. Package.json main entry:"
grep '"main"' package.json
echo ""

echo "3. Checking if source files exist:"
echo -n "  electron/main.ts: "
[ -f "electron/main.ts" ] && echo "✓ EXISTS" || echo "✗ MISSING"
echo -n "  src/renderer/App.tsx: "
[ -f "src/renderer/App.tsx" ] && echo "✓ EXISTS" || echo "✗ MISSING"
echo -n "  src/renderer/pages/POS.tsx: "
[ -f "src/renderer/pages/POS.tsx" ] && echo "✓ EXISTS" || echo "✗ MISSING"
echo ""

echo "4. Checking dist folder:"
if [ -d "dist" ]; then
    echo "  dist/ exists:"
    ls -la dist/
else
    echo "  ✗ dist/ does NOT exist"
fi
echo ""

echo "5. Checking dist-electron folder:"
if [ -d "dist-electron" ]; then
    echo "  dist-electron/ exists:"
    ls -la dist-electron/
else
    echo "  ✗ dist-electron/ does NOT exist"
fi
echo ""

echo "6. Trying to build Electron (saving output):"
npm run build:electron 2>&1 | tee electron-build.log
echo ""

echo "7. Trying to build Renderer (saving output):"
npm run build:renderer 2>&1 | tee renderer-build.log
echo ""

echo "8. Final check - what got created:"
echo "  dist/electron/electron/main.js:"
[ -f "dist/electron/electron/main.js" ] && echo "    ✓ EXISTS" || echo "    ✗ MISSING"
echo "  dist/renderer/index.html:"
[ -f "dist/renderer/index.html" ] && echo "    ✓ EXISTS" || echo "    ✗ MISSING"
echo ""

echo "=== Check electron-build.log and renderer-build.log for errors ==="
