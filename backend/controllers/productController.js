const Product = require('../models/Product');
const Message = require('../models/Message');
const { cloudinary, hasCloudinaryConfig } = require('../config/cloudinary');

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const demoTitlePattern = /^LocalKart Demo \d+:/i;
const isDemoProduct = (product) => product.isDemo === true || demoTitlePattern.test(product.title);

const getReplacedDemoIds = async (campusName) => {
  const campusFilter = campusName
    ? { college: new RegExp(`^${escapeRegex(campusName)}$`, 'i') }
    : {};
  const [realCounts, demoProducts] = await Promise.all([
    Product.aggregate([
      {
        $match: {
          ...campusFilter,
          status: 'active',
          isDemo: { $ne: true },
          title: { $not: demoTitlePattern },
        },
      },
      {
        $group: {
          _id: {
            college: { $toLower: '$college' },
            category: '$category',
          },
          count: { $sum: 1 },
        },
      },
    ]),
    Product.find({
      ...campusFilter,
      status: 'active',
      $or: [{ isDemo: true }, { title: demoTitlePattern }],
    }).sort({ college: 1, category: 1, createdAt: 1, _id: 1 }).select('_id college category'),
  ]);

  const realCountsByCampus = new Map();
  const remainingByCampusCategory = new Map();

  for (const { _id, count } of realCounts) {
    const campusKey = _id.college;
    const categoryKey = `${campusKey}|${_id.category}`;
    realCountsByCampus.set(campusKey, (realCountsByCampus.get(campusKey) || 0) + count);
    remainingByCampusCategory.set(categoryKey, count);
  }

  const demoCountsByCampus = new Map();
  for (const product of demoProducts) {
    const campusKey = product.college.toLowerCase();
    demoCountsByCampus.set(campusKey, (demoCountsByCampus.get(campusKey) || 0) + 1);
  }

  const remainingToReplaceByCampus = new Map();
  for (const [campusKey, realCount] of realCountsByCampus) {
    remainingToReplaceByCampus.set(
      campusKey,
      Math.min(realCount, demoCountsByCampus.get(campusKey) || 0)
    );
  }

  const replacedIds = new Set();
  for (const product of demoProducts) {
    const campusKey = product.college.toLowerCase();
    const campusRemaining = remainingToReplaceByCampus.get(campusKey) || 0;
    const categoryKey = `${campusKey}|${product.category}`;
    const categoryRemaining = remainingByCampusCategory.get(categoryKey) || 0;
    if (!campusRemaining || !categoryRemaining) continue;

    replacedIds.add(product._id.toString());
    remainingToReplaceByCampus.set(campusKey, campusRemaining - 1);
    remainingByCampusCategory.set(categoryKey, categoryRemaining - 1);
  }

  for (const product of demoProducts) {
    const campusKey = product.college.toLowerCase();
    const campusRemaining = remainingToReplaceByCampus.get(campusKey) || 0;
    if (!campusRemaining || replacedIds.has(product._id.toString())) continue;

    replacedIds.add(product._id.toString());
    remainingToReplaceByCampus.set(campusKey, campusRemaining - 1);
  }

  return demoProducts
    .filter((product) => replacedIds.has(product._id.toString()))
    .map((product) => product._id);
};

const createProduct = async (req, res) => {
  try {
    const { title, description, category, price, condition, location } = req.body;
    const priceValue = Number(price);

    if (!title?.trim() || !description?.trim() || !category || price === undefined || !Number.isFinite(priceValue) || priceValue < 0) {
      return res.status(400).json({ message: 'Please provide a title, description, category and valid price' });
    }

    const imageUrls = (req.files || []).map((file) => `/uploads/${encodeURIComponent(file.filename)}`);
    if (hasCloudinaryConfig && req.files?.length) {
      for (const [index, file] of req.files.entries()) {
        try {
          const result = await cloudinary.uploader.upload(file.path, { folder: 'localkart/products' });
          imageUrls[index] = result.secure_url;
        } catch (error) {
          console.error('Cloudinary upload failed; retaining the local image:', error.message);
        }
      }
    }

    const product = await Product.create({
      title: title.trim(),
      description: description.trim(),
      category,
      price: priceValue,
      condition: condition || 'Good',
      location: location || '',
      images: imageUrls,
      seller: req.user._id,
      college: process.env.CAMPUS_NAME?.trim() || req.user.college,
    });

    res.status(201).json({
      message: 'Product created successfully',
      product: await product.populate('seller', 'name college'),
    });
  } catch (error) {
    console.error('Product creation failed:', error);
    res.status(error.name === 'ValidationError' ? 400 : 500).json({
      message: error.name === 'ValidationError' ? 'Please check the listing details' : 'Product creation failed',
    });
  }
};

