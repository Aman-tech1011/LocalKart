import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';
import { useAuth } from '../context/AuthContext';

export default function BuyPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [maxPrice, setMaxPrice] = useState(50000);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const search = searchParams.get('search')?.trim().toLowerCase() || '';

  useEffect(() => {
    let current = true;
    let fetching = false;

    const loadProducts = async () => {
      if (fetching) return;
      fetching = true;

      try {
        const response = await api.get('/products', {
          params: user?.college && !import.meta.env.VITE_CAMPUS_NAME ? { college: user.college } : undefined,
        });
        if (current) {
          setProducts(response.data || []);
          setError('');
        }
      } catch (requestError) {
        console.error('Failed to load buy listings:', requestError);
        if (current) {
          setError(requestError.response?.data?.message || 'Could not load campus listings. Please try again.');
        }
      } finally {
        fetching = false;
        if (current) setLoading(false);
      }
    };

    loadProducts();
    const interval = window.setInterval(loadProducts, 15000);
    window.addEventListener('focus', loadProducts);

    return () => {
      current = false;
      window.clearInterval(interval);
      window.removeEventListener('focus', loadProducts);
    };
  }, [user?.college]);

  const categories = useMemo(
    () => [...new Set(products.map((product) => product.category).filter(Boolean))].sort(),
    [products]
  );
  const filteredProducts = useMemo(
    () => products.filter((product) => {
      const searchable = `${product.title || ''} ${product.category || ''} ${product.description || ''} ${product.location || ''}`.toLowerCase();
      return (!selectedCategory || product.category === selectedCategory)
        && (!search || searchable.includes(search))
        && Number(product.price) <= maxPrice;
    }),
    [products, selectedCategory, search, maxPrice]
  );
  const highestPrice = Math.max(50000, ...products.map((product) => Number(product.price) || 0));

  return (
    <section className="buy-page">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Buy from students near you</p>
          <h1>Campus marketplace</h1>
        </div>
        <span className="listing-count">{filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'}</span>
      </div>

      {categories.length > 0 && (
        <div className="buy-filter-row">
          <div className="category-pills" aria-label="Filter by category">
            <button className={`pill${selectedCategory ? '' : ' active'}`} type="button" onClick={() => setSelectedCategory('')}>All</button>
            {categories.map((category) => (
              <button
                className={`pill${selectedCategory === category ? ' active' : ''}`}
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
          <label className="price-filter" htmlFor="buy-price-range">
            <span>Max price: ₹{maxPrice.toLocaleString('en-IN')}</span>
            <input
              id="buy-price-range"
              type="range"
              min="500"
              max={highestPrice}
              step="500"
              value={Math.min(maxPrice, highestPrice)}
              onChange={(event) => setMaxPrice(Number(event.target.value))}
            />
          </label>
        </div>
      )}

      <div className="product-grid buy-product-grid">
        {loading ? (
          <div className="empty-state">Loading campus products...</div>
        ) : error ? (
          <div className="empty-state">{error}</div>
        ) : filteredProducts.length ? (
          filteredProducts.map((product) => (
            <ProductCard key={product._id || product.id} product={product} />
          ))
        ) : (
          <div className="empty-state">
            <h2>{products.length ? 'No products match these filters' : 'No products listed yet'}</h2>
            <p>{products.length ? 'Try another search or clear the filters.' : 'Student listings will appear here as soon as they are posted.'}</p>
            {products.length > 0 && (selectedCategory || search || maxPrice < highestPrice) && (
              <button
                className="btn btn-light"
                type="button"
                onClick={() => {
                  setSelectedCategory('');
                  setMaxPrice(highestPrice);
                  setSearchParams({});
                }}
              >
                Clear filters
              </button>
            )}
            {!products.length && (
              <Link className="btn btn-primary" to={user ? '/sell' : '/login?next=%2Fsell'}>Sell the first item</Link>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
