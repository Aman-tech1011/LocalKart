import React from 'react';
import { Link } from 'react-router-dom';
import MarketplaceImage from './MarketplaceImage';

export default function ProductCard({ product }) {
  const imageUrl = product.images?.[0] || product.image;
  const sellerName = typeof product.seller === 'object' ? product.seller.name : 'LocalKart seller';

  return (
    <article className="product-card">
      <Link to={`/product/${product._id || product.id}`} aria-label={`View ${product.title}`}>
        <MarketplaceImage src={imageUrl} alt={product.title} category={product.category} className="product-image" />
      </Link>

      <div className="product-content">
        <div className="product-topline">
          <span className="product-category">{product.category}</span>
          <span className="product-condition">{product.condition}</span>
        </div>

        <h3><Link to={`/product/${product._id || product.id}`}>{product.title}</Link></h3>
        <p className="product-location">📍 {product.location || 'Campus area'}</p>
        <p className="product-description product-description-preview">{product.description}</p>

        <div className="product-footer">
          <div>
            <span className="price-label">Price</span>
            <strong>₹{Number(product.price || 0).toLocaleString('en-IN')}</strong>
          </div>
          <span className="seller-name">by {sellerName}</span>
        </div>
        <Link className="product-buy-link" to={`/product/${product._id || product.id}`}>
          Message {sellerName} <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}
