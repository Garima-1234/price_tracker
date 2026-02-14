const axios = require('axios');
const cheerio = require('cheerio');

const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
];

function getRandomUA() {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

/**
 * Scrape products from Flipkart using HTTP + Cheerio
 */
async function scrapeFlipkart(query) {
    try {
        const url = `https://www.flipkart.com/search?q=${encodeURIComponent(query)}`;
        console.log(`🔍 Flipkart: Searching for "${query}"`);

        const { data: html } = await axios.get(url, {
            headers: {
                'User-Agent': getRandomUA(),
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7,hi;q=0.6',
                'Accept-Encoding': 'gzip, deflate, br',
                'DNT': '1',
                'Connection': 'keep-alive',
            },
            timeout: 15000,
        });

        const $ = cheerio.load(html);
        const products = [];

        // Flipkart uses different selectors for different layouts
        // Try multiple approaches

        // Approach 1: data-id based product containers
        $('[data-id]').each((i, el) => {
            if (products.length >= 10) return false;
            try {
                const $el = $(el);

                // Title selectors (Flipkart keeps changing these)
                const name = $el.find('.IRpwTa').text().trim() ||
                    $el.find('._4rR01T').text().trim() ||
                    $el.find('.s1Q9rs').text().trim() ||
                    $el.find('.WKTcLC').text().trim() ||
                    $el.find('.wjcEIp').text().trim() ||
                    $el.find('a[title]').attr('title') ||
                    $el.find('.KzDlHZ').text().trim() ||
                    '';

                // Price selectors
                const priceText = $el.find('._30jeq3').first().text() ||
                    $el.find('.Nx9bqj').first().text() ||
                    $el.find('._1_WHN1').first().text() ||
                    '';
                const price = parseInt(priceText.replace(/[^0-9]/g, ''));

                // Image
                const image = $el.find('img._396cs4').attr('src') ||
                    $el.find('img.DByuf4').attr('src') ||
                    $el.find('img._2r_T1I').attr('src') ||
                    $el.find('img').first().attr('src') ||
                    '';

                // Link
                let href = $el.find('a._1fQZEK').attr('href') ||
                    $el.find('a.CGtC98').attr('href') ||
                    $el.find('a[href*="/p/"]').attr('href') ||
                    $el.find('a').first().attr('href') ||
                    '';
                const productUrl = href ? (href.startsWith('http') ? href : `https://www.flipkart.com${href}`) : '';

                // Rating
                let rating = 0;
                const ratingText = $el.find('._3LWZlK').first().text() ||
                    $el.find('.XQDdHH').first().text() || '';
                const ratingMatch = ratingText.match(/([\d.]+)/);
                if (ratingMatch) rating = parseFloat(ratingMatch[1]);

                if (name && price > 0) {
                    products.push({ name, price, image, url: productUrl, rating, platform: 'flipkart', inStock: true });
                }
            } catch (e) { /* skip */ }
        });

        // Approach 2: If approach 1 didn't find enough, try generic product containers
        if (products.length === 0) {
            $('a[href*="/p/"]').each((i, el) => {
                if (products.length >= 10) return false;
                try {
                    const $el = $(el);
                    const $parent = $el.closest('div[data-id]').length ? $el.closest('div[data-id]') : $el.parent().parent();

                    const name = $el.attr('title') || $el.find('div').first().text().trim();
                    const priceText = $parent.find('._30jeq3, .Nx9bqj, ._1_WHN1').first().text();
                    const price = parseInt((priceText || '').replace(/[^0-9]/g, ''));
                    const image = $parent.find('img').first().attr('src') || '';
                    let href = $el.attr('href') || '';
                    const productUrl = href.startsWith('http') ? href : `https://www.flipkart.com${href}`;

                    if (name && name.length > 5 && price > 0) {
                        products.push({ name: name.substring(0, 150), price, image, url: productUrl, rating: 0, platform: 'flipkart', inStock: true });
                    }
                } catch (e) { /* skip */ }
            });
        }

        console.log(`✅ Flipkart: Found ${products.length} products`);
        return products;
    } catch (error) {
        console.error('❌ Flipkart scraper error:', error.message);
        return [];
    }
}

module.exports = { scrapeFlipkart, searchProducts: scrapeFlipkart };
