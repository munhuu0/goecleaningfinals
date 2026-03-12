#!/bin/bash

# GoeCleaning Hostinger Deployment Script
# This script prepares the application for deployment to Hostinger

echo "🚀 Starting GoeCleaning deployment preparation..."

# Create deployment directory structure
echo "📁 Creating deployment directories..."
mkdir -p logs
mkdir -p uploads/portfolio
mkdir -p uploads/backup

# Set proper permissions
echo "🔐 Setting file permissions..."
chmod 755 logs
chmod 755 uploads
chmod 755 uploads/portfolio
chmod 755 uploads/backup

# Create production .env file from template
echo "⚙️ Creating production environment file..."
if [ ! -f ".env" ]; then
    cp .env.production .env
    echo "✅ Created .env from .env.production"
else
    echo "⚠️ .env already exists, skipping creation"
fi

# Install production dependencies
echo "📦 Installing production dependencies..."
npm ci --production

# Create logs directory structure
echo "📋 Setting up logging..."
touch logs/combined.log
touch logs/out.log
touch logs/error.log

# Create PM2 startup script
echo "🔧 Creating PM2 startup configuration..."
cat > start-production.sh << 'EOF'
#!/bin/bash
# PM2 Production Startup Script

echo "🚀 Starting GoeCleaning in production mode..."

# Start the application with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup

echo "✅ GoeCleaning is now running in production mode!"
echo "📊 Monitor with: pm2 monit"
echo "📋 View logs with: pm2 logs goecleaning"
echo "🔄 Restart with: pm2 restart goecleaning"
EOF

chmod +x start-production.sh

# Create deployment checklist
echo "📋 Creating deployment checklist..."
cat > DEPLOYMENT_CHECKLIST.md << 'EOF'
# GoeCleaning Deployment Checklist

## Pre-Deployment Tasks
- [ ] Update FRONTEND_URL in .env with actual domain
- [ ] Change ADMIN_PASSWORD in .env to secure password
- [ ] Verify database credentials are correct
- [ ] Test all functionality locally

## Hostinger Setup Tasks
- [ ] Upload all files to Hostinger VPS
- [ ] Create MySQL database `goecleaning` on Hostinger
- [ ] Import database schema (auto-sync will handle this)
- [ ] Set domain DNS to point to VPS IP
- [ ] Configure SSL certificate

## Post-Deployment Tasks
- [ ] Run `./start-production.sh` on Hostinger
- [ ] Test website functionality
- [ ] Test admin panel login
- [ ] Test contact form submission
- [ ] Test file uploads
- [ ] Verify HTTPS is working
- [ ] Set up monitoring and backups

## Production Verification
- [ ] Website loads correctly
- [ ] All API endpoints respond
- [ ] Database operations work
- [ ] File uploads work
- [ ] Admin panel functions
- [ ] SSL certificate active
- [ ] Error handling works
EOF

echo "✅ Deployment preparation complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update .env with your actual domain and secure admin password"
echo "2. Upload all files to Hostinger VPS"
echo "3. Run './start-production.sh' on the server"
echo "4. Follow the DEPLOYMENT_CHECKLIST.md for verification"
echo ""
echo "🔗 Important files created:"
echo "- ecosystem.config.js (PM2 configuration)"
echo "- start-production.sh (Production startup script)"
echo "- DEPLOYMENT_CHECKLIST.md (Deployment checklist)"
