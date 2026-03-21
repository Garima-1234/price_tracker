const mongoose = require('mongoose');

/**
 * Standalone PriceHistory collection.
 * Each document represents a single price capture for one product at one store.
 * This powers the price history chart and ML prediction model.
 */
const priceHistorySchema = new mongoose.Schema({
    product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
        index: true
    },
    store: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
});

// Compound index for fast per-product queries sorted by time
priceHistorySchema.index({ product_id: 1, timestamp: -1 });

// Compound index to detect duplicates (same product, store, price within same day)
priceHistorySchema.index({ product_id: 1, store: 1, timestamp: 1 });

module.exports = mongoose.model('PriceHistory', priceHistorySchema);
