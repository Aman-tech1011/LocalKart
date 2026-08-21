import React, { useEffect, useMemo, useState } from 'react';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';

const categories = ['All', 'Books', 'Cycles', 'Gadgets', 'Electronics', 'Clothes', 'Study Materials', 'Others'];

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [maxPrice, setMaxPrice] = useState(50000);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get('/products');
        setProducts(res.data || []);
      } catch (error) {
        console.error('Failed to load products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === 'All' || product.category === selectedCategory;
      const matchesSearch = product.title
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesPrice = Number(product.price) <= maxPrice;

      return matchesCategory && matchesSearch && matchesPrice;
    });
  }, [selectedCategory, search, maxPrice, products]);

  const featuredProducts = products.filter((product) => product.status === 'active').slice(0, 3);

  return (
    <div>
      <section className="hero-section">
        <div className="hero-copy">
          <p className="eyebrow">Campus marketplace for students</p>
          <h1>Buy and sell student essentials nearby.</h1>
          <p>
            LocalKart helps college students discover affordable books, cycles,
            gadgets, clothes, and more in their campus community.
          </p>

          <div className="search-box">
            <input
              type="text"
              placeholder="Search for books, gadgets, cycles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="btn btn-primary">Search</button>
          </div>
        </div>

        <div className="hero-card">
          <div className="mini-stat">
            <strong>{products.length}+</strong>
            <span>Student listings</span>
          </div>
          <div className="mini-stat">
            <strong>4.8/5</strong>
            <span>Average rating</span>
          </div>
          <div className="mini-stat">
            <strong>200+</strong>
            <span>Campus sellers</span>
          </div>
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <h2>Featured picks</h2>
        </div>

        <div className="featured-grid">
          {loading ? (
            <div className="empty-state">Loading products...</div>
          ) : (
            featuredProducts.map((product) => (
              <ProductCard key={product._id || product.id} product={product} />
            ))
          )}
        </div>
      </section>

      <section className="filter-section section-block">
        <div className="section-heading">
          <h2>Browse marketplace</h2>
        </div>

        <div className="filter-row">
          <div className="category-pills">
            {categories.map((category) => (
              <button
                key={category}
                className={selectedCategory === category ? 'pill active' : 'pill'}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="price-filter">
            <label htmlFor="priceRange">Max price: ₹{maxPrice}</label>
            <input
              id="priceRange"
              type="range"
              min="500"
              max="50000"
              step="500"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="product-grid">
          {!loading && filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <ProductCard key={product._id || product.id} product={product} />
            ))
          ) : (
            <div className="empty-state">{loading ? 'Loading products...' : 'No items match your filters.'}</div>
          )}
        </div>
      </section>
    </div>
  );
}
