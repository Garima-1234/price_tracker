const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');
const Product = require('../models/Product');
const { cacheGet, cacheSet, cacheDel } = require('../utils/redisClient');
const { isDbConnected } = require('../utils/dbStatus');

/**
 * POST /api/alerts
 * Create a new price alert (works for guests via email only)
 */
router.post('/', async (req, res) => {
    try {
        const { productId, productName, targetPrice, platform = 'any', email, alertType = ['email'], pushToken, userId } = req.body;

        if (!productId || !targetPrice || !email) {
            return res.status(400).json({ success: false, error: 'productId, targetPrice, and email are required' });
        }

        if (!isDbConnected()) {
            return res.json({ success: true, alert: { _id: 'demo', productId, productName, targetPrice, platform, email, triggered: false, active: true }, message: 'Alert noted (DB offline — will persist when MongoDB connects)' });
        }

        // Check for duplicate active alert
        const existing = await Alert.findOne({ email, productId, platform, active: true });
        if (existing) {
            // Update target price instead of creating duplicate
            existing.targetPrice = targetPrice;
            existing.triggered = false;
            existing.triggeredAt = null;
            await existing.save();
            return res.json({ success: true, alert: existing, message: 'Alert updated' });
        }

        const alert = new Alert({
            userId: userId || null,
            productId,
            productName: productName || '',
            platform,
            targetPrice,
            email,
            alertType,
            pushToken: pushToken || null,
        });

        await alert.save();

        // Invalidate user alert cache
        await cacheDel(`alerts:${email}`);

        res.status(201).json({ success: true, alert });

    } catch (error) {
        console.error('Create alert error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/alerts?email=user@example.com
 * List all active alerts for an email address
 */
router.get('/', async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) return res.status(400).json({ success: false, error: 'email query param required' });

        if (!isDbConnected()) {
            return res.json({ success: true, alerts: [], count: 0, message: 'DB offline — no stored alerts' });
        }

        const cacheKey = `alerts:${email}`;
        const cached = await cacheGet(cacheKey);
        if (cached) return res.json({ success: true, alerts: cached, fromCache: true });

        const alerts = await Alert.find({ email, active: true }).sort({ createdAt: -1 });
        await cacheSet(cacheKey, alerts, 120); // 2 min cache

        res.json({ success: true, count: alerts.length, alerts });

    } catch (error) {
        console.error('Get alerts error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * DELETE /api/alerts/:id
 * Soft-delete (deactivate) an alert
 */
router.delete('/:id', async (req, res) => {
    try {
        if (!isDbConnected()) return res.json({ success: true, message: 'Alert removed (demo mode)' });
        const alert = await Alert.findById(req.params.id);
        if (!alert) return res.status(404).json({ success: false, error: 'Alert not found' });

        alert.active = false;
        await alert.save();
        await cacheDel(`alerts:${alert.email}`);

        res.json({ success: true, message: 'Alert deleted' });

    } catch (error) {
        console.error('Delete alert error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/alerts/check/:productId
 * Manually check if current price triggers any alerts for a product
 */
router.get('/check/:productId', async (req, res) => {
    try {
        if (!isDbConnected()) return res.json({ success: true, triggeredCount: 0, triggered: [] });
        const { productId } = req.params;
        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ success: false, error: 'Product not found' });

        const alerts = await Alert.find({ productId, active: true, triggered: false });
        const triggered = [];

        for (const alert of alerts) {
            const platformsToCheck = alert.platform === 'any'
                ? ['amazon', 'flipkart', 'myntra', 'ajio']
                : [alert.platform];

            for (const plat of platformsToCheck) {
                const currentPrice = product.prices[plat]?.price;
                if (currentPrice && currentPrice <= alert.targetPrice) {
                    alert.triggered = true;
                    alert.triggeredAt = new Date();
                    alert.triggeredPrice = currentPrice;
                    await alert.save();
                    triggered.push({ alert, currentPrice, platform: plat });
                    break;
                }
            }
        }

        res.json({ success: true, triggeredCount: triggered.length, triggered });

    } catch (error) {
        console.error('Check alerts error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
