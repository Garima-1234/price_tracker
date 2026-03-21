const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Alert = require('../models/Alert');
const { sendPriceDropEmail, sendPushNotification } = require('../utils/notificationService');
const { isDbConnected } = require('../utils/dbStatus');

/**
 * POST /api/scrape/report
 * Called by the Chrome extension to report a live price detected on a product page.
 * Creates or updates the product record, appends price history, checks alerts.
 */
router.post('/report', async (req, res) => {
    try {
        const { name, price, mrp, image, url, platform, asin, rating } = req.body;

        if (!price || !platform || !url) {
            return res.status(400).json({ success: false, error: 'price, platform, and url are required' });
        }

        // DB not available — acknowledge receipt but skip persistence
        if (!isDbConnected()) {
            return res.json({ success: true, action: 'acknowledged', lowestPrice: price, allTimeLow: { price, platform }, message: 'DB offline — price noted but not persisted' });
        }

        // Try to find existing product by ASIN or URL
        let product = null;
        if (asin) {
            product = await Product.findOne({ [`prices.${platform}.url`]: { $regex: asin } });
        }
        if (!product && url) {
            product = await Product.findOne({ [`prices.${platform}.url`]: url });
        }

        if (product) {
            // Update existing product price
            product.prices[platform] = {
                price,
                mrp: mrp || product.prices[platform]?.mrp || price,
                url,
                inStock: true,
                lastUpdated: new Date(),
            };
            product.priceHistory.push({ platform, price, mrp: mrp || null, timestamp: new Date() });

            // Keep history to last 365 data points
            if (product.priceHistory.length > 365) {
                product.priceHistory = product.priceHistory.slice(-365);
            }

            // Update all-time low
            const currentATL = product.allTimeLow?.price;
            if (!currentATL || price < currentATL) {
                product.allTimeLow = { price, platform, date: new Date() };
            }

            // Fake discount detection
            const history90 = product.priceHistory
                .filter(h => h.platform === platform && h.timestamp > new Date(Date.now() - 90 * 864e5))
                .map(h => h.price);

            if (history90.length >= 7 && mrp) {
                const avg90 = history90.reduce((a, b) => a + b, 0) / history90.length;
                const claimedDiscount = ((mrp - price) / mrp * 100);
                const realDiscount    = ((avg90 - price) / avg90 * 100);

                // Fake if claimed discount > 30% but real discount (vs avg) < 5%
                const isFake = claimedDiscount > 30 && realDiscount < 5;
                product.fakeDiscountFlags = product.fakeDiscountFlags || {};
                product.fakeDiscountFlags[platform] = {
                    isFake,
                    reason: isFake
                        ? `MRP ₹${mrp} rarely charged — average price was ₹${Math.round(avg90)} over last 90 days`
                        : 'Discount appears genuine',
                    confidence: Math.min(history90.length / 30, 1) * 100,
                };
            }

            product.markModified('prices');
            product.markModified('fakeDiscountFlags');
            await product.save();

            // Check if any alert is triggered
            const alerts = await Alert.find({ productId: product._id.toString(), active: true, triggered: false });
            for (const alert of alerts) {
                const checkPlatforms = alert.platform === 'any' ? ['amazon', 'flipkart', 'myntra', 'ajio'] : [alert.platform];
                for (const plat of checkPlatforms) {
                    const cp = product.prices[plat]?.price;
                    if (cp && cp <= alert.targetPrice) {
                        // Fire notification
                        if (alert.alertType.includes('email') && alert.email) {
                            await sendPriceDropEmail({
                                to: alert.email,
                                productName: product.name,
                                targetPrice: alert.targetPrice,
                                currentPrice: cp,
                                platform: plat,
                                productUrl: product.prices[plat]?.url || url,
                            });
                        }
                        if (alert.alertType.includes('push') && alert.pushToken) {
                            await sendPushNotification({ pushToken: alert.pushToken, productName: product.name, currentPrice: cp, platform: plat });
                        }
                        alert.triggered = true;
                        alert.triggeredAt = new Date();
                        alert.triggeredPrice = cp;
                        await alert.save();
                        break;
                    }
                }
            }

            return res.json({
                success: true,
                action: 'updated',
                productId: product._id,
                lowestPrice: product.lowestPrice,
                allTimeLow: product.allTimeLow,
                fakeDiscount: product.fakeDiscountFlags?.[platform] || null,
            });

        } else {
            // Create new product from extension data
            const newProduct = new Product({
                name: name || `Product on ${platform}`,
                category: 'Uncategorized',
                image: image || 'https://via.placeholder.com/300',
                prices: {
                    [platform]: { price, mrp: mrp || price, url, inStock: true, lastUpdated: new Date() }
                },
                priceHistory: [{ platform, price, mrp: mrp || null, timestamp: new Date() }],
                allTimeLow: { price, platform, date: new Date() },
                rating: rating || 0,
            });
            await newProduct.save();

            return res.json({
                success: true,
                action: 'created',
                productId: newProduct._id,
                lowestPrice: price,
            });
        }

    } catch (error) {
        console.error('Scrape report error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/scrape/status/:asin
 * Chrome extension polls this to show the price history badge
 */
router.get('/status/:asin', async (req, res) => {
    try {
        if (!isDbConnected()) return res.json({ success: true, tracked: false, message: 'DB offline' });
        const { asin } = req.params;
        const product = await Product.findOne({
            $or: [
                { 'prices.amazon.url': { $regex: asin } },
                { 'prices.flipkart.url': { $regex: asin } },
            ]
        });

        if (!product) return res.json({ success: true, tracked: false });

        res.json({
            success: true,
            tracked: true,
            productId: product._id,
            lowestPrice: product.lowestPrice,
            allTimeLow: product.allTimeLow,
            priceHistoryCount: product.priceHistory.length,
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
