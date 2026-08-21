const express = require('express');
const { sendMessage, getMessages } = require('../controllers/messageController');
const protect = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, sendMessage);
router.get('/', protect, getMessages);

module.exports = router;
