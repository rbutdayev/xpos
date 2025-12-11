#!/bin/bash
# Watch Laravel logs in real-time

SERVER_IP="20.218.170.234"
SSH_USER="onyx"
SSH_PASS="QFxOxVYJ4SPiPC"

echo "Watching Laravel logs... (Press Ctrl+C to stop)"
echo "Now try uploading your file..."
echo ""

sshpass -p "$SSH_PASS" ssh -o StrictHostKeyChecking=no "$SSH_USER@$SERVER_IP" \
    "sudo tail -f /var/www/xpos/storage/logs/laravel.log"
