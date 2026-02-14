const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Public routes
router.post('/signup', authController.signup);
router.post('/login', authController.login);

// Protected routes
router.get('/profile', authController.authMiddleware, authController.getProfile);
router.get('/wishlist', authController.authMiddleware, authController.getWishlist);
router.post('/wishlist/:productId', authController.authMiddleware, authController.addToWishlist);
router.delete('/wishlist/:productId', authController.authMiddleware, authController.removeFromWishlist);

module.exports = router;
