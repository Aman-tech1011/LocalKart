const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password, college, phone } = req.body || {};
    const cleanName = typeof name === 'string' ? name.trim() : '';
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (!cleanName || !cleanEmail || typeof password !== 'string' || !password) {
      return res.status(400).json({
        message: 'Please provide name, email and password',
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters long',
      });
    }

    const userExists = await User.findOne({ email: cleanEmail });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name: cleanName,
      email: cleanEmail,
      password: hashedPassword,
      college,
      phone,
      role: 'student',
    });

    res.status(201).json({
      message: 'User registered successfully',
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        college: user.college,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'User already exists' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Please check the registration details' });
    }
    console.error('Registration failed:', error);
    res.status(500).json({ message: 'Registration failed. Please try again.' });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (!cleanEmail || typeof password !== 'string' || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.status(200).json({
      message: 'Login successful',
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        college: user.college,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login failed:', error);
    res.status(500).json({ message: 'Login failed. Please try again.' });
  }
};

module.exports = {
  registerUser,
  loginUser,
};
