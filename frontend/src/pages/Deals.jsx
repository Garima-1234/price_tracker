import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TrendingDown, Zap, Star, AlertTriangle, ChevronRight, Flame } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export default function Deals() {
    const [deals, setDeals] = useState([]);
    const [trending, setTrending] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('deals');
    const [category, setCategory] = useState('');
    const [sortBy, setSortBy] = useState('dealScore');

    useEffect(() => {
        loadDeals();
        loadTrending();
    }, [category, sortBy]);

    async function loadDeals() {
        setLoading(true);
        try {
            const params = new URLSearchParams({ limit: 20, sortBy });
            if (category) params.append('category', category);
            const res = await fetch(`${API_BASE}/recommendations?${params}`);
            const data = await res.json();
            if (data.success) setDeals(data.recommendations || []);
        } catch (e) {
            // fallback to demo deals
            setDeals(DEMO_DEALS);
        } finally {
            setLoading(false);
        }
    }

    async function loadTrending() {
        try {
            const res = await fetch(`${API_BASE}/recommendations/trending`);
            const data = await res.json();
            if (data.success) setTrending(data.trending || []);
        } catch (e) {
            setTrending(DEMO_TRENDING);
        }
    }

    const categories = ['', 'electronics', 'fashion', 'home', 'beauty', 'sports', 'books'];

    return (
        <div className="min-h-screen py-8 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center">
                            <Zap className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold">Today's Best Deals</h1>
                    </div>
                    <p className="text-gray-500 ml-13">Handpicked deals ranked by real savings</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit mb-8">
                    {[
                        { id: 'deals', label: '🔥 Top Deals', },
                        { id: 'trending', label: '📈 Trending' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-5 py-2 rounded-lg font-semibold text-sm transition-all ${
                                activeTab === tab.id
                                    ? 'bg-white shadow text-purple-700'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {activeTab === 'deals' && (
                    <>
                        {/* Filters */}
                        <div className="flex flex-wrap gap-3 mb-6">
                            <select
                                value={category}
                                onChange={e => setCategory(e.target.value)}
                                className="input-field max-w-[160px]"
                            >
                                {categories.map(c => (
                                    <option key={c} value={c}>{c || 'All Categories'}</option>
                                ))}
                            </select>
                            <select
                                value={sortBy}
                                onChange={e => setSortBy(e.target.value)}
                                className="input-field max-w-[160px]"
                            >
                                <option value="dealScore">Best Deal Score</option>
                                <option value="discount">Highest Discount</option>
                                <option value="rating">Highest Rated</option>
                            </select>
                        </div>

                        {loading ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {Array(8).fill(0).map((_, i) => (
                                    <div key={i} className="card p-4 animate-pulse">
                                        <div className="h-40 bg-gray-200 rounded-lg mb-3" />
                                        <div className="h-4 bg-gray-200 rounded mb-2" />
                                        <div className="h-4 bg-gray-200 rounded w-2/3" />
                                    </div>
                                ))}
                            </div>
                        ) : deals.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {deals.map(deal => (
                                    <DealCard key={deal._id} deal={deal} />
                                ))}
                            </div>
                        ) : (
                            <EmptyState
                                icon="🎁"
                                title="No deals tracked yet"
                                desc="Add products to tracking to see the best deals here."
                            />
                        )}
                    </>
                )}

                {activeTab === 'trending' && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {trending.map((p, i) => (
                            <Link
                                key={p._id}
                                to={`/product/${p._id}`}
                                className="card p-4 hover:shadow-lg transition-all hover:-translate-y-1 group"
                            >
                                <div className="relative mb-3">
                                    <img
                                        src={p.image}
                                        alt={p.name}
                                        className="w-full h-40 object-contain rounded-lg bg-gray-50"
                                        onError={e => { e.target.src = 'https://via.placeholder.com/150'; }}
                                    />
                                    <span className="absolute top-2 left-2 bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                        #{i + 1}
                                    </span>
                                </div>
                                <p className="text-sm font-medium line-clamp-2 mb-2 group-hover:text-purple-600 transition-colors">{p.name}</p>
                                {p.price && (
                                    <p className="text-lg font-bold text-purple-600">₹{p.price.toLocaleString('en-IN')}</p>
                                )}
                            </Link>
                        ))}
                        {trending.length === 0 && (
                            <div className="col-span-full">
                                <EmptyState icon="📈" title="No trending products yet" desc="Start tracking products to see trending data." />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function DealCard({ deal }) {
    return (
        <Link to={`/product/${deal._id}`} className="card p-4 hover:shadow-lg transition-all hover:-translate-y-1 group relative overflow-hidden">
            {/* Fake discount warning */}
            {deal.isFakeDiscount && (
                <div className="absolute top-0 left-0 right-0 bg-red-50 border-b border-red-200 px-3 py-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-red-500 flex-shrink-0" />
                    <span className="text-xs text-red-600 font-medium">Possibly inflated MRP</span>
                </div>
            )}

            <div className={`relative mb-3 ${deal.isFakeDiscount ? 'mt-5' : ''}`}>
                <img
                    src={deal.image}
                    alt={deal.name}
                    className="w-full h-40 object-contain rounded-lg bg-gray-50"
                    onError={e => { e.target.src = 'https://via.placeholder.com/150'; }}
                />
                {deal.discountPct > 0 && (
                    <span className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        -{deal.discountPct}%
                    </span>
                )}
                {deal.mlTrend === 'falling' && (
                    <span className="absolute bottom-2 right-2 bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <TrendingDown className="w-3 h-3" /> Price dropping
                    </span>
                )}
            </div>

            <p className="text-sm font-medium line-clamp-2 mb-2 group-hover:text-purple-600 transition-colors">{deal.name}</p>

            <div className="flex items-baseline gap-2 mb-1">
                <span className="text-lg font-bold text-purple-600">₹{deal.lowestPrice?.toLocaleString('en-IN')}</span>
                {deal.mrp > deal.lowestPrice && (
                    <span className="text-xs text-gray-400 line-through">₹{deal.mrp?.toLocaleString('en-IN')}</span>
                )}
            </div>

            <div className="flex items-center justify-between">
                {deal.rating > 0 && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        {deal.rating.toFixed(1)}
                    </div>
                )}
                <span className="text-xs font-semibold text-purple-600 capitalize ml-auto flex items-center gap-1">
                    {deal.bestPlatform} <ChevronRight className="w-3 h-3" />
                </span>
            </div>
        </Link>
    );
}

function EmptyState({ icon, title, desc }) {
    return (
        <div className="col-span-full py-16 text-center">
            <div className="text-5xl mb-4">{icon}</div>
            <h3 className="text-xl font-semibold mb-2">{title}</h3>
            <p className="text-gray-500">{desc}</p>
        </div>
    );
}

// Demo data for when backend isn't available
const DEMO_DEALS = [
    { _id: '1', name: 'boAt Rockerz 450 Bluetooth Headphones', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300', lowestPrice: 1299, mrp: 3990, discountPct: 67, bestPlatform: 'amazon', rating: 4.2, dealScore: 85, isFakeDiscount: false, mlTrend: 'falling' },
    { _id: '2', name: 'Noise ColorFit Pro 3 Smart Watch', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300', lowestPrice: 2499, mrp: 6999, discountPct: 64, bestPlatform: 'flipkart', rating: 4.0, dealScore: 78, isFakeDiscount: false, mlTrend: 'stable' },
    { _id: '3', name: 'Redmi Note 12 (128GB)', image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=300', lowestPrice: 12999, mrp: 18999, discountPct: 32, bestPlatform: 'amazon', rating: 4.3, dealScore: 73, isFakeDiscount: true, mlTrend: 'rising' },
    { _id: '4', name: 'Philips Trimmer Series 3000', image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=300', lowestPrice: 899, mrp: 1695, discountPct: 47, bestPlatform: 'flipkart', rating: 4.1, dealScore: 70, isFakeDiscount: false, mlTrend: 'stable' },
];

const DEMO_TRENDING = [
    { _id: '1', name: 'Apple iPhone 15', image: 'https://images.unsplash.com/photo-1695048133142-1a20484429be?w=300', price: 69999, category: 'electronics' },
    { _id: '2', name: 'Samsung Galaxy S24', image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=300', price: 59999, category: 'electronics' },
    { _id: '3', name: 'Sony WH-1000XM5', image: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=300', price: 21990, category: 'electronics' },
    { _id: '4', name: 'Nike Air Max 270', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300', price: 8495, category: 'fashion' },
];
