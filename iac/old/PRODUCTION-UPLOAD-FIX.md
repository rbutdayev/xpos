# Production File Upload Fix (502 Bad Gateway)

## Problem
Getting **502 Bad Gateway** error when uploading files (5.7MB) to production at `app.xpos.az`.

## Root Cause
The production server's PHP upload limits are too restrictive (default 2M), and nginx timeouts were insufficient for larger file uploads.

## Solution

### 1. Fix PHP Upload Limits (Required)

Run the PHP configuration script to update upload limits on the production server:

```bash
cd /Users/ruslan/projects/xpos/iac/scripts
./06-configure-php-upload.sh
```

This script will:
- Set `upload_max_filesize = 20M`
- Set `post_max_size = 25M`
- Set `max_execution_time = 300` (5 minutes)
- Set `memory_limit = 512M` (for large Excel file processing)
- **Automatically restart PHP-FPM** to apply changes

### 2. Deploy Updated Nginx Configuration (Required)

Deploy the updated nginx configuration with increased timeouts:

```bash
cd /Users/ruslan/projects/xpos/iac/scripts
./deploy-nginx-config.sh
```

This will:
- Update `client_max_body_size = 25M`
- Update `client_body_timeout = 300s`
- Increase proxy timeouts to 300s (5 minutes)
- Reload nginx

### 3. Verify the Fix

After completing steps 1 and 2, test the import again:

1. Go to https://app.xpos.az
2. Try uploading your 5.7MB file
3. The upload should now complete successfully

### 4. Check Logs (If Still Having Issues)

If you still get errors, check the logs:

```bash
# SSH to server
ssh onyx@20.218.139.129

# Check nginx error logs
sudo tail -f /var/log/nginx/prod_xpos_error.log

# Check your application logs
cd ~/apps/xpos
tail -f storage/logs/laravel.log
```

## What Changed

### Frontend Changes
- Added client-side file size validation (10MB max) in `ProductImportModal.tsx`
- Shows user-friendly error before upload if file is too large

### Backend Changes
- Created `.user.ini` in `xpos/public/` for local development
- Updated nginx production config with higher limits and timeouts

### Infrastructure Changes
- Created `06-configure-php-upload.sh` - Updates PHP settings on production server
- Created `deploy-nginx-config.sh` - Deploys nginx config to production
- Updated `prod.xpos.conf` - Increased upload limits and timeouts

## File Size Limits Summary

| Environment | Max File Size | Configuration |
|-------------|--------------|---------------|
| Development | 10MB | `.user.ini` (or manually update `php.ini`) |
| Production | 20MB | Applied via `06-configure-php-upload.sh` |
| Client-side | 10MB | Validated in `ProductImportModal.tsx` |
| Nginx | 25MB | Set in `prod.xpos.conf` |

## Notes

- The client-side validation (10MB) is intentionally lower than server limits to provide early feedback
- PHP `post_max_size` should always be larger than `upload_max_filesize`
- Nginx `client_max_body_size` should be larger than PHP `post_max_size`
- Timeouts set to 300s (5 minutes) to handle slow connections
