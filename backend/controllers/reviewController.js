const Review = require('../models/Review');
const Product = require('../models/Product');

const createReview = async (req, res) => {
  try {
    const { reviewedUser, product, rating, comment } = req.body;

    if (!reviewedUser || !product || !rating) {
      return res.status(400).json({ message: 'Reviewed user, product and rating are required' });
    }

    const review = await Review.create({
      reviewer: req.user._id,
      reviewedUser,
      product,
      rating,
      comment,
    });

    const productExists = await Product.findById(product);

    if (!productExists) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const reviews = await Review.find({ reviewedUser });
    const averageScore = reviews.reduce((sum, item) => sum + item.rating, 0) / reviews.length;

    res.status(201).json({
      message: 'Review added successfully',
      review,
      averageRating: averageScore,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error creating review' });
  }
};

const getReviewsByUser = async (req, res) => {
  try {
    const reviews = await Review.find({ reviewedUser: req.params.userId })
      .populate('reviewer', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error fetching reviews' });
  }
};

module.exports = {
  createReview,
  getReviewsByUser,
};
