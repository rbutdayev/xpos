# XPOS Printer Bridge - Desktop Application

Desktop application for Windows and macOS that connects XPOS POS system to local fiscal printers.

## 🎯 Features

- ✅ **Easy Installation**: Simple installer with token setup
- ✅ **Auto-Start**: Automatically starts when system boots
- ✅ **Live Logs**: Real-time log viewer with color-coded messages
- ✅ **System Tray**: Runs in background with system tray icon
- ✅ **Status Monitoring**: Visual indicators for connection status
- ✅ **Token Management**: Easy token configuration through UI
- ✅ **Cross-Platform**: Works on Windows and macOS

## 📥 Installation

### Windows

1. Download `XPOS-Printer-Bridge-Setup.exe`
2. Run the installer
3. Follow the installation wizard
4. When prompted, enter your Bridge Token from XPOS admin panel
5. Click Finish - the app will start automatically

### macOS

1. Download `XPOS-Printer-Bridge.dmg`
2. Open the DMG file
3. Drag the app to Applications folder
4. Open the app (right-click → Open for first time)
5. Enter your Bridge Token when prompted
6. The app will start automatically

### Getting Your Bridge Token

1. Login to XPOS admin panel
2. Go to: **Parametrlər** → **Bridge Tokenlər**
3. Click: **+ Yeni Token**
4. Enter a name (e.g., "Kassa Terminal 1")
5. Copy the token (shown only once!)
6. Paste into the desktop app

## 🚀 Usage

### First Run

1. The app will ask for your Bridge Token
2. Enter the token from admin panel
3. Click Save
4. The bridge will connect automatically
5. You'll see logs in the main window

### Main Window

The main window shows:
- **Connection Status**: Green (connected), Yellow (connecting), Red (disconnected)
- **Account Info**: API URL, Account ID, Bridge Name
- **Live Logs**: Real-time logs from the bridge service
- **Controls**: Settings button, clear logs, auto-scroll toggle

### System Tray

The app runs in the system tray:
- **Green dot**: Connected and working
- **Yellow dot**: Starting or connecting
- **Red dot**: Disconnected or error

**Tray Menu:**
- **Göstər** - Show main window
- **Parametrlər** - Open settings
- **Çıxış** - Exit application

### Settings

Click the **⚙️ Parametrlər** button to configure:

- **Bridge Token**: Update your authentication token
- **Log Level**: Choose between Error, Info, or Debug
- **Auto-Start**: Enable/disable starting on system boot

After changing settings, click **Save** - the bridge will restart automatically.

## 🔧 Configuration

All configuration is done through the UI. Settings are stored in:
- **Windows**: `%APPDATA%\xpos-fiscal-printer-bridge\config.json`
- **macOS**: `~/Library/Application Support/xpos-fiscal-printer-bridge/config.json`

**Default Configuration:**
```json
{
  "apiUrl": "https://xpos.az",
  "token": "your_token_here",
  "pollInterval": 2000,
  "heartbeatInterval": 30000,
  "logLevel": "info"
}
```

**Note**: Printer IP, port, and other settings come from the server. You only need to configure the token.

## 📊 Understanding the Logs

### Log Levels

The logs use color coding:
- 🔵 **Blue (INFO)**: Normal operational messages
- 🟢 **Green (SUCCESS)**: Successful operations
- 🔴 **Red (ERROR)**: Errors and failures
- ⚪ **Gray (DEBUG)**: Detailed debug information
- 🟠 **Orange (SYSTEM)**: Application system messages

### Common Log Messages

**Successful Connection:**
```
[INFO] Bridge qeydiyyatdan keçir...
[SUCCESS] ✓ Bridge qeydiyyatdan keçdi
[INFO]   Account ID: 123
[INFO]   Bridge Adı: Kassa Terminal 1
[INFO] ✓ Bridge işə başladı!
```

**Processing Jobs:**
```
[INFO] 📦 1 iş tapıldı
[INFO] 📝 İş işlənir: #123 (Satış #456)
[SUCCESS] ✓ İş tamamlandı: #123 - Fiskal №789012
```

**Errors:**
```
[ERROR] ❌ Token yanlışdır və ya ləğv edilib!
[ERROR] Printer xətası: Connection timeout
```

## 🐛 Troubleshooting

### Problem: App won't start

**Solution:**
- Check if another instance is already running (check system tray)
- Restart your computer
- Reinstall the application

### Problem: "Token yanlışdır və ya ləğv edilib"

