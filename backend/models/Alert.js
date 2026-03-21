const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null  // allow guest alerts via email only
    },
    productId: {
        type: String,
        required: true
    },
    productName: {
        type: String,
        default: ''
    },
    platform: {
        type: String,
        enum: ['any', 'amazon', 'flipkart', 'myntra', 'ajio'],
        default: 'any'
    },
    targetPrice: {
        type: Number,
        required: true
    },
    alertType: {
        type: [String],
        enum: ['email', 'push'],
        default: ['email']
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    pushToken: {
        type: String,
        default: null
    },
    triggered: {
        type: Boolean,
        default: false
    },
    triggeredAt: {
        type: Date,
        default: null
    },
    triggeredPrice: {
        type: Number,
        default: null
    },
    active: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Compound index: one active alert per user/product/platform
alertSchema.index({ email: 1, productId: 1, platform: 1 });
alertSchema.index({ active: 1, triggered: 1 }); // for the cron job query

module.exports = mongoose.model('Alert', alertSchema);
