import React, { useRef, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function SellPage() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    category: 'Books',
    price: '',
    condition: 'Good',
    description: '',
    location: '',
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [isSuggestingPrice, setIsSuggestingPrice] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSuggestPrice = async () => {
    if (!formData.title.trim()) {
      setMessage('Enter an item name before asking AI for a price.');
      return;
    }

    setIsSuggestingPrice(true);
    setMessage('');
    try {
      const response = await api.post('/ai/suggest-price', {
        title: formData.title,
        category: formData.category,
        condition: formData.condition,
        price: formData.price,
      });
      const suggestedPrice = Number(response.data?.suggestedPrice);
      if (!Number.isFinite(suggestedPrice) || suggestedPrice <= 0) {
        setMessage('AI could not suggest a price. Please enter one manually.');
        return;
      }

      setFormData((current) => ({ ...current, price: String(Math.round(suggestedPrice)) }));
      const range = response.data.marketRange ? ` Typical range: ${response.data.marketRange}.` : '';
      setMessage(`AI suggested ₹${Math.round(suggestedPrice)}.${range} ${response.data.reason || ''}`.trim());
    } catch (error) {
      setMessage(error.response?.data?.message || 'AI price suggestion failed. Please try again.');
    } finally {
      setIsSuggestingPrice(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submittingRef.current) return;

    if (!user) {
      setMessage('Please login before selling an item.');
      return;
    }

    const form = new FormData();
    Object.entries(formData).forEach(([key, value]) => form.append(key, value));

    for (let i = 0; i < selectedFiles.length; i++) {
      form.append('images', selectedFiles[i]);
    }

    submittingRef.current = true;
    setIsSubmitting(true);

    try {
      const response = await api.post('/products', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setMessage(response.data.message || 'Product listed successfully!');
      setFormData({
        title: '',
        category: 'Books',
        price: '',
        condition: 'Good',
        description: '',
        location: '',
      });
      setSelectedFiles([]);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to create listing');
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card wide-card">
        <h2>Sell your item</h2>
        <p>List your item for the campus community.</p>

        <form className="auth-form sell-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label>
              Item Name
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Mechanical Engineering Book"
              />
            </label>

            <label>
              Category
              <select name="category" value={formData.category} onChange={handleChange}>
                <option>Books</option>
                <option>Cycles</option>
                <option>Gadgets</option>
                <option>Electronics</option>
                <option>Clothes</option>
                <option>Study Materials</option>
                <option>Others</option>
              </select>
            </label>

            <label>
              Price (₹)
              <div className="price-input-row">
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="1500"
                />
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={handleSuggestPrice}
                  disabled={isSuggestingPrice}
                >
                  {isSuggestingPrice ? 'Suggesting…' : 'Suggest price'}
                </button>
              </div>
            </label>

            <label>
              Condition
              <select name="condition" value={formData.condition} onChange={handleChange}>
                <option>Like New</option>
                <option>Excellent</option>
                <option>Good</option>
                <option>Average</option>
              </select>
            </label>
          </div>

          <label>
            Description
            <textarea
              rows="4"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the item, usage, and why it is valuable."
            />
          </label>

          <label>
            Campus Location
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Main Gate, Hostel A, Library Road"
            />
          </label>

          <label>
            Upload Image
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => setSelectedFiles(Array.from(e.target.files))}
            />
          </label>

          {message && <p className="form-message">{message}</p>}

          <button type="submit" className="btn btn-primary wide-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Publishing…' : 'Publish Listing'}
          </button>
        </form>
      </div>
    </div>
  );
}
