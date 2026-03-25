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

function normalizeFlipkartImage(url) {
    if (!url) return '';
    return url
        .replace('{@width}', '612')
        .replace('{@height}', '612')
        .replace('{@quality}', '80');
}

function extractInitialState(html) {
    const marker = 'window.__INITIAL_STATE__';
    const idx = html.indexOf(marker);
    if (idx === -1) return null;
    const start = html.indexOf('{', idx);
    if (start === -1) return null;
    let depth = 0;
    let end = null;
    for (let i = start; i < html.length; i++) {
        const ch = html[i];
        if (ch === '{') depth++;
        else if (ch === '}') {
            depth--;
            if (depth === 0) {
                end = i + 1;
                break;
            }
        }
    }
    if (!end) return null;
    try {
        return JSON.parse(html.slice(start, end));
    } catch (e) {
        return null;
    }
}

function extractJsonLdUrlMap($) {
    const map = new Map();
    const scripts = $('script[type="application/ld+json"]');
    scripts.each((_, el) => {
        const text = $(el).html();
        if (!text) return;
        try {
            const parsed = JSON.parse(text);
            const blocks = Array.isArray(parsed) ? parsed : [parsed];
            blocks.forEach(block => {
                if (block?.['@type'] === 'ItemList' || block?.itemListElement) {
                    const items = block.itemListElement || [];
                    items.forEach(item => {
                        if (item?.name && item?.url) {
                            map.set(item.name.toLowerCase(), item.url);
                        }
                    });
                }
            });
        } catch (e) {
            // ignore malformed JSON-LD blocks
        }
    });
    return map;
}

function pickPrice(pricing) {
    if (!pricing || typeof pricing !== 'object') return null;
    if (pricing.finalPrice?.value) return pricing.finalPrice.value;
    if (Array.isArray(pricing.prices)) {
        const special = pricing.prices.find(p => p?.priceType === 'SPECIAL_PRICE' && p?.value);
        if (special?.value) return special.value;
        const fsp = pricing.prices.find(p => p?.priceType === 'FSP' && p?.value);
        if (fsp?.value) return fsp.value;
    }
    return null;
}

function extractProductsFromInitialState(state, urlMap) {
    const products = [];
    const seen = new Set();

    function walk(obj) {
        if (!obj) return;
        if (Array.isArray(obj)) {
            obj.forEach(walk);
            return;
        }
        if (typeof obj !== 'object') return;

        if (typeof obj.title === 'string' && obj.pricing && obj.productId) {
            const name = obj.title.trim();
            const price = pickPrice(obj.pricing);
            if (name && price && !seen.has(name.toLowerCase())) {
                const image = normalizeFlipkartImage(obj.imageUrl || '');
                const url = obj.productUrl || urlMap.get(name.toLowerCase()) || '';
                const rating = typeof obj.averageRating === 'number' ? obj.averageRating : 0;
                products.push({
                    name,
                    price,
                    image,
                    url,
                    rating,
                    platform: 'flipkart',
                    inStock: true
                });
                seen.add(name.toLowerCase());
            }
        }

        Object.values(obj).forEach(walk);
    }

    walk(state);
    return products;
}

/**
 * Scrape products from Flipkart using HTTP + Cheerio
 */
async function scrapeFlipkart(query) {
    try {
        const targetUrl = `https://www.flipkart.com/search?q=${encodeURIComponent(query)}`;
        const url = process.env.SCRAPERAPI_KEY 
            ? `http://api.scraperapi.com/?api_key=${process.env.SCRAPERAPI_KEY}&url=${encodeURIComponent(targetUrl)}&country_code=in`
            : targetUrl;
            
        console.log(`🔍 Flipkart: Searching for "${query}" (Proxy: ${!!process.env.SCRAPERAPI_KEY})`);

        const { data: html } = await axios.get(url, {
            headers: {
                'User-Agent': getRandomUA(),
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7,hi;q=0.6',
                'Accept-Encoding': 'gzip, deflate, br',
                'DNT': '1',
                'Connection': 'keep-alive',
            },
            timeout: 25000,
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
                let productUrl = href ? (href.startsWith('http') ? href : `https://www.flipkart.com${href}`) : '';
                // Kept original URL so exact variants are preserved

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
                    let productUrl = href.startsWith('http') ? href : `https://www.flipkart.com${href}`;
                    // Kept original URL so exact variants are preserved

                    if (name && name.length > 5 && price > 0) {
                        products.push({ name: name.substring(0, 150), price, image, url: productUrl, rating: 0, platform: 'flipkart', inStock: true });
                    }
                } catch (e) { /* skip */ }
            });
        }

        // Approach 3: Parse embedded initial state (SSR JSON) + JSON-LD URLs
        if (products.length === 0) {
            const state = extractInitialState(html);
            if (state) {
                const urlMap = extractJsonLdUrlMap($);
                const parsed = extractProductsFromInitialState(state, urlMap);
                parsed.slice(0, 10).forEach(p => products.push(p));
            }
        }

        console.log(`✅ Flipkart: Found ${products.length} products`);
        return products;
    } catch (error) {
        console.error('❌ Flipkart scraper error:', error.message);
        return [];
    }
}

/**
 * Fetch single product price from a Flipkart product page URL
 * Returns { price, inStock }
 */
async function getFlipkartPrice(productUrl) {
    try {
        if (!productUrl) return null;
        const targetUrl = productUrl;
        const url = process.env.SCRAPERAPI_KEY
            ? `http://api.scraperapi.com/?api_key=${process.env.SCRAPERAPI_KEY}&url=${encodeURIComponent(targetUrl)}&country_code=in`
            : targetUrl;

        const { data: html } = await axios.get(url, {
            headers: {
                'User-Agent': getRandomUA(),
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7,hi;q=0.6',
                'Accept-Encoding': 'gzip, deflate, br',
                'DNT': '1',
                'Connection': 'keep-alive',
            },
            timeout: 20000,
        });

        const $ = cheerio.load(html);
        const priceText =
            $('._30jeq3').first().text() ||
            $('.Nx9bqj').first().text() ||
            $('._16Jk6d').first().text() ||
            '';
        const price = parseInt((priceText || '').replace(/[^0-9]/g, ''), 10);

        const pageText = $('body').text().toLowerCase();
        const inStock = !pageText.includes('out of stock') && !pageText.includes('sold out');

        if (!price || Number.isNaN(price)) return null;
        return { price, inStock };
    } catch (error) {
        console.error('Flipkart price fetch error:', error.message);
        return null;
    }
}

module.exports = { scrapeFlipkart, searchProducts: scrapeFlipkart, getFlipkartPrice };
