import React, { useEffect, useMemo, useState } from 'react';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';
import { products as dummyProducts } from '../data/mockData';

const categories = ['All', 'Books', 'Cycles', 'Gadgets', 'Electronics', 'Clothes', 'Study Materials', 'Others'];

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [maxPrice, setMaxPrice] = useState(50000);
  const [loading, setLoading] = useState(true);
  const [carouselIndex, setCarouselIndex] = useState(0);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get('/products');
        setProducts(res.data?.length ? res.data : dummyProducts);
      } catch (error) {
        console.error('Failed to load products:', error);
        setProducts(dummyProducts);
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

  const featuredProducts = products.filter((product) => product.status === 'active').slice(0, 6);
  const carouselProducts = featuredProducts.length > 0 ? featuredProducts : products.slice(0, 6);

  useEffect(() => {
    if (carouselProducts.length < 2) return undefined;

    const interval = setInterval(() => {
      setCarouselIndex((currentIndex) => (currentIndex + 1) % carouselProducts.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [carouselProducts.length]);

  const moveCarousel = (direction) => {
    if (!carouselProducts.length) return;

    setCarouselIndex((currentIndex) =>
      (currentIndex + direction + carouselProducts.length) % carouselProducts.length
    );
  };

  return (
    <div>
      <section className="top-search-section" aria-label="Search marketplace">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search for books, gadgets, cycles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="btn btn-primary" type="button">Search</button>
        </div>
      </section>

      <section className="item-carousel" aria-label="Featured marketplace items">
        <div className="carousel-heading">
          <div>
            <p className="eyebrow">Fresh on campus</p>
            <h2>Find your next essential</h2>
          </div>
          <div className="carousel-controls">
            <button
              className="carousel-button"
              type="button"
              aria-label="Previous item"
              onClick={() => moveCarousel(-1)}
              disabled={carouselProducts.length < 2}
            >
              &#8592;
            </button>
            <button
              className="carousel-button"
              type="button"
              aria-label="Next item"
              onClick={() => moveCarousel(1)}
              disabled={carouselProducts.length < 2}
            >
              &#8594;
            </button>
          </div>
        </div>

        {loading ? (
          <div className="carousel-empty">Loading latest items...</div>
        ) : carouselProducts.length > 0 ? (
          <div className="carousel-viewport">
            <div
              className="carousel-track"
              style={{ '--carousel-index': carouselIndex }}
            >
              {carouselProducts.map((product) => {
                const image = product.images?.[0] || product.image || 'https://placehold.co/900x600?text=LocalKart';

                return (
                  <article className="carousel-item" key={product._id || product.id}>
                    <img src={image} alt={product.title} />
                    <div className="carousel-item-content">
                      <span>{product.category || 'Campus find'}</span>
                      <h3>{product.title}</h3>
                      <strong>₹{Number(product.price || 0).toLocaleString('en-IN')}</strong>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="carousel-empty">New items will appear here soon.</div>
        )}
      </section>

      <section className="section-block">
        <div className="section-heading">
          <h2>Featured</h2>
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
          <h2>Marketplace</h2>
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

      <section className="hero-section">
        <div className="hero-copy">
          <p className="eyebrow">Campus marketplace for students</p>
          <h1>Buy and sell student essentials nearby.</h1>
          <p>
            LocalKart helps college students discover affordable books, cycles,
            gadgets, clothes, and more in their campus community.
          </p>
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
    </div>
  );
}
