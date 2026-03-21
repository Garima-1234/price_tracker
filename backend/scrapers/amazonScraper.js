const axios = require('axios');
const cheerio = require('cheerio');

const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
];

function getRandomUA() {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

/**
 * Scrape products from Amazon India using HTTP + Cheerio
 */
async function scrapeAmazon(query) {
    try {
        const targetUrl = `https://www.amazon.in/s?k=${encodeURIComponent(query)}`;
        const url = process.env.SCRAPERAPI_KEY 
            ? `http://api.scraperapi.com/?api_key=${process.env.SCRAPERAPI_KEY}&url=${encodeURIComponent(targetUrl)}&country_code=in`
            : targetUrl;
            
        console.log(`🔍 Amazon: Searching for "${query}" (Proxy: ${!!process.env.SCRAPERAPI_KEY})`);

        const { data: html } = await axios.get(url, {
            headers: {
                'User-Agent': getRandomUA(),
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7,hi;q=0.6',
                'Accept-Encoding': 'gzip, deflate, br',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Cache-Control': 'max-age=0',
            },
            timeout: 25000,
        });

        const $ = cheerio.load(html);
        const products = [];

        $('[data-component-type="s-search-result"]').each((i, el) => {
            if (i >= 10) return false;
            try {
                const $el = $(el);
                const name = $el.find('h2 a span').first().text().trim() ||
                    $el.find('.a-text-normal').first().text().trim();

                const priceText = $el.find('.a-price-whole').first().text().replace(/[^0-9]/g, '');
                const price = parseInt(priceText);

                const image = $el.find('img.s-image').attr('src') || '';

                let href = $el.find('h2 a').attr('href') || '';
                let productUrl = href;
                if (href) {
                     productUrl = href.startsWith('http') ? href : `https://www.amazon.in${href}`;
                }

                let rating = 0;
                const ratingText = $el.find('.a-icon-star-small .a-icon-alt').first().text();
                const ratingMatch = ratingText.match(/([\d.]+)/);
                if (ratingMatch) rating = parseFloat(ratingMatch[1]);

                const reviewText = $el.find('.a-size-base.s-underline-text').first().text().replace(/[^0-9]/g, '');
                const reviewCount = parseInt(reviewText) || 0;

                if (name && price > 0) {
                    products.push({ name, price, image, url: productUrl, rating, reviewCount, platform: 'amazon', inStock: true });
                }
            } catch (e) { /* skip */ }
        });

        console.log(`✅ Amazon: Found ${products.length} products`);
        return products;
    } catch (error) {
        console.error('❌ Amazon scraper error:', error.message);
        return [];
    }
}

module.exports = { scrapeAmazon, searchProducts: scrapeAmazon };
