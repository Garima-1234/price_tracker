import { Link, useNavigate } from 'react-router-dom';
import { Search, User, Heart, LogOut, TrendingDown } from 'lucide-react';
import { useState } from 'react';

export default function Navbar({ user, onLoginClick, onLogout }) {
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
            setSearchQuery('');
        }
    };

    return (
        <nav className="glass-effect sticky top-0 z-50 border-b border-purple-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center space-x-2 group">
                        <div className="bg-gradient-to-r from-primary-600 to-accent-600 p-2 rounded-lg group-hover:scale-110 transition-transform">
                            <TrendingDown className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold gradient-text">BuyHatke</span>
                    </Link>

                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-2xl mx-8">
                        <div className="relative w-full">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search for products (e.g., Nike shoes, iPhone 15...)"
                                className="input-field pr-12 shadow-md"
                            />
                            <button
                                type="submit"
                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-primary-600 to-primary-700 text-white p-2 rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all"
                            >
                                <Search className="w-5 h-5" />
                            </button>
                        </div>
                    </form>

                    {/* User Actions */}
                    <div className="flex items-center space-x-4">
                        {user ? (
                            <>
                                <Link
                                    to="/wishlist"
                                    className="p-2 hover:bg-purple-100 rounded-lg transition-colors relative group"
                                    title="My Wishlist"
                                >
                                    <Heart className="w-6 h-6 text-primary-600 group-hover:fill-primary-600 transition-all" />
                                </Link>

                                <div className="flex items-center space-x-3 bg-purple-50 px-4 py-2 rounded-lg">
                                    <User className="w-5 h-5 text-primary-600" />
                                    <span className="font-medium text-gray-700">{user.name}</span>
                                </div>

                                <button
                                    onClick={onLogout}
                                    className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
                                    title="Logout"
                                >
                                    <LogOut className="w-5 h-5 text-gray-600 group-hover:text-red-600" />
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={onLoginClick}
                                className="btn-primary"
                            >
                                Login / Sign Up
                            </button>
                        )}
                    </div>
                </div>

                {/* Mobile Search */}
                <form onSubmit={handleSearch} className="md:hidden pb-4">
                    <div className="relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search products..."
                            className="input-field pr-12"
                        />
                        <button
                            type="submit"
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary-600 text-white p-2 rounded-lg"
                        >
                            <Search className="w-5 h-5" />
                        </button>
                    </div>
                </form>
            </div>
        </nav>
    );
}
