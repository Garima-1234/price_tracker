const mongoose = require('mongoose');

const priceHistorySchema = new mongoose.Schema({
  platform: {
    type: String,
    required: true,
    enum: ['amazon', 'flipkart', 'myntra', 'ajio']
  },
  price: {
    type: Number,
    required: true
  },
  inStock: {
    type: Boolean,
    default: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    required: true
  },
  brand: {
    type: String,
    default: ''
  },
  image: {
    type: String,
    required: true
  },

  // Current prices from different platforms
  prices: {
    amazon: {
      price: Number,
      url: String,
      inStock: { type: Boolean, default: true },
      lastUpdated: { type: Date, default: Date.now }
    },
    flipkart: {
      price: Number,
      url: String,
      inStock: { type: Boolean, default: true },
      lastUpdated: { type: Date, default: Date.now }
    },
    myntra: {
      price: Number,
      url: String,
      inStock: { type: Boolean, default: true },
      lastUpdated: { type: Date, default: Date.now }
    },
    ajio: {
      price: Number,
      url: String,
      inStock: { type: Boolean, default: true },
      lastUpdated: { type: Date, default: Date.now }
    }
  },

  // Price history for charts
  priceHistory: [priceHistorySchema],

  // Metadata
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  reviewCount: {
    type: Number,
    default: 0
  },

  // For search optimization
  searchKeywords: [String],

  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster search
productSchema.index({ name: 'text', brand: 'text', category: 'text', searchKeywords: 'text' });

// Virtual for lowest price
productSchema.virtual('lowestPrice').get(function () {
  const prices = [];
  if (this.prices.amazon?.price && this.prices.amazon.inStock) prices.push(this.prices.amazon.price);
  if (this.prices.flipkart?.price && this.prices.flipkart.inStock) prices.push(this.prices.flipkart.price);
  if (this.prices.myntra?.price && this.prices.myntra.inStock) prices.push(this.prices.myntra.price);
  if (this.prices.ajio?.price && this.prices.ajio.inStock) prices.push(this.prices.ajio.price);

  return prices.length > 0 ? Math.min(...prices) : null;
});

// Update timestamp on save
productSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Product', productSchema);
