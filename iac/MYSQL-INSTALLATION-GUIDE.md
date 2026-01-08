# MySQL Installation Guide - Ubuntu 22.04/24.04
**Target:** Netcup VPS 200 (2 CPU, 4GB RAM, 80GB SSD)
**Purpose:** Host 3 databases for xPOS (internal + 2 SaaS)

---

## Step 1: Update System

```bash
# SSH to your MySQL VPS
ssh root@your-mysql-server-ip

# Update packages
apt update && apt upgrade -y
```

---

## Step 2: Install MySQL 8.0

```bash
# Install MySQL server
apt install mysql-server -y

# Check MySQL is running
systemctl status mysql

# Should show: active (running) ✅
```

---

## Step 3: Secure MySQL Installation

```bash
# Run security script
mysql_secure_installation

# Answer the prompts:
# 1. Set root password? YES → Enter a strong password
# 2. Remove anonymous users? YES
# 3. Disallow root login remotely? NO (we'll configure firewall)
# 4. Remove test database? YES
# 5. Reload privilege tables? YES
```

---

## Step 4: Configure MySQL for Production

### Create optimized configuration:

```bash
# Backup original config
cp /etc/mysql/mysql.conf.d/mysqld.cnf /etc/mysql/mysql.conf.d/mysqld.cnf.backup

# Edit MySQL config
nano /etc/mysql/mysql.conf.d/mysqld.cnf
```

### Add/modify these settings:

```ini
[mysqld]
# Basic Settings
user                    = mysql
pid-file                = /var/run/mysqld/mysqld.pid
socket                  = /var/run/mysqld/mysqld.sock
port                    = 3306
datadir                 = /var/lib/mysql

# Network Settings
bind-address            = 0.0.0.0    # Allow external connections
max_connections         = 150        # Enough for 3 instances

# InnoDB Settings (Performance)
innodb_buffer_pool_size = 2G         # 50% of 4GB RAM - MOST IMPORTANT!
innodb_log_file_size    = 256M       # Transaction log size
innodb_flush_log_at_trx_commit = 2   # Better performance, still safe
innodb_flush_method     = O_DIRECT   # Avoid double buffering

# Query Cache (Disabled in MySQL 8.0)
# query_cache_size      = 0          # Not needed, removed in MySQL 8

# Packet Size
max_allowed_packet      = 64M        # For large queries/data

# Logging
log_error               = /var/log/mysql/error.log
slow_query_log          = 1
slow_query_log_file     = /var/log/mysql/slow.log
long_query_time         = 2          # Log queries taking > 2 seconds

# Character Set
character-set-server    = utf8mb4
collation-server        = utf8mb4_unicode_ci

# Timezone
default-time-zone       = '+00:00'   # UTC
```

Save and exit (`Ctrl+O`, `Enter`, `Ctrl+X`)

---

## Step 5: Restart MySQL

```bash
# Restart to apply config
systemctl restart mysql

# Check status
systemctl status mysql

# Should show: active (running) ✅
```

---

## Step 6: Create Databases and Users

```bash
# Login to MySQL
mysql -u root -p
# Enter the root password you set
```

### Run these SQL commands:

```sql
-- Create databases
CREATE DATABASE xpos_internal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE xpos_saas1 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE xpos_saas2 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create users (change passwords!)
CREATE USER 'xpos_internal'@'%' IDENTIFIED BY 'STRONG_PASSWORD_HERE_1';
CREATE USER 'xpos_saas1'@'%' IDENTIFIED BY 'STRONG_PASSWORD_HERE_2';
CREATE USER 'xpos_saas2'@'%' IDENTIFIED BY 'STRONG_PASSWORD_HERE_3';

-- Grant privileges
GRANT ALL PRIVILEGES ON xpos_internal.* TO 'xpos_internal'@'%';
GRANT ALL PRIVILEGES ON xpos_saas1.* TO 'xpos_saas1'@'%';
GRANT ALL PRIVILEGES ON xpos_saas2.* TO 'xpos_saas2'@'%';

-- Apply changes
FLUSH PRIVILEGES;

-- Verify databases
SHOW DATABASES;

-- You should see:
-- +--------------------+
-- | Database           |
-- +--------------------+
-- | xpos_internal      |
-- | xpos_saas1         |
-- | xpos_saas2         |
-- +--------------------+

-- Exit
EXIT;
```

---

## Step 7: Configure Firewall

```bash
# Allow MySQL port from your K3s server only
ufw allow from YOUR_K3S_SERVER_IP to any port 3306

# Enable firewall
ufw enable

# Check status
ufw status

# Should show:
# To                         Action      From
# --                         ------      ----
# 3306                       ALLOW       YOUR_K3S_SERVER_IP
```

---

## Step 8: Test Connection from K3s Server

```bash
# On your K3s server, test connection
mysql -h YOUR_MYSQL_SERVER_IP -u xpos_internal -p

# Enter password
# If connected successfully, you'll see:
# mysql>

# Test query
SHOW DATABASES;

# Exit
EXIT;
```

---

## Step 9: Verify Configuration

