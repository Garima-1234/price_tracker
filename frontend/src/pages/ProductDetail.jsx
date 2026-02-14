import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ExternalLink, Heart, RefreshCw, TrendingDown, Star, Loader2, Bell, ArrowLeft } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { productAPI, authAPI } from '../services/api';
import PriceAlertModal from '../components/PriceAlertModal';

export default function ProductDetail({ user }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [priceHistory, setPriceHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedPlatform, setSelectedPlatform] = useState('all');
    const [showAlertModal, setShowAlertModal] = useState(false);
    const [inWishlist, setInWishlist] = useState(false);

    useEffect(() => {
        loadProduct();
        loadPriceHistory();
    }, [id]);

    const loadProduct = async () => {
        try {
            const response = await productAPI.getById(id);
            if (response.data.success) {
                setProduct(response.data.product);
            }
        } catch (err) {
            console.error('Load product error:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadPriceHistory = async () => {
        try {
            const response = await productAPI.getHistory(id, selectedPlatform);
            if (response.data.success) {
                const formattedData = response.data.history.map(item => ({
                    date: new Date(item.timestamp).toLocaleDateString(),
                    price: item.price,
                    platform: item.platform
                }));
                setPriceHistory(formattedData);
            }
        } catch (err) {
            console.error('Load history error:', err);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await productAPI.refresh(id);
            await loadProduct();
            await loadPriceHistory();
        } catch (err) {
            console.error('Refresh error:', err);
        } finally {
            setRefreshing(false);
        }
    };

    const handleWishlistToggle = async () => {
        if (!user) return;
        try {
            if (inWishlist) {
                await authAPI.removeFromWishlist(id);
                setInWishlist(false);
            } else {
                await authAPI.addToWishlist(id);
                setInWishlist(true);
            }
        } catch (err) {
            console.error('Wishlist error:', err);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-primary-600 animate-spin" />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-2">Product not found</h2>
                    <p className="text-gray-600 mb-4">The product you're looking for doesn't exist</p>
                    <button onClick={() => navigate('/')} className="btn-primary">Go Home</button>
                </div>
            </div>
        );
    }

    const availablePrices = Object.entries(product.prices || {})
        .filter(([_, data]) => data?.price)
        .map(([platform, data]) => ({
            platform,
            ...data
        }))
        .sort((a, b) => a.price - b.price);

    const lowestPrice = availablePrices[0];

    return (
        <div className="min-h-screen py-8 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center space-x-2 text-gray-600 hover:text-primary-600 mb-6 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span>Back to results</span>
                </button>

                <div className="grid lg:grid-cols-2 gap-12 mb-12">
                    {/* Product Image */}
                    <div className="card p-8">
                        <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-auto object-contain max-h-96"
                        />
                    </div>

                    {/* Product Info */}
                    <div>
                        <h1 className="text-3xl font-bold mb-4">{product.name}</h1>

                        {product.rating > 0 && (
                            <div className="flex items-center space-x-2 mb-4">
                                <div className="flex items-center space-x-1 bg-green-100 px-3 py-1 rounded-lg">
                                    <Star className="w-4 h-4 fill-green-600 text-green-600" />
                                    <span className="font-semibold text-green-800">{product.rating.toFixed(1)}</span>
                                </div>
                                {product.reviewCount > 0 && (
                                    <span className="text-gray-600">{product.reviewCount} reviews</span>
                                )}
                            </div>
                        )}

                        {lowestPrice && (
                            <div className="mb-6">
                                <p className="text-sm text-gray-600 mb-2">Lowest Price</p>
                                <div className="flex items-baseline space-x-3">
                                    <span className="text-4xl font-bold text-primary-600">
                                        ₹{lowestPrice.price.toLocaleString()}
                                    </span>
                                    <span className="badge badge-success">
                                        Best on {lowestPrice.platform.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-wrap gap-3 mb-8">
                            <button
                                onClick={handleRefresh}
                                disabled={refreshing}
                                className="btn-secondary flex items-center space-x-2"
                            >
                                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                                <span>{refreshing ? 'Refreshing...' : 'Refresh Prices'}</span>
                            </button>

                            {user && (
                                <>
                                    <button
                                        onClick={handleWishlistToggle}
                                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold transition-all border-2 ${inWishlist
                                                ? 'bg-red-50 border-red-300 text-red-600'
                                                : 'border-gray-200 text-gray-700 hover:border-red-300 hover:text-red-600'
                                            }`}
                                    >
                                        <Heart className={`w-5 h-5 ${inWishlist ? 'fill-red-500 text-red-500' : ''}`} />
                                        <span>{inWishlist ? 'In Wishlist' : 'Add to Wishlist'}</span>
                                    </button>

                                    <button
                                        onClick={() => setShowAlertModal(true)}
                                        className="flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold bg-amber-50 border-2 border-amber-300 text-amber-700 hover:bg-amber-100 transition-all"
                                    >
                                        <Bell className="w-5 h-5" />
                                        <span>Price Alert</span>
                                    </button>
                                </>
                            )}
                        </div>

                        {product.description && (
                            <div className="mb-6">
                                <h3 className="font-semibold mb-2">Description</h3>
                                <p className="text-gray-600">{product.description}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Price Comparison Table */}
                <div className="card p-8 mb-12">
                    <h2 className="text-2xl font-bold mb-6 flex items-center space-x-2">
                        <TrendingDown className="w-6 h-6 text-primary-600" />
                        <span>Price Comparison</span>
                    </h2>

                    {availablePrices.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b-2 border-gray-200">
                                        <th className="text-left py-4 px-4">Platform</th>
                                        <th className="text-left py-4 px-4">Price</th>
                                        <th className="text-left py-4 px-4">Status</th>
                                        <th className="text-right py-4 px-4">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {availablePrices.map((item, index) => (
                                        <tr key={item.platform} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="py-4 px-4">
                                                <span className="font-semibold capitalize">{item.platform}</span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className="text-xl font-bold">₹{item.price.toLocaleString()}</span>
                                                {index === 0 && (
                                                    <span className="ml-2 badge badge-success">Lowest</span>
                                                )}
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className={`badge ${item.inStock !== false ? 'badge-success' : 'badge-warning'}`}>
                                                    {item.inStock !== false ? 'In Stock' : 'Out of Stock'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 text-right">
                                                {item.url && (
                                                    <a
                                                        href={item.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-semibold transition-all"
                                                    >
                                                        <span>Buy Now</span>
                                                        <ExternalLink className="w-4 h-4" />
                                                    </a>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-8">No price data available yet. Try refreshing.</p>
                    )}
                </div>

                {/* Price History Chart */}
                {priceHistory.length > 0 && (
                    <div className="card p-8">
                        <h2 className="text-2xl font-bold mb-6">Price History</h2>

                        <div className="mb-4">
                            <select
                                value={selectedPlatform}
                                onChange={(e) => {
                                    setSelectedPlatform(e.target.value);
                                    loadPriceHistory();
                                }}
                                className="input-field max-w-xs"
                            >
                                <option value="all">All Platforms</option>
                                <option value="amazon">Amazon</option>
                                <option value="flipkart">Flipkart</option>
                                <option value="myntra">Myntra</option>
                                <option value="ajio">Ajio</option>
                            </select>
                        </div>

                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={priceHistory}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="price" stroke="#8b5cf6" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            {/* Price Alert Modal */}
            {showAlertModal && product && (
                <PriceAlertModal
                    product={product}
                    onClose={() => setShowAlertModal(false)}
                />
            )}
        </div>
    );
}
