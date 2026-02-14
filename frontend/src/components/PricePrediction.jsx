import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingDown, TrendingUp, Calendar, Sparkles } from 'lucide-react';
import api from '../services/api';

/**
 * ML-powered Price Prediction Component
 * Shows 7-day price forecast and best time to buy
 */
const PricePrediction = ({ productId, platform = 'amazon' }) => {
    const [predictions, setPredictions] = useState([]);
    const [bestTime, setBestTime] = useState(null);
    const [dropProbability, setDropProbability] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPredictions();
    }, [productId, platform]);

    const loadPredictions = async () => {
        try {
            setLoading(true);

            // Fetch predictions
            const [predData, bestTimeData, dropData] = await Promise.all([
                api.get(`/predictions/${productId}?platform=${platform}`),
                api.get(`/predictions/${productId}/best-time?platform=${platform}`),
                api.get(`/predictions/${productId}/drop-probability?platform=${platform}`)
            ]);

            setPredictions(predData.data.predictions || []);
            setBestTime(bestTimeData.data);
            setDropProbability(dropData.data);

        } catch (error) {
            console.error('Failed to load predictions:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="h-40 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    if (!predictions || predictions.length === 0) {
        return null;
    }

    // Prepare chart data
    const chartData = predictions.map(pred => ({
        date: new Date(pred.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        price: pred.predictedPrice,
        day: pred.dayOfWeek
    }));

    return (
        <div className="space-y-6">
            {/* Price Forecast Chart */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 shadow-md border border-purple-100">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                        <Sparkles className="w-5 h-5 text-purple-600" />
                        <h3 className="text-lg font-bold text-gray-900">AI Price Forecast (Next 7 Days)</h3>
                    </div>
                    <div className="px-3 py-1 bg-purple-600 text-white text-xs font-bold rounded-full">
                        ML Powered
                    </div>
                </div>

                <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                            dataKey="date"
                            stroke="#6b7280"
                            style={{ fontSize: '12px' }}
                        />
                        <YAxis
                            stroke="#6b7280"
                            style={{ fontSize: '12px' }}
                            tickFormatter={(value) => `₹${value}`}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#fff',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                fontSize: '12px'
                            }}
                            formatter={(value) => [`₹${value}`, 'Predicted Price']}
                        />
                        <Line
                            type="monotone"
                            dataKey="price"
                            stroke="#9333ea"
                            strokeWidth={3}
                            dot={{ fill: '#9333ea', r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Best Time to Buy */}
            {bestTime && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
                        <div className="flex items-center space-x-3 mb-3">
                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                <Calendar className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <div className="text-sm text-gray-500">Best Time to Buy</div>
                                <div className="text-xl font-bold text-gray-900">{bestTime.bestDayName}</div>
                            </div>
                        </div>
                        <div className="text-sm text-gray-600">{bestTime.recommendation}</div>
                        {bestTime.potentialSavings > 0 && (
                            <div className="mt-3 flex items-center space-x-2">
                                <TrendingDown className="w-4 h-4 text-green-600" />
                                <span className="text-sm font-semibold text-green-600">
                                    Save ₹{bestTime.potentialSavings} ({bestTime.savingsPercent}%)
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Price Drop Probability */}
                    {dropProbability && (
                        <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
                            <div className="flex items-center space-x-3 mb-3">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${dropProbability.probability > 60 ? 'bg-green-100' :
                                        dropProbability.probability > 40 ? 'bg-yellow-100' : 'bg-red-100'
                                    }`}>
                                    {dropProbability.trend === 'decreasing' ? (
                                        <TrendingDown className={`w-6 h-6 ${dropProbability.probability > 60 ? 'text-green-600' :
                                                dropProbability.probability > 40 ? 'text-yellow-600' : 'text-red-600'
                                            }`} />
                                    ) : (
                                        <TrendingUp className={`w-6 h-6 ${dropProbability.probability > 60 ? 'text-green-600' :
                                                dropProbability.probability > 40 ? 'text-yellow-600' : 'text-red-600'
                                            }`} />
                                    )}
                                </div>
                                <div>
                                    <div className="text-sm text-gray-500">Price Drop Probability</div>
                                    <div className="text-xl font-bold text-gray-900">{dropProbability.probability}%</div>
                                </div>
                            </div>
                            <div className="text-sm text-gray-600 capitalize">
                                Trend: {dropProbability.trend} • Confidence: {dropProbability.confidence}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PricePrediction;
