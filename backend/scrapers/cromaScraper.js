const axios = require('axios');
const cheerio = require('cheerio');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

/**
 * Scrape Croma.com for a product price by search query
 */
async function scrapeCromaPrice(query) {
    try {
        const targetUrl = `https://www.croma.com/search/?q=${encodeURIComponent(query)}%3Arelevance&langCode=en`;
        const url = process.env.SCRAPERAPI_KEY
            ? `http://api.scraperapi.com/?api_key=${process.env.SCRAPERAPI_KEY}&url=${encodeURIComponent(targetUrl)}&country_code=in`
            : targetUrl;

        const { data: html } = await axios.get(url, {
            headers: { 'User-Agent': UA, 'Accept': 'text/html', 'Accept-Language': 'en-IN,en;q=0.9' },
            timeout: 20000,
        });

        const $ = cheerio.load(html);
        const results = [];

        // Croma product cards
        $('li.product-item').each((i, el) => {
            if (i >= 5) return false;
            try {
                const name = $(el).find('h3.product-title a, .product-title').first().text().trim();
                const priceRaw = $(el).find('[class*="pdp-discounted-price"], [class*="amount"], .new-price bdi').first().text().replace(/[^0-9]/g, '');
                const price = parseInt(priceRaw);
                const relUrl = $(el).find('a.product-img, h3 a').first().attr('href') || '';
                const productUrl = relUrl.startsWith('http') ? relUrl : `https://www.croma.com${relUrl}`;
                const availability = !$(el).text().toLowerCase().includes('out of stock');

                if (name && price > 0) {
                    results.push({ store_name: 'Croma', price, product_url: productUrl, availability });
                }
            } catch (e) { /* skip */ }
        });

        // If Croma returns JSON (new site builds), try parsing structured data
        if (results.length === 0) {
            try {
                $('script[type="application/ld+json"]').each((_, el) => {
                    const json = JSON.parse($(el).html());
                    if (json['@type'] === 'Product' || json['@type'] === 'ItemList') {
                        const item = Array.isArray(json.itemListElement) ? json.itemListElement[0]?.item : json;
                        if (item?.offers?.price) {
                            results.push({ store_name: 'Croma', price: Number(item.offers.price), product_url: item.url || targetUrl, availability: item.offers.availability !== 'OutOfStock' });
                        }
                    }
                });
            } catch (e) { /* ignore */ }
        }

        return results.slice(0, 1); // Return best match
    } catch (error) {
        console.error('❌ Croma scraper error:', error.message);
        return [];
    }
}

module.exports = { scrapeCromaPrice };
