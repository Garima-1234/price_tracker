const axios = require('axios');

/**
 * Ajio search API scraper — uses their internal API for product listing
 */
async function scrapeAjio(query) {
    try {
        console.log(`🔍 Ajio: Searching for "${query}"`);

        const url = `https://www.ajio.com/api/search?searchQuery=${encodeURIComponent(query)}&gridColumns=3&from=0&size=10`;

        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'application/json',
                'Accept-Language': 'en-IN,en;q=0.9',
                'Referer': 'https://www.ajio.com/',
            },
            timeout: 10000,
        });

        const products = [];
        const items = data?.products || data?.searchData?.products || [];

        items.slice(0, 10).forEach(item => {
            try {
                const name = `${item.brandName || item.brand || ''} ${item.name || item.productName || ''}`.trim();
                const price = item.price?.value || item.offerPrice || item.sellingPrice || 0;
                let image = item.images?.[0]?.url || item.imageUrl || item.fnlColorVariantData?.colorVariantImages?.[0] || '';
                if (image && !image.startsWith('http')) image = `https://assets.ajio.com${image}`;
                const productUrl = item.url ? `https://www.ajio.com${item.url}` : '';
                const brand = item.brandName || item.brand || '';

                if (name && price > 0) {
                    products.push({ name, price, image, url: productUrl, rating: 0, brand, platform: 'ajio', inStock: true });
                }
            } catch (e) { /* skip */ }
        });

        console.log(`✅ Ajio: Found ${products.length} products`);
        return products;
    } catch (error) {
        // Fallback: try HTML scraping
        console.log(`⚠️  Ajio API failed (${error.message}), trying HTML...`);
        return scrapeAjioHTML(query);
    }
}

async function scrapeAjioHTML(query) {
    try {
        const cheerio = require('cheerio');
        const url = `https://www.ajio.com/search/?text=${encodeURIComponent(query)}`;

        const { data: html } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html',
            },
            timeout: 10000,
        });

        const $ = cheerio.load(html);
        const products = [];

        $('.item').each((i, el) => {
            if (i >= 10) return false;
            const $el = $(el);
            const name = $el.find('.nameCls').text().trim();
            const priceText = $el.find('.price strong').text();
            const price = parseInt((priceText || '').replace(/[^0-9]/g, ''));
            const image = $el.find('.imgHolder img').attr('src') || '';
            let href = $el.find('a').attr('href') || '';
            const productUrl = href.startsWith('http') ? href : `https://www.ajio.com${href}`;

            if (name && price > 0) {
                products.push({ name, price, image, url: productUrl, rating: 0, platform: 'ajio', inStock: true });
            }
        });

        console.log(`✅ Ajio HTML: Found ${products.length} products`);
        return products;
    } catch (error) {
        console.error('❌ Ajio scraper error:', error.message);
        return [];
    }
}

module.exports = { searchProducts: scrapeAjio };
