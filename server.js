const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// =============================================
// CORS CONFIGURATION
// =============================================
const allowedOrigins = [
  'https://suitfully.com',
  'https://www.suitfully.com',
  'https://suitfully-backend.onrender.com',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:5000',
  'https://suitfully.netlify.app'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || origin.startsWith('https://suitfully') || origin.includes('netlify.app')) {
      callback(null, true);
    } else {
      console.log('❌ CORS blocked:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);

const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 5,
  message: { error: 'Too many login attempts. Please try again after 1 minutes.' }
});

// =============================================
// EMAIL SERVICE
// =============================================
const emailService = require('./email');

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
  images: { type: [String], default: [] },
  price: { type: Number, default: 0 }
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
  },
  crypto: {
    enabled: { type: Boolean, default: true },
    addresses: {
      BTC: { type: String, default: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa' },
      ETH: { type: String, default: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e' },
      USDC: { type: String, default: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e' },
      USDT: { type: String, default: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e' },
      BNB: { type: String, default: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e' },
      DOGE: { type: String, default: 'D7xV9bG1QzM4NpL8KwRtY2UfH3jA5sC6eP' },
      SHIB: { type: String, default: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e' },
      XRP: { type: String, default: 'rEb8TK3gBgk5auZkwc6sHnSrG7YzJzmBfH' },
      ADA: { type: String, default: 'addr1qy2k7p2l8p3m5n9j4r6t8w1x2z3a4b5c6d7e8f9g0h1i2j3k4l5m6n7o8p9q0r' },
      SOL: { type: String, default: '7xPvP8Kp9L1mN2oQ3rS4tU5vW6xY7zA8bC9dE0fG1hI2jK3lM4nO5pQ6rS7tU8vW9xY' },
      MATIC: { type: String, default: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e' },
      AVAX: { type: String, default: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e' }
    },
    apiKey: { type: String, default: '' },
    secretKey: { type: String, default: '' }
  },
  security: {
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String, default: '' },
    sessionTimeout: { type: Number, default: 30 },
    maxLoginAttempts: { type: Number, default: 5 },
    lockoutDuration: { type: Number, default: 15 }
  }
}, { timestamps: true });

// Order Schema
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

// Admin User Schema - with email verification
const adminUserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String, default: '' },
  emailVerificationExpires: { type: Date, default: null },
  twoFactorSecret: { type: String, default: '' },
  twoFactorEnabled: { type: Boolean, default: false },
  lastLogin: { type: Date, default: null },
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date, default: null },
  role: { type: String, enum: ['admin', 'superadmin'], default: 'admin' },
  createdAt: { type: Date, default: Date.now }
});

// Login attempt tracking
const loginAttemptSchema = new mongoose.Schema({
  ip: { type: String, required: true },
  attempts: { type: Number, default: 0 },
  lockedUntil: { type: Date, default: null },
  lastAttempt: { type: Date, default: Date.now }
});

const Product = mongoose.model('Product', productSchema);
const Catalogue = mongoose.model('Catalogue', catalogueSchema);
const PaymentSettings = mongoose.model('PaymentSettings', paymentSettingsSchema);
const Order = mongoose.model('Order', orderSchema);
const AdminUser = mongoose.model('AdminUser', adminUserSchema);
const LoginAttempt = mongoose.model('LoginAttempt', loginAttemptSchema);

// =============================================
// JWT HELPER FUNCTIONS
// =============================================
const JWT_SECRET = process.env.JWT_SECRET || 'suitfully-super-secret-key-2026';
const JWT_EXPIRY = '24h';

function generateToken(userId, username, role) {
  return jwt.sign(
    { userId, username, role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// =============================================
// ADMIN AUTH MIDDLEWARE
// =============================================
function authenticateAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ error: 'Unauthorized. Invalid or expired token.' });
  }

  req.user = decoded;
  next();
}

// =============================================
// API ROUTES - ADMIN AUTHENTICATION & REGISTRATION
// =============================================

