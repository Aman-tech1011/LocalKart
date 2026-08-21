const axios = require('axios');

const getFairPriceSuggestion = async (req, res) => {
  try {
    const { title, category, condition, price } = req.body;

    if (!title || !category) {
      return res.status(400).json({ message: 'Title and category are required' });
    }

    const prompt = `
      Suggest a fair resale price in INR for a student marketplace item.
      Item: ${title}
      Category: ${category}
      Condition: ${condition || 'Good'}
      Current price hint: ${price || 0}
      Return only a JSON object with fields: suggestedPrice, marketRange, reason.
    `;

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(200).json({
        suggestedPrice: Number(price) || 0,
        marketRange: `${Number(price) || 0} - ${Number(price) || 0}`,
        reason: 'AI key not configured; using provided estimate as fallback.',
      });
    }

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        contents: [{
          parts: [{ text: prompt }],
        }],
      },
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    let parsed = null;
    try {
      parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
    } catch (error) {
      parsed = null;
    }

    if (!parsed) {
      return res.status(200).json({
        suggestedPrice: Number(price) || 0,
        marketRange: `${Number(price) || 0} - ${Number(price) || 0}`,
        reason: 'AI returned an unstructured response; using fallback estimate.',
      });
    }

    res.status(200).json(parsed);
  } catch (error) {
    res.status(500).json({
      message: error.message || 'AI price suggestion failed',
      suggestedPrice: Number(req.body.price) || 0,
    });
  }
};

module.exports = {
  getFairPriceSuggestion,
};
