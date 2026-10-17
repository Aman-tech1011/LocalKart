const axios = require('axios');

const getFairPriceSuggestion = async (req, res) => {
  try {
    const { title, category, condition, price } = req.body || {};

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

    const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        contents: [{
          parts: [{ text: prompt }],
        }],
        generationConfig: { responseMimeType: 'application/json' },
      },
      {
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        timeout: 20000,
      }
    );

    const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    let parsed = null;
    try {
      parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
    } catch (error) {
      parsed = null;
    }

    const suggestedPrice = Number(parsed?.suggestedPrice);
    if (!Number.isFinite(suggestedPrice) || suggestedPrice <= 0) {
      return res.status(200).json({
        suggestedPrice: Number(price) || 0,
        marketRange: `${Number(price) || 0} - ${Number(price) || 0}`,
        reason: 'AI returned an unstructured response; using fallback estimate.',
      });
    }

    res.status(200).json({
      suggestedPrice: Math.round(suggestedPrice),
      marketRange: String(parsed.marketRange || ''),
      reason: String(parsed.reason || 'AI resale price estimate.'),
    });
  } catch (error) {
    console.error('AI price suggestion failed:', error.response?.data?.error?.message || error.message);
    res.status(502).json({
      message: 'AI price suggestion is temporarily unavailable.',
      suggestedPrice: Number(req.body.price) || 0,
    });
  }
};

module.exports = {
  getFairPriceSuggestion,
};
