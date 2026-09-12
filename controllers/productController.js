const Product = require('../models/Product');

// ============================================
// GET /api/products — LIGHTWEIGHT list (shop grid)
// Returns main image only, no views/video → prevents timeouts
// ============================================
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find({ status: 'active' })
      .select('name category price status description features mainImage createdAt updatedAt')
      .lean();

    const light = products.map(p => ({
      _id: p._id,
      id: p._id,
      name: p.name,
      category: p.category,
      price: p.price,
      status: p.status,
      description: p.description,
      features: p.features,
      mainImage: p.mainImage || '',
      views: [],
      video: ''
    }));

    res.json(light);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================
// GET /api/products/all — admin full list (heavy, keep for admin)
// ============================================
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().lean();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================
// GET /api/products/summary/list — minimal (admin panel)
// ============================================
exports.getProductsSummary = async (req, res) => {
  try {
    const products = await Product.find()
      .select('name category price status description features')
      .lean();
    res.json(products);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// ============================================
// GET /api/products/:id — FULL product (admin edit)
// ============================================
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================
// GET /api/products/:id/light — one product, no heavy media
// ============================================
exports.getProductByIdLight = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .select('name category price status description features mainImage createdAt updatedAt')
      .lean();
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ ...product, id: product._id, views: [], video: '' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================
// GET /api/products/:id/images — ONLY media (shop modal)
// ============================================
exports.getProductImages = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .select('mainImage views video')
      .lean();
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const images = [];
    if (product.mainImage) images.push(product.mainImage);
    if (Array.isArray(product.views)) {
      product.views.forEach(v => { if (v) images.push(v); });
    }

    res.json({ images, video: product.video || '' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================
// POST /api/products — create
// ============================================
exports.createProduct = async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// ============================================
// PUT /api/products/:id — update
// ============================================
exports.updateProduct = async (req, res) => {
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
};

// ============================================
// DELETE /api/products/:id — delete
// ============================================
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};