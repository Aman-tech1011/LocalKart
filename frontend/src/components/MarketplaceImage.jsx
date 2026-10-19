import React from 'react';
import { getAssetUrl } from '../api/axios';

const categoryIcons = {
  Mobiles: '📱',
  Laptops: '💻',
  Audio: '🎧',
  Accessories: '⌨️',
  Books: '📚',
  Cycles: '🚲',
  Furniture: '🪑',
  'Study Materials': '🎒',
  Electronics: '📷',
  Others: '🛍️',
};

function makeFallback(category) {
  const icon = categoryIcons[category] || '🛍️';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#edf3ff"/><stop offset="1" stop-color="#f9faff"/></linearGradient></defs><rect width="800" height="600" rx="32" fill="url(#bg)"/><circle cx="400" cy="275" r="132" fill="#fff" opacity=".82"/><text x="400" y="325" text-anchor="middle" font-size="150">${icon}</text><text x="400" y="490" text-anchor="middle" fill="#64748b" font-family="Arial,sans-serif" font-size="30" font-weight="700">${category || 'Campus find'}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export default function MarketplaceImage({ src, alt, category, className }) {
  return (
    <img
      src={getAssetUrl(src) || makeFallback(category)}
      alt={alt}
      className={className}
      onError={(event) => {
        event.currentTarget.onerror = null;
        event.currentTarget.src = makeFallback(category);
      }}
    />
  );
}
