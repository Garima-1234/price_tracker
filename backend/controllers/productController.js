const Product = require('../models/Product');
const { aggregatePrices, findLowestPrice } = require('../scrapers/priceAggregator');

// In-memory cache for search results (5 minute TTL)
const searchCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000;

/**
 * Search products — scrapes live data, caches, and saves to DB
 * GET /api/products/search?q=query&sort=price_low&platform=all&minPrice=&maxPrice=
 */
exports.searchProducts = async (req, res) => {
    try {
        const { q, sort = 'relevance', platform = 'all', minPrice, maxPrice } = req.query;

        if (!q || q.trim().length === 0) {
            return res.status(400).json({ success: false, error: 'Search query is required' });
        }

        const cacheKey = q.toLowerCase().trim();
        const cached = searchCache.get(cacheKey);

        let products;
        let fromCache = false;

        // Check cache first
        if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
            console.log(`✅ Cache HIT for: "${q}"`);
            products = cached.products;
            fromCache = true;
        } else {
            console.log(`🔄 Cache MISS — scraping for: "${q}"`);
            products = await aggregatePrices(q);

            // Save to cache
            searchCache.set(cacheKey, { products, timestamp: Date.now() });

            // Save to DB if connected
            await saveProductsToDB(products, q);
        }

        // Transform products for frontend
        let results = products.map(p => ({
            _id: p._id || generateId(p.name),
            name: p.name,
            image: p.image,
            brand: p.brand || '',
            category: p.category || q,
            rating: p.rating || 0,
            reviewCount: p.reviewCount || 0,
            prices: p.prices || {},
            lowestPrice: getLowestPrice(p.prices),
            lowestPriceInfo: getLowestPriceInfo(p.prices),
            platformCount: Object.keys(p.prices || {}).filter(k => p.prices[k]?.price).length
        }));

        // Apply filters
        if (platform !== 'all') {
            results = results.filter(p => p.prices[platform]?.price);
        }
        if (minPrice) {
            results = results.filter(p => p.lowestPrice >= Number(minPrice));
        }
        if (maxPrice) {
            results = results.filter(p => p.lowestPrice <= Number(maxPrice));
        }

        // Apply sorting
        switch (sort) {
            case 'price_low':
                results.sort((a, b) => (a.lowestPrice || Infinity) - (b.lowestPrice || Infinity));
                break;
            case 'price_high':
                results.sort((a, b) => (b.lowestPrice || 0) - (a.lowestPrice || 0));
                break;
            case 'rating':
                results.sort((a, b) => b.rating - a.rating);
                break;
        }

        res.json({
            success: true,
            query: q,
            count: results.length,
            fromCache,
            products: results
        });

    } catch (error) {
        console.error('Search error:', error.message);
        res.status(500).json({ success: false, error: 'Search failed. Please try again.' });
    }
};

/**
 * Get product by ID
 * GET /api/products/:id
 */
exports.getProductById = async (req, res) => {
    try {
        const { id } = req.params;

        // Try DB first
        const Product = require('../models/Product');
        let product = null;

        try {
            const mongoose = require('mongoose');
            if (mongoose.connection.readyState === 1) {
                product = await Product.findById(id);
            }
        } catch (e) { /* DB not available */ }

        // Try cache if not in DB
        if (!product) {
            for (const [, cached] of searchCache) {
                const found = cached.products.find(p =>
                    (p._id && p._id.toString() === id) || generateId(p.name) === id
                );
                if (found) {
                    product = {
                        ...found,
                        _id: id
                    };
                    break;
                }
            }
        }

        if (!product) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }

        res.json({
            success: true,
            product: {
                ...product.toJSON ? product.toJSON() : product,
                lowestPrice: getLowestPrice(product.prices),
                lowestPriceInfo: getLowestPriceInfo(product.prices)
            }
        });

    } catch (error) {
        console.error('Get product error:', error.message);
        res.status(500).json({ success: false, error: 'Failed to get product' });
    }
};

/**
 * Get price history for a product
 * GET /api/products/:id/history?platform=all
 */
exports.getPriceHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const { platform = 'all' } = req.query;

        const mongoose = require('mongoose');
        if (mongoose.connection.readyState !== 1) {
            return res.json({ success: true, history: [], message: 'Database not connected' });
        }

        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }

        let history = product.priceHistory || [];

        if (platform !== 'all') {
            history = history.filter(h => h.platform === platform);
        }

        // Sort by date
        history.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        res.json({ success: true, history });

    } catch (error) {
        console.error('Price history error:', error.message);
        res.status(500).json({ success: false, error: 'Failed to get price history' });
    }
};

