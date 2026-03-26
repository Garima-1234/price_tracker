const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { cacheGet, cacheSet } = require('../utils/redisClient');
const { isDbConnected } = require('../utils/dbStatus');

// ─── Demo data used when DB is offline ───────────────────────────────────────
const DEMO_RECOMMENDATIONS = [
    { _id: 'd1', name: 'boAt Rockerz 450 Bluetooth Wireless Headphones', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400', category: 'electronics', brand: 'boAt', lowestPrice: 1299, bestPlatform: 'amazon', mrp: 3990, discountPct: 67, rating: 4.2, reviewCount: 45200, dealScore: 89.5, isFakeDiscount: false, mlTrend: 'falling' },
    { _id: 'd2', name: 'Noise ColorFit Pro 3 Smart Watch', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400', category: 'electronics', brand: 'Noise', lowestPrice: 2499, bestPlatform: 'flipkart', mrp: 6999, discountPct: 64, rating: 4.0, reviewCount: 32100, dealScore: 82.1, isFakeDiscount: false, mlTrend: 'stable' },
    { _id: 'd3', name: 'Redmi Note 12 (128GB, Mystique Blue)', image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400', category: 'electronics', brand: 'Redmi', lowestPrice: 12999, bestPlatform: 'amazon', mrp: 18999, discountPct: 32, rating: 4.3, reviewCount: 89000, dealScore: 74.3, isFakeDiscount: true, mlTrend: 'rising' },
    { _id: 'd4', name: 'Philips BT3211/15 Hair & Beard Trimmer', image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400', category: 'personal care', brand: 'Philips', lowestPrice: 899, bestPlatform: 'flipkart', mrp: 1695, discountPct: 47, rating: 4.1, reviewCount: 12600, dealScore: 70.0, isFakeDiscount: false, mlTrend: 'stable' },
    { _id: 'd5', name: 'Puma Men\'s Drift Cat 5 Ultra Sneakers', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400', category: 'fashion', brand: 'Puma', lowestPrice: 1799, bestPlatform: 'flipkart', mrp: 4499, discountPct: 60, rating: 4.4, reviewCount: 8900, dealScore: 68.2, isFakeDiscount: false, mlTrend: 'falling' },
    { _id: 'd6', name: 'Prestige PKPRC 2.0 Pressure Cooker 3L', image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400', category: 'kitchen', brand: 'Prestige', lowestPrice: 999, bestPlatform: 'amazon', mrp: 2095, discountPct: 52, rating: 4.5, reviewCount: 21000, dealScore: 67.5, isFakeDiscount: false, mlTrend: 'stable' },
    { _id: 'd7', name: 'Lakme 9 to 5 Primer + Matte Perfect Cover Foundation', image: 'https://images.unsplash.com/photo-1631214524020-3c69d31dea0e?w=400', category: 'beauty', brand: 'Lakme', lowestPrice: 349, bestPlatform: 'flipkart', mrp: 699, discountPct: 50, rating: 4.2, reviewCount: 5600, dealScore: 65.1, isFakeDiscount: false, mlTrend: 'stable' },
    { _id: 'd8', name: 'Crompton LED Bulb 9W (Pack of 6)', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', category: 'home', brand: 'Crompton', lowestPrice: 249, bestPlatform: 'amazon', mrp: 540, discountPct: 54, rating: 4.3, reviewCount: 18000, dealScore: 64.9, isFakeDiscount: false, mlTrend: 'stable' },
];

const DEMO_TRENDING = [
    { _id: 't1', name: 'Apple iPhone 15 128GB', image: 'https://images.unsplash.com/photo-1695048133142-1a20484429be?w=400', price: 69999, category: 'electronics', rating: 4.7 },
    { _id: 't2', name: 'Samsung Galaxy S24 256GB', image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400', price: 59999, category: 'electronics', rating: 4.5 },
    { _id: 't3', name: 'Sony WH-1000XM5 Wireless Headphones', image: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400', price: 21990, category: 'electronics', rating: 4.8 },
    { _id: 't4', name: 'Titan Raga Analog Women\'s Watch', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400', price: 3495, category: 'fashion', rating: 4.4 },
    { _id: 't5', name: 'Nike Air Max 270 Running Shoes', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400', price: 8495, category: 'fashion', rating: 4.5 },
    { _id: 't6', name: 'Instant Pot Duo 6 Quart', image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400', price: 7999, category: 'kitchen', rating: 4.6 },
    { _id: 't7', name: 'Levi\'s 511 Men\'s Slim Jeans', image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400', price: 2699, category: 'fashion', rating: 4.3 },
    { _id: 't8', name: 'Himalaya Face Wash (Pack of 3)', image: 'https://images.unsplash.com/photo-1631214524020-3c69d31dea0e?w=400', price: 399, category: 'beauty', rating: 4.4 },
];

// ─── GET /api/recommendations ─────────────────────────────────────────────────
router.get('/', async (req, res) => {
    try {
        const { category, limit = 10, sortBy = 'dealScore' } = req.query;

        // Return demo data immediately if DB is not connected
        if (!isDbConnected()) {
            let results = [...DEMO_RECOMMENDATIONS];
            if (category) results = results.filter(r => r.category?.toLowerCase().includes(category.toLowerCase()));
            const sortFns = {
                dealScore: (a, b) => b.dealScore - a.dealScore,
                discount:  (a, b) => b.discountPct - a.discountPct,
                rating:    (a, b) => b.rating - a.rating,
            };
            results.sort(sortFns[sortBy] || sortFns.dealScore);
            return res.json({ success: true, count: results.length, recommendations: results.slice(0, parseInt(limit)), demo: true });
        }

        const cacheKey = `recommendations:${category || 'all'}:${limit}:${sortBy}`;
        const cached = await cacheGet(cacheKey);
        if (cached) return res.json({ success: true, recommendations: cached, fromCache: true });

        let query = {};
        if (category) query.category = new RegExp(category, 'i');

        const products = await Product.find({
            ...query,
            $or: [
                { 'prices.amazon.price':   { $gt: 0 } },
                { 'prices.flipkart.price': { $gt: 0 } },
                { 'prices.ajio.price':     { $gt: 0 } },
            ]
        }).limit(200);

        const recommendations = [];
        for (const product of products) {
            const allPlatformPrices = [];
            for (const plat of ['amazon', 'flipkart', 'ajio']) {
                const pd = product.prices[plat];
                if (pd?.price > 0) allPlatformPrices.push({ platform: plat, price: pd.price, mrp: pd.mrp || pd.price, url: pd.url });
            }
            if (!allPlatformPrices.length) continue;

            const minPriceEntry = allPlatformPrices.reduce((a, b) => a.price < b.price ? a : b);
            const maxMrp = Math.max(...allPlatformPrices.map(p => p.mrp));
            const discountPct = maxMrp > minPriceEntry.price ? ((maxMrp - minPriceEntry.price) / maxMrp * 100) : 0;
            const ratingNorm = ((product.rating || 0) / 5) * 100;
            const popularityNorm = Math.min((product.reviewCount || 0) / 10000, 1) * 100;
            const dealScore = discountPct * 0.5 + ratingNorm * 0.3 + popularityNorm * 0.2;

            recommendations.push({
                _id: product._id, name: product.name, image: product.image,
                category: product.category, brand: product.brand,
                lowestPrice: minPriceEntry.price, bestPlatform: minPriceEntry.platform,
                bestUrl: minPriceEntry.url, mrp: maxMrp, discountPct: Math.round(discountPct),
                rating: product.rating || 0, reviewCount: product.reviewCount || 0,
                dealScore: Math.round(dealScore * 10) / 10,
                allTimeLow: product.allTimeLow || null,
                isFakeDiscount: product.fakeDiscountFlags?.[minPriceEntry.platform]?.isFake || false,
                mlTrend: product.mlPrediction?.trend || 'stable',
            });
        }

        const sortFns = {
            dealScore: (a, b) => b.dealScore - a.dealScore,
            discount:  (a, b) => b.discountPct - a.discountPct,
            rating:    (a, b) => b.rating - a.rating,
        };
        recommendations.sort(sortFns[sortBy] || sortFns.dealScore);
        const result = recommendations.slice(0, parseInt(limit));
        await cacheSet(cacheKey, result, 900);
        res.json({ success: true, count: result.length, recommendations: result });

    } catch (error) {
        console.error('Recommendations error:', error.message);
        // Fallback to demo on any error
        res.json({ success: true, recommendations: DEMO_RECOMMENDATIONS.slice(0, 8), demo: true });
    }
});

// ─── GET /api/recommendations/trending ───────────────────────────────────────
router.get('/trending', async (req, res) => {
    try {
        if (!isDbConnected()) {
            return res.json({ success: true, trending: DEMO_TRENDING, demo: true });
        }

        const cacheKey = 'recommendations:trending';
        const cached = await cacheGet(cacheKey);
        if (cached) return res.json({ success: true, trending: cached, fromCache: true });

        const products = await Product.find({}).sort({ updatedAt: -1 }).limit(20);
        const trending = products.map(p => {
            const prices = ['amazon', 'flipkart', 'ajio'].map(plat => p.prices[plat]?.price).filter(Boolean);
            return { _id: p._id, name: p.name, image: p.image, category: p.category, price: prices.length ? Math.min(...prices) : null, rating: p.rating, updatedAt: p.updatedAt };
        }).filter(p => p.price);

        await cacheSet(cacheKey, trending, 600);
        res.json({ success: true, trending });

    } catch (error) {
        console.error('Trending error:', error.message);
        res.json({ success: true, trending: DEMO_TRENDING, demo: true });
    }
});

module.exports = router;
