# Hostinger Deployment Guide

## Prerequisites
- Hostinger account with VPS or Shared Hosting that supports Node.js
- MySQL database (Hostinger provides MySQL hosting)
- Domain name (optional)

## Step 1: Prepare Your Code
1. Upload ALL files from `d:/codes/goecleaning/` to Hostinger
2. Make sure to include `.env.production` as `.env`

## Step 2: Set Up Database
1. Access Hostinger's MySQL database panel
2. Create a new database (e.g., "goecleaning")
3. Create a database user with appropriate permissions
4. Note the database host, port, username, and password

## Step 3: Configure Environment Variables
Create `.env` file on Hostinger with:
```bash
NODE_ENV=production
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=goecleaning
DB_USER=your_database_user
DB_PASSWORD=your_database_password
FRONTEND_URL=https://goecleaning.com
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
ADMIN_PASSWORD=your_admin_password
```

## Step 4: Install Dependencies
```bash
npm install
```

## Step 5: Start the Server
```bash
npm start
```

## Step 6: Set Up Process Manager (Recommended)
Install PM2 to keep your app running:
```bash
npm install -g pm2
pm2 start server.js --name goecleaning
pm2 startup
pm2 save
```

## Step 7: Configure Web Server (if using shared hosting)
Add this to your `.htaccess` file:
```apache
RewriteEngine On
RewriteRule ^api/(.*)$ http://localhost:3000/api/$1 [P,L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ /public/$1 [L]
```

## API Endpoints
- `GET /api/services` - Get all services
- `GET /api/services/featured` - Get featured services
- `GET /api/portfolio` - Get all portfolio items
- `GET /api/portfolio/featured` - Get featured portfolio items
- `POST /api/contact` - Submit contact form

## Environment Variables Explained
- `PORT`: Port your Node.js app runs on
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`: MySQL database connection settings
- `FRONTEND_URL`: Your domain for CORS
- `MAX_FILE_SIZE`: Maximum file upload size in bytes
- `ADMIN_PASSWORD`: Password for admin dashboard access

## Troubleshooting
1. **Database connection error**: Check MySQL credentials and host
2. **CORS errors**: Verify FRONTEND_URL matches your domain
3. **File upload errors**: Check upload directory permissions
4. **Port already in use**: Change PORT in .env file

## Security Notes
- Never commit .env files to version control
- Use strong database passwords
- Enable HTTPS on your domain
- Keep dependencies updated
