const axios = require('axios');
const fs = require('fs');
const path = require('path');


function maybeDumpHtml(prefix, html) {
    if (process.env.SCRAPER_DEBUG_HTML !== 'true') return;
    try {
        const dir = path.join(__dirname, 'debug');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        const filename = path.join(dir, `${prefix}_${Date.now()}.html`);
        fs.writeFileSync(filename, html, 'utf-8');
        console.log(`[Myntra][DEBUG] HTML saved: ${filename}`);
    } catch (e) {
        console.log(`[Myntra][DEBUG] Failed to save HTML: ${e.message}`);
    }
}
function extractProductsFromJson(data, limit = 10) {
    const results = [];
    const seen = new Set();

    function addItem(item) {
        if (!item || typeof item !== 'object') return;
        const name = `${item.brand || ''} ${item.product || item.productName || item.name || ''}`.trim();
        const price = item.price || item.discountedPrice || item.mrp || item.finalPrice || 0;
        const image = item.searchImage || item.image || (item.images && item.images[0]) || '';
        const productUrl = item.landingPageUrl
            ? `https://www.myntra.com/${item.landingPageUrl}`
            : (item.productId ? `https://www.myntra.com/${item.productId}` : '');
        const rating = item.rating || item.averageRating || 0;
        const brand = item.brand || '';
        const reviewCount = item.ratingCount || 0;

        const key = (item.productId || name).toString().toLowerCase();
        if (name && price > 0 && !seen.has(key)) {
            results.push({ name, price, image, url: productUrl, rating, reviewCount, brand, platform: 'myntra', inStock: true });
            seen.add(key);
        }
    }

    function walk(obj) {
        if (!obj || results.length >= limit) return;
        if (Array.isArray(obj)) {
            obj.forEach(walk);
            return;
        }
        if (typeof obj !== 'object') return;

        if (
            (obj.productName || obj.product || obj.productId || obj.name) &&
            (obj.price || obj.discountedPrice || obj.mrp || obj.finalPrice)
        ) {
            addItem(obj);
        }

        Object.values(obj).forEach(walk);
    }

    walk(data);
    return results;
}

function extractJsonFromHtml($) {
    const nextData = $('#__NEXT_DATA__').html();
    if (nextData) {
        try { return JSON.parse(nextData); } catch (e) { /* ignore */ }
    }

    const preloaded = $('#__PRELOADED_STATE__').html();
    if (preloaded) {
        try { return JSON.parse(preloaded); } catch (e) { /* ignore */ }
    }

    // Fallback: scan for window.__INITIAL_STATE__
    let json = null;
    $('script').each((_, el) => {
        const text = $(el).html() || '';
        if (json || !text.includes('__INITIAL_STATE__')) return;
        const match = text.match(/__INITIAL_STATE__\s*=\s*({[\s\S]*?})\s*;?/);
        if (match) {
            try { json = JSON.parse(match[1]); } catch (e) { /* ignore */ }
        }
    });
    return json;
}

function hasMyntraProducts(data) {
    if (!data) return false;
    const candidates = [
        data.products,
        data.results,
        data.data?.products,
        data.data?.results,
        data.searchData?.products
    ];
    return candidates.some(arr => Array.isArray(arr) && arr.length > 0);
}

async function fetchMyntraApi(query) {
    const encoded = encodeURIComponent(query);
    const urls = [
        `https://www.myntra.com/gateway/v2/search/${encoded}?p=1&rows=10&sort=popularity`,
        `https://www.myntra.com/gateway/v2/search/${encoded}?p=1&rows=10&o=0&plaEnabled=false`,
        `https://www.myntra.com/gateway/v2/search/${encoded}?p=1&rows=10`
    ];

    for (const url of urls) {
        try {
            const targetUrl = url;
            const fetchUrl = process.env.SCRAPERAPI_KEY
                ? `http://api.scraperapi.com/?api_key=${process.env.SCRAPERAPI_KEY}&url=${encodeURIComponent(targetUrl)}&country_code=in`
                : targetUrl;
            const usingProxy = !!process.env.SCRAPERAPI_KEY;
            console.log(`[Myntra][API] GET ${usingProxy ? targetUrl : fetchUrl} (proxy=${usingProxy})`);

            const response = await axios.get(fetchUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                    'Accept': 'application/json, text/plain, */*',
                    'Accept-Language': 'en-IN,en;q=0.9',
                    'Referer': `https://www.myntra.com/${encoded}`,
                    'Origin': 'https://www.myntra.com',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-Location-Country': 'IN',
                },
                timeout: 12000,
                validateStatus: () => true,
            });

            const data = response.data;
            const ct = response.headers?.['content-type'] || '';
            const size = typeof data === 'string' ? data.length : JSON.stringify(data || {}).length;
            console.log(`[Myntra][API] status=${response.status} ct=${ct} size=${size}`);
            if (size > 0 && size < 500) {
                const snippet = typeof data === 'string' ? data : JSON.stringify(data);
                console.log(`[Myntra][API] body=${snippet.slice(0, 300)}`);
            }

            if (response.status === 200 && data) {
                return data;
            }
        } catch (e) {
            // try next URL
        }
    }
    return null;
}

/**
 * Myntra uses an internal API for search ??? much more reliable than scraping HTML
 * The API endpoint returns JSON directly
 */
async function scrapeMyntra(query) {
    try {
        console.log(`???? Myntra: Searching for "${query}"`);

        const data = await fetchMyntraApi(query);
        let products = data ? extractProductsFromJson(data, 10) : [];

        // If API returns empty/blocked payload, try HTML fallback
        if (!hasMyntraProducts(data) || products.length === 0) {
            const htmlProducts = await scrapeMyntraHTML(query);
            if (htmlProducts.length > 0) products = htmlProducts;
        }

        console.log(`??? Myntra: Found ${products.length} products`);
        return products;
    } catch (error) {
        // Fallback: try scraping the HTML page if API fails
        console.log(`??????  Myntra API failed (${error.message}), trying HTML scrape...`);
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

        const targetUrl = url;
        const fetchUrl = process.env.SCRAPERAPI_KEY
            ? `http://api.scraperapi.com/?api_key=${process.env.SCRAPERAPI_KEY}&url=${encodeURIComponent(targetUrl)}&country_code=in`
            : targetUrl;
        const usingProxy = !!process.env.SCRAPERAPI_KEY;
        console.log(`[Myntra][HTML] GET ${usingProxy ? targetUrl : fetchUrl} (proxy=${usingProxy})`);

        const response = await axios.get(fetchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml',
                'Accept-Language': 'en-IN,en;q=0.9',
            },
            timeout: 10000,
            validateStatus: () => true,
        });

        const html = response.data || '';
        const ct = response.headers?.['content-type'] || '';
        const size = typeof html === 'string' ? html.length : JSON.stringify(html || {}).length;
        console.log(`[Myntra][HTML] status=${response.status} ct=${ct} size=${size}`);
        if (typeof html === 'string' && html.length > 0) {
            maybeDumpHtml('myntra', html);
        }

        const $ = cheerio.load(html);
        const products = [];

        // Try structured JSON (Next.js / preloaded state)
        const json = extractJsonFromHtml($);
        if (json) {
            const parsed = extractProductsFromJson(json, 10);
            parsed.forEach(p => products.push(p));
        }

        // Fallback: Myntra embeds product data in a script tag
        if (products.length === 0) {
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
        }

        console.log(`??? Myntra HTML: Found ${products.length} products`);
        return products;
    } catch (error) {
        console.error('??? Myntra HTML scraper error:', error.message);
        return [];
    }
}

module.exports = { searchProducts: scrapeMyntra };