const getProducts = async (req, res) => {
  try {
    const { category, minPrice, maxPrice, search, status } = req.query;
    const filter = { status: status === 'sold' ? 'sold' : 'active' };
    const requestedCampus = typeof req.query.college === 'string' ? req.query.college.trim() : '';
    const campusName = process.env.CAMPUS_NAME?.trim() || requestedCampus;

    if (campusName) filter.college = new RegExp(`^${escapeRegex(campusName)}$`, 'i');

    if (typeof category === 'string' && category !== 'All') {
      filter.category = new RegExp(`^${escapeRegex(category.trim())}$`, 'i');
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice && Number.isFinite(Number(minPrice))) filter.price.$gte = Number(minPrice);
      if (maxPrice && Number.isFinite(Number(maxPrice))) filter.price.$lte = Number(maxPrice);
    }

    if (typeof search === 'string' && search.trim()) {
      const term = new RegExp(escapeRegex(search.trim()), 'i');
      filter.$or = [{ title: term }, { description: term }, { category: term }];
    }

    const replacedDemoIds = await getReplacedDemoIds(campusName);
    if (replacedDemoIds.length) filter._id = { $nin: replacedDemoIds };

    const products = await Product.find(filter)
      .populate('seller', 'name college')
      .sort({ createdAt: -1 });

    res.status(200).json(products);
  } catch (error) {
    console.error('Product fetch failed:', error);
    res.status(500).json({ message: 'Error fetching products' });
  }
};

const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('seller', 'name college');
    const requestedCampus = typeof req.query.college === 'string' ? req.query.college.trim() : '';
    const campusName = process.env.CAMPUS_NAME?.trim() || requestedCampus;

    if (!product || (campusName && (!product.college || product.college.toLowerCase() !== campusName.toLowerCase()))) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (isDemoProduct(product)) {
      const replacedDemoIds = await getReplacedDemoIds(product.college);
      if (replacedDemoIds.some((id) => id.equals(product._id))) {
        return res.status(404).json({ message: 'Product not found' });
      }
    }

    res.status(200).json(product);
  } catch (error) {
    res.status(error.name === 'CastError' ? 400 : 500).json({
      message: error.name === 'CastError' ? 'Invalid product id' : 'Error fetching product',
    });
  }
};

const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this product' });
    }

    const editableFields = ['title', 'description', 'category', 'price', 'condition', 'location', 'status'];
    const updates = Object.fromEntries(
      editableFields
        .filter((field) => req.body[field] !== undefined)
        .map((field) => [field, req.body[field]])
    );
    if (updates.status === 'active') {
      updates.purchasedBy = null;
      updates.purchaseRequestedBy = null;
      updates.purchaseRequestedAt = null;
    }
    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).populate('seller', 'name college');

    res.status(200).json({ message: 'Product updated successfully', product: updatedProduct });
  } catch (error) {
    const clientError = ['ValidationError', 'CastError'].includes(error.name);
    res.status(clientError ? 400 : 500).json({
      message: clientError ? 'Please check the update details' : 'Error updating product',
    });
  }
};

