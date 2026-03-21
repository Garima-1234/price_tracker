const Product = require('../models/Product');

class PricePredictor {
    /**
     * Predict future prices using Linear Regression
     * Uses up to the last 30 historical records for calculation.
     */
    async predictPrice(productId, platform = 'amazon') {
        const product = await Product.findById(productId);
        if (!product || !product.priceHistory) {
            throw new Error('Product not found or no history available');
        }

        // Get up to last 30 records for the platform
        const history = product.priceHistory
            .filter(h => h.platform === platform || platform === 'all')
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
            .slice(-30);

        if (history.length < 5) {
            throw new Error('Not enough data to make a reliable prediction. Need at least 5 records.');
        }

        const prices = history.map(h => h.price);
        
        // Linear Regression Implementation
        // Equation: y = mx + b
        // Where y is the price and x is the chronological index
        const n = prices.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
        
        for (let i = 0; i < n; i++) {
            sumX += i;
            sumY += prices[i];
            sumXY += (i * prices[i]);
            sumXX += (i * i);
        }

        const denominator = (n * sumXX - sumX * sumX);
        const slope = denominator === 0 ? 0 : (n * sumXY - sumX * sumY) / denominator;
        const intercept = (sumY - slope * sumX) / n;

        // Predict the next value (at index n)
        let predictedPrice = slope * n + intercept;
        // Ensure price is realistic (not negative, and formatted logically)
        predictedPrice = Math.max(0, Math.round(predictedPrice));

        // Determine trend direction
        let trend = 'stable';
        const slopeThreshold = 0.5; // Change required per interval to be noted as a trend
        if (slope > slopeThreshold) trend = 'up';
        else if (slope < -slopeThreshold) trend = 'down';

        // Calculate confidence score (R-squared combined with dataset size)
        let ssTot = 0, ssRes = 0;
        const meanY = sumY / n;
        for (let i = 0; i < n; i++) {
            const yPred = slope * i + intercept;
            ssTot += Math.pow(prices[i] - meanY, 2);
            ssRes += Math.pow(prices[i] - yPred, 2);
        }
        const rSquared = ssTot === 0 ? 0 : 1 - (ssRes / ssTot);
        
        // Base confidence heavily on R-squared (variance fit) and amount of data points
        // Ensure R-squared logic handles potential negative variances correctly
        const safeRSquared = Math.max(0, rSquared);
        const dataScore = Math.min(100, (n / 30) * 100);
        let confidence_score = Math.round((safeRSquared * 70) + (dataScore * 0.3));
        
        // Clamp confidence logically between 10 to 95 based on actual data sizes
        confidence_score = Math.max(10, Math.min(95, confidence_score));

        return {
            predicted_price: predictedPrice,
            trend,
            confidence_score
        };
    }
}

module.exports = new PricePredictor();
