const express = require('express');
const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getMyProducts,
} = require('../controllers/productController');
const protect = require('../middleware/authMiddleware');
const upload = require('../config/multer');

const router = express.Router();

router.route('/').get(getProducts).post(protect, upload.array('images', 5), createProduct);
router.route('/mine').get(protect, getMyProducts);
router.route('/:id').get(getProductById).put(protect, updateProduct).delete(protect, deleteProduct);

module.exports = router;