const requestPurchase = async (req, res) => {
  try {
    const listing = await Product.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Product not found' });

    const buyerId = req.user._id.toString();
    const sellerId = listing.seller.toString();
    if (buyerId === sellerId) {
      return res.status(403).json({ message: 'You cannot buy your own listing' });
    }

    const buyerCampus = req.user.college?.trim().toLowerCase();
    const listingCampus = listing.college?.trim().toLowerCase();
    if (!buyerCampus || !listingCampus || buyerCampus !== listingCampus) {
      return res.status(403).json({ message: 'Purchases are limited to your campus marketplace' });
    }

    const conversationExists = await Message.exists({
      product: listing._id,
      $or: [
        { sender: req.user._id, receiver: listing.seller },
        { sender: listing.seller, receiver: req.user._id },
      ],
    });
    if (!conversationExists) {
      return res.status(403).json({ message: 'Message the seller before confirming this purchase' });
    }

    const requestedListing = await Product.findOneAndUpdate(
      { _id: listing._id, status: 'active', purchaseRequestedBy: null },
      { $set: { purchaseRequestedBy: req.user._id, purchaseRequestedAt: new Date() } },
      { new: true }
    );
    if (!requestedListing) return res.status(409).json({ message: 'A purchase request is already pending or this item is no longer available' });

    try {
      await Message.create({
        sender: req.user._id,
        receiver: listing.seller,
        product: listing._id,
        content: 'I have bought this item. Please review and confirm the sale from your listings.',
      });
    } catch (error) {
      await Product.updateOne(
        { _id: requestedListing._id, status: 'active', purchaseRequestedBy: req.user._id },
        { $unset: { purchaseRequestedBy: 1, purchaseRequestedAt: 1 } }
      );
      throw error;
    }

    res.status(200).json({
      message: 'Purchase request sent. The listing will remain available until the seller confirms the sale.',
      product: requestedListing,
    });
  } catch (error) {
    if (error.name === 'CastError') return res.status(400).json({ message: 'Invalid product id' });
    console.error('Purchase request failed:', error);
    res.status(500).json({ message: 'Could not send the purchase request. Please try again.' });
  }
};

const confirmSale = async (req, res) => {
  try {
    const listing = await Product.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Product not found' });
    if (listing.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the seller can confirm this sale' });
    }
    if (listing.status !== 'active' || !listing.purchaseRequestedBy) {
      return res.status(409).json({ message: 'There is no pending purchase request for this listing' });
    }

    const buyerId = listing.purchaseRequestedBy;
    const soldListing = await Product.findOneAndUpdate(
      { _id: listing._id, status: 'active', purchaseRequestedBy: buyerId },
      {
        $set: { status: 'sold', purchasedBy: buyerId },
        $unset: { purchaseRequestedBy: 1, purchaseRequestedAt: 1 },
      },
      { new: true }
    );
    if (!soldListing) return res.status(409).json({ message: 'The pending purchase request has changed. Refresh your listings.' });

    try {
      await Message.create({
        sender: req.user._id,
        receiver: buyerId,
        product: listing._id,
        content: 'The seller confirmed the sale. This item is now marked as sold.',
      });
    } catch (error) {
      await Product.updateOne(
        { _id: soldListing._id, status: 'sold', purchasedBy: buyerId },
        {
          $set: { status: 'active', purchaseRequestedBy: buyerId },
          $unset: { purchasedBy: 1 },
        }
      );
      throw error;
    }

    res.status(200).json({ message: 'Sale confirmed. The listing is now sold.', product: soldListing });
  } catch (error) {
    if (error.name === 'CastError') return res.status(400).json({ message: 'Invalid product id' });
    console.error('Sale confirmation failed:', error);
    res.status(500).json({ message: 'Could not confirm this sale. Please try again.' });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this product' });
    }

    await product.deleteOne();
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(error.name === 'CastError' ? 400 : 500).json({
      message: error.name === 'CastError' ? 'Invalid product id' : 'Error deleting product',
    });
  }
};

const getMyProducts = async (req, res) => {
  try {
    const products = await Product.find({ seller: req.user._id })
      .populate('seller', 'name college')
      .populate('purchaseRequestedBy', 'name')
      .sort({ createdAt: -1 });
    res.status(200).json(products);
  } catch (error) {
    console.error('Seller listings fetch failed:', error);
    res.status(500).json({ message: 'Error fetching your products' });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  requestPurchase,
  confirmSale,
  deleteProduct,
  getMyProducts,
};
