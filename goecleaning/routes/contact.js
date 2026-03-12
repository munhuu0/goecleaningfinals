const express = require('express');
const router = express.Router();
const tempStorage = require('../utils/tempStorage');

// Get the Contact model passed from server.js
let ContactModel;
const initContact = (contactModel) => {
  ContactModel = contactModel;
};

// GET all contact submissions (admin only)
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let whereClause = {};
    
    if (status) whereClause.status = status;
    
    const contacts = await ContactModel.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']]
    });
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching contact submissions', error: error.message });
  }
});

// GET single contact submission by ID (admin only)
router.get('/:id', async (req, res) => {
  try {
    const contact = await ContactModel.findByPk(req.params.id);
    if (!contact) {
      return res.status(404).json({ message: 'Contact submission not found' });
    }
    res.json(contact);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching contact submission', error: error.message });
  }
});

// POST new contact submission
router.post('/', async (req, res) => {
  try {
    const { customerName, phone, location, service, totalPrice, message } = req.body;
    
    // Validate required fields
    if (!customerName || !phone || !location) {
      return res.status(400).json({ 
        message: 'Нэр, утасны дугаар, хаяг байрших талбаруудыг бөглөнө үү' 
      });
    }
    
    // Validate phone format (basic validation)
    if (!/^[\d\s\-\+\(\)]+$/.test(phone)) {
      return res.status(400).json({ 
        message: 'Утасны дугаар буруу байна' 
      });
    }
    
    // Try to save to database, but handle case when DB is not connected
    try {
      const contact = await ContactModel.create({
        customerName: customerName.trim(),
        phone: phone.trim(),
        location: location.trim(),
        service: service || 'Үйлчилгээ',
        totalPrice: totalPrice || 0,
        message: message || `Үйлчилгээ: ${service || 'Үйлчилгээ'}, Хаяг: ${location.trim()}`,
        status: 'pending'
      });
      
      console.log(`Contact submission created: ${contact.id} - ${contact.customerName}`);
      
      res.status(201).json({
        message: 'Захиалга амжилттай хүлээн авлаа!',
        contact: {
          id: contact.id,
          customerName: contact.customerName,
          service: contact.service,
          status: contact.status
        }
      });
    } catch (dbError) {
      // If database is not connected, save to temporary storage
      const tempOrder = tempStorage.addOrder({
        customerName: customerName.trim(),
        phone: phone.trim(),
        location: location.trim(),
        service: service || 'Үйлчилгээ',
        totalPrice: totalPrice || 0,
        message: message || `Үйлчилгээ: ${service || 'Үйлчилгээ'}, Хаяг: ${location.trim()}`,
        status: 'pending'
      });
      
      res.status(201).json({
        message: 'Захиалга амжилттай хүлээн авлаа!',
        contact: {
          id: tempOrder.id,
          customerName: tempOrder.customerName,
          service: tempOrder.service,
          status: tempOrder.status
        }
      });
    }
    
  } catch (error) {
    console.error('Contact form error:', error);
    
    // Handle specific database errors
    if (error.name === 'SequelizeValidationError') {
      const validationErrors = error.errors.map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: validationErrors 
      });
    }
    
    if (error.name === 'SequelizeDatabaseError') {
      return res.status(500).json({ 
        message: 'Database error. Please try again later.' 
      });
    }
    
    res.status(400).json({ 
      message: 'Error saving contact submission', 
      error: error.message 
    });
  }
});

// PUT update contact status (admin only)
router.put('/:id', async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'read', 'replied'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }
    
    const contact = await ContactModel.findByPk(req.params.id);
    
    if (!contact) {
      return res.status(404).json({ message: 'Contact submission not found' });
    }
    
    await contact.update({ status });
    res.json(contact);
  } catch (error) {
    res.status(400).json({ message: 'Error updating contact submission', error: error.message });
  }
});

// DELETE contact submission (admin only)
router.delete('/:id', async (req, res) => {
  try {
    const contact = await ContactModel.findByPk(req.params.id);
    
    if (!contact) {
      return res.status(404).json({ message: 'Contact submission not found' });
    }
    
    await contact.destroy();
    res.json({ message: 'Contact submission deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting contact submission', error: error.message });
  }
});

module.exports = { router, initContact };
