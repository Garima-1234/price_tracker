/**
 * Test script to debug Ajio and Myntra scrapers
 * Run: node test_scrapers.js
 */
require('dotenv').config();
const axios = require('axios');

const SCRAPERAPI_KEY = process.env.SCRAPERAPI_KEY;
const testQuery = 'tshirt';

console.log('=== Scraper Test ===');
console.log('SCRAPERAPI_KEY:', SCRAPERAPI_KEY ? `✓ (${SCRAPERAPI_KEY.substring(0, 8)}...)` : '✗ MISSING');
console.log('');

// Test Ajio
async function testAjio() {
    console.log('--- Testing Ajio ---');
    const encoded = encodeURIComponent(testQuery);
    const targetUrl = `https://www.ajio.com/api/search?searchQuery=${encoded}&gridColumns=3&from=0&size=10`;
    
    const fetchUrl = SCRAPERAPI_KEY
        ? `http://api.scraperapi.com/?api_key=${SCRAPERAPI_KEY}&url=${encodeURIComponent(targetUrl)}&country_code=in`
        : targetUrl;
    
    console.log('Target URL:', targetUrl);
    console.log('Using Proxy:', !!SCRAPERAPI_KEY);
    
    try {
        const response = await axios.get(fetchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'en-IN,en;q=0.9',
            },
            timeout: 20000,
            validateStatus: () => true,
        });
        
        console.log('Status:', response.status);
        console.log('Content-Type:', response.headers?.['content-type']);
        
        const data = response.data;
        const size = typeof data === 'string' ? data.length : JSON.stringify(data || {}).length;
        console.log('Response size:', size, 'bytes');
        
        if (response.status === 200 && data) {
            // Check for products - look in different locations
            const products = data.products || data.searchData?.products || data.data?.products;
            if (products && products.length > 0) {
                console.log('✓ Found products array with', products.length, 'items');
            } else {
                console.log('Response keys:', Object.keys(data || {}).join(', '));
                console.log('Full response:', JSON.stringify(data).slice(0, 1000));
            }
        } else {
            console.log('Response body:', typeof data === 'string' ? data.slice(0, 500) : JSON.stringify(data).slice(0, 500));
        }
    } catch (error) {
        console.error('Error:', error.message);
        if (error.code === 'ECONNREFUSED') {
            console.log('Tip: Check if ScraperAPI is accessible');
        }
    }
}

// Test Myntra
async function testMyntra() {
    console.log('\n--- Testing Myntra ---');
    const encoded = encodeURIComponent(testQuery);
    const targetUrl = `https://www.myntra.com/gateway/v2/search/${encoded}?p=1&rows=10&sort=popularity`;
    
    const fetchUrl = SCRAPERAPI_KEY
        ? `http://api.scraperapi.com/?api_key=${SCRAPERAPI_KEY}&url=${encodeURIComponent(targetUrl)}&country_code=in`
        : targetUrl;
    
    console.log('Target URL:', targetUrl);
    console.log('Using Proxy:', !!SCRAPERAPI_KEY);
    
    try {
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
            timeout: 20000,
            validateStatus: () => true,
        });
        
        console.log('Status:', response.status);
        console.log('Content-Type:', response.headers?.['content-type']);
        
        const data = response.data;
        const size = typeof data === 'string' ? data.length : JSON.stringify(data || {}).length;
        console.log('Response size:', size, 'bytes');
        
        if (response.status === 200 && data) {
            const products = data.products || data.data?.products;
            if (products && products.length > 0) {
                console.log('✓ Found products array with', products.length, 'items');
            } else {
                console.log('Response keys:', Object.keys(data || {}).join(', '));
                console.log('Full response:', JSON.stringify(data).slice(0, 1000));
            }
        } else {
            console.log('Response body:', typeof data === 'string' ? data.slice(0, 500) : JSON.stringify(data).slice(0, 500));
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

// Test direct access (without proxy)
async function testDirectAccess() {
    console.log('\n--- Testing Direct Access (without proxy) ---');
    
    try {
        const response = await axios.get('https://www.ajio.com/api/search?searchQuery=tshirt&gridColumns=3&from=0&size=10', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json',
                'Accept-Language': 'en-IN,en;q=0.9',
            },
            timeout: 10000,
            validateStatus: () => true,
        });
        console.log('Direct Ajio Status:', response.status);
    } catch (error) {
        console.log('Direct Ajio Error:', error.message);
    }
    
    try {
        const response = await axios.get('https://www.myntra.com/gateway/v2/search/tshirt?p=1&rows=10', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json',
            },
            timeout: 10000,
            validateStatus: () => true,
        });
        console.log('Direct Myntra Status:', response.status);
    } catch (error) {
        console.log('Direct Myntra Error:', error.message);
    }
}

async function main() {
    await testAjio();
    await testMyntra();
    await testDirectAccess();
    console.log('\n=== Test Complete ===');
}

main().catch(console.error);
