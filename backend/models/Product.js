const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['Books', 'Cycles', 'Gadgets', 'Electronics', 'Clothes', 'Study Materials', 'Others'],
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    condition: {
      type: String,
      enum: ['Like New', 'Excellent', 'Good', 'Average'],
      default: 'Good',
    },
    images: [{
      type: String,
      default: [],
    }],
    status: {
      type: String,
      enum: ['active', 'sold'],
      default: 'active',
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    location: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Product', productSchema);
