/**
 * PriceTrackr Popup Script
 */

const API_BASE = 'http://localhost:5001';

async function init() {
    document.getElementById('loader').style.display = 'block';

    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = tab?.url || '';

    const isAmazon   = url.includes('amazon.in');
    const isFlipkart = url.includes('flipkart.com');

    if (!isAmazon && !isFlipkart) {
        document.getElementById('loader').style.display = 'none';
        document.getElementById('notDetected').style.display = 'block';
        return;
    }

    // Try to get last detected product from storage
    const platform = isAmazon ? 'amazon' : 'flipkart';
    const storageKey = `lastProduct_${platform}`;
    const stored = await chrome.storage.local.get(storageKey);
    const product = stored[storageKey];

    document.getElementById('loader').style.display = 'none';

    if (!product) {
        document.getElementById('notDetected').style.display = 'block';
        return;
    }

    // Show product section
    document.getElementById('productSection').style.display = 'block';
    document.getElementById('productName').textContent = product.name.substring(0, 80) + '…';
    document.getElementById('currentPrice').textContent = `₹${(product.price || 0).toLocaleString('en-IN')}`;
    document.getElementById('mrpPrice').textContent = product.mrp ? `₹${product.mrp.toLocaleString('en-IN')}` : '—';

    // Pre-fill target price
    document.getElementById('targetPrice').value = product.price
        ? Math.round(product.price * 0.9)
        : '';

    // Pre-fill platform
    document.getElementById('platformSelect').value = platform;

    // Restore saved email
    const { userEmail } = await chrome.storage.local.get('userEmail');
    if (userEmail) document.getElementById('alertEmail').value = userEmail;

    // Fetch backend tracking data
    const asin = product.asin || 'noid';
    const trackKey = `trackResult_${platform}_${asin}`;
    const trackStored = await chrome.storage.local.get(trackKey);
    const trackResult = trackStored[trackKey];

    if (trackResult) {
        // All-time low
        if (trackResult.allTimeLow?.price) {
            document.getElementById('atlPrice').textContent =
                `₹${trackResult.allTimeLow.price.toLocaleString('en-IN')} (${trackResult.allTimeLow.platform})`;
        }

        // Fake discount badge
        const fd = trackResult.fakeDiscount;
        if (fd) {
            const badge = document.getElementById('fakeDiscountBadge');
            badge.style.display = 'block';
            if (fd.isFake) {
                badge.innerHTML = `<span class="badge fake">⚠️ Possibly Fake Discount — ${fd.reason}</span>`;
            } else {
                badge.innerHTML = `<span class="badge real">✅ Discount Appears Genuine</span>`;
            }
        }

        // Mini bar chart (price history)
        const history = trackResult.priceHistoryCount || 0;
        if (history > 0) {
            // Fetch price history from API
            try {
                const resp = await fetch(
                    `${API_BASE}/api/products/${trackResult.productId}`
                );
                if (resp.ok) {
                    const data = await resp.json();
                    const prices = (data.product?.priceHistory || [])
                        .filter(h => h.platform === platform)
                        .slice(-7)
                        .map(h => h.price);

                    if (prices.length >= 2) renderMiniChart(prices);
                }
            } catch (e) { /* silent */ }
        }
    }

    // ATL badge if current === all-time low
    if (trackResult?.allTimeLow?.price && product.price <= trackResult.allTimeLow.price) {
        const atlEl = document.querySelector('.price-value.atl');
        atlEl.insertAdjacentHTML('afterend', '<span class="badge atl" style="margin-left:6px">🏆 ATL!</span>');
    }
}

function renderMiniChart(prices) {
    const container = document.getElementById('miniChart');
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;
    container.innerHTML = prices.map(p => {
        const h = Math.round(((p - min) / range) * 36) + 4;
        return `<div class="bar" style="height:${h}px" title="₹${p.toLocaleString('en-IN')}"></div>`;
    }).join('');
}

// Set alert button
document.getElementById('setAlertBtn').addEventListener('click', async () => {
    const email       = document.getElementById('alertEmail').value.trim();
    const targetPrice = parseFloat(document.getElementById('targetPrice').value);
    const platform    = document.getElementById('platformSelect').value;
    const statusEl    = document.getElementById('alertStatus');

    if (!email || !targetPrice) {
        statusEl.textContent = 'Please fill in email and target price.';
        statusEl.className   = 'status error';
        return;
    }

    // Save email for next time
    await chrome.storage.local.set({ userEmail: email });

    // Get product data
    const [tab]     = await chrome.tabs.query({ active: true, currentWindow: true });
    const isAmazon  = tab.url.includes('amazon.in');
    const storePlatform = isAmazon ? 'amazon' : 'flipkart';
    const stored    = await chrome.storage.local.get(`lastProduct_${storePlatform}`);
    const product   = stored[`lastProduct_${storePlatform}`];

    if (!product) {
        statusEl.textContent = 'Could not identify product. Reload the page.';
        statusEl.className   = 'status error';
        return;
    }

    // Get productId from track result
    const trackKey    = `trackResult_${storePlatform}_${product.asin || 'noid'}`;
    const trackStored = await chrome.storage.local.get(trackKey);
    const productId   = trackStored[trackKey]?.productId || product.asin || product.url;

    statusEl.textContent = 'Setting alert…';
    statusEl.className   = 'status';

    try {
        const resp = await fetch(`${API_BASE}/api/alerts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email, targetPrice, platform,
                productId: productId.toString(),
                productName: product.name,
            }),
        });
        const data = await resp.json();
        if (data.success) {
            statusEl.textContent = '✅ Alert set! We\'ll email you when price drops.';
            statusEl.className   = 'status success';
        } else {
            throw new Error(data.error || 'Unknown error');
        }
    } catch (err) {
        statusEl.textContent = `❌ ${err.message}`;
        statusEl.className   = 'status error';
    }
});

init().catch(console.error);
