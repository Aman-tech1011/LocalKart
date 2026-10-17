const Message = require('../models/Message');

const sendMessage = async (req, res) => {
  try {
    const { receiver, product, content } = req.body;

    if (!receiver || !product || !content) {
      return res.status(400).json({ message: 'Receiver, product and content are required' });
    }

    const message = await Message.create({
      sender: req.user._id,
      receiver,
      product,
      content,
    });

    res.status(201).json({ message: 'Message sent successfully', data: message });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Message sending failed' });
  }
};

const getMessages = async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user._id },
        { receiver: req.user._id },
      ],
    })
      .populate('sender', 'name email')
      .populate('receiver', 'name email')
      .populate('product', 'title price')
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error fetching messages' });
  }
};

module.exports = {
  sendMessage,
  getMessages,
};