```bash
# Check InnoDB buffer pool size
mysql -u root -p -e "SHOW VARIABLES LIKE 'innodb_buffer_pool_size';"

# Should show: 2147483648 (2GB in bytes) ✅

# Check max connections
mysql -u root -p -e "SHOW VARIABLES LIKE 'max_connections';"

# Should show: 150 ✅

# Check current memory usage
mysql -u root -p -e "SHOW STATUS LIKE 'Innodb_buffer_pool_pages_data';"
```

---

## Step 10: Enable Automatic Backups (IMPORTANT!)

### Create backup script:

```bash
# Create backup directory
mkdir -p /backup/mysql

# Create backup script
nano /root/mysql-backup.sh
```

### Add this content:

```bash
#!/bin/bash

BACKUP_DIR="/backup/mysql"
DATE=$(date +%Y%m%d_%H%M%S)
MYSQL_USER="root"
MYSQL_PASS="YOUR_ROOT_PASSWORD"

# Create backup directory if not exists
mkdir -p $BACKUP_DIR

# Backup each database
for DB in xpos_internal xpos_saas1 xpos_saas2; do
    mysqldump -u $MYSQL_USER -p$MYSQL_PASS $DB | gzip > $BACKUP_DIR/${DB}_${DATE}.sql.gz
done

# Keep only last 7 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

Save and exit.

```bash
# Make executable
chmod +x /root/mysql-backup.sh

# Test backup
/root/mysql-backup.sh

# Check backups created
ls -lh /backup/mysql/
```

### Setup daily automatic backups:

```bash
# Add to crontab
crontab -e

# Add this line (backup at 3 AM daily):
0 3 * * * /root/mysql-backup.sh >> /var/log/mysql-backup.log 2>&1
```

---

## Step 11: Monitor Performance

### Check MySQL status:

```bash
# Login to MySQL
mysql -u root -p

# Check current connections
SHOW STATUS WHERE Variable_name = 'Threads_connected';

# Check buffer pool usage
SHOW STATUS WHERE Variable_name LIKE 'Innodb_buffer_pool%';

# Check slow queries
SHOW STATUS WHERE Variable_name = 'Slow_queries';

# Exit
EXIT;
```

### Monitor from command line:

```bash
# Install monitoring tool
apt install mytop -y

# Run monitor (enter root password when prompted)
mytop -u root -p

# Press 'q' to quit
```

---

## Configuration Summary

Your MySQL is now configured with:

```yaml
Resources:
  CPU: 2 vCores
  RAM: 4GB (2GB for InnoDB buffer pool)
  Storage: 80GB SSD

Databases:
  - xpos_internal (internal use, 2-3 users)
  - xpos_saas1 (SaaS instance 1, ~50 users)
  - xpos_saas2 (SaaS instance 2, ~50 users)

Configuration:
  innodb_buffer_pool_size: 2GB ✅ (optimal for 4GB RAM)
  max_connections: 150 ✅ (enough for 100 users)
  max_allowed_packet: 64MB ✅ (handles large data)

Backups:
  Daily at 3 AM
  Retention: 7 days
  Location: /backup/mysql/
```

---

## Performance Expectations

With this configuration on VPS 200:

- ✅ **100 concurrent users**: No problem
- ✅ **Database size up to 50GB**: Good performance
- ✅ **~1000 queries/second**: Can handle
- ✅ **Response time < 10ms**: For most queries

---

## Update values-prod.yaml

After MySQL is installed, update your Helm values:

```yaml
# iac/helm/xpos/values-prod.yaml
config:
  database:
    host: "YOUR_MYSQL_SERVER_IP"
    port: 3306
    database: xpos_saas1  # or xpos_saas2, xpos_internal
    username: xpos_saas1  # matching username
```

---

## Troubleshooting

### Can't connect from K3s server:

```bash
# On MySQL server, check if listening on all interfaces
netstat -tlnp | grep 3306

# Should show: 0.0.0.0:3306 (not 127.0.0.1)

# Check firewall
ufw status
```

### MySQL using too much memory:

```bash
# Check current memory usage
free -h

# If MySQL is using more than expected, reduce buffer pool:
nano /etc/mysql/mysql.conf.d/mysqld.cnf

# Change to:
innodb_buffer_pool_size = 1.5G

# Restart
systemctl restart mysql
```

### Slow queries:

```bash
# Check slow query log
tail -100 /var/log/mysql/slow.log

# Analyze queries and add indexes as needed
```

---

## Security Checklist

- [x] Root password set
- [x] Anonymous users removed
- [x] Test database removed
- [x] Firewall configured (only K3s server IP allowed)
- [x] Separate users per database
- [x] Strong passwords used
- [x] Automatic backups configured

---

## Next Steps

1. ✅ Install MySQL (this guide)
2. Test connection from K3s server
3. Update Kubernetes secrets with database credentials
4. Deploy xPOS using PRODUCTION-DEPLOYMENT-GUIDE.md

---

**Your MySQL server is ready for production!** 🚀

Total setup time: ~15 minutes
