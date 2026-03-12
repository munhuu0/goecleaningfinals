const express = require('express');
const router = express.Router();

// Get the Service model passed from server.js
let ServiceModel;
const initService = (serviceModel) => {
  ServiceModel = serviceModel;
};

// GET all services
router.get('/', async (req, res) => {
  try {
    const services = await ServiceModel.findAll({
      order: [['order', 'ASC'], ['createdAt', 'ASC']]
    });
    res.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ message: 'Error fetching services', error: error.message });
  }
});

// GET featured services
router.get('/featured', async (req, res) => {
  try {
    const services = await ServiceModel.findAll({
      where: { featured: true },
      order: [['order', 'ASC'], ['createdAt', 'ASC']]
    });
    res.json(services);
  } catch (error) {
    console.error('Error fetching featured services:', error);
    res.status(500).json({ message: 'Error fetching featured services', error: error.message });
  }
});

// GET single service by ID
router.get('/:id', async (req, res) => {
  try {
    const service = await ServiceModel.findByPk(req.params.id);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    res.json(service);
  } catch (error) {
    console.error('Error fetching service:', error);
    res.status(500).json({ message: 'Error fetching service', error: error.message });
  }
});

module.exports = { router, initService };
