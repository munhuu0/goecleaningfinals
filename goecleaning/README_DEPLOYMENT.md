# 🚀 GoeCleaning - Ready for Hostinger Deployment

## 📦 What's Included

This package contains everything you need to deploy GoeCleaning to Hostinger VPS:

### 📁 Application Files
- `server.js` - Main application server
- `package.json` - Dependencies and scripts
- `ecosystem.config.js` - PM2 configuration
- `.env.production` - Production environment template

### 📁 Frontend Files
- `public/` - Complete frontend with Mongolian language support
- `admin.html` - Admin panel interface
- All CSS, JavaScript, and image assets

### 📁 Backend Routes
- `routes/` - All API endpoints (services, portfolio, contact, admin)
- `models/` - Sequelize database models
- `utils/` - Shared utilities and temporary storage

### 📁 Configuration Files
- `nginx.conf` - Nginx configuration template
- `DATABASE_SETUP.sql` - Database setup script
- `DEPLOYMENT_GUIDE.md` - Complete deployment instructions
- `DEPLOYMENT_CHECKLIST.md` - Step-by-step verification

### 📁 Deployment Scripts
- `deploy.sh` - Deployment preparation script
- `start-production.sh` - Production startup script

## 🔧 Ready-to-Deploy Features

### ✅ Complete Functionality
- **Website**: Fully responsive Mongolian cleaning service website
- **Admin Panel**: Secure admin dashboard with authentication
- **Contact Form**: Working contact form with order management
- **Portfolio**: Image upload and management system
- **API**: Complete REST API for all features

### ✅ Production Optimizations
- **Security**: Helmet, CORS, rate limiting, authentication
- **Performance**: Gzip compression, caching, clustering
- **Monitoring**: Health checks, logging, error handling
- **Graceful Shutdown**: Proper cleanup on server restart

### ✅ Database Ready
- **MySQL Integration**: Complete Sequelize models
- **Fallback Storage**: Temporary storage when DB unavailable
- **Auto-Sync**: Database schema automatically created

## 🚀 Quick Deployment Steps

### 1. Upload Files to Hostinger
Upload ALL files to `/var/www/goecleaning/` on your Hostinger VPS

### 2. Configure Environment
```bash
cd /var/www/goecleaning
cp .env.production .env
nano .env  # Update with your actual values
```

### 3. Install Dependencies
```bash
npm ci --production
npm install -g pm2
```

### 4. Start Application
```bash
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### 5. Configure Nginx
Copy `nginx.conf` content to `/etc/nginx/sites-available/goecleaning`

## 🔑 Important Configuration

### Environment Variables (.env)
```bash
NODE_ENV=production
PORT=3000
DB_HOST=localhost
DB_NAME=goecleaning
DB_USER=your_db_user
DB_PASSWORD=your_db_password
FRONTEND_URL=https://yourdomain.com
ADMIN_PASSWORD=CHANGE_THIS_PASSWORD
```

### Database Setup
1. Create MySQL database `goecleaning`
2. Run `DATABASE_SETUP.sql` or let auto-sync handle it
3. Update database credentials in `.env`

### SSL Certificate
```bash
certbot --nginx -d yourdomain.com
```

## 🧪 Testing Your Deployment

### Health Check
```bash
curl https://yourdomain.com/health
```

### Website Test
Visit `https://yourdomain.com`

### Admin Panel Test
Visit `https://yourdomain.com/admin.html`
Login with your admin password

### API Test
```bash
curl https://yourdomain.com/api/services
curl https://yourdomain.com/api/portfolio
```

## 📊 Monitoring

### PM2 Commands
```bash
pm2 status          # Check status
pm2 logs            # View logs
pm2 monit           # Monitor resources
pm2 restart         # Restart app
```

### Health Endpoint
`https://yourdomain.com/health` - Returns app status and metrics

## 🔧 Troubleshooting

### Common Issues
1. **Port conflicts**: Change PORT in .env
2. **Database errors**: Check DB credentials in .env
3. **Permission errors**: Fix file permissions
4. **SSL issues**: Check certificate configuration

### Log Locations
- Application logs: `logs/combined.log`
- Error logs: `logs/error.log`
- PM2 logs: `pm2 logs goecleaning`

## 📞 Support

### Complete Documentation
- `DEPLOYMENT_GUIDE.md` - Step-by-step deployment guide
- `DEPLOYMENT_CHECKLIST.md` - Verification checklist
- `nginx.conf` - Nginx configuration template

### Pre-Deployment Checklist
- [ ] Update FRONTEND_URL in .env
- [ ] Change ADMIN_PASSWORD in .env
- [ ] Verify database credentials
- [ ] Test all functionality locally
- [ ] Backup existing files if updating

## 🎯 Success Metrics

Your deployment is successful when:
- ✅ Website loads at your domain
- ✅ All API endpoints work
- ✅ Admin panel is functional
- ✅ Contact form submissions work
- ✅ File uploads work
- ✅ SSL certificate is active
- ✅ PM2 shows app as online

## 🎉 Ready to Go!

This GoeCleaning application is **production-ready** and includes:
- Complete website with Mongolian language support
- Secure admin panel with order management
- File upload system for portfolio
- Contact form with temporary storage fallback
- Security middleware and authentication
- Production optimizations and monitoring
- Complete deployment documentation

**Just upload to Hostinger, configure your environment, and you're live!** 🚀
