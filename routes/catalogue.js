const express = require('express');
const router = express.Router();
const catalogueController = require('../controllers/catalogueController');

// Public routes
router.get('/', catalogueController.getCatalogue);

// Admin routes (protected)
router.post('/', catalogueController.createCatalogue);
router.put('/:key', catalogueController.updateCatalogue);
router.delete('/:key', catalogueController.deleteCatalogue);

module.exports = router;