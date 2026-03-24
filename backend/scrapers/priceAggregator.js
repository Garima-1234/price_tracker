const amazonScraper = require('./amazonScraper');
const flipkartScraper = require('./flipkartScraper');
const myntraScraper = require('./myntraScraper');
const ajioScraper = require('./ajioScraper');
const { getDemoProducts } = require('./demoData');

/**
 * Aggregate prices from all platforms for a search query
 * Falls back to demo data when live scraping fails (anti-bot blocking)
 * @param {string} searchQuery - Product search term
 * @returns {Promise<Array>} - Aggregated and deduplicated products
 */
async function aggregatePrices(searchQuery) {
    try {
        console.log(`🔍 Aggregating prices for: "${searchQuery}"`);

        // Scrape all platforms in parallel with individual error handling
        const [amazonResults, flipkartResults, myntraResults, ajioResults] = await Promise.all([
            amazonScraper.searchProducts(searchQuery).catch(err => {
                console.log('⚠️  Amazon scraping failed:', err.message);
                return [];
            }),
            flipkartScraper.searchProducts(searchQuery).catch(err => {
                console.log('⚠️  Flipkart scraping failed:', err.message);
                return [];
            }),
            myntraScraper.searchProducts(searchQuery).catch(err => {
                console.log('⚠️  Myntra scraping failed:', err.message);
                return [];
            }),
            ajioScraper.searchProducts(searchQuery).catch(err => {
                console.log('⚠️  Ajio scraping failed:', err.message);
                return [];
            })
        ]);

        console.log(`📊 Results — Amazon: ${amazonResults.length}, Flipkart: ${flipkartResults.length}, Myntra: ${myntraResults.length}, Ajio: ${ajioResults.length}`);

        // Collect all products and group by similar names
        const productMap = new Map();
        const allResults = [...amazonResults, ...flipkartResults, ...myntraResults, ...ajioResults];

        allResults.forEach(product => {
            if (!product.name || !product.price) return;

            // Normalize name for matching (first 50 chars, lowercase, alphanumeric only)
            const normalizedName = product.name.toLowerCase()
                .replace(/[^a-z0-9\s]/g, '')
                .trim()
                .substring(0, 50);

            if (!productMap.has(normalizedName)) {
                productMap.set(normalizedName, {
                    name: product.name,
                    image: product.image || '',
                    category: searchQuery,
                    brand: product.brand || '',
                    prices: {},
                    rating: product.rating || 0,
                    reviewCount: product.reviewCount || 0,
                    searchKeywords: searchQuery.split(' ')
                });
            }

            const existing = productMap.get(normalizedName);

            // Add platform-specific price only if valid
            if (product.platform && product.price) {
                existing.prices[product.platform] = {
                    price: product.price,
                    url: product.url || '',
                    inStock: product.inStock !== false,
                    lastUpdated: new Date()
                };
            }

            // Use better image if available
            if (product.image && (!existing.image || product.image.length > existing.image.length)) {
                existing.image = product.image;
            }

            // Keep higher rating
            if (product.rating && product.rating > existing.rating) {
                existing.rating = product.rating;
            }
        });

        let aggregatedProducts = Array.from(productMap.values());

        // ─── MULTI-PLATFORM PRICE ENRICHMENT ────────────────────────────────────────
        // Since Flipkart/Myntra/Ajio block live scraping, we synthesise realistic
        // prices for every platform. Prices are deterministic per product (based on
        // name hash) so different products show different "lowest" platforms.
        // All platforms get correct search-result URLs.
        if (process.env.SIMULATE_PRICES === 'true') {
        aggregatedProducts.forEach(prod => {
            const platforms = Object.keys(prod.prices);
            if (platforms.length === 0) return;

            // Prefer Amazon as the base (most reliable scrape)
            const basePlat = prod.prices.amazon ? 'amazon' : platforms[0];
            const basePrice = prod.prices[basePlat].price;
            const baseMrp   = prod.prices[basePlat].mrp || Math.round(basePrice * 1.25);

            // Deterministic multiplier per product (hash on product name, 0–99)
            let hash = 0;
            for (const c of prod.name) hash = (hash * 31 + c.charCodeAt(0)) & 0xffff;
            const seed = hash % 100; // 0..99

            // Price offsets for each platform — rotated by seed so "cheapest" varies
            // offsets[i] is additive % of basePrice: negative = cheaper, positive = costlier
            const rawOffsets = { amazon: 0, flipkart: -2, myntra: -4, ajio: -3 };

            // Rotate cheapness: shift offsets by seed so a different platform wins per product
            const rotation = [0, 1, 2, 3, 4, 5][seed % 6]; // 0-5 shifts
            const keys = Object.keys(rawOffsets);
            const shifted = {};
            keys.forEach((k, i) => {
                shifted[keys[(i + rotation) % keys.length]] = Object.values(rawOffsets)[i];
            });

            // Build platform URLs (always correct search links)
            const encName = encodeURIComponent(prod.name);
            const urls = {
                amazon:   `https://www.amazon.in/s?k=${encName}`,
                flipkart: `https://www.flipkart.com/search?q=${encName}`,
                myntra:   `https://www.myntra.com/${encName.replace(/%20/g, '-')}`,
                ajio:     `https://www.ajio.com/search/?text=${encName}`,
            };

            // Always include Amazon + Flipkart + Myntra + Ajio (4 core platforms)
            const alwaysShow = ['amazon', 'flipkart', 'myntra', 'ajio'];
            alwaysShow.forEach(plat => {
                if (!prod.prices[plat]) {
                    const pct = (shifted[plat] ?? 0) / 100;
                    prod.prices[plat] = {
                        price:       Math.round(basePrice * (1 + pct)),
                        mrp:         baseMrp,
                        url:         urls[plat],
                        inStock:     true,
                        lastUpdated: new Date(),
                        _simulated:  true,
                    };
                } else {
                    // Fix URL for real scraped entries too (scraped URLs can be empty)
                    if (!prod.prices[plat].url) prod.prices[plat].url = urls[plat];
                }
            });

            // Electronics platforms - removed Croma and Reliance
            // Only Amazon, Flipkart, Myntra, Ajio for now
        });
        }

        console.log(`✅ Aggregated: ${aggregatedProducts.length} unique products from ${allResults.length} total`);

        // 🔄 FALLBACK: If live scraping returned 0 results, use demo data
        if (aggregatedProducts.length === 0) {
            console.log(`📦 Live scraping returned 0 — using demo data for: "${searchQuery}"`);
            const demoProducts = getDemoProducts(searchQuery);
            aggregatedProducts = demoProducts.map(p => ({
                ...p,
                searchKeywords: searchQuery.split(' '),
                category: p.category || searchQuery,
                _isDemo: true
            }));
            console.log(`✅ Demo data: ${aggregatedProducts.length} products loaded`);
        }

        return aggregatedProducts;

    } catch (error) {
        console.error('❌ Price aggregation error:', error.message);

        // Even on total failure, return demo data so the app doesn't break
        console.log(`🆘 Total failure — falling back to demo data for: "${searchQuery}"`);
        const demoProducts = getDemoProducts(searchQuery);
        return demoProducts.map(p => ({
            ...p,
            searchKeywords: searchQuery.split(' '),
            _isDemo: true
        }));
    }
}

/**
 * Find lowest price across all platforms
 * @param {Object} prices - Platform prices object
 * @returns {Object|null} - { platform, price, url }
 */
function findLowestPrice(prices) {
    if (!prices) return null;

    const available = [];
    Object.entries(prices).forEach(([platform, data]) => {
        if (data?.price && data.inStock !== false) {
            available.push({ platform, price: data.price, url: data.url });
        }
    });

    if (available.length === 0) return null;
    return available.reduce((low, cur) => cur.price < low.price ? cur : low);
}

module.exports = {
    aggregatePrices,
    findLowestPrice
};
