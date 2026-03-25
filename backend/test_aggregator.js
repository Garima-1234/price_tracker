/**
 * Test the price aggregator with the scrapers
 * Run: node test_aggregator.js
 */
require('dotenv').config();
const { aggregatePrices } = require('./scrapers/priceAggregator');

console.log('=== Testing Price Aggregator ===');
console.log('SCRAPERAPI_KEY:', process.env.SCRAPERAPI_KEY ? '✓' : '✗');
console.log('');

async function main() {
    console.log('Testing search for: "tshirt"\n');
    
    try {
        const agg = await aggregatePrices('tshirt');
        const results = agg?.products || agg || [];
        console.log('\n=== Results ===');
        console.log('Total products:', results.length);
        
        if (results.length > 0) {
            results.slice(0, 3).forEach((product, i) => {
                console.log(`\n${i + 1}. ${product.name}`);
                console.log(`   Image: ${product.image ? '✓' : '✗'}`);
                console.log(`   Prices:`, Object.keys(product.prices || {}));
            });
        }
        
        // Check for demo data
        if (results.length > 0 && results[0]._isDemo) {
            console.log('\n⚠️  Using demo data (live scraping returned 0 results)');
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

main();
