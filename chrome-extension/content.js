/**
 * PriceTrackr Content Script
 * Detects product pages on Amazon.in and Flipkart.com
 * Extracts product info and sends to background service worker
 */

(function () {
    'use strict';

    const hostname = window.location.hostname;

    // ─── Amazon Detection ────────────────────────────────────────────────────
    function detectAmazon() {
        const titleEl = document.getElementById('productTitle');
        if (!titleEl) return null;

        const name = titleEl.textContent.trim();

        // Price
        const priceWhole    = document.querySelector('.a-price-whole');
        const priceFraction = document.querySelector('.a-price-fraction');
        const priceText     = (priceWhole?.textContent || '0').replace(/[^0-9]/g, '')
                            + (priceFraction?.textContent || '');
        const price = parseFloat(priceText) || 0;

        // MRP
        const mrpEl  = document.querySelector('.a-text-price .a-offscreen, [data-a-strike="true"] .a-offscreen');
        const mrpText = mrpEl?.textContent || '';
        const mrp    = parseFloat(mrpText.replace(/[^0-9.]/g, '')) || price;

        // Image
        const image = document.getElementById('landingImage')?.src
                   || document.getElementById('imgTagWrapperId')?.querySelector('img')?.src
                   || '';

        // Rating
        const ratingEl   = document.getElementById('acrPopover');
        const ratingText = ratingEl?.getAttribute('title') || '';
        const ratingMatch = ratingText.match(/([\d.]+)/);
        const rating = ratingMatch ? parseFloat(ratingMatch[1]) : 0;

        // ASIN from URL
        const asinMatch = window.location.pathname.match(/\/dp\/([A-Z0-9]{10})/);
        const asin = asinMatch ? asinMatch[1] : '';

        const inStock = !document.getElementById('outOfStock')
                     && !document.getElementById('availability')?.textContent?.includes('Currently unavailable');

        if (!name || price <= 0) return null;

        return { name, price, mrp, image, rating, asin, inStock, url: window.location.href, platform: 'amazon' };
    }

    // ─── Flipkart Detection ──────────────────────────────────────────────────
    function detectFlipkart() {
        // Flipkart product page selectors
        const titleEl = document.querySelector('.B_NuCI, [class*="title"] h1, .yhB1nd');
        if (!titleEl) return null;

        const name = titleEl.textContent.trim();

        const priceEl   = document.querySelector('._30jeq3, .Nx9bqj, ._16Jk6d');
        const priceText = priceEl?.textContent || '';
        const price     = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;

        const mrpEl   = document.querySelector('._3I9_wc, ._2p6lqe, [class*="dq-original-price"]');
        const mrpText = mrpEl?.textContent || '';
        const mrp     = parseFloat(mrpText.replace(/[^0-9.]/g, '')) || price;

        const image = document.querySelector('._396cs4, ._2r_T1I, img._3kidJX')?.src || '';

        const ratingEl   = document.querySelector('._3LWZlK, .XQDdHH');
        const ratingText = ratingEl?.textContent || '';
        const ratingMatch = ratingText.match(/([\d.]+)/);
        const rating = ratingMatch ? parseFloat(ratingMatch[1]) : 0;

        const inStock = !document.querySelector('[class*="out-of-stock"], ._2oFCNE');

        if (!name || price <= 0) return null;

        return { name, price, mrp, image, rating, asin: '', inStock, url: window.location.href, platform: 'flipkart' };
    }

    // ─── Main ────────────────────────────────────────────────────────────────
    function detect() {
        let data = null;
        if (hostname.includes('amazon.in')) {
            data = detectAmazon();
        } else if (hostname.includes('flipkart.com')) {
            data = detectFlipkart();
        }

        if (data) {
            console.log('[PriceTrackr] Detected product:', data);
            chrome.runtime.sendMessage({ type: 'PRODUCT_DETECTED', data });

            // Store latest product in tab storage for popup
            chrome.storage.local.set({ [`lastProduct_${data.platform}`]: data });
        }
    }

    // Run on load + observe DOM changes (for SPAs)
    detect();

    let debounceTimer;
    const observer = new MutationObserver(() => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(detect, 1500);
    });
    observer.observe(document.body, { childList: true, subtree: true });

})();
