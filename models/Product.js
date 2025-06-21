const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String },
  image: { type: String }, // Chỉ lưu URL, không lưu nhị phân
  stock: { type: Number, required: true, default: 0 }
});

module.exports = mongoose.model('Product', productSchema);