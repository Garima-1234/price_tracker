import { useState } from 'react';
import { X, Bell, Loader2, Check } from 'lucide-react';
import { productAPI } from '../services/api';

export default function PriceAlertModal({ product, onClose }) {
    const [targetPrice, setTargetPrice] = useState('');
    const [platform, setPlatform] = useState('any');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    // Get current lowest price for suggestion
    const currentLowest = product.lowestPrice || product.lowestPriceInfo?.price || 0;
    const suggestedPrice = Math.floor(currentLowest * 0.9); // 10% less

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await productAPI.setPriceAlert(product._id, {
                targetPrice: Number(targetPrice),
                platform
            });

            if (response.data.success) {
                setSuccess(true);
                setTimeout(() => onClose(), 2000);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to set alert');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in">
                {/* Header */}
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white/80 hover:text-white"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <Bell className="w-10 h-10 mb-3" />
                    <h2 className="text-xl font-bold">Set Price Alert</h2>
                    <p className="text-sm opacity-90 mt-1">
                        We'll email you when the price drops!
                    </p>
                </div>

                {success ? (
                    /* Success State */
                    <div className="p-8 text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Check className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Alert Set! 🎉</h3>
                        <p className="text-gray-600">
                            We'll notify you when the price drops below ₹{Number(targetPrice).toLocaleString()}
                        </p>
                    </div>
                ) : (
                    /* Form */
                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        {/* Product Info */}
                        <div className="flex items-center space-x-3 bg-gray-50 p-3 rounded-lg">
                            {product.image && (
                                <img
                                    src={product.image}
                                    alt={product.name}
                                    className="w-14 h-14 object-contain rounded"
                                />
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-800 text-sm truncate">{product.name}</p>
                                {currentLowest > 0 && (
                                    <p className="text-primary-600 font-bold">
                                        Current: ₹{currentLowest.toLocaleString()}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Target Price */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Alert me when price drops below
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">₹</span>
                                <input
                                    type="number"
                                    value={targetPrice}
                                    onChange={(e) => setTargetPrice(e.target.value)}
                                    placeholder={suggestedPrice > 0 ? suggestedPrice.toString() : 'Enter target price'}
                                    className="input-field pl-8"
                                    required
                                    min="1"
                                />
                            </div>
                            {suggestedPrice > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setTargetPrice(suggestedPrice.toString())}
                                    className="text-xs text-primary-600 hover:text-primary-700 mt-1"
                                >
                                    Suggested: ₹{suggestedPrice.toLocaleString()} (10% below current)
                                </button>
                            )}
                        </div>

                        {/* Platform */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Monitor on
                            </label>
                            <select
                                value={platform}
                                onChange={(e) => setPlatform(e.target.value)}
                                className="input-field"
                            >
                                <option value="any">All Platforms</option>
                                <option value="amazon">Amazon</option>
                                <option value="flipkart">Flipkart</option>
                                <option value="myntra">Myntra</option>
                                <option value="ajio">Ajio</option>
                            </select>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 rounded-xl font-semibold hover:from-amber-600 hover:to-orange-600 transition-all flex items-center justify-center space-x-2"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <Bell className="w-5 h-5" />
                                    <span>Set Price Alert</span>
                                </>
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
