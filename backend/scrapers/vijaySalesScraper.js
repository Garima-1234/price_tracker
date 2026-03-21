const axios = require('axios');
const cheerio = require('cheerio');

const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

/**
 * Scrape VijaysSales.com for a product price by search query
 */
async function scrapeVijaySalesPrice(query) {
    try {
        const targetUrl = `https://www.vijaysales.com/search/${encodeURIComponent(query.replace(/ /g, '-'))}`;
        const url = process.env.SCRAPERAPI_KEY
            ? `http://api.scraperapi.com/?api_key=${process.env.SCRAPERAPI_KEY}&url=${encodeURIComponent(targetUrl)}&country_code=in`
            : targetUrl;

        const { data: html } = await axios.get(url, {
            headers: { 'User-Agent': UA, 'Accept': 'text/html', 'Accept-Language': 'en-IN,en;q=0.9' },
            timeout: 20000,
        });

        const $ = cheerio.load(html);
        const results = [];

        // Vijay Sales product cards
        $('[class*="product-card"], [class*="productWrapper"], .product-item').each((i, el) => {
            if (i >= 5) return false;
            try {
                const name = $(el).find('[class*="product-name"], [class*="title"]').first().text().trim();
                const priceRaw = $(el).find('[class*="price"], [class*="Price"], bdi').first().text().replace(/[^0-9]/g, '');
                const price = parseInt(priceRaw);
                const relUrl = $(el).find('a').first().attr('href') || '';
                const productUrl = relUrl.startsWith('http') ? relUrl : `https://www.vijaysales.com${relUrl}`;
                const availability = !$(el).text().toLowerCase().includes('out of stock');

                if (name && price > 0) {
                    results.push({ store_name: 'Vijay Sales', price, product_url: productUrl, availability });
                }
            } catch (e) { /* skip */ }
        });

        // Fallback: try JSON-LD structured data
        if (results.length === 0) {
            try {
                $('script[type="application/ld+json"]').each((_, el) => {
                    const json = JSON.parse($(el).html());
                    const item = Array.isArray(json.itemListElement) ? json.itemListElement[0]?.item : json;
                    if (item?.offers?.price) {
                        results.push({ store_name: 'Vijay Sales', price: Number(item.offers.price), product_url: item.url || targetUrl, availability: true });
                    }
                });
            } catch (e) { /* ignore */ }
        }

        return results.slice(0, 1);
    } catch (error) {
        console.error('❌ Vijay Sales scraper error:', error.message);
        return [];
    }
}

module.exports = { scrapeVijaySalesPrice };
