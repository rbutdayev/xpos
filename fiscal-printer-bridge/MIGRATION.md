# Migration Guide: Domain Change

## API URL Update (xpos.az → app.xpos.az)

The XPOS API has moved from `https://xpos.az` to `https://app.xpos.az`.

### For Node.js Bridge Users

If you're running the bridge via `node index.js`, update your `config.json`:

1. Open your `config.json` file
2. Change the `apiUrl` from:
   ```json
   "apiUrl": "https://xpos.az"
   ```
   to:
   ```json
   "apiUrl": "https://app.xpos.az"
   ```
3. Save and restart the bridge

### For Desktop App Users

1. Open the XPOS Printer Bridge app
2. Click the ⚙️ Settings button
3. The API URL field should already show `https://app.xpos.az`
4. If it shows the old URL, manually update it
5. Click Save and restart the app

### Automatic Update

New installations and the latest desktop app will automatically use `https://app.xpos.az`.

### Verification

After updating, check the logs. You should see:
```
✅ Connected to API: https://app.xpos.az
```

If you see connection errors, verify:
1. Your internet connection
2. The API URL is correct: `https://app.xpos.az`
3. Your bridge token is still valid
