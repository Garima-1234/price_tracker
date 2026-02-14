const tf = require('@tensorflow/tfjs');
const Product = require('../models/Product');

/**
 * ML-based Price Predictor using TensorFlow.js
 * Predicts future prices based on historical data
 */
class PricePredictor {
    constructor() {
        this.model = null;
        this.isModelLoaded = false;
    }

    /**
     * Prepare training data from price history
     */
    async prepareTrainingData(productId) {
        try {
            const product = await Product.findById(productId);

            if (!product || !product.priceHistory || product.priceHistory.length < 7) {
                throw new Error('Insufficient price history for prediction');
            }

            // Sort by timestamp
            const history = product.priceHistory.sort((a, b) =>
                new Date(a.timestamp) - new Date(b.timestamp)
            );

            // Extract features and labels
            const features = [];
            const labels = [];

            for (let i = 0; i < history.length - 1; i++) {
                const current = history[i];
                const next = history[i + 1];

                // Features: [price, day_of_week, day_of_month, platform_encoded]
                const date = new Date(current.timestamp);
                const platformEncoding = this.encodePlatform(current.platform);

                features.push([
                    current.price,
                    date.getDay(), // 0-6
                    date.getDate(), // 1-31
                    platformEncoding
                ]);

                labels.push([next.price]);
            }

            return {
                features: tf.tensor2d(features),
                labels: tf.tensor2d(labels),
                history
            };

        } catch (error) {
            console.error('Error preparing training data:', error);
            throw error;
        }
    }

    /**
     * Encode platform name to number
     */
    encodePlatform(platform) {
        const encoding = {
            'amazon': 0,
            'flipkart': 1,
            'myntra': 2,
            'ajio': 3
        };
        return encoding[platform.toLowerCase()] || 0;
    }

    /**
     * Create and compile ML model
     */
    createModel() {
        const model = tf.sequential();

        // Input layer
        model.add(tf.layers.dense({
            units: 16,
            activation: 'relu',
            inputShape: [4] // [price, day_of_week, day_of_month, platform]
        }));

        // Hidden layers
        model.add(tf.layers.dropout({ rate: 0.2 }));
        model.add(tf.layers.dense({
            units: 8,
            activation: 'relu'
        }));

        // Output layer
        model.add(tf.layers.dense({
            units: 1,
            activation: 'linear'
        }));

        // Compile model
        model.compile({
            optimizer: tf.train.adam(0.001),
            loss: 'meanSquaredError',
            metrics: ['mae']
        });

        return model;
    }

    /**
     * Train model on product price history
     */
    async trainModel(productId) {
        try {
            console.log(`🤖 Training ML model for product ${productId}...`);

            const { features, labels } = await this.prepareTrainingData(productId);

            // Create model
            this.model = this.createModel();

            // Train model
            const history = await this.model.fit(features, labels, {
                epochs: 50,
                batchSize: 4,
                validationSplit: 0.2,
                verbose: 0,
                callbacks: {
                    onEpochEnd: (epoch, logs) => {
                        if (epoch % 10 === 0) {
                            console.log(`Epoch ${epoch}: loss = ${logs.loss.toFixed(4)}`);
                        }
                    }
                }
            });

            this.isModelLoaded = true;

            console.log('✅ Model training complete!');
            console.log(`Final loss: ${history.history.loss[history.history.loss.length - 1].toFixed(4)}`);

            // Cleanup tensors
            features.dispose();
            labels.dispose();

            return {
                success: true,
                finalLoss: history.history.loss[history.history.loss.length - 1]
            };

        } catch (error) {
            console.error('Error training model:', error);
            throw error;
        }
    }

    /**
     * Predict future prices for next N days
     */
    async predictFuturePrices(productId, platform = 'amazon', days = 7) {
        try {
            if (!this.isModelLoaded) {
                await this.trainModel(productId);
            }

            const product = await Product.findById(productId);
            const latestPrice = product.prices[platform]?.price || product.lowestPrice;

            const predictions = [];
            const today = new Date();

            for (let i = 1; i <= days; i++) {
                const futureDate = new Date(today);
                futureDate.setDate(today.getDate() + i);

                const platformEncoding = this.encodePlatform(platform);

                // Prepare input features
                const inputFeatures = tf.tensor2d([[
                    latestPrice,
                    futureDate.getDay(),
                    futureDate.getDate(),
                    platformEncoding
                ]]);

                // Predict
                const prediction = this.model.predict(inputFeatures);
                const predictedPrice = (await prediction.data())[0];

                predictions.push({
                    date: futureDate.toISOString().split('T')[0],
                    predictedPrice: Math.round(predictedPrice),
                    dayOfWeek: futureDate.toLocaleDateString('en-US', { weekday: 'short' })
                });

                // Cleanup
                inputFeatures.dispose();
                prediction.dispose();
            }

            return predictions;

        } catch (error) {
            console.error('Error predicting prices:', error);
            throw error;
        }
    }

    /**
     * Calculate best time to buy based on predictions
     */
    async getBestTimeToBuy(productId, platform = 'amazon') {
        try {
            const predictions = await this.predictFuturePrices(productId, platform, 7);

            // Find lowest predicted price
            const bestDay = predictions.reduce((min, current) =>
                current.predictedPrice < min.predictedPrice ? current : min
            );

            const currentPrice = predictions[0].predictedPrice;
            const potentialSavings = currentPrice - bestDay.predictedPrice;
            const savingsPercent = ((potentialSavings / currentPrice) * 100).toFixed(1);

            return {
                bestDay: bestDay.date,
                bestDayName: bestDay.dayOfWeek,
                lowestPrice: bestDay.predictedPrice,
                currentPrice: currentPrice,
                potentialSavings: potentialSavings,
                savingsPercent: savingsPercent,
                recommendation: potentialSavings > 100
                    ? `Wait until ${bestDay.dayOfWeek} to save ₹${potentialSavings}!`
                    : 'Buy now! Prices are stable.'
            };

        } catch (error) {
            console.error('Error calculating best time to buy:', error);
            throw error;
        }
    }

    /**
     * Calculate price drop probability
     */
    async getPriceDropProbability(productId, platform = 'amazon') {
        try {
            const product = await Product.findById(productId);
            const history = product.priceHistory
                .filter(h => h.platform === platform)
                .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

            if (history.length < 5) {
                return { probability: 50, confidence: 'low' };
            }

            // Calculate trend
            const recentPrices = history.slice(-5).map(h => h.price);
            const avgRecent = recentPrices.reduce((a, b) => a + b, 0) / recentPrices.length;
            const currentPrice = recentPrices[recentPrices.length - 1];

            // Simple probability based on trend
            let probability = 50;

            if (currentPrice > avgRecent) {
                probability = 70; // Price is high, likely to drop
            } else if (currentPrice < avgRecent) {
                probability = 30; // Price is low, unlikely to drop more
            }

            return {
                probability: probability,
                confidence: history.length > 10 ? 'high' : 'medium',
                trend: currentPrice > avgRecent ? 'increasing' : 'decreasing'
            };

        } catch (error) {
            console.error('Error calculating price drop probability:', error);
            return { probability: 50, confidence: 'low', trend: 'stable' };
        }
    }

    /**
     * Cleanup model and free memory
     */
    dispose() {
        if (this.model) {
            this.model.dispose();
            this.model = null;
            this.isModelLoaded = false;
        }
    }
}

// Singleton instance
const predictor = new PricePredictor();

module.exports = predictor;
