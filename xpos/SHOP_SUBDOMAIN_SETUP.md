# Shop Subdomain Setup Guide

## Overview

The e-commerce shop feature now uses a dedicated subdomain for public customer access:

- **Admin/POS System**: `app.xpos.az`
- **Public Shops**: `shop.xpos.az/{shop-slug}`

Example: If a merchant's shop slug is `boutique-a`, their shop URL will be:
```
https://shop.xpos.az/boutique-a
```

---

## Architecture

```
xpos.az              → Marketing website (separate system)
app.xpos.az          → Admin panel & POS (Laravel app)
shop.xpos.az         → Public e-commerce shops (same Laravel app, different subdomain)
```

---

## Environment Configuration

### 1. Update `.env` file

Add the shop domain configuration:

```env
# Production
APP_URL=https://app.xpos.az
SHOP_DOMAIN=shop.xpos.az

# Local Development
APP_URL=http://localhost:8000
SHOP_DOMAIN=shop.localhost
```

### 2. DNS Configuration (Production)

Add the following DNS records:

| Type | Host | Value |
|------|------|-------|
| A    | shop | Your server IP |
| CNAME | shop | app.xpos.az (alternative) |

### 3. Web Server Configuration

#### Nginx

```nginx
# Admin/POS (app.xpos.az)
server {
    server_name app.xpos.az;
    root /var/www/xpos/public;

    # ... rest of configuration
}

# Public Shops (shop.xpos.az)
server {
    server_name shop.xpos.az;
    root /var/www/xpos/public;

    # ... same configuration as above (same Laravel app)
}
```

#### Apache

```apache
<VirtualHost *:80>
    ServerName app.xpos.az
    DocumentRoot /var/www/xpos/public
    # ... rest of configuration
</VirtualHost>

<VirtualHost *:80>
    ServerName shop.xpos.az
    DocumentRoot /var/www/xpos/public
    # ... same configuration as above
</VirtualHost>
```

### 4. Local Development Setup

Add to your `/etc/hosts` (Linux/Mac) or `C:\Windows\System32\drivers\etc\hosts` (Windows):

```
127.0.0.1  shop.localhost
```

---

## How It Works

### Backend (Routes)

The routes use subdomain routing in `routes/web.php`:

```php
Route::domain(config('app.shop_domain'))
    ->prefix('{shop_slug}')
    ->name('shop.')
    ->middleware(['throttle:60,1'])
    ->group(function () {
        Route::get('/', [PublicShopController::class, 'index'])->name('home');
        Route::get('/product/{id}', [PublicShopController::class, 'show'])->name('product');
        // ...
    });
```

### URL Generation

The `Account` model generates shop URLs automatically:

```php
$account->getShopUrl();
// Returns: https://shop.xpos.az/boutique-a
```

### Frontend Display

Shop URLs are displayed in:
1. **Shop Settings Page** (`/shop-settings`) - Shows the full shop URL
2. **Integrations Page** (`/integrations`) - Displays shop URL when active

---

## Testing

### 1. Local Testing

```bash
# Start Laravel server
php artisan serve

# Visit admin panel
http://localhost:8000

# Visit shop (add to /etc/hosts first)
http://shop.localhost:8000/your-shop-slug
```

### 2. Production Testing

```bash
# Test admin panel
https://app.xpos.az

# Test shop
https://shop.xpos.az/your-shop-slug
```

---

## Troubleshooting

### Shop URL not working

1. **Check DNS**: Ensure `shop.xpos.az` resolves to your server
   ```bash
   nslookup shop.xpos.az
   ```

2. **Check Web Server**: Verify virtual host is configured correctly
   ```bash
   # Nginx
   nginx -t

   # Apache
   apachectl -t
   ```

3. **Check Environment**: Verify `.env` has correct `SHOP_DOMAIN`
   ```bash
   php artisan config:cache
   php artisan config:clear
   ```

### Local development issues

1. **Add to hosts file**:
   ```bash
   sudo nano /etc/hosts
   # Add: 127.0.0.1  shop.localhost
   ```

2. **Clear cache**:
   ```bash
   php artisan route:clear
   php artisan config:clear
   php artisan cache:clear
   ```

3. **Use port in URL** (if running `php artisan serve`):
   ```
   http://shop.localhost:8000/your-shop-slug
   ```

---

## Security Considerations

1. **SSL Certificate**: Ensure both `app.xpos.az` and `shop.xpos.az` have valid SSL certificates
   - Use wildcard certificate: `*.xpos.az`
   - Or separate certificates for each subdomain

2. **CORS**: Not required as both subdomains serve from the same Laravel application

3. **Session Domain**: Sessions work across subdomains when `SESSION_DOMAIN` is set to `.xpos.az`

---

## Migration Notes

### Before (Old Structure)
```
app.xpos.az/shop/boutique-a  ❌ Mixing admin and public URLs
```

### After (New Structure)
```
app.xpos.az              → Admin/POS only
shop.xpos.az/boutique-a  → Public shop
```

No database migration required - only routing and environment changes.
