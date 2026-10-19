const Message = require('../models/Message');
const Product = require('../models/Product');
const mongoose = require('mongoose');

const sendMessage = async (req, res) => {
  try {
    const { receiver, product, content } = req.body;

    if (!mongoose.isValidObjectId(receiver) || !mongoose.isValidObjectId(product) || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ message: 'Receiver, product and a message are required' });
    }

    if (content.trim().length > 2000) {
      return res.status(400).json({ message: 'Messages must be 2,000 characters or fewer' });
    }

    const listing = await Product.findById(product);
    if (!listing) return res.status(404).json({ message: 'Product not found' });

    const senderId = req.user._id.toString();
    const sellerId = listing.seller.toString();
    if (senderId === receiver) {
      return res.status(400).json({ message: 'You cannot message yourself' });
    }

    const userCampus = req.user.college?.trim().toLowerCase();
    const listingCampus = listing.college?.trim().toLowerCase();
    const sameCampus = !process.env.CAMPUS_NAME ||
      listingCampus === process.env.CAMPUS_NAME.trim().toLowerCase();
    if (!userCampus || !listingCampus || !sameCampus || listingCampus !== userCampus) {
      return res.status(403).json({ message: 'Messaging is limited to your campus marketplace' });
    }

    if (senderId === sellerId) {
      const existingConversation = await Message.exists({
        product,
        $or: [
          { sender: req.user._id, receiver },
          { sender: receiver, receiver: req.user._id },
        ],
      });
      if (!existingConversation) {
        return res.status(403).json({ message: 'Only reply to a student who has contacted you about this listing' });
      }
    } else if (receiver !== sellerId || listing.status !== 'active') {
      return res.status(400).json({ message: 'This listing is not available for new inquiries' });
    }

    const messageRecord = await Message.create({
      sender: req.user._id,
      receiver,
      product,
      content: content.trim(),
    });

    const populatedMessage = await messageRecord.populate([
      { path: 'sender', select: 'name' },
      { path: 'receiver', select: 'name' },
      { path: 'product', select: 'title price images status' },
    ]);

    res.status(201).json({ message: 'Message sent successfully', data: populatedMessage });
  } catch (error) {
    if (error.name === 'CastError') return res.status(400).json({ message: 'Invalid product or user id' });
    console.error('Message sending failed:', error);
    res.status(500).json({ message: 'Message sending failed' });
  }
};

const getMessages = async (req, res) => {
  try {
    const filter = {
      $or: [
        { sender: req.user._id },
        { receiver: req.user._id },
      ],
    };
    if (req.query.product && !mongoose.isValidObjectId(req.query.product)) {
      return res.status(400).json({ message: 'Invalid product id' });
    }
    if (req.query.with && !mongoose.isValidObjectId(req.query.with)) {
      return res.status(400).json({ message: 'Invalid conversation participant' });
    }
    if (req.query.product) filter.product = req.query.product;
    if (req.query.with) {
      filter.$and = [{
        $or: [
          { sender: req.user._id, receiver: req.query.with },
          { sender: req.query.with, receiver: req.user._id },
        ],
      }];
    }

    const messages = await Message.find(filter)
      .populate('sender', 'name')
      .populate('receiver', 'name')
      .populate('product', 'title price images status seller')
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    res.status(error.name === 'CastError' ? 400 : 500).json({
      message: error.name === 'CastError' ? 'Invalid product id' : 'Error fetching messages',
    });
  }
};

module.exports = {
  sendMessage,
  getMessages,
};
