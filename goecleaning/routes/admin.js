
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const tempStorage = require('../utils/tempStorage');

// Get the models passed from server.js
let ContactModel, PortfolioModel;
const initAdminModels = (contactModel, portfolioModel) => {
  ContactModel = contactModel;
  PortfolioModel = portfolioModel;
};

// Simple in-memory session store (for production, use proper session store)
const sessions = new Map();
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

// In-memory order storage for when database is not available
const tempOrders = new Map();
let tempOrderIdCounter = 1000; // Start from 1000 to distinguish from DB IDs

// Clean up expired sessions
setInterval(() => {
  const now = Date.now();
  for (const [token, session] of sessions.entries()) {
    if (now - session.createdAt > SESSION_TIMEOUT) {
      sessions.delete(token);
    }
  }
}, SESSION_TIMEOUT);

// Authentication middleware
const requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  const session = sessions.get(token);
  if (!session || Date.now() - session.createdAt > SESSION_TIMEOUT) {
    sessions.delete(token);
    return res.status(401).json({ message: 'Session expired or invalid' });
  }
  
  req.session = session;
  next();
};

// Rate limiting for login attempts
const loginAttempts = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_LOGIN_ATTEMPTS = 5;

// Clean up expired login attempts
setInterval(() => {
  const now = Date.now();
  for (const [ip, attempts] of loginAttempts.entries()) {
    if (now - attempts.firstAttempt > RATE_LIMIT_WINDOW) {
      loginAttempts.delete(ip);
    }
  }
}, RATE_LIMIT_WINDOW);

// Enhanced admin login with rate limiting and session management
router.post('/login', (req, res) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  const { password } = req.body;
  
  // Check rate limiting
  const attempts = loginAttempts.get(clientIP);
  if (attempts && attempts.count >= MAX_LOGIN_ATTEMPTS && Date.now() - attempts.firstAttempt < RATE_LIMIT_WINDOW) {
    return res.status(429).json({ 
      success: false, 
      message: 'Too many login attempts. Please try again later.' 
    });
  }
  
  // Default admin password (use environment variable in production)
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Goe1119!';
  
  if (password === ADMIN_PASSWORD) {
    // Generate secure session token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Store session
    sessions.set(token, {
      createdAt: Date.now(),
      ip: clientIP
    });
    
    // Clear login attempts on successful login
    loginAttempts.delete(clientIP);
    
    res.json({ 
      success: true, 
      message: 'Login successful',
      token,
      expiresIn: SESSION_TIMEOUT
    });
  } else {
    // Track failed login attempts
    if (!attempts) {
      loginAttempts.set(clientIP, {
        count: 1,
        firstAttempt: Date.now()
      });
    } else {
      attempts.count++;
    }
    
    // Add delay to prevent brute force
    setTimeout(() => {
      res.status(401).json({ 
        success: false, 
        message: 'Invalid password',
        attemptsLeft: Math.max(0, MAX_LOGIN_ATTEMPTS - (attempts?.count || 0))
      });
    }, 1000);
  }
});

// Logout endpoint
router.post('/logout', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (token && sessions.has(token)) {
    sessions.delete(token);
    res.json({ success: true, message: 'Logout successful' });
  } else {
    res.status(400).json({ success: false, message: 'Invalid session' });
  }
});

// Check session status
router.get('/check', requireAuth, (req, res) => {
  res.json({ 
    success: true, 
    message: 'Session valid',
    expiresIn: SESSION_TIMEOUT - (Date.now() - req.session.createdAt)
  });
});

// Get all orders (contact submissions) - Protected
router.get('/orders', requireAuth, async (req, res) => {
  try {
    // Try to get orders from database first
    const orders = await ContactModel.findAll({ order: [['createdAt', 'DESC']] });
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(order => order.status === 'pending').length;
    const totalRevenue = orders.reduce((sum, order) => sum + (parseFloat(order.totalPrice) || 0), 0);
    
    res.json({
      orders,
      totalOrders,
      totalRevenue,
      pendingOrders,
      source: 'database'
    });
  } catch (error) {
    console.error('Database error fetching orders, using fallback:', error);
    
    // Fallback to shared temporary storage
    const tempOrdersArray = tempStorage.getAllOrders();
    const stats = tempStorage.getStats();
    
    res.json({
      orders: tempOrdersArray,
      totalOrders: stats.totalOrders,
      totalRevenue: stats.totalRevenue,
      pendingOrders: stats.pendingOrders,
      source: 'temporary'
    });
  }
});

// Update order status - Protected
router.put('/orders/:id', requireAuth, async (req, res) => {
  const { status } = req.body;
  const orderId = req.params.id;
  
  try {
    // Try database first
    const order = await ContactModel.findByPk(orderId);
    
    if (order) {
      await order.update({ status });
      res.json(order);
      return;
    }
  } catch (error) {
    console.error('Database error updating order, trying temporary storage:', error);
  }
  
  // Fallback to shared temporary storage
  const tempOrder = tempStorage.updateOrder(orderId, { status });
  if (tempOrder) {
    res.json(tempOrder);
  } else {
    res.status(404).json({ message: 'Order not found' });
  }
});

// Delete order - Protected
router.delete('/orders/:id', requireAuth, async (req, res) => {
  const orderId = req.params.id;
  
  try {
    // Try database first
    const order = await ContactModel.findByPk(orderId);
    
    if (order) {
      await order.destroy();
      console.log(`Deleted database order ${orderId}`);
      res.json({ message: 'Order deleted successfully' });
      return;
    }
  } catch (error) {
    console.error('Database error deleting order, trying temporary storage:', error);
  }
  
  // Fallback to shared temporary storage
  const deleted = tempStorage.deleteOrder(orderId);
  if (deleted) {
    res.json({ message: 'Order deleted successfully' });
  } else {
    res.status(404).json({ message: 'Order not found' });
  }
});

module.exports = { router, initAdminModels };
