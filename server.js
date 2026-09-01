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

// Catalogue Schema - FIXED: Added price field
const catalogueSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  images: { type: [String], default: [] },
  price: { type: Number, default: 0 }
}, { timestamps: true });

// Payment Settings Schema - with card gateway fields
const paymentSettingsSchema = new mongoose.Schema({
  mpesa: {
    paybill: { type: String, default: '123456' },
    accountNumber: { type: String, default: 'SUITFULLY' },
    instructions: { type: String, default: 'Follow the steps below to complete your M-Pesa payment.' }
  },
  creditCard: {
    enabled: { type: Boolean, default: true },
    gateway: { type: String, default: 'pesapal' },
    publicKey: { type: String, default: '' },
    secretKey: { type: String, default: '' },
    instructions: { type: String, default: 'Please have your card ready and click the link below to complete payment securely.' }
  },
  debitCard: {
    enabled: { type: Boolean, default: true },
    gateway: { type: String, default: 'pesapal' },
    publicKey: { type: String, default: '' },
    secretKey: { type: String, default: '' },
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

// Order Schema - for tracking payments
const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  customerEmail: { type: String, required: true },
  customerName: { type: String, required: true },
  items: { type: Array, required: true },
  total: { type: Number, required: true },
  currency: { type: String, default: 'usd' },
  delivery: { type: Object, required: true },
  discount: { type: Number, default: 0 },
  paymentMethod: { type: String, required: true },
  paymentStatus: { type: String, enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'], default: 'pending' },
  gatewayPaymentId: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'], default: 'pending' },
  shippingAddress: {
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
    country: String,
    city: String,
    address: String,
    apartment: String,
    postal: String
  },
  notes: { type: String, default: '' }
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);
const Catalogue = mongoose.model('Catalogue', catalogueSchema);
const PaymentSettings = mongoose.model('PaymentSettings', paymentSettingsSchema);
const Order = mongoose.model('Order', orderSchema);

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
// API ROUTES - CATALOGUE (FIXED: includes price)
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
        images: item.images,
        price: item.price || 0
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
// API ROUTES - PAYMENT GATEWAY
// =============================================

// Create payment intent
app.post('/api/payment/create-intent', async (req, res) => {
  try {
    const {
      method,
      amount,
      currency,
      orderId,
      customerEmail,
      customerName,
      items,
      delivery,
      discount
    } = req.body;

    const settings = await PaymentSettings.findOne();
    if (!settings) {
      return res.status(400).json({ error: 'Payment settings not configured' });
    }

    const cardSettings = method === 'credit' ? settings.creditCard : settings.debitCard;
    if (!cardSettings || !cardSettings.enabled) {
      return res.status(400).json({ error: `${method} card payments are currently disabled` });
    }

    const gateway = cardSettings.gateway || 'pesapal';

    let order = new Order({
      orderId: orderId,
      customerEmail: customerEmail,
      customerName: customerName,
      items: items || [],
      total: amount,
      currency: currency || 'usd',
      delivery: delivery || {},
      discount: discount || 0,
      paymentMethod: method,
      paymentStatus: 'pending'
    });
    await order.save();

    let response = {
      success: true,
      orderId: orderId,
      gateway: gateway
    };

    switch (gateway) {
      case 'stripe':
        response.clientSecret = 'pi_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
        response.publishableKey = cardSettings.publicKey || 'pk_test_xxxxxxxxxx';
        break;
      case 'pesapal':
      case 'flutterwave':
      default:
        response.paymentUrl = `https://${gateway}.com/pay/${orderId}`;
        break;
    }

    res.json(response);

  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Check payment status
app.get('/api/payment/status/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findOne({ orderId: orderId });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({
      status: order.paymentStatus,
      orderId: order.orderId,
      total: order.total,
      currency: order.currency
    });
  } catch (error) {
    console.error('Payment status error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Payment webhook
app.post('/api/webhook/payment', async (req, res) => {
  try {
    const { orderId, paymentId, status, gateway } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'Missing orderId' });
    }

    const order = await Order.findOne({ orderId: orderId });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const paymentStatus = status === 'success' || status === 'completed' ? 'completed' : 'failed';
    order.paymentStatus = paymentStatus;
    if (paymentId) {
      order.gatewayPaymentId = paymentId;
    }

    if (paymentStatus === 'completed') {
      order.status = 'confirmed';
    }

    await order.save();

    console.log(`Payment webhook processed for order ${orderId}: ${paymentStatus}`);

    res.json({ received: true, orderId: orderId, status: paymentStatus });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get order by ID
app.get('/api/order/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findOne({ orderId: orderId });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
      createPayment: '/api/payment/create-intent',
      paymentStatus: '/api/payment/status/:orderId',
      webhook: '/api/webhook/payment',
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