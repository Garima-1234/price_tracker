const cron = require('node-cron');
const Product = require('../models/Product');
const PriceHistory = require('../models/PriceHistory');
const User = require('../models/User');
const { getAmazonPrice } = require('../scrapers/amazonScraper');
const { getFlipkartPrice } = require('../scrapers/flipkartScraper');
const { sendPriceDropAlert } = require('../utils/notifications');

/**
 * Save a price entry to the dedicated PriceHistory collection.
 * Prevents duplicates: skips write if the same price was already recorded
 * for this product+store within the last 6 hours.
 */
async function savePriceEntry(productId, store, price) {
    const SIX_HOURS = 6 * 60 * 60 * 1000;
    const cutoff = new Date(Date.now() - SIX_HOURS);

    const recent = await PriceHistory.findOne({
        product_id: productId,
        store,
        price,
        timestamp: { $gte: cutoff }
    });

    if (recent) return; // Duplicate — skip

    await PriceHistory.create({ product_id: productId, store, price, timestamp: new Date() });
}

/**
 * Check for price drops and send alerts
 */
async function checkPriceDrops() {
    console.log('🔍 Checking for price drops...');

    try {
        // Get all users with active price alerts
        const users = await User.find({ 'priceAlerts.active': true }).populate('priceAlerts.productId');

        for (const user of users) {
            for (const alert of user.priceAlerts) {
                if (!alert.active) continue;

                const product = alert.productId;
                if (!product) continue;

                // Check price based on platform preference
                let currentPrice = null;
                let platform = alert.platform;

                if (platform === 'any') {
                    // Find lowest price across all platforms
                    const prices = [];
                    if (product.prices.amazon?.price) prices.push({ price: product.prices.amazon.price, platform: 'amazon' });
                    if (product.prices.flipkart?.price) prices.push({ price: product.prices.flipkart.price, platform: 'flipkart' });

                    if (prices.length > 0) {
                        const lowest = prices.reduce((min, p) => p.price < min.price ? p : min);
                        currentPrice = lowest.price;
                        platform = lowest.platform;
                    }
                } else {
                    currentPrice = product.prices[platform]?.price;
                }

                // Check if price dropped below target
                if (currentPrice && currentPrice <= alert.targetPrice) {
                    console.log(`💰 Price drop detected for ${product.name}: ₹${currentPrice}`);

                    // Send notification
                    await sendPriceDropAlert(
                        user.email,
                        product,
                        alert.targetPrice + 500, // Assume old price was higher
                        currentPrice,
                        platform
                    );

                    // Deactivate alert (one-time notification)
                    alert.active = false;
                    await user.save();
                }
            }
        }

        console.log('✅ Price drop check completed');

    } catch (error) {
        console.error('Price drop check error:', error);
    }
}

/**
 * Update prices for all tracked products
 */
async function updateTrackedPrices() {
    console.log('📊 Updating tracked product prices...');

    try {
        // Fetch all products in the database to build a holistic dataset over time
        const products = await Product.find({});
        console.log(`Found ${products.length} registered products to update.`);

        for (const product of products) {
            try {
                let updated = false;

                // --- Update Amazon ---
                if (product.prices.amazon?.url) {
                    const amazonData = await getAmazonPrice(product.prices.amazon.url);
                    if (amazonData?.price) {
                        const currentRef = product.prices.amazon.price;
                        product.prices.amazon.price = amazonData.price;
                        product.prices.amazon.inStock = amazonData.inStock;
                        product.prices.amazon.lastUpdated = new Date();

                        // Only push to embedded history if the price has materially changed
                        if (amazonData.price !== currentRef) {
                            product.priceHistory.push({
                                platform: 'amazon',
                                price: amazonData.price,
                                inStock: amazonData.inStock,
                                timestamp: new Date()
                            });
                        }

                        // Always attempt to save in the standalone PriceHistory collection
                        // (duplicate prevention is inside savePriceEntry)
                        await savePriceEntry(product._id, 'amazon', amazonData.price);
                        updated = true;
                    }
                }

                // --- Update Flipkart ---
                if (product.prices.flipkart?.url) {
                    const flipkartData = await getFlipkartPrice(product.prices.flipkart.url);
                    if (flipkartData?.price) {
                        const currentRef = product.prices.flipkart.price;
                        product.prices.flipkart.price = flipkartData.price;
                        product.prices.flipkart.inStock = flipkartData.inStock;
                        product.prices.flipkart.lastUpdated = new Date();

                        // Only push to embedded history if the price has materially changed
                        if (flipkartData.price !== currentRef) {
                            product.priceHistory.push({
                                platform: 'flipkart',
                                price: flipkartData.price,
                                inStock: flipkartData.inStock,
                                timestamp: new Date()
                            });
                        }

                        // Always attempt to save in the standalone PriceHistory collection
                        await savePriceEntry(product._id, 'flipkart', flipkartData.price);
                        updated = true;
                    }
                }

                if (updated) {
                    await product.save();
                    console.log(`✅ Completed Sweep: ${product.name}`);
                }

                // Generous delay to avoid overwhelming target sites/proxies
                await new Promise(resolve => setTimeout(resolve, 3000));

            } catch (error) {
                console.error(`Error updating product ${product._id}:`, error.message);
            }
        }

        console.log('✅ Global Price Dataset update completed');

    } catch (error) {
        console.error('Global Price update error:', error);
    }
}

/**
 * Start price tracking cron jobs
 */
function startPriceTracker() {
    console.log('⏰ Starting price tracker cron jobs...');

    // Run both the global sweep and alert checker every 6 hours
    cron.schedule('0 */6 * * *', async () => {
        console.log('\n⏰ Running scheduled 6-hour global price update...');
        await updateTrackedPrices();
        
        console.log('\n⏰ Running scheduled price drop checks based on new updates...');
        await checkPriceDrops();
    });

    console.log('✅ Price tracker cron jobs started (6-hour intervals)');
}

module.exports = {
    startPriceTracker,
    checkPriceDrops,
    updateTrackedPrices
};
