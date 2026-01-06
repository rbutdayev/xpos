# Quick Start - Electron Integration

## Immediate Testing (5 Minutes)

### Step 1: Install Missing Dependencies
```bash
cd /Users/ruslan/projects/xpos/xpos/kiosk-app
npm install electron-store cross-env wait-on
```

### Step 2: Build Electron
```bash
npm run build:electron
```

### Step 3: Start Development
```bash
# Terminal 1: Start Vite dev server + Electron compiler
npm run dev

# Terminal 2: Start Electron app
npm start
```

**Alternative (all-in-one):**
```bash
npm run electron:dev
```

### Step 4: Verify App Works

The app should:
1. Open a window
2. Show React UI
3. Initialize SQLite database
4. Register IPC handlers

**Check Console:**
- "Opening database: /path/to/kiosk.db"
- "Database opened successfully"
- "Running database migrations..."
- "IPC handlers registered successfully"

### Step 5: Test IPC in DevTools

Open DevTools (F12) and test:

```javascript
// Test 1: Get config (should return null - not registered yet)
await window.ipc.getConfig()
// Expected: null

// Test 2: Get database statistics
await window.ipcUtils.getStatistics()
// Expected: { productsCount: 0, customersCount: 0, ... }

// Test 3: Search products (empty database)
await window.ipc.searchProducts('test')
// Expected: []

// Test 4: Check sync status
await window.ipc.getSyncStatus()
// Expected: { is_online: false, queued_sales_count: 0, ... }
```

### Step 6: Register Device (Optional)

If you have a backend running with kiosk token:

```javascript
// In DevTools console
const config = await window.ipc.registerDevice(
  'your-kiosk-token-here',
  'http://localhost:8000',
  'Test-Kiosk-1'
);

console.log('Registered:', config);
```

After registration, services will auto-start and begin syncing.

## Build for Production

```bash
# Build everything
npm run build

# Create Windows installer
npm run package:win

# Create macOS installer
npm run package:mac

# Output location
ls -la dist-electron/
```

## Troubleshooting

### Issue: "Cannot find module 'electron-store'"
**Solution:**
```bash
npm install electron-store
```

### Issue: "Cannot find module 'better-sqlite3'"
**Solution:**
```bash
npm rebuild better-sqlite3 --build-from-source
# or
./node_modules/.bin/electron-rebuild
```

### Issue: "Failed to load URL"
**Solution:**
Make sure Vite dev server is running (port 5173)
```bash
npm run dev:renderer
```

### Issue: Database locked
**Solution:**
```bash
# Close all instances of the app
# Delete WAL files
rm ~/Library/Application\ Support/xpos-kiosk/kiosk.db-wal
rm ~/Library/Application\ Support/xpos-kiosk/kiosk.db-shm
```

### Issue: TypeScript compilation errors
**Solution:**
```bash
# Check TypeScript version
npx tsc --version

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## Database Location

**Windows:**
```
%APPDATA%\xpos-kiosk\kiosk.db
```

**macOS:**
```
~/Library/Application Support/xpos-kiosk/kiosk.db
```

**Linux:**
```
~/.config/xpos-kiosk/kiosk.db
```

## Verify Database

```bash
# macOS/Linux
sqlite3 ~/Library/Application\ Support/xpos-kiosk/kiosk.db

# Windows
sqlite3 "%APPDATA%\xpos-kiosk\kiosk.db"

# Commands:
.tables          # List all tables
.schema products # Show table schema
SELECT COUNT(*) FROM products;
SELECT * FROM sync_metadata;
```

## Expected Database Tables

After first run, you should see:
```sql
sqlite> .tables
app_config      fiscal_config   sales_queue
customers       products        sync_metadata
```

## Directory Structure Check

```bash
# Verify electron directory exists
ls -la electron/
# Should show: main.ts, database.ts, ipc-handlers.ts, preload.ts

# Verify compiled output after build
ls -la dist/electron/
# Should show: main.js, database.js, ipc-handlers.js, preload.js

# Verify renderer output after build
ls -la dist/renderer/
# Should show: index.html, assets/, etc.
```

## Development Workflow

1. **Make changes to Electron code:**
   - Edit `electron/*.ts`
   - Restart Electron: `Ctrl+C` then `npm start`

2. **Make changes to React code:**
   - Edit `src/renderer/**/*`
   - Hot reload happens automatically (Vite HMR)

3. **Make changes to services:**
   - Edit `src/main/services/*.ts`
   - Restart Electron: `Ctrl+C` then `npm start`

## Success Indicators

✅ **App launches without errors**
✅ **Window appears with React UI**
✅ **Console shows database initialization**
✅ **DevTools can call window.ipc methods**
✅ **Database file created in userData directory**
✅ **IPC handlers respond correctly**

## Next Steps

1. Test with real backend (register device)
2. Test product sync
3. Test customer sync
4. Test offline sale creation
5. Test fiscal printer integration
6. Build production installer
7. Deploy to test environment

## Support

For detailed documentation, see:
- **ELECTRON_INTEGRATION.md** - Full technical documentation
- **DELIVERY_SUMMARY.md** - Implementation summary
- **KIOSK_IMPLEMENTATION.md** - Original project plan

---

**Ready to go!** The Electron integration is complete and ready for testing.
