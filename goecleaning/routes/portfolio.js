const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Get the Portfolio model passed from server.js
let Portfolio;
const initPortfolio = (portfolioModel) => {
  Portfolio = portfolioModel;
};

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads/portfolio');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Enhanced file filter for security
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  // Check file extension and MIME type
  if (!mimetype || !extname) {
    return cb(new Error('Only image files (JPEG, JPG, PNG, GIF, WebP) are allowed'), false);
  }
  
  // Check file size (will be handled by limits, but double-check)
  const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return cb(new Error('File size exceeds maximum allowed size'), false);
  }
  
  cb(null, true);
};

// Enhanced multer configuration with security
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate secure filename with timestamp and random string
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    const safeFilename = `${timestamp}-${randomString}${ext}`;
    cb(null, safeFilename);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
    files: 10, // Maximum 10 files per request
    fields: 20, // Maximum 20 fields per request
    fieldSize: 1024 * 1024 // Maximum field size 1MB
  },
  fileFilter: fileFilter
});

// GET all portfolio items
router.get('/', async (req, res) => {
  try {
    const { category, featured } = req.query;
    let whereClause = {};
    
    if (category) whereClause.category = category;
    if (featured) whereClause.featured = featured === 'true';
    
    const portfolio = await Portfolio.findAll({
      where: whereClause,
      order: [['order', 'ASC'], ['createdAt', 'DESC']]
    });
    res.json(portfolio);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching portfolio items', error: error.message });
  }
});

// GET featured portfolio items
router.get('/featured', async (req, res) => {
  try {
    const portfolio = await Portfolio.findAll({
      where: { featured: true },
      order: [['order', 'ASC'], ['createdAt', 'DESC']]
    });
    res.json(portfolio);
  } catch (error) {
    console.error('Portfolio fetch error:', error);
    res.json([]); // Return empty array on error
  }
});

// GET single portfolio item by ID
router.get('/:id', async (req, res) => {
  try {
    const portfolio = await Portfolio.findByPk(req.params.id);
    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio item not found' });
    }
    res.json(portfolio);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching portfolio item', error: error.message });
  }
});

// Authentication middleware (import from admin or create shared middleware)
const requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  // For production, use proper session validation
  // For now, we'll use a simple token check that matches admin.js
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Goe1119!';
  
  // Create a simple token validation (same as admin login)
  const expectedToken = crypto.createHash('sha256').update(ADMIN_PASSWORD).digest('hex');
  
  if (token !== expectedToken) {
    return res.status(401).json({ message: 'Invalid authentication token' });
  }
  
  next();
};

// POST new portfolio item with images (admin only, protected)
router.post('/', requireAuth, upload.array('images', 10), async (req, res) => {
  try {
    console.log('Portfolio upload request:', {
      body: req.body,
      files: req.files ? req.files.map(f => ({ originalname: f.originalname, size: f.size })) : null,
      headers: req.headers
    });
    
    // Handle both Mongolian and English field names
    const title = req.body.title || req.body['Гарчиг'];
    const description = req.body.description || req.body['Тайлбар'];
    const category = req.body.category || 'post-construction'; // Default category
    const featured = req.body.featured || true;
    const order = req.body.order || 0;
    
    // Validate input
    if (!title || title.trim().length === 0) {
      return res.status(400).json({ message: 'Title is required' });
    }
    
    if (title.length > 255) {
      return res.status(400).json({ message: 'Title is too long (max 255 characters)' });
    }
    
    if (description && description.length > 2000) {
      return res.status(400).json({ message: 'Description is too long (max 2000 characters)' });
    }
    
    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        path: file.path,
        size: file.size,
        mimetype: file.mimetype
      }));
    }
    
    console.log('Creating portfolio item:', { title, description, category, featured, order, imageCount: images.length });
    
    const portfolio = await Portfolio.create({
      title: title.trim(),
      description: description ? description.trim() : null,
      category,
      featured: featured === 'true',
      order: order || 0,
      images
    });
    
    console.log(`Portfolio item created: ${portfolio.id} - ${portfolio.title}`);
    res.status(201).json(portfolio);
  } catch (error) {
    console.error('Portfolio upload error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      body: req.body,
      files: req.files
    });
    
    // Clean up uploaded files on error
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    
    res.status(500).json({ 
      message: 'Error creating portfolio item', 
      error: error.message 
    });
  }
});

// PUT update portfolio item (admin only, protected)
router.put('/:id', requireAuth, upload.array('images', 10), async (req, res) => {
  try {
    const { title, description, category, featured, order } = req.body;
    
    // Validate input
    if (title && title.trim().length === 0) {
      return res.status(400).json({ message: 'Title cannot be empty' });
    }
    
    if (title && title.length > 255) {
      return res.status(400).json({ message: 'Title is too long (max 255 characters)' });
    }
    
    if (description && description.length > 2000) {
      return res.status(400).json({ message: 'Description is too long (max 2000 characters)' });
    }
    
    let updateData = {};
    
    // Only include fields that are provided
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description ? description.trim() : null;
    if (category !== undefined) updateData.category = category;
    if (featured !== undefined) updateData.featured = featured === 'true';
    if (order !== undefined) updateData.order = order || 0;
    
    // If new images are uploaded, add them
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        path: file.path,
        size: file.size,
        mimetype: file.mimetype
      }));
      updateData.images = newImages;
    }
    
    const portfolio = await Portfolio.findByPk(req.params.id);
    
    if (!portfolio) {
      // Clean up uploaded files if portfolio not found
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
      }
      return res.status(404).json({ message: 'Portfolio item not found' });
    }
    
    // Store old images for cleanup if new ones are uploaded
    const oldImages = portfolio.images || [];
    
    await portfolio.update(updateData);
    
    // Clean up old images if new ones were uploaded
    if (req.files && req.files.length > 0 && oldImages.length > 0) {
      oldImages.forEach(image => {
        if (image.path && fs.existsSync(image.path)) {
          fs.unlinkSync(image.path);
        }
      });
    }
    
    console.log(`Portfolio item updated: ${portfolio.id} - ${portfolio.title}`);
    res.json(portfolio);
  } catch (error) {
    console.error('Portfolio update error:', error);
    
    // Clean up uploaded files on error
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    
    res.status(400).json({ message: 'Error updating portfolio item', error: error.message });
  }
});

// DELETE portfolio item (admin only, protected)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const portfolio = await Portfolio.findByPk(req.params.id);
    
    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio item not found' });
    }
    
    // Delete associated images
    if (portfolio.images && Array.isArray(portfolio.images)) {
      portfolio.images.forEach(image => {
        if (image.path && fs.existsSync(image.path)) {
          fs.unlinkSync(image.path);
        }
      });
    }
    
    await portfolio.destroy();
    console.log(`Portfolio item deleted: ${req.params.id}`);
    res.json({ message: 'Portfolio item deleted successfully' });
  } catch (error) {
    console.error('Portfolio delete error:', error);
    res.status(500).json({ message: 'Error deleting portfolio item', error: error.message });
  }
});

module.exports = { router, initPortfolio };
