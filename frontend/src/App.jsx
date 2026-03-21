import { Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Search from './pages/Search';
import ProductDetail from './pages/ProductDetail';
import Wishlist from './pages/Wishlist';
import Auth from './pages/Auth';
import Deals from './pages/Deals';
import Alerts from './pages/Alerts';
import AuthModal from './components/AuthModal';

function App() {
    const [user, setUser] = useState(null);
    const [showAuthModal, setShowAuthModal] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (token && userData) {
            try {
                setUser(JSON.parse(userData));
            } catch (e) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }
    }, []);

    const handleLogin = (userData, token) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        setShowAuthModal(false);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    return (
        <div className="min-h-screen">
            <Navbar
                user={user}
                onLoginClick={() => setShowAuthModal(true)}
                onLogout={handleLogout}
            />

            <Routes>
                <Route path="/"            element={<Home />} />
                <Route path="/search"      element={<Search />} />
                <Route path="/product/:id" element={<ProductDetail user={user} />} />
                <Route path="/wishlist"    element={<Wishlist user={user} />} />
                <Route path="/auth"        element={<Auth onLogin={handleLogin} />} />
                <Route path="/deals"       element={<Deals />} />
                <Route path="/alerts"      element={<Alerts user={user} />} />
            </Routes>

            {showAuthModal && (
                <AuthModal
                    onClose={() => setShowAuthModal(false)}
                    onLogin={handleLogin}
                />
            )}
        </div>
    );
}

export default App;

