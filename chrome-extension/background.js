/**
 * PriceTrackr — Background Service Worker (MV3)
 * Receives product data from content scripts
 * Posts to backend API and checks price alerts
 */

const API_BASE = 'http://localhost:5001'; // Change to prod URL before deploying

// ─── Message Listener ─────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'PRODUCT_DETECTED') {
        handleProductDetected(message.data, sender.tab)
            .then(result => sendResponse({ success: true, result }))
            .catch(err => sendResponse({ success: false, error: err.message }));
        return true; // keep channel open for async
    }

    if (message.type === 'SET_ALERT') {
        setAlert(message.data)
            .then(result => sendResponse({ success: true, result }))
            .catch(err => sendResponse({ success: false, error: err.message }));
        return true;
    }

    if (message.type === 'GET_ACTIVE_ALERTS') {
        getActiveAlerts()
            .then(alerts => sendResponse({ success: true, alerts }))
            .catch(err => sendResponse({ success: false, error: err.message }));
        return true;
    }
});

// ─── Product Detected Handler ─────────────────────────────────────────────
async function handleProductDetected(data, tab) {
    try {
        // Report price to backend
        const response = await fetch(`${API_BASE}/api/scrape/report`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (!response.ok) throw new Error(`API error: ${response.status}`);

        const result = await response.json();

        // Update badge with lowest price found
        if (result.lowestPrice && tab?.id) {
            const badge = `₹${(result.lowestPrice / 1000).toFixed(0)}k`;
            chrome.action.setBadgeText({ text: badge, tabId: tab.id });
            chrome.action.setBadgeBackgroundColor({ color: '#7c3aed', tabId: tab.id });
        }

        // Store result for popup
        await chrome.storage.local.set({
            [`trackResult_${data.platform}_${data.asin || 'noid'}`]: {
                ...result,
                productData: data,
                checkedAt: Date.now(),
            }
        });

        // Show notification if it's an all-time low
        if (result.allTimeLow && data.price <= result.allTimeLow.price) {
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icons/icon48.png',
                title: '🎉 All-Time Low Price!',
                message: `${data.name.substring(0, 50)} is at its lowest price: ₹${data.price.toLocaleString('en-IN')}`,
                priority: 2,
            });
        }

        return result;
    } catch (error) {
        console.warn('[PriceTrackr] Background API error:', error.message);
        return null;
    }
}

// ─── Set Alert ────────────────────────────────────────────────────────────
async function setAlert({ email, productId, productName, targetPrice, platform }) {
    const response = await fetch(`${API_BASE}/api/alerts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, productId, productName, targetPrice, platform: platform || 'any' }),
    });
    if (!response.ok) throw new Error(`Alert API error: ${response.status}`);
    return response.json();
}

// ─── Get Active Alerts ─────────────────────────────────────────────────────
async function getActiveAlerts() {
    const { userEmail } = await chrome.storage.local.get('userEmail');
    if (!userEmail) return [];
    const response = await fetch(`${API_BASE}/api/alerts?email=${encodeURIComponent(userEmail)}`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.alerts || [];
}
