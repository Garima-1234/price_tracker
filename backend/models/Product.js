const mongoose = require('mongoose');

const priceHistorySchema = new mongoose.Schema({
  platform: {
    type: String,
    required: true,
    enum: ['amazon', 'flipkart', 'myntra', 'ajio']
  },
  price: { type: Number, required: true },
  mrp:   { type: Number, default: null },
  inStock: { type: Boolean, default: true },
  timestamp: { type: Date, default: Date.now }
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
    amazon:   { price: Number, mrp: Number, url: String, inStock: { type: Boolean, default: true }, lastUpdated: { type: Date, default: Date.now } },
    flipkart: { price: Number, mrp: Number, url: String, inStock: { type: Boolean, default: true }, lastUpdated: { type: Date, default: Date.now } },
    myntra:   { price: Number, mrp: Number, url: String, inStock: { type: Boolean, default: true }, lastUpdated: { type: Date, default: Date.now } },
    ajio:     { price: Number, mrp: Number, url: String, inStock: { type: Boolean, default: true }, lastUpdated: { type: Date, default: Date.now } }
  },

  // All-time low tracking
  allTimeLow: {
    price:    { type: Number, default: null },
    platform: { type: String, default: null },
    date:     { type: Date,   default: null }
  },

  // Fake discount detection results
  fakeDiscountFlags: {
    amazon:   { isFake: { type: Boolean, default: false }, reason: String, confidence: Number },
    flipkart: { isFake: { type: Boolean, default: false }, reason: String, confidence: Number },
    myntra:   { isFake: { type: Boolean, default: false }, reason: String, confidence: Number },
    ajio:     { isFake: { type: Boolean, default: false }, reason: String, confidence: Number }
  },

  // Cached ML prediction
  mlPrediction: {
    nextWeekPrice: Number,
    trend:         { type: String, enum: ['rising', 'falling', 'stable'], default: 'stable' },
    confidence:    Number,
    updatedAt:     Date
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
  if (this.prices.amazon?.price   && this.prices.amazon.inStock)   prices.push({ price: this.prices.amazon.price,   platform: 'amazon' });
  if (this.prices.flipkart?.price && this.prices.flipkart.inStock) prices.push({ price: this.prices.flipkart.price, platform: 'flipkart' });
  if (this.prices.myntra?.price   && this.prices.myntra.inStock)   prices.push({ price: this.prices.myntra.price,   platform: 'myntra' });
  if (this.prices.ajio?.price     && this.prices.ajio.inStock)     prices.push({ price: this.prices.ajio.price,     platform: 'ajio' });
  if (prices.length === 0) return null;
  return prices.reduce((min, p) => p.price < min.price ? p : min).price;
});

// Virtual for lowest price info (platform + price)
productSchema.virtual('lowestPriceInfo').get(function () {
  const prices = [];
  if (this.prices.amazon?.price   && this.prices.amazon.inStock)   prices.push({ price: this.prices.amazon.price,   platform: 'amazon' });
  if (this.prices.flipkart?.price && this.prices.flipkart.inStock) prices.push({ price: this.prices.flipkart.price, platform: 'flipkart' });
  if (this.prices.myntra?.price   && this.prices.myntra.inStock)   prices.push({ price: this.prices.myntra.price,   platform: 'myntra' });
  if (this.prices.ajio?.price     && this.prices.ajio.inStock)     prices.push({ price: this.prices.ajio.price,     platform: 'ajio' });
  if (prices.length === 0) return null;
  return prices.reduce((min, p) => p.price < min.price ? p : min);
});

// Update timestamp on save
productSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Ensure virtuals are included in JSON
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);
