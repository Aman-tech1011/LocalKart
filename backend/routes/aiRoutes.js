const express = require('express');
const { getFairPriceSuggestion } = require('../controllers/aiController');

const router = express.Router();

router.post('/suggest-price', getFairPriceSuggestion);

module.exports = router;
