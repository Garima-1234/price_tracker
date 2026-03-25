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
        let platformCounts = {};
        if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
            console.log(`✅ Cache HIT for: "${q}"`);
            products = cached.products;
            fromCache = true;
            platformCounts = cached.platformCounts || {};
        } else {
            console.log(`🔄 Cache MISS — scraping for: "${q}"`);
            const aggregationResult = await aggregatePrices(q);
            // Handle new response format { products: [], platformCounts: {} }
            products = aggregationResult.products || aggregationResult || [];
            platformCounts = aggregationResult.platformCounts || {};
            
            // Save to cache
            searchCache.set(cacheKey, { products, timestamp: Date.now(), platformCounts });

            // Save to DB if connected
            await saveProductsToDB(products, q);
        }

        // If DB is connected, map real ObjectIds so product detail + history work
        let dbIdByName = new Map();
        try {
            const mongoose = require('mongoose');
            if (mongoose.connection.readyState === 1 && products?.length) {
                const names = products.map(p => p.name).filter(Boolean);
                const dbProducts = await Product.find({ name: { $in: names } })
                    .select('_id name')
                    .lean();
                dbIdByName = new Map(dbProducts.map(p => [p.name, p._id.toString()]));
            }
        } catch (e) { /* DB not available */ }

        // Only keep real (non-simulated) prices for accurate data
        const realProducts = (products || []).filter(p => !p?._isDemo);
        // If everything is demo data, allow it to surface instead of returning empty
        const baseProducts = realProducts.length > 0 ? realProducts : (products || []);

        const filteredProducts = baseProducts.map(p => {
            const realPrices = filterRealPrices(p.prices);
            return { ...p, prices: realPrices };
        }).filter(p => Object.keys(p.prices || {}).length > 0);

        // Transform products for frontend
        let results = filteredProducts.map(p => ({
            _id: p._id || dbIdByName.get(p.name) || generateId(p.name),
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
        // Relevance filter - only show products that contain the search keywords
        const searchKeywords = buildQueryTokens(q);
        if (searchKeywords.length > 0) {
            results = results.filter(p => matchesQuery(p.name, q, searchKeywords));
        }

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

        // Recompute platform counts from real data only
        const realPlatformCounts = countPlatforms(results);

        res.json({
            success: true,
            query: q,
            count: results.length,
            fromCache,
            platformCounts: realPlatformCounts,
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
        const id = req.params.id || req.query.product_id;
        const { platform = 'all' } = req.query;

        const mongoose = require('mongoose');
        const isDbConnected = mongoose.connection.readyState === 1;
        const isObjectId = mongoose.Types.ObjectId.isValid(id);

        let product = null;
        let history = [];

        if (isDbConnected) {
            if (isObjectId) {
                product = await Product.findById(id);
            }
            if (product) history = product.priceHistory || [];
        } else {
            // DB Offline Fallback: Find from recent memory cache
            for (const [, cached] of searchCache) {
                const found = cached.products.find(p => p._id && p._id.toString() === id || generateId(p.name) === id);
                if (found) { product = found; break; }
            }
        }

        if (!product) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }

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
        const aggregationResult = await aggregatePrices(product.name);
        const freshProducts = aggregationResult.products || aggregationResult || [];
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

function normalizePrice(value) {
    if (value == null) return null;
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
        const num = parseInt(value.replace(/[^0-9]/g, ''), 10);
        return Number.isFinite(num) && num > 0 ? num : null;
    }
    if (typeof value === 'object') {
        // Handle common shapes like { value: 123 } or { price: 123 }
        const candidate = value.value ?? value.price ?? value.amount;
        return normalizePrice(candidate);
    }
    return null;
}

function filterRealPrices(prices) {
    if (!prices) return {};
    const filtered = {};
    Object.entries(prices).forEach(([platform, data]) => {
        if (!data || data._simulated) return;
        const price = normalizePrice(data.price);
        if (!price) return;
        filtered[platform] = {
            ...data,
            price
        };
    });
    return filtered;
}

function normalizeForMatch(text) {
    return (text || '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function buildQueryTokens(query) {
    const cleaned = normalizeForMatch(query);
    if (!cleaned) return [];

    // Split letter-number boundaries: "iphone16" => "iphone 16"
    const split = cleaned.replace(/([a-z])([0-9])/g, '$1 $2').replace(/([0-9])([a-z])/g, '$1 $2');
    const raw = split.split(' ').filter(Boolean);

    // Remove very common/noisy tokens
    const commonWords = new Set(['for', 'with', 'and', 'the', 'pack', 'set', 'of', 'size', 'color']);
    return raw.filter(k => k.length > 1 && !commonWords.has(k));
}

function matchesQuery(productName, originalQuery, tokens) {
    const nameNorm = normalizeForMatch(productName).replace(/\s+/g, '');
    const queryNorm = normalizeForMatch(originalQuery).replace(/\s+/g, '');
    if (!nameNorm || !queryNorm) return false;

    // Direct normalized containment handles "iphone16" vs "iphone 16"
    if (nameNorm.includes(queryNorm)) return true;

    // Otherwise, require all significant tokens to be present
    return tokens.every(t => nameNorm.includes(t));
}

function countPlatforms(results) {
    const counts = { amazon: 0, flipkart: 0, myntra: 0, ajio: 0 };
    results.forEach(p => {
        Object.keys(p.prices || {}).forEach(platform => {
            if (p.prices[platform]?.price) counts[platform] = (counts[platform] || 0) + 1;
        });
    });
    return counts;
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
                        const normalizedPrice = normalizePrice(productData.prices[platform]?.price);
                        if (!normalizedPrice) return;
                        existing.prices[platform] = {
                            ...productData.prices[platform],
                            price: normalizedPrice,
                            lastUpdated: new Date()
                        };
                        existing.priceHistory.push({
                            platform,
                            price: normalizedPrice,
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
                        const normalizedPrice = normalizePrice(productData.prices[platform]?.price);
                        if (!normalizedPrice) return;
                        newProduct.priceHistory.push({
                            platform,
                            price: normalizedPrice,
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

/**
 * Predict future price using Linear Regression Model
 * GET /predict-price?product_id=ID
 */
exports.predictPrice = async (req, res) => {
    try {
        const productId = req.query.product_id;
        if (!productId) {
            return res.status(400).json({ success: false, error: 'product_id query parameter is required' });
        }
        
        const platform = req.query.platform || 'amazon';
        const predictor = require('../ml/pricePredictor');
        
        const prediction = await predictor.predictPrice(productId, platform);
        
        return res.json({
            success: true,
            predicted_price: prediction.predicted_price,
            trend: prediction.trend,
            confidence_score: prediction.confidence_score
        });
    } catch (error) {
        return res.status(400).json({ success: false, error: error.message });
    }
};

/**
 * Get formatted price history from standalone PriceHistory collection
 * GET /price-history?product_id=ID&limit=10
 * Response: { dates: ["1 Mar", ...], prices: [42000, ...], timestamps: [ISO...], count: N }
 */
exports.getPriceHistoryFormatted = async (req, res) => {
    try {
        const { product_id } = req.query;
        if (!product_id) {
            return res.status(400).json({ success: false, error: 'product_id query parameter is required' });
        }
        const limit = Math.max(1, Math.min(parseInt(req.query.limit || '90', 10) || 90, 365));

        const mongoose = require('mongoose');
        const PriceHistory = require('../models/PriceHistory');

        let records = [];

        if (mongoose.connection.readyState === 1) {
            // Query standalone PriceHistory collection — last 90 records sorted oldest first
            records = await PriceHistory
                .find({ product_id })
                .sort({ timestamp: 1 })
                .limit(limit)
                .lean();
        }

        // Fallback: if standalone collection is empty, read from embedded product.priceHistory
        if (records.length === 0 && mongoose.connection.readyState === 1) {
            const product = await Product.findById(product_id).lean();
            if (product?.priceHistory?.length) {
                records = product.priceHistory
                    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
                    .slice(-limit)
                    .map(h => ({ price: h.price, timestamp: h.timestamp }));
            }
        }

        const count = records.length;
        const dates = records.map(r =>
            new Date(r.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
        );
        const prices = records.map(r => r.price);
        const timestamps = records.map(r => new Date(r.timestamp).toISOString());

        return res.json({ success: true, dates, prices, timestamps, count });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};


/**
 * Compare prices across all platforms
 * GET /compare-prices?product_id=ID
 * GET /api/compare-prices?product_name=NAME
 */
exports.comparePrices = async (req, res) => {
    try {
        const productId   = req.query.product_id;
        const productName = req.query.product_name;

        if (!productId && !productName) {
            return res.status(400).json({ success: false, error: 'product_id or product_name required' });
        }

        let product = null;
        let searchQuery = productName || '';

        const mongoose = require('mongoose');

        // 1. Try finding in DB
        if (productId && mongoose.connection.readyState === 1) {
            const isObjectId = mongoose.Types.ObjectId.isValid(productId);
            if (isObjectId) {
                product = await Product.findById(productId);
            }
            if (product) searchQuery = product.name;
        }

        // 2. Try finding in cache
        if (!product) {
            for (const [, cached] of searchCache) {
                const found = cached.products.find(p =>
                    (p._id && p._id.toString() === productId) || generateId(p.name) === productId || p.name === productName
                );
                if (found) {
                    product = found;
                    break;
                }
            }
        }
        
        // 3. If still not found, trigger an aggregation
        if (!product && searchQuery) {
            const aggregationResult = await aggregatePrices(searchQuery);
            const freshProducts = aggregationResult.products || aggregationResult || [];
            if (freshProducts.length > 0) {
                // Find exact match or take best
                product = freshProducts.find(p => p.name === searchQuery) || freshProducts[0];
            }
        }

        if (!product || !product.prices) {
            return res.json({ success: true, results: [], searchQuery });
        }

        // 4. Format existing prices array 
        const storesMap = {
            amazon: 'Amazon', flipkart: 'Flipkart', 
            myntra: 'Myntra', ajio: 'AJIO',
            croma: 'Croma', reliance: 'Reliance Digital', vijay: 'Vijay Sales'
        };

        const results = Object.entries(product.prices)
            .map(([platform, data]) => {
                const price = normalizePrice(data?.price);
                if (!price) return null;
                return {
                    store: storesMap[platform] || platform,
                    price,
                    product_url: data?.url || '',
                    availability: data?.inStock !== false,
                    platform,
                    isSimulated: data?._simulated || false,
                };
            })
            .filter(Boolean)
            .sort((a, b) => a.price - b.price);

        if (results.length > 0) results[0].isLowest = true;

        return res.json({ success: true, results, searchQuery });

    } catch (error) {
        console.error('comparePrices error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
};
