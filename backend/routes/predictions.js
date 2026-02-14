const express = require('express');
const router = express.Router();
const pricePredictor = require('../ml/pricePredictor');
const Product = require('../models/Product');

/**
 * Get price predictions for a product
 * GET /api/predictions/:productId?platform=amazon&days=7
 */
router.get('/:productId', async (req, res) => {
    try {
        const { productId } = req.params;
        const { platform = 'amazon', days = 7 } = req.query;

        console.log(`🔮 Generating price predictions for ${productId} on ${platform}...`);

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Get predictions
        const predictions = await pricePredictor.predictFuturePrices(
            productId,
            platform,
            parseInt(days)
        );

        // Get current price
        const currentPrice = product.prices[platform]?.price || product.lowestPrice;

        res.json({
            success: true,
            productName: product.name,
            platform: platform,
            currentPrice: currentPrice,
            predictions: predictions,
            generatedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error('Prediction error:', error);
        res.status(500).json({
            error: 'Failed to generate predictions',
            message: error.message
        });
    }
});

/**
 * Get best time to buy recommendation
 * GET /api/predictions/:productId/best-time?platform=amazon
 */
router.get('/:productId/best-time', async (req, res) => {
    try {
        const { productId } = req.params;
        const { platform = 'amazon' } = req.query;

        console.log(`📅 Calculating best time to buy for ${productId}...`);

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const recommendation = await pricePredictor.getBestTimeToBuy(productId, platform);

        res.json({
            success: true,
            productName: product.name,
            platform: platform,
            ...recommendation
        });

    } catch (error) {
        console.error('Best time calculation error:', error);
        res.status(500).json({
            error: 'Failed to calculate best time to buy',
            message: error.message
        });
    }
});

/**
 * Get price drop probability
 * GET /api/predictions/:productId/drop-probability?platform=amazon
 */
router.get('/:productId/drop-probability', async (req, res) => {
    try {
        const { productId } = req.params;
        const { platform = 'amazon' } = req.query;

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const dropInfo = await pricePredictor.getPriceDropProbability(productId, platform);

        res.json({
            success: true,
            productName: product.name,
            platform: platform,
            ...dropInfo
        });

    } catch (error) {
        console.error('Drop probability error:', error);
        res.status(500).json({
            error: 'Failed to calculate price drop probability',
            message: error.message
        });
    }
});

/**
 * Get smart product recommendations
 * GET /api/predictions/recommendations?category=electronics&limit=5
 */
router.get('/recommendations', async (req, res) => {
    try {
        const { category, limit = 5 } = req.query;

        let query = {};
        if (category) {
            query.category = category;
        }

        // Find products with good deals
        const products = await Product.find(query)
            .sort({ lowestPrice: 1 })
            .limit(parseInt(limit) * 2); // Get more to filter

        // Calculate deal scores
        const recommendations = [];

        for (const product of products) {
            // Calculate discount percentage
            const prices = Object.values(product.prices).filter(p => p.price > 0);
            if (prices.length === 0) continue;

            const avgPrice = prices.reduce((sum, p) => sum + p.price, 0) / prices.length;
            const discount = ((avgPrice - product.lowestPrice) / avgPrice * 100).toFixed(1);

            if (discount > 5) { // At least 5% discount
                recommendations.push({
                    _id: product._id,
                    name: product.name,
                    image: product.image,
                    lowestPrice: product.lowestPrice,
                    avgPrice: Math.round(avgPrice),
                    discount: discount,
                    platform: product.lowestPriceInfo.platform,
                    rating: product.rating,
                    dealScore: parseFloat(discount) + (product.rating || 0) * 5
                });
            }
        }

        // Sort by deal score
        recommendations.sort((a, b) => b.dealScore - a.dealScore);

        res.json({
            success: true,
            count: Math.min(recommendations.length, parseInt(limit)),
            recommendations: recommendations.slice(0, parseInt(limit))
        });

    } catch (error) {
        console.error('Recommendations error:', error);
        res.status(500).json({
            error: 'Failed to get recommendations',
            message: error.message
        });
    }
});

module.exports = router;
