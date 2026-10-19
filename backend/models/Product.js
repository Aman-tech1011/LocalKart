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
      enum: [
        'Mobiles', 'Laptops', 'Audio', 'Accessories', 'Books', 'Cycles',
        'Furniture', 'Study Materials', 'Gadgets', 'Electronics', 'Clothes', 'Others',
      ],
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
    isDemo: {
      type: Boolean,
      default: false,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    purchaseRequestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    purchaseRequestedAt: {
      type: Date,
      default: null,
    },
    purchasedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    college: {
      type: String,
      required: true,
      trim: true,
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
