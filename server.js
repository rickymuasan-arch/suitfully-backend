const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// =============================================
// MIDDLEWARE
// =============================================
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);

// =============================================
// MONGODB SCHEMAS
// =============================================

// Product Schema
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  mainImage: { type: String, default: '' },
  views: { type: [String], default: [] },
  video: { type: String, default: '' },
  description: { type: String, default: '' },
  features: { type: [String], default: [] },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });

// Catalogue Schema
const catalogueSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  images: { type: [String], default: [] }
}, { timestamps: true });

// Payment Settings Schema
const paymentSettingsSchema = new mongoose.Schema({
  mpesa: {
    paybill: { type: String, default: '123456' },
    accountNumber: { type: String, default: 'SUITFULLY' },
    instructions: { type: String, default: 'Follow the steps below to complete your M-Pesa payment.' }
  },
  creditCard: {
    enabled: { type: Boolean, default: true },
    instructions: { type: String, default: 'Please have your card ready and click the link below to complete payment securely.' }
  },
  debitCard: {
    enabled: { type: Boolean, default: true },
    instructions: { type: String, default: 'Please have your card ready and click the link below to complete payment securely.' }
  },
  paypal: {
    email: { type: String, default: 'suitfully@gmail.com' },
    enabled: { type: Boolean, default: true },
    instructions: { type: String, default: 'Click the button below to pay securely with PayPal.' }
  },
  bankTransfer: {
    bankName: { type: String, default: 'Equity Bank Kenya' },
    accountName: { type: String, default: 'SUITFULLY' },
    accountNumber: { type: String, default: '175-020-000-0001' },
    branch: { type: String, default: 'Utalii Lane, Nairobi' },
    instructions: { type: String, default: 'Please transfer the exact amount to the following SUITFULLY account.' }
  }
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);
const Catalogue = mongoose.model('Catalogue', catalogueSchema);
const PaymentSettings = mongoose.model('PaymentSettings', paymentSettingsSchema);

// =============================================
// API ROUTES - PRODUCTS
// =============================================

// Get all active products (for public site)
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find({ status: 'active' });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all products (for admin - includes inactive)
app.get('/api/products/all', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single product
app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create product (admin)
app.post('/api/products', async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update product (admin)
app.put('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete product (admin)
app.delete('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============================================
// API ROUTES - CATALOGUE
// =============================================

// Get all catalogue (for public site)
app.get('/api/catalogue', async (req, res) => {
  try {
    const catalogue = await Catalogue.find();
    const result = {};
    catalogue.forEach(item => {
      result[item.key] = {
        title: item.title,
        description: item.description,
        images: item.images
      };
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create catalogue item (admin)
app.post('/api/catalogue', async (req, res) => {
  try {
    const catalogue = new Catalogue(req.body);
    await catalogue.save();
    res.status(201).json(catalogue);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update catalogue item (admin)
app.put('/api/catalogue/:key', async (req, res) => {
  try {
    const catalogue = await Catalogue.findOneAndUpdate(
      { key: req.params.key },
      req.body,
      { new: true, runValidators: true }
    );
    if (!catalogue) {
      return res.status(404).json({ error: 'Catalogue item not found' });
    }
    res.json(catalogue);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete catalogue item (admin)
app.delete('/api/catalogue/:key', async (req, res) => {
  try {
    const catalogue = await Catalogue.findOneAndDelete({ key: req.params.key });
    if (!catalogue) {
      return res.status(404).json({ error: 'Catalogue item not found' });
    }
    res.json({ message: 'Catalogue item deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============================================
// API ROUTES - PAYMENT SETTINGS
// =============================================

// Get payment settings
app.get('/api/settings/payment', async (req, res) => {
  try {
    let settings = await PaymentSettings.findOne();
    if (!settings) {
      // Create default settings if none exist
      settings = new PaymentSettings();
      await settings.save();
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update payment settings (admin)
app.put('/api/settings/payment', async (req, res) => {
  try {
    let settings = await PaymentSettings.findOne();
    if (!settings) {
      settings = new PaymentSettings(req.body);
      await settings.save();
    } else {
      settings = await PaymentSettings.findByIdAndUpdate(
        settings._id,
        req.body,
        { new: true, runValidators: true }
      );
    }
    res.json(settings);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// =============================================
// HEALTH CHECK
// =============================================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'SUITFULLY API is running',
    timestamp: new Date().toISOString(),
    endpoints: {
      products: '/api/products',
      productsAll: '/api/products/all',
      catalogue: '/api/catalogue',
      paymentSettings: '/api/settings/payment',
      health: '/api/health'
    }
  });
});

// =============================================
// 404 HANDLER
// =============================================
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// =============================================
// ERROR HANDLER
// =============================================
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// =============================================
// CONNECT TO MONGODB AND START SERVER
// =============================================
const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`SUITFULLY API Server running on port ${PORT}`);
      console.log(`Health Check: http://localhost:${PORT}/api/health`);
      console.log(`Products: http://localhost:${PORT}/api/products`);
      console.log(`Catalogue: http://localhost:${PORT}/api/catalogue`);
      console.log(`Payment Settings: http://localhost:${PORT}/api/settings/payment`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

startServer();