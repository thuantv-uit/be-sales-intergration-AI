const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Cart = require('../models/Cart'); // Thêm import này
const { auth, admin } = require('../middleware/auth');

// Tạo đơn hàng
router.post('/', auth, async (req, res) => {
  try {
    const { customerInfo, items } = req.body;
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Tính tổng tiền từ items được gửi từ frontend
    const total = items.reduce((sum, item) => sum + item.quantity * item.productId.price, 0);

    const order = new Order({
      userId: req.user.id,
      items: items.map(item => ({
        productId: item.productId._id || item.productId, // Đảm bảo đúng định dạng ObjectId
        quantity: item.quantity
      })),
      total,
      customerInfo
    });

    await order.save();

    // Xóa giỏ hàng sau khi tạo đơn hàng
    const userCart = await Cart.findOne({ userId: req.user.id });
    if (userCart) {
      userCart.items = [];
      await userCart.save();
    }

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Lấy danh sách tất cả đơn hàng (chỉ dành cho admin)
router.get('/', auth, admin, async (req, res) => {
  try {
    const orders = await Order.find().populate('userId items.productId');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Lấy danh sách đơn hàng của user
router.get('/my-orders', auth, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id }).populate('items.productId');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Cập nhật trạng thái đơn hàng (chỉ dành cho admin)
router.put('/:id/status', auth, admin, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.status = status;
    await order.save();
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;