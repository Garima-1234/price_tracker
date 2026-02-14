const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Product = require('../models/Product');

/**
 * Register new user
 * POST /api/auth/signup
 */
exports.signup = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, error: 'All fields are required' });
        }
        if (password.length < 6) {
            return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, error: 'Email already registered' });
        }

        const user = new User({ name, email, password });
        await user.save();

        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            success: true,
            message: 'Account created successfully!',
            token,
            user: { id: user._id, name: user.name, email: user.email }
        });

    } catch (error) {
        console.error('Signup error:', error.message);
        res.status(500).json({ success: false, error: 'Signup failed' });
    }
};

/**
 * Login user
 * POST /api/auth/login
 */
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'Email and password are required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            message: 'Login successful!',
            token,
            user: { id: user._id, name: user.name, email: user.email }
        });

    } catch (error) {
        console.error('Login error:', error.message);
        res.status(500).json({ success: false, error: 'Login failed' });
    }
};

/**
 * Get user profile
 * GET /api/auth/profile
 */
exports.getProfile = async (req, res) => {
    try {
        res.json({
            success: true,
            user: {
                id: req.user._id,
                name: req.user.name,
                email: req.user.email,
                wishlistCount: req.user.wishlist.length,
                activeAlerts: req.user.priceAlerts.filter(a => a.active).length
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to get profile' });
    }
};

/**
 * Get full wishlist with product details
 * GET /api/auth/wishlist
 */
exports.getWishlist = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('wishlist');

        const wishlistProducts = (user.wishlist || []).map(product => {
            if (!product) return null;
            const p = product.toJSON ? product.toJSON() : product;

            // Find lowest price
            let lowestPrice = null;
            let lowestPriceInfo = null;
            if (p.prices) {
                Object.entries(p.prices).forEach(([platform, data]) => {
                    if (data?.price && data.inStock !== false) {
                        if (!lowestPriceInfo || data.price < lowestPriceInfo.price) {
                            lowestPriceInfo = { platform, price: data.price, url: data.url };
                            lowestPrice = data.price;
                        }
                    }
                });
            }

            return { ...p, lowestPrice, lowestPriceInfo };
        }).filter(Boolean);

        res.json({
            success: true,
            count: wishlistProducts.length,
            products: wishlistProducts
        });

    } catch (error) {
        console.error('Wishlist error:', error.message);
        res.status(500).json({ success: false, error: 'Failed to get wishlist' });
    }
};

/**
 * Add to wishlist
 * POST /api/auth/wishlist/:productId
 */
exports.addToWishlist = async (req, res) => {
    try {
        const { productId } = req.params;

        if (!req.user.wishlist.includes(productId)) {
            req.user.wishlist.push(productId);
            await req.user.save();
        }

        res.json({
            success: true,
            message: 'Added to wishlist! ❤️',
            wishlist: req.user.wishlist
        });

    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to add to wishlist' });
    }
};

/**
 * Remove from wishlist
 * DELETE /api/auth/wishlist/:productId
 */
exports.removeFromWishlist = async (req, res) => {
    try {
        const { productId } = req.params;

        req.user.wishlist = req.user.wishlist.filter(id => id.toString() !== productId);
        await req.user.save();

        res.json({
            success: true,
            message: 'Removed from wishlist',
            wishlist: req.user.wishlist
        });

    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to remove from wishlist' });
    }
};

/**
 * JWT Auth Middleware
 */
exports.authMiddleware = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ success: false, error: 'Authentication required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({ success: false, error: 'User not found' });
        }

        req.user = user;
        next();

    } catch (error) {
        res.status(401).json({ success: false, error: 'Invalid token' });
    }
};
