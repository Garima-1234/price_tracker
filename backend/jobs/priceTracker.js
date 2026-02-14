const cron = require('node-cron');
const Product = require('../models/Product');
const User = require('../models/User');
const { getAmazonPrice } = require('../scrapers/amazonScraper');
const { getFlipkartPrice } = require('../scrapers/flipkartScraper');
const { sendPriceDropAlert } = require('../utils/notifications');

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
        // Get products that have been tracked (have price alerts)
        const users = await User.find({ 'priceAlerts.0': { $exists: true } });
        const trackedProductIds = new Set();

        users.forEach(user => {
            user.priceAlerts.forEach(alert => {
                if (alert.productId) {
                    trackedProductIds.add(alert.productId.toString());
                }
            });
        });

        console.log(`Found ${trackedProductIds.size} tracked products`);

        // Update prices for each tracked product
        for (const productId of trackedProductIds) {
            try {
                const product = await Product.findById(productId);
                if (!product) continue;

                // Update Amazon price if URL exists
                if (product.prices.amazon?.url) {
                    const amazonData = await getAmazonPrice(product.prices.amazon.url);
                    if (amazonData?.price) {
                        product.prices.amazon.price = amazonData.price;
                        product.prices.amazon.inStock = amazonData.inStock;
                        product.prices.amazon.lastUpdated = new Date();

                        // Add to price history
                        product.priceHistory.push({
                            platform: 'amazon',
                            price: amazonData.price,
                            inStock: amazonData.inStock,
                            timestamp: new Date()
                        });
                    }
                }

                // Update Flipkart price if URL exists
                if (product.prices.flipkart?.url) {
                    const flipkartData = await getFlipkartPrice(product.prices.flipkart.url);
                    if (flipkartData?.price) {
                        product.prices.flipkart.price = flipkartData.price;
                        product.prices.flipkart.inStock = flipkartData.inStock;
                        product.prices.flipkart.lastUpdated = new Date();

                        // Add to price history
                        product.priceHistory.push({
                            platform: 'flipkart',
                            price: flipkartData.price,
                            inStock: flipkartData.inStock,
                            timestamp: new Date()
                        });
                    }
                }

                await product.save();
                console.log(`✅ Updated prices for: ${product.name}`);

                // Add delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 2000));

            } catch (error) {
                console.error(`Error updating product ${productId}:`, error.message);
            }
        }

        console.log('✅ Price update completed');

    } catch (error) {
        console.error('Price update error:', error);
    }
}

/**
 * Start price tracking cron jobs
 */
function startPriceTracker() {
    console.log('⏰ Starting price tracker cron jobs...');

    // Check for price drops every 6 hours
    cron.schedule('0 */6 * * *', async () => {
        console.log('\n⏰ Running scheduled price drop check...');
        await checkPriceDrops();
    });

    // Update tracked product prices daily at 2 AM
    cron.schedule('0 2 * * *', async () => {
        console.log('\n⏰ Running scheduled price update...');
        await updateTrackedPrices();
    });

    console.log('✅ Price tracker cron jobs started');
    console.log('   - Price drop checks: Every 6 hours');
    console.log('   - Price updates: Daily at 2 AM');
}

module.exports = {
    startPriceTracker,
    checkPriceDrops,
    updateTrackedPrices
};
