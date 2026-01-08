# MySQL Server Setup - Separate VPS

**Server:** Netcup VPS 200 (2 CPU, 4GB RAM)
**Purpose:** Host 3 databases for all xPOS instances

---

## Quick Install

```bash
# SSH to MySQL VPS
ssh root@YOUR_MYSQL_VPS_IP

# Update system
apt update && apt upgrade -y

# Install MySQL 8
apt install mysql-server -y

# Secure installation
mysql_secure_installation
# Answer YES to all prompts, set strong root password
```

---

## Configure for Production

```bash
# Edit MySQL config
nano /etc/mysql/mysql.conf.d/mysqld.cnf
```

Add/modify these settings:

```ini
[mysqld]
# Network
bind-address            = 0.0.0.0    # Allow remote connections
max_connections         = 150

# Performance (for 4GB RAM VPS)
innodb_buffer_pool_size = 2G         # 50% of RAM - CRITICAL!
innodb_log_file_size    = 256M
innodb_flush_log_at_trx_commit = 2
innodb_flush_method     = O_DIRECT

# Packet Size
max_allowed_packet      = 64M

# Character Set
character-set-server    = utf8mb4
collation-server        = utf8mb4_unicode_ci
```

Restart MySQL:

```bash
systemctl restart mysql
systemctl status mysql
```

---

## Create Databases & Users

```bash
# Login to MySQL
mysql -u root -p
```

Run these SQL commands:

```sql
-- Create 3 databases
CREATE DATABASE xpos_internal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE xpos_saas1 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE xpos_saas2 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create users (CHANGE PASSWORDS!)
CREATE USER 'xpos_internal'@'%' IDENTIFIED BY 'CHANGE_PASSWORD_1';
CREATE USER 'xpos_saas1'@'%' IDENTIFIED BY 'CHANGE_PASSWORD_2';
CREATE USER 'xpos_saas2'@'%' IDENTIFIED BY 'CHANGE_PASSWORD_3';

-- Grant privileges
GRANT ALL PRIVILEGES ON xpos_internal.* TO 'xpos_internal'@'%';
GRANT ALL PRIVILEGES ON xpos_saas1.* TO 'xpos_saas1'@'%';
GRANT ALL PRIVILEGES ON xpos_saas2.* TO 'xpos_saas2'@'%';

FLUSH PRIVILEGES;
SHOW DATABASES;
EXIT;
```

---

## Configure Firewall

```bash
# Install UFW
apt install ufw -y

# Allow MySQL only from K3s server IP
ufw allow from 194.36.146.135 to any port 3306

# Allow SSH
ufw allow 22/tcp

# Enable firewall
ufw enable
ufw status
```

---

## Test Connection

From K3s server:

```bash
# Test connection
mysql -h YOUR_MYSQL_VPS_IP -u xpos_internal -p

# Should connect successfully!
```

---

## Setup Daily Backups

```bash
# Create backup directory
mkdir -p /backup/mysql

# Create backup script
cat > /root/mysql-backup.sh <<'EOF'
#!/bin/bash
BACKUP_DIR="/backup/mysql"
DATE=$(date +%Y%m%d_%H%M%S)
MYSQL_USER="root"
MYSQL_PASS="YOUR_ROOT_PASSWORD"

mkdir -p $BACKUP_DIR

for DB in xpos_internal xpos_saas1 xpos_saas2; do
    mysqldump -u $MYSQL_USER -p$MYSQL_PASS $DB | gzip > $BACKUP_DIR/${DB}_${DATE}.sql.gz
done

# Keep only last 7 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

# Make executable
chmod +x /root/mysql-backup.sh

# Test backup
/root/mysql-backup.sh

# Add to crontab (backup at 3 AM daily)
(crontab -l 2>/dev/null; echo "0 3 * * * /root/mysql-backup.sh >> /var/log/mysql-backup.log 2>&1") | crontab -
```

---

## Verification

```bash
# Check InnoDB buffer pool
mysql -u root -p -e "SHOW VARIABLES LIKE 'innodb_buffer_pool_size';"
# Should show: 2147483648 (2GB)

# Check max connections
mysql -u root -p -e "SHOW VARIABLES LIKE 'max_connections';"
# Should show: 150
```

---

## Update Helm Values

After MySQL is installed, update your values files:

```yaml
# For each instance:
config:
  database:
    host: "YOUR_MYSQL_VPS_IP"
    port: 3306
    database: xpos_saas1  # or xpos_internal, xpos_saas2
    username: xpos_saas1

secrets:
  databasePassword: "YOUR_DB_PASSWORD"
```

---

## MySQL is Ready! ✅

Your MySQL server can now:
- Handle 100+ concurrent users
- Store 50GB+ of data
- Process 1000+ queries/second
- Auto-backup daily

**Resources:** 2 CPU, 4GB RAM (2GB for InnoDB)
**Databases:** 3 (internal, saas1, saas2)
