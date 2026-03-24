const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes
const productRoutes = require('./routes/products');
const authRoutes = require('./routes/auth');
const alertRoutes = require('./routes/alerts');
const recommendationRoutes = require('./routes/recommendations');
const predictionRoutes = require('./routes/predictions');
const scrapeRoutes = require('./routes/scrape');

// Initialize Express app
const app = express();

// Middleware
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')
    .map(url => url.trim());

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
            return callback(null, true);
        }
        return callback(null, true); // Allow all during setup, tighten later
    },
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Routes
app.use('/api/products', productRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/scrape', scrapeRoutes);
app.get('/price-history', require('./controllers/productController').getPriceHistory);
app.get('/api/price-history', require('./controllers/productController').getPriceHistoryFormatted);
app.get('/predict-price', require('./controllers/productController').predictPrice);
app.get('/api/predict-price', require('./controllers/productController').predictPrice);
app.get('/compare-prices', require('./controllers/productController').comparePrices);
app.get('/api/compare-prices', require('./controllers/productController').comparePrices);
app.use('/api/auth', authRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'BuyHatke Clone API is running',
        timestamp: new Date().toISOString(),
        dbConnected: mongoose.connection.readyState === 1
    });
});

// Debug env vars
app.get('/debug-env', (req, res) => {
    const isProd = process.env.NODE_ENV === 'production';
    res.json({
        // Show status for all env vars
        env: {
            MONGODB_URI: process.env.MONGODB_URI ? '✓' : '✗',
            JWT_SECRET: process.env.JWT_SECRET ? '✓' : '✗',
            FRONTEND_URL: process.env.FRONTEND_URL ? '✓' : '✗',
            SCRAPERAPI_KEY: process.env.SCRAPERAPI_KEY ? '✓' : '✗',
            SIMULATE_PRICES: process.env.SIMULATE_PRICES || '✗',
            NODE_ENV: process.env.NODE_ENV || 'not set'
        },
        // Only show actual values in development
        ...(isProd ? {} : {
            values: {
                MONGODB_URI: process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 30) + '...' : null,
                JWT_SECRET: process.env.JWT_SECRET ? '***' : null,
                FRONTEND_URL: process.env.FRONTEND_URL,
                SCRAPERAPI_KEY: process.env.SCRAPERAPI_KEY ? process.env.SCRAPERAPI_KEY.substring(0, 10) + '...' : null,
                SIMULATE_PRICES: process.env.SIMULATE_PRICES
            }
        })
    });
});

// Root route
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to BuyHatke Clone API',
        version: '2.0.0',
        endpoints: {
            search: '/api/products/search?q=query',
            product: '/api/products/:id',
            auth: '/api/auth/login',
            wishlist: '/api/auth/wishlist',
            health: '/health'
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, error: 'Route not found' });
});

// Database connection
const connectDB = async () => {
    if (!process.env.MONGODB_URI) {
        console.warn('⚠️  No MONGODB_URI in .env — running without database');
        return;
    }

    const uri = process.env.MONGODB_URI;
    const isAtlas = uri.includes('mongodb+srv') || uri.includes('mongodb.net');
    console.log(`🔗 Connecting to MongoDB${isAtlas ? ' Atlas' : ' Local'}...`);

    try {
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 15000,
            connectTimeoutMS: 15000,
        });
        console.log(`✅ MongoDB Connected: ${mongoose.connection.host}`);

        // Create text indexes
        const Product = require('./models/Product');
        await Product.collection.createIndex(
            { name: 'text', brand: 'text', category: 'text', searchKeywords: 'text' },
            { background: true }
        ).catch(() => {});
        console.log('✅ Search indexes ready');

    } catch (error) {
        console.warn('⚠️  MongoDB not available — running without database');
        console.warn('   Scraping will still work, data won\'t persist');
        console.warn(`   ❌ Error: ${error.message}`);
        if (error.message.includes('IP')) {
            console.warn('   ➡️  Go to MongoDB Atlas → Network Access → Add your current IP');
        }
    }
};

// Start server
const PORT = process.env.PORT || 5001;

const startServer = async () => {
    await connectDB();

    const server = app.listen(PORT, () => {
        console.log(`\n🚀 Server running on port ${PORT}`);
        console.log(`📍 API: http://localhost:${PORT}`);
        console.log(`📍 Health: http://localhost:${PORT}/health`);
        console.log(`\n💡 Ready to compare prices!\n`);

        // Start price tracker cron jobs (only if DB is connected)
        if (mongoose.connection.readyState === 1) {
            try {
                const { startPriceTracker } = require('./jobs/priceTracker');
                startPriceTracker();
            } catch (err) {
                console.warn('⚠️  Price tracker not started:', err.message);
            }
        }
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.error(`❌ Port ${PORT} is in use. Try: lsof -ti:${PORT} | xargs kill -9`);
            process.exit(1);
        }
        throw err;
    });
};

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Promise Rejection:', err.message);
});

module.exports = app;
