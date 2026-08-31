const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Connect to Database
const connectDB = require('./config/db');
connectDB();

// Import routes
const productRoutes = require('./routes/products');
const catalogueRoutes = require('./routes/catalogue');

const app = express();
const PORT = process.env.PORT || 5000;

// =============================================
// MIDDLEWARE
// =============================================

// CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser (increased limit for images)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // 100 requests per window
});
app.use('/api/', limiter);

// =============================================
// API ROUTES
// =============================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'SUITFULLY API is running',
    timestamp: new Date().toISOString()
  });
});

// Product routes
app.use('/api/products', productRoutes);

// Catalogue routes
app.use('/api/catalogue', catalogueRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// =============================================
// START SERVER
// =============================================

app.listen(PORT, () => {
  console.log(`🚀 SUITFULLY API Server running on port ${PORT}`);
  console.log(`📊 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`📦 Products: http://localhost:${PORT}/api/products`);
  console.log(`📚 Catalogue: http://localhost:${PORT}/api/catalogue`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});