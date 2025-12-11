 

Supervisor is NOT installed. We need to set it up.

  Important: Supervisor is needed regardless of Redis/database. It's what keeps queue workers running.

  ---
  Install & Configure Now:

  # 1. Install Supervisor
  sudo apt update
  sudo apt install supervisor -y

  # 2. Create worker config
  sudo nano /etc/supervisor/conf.d/xpos-worker.conf

  Paste this:
  [program:xpos-worker]
  process_name=%(program_name)s_%(process_num)02d
  command=php /var/www/xpos/artisan queue:work redis --sleep=3 --tries=1 --max-time=3600
  autostart=true
  autorestart=true
  stopasflags=TERM
  user=www-data
  numprocs=2
  redirect_stderr=true
  stdout_logfile=/var/www/xpos/storage/logs/worker.log
  stopwaitsecs=3600

  Save & Exit: Ctrl+X → Y → Enter

  # 3. Start Supervisor
  sudo supervisorctl reread
  sudo supervisorctl update
  sudo supervisorctl start xpos-worker:*

  # 4. Check status
  sudo supervisorctl status

  Should show RUNNING. Show me the output.