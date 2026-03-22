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
        console.log(`[Ajio][DEBUG] HTML saved: ${filename}`);
    } catch (e) {
        console.log(`[Ajio][DEBUG] Failed to save HTML: ${e.message}`);
    }
}
function extractProductsFromJson(data, limit = 10) {
    const results = [];
    const seen = new Set();

    function addItem(item) {
        if (!item || typeof item !== 'object') return;
        const name = `${item.brandName || item.brand || ''} ${item.name || item.productName || item.title || ''}`.trim();
        const price = item.price?.value || item.offerPrice || item.sellingPrice || item.finalPrice || item.price || 0;
        let image = item.images?.[0]?.url || item.imageUrl || item.fnlColorVariantData?.colorVariantImages?.[0] || item.image || '';
        if (image && !image.startsWith('http')) image = `https://assets.ajio.com${image}`;
        const productUrl = item.url ? `https://www.ajio.com${item.url}` : '';
        const brand = item.brandName || item.brand || '';

        const key = (item.code || item.productId || name).toString().toLowerCase();
        if (name && price > 0 && !seen.has(key)) {
            results.push({ name, price, image, url: productUrl, rating: 0, brand, platform: 'ajio', inStock: true });
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

        if ((obj.name || obj.productName || obj.title || obj.code) && (obj.price || obj.offerPrice || obj.sellingPrice || obj.finalPrice)) {
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

function hasAjioProducts(data) {
    if (!data) return false;
    const candidates = [
        data.products,
        data.searchData?.products,
        data.data?.products,
        data.response?.docs,
        data.results
    ];
    return candidates.some(arr => Array.isArray(arr) && arr.length > 0);
}

async function fetchAjioApi(query) {
    const encoded = encodeURIComponent(query);
    const urls = [
        `https://www.ajio.com/api/search?searchQuery=${encoded}&gridColumns=3&from=0&size=10`,
        `https://www.ajio.com/api/search?query=${encoded}&gridColumns=3&from=0&size=10`,
        `https://www.ajio.com/api/search?text=${encoded}&gridColumns=3&from=0&size=10`
    ];

    for (const url of urls) {
        try {
            const targetUrl = url;
            const fetchUrl = process.env.SCRAPERAPI_KEY
                ? `http://api.scraperapi.com/?api_key=${process.env.SCRAPERAPI_KEY}&url=${encodeURIComponent(targetUrl)}&country_code=in`
                : targetUrl;
            const usingProxy = !!process.env.SCRAPERAPI_KEY;
            console.log(`[Ajio][API] GET ${usingProxy ? targetUrl : fetchUrl} (proxy=${usingProxy})`);

            const response = await axios.get(fetchUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                    'Accept': 'application/json, text/plain, */*',
                    'Accept-Language': 'en-IN,en;q=0.9',
                    'Referer': `https://www.ajio.com/search/?text=${encoded}`,
                    'Origin': 'https://www.ajio.com',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                timeout: 12000,
                validateStatus: () => true,
            });

            const data = response.data;
            const ct = response.headers?.['content-type'] || '';
            const size = typeof data === 'string' ? data.length : JSON.stringify(data || {}).length;
            console.log(`[Ajio][API] status=${response.status} ct=${ct} size=${size}`);
            if (size > 0 && size < 500) {
                const snippet = typeof data === 'string' ? data : JSON.stringify(data);
                console.log(`[Ajio][API] body=${snippet.slice(0, 300)}`);
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
 * Ajio search API scraper ??? uses their internal API for product listing
 */
async function scrapeAjio(query) {
    try {
        console.log(`???? Ajio: Searching for "${query}"`);

        const data = await fetchAjioApi(query);
        let products = data ? extractProductsFromJson(data, 10) : [];

        // If API returns empty/blocked payload, try HTML fallback
        if (!hasAjioProducts(data) || products.length === 0) {
            const htmlProducts = await scrapeAjioHTML(query);
            if (htmlProducts.length > 0) products = htmlProducts;
        }

        console.log(`??? Ajio: Found ${products.length} products`);
        return products;
    } catch (error) {
        // Fallback: try HTML scraping
        console.log(`??????  Ajio API failed (${error.message}), trying HTML...`);
        return scrapeAjioHTML(query);
    }
}

async function scrapeAjioHTML(query) {
    try {
        const cheerio = require('cheerio');
        const url = `https://www.ajio.com/search/?text=${encodeURIComponent(query)}`;

        const targetUrl = url;
        const fetchUrl = process.env.SCRAPERAPI_KEY
            ? `http://api.scraperapi.com/?api_key=${process.env.SCRAPERAPI_KEY}&url=${encodeURIComponent(targetUrl)}&country_code=in`
            : targetUrl;
        const usingProxy = !!process.env.SCRAPERAPI_KEY;
        console.log(`[Ajio][HTML] GET ${usingProxy ? targetUrl : fetchUrl} (proxy=${usingProxy})`);

        const response = await axios.get(fetchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html',
            },
            timeout: 10000,
            validateStatus: () => true,
        });

        const html = response.data || '';
        const ct = response.headers?.['content-type'] || '';
        const size = typeof html === 'string' ? html.length : JSON.stringify(html || {}).length;
        console.log(`[Ajio][HTML] status=${response.status} ct=${ct} size=${size}`);
        if (typeof html === 'string' && html.length > 0) {
            maybeDumpHtml('ajio', html);
        }

        const $ = cheerio.load(html);
        const products = [];

        const json = extractJsonFromHtml($);
        if (json) {
            const parsed = extractProductsFromJson(json, 10);
            parsed.forEach(p => products.push(p));
        }

        if (products.length === 0) {
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
        }

        console.log(`??? Ajio HTML: Found ${products.length} products`);
        return products;
    } catch (error) {
        console.error('??? Ajio scraper error:', error.message);
        return [];
    }
}

module.exports = { searchProducts: scrapeAjio };
