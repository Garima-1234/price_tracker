import { Link } from 'react-router-dom';
import { TrendingDown, Star, ExternalLink } from 'lucide-react';

export default function ProductCard({ product }) {
    const lowestPrice = product.lowestPrice || product.lowestPriceInfo?.price;
    const lowestPlatform = product.lowestPriceInfo?.platform;

    // Calculate discount if we have multiple prices
    const prices = Object.values(product.prices || {})
        .filter(p => p?.price)
        .map(p => p.price);

    const maxPrice = prices.length > 0 ? Math.max(...prices) : null;
    const discount = maxPrice && lowestPrice ? Math.round(((maxPrice - lowestPrice) / maxPrice) * 100) : 0;

    return (
        <Link to={`/product/${product._id}`}>
            <div className="card card-hover h-full flex flex-col">
                {/* Image */}
                <div className="relative bg-gray-50 aspect-square">
                    <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-contain p-4"
                        loading="lazy"
                    />

                    {discount > 0 && (
                        <div className="absolute top-2 right-2 discount-badge">
                            {discount}% OFF
                        </div>
                    )}

                    {lowestPlatform && (
                        <div className="absolute top-2 left-2 badge badge-success">
                            Lowest on {lowestPlatform.toUpperCase()}
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col">
                    {/* Title */}
                    <h3 className="font-semibold text-gray-800 line-clamp-2 mb-2 hover:text-primary-600 transition-colors">
                        {product.name}
                    </h3>

                    {/* Rating */}
                    {product.rating > 0 && (
                        <div className="flex items-center space-x-1 mb-3">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium text-gray-700">{product.rating.toFixed(1)}</span>
                            {product.reviewCount > 0 && (
                                <span className="text-xs text-gray-500">({product.reviewCount})</span>
                            )}
                        </div>
                    )}

                    {/* Price */}
                    <div className="mt-auto">
                        {lowestPrice ? (
                            <>
                                <div className="flex items-baseline space-x-2">
                                    <span className="price-tag text-primary-600">₹{lowestPrice.toLocaleString()}</span>
                                    {maxPrice && maxPrice > lowestPrice && (
                                        <span className="text-sm text-gray-400 line-through">₹{maxPrice.toLocaleString()}</span>
                                    )}
                                </div>

                                {/* Platform count */}
                                <div className="flex items-center space-x-1 mt-2 text-sm text-gray-600">
                                    <TrendingDown className="w-4 h-4" />
                                    <span>Available on {Object.keys(product.prices || {}).filter(k => product.prices[k]?.price).length} platforms</span>
                                </div>
                            </>
                        ) : (
                            <span className="text-gray-500">Price not available</span>
                        )}
                    </div>

                    {/* Compare button */}
                    <button className="mt-4 w-full bg-gradient-to-r from-primary-600 to-accent-600 text-white py-2 rounded-lg font-semibold hover:from-primary-700 hover:to-accent-700 transition-all flex items-center justify-center space-x-2 group">
                        <span>Compare Prices</span>
                        <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </Link>
    );
}
