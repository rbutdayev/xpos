# Building XPOS Printer Bridge Desktop App

This guide explains how to build the desktop application installers for Windows and macOS.

## Prerequisites

### For All Platforms

1. **Node.js** (v16 or later)
   ```bash
   node --version  # Should be v16+
   ```

2. **npm** (comes with Node.js)
   ```bash
   npm --version
   ```

### For Windows Builds

- Windows 10 or later
- Or use a Windows VM if building from Mac/Linux

### For macOS Builds

- macOS 10.13 or later
- Xcode Command Line Tools:
  ```bash
  xcode-select --install
  ```

## Step 1: Install Dependencies

```bash
cd fiscal-printer-bridge
npm install
```

This will install:
- `electron` - Desktop app framework
- `electron-builder` - Build tool for installers
- `electron-store` - Config storage
- `auto-launch` - Auto-start functionality
- `axios` - HTTP client (for bridge)

## Step 2: Create App Icons

The app needs icons in multiple formats. You have two options:

### Option A: Use Placeholder Icons (Quick)

```bash
cd electron/assets
chmod +x create-icons.sh
./create-icons.sh
cd ../..
```

This creates basic placeholder icons. **Replace these with professional icons before distribution!**

### Option B: Create Professional Icons (Recommended)

1. Design a 512x512 PNG icon with a printer symbol
2. Save as `electron/assets/icon.png`
3. Run the icon generation script:
   ```bash
   cd electron/assets
   chmod +x create-icons.sh
   ./create-icons.sh
   ```

**Required icon files:**
- `icon.png` (512x512) - Main icon
- `icon.ico` (multi-size) - Windows icon
- `icon.icns` (multi-size) - macOS icon
- `icon-16.png` (16x16) - Menu icon
- `tray-icon.png` (32x32) - Tray icon for Windows
- `tray-icon-Template.png` (22x22) - Tray icon for macOS

## Step 3: Test the App

Before building, test the app in development mode:

```bash
npm run electron:dev
```

This will:
1. Open the desktop app window
2. Start the bridge service
3. Show live logs

**Test checklist:**
- ✅ App window opens
- ✅ Can open Settings
- ✅ Can enter token
- ✅ Can save settings
- ✅ Bridge starts and shows logs
- ✅ System tray icon appears
- ✅ Can minimize to tray
- ✅ Can close and reopen from tray

Press `Ctrl+C` to stop the app.

## Step 4: Build Installers

### Build for Current Platform

```bash
# Build for your current OS (Windows OR macOS)
npm run electron:build
```

### Build for Specific Platform

```bash
# Windows only
npm run electron:build:win

# macOS only
npm run electron:build:mac
```

### Build for Both Platforms

To build both Windows and macOS installers (requires both environments):

```bash
npm run electron:build
```

**Note:** You can only build macOS installers on macOS. For Windows, you can build on Windows or use electron-builder's cloud service.

## Step 5: Find Your Installers

Built installers will be in `dist-electron/`:

```
dist-electron/
├── XPOS Printer Bridge Setup 2.0.0.exe    (Windows installer)
├── XPOS Printer Bridge-2.0.0.dmg          (macOS installer)
└── [other build artifacts]
```

**File sizes (approximate):**
- Windows: ~80-100 MB
- macOS: ~100-120 MB

## Step 6: Test the Installer

### On Windows

1. Run `XPOS Printer Bridge Setup 2.0.0.exe`
2. Follow installation wizard
3. Enter test token when prompted
4. Verify app starts automatically
5. Check system tray icon
6. Test Settings → Update token
7. Verify auto-start (check Windows Startup folder)

### On macOS

1. Open `XPOS Printer Bridge-2.0.0.dmg`
2. Drag app to Applications
3. Right-click app → Open (for first time)
4. Enter test token when prompted
5. Verify app starts
6. Check menu bar icon
7. Test Settings → Update token
8. Verify auto-start (System Preferences → Users & Groups → Login Items)

## Troubleshooting

### Error: "Cannot find module 'electron'"

**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Error: "Icon file not found"

**Solution:**
```bash
cd electron/assets
./create-icons.sh
cd ../..
npm run electron:build
```

### Error: "Skipping notarization" (macOS)

This warning is normal if you don't have Apple Developer certificates. The app will still work, but:
- Users will see "unidentified developer" warning
- For production, you need Apple Developer account ($99/year)

**For production:**
1. Get Apple Developer account
2. Create signing certificates
3. Add to electron-builder config:
   ```json
   "mac": {
     "identity": "Your Name (XXXXX)",
     "hardenedRuntime": true,
     "gatekeeperAssess": false,
     "entitlements": "build/entitlements.mac.plist"
   }
   ```

### Build is very slow

**Solution:**
```bash
# Build only the target you need
npm run electron:build:win  # Windows only
npm run electron:build:mac  # macOS only
```

### "Permission denied" on macOS

**Solution:**
```bash
sudo chmod +x electron/assets/create-icons.sh
```

## Advanced Configuration

### Customize Build Settings

Edit `package.json` → `build` section:

```json
{
  "build": {
    "appId": "az.xpos.fiscal-printer-bridge",
    "productName": "XPOS Printer Bridge",
    "directories": {
      "output": "dist-electron"
    },
    "win": {
      "target": ["nsis"],
      "icon": "electron/assets/icon.ico"
    },
    "mac": {
      "target": ["dmg"],
      "icon": "electron/assets/icon.icns",
      "category": "public.app-category.business"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true
    }
  }
}
```

### Change App Name

Edit `package.json`:
```json
{
  "build": {
    "productName": "Your App Name"
  }
}
```

### Change Version

Edit `package.json`:
```json
{
  "version": "2.1.0"
}
```

## Distribution

### For Windows

1. Upload `XPOS Printer Bridge Setup 2.0.0.exe` to your server
2. Share download link with users
3. Users run the .exe and follow wizard

**Optional:** Sign the .exe with a code signing certificate to avoid Windows SmartScreen warnings.

### For macOS

1. Upload `XPOS Printer Bridge-2.0.0.dmg` to your server
2. Share download link with users
3. Users open .dmg and drag to Applications

**Optional:** Notarize the app with Apple to avoid Gatekeeper warnings.

## Continuous Integration

### GitHub Actions Example

Create `.github/workflows/build.yml`:

```yaml
name: Build Desktop App

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [macos-latest, windows-latest]

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: |
          cd fiscal-printer-bridge
          npm install

      - name: Build app
        run: |
          cd fiscal-printer-bridge
          npm run electron:build

      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: installers-${{ matrix.os }}
          path: fiscal-printer-bridge/dist-electron/*
```

## Next Steps

1. ✅ Build installers
2. ✅ Test on target platforms
3. ✅ Create professional icons
4. 📝 Write user documentation
5. 🚀 Distribute to users
6. 📊 Collect feedback
7. 🔄 Iterate and improve

## Getting Help

- **Electron docs**: https://www.electronjs.org/docs
- **electron-builder docs**: https://www.electron.build/
- **Issues**: Create an issue on GitHub

---

**Happy Building! 🚀**
