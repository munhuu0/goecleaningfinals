# 🚀 GoeCleaning Hostinger VPS Deployment Guide

## 📋 Prerequisites

- Hostinger VPS account with SSH access
- Domain name pointed to VPS IP
- MySQL database access
- Node.js 18+ installed on VPS
- PM2 process manager

## 🔧 Step 1: VPS Setup

### SSH into your Hostinger VPS:
```bash
ssh root@your_vps_ip
```

### Install Node.js and dependencies:
```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Verify installation
node --version
npm --version

# Install PM2 globally
npm install -g pm2

# Install Nginx (if not installed)
apt install nginx -y
```

### Install MySQL (if not already installed):
```bash
# Install MySQL
apt install mysql-server -y

# Secure MySQL
mysql_secure_installation

# Create database and user
mysql -u root -p
```

```sql
CREATE DATABASE goecleaning CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'goecleaning_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON goecleaning.* TO 'goecleaning_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## 📁 Step 2: Upload Files

### Option A: Using SCP (Recommended)
```bash
# On your local machine
scp -r /path/to/goecleaning root@your_vps_ip:/var/www/
```

### Option B: Using Git (if repository exists)
```bash
# On VPS
cd /var/www/
git clone https://github.com/your-username/goecleaning.git
cd goecleaning
```

### Option C: Using File Manager
- Upload files via Hostinger File Manager to `/var/www/goecleaning/`

## ⚙️ Step 3: Configure Environment

### Create production .env file:
```bash
cd /var/www/goecleaning
cp .env.production .env
nano .env
```

Update with your actual values:
```bash
NODE_ENV=production
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=goecleaning
DB_USER=goecleaning_user
DB_PASSWORD=your_secure_password
FRONTEND_URL=https://yourdomain.com
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
ADMIN_PASSWORD=CHANGE_THIS_SECURE_PASSWORD
```

## 🔒 Step 4: SSL Certificate Setup

### Install Certbot:
```bash
apt install certbot python3-certbot-nginx -y
```

### Generate SSL certificate:
```bash
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### Set up auto-renewal:
```bash
crontab -e
```
Add this line:
```bash
0 12 * * * /usr/bin/certbot renew --quiet
```

## 🚀 Step 5: Deploy Application

### Install dependencies:
```bash
cd /var/www/goecleaning
npm ci --production
```

### Create necessary directories:
```bash
mkdir -p logs uploads/portfolio uploads/backup
chmod 755 logs uploads uploads/portfolio uploads/backup
```

### Start with PM2:
```bash
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### Verify deployment:
```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs goecleaning

# Test health endpoint
curl http://localhost:3000/health
```

## 🌐 Step 6: Configure Nginx

### Create Nginx site configuration:
```bash
nano /etc/nginx/sites-available/goecleaning
```

Paste the nginx.conf content (update paths and domain):
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;
    
    # File Upload Size Limit
    client_max_body_size 10M;
    
    # Static Files
    location / {
        root /var/www/goecleaning/public;
        try_files $uri $uri/ /index.html;
        
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API Proxy to Node.js
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Admin Panel
    location /admin {
        root /var/www/goecleaning/public;
        try_files $uri $uri/ /admin.html;
    }
    
    # File Uploads
    location /uploads/ {
        alias /var/www/goecleaning/uploads/;
        expires 1y;
        add_header Cache-Control "public";
    }
    
    # Health Check
    location /health {
        proxy_pass http://localhost:3000/health;
        access_log off;
    }
}
```

### Enable the site:
```bash
ln -s /etc/nginx/sites-available/goecleaning /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

## 🧪 Step 7: Test Deployment

### Test website functionality:
```bash
# Test main website
curl -I https://yourdomain.com

# Test API endpoints
curl https://yourdomain.com/api/services
curl https://yourdomain.com/api/portfolio

# Test health check
curl https://yourdomain.com/health
```

### Test admin panel:
1. Visit `https://yourdomain.com/admin.html`
2. Login with your admin password
3. Test order management
4. Test portfolio uploads

### Test contact form:
1. Submit a test contact form
2. Check if it appears in admin panel
3. Verify email notifications (if configured)

## 📊 Step 8: Monitoring & Maintenance

### PM2 Monitoring:
```bash
# Monitor application
pm2 monit

# View logs
pm2 logs goecleaning

# Restart application
pm2 restart goecleaning

# View detailed info
pm2 show goecleaning
```

### Set up log rotation:
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size=10M
pm2 set pm2-logrotate:retain=30
```

### Database backup script:
```bash
nano /var/www/goecleaning/backup.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u goecleaning_user -p'your_password' goecleaning > /var/www/backups/goecleaning_$DATE.sql
find /var/www/backups -name "*.sql" -mtime +7 -delete
```

```bash
chmod +x backup.sh
crontab -e
# Add: 0 2 * * * /var/www/goecleaning/backup.sh
```

## 🔧 Troubleshooting

### Common Issues:

#### 1. Port already in use:
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 PID

# Or change port in .env
PORT=3001
```

#### 2. Database connection error:
```bash
# Check MySQL status
systemctl status mysql

# Test database connection
mysql -u goecleaning_user -p goecleaning

# Check credentials in .env
cat .env | grep DB_
```

#### 3. Permission denied:
```bash
# Fix file permissions
chown -R www-data:www-data /var/www/goecleaning
chmod -R 755 /var/www/goecleaning
chmod -R 777 /var/www/goecleaning/uploads
```

#### 4. Nginx errors:
```bash
# Test Nginx configuration
nginx -t

# Check Nginx logs
tail -f /var/log/nginx/error.log

# Restart Nginx
systemctl restart nginx
```

#### 5. PM2 issues:
```bash
# Delete PM2 process
pm2 delete goecleaning

# Start fresh
pm2 start ecosystem.config.js --env production

# View PM2 logs
pm2 logs --lines 100
```

## 📱 Performance Optimization

### Enable caching:
```bash
# Add to Nginx config
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### Monitor resources:
```bash
# Check memory usage
free -h

# Check disk usage
df -h

# Check CPU usage
top
```

### Database optimization:
```sql
-- Add indexes to frequently queried columns
CREATE INDEX idx_contacts_status ON contacts(status);
CREATE INDEX idx_portfolios_featured ON portfolios(featured);
```

## 🔒 Security Checklist

- [ ] Change default admin password
- [ ] Use strong database password
- [ ] Enable HTTPS with valid SSL certificate
- [ ] Configure firewall (ufw)
- [ ] Keep dependencies updated
- [ ] Set up regular backups
- [ ] Monitor logs for suspicious activity
- [ ] Disable directory listing
- [ ] Use environment variables for secrets

## 📞 Support

If you encounter issues:

1. **Check logs**: `pm2 logs goecleaning`
2. **Check health**: `curl https://yourdomain.com/health`
3. **Restart services**: `pm2 restart goecleaning && systemctl restart nginx`
4. **Verify configuration**: Check .env and nginx.conf

## 🎯 Success Metrics

Your deployment is successful when:
- ✅ Website loads at https://yourdomain.com
- ✅ All API endpoints respond correctly
- ✅ Admin panel is accessible and functional
- ✅ Contact form submissions work
- ✅ File uploads work
- ✅ SSL certificate is active
- ✅ PM2 shows app as "online"
- ✅ No errors in logs

---

**🎉 Congratulations! Your GoeCleaning website is now live on Hostinger VPS!**
