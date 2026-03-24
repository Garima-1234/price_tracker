import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ExternalLink, Heart, RefreshCw, TrendingDown, Star, Loader2, Bell, ArrowLeft, ShoppingCart } from 'lucide-react';
import { productAPI, authAPI } from '../services/api';
import PriceAlertModal from '../components/PriceAlertModal';
import DealScanner from '../components/DealScanner';
import PriceHistoryChart from '../components/PriceHistoryChart';


// Platform logos/colors
const PLATFORM_META = {
    amazon:   { label: 'Amazon',          color: '#FF9900', bg: '#FFF7ED' },
    flipkart: { label: 'Flipkart',        color: '#2874F0', bg: '#EFF6FF' },
    myntra:   { label: 'Myntra',          color: '#FF3F6C', bg: '#FFF1F4' },
    ajio:     { label: 'AJIO',            color: '#1a1a1a', bg: '#F5F5F5' },
    croma:    { label: 'Croma',           color: '#07645e', bg: '#ECFDF5' },
    reliance: { label: 'Reliance Digital',color: '#1E3A8A', bg: '#EFF6FF' },
    vijay:    { label: 'Vijay Sales',     color: '#9333EA', bg: '#F5F3FF' },
};


export default function ProductDetail({ user }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [comparePricesData, setComparePricesData] = useState([]);
    const [comparePricesLoading, setComparePricesLoading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showAlertModal, setShowAlertModal] = useState(false);
    const [inWishlist, setInWishlist] = useState(false);
    const [activeImg, setActiveImg] = useState(0);
    const [priceHistory, setPriceHistory] = useState([]);

    useEffect(() => {
        loadProduct();
        loadComparePrices();
        loadPriceHistory();
    }, [id]);

    const loadPriceHistory = async () => {
        try {
            const response = await productAPI.getHistory(id);
            if (response.data.success) setPriceHistory(response.data.history || []);
        } catch (err) {
            console.error('Price history error:', err);
        }
    };

    const loadProduct = async () => {
        try {
            const response = await productAPI.getById(id);
            if (response.data.success) setProduct(response.data.product);
        } catch (err) {
            console.error('Load product error:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadComparePrices = async () => {
        setComparePricesLoading(true);
        try {
            // Pass product_id so backend resolves the name from DB, or nothing on first load
            const response = await productAPI.comparePrices(id, null);
            if (response.data.success) setComparePricesData(response.data.results || []);
        } catch (err) {
            console.error('Compare prices error:', err);
        } finally {
            setComparePricesLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        try { await productAPI.refresh(id); await loadProduct(); await loadPriceHistory(); }
        catch (err) { console.error('Refresh error:', err); }
        finally { setRefreshing(false); }
    };

    const handleWishlistToggle = async () => {
        if (!user) return;
        try {
            if (inWishlist) { await authAPI.removeFromWishlist(id); setInWishlist(false); }
            else            { await authAPI.addToWishlist(id);     setInWishlist(true); }
        } catch (err) { console.error('Wishlist error:', err); }
    };

    const availablePrices = useMemo(() =>
        Object.entries(product?.prices || {})
            .filter(([_, d]) => d?.price)
            .map(([platform, d]) => ({ platform, ...d }))
            .sort((a, b) => a.price - b.price),
        [product]
    );

    const lowestPrice = availablePrices[0];

    const priceStats = useMemo(() => {
        const prices = priceHistory.map(h => h.price).filter(Boolean);
        if (!prices.length) return null;
        return {
            high: Math.max(...prices),
            low:  Math.min(...prices),
            avg:  prices.reduce((a, b) => a + b, 0) / prices.length,
        };
    }, [priceHistory]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="w-12 h-12 text-primary-600 animate-spin" />
        </div>
    );

    if (!product) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Product not found</h2>
                <p className="text-gray-600 mb-4">The product you're looking for doesn't exist</p>
                <button onClick={() => navigate('/')} className="btn-primary">Go Home</button>
            </div>
        </div>
    );

    const discountPct = lowestPrice?.mrp && lowestPrice.mrp > lowestPrice.price
        ? Math.round((lowestPrice.mrp - lowestPrice.price) / lowestPrice.mrp * 100)
        : 0;

    return (
        <div className="min-h-screen py-6 px-4 bg-gray-50">
            <div className="max-w-7xl mx-auto">
                {/* Back */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-600 hover:text-primary-600 mb-5 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to results
                </button>

                {/* ── Main 3-column grid ── */}
                <div className="grid lg:grid-cols-[1fr_1.6fr_1fr] gap-6 mb-8">

                    {/* Col 1: Image */}
                    <div className="card p-6 flex flex-col items-center">
                        <img
                            src={product.image}
                            alt={product.name}
                            className="w-full max-h-72 object-contain mb-4"
                        />
                        {/* Thumbnails (demo) */}
                        <div className="flex gap-2">
                            {[product.image, product.image, product.image].slice(0, 3).map((img, i) => (
                                <button
                                    key={i}
                                    onClick={() => setActiveImg(i)}
                                    className={`w-12 h-12 border-2 rounded-lg overflow-hidden ${activeImg === i ? 'border-purple-500' : 'border-gray-200'}`}
                                >
                                    <img src={img} alt="" className="w-full h-full object-contain" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Col 2: Product Info + Platform Prices */}
                    <div className="flex flex-col gap-4">
                        {/* Title + rating */}
                        <div className="card p-6">
                            <h1 className="text-2xl font-bold mb-3 leading-snug">{product.name}</h1>

                            {product.rating > 0 && (
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-lg">
                                        <Star className="w-4 h-4 fill-green-600 text-green-600" />
                                        <span className="font-bold">{product.rating.toFixed(1)}</span>
                                    </div>
                                    {product.reviewCount > 0 && (
                                        <span className="text-gray-500 text-sm">{product.reviewCount.toLocaleString('en-IN')} reviews</span>
                                    )}
                                </div>
                            )}

                            {/* Current best price */}
                            {lowestPrice && (
                                <div className="flex items-baseline gap-3 mb-4">
                                    <span className="text-4xl font-black text-gray-900">₹{lowestPrice.price.toLocaleString('en-IN')}</span>
                                    {lowestPrice.mrp > lowestPrice.price && (
                                        <>
                                            <span className="text-lg text-gray-400 line-through">₹{lowestPrice.mrp.toLocaleString('en-IN')}</span>
                                            <span className="bg-green-100 text-green-700 text-sm font-bold px-2 py-0.5 rounded">{discountPct}% OFF</span>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Action buttons */}
                            <div className="flex flex-wrap gap-2">
                                <button onClick={handleRefresh} disabled={refreshing} className="btn-secondary flex items-center gap-2 text-sm">
                                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                                    {refreshing ? 'Refreshing…' : 'Refresh Prices'}
                                </button>
                                <button
                                    onClick={() => setShowAlertModal(true)}
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg font-semibold bg-amber-50 border-2 border-amber-300 text-amber-700 hover:bg-amber-100 transition-all text-sm"
                                >
                                    <Bell className="w-4 h-4" /> Set Alert
                                </button>
                                {user && (
                                    <button
                                        onClick={handleWishlistToggle}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg font-semibold transition-all border-2 text-sm ${inWishlist ? 'bg-red-50 border-red-300 text-red-600' : 'border-gray-200 text-gray-700 hover:border-red-300 hover:text-red-600'}`}
                                    >
                                        <Heart className={`w-4 h-4 ${inWishlist ? 'fill-red-500 text-red-500' : ''}`} />
                                        {inWishlist ? 'Wishlisted' : 'Wishlist'}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Platform Price Comparison — live /compare-prices data */}
                        <div className="card p-6">
                            <h2 className="font-bold text-base mb-4 flex items-center gap-2">
                                <TrendingDown className="w-5 h-5 text-purple-600" />
                                Multi-Platform Price Comparison
                            </h2>

                            {comparePricesLoading ? (
                                <div className="flex items-center justify-center py-8 gap-3 text-gray-400">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span className="text-sm">Fetching live prices from all stores…</span>
                                </div>
                            ) : comparePricesData.length > 0 ? (
                                <div className="space-y-3">
                                    {comparePricesData.map((item) => {
                                        const meta = PLATFORM_META[item.platform] || { label: item.store, color: '#6b7280', bg: '#f9fafb' };
                                        return (
                                            <div
                                                key={item.platform}
                                                className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all hover:shadow-md ${
                                                    item.isLowest
                                                        ? 'border-green-400 bg-green-50'
                                                        : 'border-gray-100 bg-white'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: meta.bg }}>
                                                        <span className="text-xs font-black" style={{ color: meta.color }}>{meta.label.substring(0,2).toUpperCase()}</span>
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-semibold text-sm">{item.store}</p>
                                                            {item.isSimulated && (
                                                                <span className="text-xs bg-yellow-100 text-yellow-700 font-medium px-2 py-0.5 rounded-full">Estimated</span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-gray-400">{item.availability ? '✅ In Stock' : '❌ Out of Stock'}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="text-right">
                                                        <p className="font-black text-lg text-gray-900">₹{item.price.toLocaleString('en-IN')}</p>
                                                        {item.isLowest && (
                                                            <span className="text-xs bg-green-500 text-white font-bold px-2 py-0.5 rounded-full">🏆 Lowest</span>
                                                        )}
                                                    </div>
                                                    {item.product_url && (
                                                        <a
                                                            href={item.product_url} target="_blank" rel="noopener noreferrer"
                                                            className="flex items-center gap-1 text-white px-3 py-2 rounded-lg font-bold text-xs transition-all hover:opacity-90"
                                                            style={{ background: meta.color }}
                                                        >
                                                            Buy <ExternalLink className="w-3 h-3" />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : availablePrices.length > 0 ? (
                                // Fallback: show existing DB prices while waiting or if scrape failed
                                <div className="space-y-3">
                                    {availablePrices.map((item, index) => {
                                        const meta = PLATFORM_META[item.platform] || { label: item.platform, color: '#6b7280', bg: '#f9fafb' };
                                        const savings = lowestPrice && item.price > lowestPrice.price
                                            ? Math.round((item.price - lowestPrice.price) / lowestPrice.price * 100)
                                            : 0;
                                        return (
                                            <div
                                                key={item.platform}
                                                className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all hover:shadow-md ${index === 0 ? 'border-green-400 bg-green-50' : 'border-gray-100 bg-white'}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: meta.bg }}>
                                                        <span className="text-xs font-black" style={{ color: meta.color }}>{meta.label.substring(0,2).toUpperCase()}</span>
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-sm">{meta.label}</p>
                                                        <p className="text-xs text-gray-400">{item.inStock !== false ? '✅ In Stock' : '❌ Out of Stock'}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="text-right">
                                                        <p className="font-black text-lg text-gray-900">₹{item.price.toLocaleString('en-IN')}</p>
                                                        {savings > 0 && <p className="text-xs text-red-500 font-medium">{savings}% Costlier</p>}
                                                        {index === 0 && <span className="text-xs bg-green-500 text-white font-bold px-2 py-0.5 rounded-full">🏆 Lowest</span>}
                                                    </div>
                                                    {item.url && (
                                                        <a href={item.url} target="_blank" rel="noopener noreferrer"
                                                            className="flex items-center gap-1 text-white px-3 py-2 rounded-lg font-bold text-xs"
                                                            style={{ background: meta.color }}
                                                        >Buy <ExternalLink className="w-3 h-3" /></a>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-gray-400 text-sm text-center py-6">No price data available. Try refreshing.</p>
                            )}
                        </div>
                    </div>

                    {/* Col 3: Deal Scanner (sticky) */}
                    <div>
                        <DealScanner
                            product={product}
                            priceHistory={priceHistory}
                            availablePrices={availablePrices}
                        />
                    </div>
                </div>

                {/* ── Price History Chart (Chart.js) ── */}
                <div className="card p-6 mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2 mb-5">
                        📈 Price History
                    </h2>
                    <PriceHistoryChart productId={id} history={priceHistory} />
                </div>

                {/* Product description if present */}
                {product.description && (
                    <div className="card p-6 mb-6">
                        <h2 className="font-bold text-lg mb-3">About this product</h2>
                        <p className="text-gray-600 leading-relaxed">{product.description}</p>
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
