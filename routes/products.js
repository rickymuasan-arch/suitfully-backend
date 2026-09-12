const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// ============================================
// Public routes — ORDER MATTERS
// Specific routes MUST come BEFORE the generic '/:id' route
// ============================================

// Shop grid (lightweight, has mainImage only)
router.get('/', productController.getProducts);

// Admin full list (heavy — keep for admin use)
router.get('/all', productController.getAllProducts);

// Admin panel summary (fast, no images)
router.get('/summary/list', productController.getProductsSummary);

// Per-product — specific subroutes FIRST (before /:id)
router.get('/:id/light', productController.getProductByIdLight);
router.get('/:id/images', productController.getProductImages);

// Generic single-product (full data, admin edit)
router.get('/:id', productController.getProductById);

// ============================================
// Admin routes (protected)
// ============================================
router.post('/', productController.createProduct);
router.put('/:id', productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

module.exports = router;