const axios = require('axios');
const cheerio = require('cheerio');

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

/**
 * Scrape RelianceDigital.in for a product price by search query
 */
async function scrapeReliancePrice(query) {
    try {
        const targetUrl = `https://www.reliancedigital.in/search?q=${encodeURIComponent(query)}:relevance`;
        const url = process.env.SCRAPERAPI_KEY
            ? `http://api.scraperapi.com/?api_key=${process.env.SCRAPERAPI_KEY}&url=${encodeURIComponent(targetUrl)}&country_code=in`
            : targetUrl;

        const { data: html } = await axios.get(url, {
            headers: { 'User-Agent': UA, 'Accept': 'text/html', 'Accept-Language': 'en-IN,en;q=0.9' },
            timeout: 20000,
        });

        const $ = cheerio.load(html);
        const results = [];

        // Reliance Digital product cards
        $('[class*="productCardWrapper"], [class*="product-card"], li.product').each((i, el) => {
            if (i >= 5) return false;
            try {
                const name = $(el).find('[class*="product-title"], [class*="productTitle"], p.product-title').first().text().trim();
                const priceRaw = $(el).find('[class*="price"], [class*="Price"], bdi').first().text().replace(/[^0-9]/g, '');
                const price = parseInt(priceRaw);
                const relUrl = $(el).find('a').first().attr('href') || '';
                const productUrl = relUrl.startsWith('http') ? relUrl : `https://www.reliancedigital.in${relUrl}`;
                const availability = !$(el).text().toLowerCase().includes('out of stock');

                if (name && price > 0) {
                    results.push({ store_name: 'Reliance Digital', price, product_url: productUrl, availability });
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
                        results.push({ store_name: 'Reliance Digital', price: Number(item.offers.price), product_url: item.url || targetUrl, availability: true });
                    }
                });
            } catch (e) { /* ignore */ }
        }

        return results.slice(0, 1);
    } catch (error) {
        console.error('❌ Reliance Digital scraper error:', error.message);
        return [];
    }
}

module.exports = { scrapeReliancePrice };
