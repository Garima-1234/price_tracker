import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, SlidersHorizontal, Loader2 } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { productAPI } from '../services/api';

export default function Search() {
    const [searchParams, setSearchParams] = useSearchParams();
    const query = searchParams.get('q') || '';

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [platformCounts, setPlatformCounts] = useState({});

    const [filters, setFilters] = useState({
        sort: 'relevance',
        platform: 'all',
        minPrice: '',
        maxPrice: ''
    });

    useEffect(() => {
        if (query) {
            searchProducts();
        }
    }, [query]);

    const searchProducts = async () => {
        setLoading(true);
        setError('');

        try {
            const response = await productAPI.search(query, filters);

            if (response.data.success) {
                setProducts(response.data.products);
                setPlatformCounts(response.data.platformCounts || {});
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to search products');
            console.error('Search error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters({ ...filters, [key]: value });
    };

    const applyFilters = () => {
        searchProducts();
    };

    return (
        <div className="min-h-screen py-8 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">
                        Search Results for "<span className="gradient-text">{query}</span>"
                    </h1>
                    {!loading && products.length > 0 && (
                        <div>
                            <p className="text-gray-600">Found {products.length} products</p>
                            {/* Platform breakdown from scraping */}
                            {Object.keys(platformCounts).length > 0 && (
                                <div className="flex flex-wrap gap-3 mt-3">
                                    <span className="text-sm text-gray-500">Scraped from:</span>
                                    {Object.entries(platformCounts).map(([platform, count]) => (
                                        count > 0 && (
                                            <span 
                                                key={platform}
                                                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
                                            >
                                                {platform === 'amazon' && '🟠'}
                                                {platform === 'flipkart' && '🔵'}
                                                {platform === 'myntra' && '🩷'}
                                                {platform === 'ajio' && '⚫'}
                                                {platform}: {count}
                                            </span>
                                        )
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="grid lg:grid-cols-4 gap-8">
                    {/* Filters Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="card p-6 sticky top-24">
                            <div className="flex items-center space-x-2 mb-6">
                                <SlidersHorizontal className="w-5 h-5 text-primary-600" />
                                <h2 className="text-lg font-bold">Filters</h2>
                            </div>

                            {/* Sort */}
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Sort By
                                </label>
                                <select
                                    value={filters.sort}
                                    onChange={(e) => handleFilterChange('sort', e.target.value)}
                                    className="input-field"
                                >
                                    <option value="relevance">Relevance</option>
                                    <option value="price_low">Price: Low to High</option>
                                    <option value="price_high">Price: High to Low</option>
                                    <option value="rating">Rating</option>
                                </select>
                            </div>

                            {/* Platform */}
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Platform
                                </label>
                                <select
                                    value={filters.platform}
                                    onChange={(e) => handleFilterChange('platform', e.target.value)}
                                    className="input-field"
                                >
                                    <option value="all">All Platforms</option>
                                    <option value="amazon">Amazon</option>
                                    <option value="flipkart">Flipkart</option>
                                    <option value="myntra">Myntra</option>
                                    <option value="ajio">Ajio</option>
                                </select>
                            </div>

                            {/* Price Range */}
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Price Range
                                </label>
                                <div className="space-y-3">
                                    <input
                                        type="number"
                                        placeholder="Min Price"
                                        value={filters.minPrice}
                                        onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                                        className="input-field"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Max Price"
                                        value={filters.maxPrice}
                                        onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                                        className="input-field"
                                    />
                                </div>
                            </div>

                            {/* Apply Button */}
                            <button
                                onClick={applyFilters}
                                className="w-full btn-primary"
                            >
                                Apply Filters
                            </button>
                        </div>
                    </div>

                    {/* Products Grid */}
                    <div className="lg:col-span-3">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <Loader2 className="w-12 h-12 text-primary-600 animate-spin mb-4" />
                                <p className="text-gray-600">Searching across multiple platforms...</p>
                                <p className="text-sm text-gray-500 mt-2">This may take a few seconds</p>
                            </div>
                        ) : error ? (
                            <div className="card p-8 text-center">
                                <p className="text-red-600 font-semibold mb-2">Error</p>
                                <p className="text-gray-600">{error}</p>
                                <button
                                    onClick={searchProducts}
                                    className="btn-primary mt-4"
                                >
                                    Try Again
                                </button>
                            </div>
                        ) : products.length === 0 ? (
                            <div className="card p-12 text-center">
                                <div className="text-6xl mb-4">🔍</div>
                                <h3 className="text-xl font-bold mb-2">No products found</h3>
                                <p className="text-gray-600 mb-4">
                                    Try searching with different keywords or adjust your filters
                                </p>
                            </div>
                        ) : (
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {products.map((product) => (
                                    <ProductCard key={product._id} product={product} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