**Solution:**
- Your token is invalid or has been revoked
- Create a new token in admin panel
- Open Settings and update the token
- Click Save

### Problem: Bridge connects but no jobs processed

**Check:**
1. Is fiscal printing enabled for your account?
2. Is the printer configured correctly in admin panel?
3. Is the printer online and reachable from this computer?
4. Check the logs for detailed error messages

### Problem: Logs show "Printer xətası: Connection timeout"

**Solution:**
- Ensure printer is turned on
- Check printer is on the same network
- Verify printer IP in admin panel is correct
- Check firewall settings (allow outgoing connections)

### Problem: App doesn't auto-start on boot

**Solution:**
- Open Settings
- Check "Sistemi başladanda avtomatik işə sal"
- Click Save
- Restart computer to test

## 🔐 Security

### Token Security
- Token is stored locally in encrypted config
- Token only grants access to:
  - ✅ Poll for print jobs for your account
  - ✅ Report job status
  - ❌ Cannot access other accounts' data
  - ❌ Cannot create or modify sales
  - ❌ Cannot access other API endpoints

### Revoke Access
- Revoke token from admin panel: **Parametrlər** → **Bridge Tokenlər**
- Click the ❌ icon next to the token
- Bridge will immediately stop working
- Create new token to reconnect

## 🔄 Updates

The app will notify you when updates are available. To update:

1. Download the new installer
2. Close the running app (right-click tray icon → Exit)
3. Run the new installer
4. Your settings and token will be preserved

## 📝 Logs Location

Application logs are stored in:
- **Windows**: `%APPDATA%\xpos-fiscal-printer-bridge\logs\`
- **macOS**: `~/Library/Logs/xpos-fiscal-printer-bridge/`

## 🆘 Support

### Check Bridge Status
- Admin Panel → Parametrlər → Bridge Tokenlər
- Shows: 🟢 Online / 🔴 Offline
- Shows: Last seen timestamp
- Shows: Bridge version

### Get Help
- Email: support@xpos.az
- Documentation: https://docs.xpos.az
- GitHub Issues: [Report a bug](https://github.com/your-repo/issues)

## ⚙️ Advanced: Command Line Mode

You can also run the bridge in command-line mode:

```bash
# Navigate to installation directory
cd "C:\Program Files\XPOS Printer Bridge\resources\app"  # Windows
cd "/Applications/XPOS Printer Bridge.app/Contents/Resources/app"  # macOS

# Run bridge directly
node index.js
```

This is useful for:
- Testing configuration
- Running on servers without GUI
- Debugging issues

## 📦 System Requirements

### Windows
- Windows 10 or later (64-bit)
- 100 MB free disk space
- Internet connection
- Network access to fiscal printer

### macOS
- macOS 10.13 (High Sierra) or later
- 100 MB free disk space
- Internet connection
- Network access to fiscal printer

## 🏗️ For Developers

### Building from Source

```bash
# Clone repository
git clone https://github.com/your-repo/xpos-fiscal-printer-bridge.git
cd xpos-fiscal-printer-bridge

# Install dependencies
npm install

# Create icon files
cd electron/assets
chmod +x create-icons.sh
./create-icons.sh
cd ../..

# Run in development mode
npm run electron:dev

# Build installers
npm run electron:build        # Both Windows and macOS
npm run electron:build:win    # Windows only
npm run electron:build:mac    # macOS only
```

Installers will be created in `dist-electron/`:
- Windows: `XPOS Printer Bridge Setup X.X.X.exe`
- macOS: `XPOS Printer Bridge-X.X.X.dmg`

### Project Structure

```
fiscal-printer-bridge/
├── electron/
│   ├── main.js              # Main Electron process
│   ├── preload.js           # Security bridge
│   ├── assets/              # Icons and assets
│   └── renderer/            # UI files
│       ├── index.html       # Main window
│       ├── styles.css       # Styles
│       └── app.js           # Frontend logic
├── index.js                 # Bridge service (Node.js)
├── package.json             # Dependencies and build config
└── config.json.example      # Example configuration
```

## 📄 License

MIT License - ONYX xPos © 2025

---

## 📝 Changelog

### v2.0.0 (2025-11-26)
- ✨ New desktop application with GUI
- ✨ System tray integration
- ✨ Auto-start on boot
- ✨ Live log viewer
- ✨ Settings management UI
- 🔄 Polling-based architecture
- 🔐 Token-based authentication
- 🎨 Modern, user-friendly interface

### v1.0.0 (Previous)
- Command-line only
- HTTP server mode
- Self-signed certificates
