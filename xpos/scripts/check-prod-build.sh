#!/bin/bash

# Quick diagnostic script to check production build status
# Run this on the production server after deployment

APP_PATH="/var/www/xpos"

echo "=== XPOS Production Build Diagnostics ==="
echo ""

echo "1. Checking build manifest..."
if [ -f "$APP_PATH/public/build/manifest.json" ]; then
    echo "✅ Build manifest exists: $APP_PATH/public/build/manifest.json"
    echo "   Manifest contents:"
    cat "$APP_PATH/public/build/manifest.json"
else
    echo "❌ Build manifest NOT FOUND!"
    echo "   Expected: $APP_PATH/public/build/manifest.json"
fi

echo ""
echo "2. Checking build assets..."
if [ -d "$APP_PATH/public/build/assets" ]; then
    echo "✅ Build assets directory exists"
    echo "   Files:"
    ls -lh "$APP_PATH/public/build/assets/" | head -10
else
    echo "❌ Build assets directory NOT FOUND!"
fi

echo ""
echo "3. Checking environment settings..."
if [ -f "$APP_PATH/.env" ]; then
    echo "✅ .env file exists"
    echo "   APP_ENV: $(grep ^APP_ENV= $APP_PATH/.env)"
    echo "   APP_DEBUG: $(grep ^APP_DEBUG= $APP_PATH/.env)"
    echo "   APP_URL: $(grep ^APP_URL= $APP_PATH/.env)"
else
    echo "❌ .env file NOT FOUND!"
fi

echo ""
echo "4. Checking Laravel cache..."
echo "   Config cache: $([ -f "$APP_PATH/bootstrap/cache/config.php" ] && echo '✅ exists' || echo '❌ missing')"
echo "   Route cache: $([ -f "$APP_PATH/bootstrap/cache/routes-v7.php" ] && echo '✅ exists' || echo '❌ missing')"

echo ""
echo "5. Testing HTTP response..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost)
echo "   HTTP Status: $HTTP_CODE"
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "302" ]; then
    echo "   ✅ Application is responding"
else
    echo "   ❌ Application may not be responding correctly"
fi

echo ""
echo "6. Checking recent Laravel logs..."
if [ -f "$APP_PATH/storage/logs/laravel.log" ]; then
    echo "   Last 10 log entries:"
    tail -10 "$APP_PATH/storage/logs/laravel.log"
else
    echo "   ℹ️  No log file found"
fi

echo ""
echo "=== Diagnostics Complete ==="