/**
 * Refresh prices for a specific product
 * POST /api/products/:id/refresh
 */
exports.refreshPrices = async (req, res) => {
    try {
        const { id } = req.params;

        const mongoose = require('mongoose');
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ success: false, error: 'Database required for refresh' });
        }

        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }

        // Re-scrape using product name
        const freshProducts = await aggregatePrices(product.name);
        const match = freshProducts[0]; // Best match

        if (match) {
            // Update prices
            Object.keys(match.prices || {}).forEach(platform => {
                product.prices[platform] = {
                    ...match.prices[platform],
                    lastUpdated: new Date()
                };

                // Add to price history
                if (match.prices[platform]?.price) {
                    product.priceHistory.push({
                        platform,
                        price: match.prices[platform].price,
                        inStock: match.prices[platform].inStock !== false,
                        timestamp: new Date()
                    });
                }
            });

            await product.save();
        }

        res.json({
            success: true,
            message: 'Prices refreshed',
            product
        });

    } catch (error) {
        console.error('Refresh error:', error.message);
        res.status(500).json({ success: false, error: 'Failed to refresh prices' });
    }
};

/**
 * Subscribe to price drop alert
 * POST /api/products/:id/alert
 * Body: { targetPrice, platform }
 */
exports.subscribePriceAlert = async (req, res) => {
    try {
        const { id } = req.params;
        const { targetPrice, platform = 'any' } = req.body;

        if (!targetPrice || targetPrice <= 0) {
            return res.status(400).json({ success: false, error: 'Valid target price is required' });
        }

        const user = req.user;

        // Check if already subscribed to this product
        const existingAlert = user.priceAlerts.find(
            a => a.productId.toString() === id && a.active
        );

        if (existingAlert) {
            // Update existing alert
            existingAlert.targetPrice = targetPrice;
            existingAlert.platform = platform;
        } else {
            // Add new alert
            user.priceAlerts.push({
                productId: id,
                targetPrice,
                platform,
                active: true
            });
        }

        await user.save();

        res.json({
            success: true,
            message: `Alert set! We'll notify you when price drops below ₹${targetPrice}`,
            alertCount: user.priceAlerts.filter(a => a.active).length
        });

    } catch (error) {
        console.error('Alert subscription error:', error.message);
        res.status(500).json({ success: false, error: 'Failed to set price alert' });
    }
};


// ─── Helper Functions ──────────────────────────────────

function generateId(name) {
    return Buffer.from(name || 'unknown').toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 24);
}

function getLowestPrice(prices) {
    if (!prices) return null;
    const values = Object.values(prices)
        .filter(p => p?.price && p.inStock !== false)
        .map(p => p.price);
    return values.length > 0 ? Math.min(...values) : null;
}

function getLowestPriceInfo(prices) {
    if (!prices) return null;
    let lowest = null;
    Object.entries(prices).forEach(([platform, data]) => {
        if (data?.price && data.inStock !== false) {
            if (!lowest || data.price < lowest.price) {
                lowest = { platform, price: data.price, url: data.url };
            }
        }
    });
    return lowest;
}

async function saveProductsToDB(products, searchQuery) {
    try {
        const mongoose = require('mongoose');
        if (mongoose.connection.readyState !== 1) return;

        for (const productData of products) {
            try {
                const existing = await Product.findOne({ name: productData.name });

                if (existing) {
                    // Update prices
                    Object.keys(productData.prices || {}).forEach(platform => {
                        existing.prices[platform] = {
                            ...productData.prices[platform],
                            lastUpdated: new Date()
                        };
                        existing.priceHistory.push({
                            platform,
                            price: productData.prices[platform].price,
                            inStock: productData.prices[platform].inStock !== false,
                            timestamp: new Date()
                        });
                    });
                    if (productData.image) existing.image = productData.image;
                    if (productData.rating) existing.rating = productData.rating;
                    await existing.save();
                } else {
                    const newProduct = new Product({
                        ...productData,
                        searchKeywords: searchQuery.split(' ')
                    });
                    Object.keys(productData.prices || {}).forEach(platform => {
                        newProduct.priceHistory.push({
                            platform,
                            price: productData.prices[platform].price,
                            inStock: productData.prices[platform].inStock !== false,
                            timestamp: new Date()
                        });
                    });
                    await newProduct.save();
                }
            } catch (dbErr) {
                // Silently handle individual save errors
            }
        }
    } catch (e) { /* DB not available */ }
}
