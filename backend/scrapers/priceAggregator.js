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

            // Add platform-specific price
            existing.prices[product.platform] = {
                price: product.price,
                url: product.url || '',
                inStock: product.inStock !== false,
                lastUpdated: new Date()
            };

            // Use better image if available
            if (product.image && (!existing.image || product.image.length > existing.image.length)) {
                existing.image = product.image;
            }

            // Keep higher rating
            if (product.rating > existing.rating) {
                existing.rating = product.rating;
            }
        });

        let aggregatedProducts = Array.from(productMap.values());
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
