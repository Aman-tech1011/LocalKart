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

const getTitleFallback = (title) => {
  if (/\b(buds|earbuds|earphones|airpods?)\b/i.test(title || '')) {
    return 'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=900&q=85';
  }
  return '';
};

function makeFallback(category) {
  const icon = categoryIcons[category] || '🛍️';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#edf3ff"/><stop offset="1" stop-color="#f9faff"/></linearGradient></defs><rect width="800" height="600" rx="32" fill="url(#bg)"/><circle cx="400" cy="275" r="132" fill="#fff" opacity=".82"/><text x="400" y="325" text-anchor="middle" font-size="150">${icon}</text><text x="400" y="490" text-anchor="middle" fill="#64748b" font-family="Arial,sans-serif" font-size="30" font-weight="700">${category || 'Campus find'}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export default function MarketplaceImage({ src, alt, category, title = '', className }) {
  const imageFallback = getTitleFallback(title);
  const primaryImage = getAssetUrl(src) || imageFallback;

  return (
    <img
      src={primaryImage || makeFallback(category)}
      data-fallback-src={src && imageFallback ? imageFallback : ''}
      alt={alt}
      className={className}
      onError={(event) => {
        const fallbackImage = event.currentTarget.dataset.fallbackSrc;
        if (fallbackImage && event.currentTarget.src !== fallbackImage) {
          event.currentTarget.src = fallbackImage;
          return;
        }

        event.currentTarget.onerror = null;
        event.currentTarget.src = makeFallback(category);
      }}
    />
  );
}
