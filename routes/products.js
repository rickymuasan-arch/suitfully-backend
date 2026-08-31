const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// Public routes
router.get('/', productController.getProducts);
router.get('/all', productController.getAllProducts);
router.get('/:id', productController.getProductById);

// Admin routes (protected)
router.post('/', productController.createProduct);
router.put('/:id', productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

module.exports = router;