const express = require('express');
const { createReview, getReviewsByUser } = require('../controllers/reviewController');
const protect = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, createReview);
router.get('/user/:userId', getReviewsByUser);

module.exports = router;
