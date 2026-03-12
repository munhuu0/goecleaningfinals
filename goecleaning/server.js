const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { Sequelize } = require('sequelize');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Production optimizations
if (NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://unpkg.com", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      frameSrc: ["'self'", "https://www.google.com"],
      scriptSrcAttr: ["'unsafe-inline'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  hsts: NODE_ENV === 'production' ? {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  } : false
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://goecleaning.com',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files serving
app.use(express.static(path.join(__dirname, 'public')));

// MySQL database connection
const sequelize = new Sequelize(
  process.env.DB_NAME || 'goecleaning',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    port: process.env.DB_PORT || 3306,
    logging: process.env.NODE_ENV === 'development' ? console.log : false
  }
);

// Initialize models
const Service = require('./models/Service')(sequelize);
const Portfolio = require('./models/Portfolio')(sequelize);
const Contact = require('./models/Contact')(sequelize);

// Test database connection
sequelize.authenticate()
  .then(() => {
    console.log('MySQL connected successfully');
    // Sync all models
    return sequelize.sync({ alter: true });
  })
  .then(() => {
    console.log('Database synchronized');
  })
  .catch(err => {
    console.log('MySQL connection error (continuing without DB):', err.message);
  });

// Health check endpoint for monitoring
app.get('/health', (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
    database: sequelize ? 'connected' : 'disconnected',
    memory: process.memoryUsage(),
    port: PORT
  };
  
  res.status(200).json(health);
});

// API Routes
const { router: portfolioRouter, initPortfolio } = require('./routes/portfolio');
const { router: contactRouter, initContact } = require('./routes/contact');
const { router: servicesRouter, initService } = require('./routes/services');
const { router: adminRouter, initAdminModels } = require('./routes/admin');

// Initialize routes with models
initPortfolio(Portfolio);
initContact(Contact);
initService(Service);
initAdminModels(Contact, Portfolio);

app.use('/api/portfolio', portfolioRouter);
app.use('/api/contact', contactRouter);
app.use('/api/services', servicesRouter);
app.use('/api/admin', adminRouter);

// Serve frontend for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
  // Don't send error details in production
  if (NODE_ENV === 'production') {
    res.status(500).json({ 
      message: 'Internal Server Error',
      errorId: Date.now()
    });
  } else {
    res.status(500).json({ 
      message: err.message,
      stack: err.stack
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`\nReceived ${signal}. Starting graceful shutdown...`);
  
  if (sequelize) {
    sequelize.close(() => {
      console.log('Database connection closed.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 GoeCleaning server running on port ${PORT}`);
  console.log(`🌍 Environment: ${NODE_ENV}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🎯 Frontend: http://localhost:${PORT}`);
  console.log(`⚙️  Admin: http://localhost:${PORT}/admin.html`);
  
  if (NODE_ENV === 'production') {
    console.log('🔒 Production mode enabled');
  }
});

// Handle server errors
server.on('error', (error) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT;

  switch (error.code) {
    case 'EACCES':
      console.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
});
