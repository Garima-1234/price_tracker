import { Link } from 'react-router-dom';
import { Search, TrendingDown, Zap, Shield, Bell, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
        }
    };

    const popularSearches = [
        'Nike Shoes',
        'iPhone 15',
        'Samsung TV',
        'Laptop',
        'Headphones',
        'Smart Watch'
    ];

    const features = [
        {
            icon: <TrendingDown className="w-8 h-8" />,
            title: 'Best Price Guaranteed',
            description: 'Compare prices across Amazon, Flipkart, and Ajio'
        },
        {
            icon: <Zap className="w-8 h-8" />,
            title: 'Real-Time Updates',
            description: 'Get instant price updates and never miss a deal'
        },
        {
            icon: <Bell className="w-8 h-8" />,
            title: 'Price Alerts',
            description: 'Set alerts and get notified when prices drop'
        },
        {
            icon: <Shield className="w-8 h-8" />,
            title: '100% Safe',
            description: 'Secure shopping with trusted e-commerce partners'
        }
    ];

    const categories = [
        { name: 'Electronics', emoji: '📱', color: 'from-blue-500 to-cyan-500' },
        { name: 'Fashion', emoji: '👕', color: 'from-pink-500 to-rose-500' },
        { name: 'Home & Kitchen', emoji: '🏠', color: 'from-green-500 to-emerald-500' },
        { name: 'Sports', emoji: '⚽', color: 'from-orange-500 to-amber-500' },
        { name: 'Books', emoji: '📚', color: 'from-purple-500 to-violet-500' },
        { name: 'Beauty', emoji: '💄', color: 'from-red-500 to-pink-500' }
    ];

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="relative overflow-hidden py-20 px-4">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-100 via-accent-50 to-pink-100 opacity-50"></div>

                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full mb-6 shadow-lg">
                        <Sparkles className="w-5 h-5 text-primary-600" />
                        <span className="text-sm font-semibold text-primary-700">Save up to 50% on every purchase</span>
                    </div>

                    <h1 className="text-5xl md:text-6xl font-bold mb-6 text-shadow">
                        Find the <span className="gradient-text">Best Deals</span>
                        <br />
                        Across All Platforms
                    </h1>

                    <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
                        Compare prices from Amazon, Flipkart, and Ajio. Save money on every purchase with real-time price tracking.
                    </p>

                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8">
                        <div className="relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search for products (e.g., Nike shoes, iPhone 15...)"
                                className="w-full px-6 py-5 rounded-2xl border-2 border-primary-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 outline-none text-lg shadow-xl"
                            />
                            <button
                                type="submit"
                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-primary-600 to-accent-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-primary-700 hover:to-accent-700 transition-all shadow-lg hover:shadow-xl"
                            >
                                <Search className="w-6 h-6" />
                            </button>
                        </div>
                    </form>

                    {/* Popular Searches */}
                    <div className="flex flex-wrap justify-center gap-3">
                        <span className="text-sm text-gray-600">Popular:</span>
                        {popularSearches.map((term) => (
                            <button
                                key={term}
                                onClick={() => navigate(`/search?q=${encodeURIComponent(term)}`)}
                                className="px-4 py-2 bg-white hover:bg-primary-50 border border-gray-200 hover:border-primary-300 rounded-full text-sm font-medium text-gray-700 hover:text-primary-700 transition-all shadow-sm hover:shadow-md"
                            >
                                {term}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-16 px-4 bg-white/50">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl font-bold text-center mb-12">
                        Why Choose <span className="gradient-text">BuyHatke</span>?
                    </h2>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className="card p-6 text-center hover-glow group"
                            >
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-100 to-accent-100 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                                    <div className="text-primary-600">
                                        {feature.icon}
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                                <p className="text-gray-600 text-sm">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Categories Section */}
            <section className="py-16 px-4">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl font-bold text-center mb-12">
                        Shop by <span className="gradient-text">Category</span>
                    </h2>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                        {categories.map((category, index) => (
                            <button
                                key={index}
                                onClick={() => navigate(`/search?q=${encodeURIComponent(category.name)}`)}
                                className="card p-6 text-center hover-glow group cursor-pointer"
                            >
                                <div className={`text-5xl mb-3 group-hover:scale-125 transition-transform`}>
                                    {category.emoji}
                                </div>
                                <h3 className="font-semibold text-gray-800 group-hover:text-primary-600 transition-colors">
                                    {category.name}
                                </h3>
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-4 bg-gradient-to-r from-primary-600 to-accent-600 text-white">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl font-bold mb-6">
                        Start Saving Money Today! 💰
                    </h2>
                    <p className="text-xl mb-8 opacity-90">
                        Join thousands of smart shoppers who save money on every purchase
                    </p>
                    <button
                        onClick={() => navigate('/search?q=trending')}
                        className="bg-white text-primary-700 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all shadow-2xl hover:scale-105 transform"
                    >
                        Explore Deals Now
                    </button>
                </div>
            </section>
        </div>
    );
}
