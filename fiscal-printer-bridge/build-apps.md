 Great question! Here's how to build both installers on your Mac:

  🚀 Building Installers on Mac

  Prerequisites Check

  # 1. Make sure you're in the project directory
  cd fiscal-printer-bridge

  # 2. Verify Node.js is installed
  node --version  # Should be v16+

  # 3. Verify dependencies are installed
  npm install

  📦 Build Both DMG and EXE

  You can build both Windows (.exe) and macOS (.dmg) installers from your Mac!

  # Build BOTH Windows and macOS installers
  npm run electron:build

  This will create:
  - ✅ XPOS Printer Bridge-2.0.0.dmg (macOS)
  - ✅ XPOS Printer Bridge Setup 2.0.0.exe (Windows)

  🍎 Build Only macOS DMG

  npm run electron:build:mac

  Output: dist-electron/XPOS Printer Bridge-2.0.0.dmg

  🪟 Build Only Windows EXE

  npm run electron:build:win

  Output: dist-electron/XPOS Printer Bridge Setup 2.0.0.exe

  ⚙️ Step-by-Step Build Process

  1. Prepare Icons (First Time Only)

  cd fiscal-printer-bridge/electron/assets

  # Place your logo as icon.png (512x512)
  cp /path/to/your/logo.png icon.png

  # Generate all icon formats
  chmod +x create-icons.sh
  ./create-icons.sh

  # Go back to project root
  cd ../..

  2. Test Before Building (Recommended)

  # Test the app works correctly
  npm run electron:dev

  Verify:
  - ✅ App opens
  - ✅ Token can be entered in Settings
  - ✅ Logs appear
  - ✅ System tray icon shows

  Press Ctrl+C to stop.

  3. Build the Installers

  # Build both platforms at once
  npm run electron:build

  This will take 3-5 minutes the first time because it needs to:
  1. Download Electron binaries for both platforms (~200 MB)
  2. Package the application
  3. Create installers

  Subsequent builds are faster (1-2 minutes)

  4. Find Your Installers

  # Check the output directory
  ls -lh dist-electron/

  # You'll see:
  # XPOS Printer Bridge-2.0.0.dmg           (macOS installer)
  # XPOS Printer Bridge Setup 2.0.0.exe     (Windows installer)

  📊 Expected Output

  After successful build:

  Building...

    • electron-builder  version=24.9.1 os=23.6.0
    • loaded configuration  file=package.json ("build" field)

    • packaging       platform=darwin arch=x64 electron=28.0.0 appOutDir=dist-electron/mac
    • packaging       platform=win32 arch=x64 electron=28.0.0 appOutDir=dist-electron/win-unpacked

    • building        target=DMG arch=x64 file=dist-electron/XPOS Printer Bridge-2.0.0.dmg
    • building        target=nsis arch=x64 file=dist-electron/XPOS Printer Bridge Setup 2.0.0.exe

  ✓ Build complete!

  🔍 Verify the Installers

  Test DMG (macOS)

  # Open the DMG
  open "dist-electron/XPOS Printer Bridge-2.0.0.dmg"

  # You should see the installer window
  # Drag the app to Applications (or test from the DMG)

  Test EXE (Windows)

  You'll need to test on a Windows machine, OR:

  # Check the file was created and is the right size
  ls -lh "dist-electron/XPOS Printer Bridge Setup 2.0.0.exe"

  # Expected size: ~80-100 MB

  To actually test: Copy to Windows machine and run it.

  ⚠️ Common Issues & Solutions

  Issue 1: "Cannot build for Windows on macOS" error

  Solution: You might need Wine (rare, usually not required):

  # Only if you get Wine-related errors
  brew install --cask wine-stable

  Most of the time, electron-builder can build Windows EXE on Mac without Wine.

  Issue 2: "Icon not found" error

  Solution:

  cd electron/assets

  # Make sure all icon files exist
  ls -la

  # Should see:
  # icon.png
  # icon.ico
  # icon.icns

  # If missing, regenerate:
  ./create-icons.sh
  cd ../..
  npm run electron:build

  Issue 3: Build is very slow

  Normal! First build downloads ~200MB of Electron binaries. Progress:

    • downloading     url=https://github.com/electron/electron/releases/...
      ▐████████████████▌ 50%

  Just wait. Subsequent builds are much faster.

  Issue 4: "Skipping notarization" warning on macOS

  This is OK! It means:
  - App will work fine
  - Users might see "unidentified developer" warning
  - To fix: Need Apple Developer account ($99/year)

  For internal use, you can ignore this.

  Issue 5: Out of disk space

  Solution:

  # Check disk space
  df -h

  # Clean old builds
  rm -rf dist-electron/
  rm -rf node_modules/.cache/

  # Rebuild
  npm run electron:build

  🎯 Optimizing Build Size

  If installers are too large:

  # Edit package.json, add to "build" section:
  {
    "build": {
      "compression": "maximum",
      "removePackageScripts": true
    }
  }

  # Rebuild
  npm run electron:build

  📤 Distributing the Installers

  Upload to Server

  # Example: Upload to server
  scp dist-electron/*.dmg user@server:/path/to/downloads/
  scp dist-electron/*.exe user@server:/path/to/downloads/

  Share with Users

  Create download links:
  - macOS: https://your-domain.com/downloads/XPOS-Printer-Bridge-2.0.0.dmg
  - Windows: https://your-domain.com/downloads/XPOS-Printer-Bridge-Setup-2.0.0.exe

  🔐 Optional: Code Signing

  For macOS (requires Apple Developer account)

  1. Get Apple Developer account ($99/year)
  2. Create certificates in Xcode
  3. Update package.json:

  {
    "build": {
      "mac": {
        "identity": "Developer ID Application: Your Name (TEAM_ID)"
      }
    }
  }

  For Windows (requires code signing certificate)

  1. Purchase code signing certificate (~$100-200/year)
  2. Update package.json:

  {
    "build": {
      "win": {
        "certificateFile": "path/to/cert.pfx",
        "certificatePassword": "password"
      }
    }
  }

  For now, skip code signing - it's optional and works without it.

  ✅ Quick Build Checklist

  # Complete build process:

  # 1. Icons ready?
  ls electron/assets/icon.png icon.ico icon.icns

  # 2. Dependencies installed?
  npm install

  # 3. Test first
  npm run electron:dev

  # 4. Build both platforms
  npm run electron:build

  # 5. Check output
  ls -lh dist-electron/

  # 6. Test DMG locally
  open dist-electron/*.dmg

  # 7. Transfer EXE to Windows to test

  🚀 Ready to Build!

  Just run:

  cd fiscal-printer-bridge
  npm run electron:build

  Wait 3-5 minutes, and you'll have both installers ready! ✨

  Need help with any errors? Just share the error message!