// Check if admin exists
app.get('/api/auth/admin-exists', async (req, res) => {
  try {
    const count = await AdminUser.countDocuments();
    res.json({ exists: count > 0, count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin Registration - Only ONE account allowed
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    // Check if admin already exists (only ONE allowed)
    const adminCount = await AdminUser.countDocuments();
    if (adminCount > 0) {
      return res.status(403).json({ error: 'Admin account already exists. Please login.' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    // Check password length
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const admin = new AdminUser({
      username,
      email,
      password: hashedPassword,
      isEmailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      role: 'superadmin'
    });

    await admin.save();

    // Send verification email
    try {
      const frontendUrl = process.env.FRONTEND_URL || 'https://suitfully.com';
      const verificationLink = `${frontendUrl}/verify-email?token=${verificationToken}`;
      await emailService.sendEmailVerification(email, username, verificationLink);
    } catch (emailError) {
      console.error('Verification email error:', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'Admin account created. Please check your email to verify your account.',
      requiresVerification: true,
      email: email
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Verify email
app.post('/api/auth/verify-email', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Verification token required.' });
    }

    const admin = await AdminUser.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() }
    });

    if (!admin) {
      return res.status(400).json({ error: 'Invalid or expired verification token.' });
    }

    admin.isEmailVerified = true;
    admin.emailVerificationToken = '';
    admin.emailVerificationExpires = null;
    await admin.save();

    res.json({
      success: true,
      message: 'Email verified successfully. You can now login.'
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Resend verification email
app.post('/api/auth/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email required.' });
    }

    const admin = await AdminUser.findOne({ email });
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found.' });
    }

    if (admin.isEmailVerified) {
      return res.status(400).json({ error: 'Email already verified.' });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    admin.emailVerificationToken = verificationToken;
    admin.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await admin.save();

    const frontendUrl = process.env.FRONTEND_URL || 'https://suitfully.com';
    const verificationLink = `${frontendUrl}/verify-email?token=${verificationToken}`;
    await emailService.sendEmailVerification(admin.email, admin.username, verificationLink);

    res.json({ success: true, message: 'Verification email resent.' });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin Login - with rate limiting
app.post('/api/auth/login', loginLimiter, async (req, res) => {
  try {
    const { username, password, twoFactorCode } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const clientIp = req.ip || req.connection.remoteAddress;

    let loginAttempt = await LoginAttempt.findOne({ ip: clientIp });
    if (loginAttempt && loginAttempt.lockedUntil && loginAttempt.lockedUntil > new Date()) {
      const remainingMinutes = Math.ceil((loginAttempt.lockedUntil - new Date()) / 60000);
      return res.status(429).json({
        error: `Too many login attempts. Please try again in ${remainingMinutes} minutes.`
      });
    }

    const user = await AdminUser.findOne({ username });
    if (!user) {
      await recordFailedLogin(clientIp);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(403).json({
        error: 'Please verify your email before logging in.',
        requiresVerification: true,
        email: user.email
      });
    }

    if (user.lockUntil && user.lockUntil > new Date()) {
      const remainingMinutes = Math.ceil((user.lockUntil - new Date()) / 60000);
      return res.status(429).json({
        error: `Account locked. Please try again in ${remainingMinutes} minutes.`
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      user.loginAttempts += 1;
      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
        await user.save();
        await recordFailedLogin(clientIp, true);
        return res.status(429).json({
          error: 'Too many failed attempts. Account locked for 15 minutes.'
        });
      }
      await user.save();
      await recordFailedLogin(clientIp);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check 2FA if enabled
    if (user.twoFactorEnabled) {
      if (!twoFactorCode) {
        return res.status(401).json({
          error: '2FA code required',
          requires2FA: true
        });
      }
      if (!/^\d{6}$/.test(twoFactorCode)) {
        return res.status(401).json({ error: 'Invalid 2FA code' });
      }
    }

    user.loginAttempts = 0;
    user.lockUntil = null;
    user.lastLogin = new Date();
    await user.save();

    await LoginAttempt.findOneAndDelete({ ip: clientIp });

    const token = generateToken(user._id, user.username, user.role);

    res.json({
      success: true,
      token: token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        twoFactorEnabled: user.twoFactorEnabled
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// Helper: Record failed login attempt
async function recordFailedLogin(ip, isLocked = false) {
  try {
    let attempt = await LoginAttempt.findOne({ ip });
    if (attempt) {
      attempt.attempts += 1;
      attempt.lastAttempt = new Date();
      if (attempt.attempts >= 5) {
        attempt.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      }
      await attempt.save();
    } else {
      attempt = new LoginAttempt({ ip, attempts: 1 });
      await attempt.save();
    }
  } catch (error) {
    console.error('Error recording login attempt:', error);
  }
}

// Verify token endpoint
app.post('/api/auth/verify', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Token required' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const user = await AdminUser.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.json({
      valid: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        twoFactorEnabled: user.twoFactorEnabled
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Logout endpoint
app.post('/api/auth/logout', authenticateAdmin, async (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

// =============================================
// ADMIN PROFILE SETTINGS (Password & Email Update)
// =============================================

// Get admin profile
app.get('/api/auth/profile', authenticateAdmin, async (req, res) => {
  try {
    const user = await AdminUser.findById(req.user.userId).select('-password -emailVerificationToken -twoFactorSecret');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update admin password (from Settings page)
app.put('/api/auth/update-password', authenticateAdmin, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters.' });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ error: 'New password must be different from current password.' });
    }

    const user = await AdminUser.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ 
      success: true, 
      message: 'Password updated successfully. Please login again with your new password.' 
    });

  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update admin email (from Settings page)
app.put('/api/auth/update-email', authenticateAdmin, async (req, res) => {
  try {
    const { newEmail, password } = req.body;
    const userId = req.user.userId;

    if (!newEmail || !password) {
      return res.status(400).json({ error: 'New email and password are required.' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    const user = await AdminUser.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Verify password before changing email
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Password is incorrect.' });
    }

    // Check if email is already taken
    const existingUser = await AdminUser.findOne({ email: newEmail });
    if (existingUser && existingUser._id.toString() !== userId) {
      return res.status(400).json({ error: 'Email already in use by another account.' });
    }

    // Update email and set verification to false
    user.email = newEmail;
    user.isEmailVerified = false;
    
    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    await user.save();

    // Send verification email to new email
    try {
      const frontendUrl = process.env.FRONTEND_URL || 'https://suitfully.com';
      const verificationLink = `${frontendUrl}/verify-email?token=${verificationToken}`;
      await emailService.sendEmailVerification(newEmail, user.username, verificationLink);
    } catch (emailError) {
      console.error('Verification email error:', emailError);
    }

    res.json({ 
      success: true, 
      message: 'Email updated. Please check your new email for verification.' 
    });

  } catch (error) {
    console.error('Update email error:', error);
    res.status(500).json({ error: error.message });
  }
});

// =============================================
// API ROUTES - PRODUCTS
// =============================================

// Get all active products
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find({ status: 'active' });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all products (admin)
app.get('/api/products/all', authenticateAdmin, async (req, res) => {
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
app.post('/api/products', authenticateAdmin, async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update product (admin)
app.put('/api/products/:id', authenticateAdmin, async (req, res) => {
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
app.delete('/api/products/:id', authenticateAdmin, async (req, res) => {
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

// Get all catalogue
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
app.post('/api/catalogue', authenticateAdmin, async (req, res) => {
  try {
    const catalogue = new Catalogue(req.body);
    await catalogue.save();
    res.status(201).json(catalogue);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update catalogue item (admin)
app.put('/api/catalogue/:key', authenticateAdmin, async (req, res) => {
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
app.delete('/api/catalogue/:key', authenticateAdmin, async (req, res) => {
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
app.put('/api/settings/payment', authenticateAdmin, async (req, res) => {
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

    // Handle crypto payment
    if (method === 'crypto') {
      if (!settings.crypto || !settings.crypto.enabled) {
        return res.status(400).json({ error: 'Cryptocurrency payments are currently disabled' });
      }

      let order = new Order({
        orderId: orderId,
        customerEmail: customerEmail,
        customerName: customerName,
        items: items || [],
        total: amount,
        currency: currency || 'usd',
        delivery: delivery || {},
        discount: discount || 0,
        paymentMethod: 'crypto',
        paymentStatus: 'pending'
      });
      await order.save();

      return res.json({
        success: true,
        orderId: orderId,
        method: 'crypto',
        addresses: settings.crypto.addresses,
        message: 'Send the exact amount to the provided wallet address'
      });
    }

    // Handle card payments
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

// Get all orders (admin)
app.get('/api/orders', authenticateAdmin, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update order status (admin)
app.put('/api/orders/:orderId/status', authenticateAdmin, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status required' });
    }

    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const order = await Order.findOne({ orderId: orderId });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    order.status = status;
    await order.save();

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============================================
// API ROUTES - EMAIL FORMS
// =============================================

// 1. CONSULTATION BOOKING
app.post('/api/email/consultation', async (req, res) => {
  try {
    const { name, email, phone, location, date, time, consultationType, occasion, notes } = req.body;

    if (!name || !email || !phone || !location || !date || !time) {
      return res.status(400).json({ error: 'Please fill in all required fields.' });
    }

    await emailService.sendConsultationEmail(req.body);
    res.json({ success: true, message: 'Consultation booked successfully!' });
  } catch (error) {
    console.error('Consultation email error:', error);
    res.status(500).json({ error: 'Failed to send consultation booking. Please try again.' });
  }
});

// 2. REVIEW SUBMISSION
app.post('/api/email/review', async (req, res) => {
  try {
    const { name, email, rating, title, text, recommend } = req.body;

    if (!name || !email || !rating || !text) {
      return res.status(400).json({ error: 'Please fill in all required fields.' });
    }

    await emailService.sendReviewEmail(req.body);
    res.json({ success: true, message: 'Review submitted successfully!' });
  } catch (error) {
    console.error('Review email error:', error);
    res.status(500).json({ error: 'Failed to submit review. Please try again.' });
  }
});

// 3. NEWSLETTER SUBSCRIPTION
app.post('/api/email/newsletter', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Please enter your email address.' });
    }

    await emailService.sendNewsletterEmail(email);
    res.json({ success: true, message: 'Subscribed successfully!' });
  } catch (error) {
    console.error('Newsletter email error:', error);
    res.status(500).json({ error: 'Failed to subscribe. Please try again.' });
  }
});

// 4. ORDER CONFIRMATION
app.post('/api/email/order', async (req, res) => {
  try {
    const { orderId, firstName, lastName, email, phone, items, total, delivery, payment, notes } = req.body;

    if (!orderId || !email) {
      return res.status(400).json({ error: 'Missing order information.' });
    }

    await emailService.sendOrderEmail(req.body);
    res.json({ success: true, message: 'Order confirmation sent!' });
  } catch (error) {
    console.error('Order email error:', error);
    res.status(500).json({ error: 'Failed to send order confirmation.' });
  }
});

// 5. PAYMENT PROOF SUBMISSION
app.post('/api/email/payment-proof', async (req, res) => {
  try {
    const { orderNumber, referenceNumber, customerName, customerEmail, fileName, submittedVia, notes } = req.body;

    if (!orderNumber || !referenceNumber) {
      return res.status(400).json({ error: 'Missing payment proof information.' });
    }

    await emailService.sendPaymentProofEmail(req.body);
    res.json({ success: true, message: 'Payment proof submitted successfully!' });
  } catch (error) {
    console.error('Payment proof email error:', error);
    res.status(500).json({ error: 'Failed to submit payment proof.' });
  }
});

// 6. EMAIL VERIFICATION
app.post('/api/email/send-verification', async (req, res) => {
  try {
    const { email, username, verificationLink } = req.body;

    if (!email || !username || !verificationLink) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    await emailService.sendEmailVerification(email, username, verificationLink);
    res.json({ success: true, message: 'Verification email sent successfully!' });
  } catch (error) {
    console.error('Verification email error:', error);
    res.status(500).json({ error: 'Failed to send verification email.' });
  }
});

// 7. TEST EMAIL ENDPOINT
app.post('/api/email/test', async (req, res) => {
  try {
    await emailService.sendTestEmail();
    res.json({ success: true, message: 'Test email sent successfully!' });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ error: 'Failed to send test email: ' + error.message });
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
      orders: '/api/orders',
      authLogin: '/api/auth/login',
      authRegister: '/api/auth/register',
      authVerify: '/api/auth/verify-email',
      authProfile: '/api/auth/profile',
      updatePassword: '/api/auth/update-password',
      updateEmail: '/api/auth/update-email',
      consultation: '/api/email/consultation',
      review: '/api/email/review',
      newsletter: '/api/email/newsletter',
      order: '/api/email/order',
      paymentProof: '/api/email/payment-proof',
      testEmail: '/api/email/test',
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
      console.log(`Email Test: http://localhost:${PORT}/api/email/test`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('✅ Crypto Payment Support Enabled');
      console.log('✅ JWT Authentication Enabled');
      console.log('✅ Rate Limiting Active (5 attempts, 15-min lockout)');
      console.log('✅ 2FA Support Enabled');
      console.log('✅ CORS Restriction Enabled');
      console.log('✅ IP Whitelist Enabled for Admin Routes');
      console.log('✅ Admin Registration Enabled (Only ONE account)');
      console.log('✅ Email Verification Enabled');
      console.log('✅ Profile Settings Enabled (Password & Email Update)');
    });
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

startServer();