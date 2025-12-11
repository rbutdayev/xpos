# XPOS Fiscal Printer Bridge v2.0

Polling-based bridge service for connecting XPOS POS system to local fiscal printers.

## 📦 Two Installation Options

### Option 1: Desktop App (Recommended for Users) 🖥️

Easy-to-use desktop application with GUI, auto-start, and system tray.

- ✅ **Windows & macOS installers**
- ✅ **Visual interface** with live logs
- ✅ **Auto-start** on system boot
- ✅ **System tray** integration
- ✅ **No command line** needed

**👉 [Desktop App Guide](README-DESKTOP.md)** | **👉 [Quick Start](QUICKSTART.md)** | **👉 [Building](BUILDING.md)**

### Option 2: Command Line (For Servers & Advanced Users) ⌨️

Traditional Node.js command-line application.

- ✅ **Lightweight** - No GUI overhead
- ✅ **Server-friendly** - Run as service/daemon
- ✅ **Scriptable** - Easy automation
- ✅ **Cross-platform** - Works anywhere Node.js runs

**👉 Continue reading below for CLI setup**

---

## 🚀 Quick Start (Command Line)

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure

```bash
# Copy example config
cp config.json.example config.json

# Edit config.json
nano config.json
```

**config.json:**
```json
{
  "apiUrl": "https://app.xpos.az",
  "token": "xpos_your_token_here",
  "printerIp": "192.168.0.45",
  "printerPort": 5544,
  "pollInterval": 2000,
  "heartbeatInterval": 30000,
  "logLevel": "info"
}
```

**Get Token:**
1. Login to XPOS admin panel
2. Go to: Parametrlər → Bridge Tokenlər
3. Click: "+ Yeni Token"
4. Enter name: "Kassa Terminal 1"
5. Copy the token (shown only once!)
6. Paste into config.json

### 3. Start Bridge

```bash
npm start
```

You should see:
```
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║       🖨️  XPOS Fiscal Printer Bridge Service v2.0       ║
║                  (Polling Mode)                          ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝

API URL: https://app.xpos.az
Printer: 192.168.0.45:5544
Token: xpos_abc123...

[INFO] Bridge qeydiyyatdan keçir...
[SUCCESS] ✓ Bridge qeydiyyatdan keçdi
[INFO]   Account ID: 123
[INFO]   Bridge Adı: Kassa Terminal 1
[INFO] 🔄 Polling başladı (hər 2000ms)
[INFO] 💓 Heartbeat başladı (hər 30000ms)
[INFO] ✓ Bridge işə başladı!
[INFO] ✓ İşlər gözlənilir...
```

---

## 📋 Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| `apiUrl` | `https://app.xpos.az` | Your XPOS server URL |
| `token` | **required** | Bridge authentication token from admin panel |
| `printerIp` | `192.168.0.45` | Fiscal printer IP address |
| `printerPort` | `5544` | Fiscal printer port |
| `pollInterval` | `2000` | How often to check for jobs (ms) |
| `heartbeatInterval` | `30000` | How often to send keep-alive (ms) |
| `logLevel` | `info` | Logging: `debug`, `info`, `error` |

---

## 🏗️ How It Works

```
┌─────────────────────────────────────────────────────────┐
│  1. Sale Created in POS                                 │
│     └─> Job queued in database                          │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  2. Bridge Polls Server (every 2 seconds)               │
│     GET /api/bridge/poll                                │
│     └─> Gets pending jobs                               │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  3. Bridge Prints to Local Printer                      │
│     POST http://192.168.0.45:5544                       │
│     └─> Gets fiscal number                              │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  4. Bridge Reports Back                                 │
│     POST /api/bridge/job/{id}/complete                  │
│     └─> Job marked complete in database                 │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 Logs

### Success Example:
```
[INFO] 📦 1 iş tapıldı
[INFO] 📝 İş işlənir: #123 (Satış #456)
[SUCCESS] ✓ İş tamamlandı: #123 - Fiskal №789012
```

### Failure Example:
```
[INFO] 📦 1 iş tapıldı
[INFO] 📝 İş işlənir: #123 (Satış #456)
[ERROR] Printer xətası: Connection timeout
[ERROR] ❌ İş uğursuz: #123 - Connection timeout
```

---

## 🐛 Troubleshooting

### Problem: "❌ Token yanlışdır və ya ləğv edilib!"

**Solution:**
- Token revoked or invalid
- Create new token in admin panel
- Update config.json with new token
- Restart bridge

### Problem: "❌ config.json tapılmadı!"

**Solution:**
```bash
cp config.json.example config.json
# Edit and add your token
nano config.json
```

### Problem: Bridge connects but no jobs processed

**Check:**
1. Is fiscal printing enabled for account?
2. Is printer IP correct in config?
3. Is printer online and reachable?
   ```bash
   ping 192.168.0.45
   ```
4. Check bridge logs for errors

### Problem: "Printer xətası: Connection timeout"

**Solutions:**
- Check printer is turned on
- Verify printer IP address
- Check firewall rules
- Ensure printer and bridge on same network

---

## 🔄 Building Executables

Create standalone executables for deployment:

```bash
# Install pkg globally
npm install -g pkg

# Build all platforms
npm run build

# Or build specific platform
npm run build:win    # Windows
npm run build:mac    # macOS
npm run build:linux  # Linux
```

Output files in `dist/`:
- `xpos-printer-bridge-win.exe` (Windows)
- `xpos-printer-bridge-mac` (macOS)
- `xpos-printer-bridge-linux` (Linux)

**Deploy:**
1. Copy executable to POS terminal
2. Copy config.json to same folder
3. Run executable
4. Done!

---

## 🔐 Security

**Token Security:**
- Token stored in config.json (keep secure!)
- Token grants limited access:
  - ✅ Can poll for print jobs
  - ✅ Can report job status
  - ❌ Cannot access other API endpoints
  - ❌ Cannot see other accounts' data
  - ❌ Cannot create/modify sales

**Token Revocation:**
- Revoke token from admin panel
- Bridge immediately stops working
- Create new token for reconnection

---

## 📦 Deployment Checklist

- [ ] npm install dependencies
- [ ] Copy config.json.example to config.json
- [ ] Create token in admin panel
- [ ] Paste token in config.json
- [ ] Set correct printer IP and port
- [ ] Test: npm start
- [ ] Verify: Bridge registers successfully
- [ ] Test: Create sale with fiscal printing
- [ ] Verify: Receipt prints successfully
- [ ] (Optional) Build executable for production

---

## 🆘 Support

**Logs Location:**
- Bridge logs to console (stdout)
- Redirect to file: `npm start > bridge.log 2>&1`

**Check Bridge Status:**
- Admin Panel → Parametrlər → Bridge Tokenlər
- Shows: 🟢 Online / 🔴 Offline
- Shows: Last seen timestamp
- Shows: Bridge version

**Common Commands:**
```bash
# Start bridge
npm start

# Start with debug logging
# Edit config.json: "logLevel": "debug"
npm start

# Run in background (Linux/Mac)
nohup npm start > bridge.log 2>&1 &

# Stop background process
pkill -f "node index.js"
```

---

## 📝 Version History

**v2.0.0** (2025-11-26)
- Complete rewrite with polling architecture
- No HTTP server needed
- No HTTPS certificates needed
- Token-based authentication
- Automatic retry on failure
- Heartbeat keep-alive
- Better error handling
- Azerbaijani logging

**v1.0.0** (Previous)
- HTTP server on localhost
- HTTPS with self-signed certificates
- Direct client-to-bridge requests

---

## 📄 License

MIT License - ONYX xPos © 2025
