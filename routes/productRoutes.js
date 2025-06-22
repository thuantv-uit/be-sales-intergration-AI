const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { auth, admin } = require('../middleware/auth');
const { CloudinaryProvider } = require('../config/cloudinary');
const multer = require('multer');

// Cấu hình multer để xử lý upload file
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Tìm kiếm sản phẩm theo tên
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    console.log('Search query:', q);

    if (!q) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const products = await Product.find({ name: { $regex: q, $options: 'i' } });
    console.log('Search results:', products);
    res.json(products);
  } catch (err) {
    console.error('Error in search:', err);
    res.status(500).json({ message: `Server error: ${err.message}` });
  }
});

// Lấy danh sách tất cả sản phẩm
router.get('/', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Lấy thông tin sản phẩm theo ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Thêm sản phẩm mới
router.post('/', auth, admin, upload.single('image'), async (req, res) => {
  try {
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);

    const { name, price, description, stock } = req.body;

    if (!name || !price || !stock) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    let imageUrl = '';
    if (req.file) {
      imageUrl = await CloudinaryProvider.uploadToCloudinary(req.file.buffer, 'ecommerce_products');
      console.log('Generated image URL:', imageUrl);
    } else {
      console.log('No image file uploaded');
    }

    const product = new Product({
      name,
      price: Number(price),
      description,
      image: imageUrl,
      stock: Number(stock),
    });

    const newProduct = await product.save();
    console.log('Saved product:', newProduct);
    res.status(201).json(newProduct);
  } catch (err) {
    console.error('Error in POST /products:', err);
    res.status(400).json({ message: err.message });
  }
});

// Cập nhật thông tin sản phẩm
router.put('/:id', auth, admin, upload.single('image'), async (req, res) => {
  try {
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);

    const { id } = req.params;
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const { name, price, description, stock } = req.body;

    if (req.file) {
      product.image = await CloudinaryProvider.uploadToCloudinary(req.file.buffer, 'ecommerce_products');
      console.log('Updated image URL:', product.image);
    }

    product.name = name || product.name;
    product.price = price ? Number(price) : product.price;
    product.description = description || product.description;
    product.stock = stock ? Number(stock) : product.stock;

    if (!product.name || !product.price || !product.stock) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const updatedProduct = await product.save();
    console.log('Updated product:', updatedProduct);
    res.json(updatedProduct);
  } catch (err) {
    console.error('Error in PUT /products:', err);
    res.status(400).json({ message: err.message });
  }
});

// Xóa sản phẩm
router.delete('/:id', auth, admin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    await Product.findByIdAndDelete(id);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;