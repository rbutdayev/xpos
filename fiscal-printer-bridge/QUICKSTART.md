# Quick Start Guide - XPOS Printer Bridge Desktop App

Get the desktop app running in 5 minutes!

## 🎯 Goal

Transform the Node.js bridge into a user-friendly desktop application that:
- ✅ Runs on Windows and macOS
- ✅ Shows live logs and status
- ✅ Configures via simple UI
- ✅ Auto-starts on boot
- ✅ Runs in system tray

## 📋 Prerequisites

- Node.js v16 or later installed
- Terminal/Command Prompt access
- 10-15 minutes

## 🚀 Quick Start (5 Steps)

### 1️⃣ Install Dependencies

```bash
cd fiscal-printer-bridge
npm install
```

**What this does:**
- Installs Electron framework
- Installs electron-builder for creating installers
- Installs supporting libraries

**Expected output:**
```
added 500+ packages in 30s
```

### 2️⃣ Create Icons (Temporary)

```bash
cd electron/assets
chmod +x create-icons.sh
./create-icons.sh
cd ../..
```

**What this does:**
- Creates placeholder icon files
- You can replace these later with professional icons

**Expected output:**
```
✓ Icons created successfully!
```

### 3️⃣ Test the App

```bash
npm run electron:dev
```

**What this does:**
- Starts the desktop app in development mode
- Opens the main window with logs
- Starts the bridge service

**Expected result:**
- App window appears
- You see the XPOS Printer Bridge interface
- Logs start appearing in the window

**To test:**
1. Click "⚙️ Parametrlər" to open settings
2. Enter a test token (get from XPOS admin panel)
3. Click "Yadda saxla və yenidən başlat"
4. Watch logs appear in real-time
5. Check system tray for the app icon

Press `Ctrl+C` in terminal to stop.

### 4️⃣ Build Installers

#### For Windows:
```bash
npm run electron:build:win
```

#### For macOS:
```bash
npm run electron:build:mac
```

#### For Both:
```bash
npm run electron:build
```

**What this does:**
- Creates installer packages
- Bundles the app with Node.js
- Creates ready-to-distribute files

**Build time:** 2-5 minutes

**Expected output:**
```
Building...
Packaging...
Creating installer...
Done! Check dist-electron/
```

### 5️⃣ Install and Test

#### On Windows:
1. Go to `dist-electron/`
2. Run `XPOS Printer Bridge Setup 2.0.0.exe`
3. Follow installation wizard
4. App starts automatically

#### On macOS:
1. Go to `dist-electron/`
2. Open `XPOS Printer Bridge-2.0.0.dmg`
3. Drag app to Applications folder
4. Open the app (right-click → Open first time)

**Test checklist:**
- ✅ App opens
- ✅ Can configure token in Settings
- ✅ Logs appear when bridge connects
- ✅ System tray icon appears
- ✅ Can minimize to tray
- ✅ Can exit from tray menu

## 🎉 Success!

You now have:
- ✅ A working desktop application
- ✅ Installers for Windows and/or macOS
- ✅ Auto-start functionality
- ✅ System tray integration

## 📁 Project Structure Overview

```
fiscal-printer-bridge/
│
├── electron/                    # Desktop app code
│   ├── main.js                 # Main process (app lifecycle)
│   ├── preload.js              # Security bridge
│   ├── assets/                 # Icons
│   └── renderer/               # UI (HTML/CSS/JS)
│       ├── index.html          # Main window
│       ├── styles.css          # Styling
│       └── app.js              # Frontend logic
│
├── index.js                    # Bridge service (unchanged)
├── package.json                # Dependencies & build config
│
└── dist-electron/              # Built installers (after build)
    ├── *.exe                   # Windows installer
    └── *.dmg                   # macOS installer
```

## 🔧 Common Commands

```bash
# Development
npm run electron:dev            # Run in dev mode

# Building
npm run electron:build          # Build for current platform
npm run electron:build:win      # Build Windows installer
npm run electron:build:mac      # Build macOS installer

# Original bridge (CLI mode)
npm start                       # Run bridge without GUI
```

## 🐛 Troubleshooting

### App doesn't start in dev mode

**Check:**
```bash
# Verify Node.js version
node --version  # Should be v16+

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Icons missing error during build

**Fix:**
```bash
cd electron/assets
./create-icons.sh
cd ../..
```

### "Token yanlışdır" error in logs

**Fix:**
1. Get valid token from XPOS admin panel:
   - Login → Parametrlər → Bridge Tokenlər
   - Click "+ Yeni Token"
   - Copy the token
2. Open Settings in app
3. Paste token
4. Save

### Build is very slow

**Normal!** First build takes 3-5 minutes. Includes:
- Downloading Electron binaries (~100 MB)
- Bundling Node.js
- Creating installers

Subsequent builds are faster (1-2 minutes).

## 📚 Next Steps

### For Development
- Read: `BUILDING.md` - Detailed build instructions
- Read: `README-DESKTOP.md` - User documentation
- Customize: `electron/renderer/` - Change UI
- Configure: `package.json` → `build` - Build settings

### For Distribution
1. Replace placeholder icons with professional ones
2. Test installers on clean machines
3. Create download page
4. Write user guide
5. Distribute installers to users

### For Advanced Users
- Add auto-update functionality
- Add crash reporting
- Customize installer (splash screen, license)
- Code signing (Windows) and notarization (macOS)

## 🆘 Need Help?

1. **Documentation**
   - README-DESKTOP.md - User guide
   - BUILDING.md - Build guide
   - README.md - Original bridge docs

2. **Electron Resources**
   - https://www.electronjs.org/docs
   - https://www.electron.build/

3. **Support**
   - GitHub Issues
   - Email: support@xpos.az

## 🎓 What You've Learned

After following this guide, you now understand:
- ✅ How to convert a Node.js app to Electron desktop app
- ✅ How to create installers for Windows and macOS
- ✅ How to implement system tray functionality
- ✅ How to manage app configuration and auto-start
- ✅ How to display live logs in a desktop UI

## 🚢 Ready to Ship?

Before distributing to users:

1. **Replace placeholder icons** with professional ones
2. **Test installers** on clean Windows and macOS machines
3. **Get tokens** from admin panel for testing
4. **Test auto-start** by restarting computer
5. **Test all features** from user's perspective
6. **Create support documentation** for users
7. **Set up distribution** (download page, links)

---

**Congratulations! You've successfully created a desktop application! 🎉**

Ready to distribute to your users and make their lives easier!
