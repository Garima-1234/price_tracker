const axios = require('axios');

/**
 * Myntra uses an internal API for search — much more reliable than scraping HTML
 * The API endpoint returns JSON directly
 */
async function scrapeMyntra(query) {
    try {
        console.log(`🔍 Myntra: Searching for "${query}"`);

        // Myntra's internal search API
        const url = `https://www.myntra.com/gateway/v2/search/${encodeURIComponent(query)}?p=1&rows=10&o=0&plaession=ORGANIC&platform=desktop&f.type=product`;

        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'application/json',
                'Accept-Language': 'en-IN,en;q=0.9',
                'Referer': 'https://www.myntra.com/',
                'X-Location-Country': 'IN',
            },
            timeout: 10000,
        });

        const products = [];
        const items = data?.products || data?.results || [];

        items.slice(0, 10).forEach(item => {
            try {
                const name = `${item.brand || ''} ${item.product || item.productName || ''}`.trim();
                const price = item.price || item.discountedPrice || item.mrp || 0;
                const image = item.searchImage || item.image || (item.images && item.images[0]) || '';
                const productUrl = `https://www.myntra.com/${item.landingPageUrl || item.productId || ''}`;
                const rating = item.rating || item.averageRating || 0;
                const brand = item.brand || '';
                const reviewCount = item.ratingCount || 0;

                if (name && price > 0) {
                    products.push({ name, price, image, url: productUrl, rating, reviewCount, brand, platform: 'myntra', inStock: true });
                }
            } catch (e) { /* skip */ }
        });

        console.log(`✅ Myntra: Found ${products.length} products`);
        return products;
    } catch (error) {
        // Fallback: try scraping the HTML page if API fails
        console.log(`⚠️  Myntra API failed (${error.message}), trying HTML scrape...`);
        return scrapeMyntraHTML(query);
    }
}

/**
 * Fallback: Scrape Myntra HTML page
 */
async function scrapeMyntraHTML(query) {
    try {
        const cheerio = require('cheerio');
        const url = `https://www.myntra.com/${encodeURIComponent(query)}`;

        const { data: html } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml',
                'Accept-Language': 'en-IN,en;q=0.9',
            },
            timeout: 10000,
        });

        const $ = cheerio.load(html);
        const products = [];

        // Myntra embeds product data in a script tag
        $('script').each((i, el) => {
            const text = $(el).html() || '';
            if (text.includes('searchData') || text.includes('"products"')) {
                try {
                    const match = text.match(/"products"\s*:\s*(\[[\s\S]*?\])\s*,\s*"/);
                    if (match) {
                        const items = JSON.parse(match[1]);
                        items.slice(0, 10).forEach(item => {
                            const name = `${item.brand || ''} ${item.product || ''}`.trim();
                            const price = item.price || item.discountedPrice || 0;
                            const image = item.searchImage || '';

                            if (name && price > 0) {
                                products.push({ name, price, image, url: `https://www.myntra.com/${item.landingPageUrl || ''}`, rating: item.rating || 0, platform: 'myntra', inStock: true });
                            }
                        });
                    }
                } catch (parseErr) { /* skip */ }
            }
        });

        console.log(`✅ Myntra HTML: Found ${products.length} products`);
        return products;
    } catch (error) {
        console.error('❌ Myntra HTML scraper error:', error.message);
        return [];
    }
}

module.exports = { searchProducts: scrapeMyntra };
