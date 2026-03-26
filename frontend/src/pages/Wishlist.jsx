import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Trash2, Bell, Loader2, ShoppingBag, ExternalLink, TrendingDown } from 'lucide-react';
import { authAPI } from '../services/api';

export default function Wishlist({ user }) {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) {
            navigate('/auth');
            return;
        }
        loadWishlist();
    }, [user]);

    const loadWishlist = async () => {
        try {
            const response = await authAPI.getWishlist();
            if (response.data.success) {
                setProducts(response.data.products);
            }
        } catch (err) {
            console.error('Wishlist load error:', err);
        } finally {
            setLoading(false);
        }
    };

    const removeFromWishlist = async (productId) => {
        try {
            await authAPI.removeFromWishlist(productId);
            setProducts(prev => prev.filter(p => p._id !== productId));
        } catch (err) {
            console.error('Remove error:', err);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-primary-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen py-8 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center space-x-3 mb-8">
                    <Heart className="w-8 h-8 text-red-500 fill-red-500" />
                    <h1 className="text-3xl font-bold">My Wishlist</h1>
                    <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-semibold">
                        {products.length} items
                    </span>
                </div>

                {products.length === 0 ? (
                    /* Empty State */
                    <div className="card p-16 text-center">
                        <ShoppingBag className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                        <h2 className="text-2xl font-bold text-gray-700 mb-3">Your wishlist is empty</h2>
                        <p className="text-gray-500 mb-8 max-w-md mx-auto">
                            Start adding products you love! We'll track prices and notify you when they drop.
                        </p>
                        <button
                            onClick={() => navigate('/')}
                            className="btn-primary inline-flex items-center space-x-2"
                        >
                            <span>Start Shopping</span>
                        </button>
                    </div>
                ) : (
                    /* Wishlist Grid */
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {products.map((product) => (
                            <div key={product._id} className="card card-hover overflow-hidden">
                                {/* Product Image */}
                                <div className="relative bg-gray-50 aspect-square">
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        className="w-full h-full object-contain p-4"
                                        loading="lazy"
                                    />
                                    <button
                                        onClick={() => removeFromWishlist(product._id)}
                                        className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-md hover:bg-red-50 transition-colors group"
                                        title="Remove from wishlist"
                                    >
                                        <Trash2 className="w-5 h-5 text-gray-400 group-hover:text-red-500" />
                                    </button>
                                </div>

                                {/* Product Info */}
                                <div className="p-5">
                                    <h3
                                        className="font-semibold text-gray-800 line-clamp-2 mb-3 cursor-pointer hover:text-primary-600"
                                        onClick={() => navigate(`/product/${product._id}`)}
                                    >
                                        {product.name}
                                    </h3>

                                    {/* Price */}
                                    {product.lowestPrice ? (
                                        <div className="mb-4">
                                            <div className="flex items-baseline space-x-2">
                                                <span className="text-2xl font-bold text-primary-600">
                                                    ₹{product.lowestPrice.toLocaleString()}
                                                </span>
                                                {product.lowestPriceInfo && (
                                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                                                        Best on {product.lowestPriceInfo.platform.toUpperCase()}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center space-x-1 mt-1 text-sm text-gray-500">
                                                <TrendingDown className="w-3 h-3" />
                                                <span>
                                                    Available on {Object.keys(product.prices || {}).filter(k => product.prices[k]?.price).length} platforms
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-gray-400 mb-4">Price not available</p>
                                    )}

                                    {/* Actions */}
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => navigate(`/product/${product._id}`)}
                                            className="flex-1 bg-gradient-to-r from-primary-600 to-accent-600 text-white py-2.5 rounded-lg font-semibold hover:from-primary-700 hover:to-accent-700 transition-all flex items-center justify-center space-x-2"
                                        >
                                            <span>Compare</span>
                                            <ExternalLink className="w-4 h-4" />
                                        </button>
                                        <button
                                            className="px-4 py-2.5 border-2 border-amber-300 text-amber-600 rounded-lg font-semibold hover:bg-amber-50 transition-colors"
                                            title="Set price alert"
                                        >
                                            <Bell className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
