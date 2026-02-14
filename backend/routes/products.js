const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authMiddleware } = require('../controllers/authController');

// Public routes
router.get('/search', productController.searchProducts);
router.get('/:id', productController.getProductById);
router.get('/:id/history', productController.getPriceHistory);
router.post('/:id/refresh', productController.refreshPrices);

// Protected routes (require auth)
router.post('/:id/alert', authMiddleware, productController.subscribePriceAlert);

module.exports = router;
