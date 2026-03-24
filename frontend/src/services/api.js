import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle 401 errors (expired token)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
        return Promise.reject(error);
    }
);

// Product API
export const productAPI = {
    search: (query, filters = {}) => {
        const params = new URLSearchParams({ q: query, ...filters });
        return api.get(`/products/search?${params}`);
    },

    getById: (id) => api.get(`/products/${id}`),

    getHistory: (id, platform = 'all') => {
        return api.get(`/products/${id}/history?platform=${platform}`);
    },

    refresh: (id) => api.post(`/products/${id}/refresh`),

    setPriceAlert: (id, data) => api.post(`/products/${id}/alert`, data),

    comparePrices: (productId, productName) => {
        const params = new URLSearchParams();
        if (productId)   params.set('product_id', productId);
        if (productName) params.set('product_name', productName);
        return api.get(`/api/compare-prices?${params}`);
    }
};

// Auth API
export const authAPI = {
    signup: (data) => api.post('/auth/signup', data),

    login: (data) => api.post('/auth/login', data),

    getProfile: () => api.get('/auth/profile'),

    getWishlist: () => api.get('/auth/wishlist'),

    addToWishlist: (productId) => api.post(`/auth/wishlist/${productId}`),

    removeFromWishlist: (productId) => api.delete(`/auth/wishlist/${productId}`)
};

export default api;
