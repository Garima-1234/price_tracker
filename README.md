# 🛍️ BuyHatke Clone - Price Comparison Platform

A full-stack price comparison platform that helps users find the best deals across multiple e-commerce platforms like Amazon, Flipkart, Myntra, and Ajio.

![Tech Stack](https://img.shields.io/badge/React-18.2-blue)
![Node.js](https://img.shields.io/badge/Node.js-Express-green)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-brightgreen)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-blueviolet)

## ✨ Features

- 🔍 **Smart Search** - Search products across multiple platforms
- 💰 **Price Comparison** - Real-time price comparison from Amazon, Flipkart, Myntra, Ajio
- 📊 **Price History** - Track price trends with interactive charts
- 🔔 **Price Alerts** - Get notified when prices drop
- ❤️ **Wishlist** - Save your favorite products
- 🔐 **User Authentication** - Secure login and signup
- 📱 **Responsive Design** - Works on all devices
- ⚡ **Real-time Scraping** - Fresh prices using Puppeteer

## 🛠️ Technology Stack

### Backend
- **Node.js** + **Express.js** - Server framework
- **MongoDB** + **Mongoose** - Database
- **Puppeteer** - Web scraping
- **JWT** - Authentication
- **Nodemailer** - Email notifications
- **Node-cron** - Scheduled price updates

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **Recharts** - Data visualization
- **Axios** - API calls
- **Lucide React** - Icons

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file (copy from .env.example)
cp .env.example .env

# Edit .env and add your MongoDB URI
# MONGODB_URI=mongodb://localhost:27017/buyhatke

# Start the server
npm run dev
```

Backend will run on `http://localhost:5000`

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will run on `http://localhost:5173`

## 🚀 Usage

1. **Start MongoDB** (if running locally):
   ```bash
   mongod
   ```

2. **Start Backend**:
   ```bash
   cd backend
   npm run dev
   ```

3. **Start Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

4. **Open Browser**: Navigate to `http://localhost:5173`

5. **Search Products**: Enter product name (e.g., "Nike shoes", "iPhone 15")

6. **Compare Prices**: View prices from multiple platforms

7. **Track Prices**: Set alerts for price drops

## 📁 Project Structure

```
Buyhatke-clone/
├── backend/
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API routes
│   ├── scrapers/        # Web scrapers
│   ├── jobs/            # Cron jobs
│   ├── utils/           # Helper functions
│   └── server.js        # Main server file
│
└── frontend/
    ├── src/
    │   ├── components/  # Reusable components
    │   ├── pages/       # Page components
    │   ├── services/    # API services
    │   ├── App.jsx      # Main app component
    │   └── main.jsx     # Entry point
    └── index.html
```

## 🔌 API Endpoints

### Products
- `GET /api/products/search?q=query` - Search products
- `GET /api/products/:id` - Get product details
- `GET /api/products/:id/history` - Get price history
- `POST /api/products/:id/refresh` - Refresh prices

### Authentication
- `POST /api/auth/signup` - Register user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/wishlist/:productId` - Add to wishlist
- `DELETE /api/auth/wishlist/:productId` - Remove from wishlist

## 💡 How It Works

1. **User searches** for a product
2. **Backend scrapes** Amazon, Flipkart, Myntra, Ajio
3. **Prices are aggregated** and saved to MongoDB
4. **Frontend displays** comparison table
5. **Price history** is tracked over time
6. **Cron jobs** update prices daily
7. **Email alerts** sent when prices drop

## 🎨 Features Showcase

### Price Comparison
- Side-by-side price comparison
- Lowest price highlighted
- Direct buy links to platforms

### Price History Chart
- Interactive line chart
- Filter by platform
- Track price trends

### Smart Filters
- Sort by price, rating, relevance
- Filter by platform
- Price range filter

## 🔐 Environment Variables

### Backend (.env)
```env
MONGODB_URI=mongodb://localhost:27017/buyhatke
PORT=5000
JWT_SECRET=your_secret_key
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
FRONTEND_URL=http://localhost:5173
```

## 🚀 Deployment

### Backend (Render/Railway)
1. Push code to GitHub
2. Connect to Render/Railway
3. Add environment variables
4. Deploy

### Frontend (Vercel)
1. Push code to GitHub
2. Import project to Vercel
3. Set build command: `npm run build`
4. Set output directory: `dist`
5. Deploy

### Database (MongoDB Atlas)
1. Create cluster on MongoDB Atlas
2. Get connection string
3. Update MONGODB_URI in backend .env

## 📝 Notes

- **Web Scraping**: Scraping may violate some sites' Terms of Service. Use affiliate APIs where possible.
- **Rate Limiting**: Add delays between scraping requests to avoid being blocked
- **Affiliate Links**: Replace direct product URLs with affiliate links to monetize

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## 📄 License

This project is for educational purposes. Please respect the Terms of Service of e-commerce platforms.

## 🙏 Acknowledgments

- Inspired by BuyHatke, Smartprix, and CashKaro
- Built for learning full-stack development
- Perfect for MCA/BCA projects

---

**Made with ❤️ for smart shoppers**
