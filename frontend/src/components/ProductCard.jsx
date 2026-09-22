import React from 'react';
import { Link } from 'react-router-dom';

export default function ProductCard({ product }) {
  const imageUrl = product.images?.[0] || product.image || 'https://placehold.co/600x400?text=LocalKart';
  const sellerName = typeof product.seller === 'object' ? product.seller.name : 'LocalKart seller';

  return (
    <Link to={`/product/${product._id || product.id}`} className="product-card">
      <img src={imageUrl} alt={product.title} className="product-image" />

      <div className="product-content">
        <div className="product-topline">
          <span className="product-category">{product.category}</span>
          <span className="product-condition">{product.condition}</span>
        </div>

        <h3>{product.title}</h3>
        <p className="product-location">📍 {product.location || 'Campus area'}</p>
        <p className="product-description">{product.description}</p>

        <div className="product-footer">
          <div>
            <span className="price-label">Price</span>
            <strong>₹{Number(product.price || 0).toLocaleString('en-IN')}</strong>
          </div>
          <span className="seller-name">by {sellerName}</span>
        </div>
      </div>
    </Link>
  );
}
