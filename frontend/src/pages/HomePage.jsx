import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';
import { products as dummyProducts } from '../data/mockData';

const categories = ['All', 'Books', 'Cycles', 'Gadgets', 'Electronics', 'Clothes', 'Study Materials', 'Others'];

const normalizeListingValue = (value) => String(value ?? '').trim().toLowerCase();

const getListingKey = (product) => {
  const seller = product.seller;
  const sellerId = typeof seller === 'object'
    ? seller?._id || seller?.id || seller?.name
    : seller;

  return JSON.stringify([
    normalizeListingValue(sellerId || product._id || product.id),
    normalizeListingValue(product.title),
    normalizeListingValue(product.category),
    Number(product.price || 0),
    normalizeListingValue(product.condition),
    normalizeListingValue(product.description),
    normalizeListingValue(product.location),
  ]);
};

const removeDuplicateListings = (listings) => {
  const uniqueListings = new Map();

  listings.forEach((product) => {
    const key = getListingKey(product);
    if (!uniqueListings.has(key)) uniqueListings.set(key, product);
  });

  return [...uniqueListings.values()];
};

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [maxPrice, setMaxPrice] = useState(50000);
  const [loading, setLoading] = useState(true);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [carouselStep, setCarouselStep] = useState(0);
  const [isCarouselAnimating, setIsCarouselAnimating] = useState(true);
  const carouselIndexRef = useRef(0);
  const carouselViewportRef = useRef(null);
  const carouselTrackRef = useRef(null);
  const carouselItemRef = useRef(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get('/products');
        setProducts(removeDuplicateListings(res.data?.length ? res.data : dummyProducts));
      } catch (error) {
        console.error('Failed to load products:', error);
        setProducts(removeDuplicateListings(dummyProducts));
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
  const loopingCarouselProducts =
    carouselProducts.length > 1 ? [...carouselProducts, ...carouselProducts] : carouselProducts;

  const measureCarouselStep = useCallback(() => {
    if (!carouselItemRef.current || !carouselTrackRef.current) return;

    const trackStyles = window.getComputedStyle(carouselTrackRef.current);
    const gap = parseFloat(trackStyles.columnGap || trackStyles.gap || '0');
    setCarouselStep(carouselItemRef.current.getBoundingClientRect().width + gap);
  }, []);

  useEffect(() => {
    measureCarouselStep();

    if (!carouselViewportRef.current) return undefined;

    const observer = new ResizeObserver(measureCarouselStep);
    observer.observe(carouselViewportRef.current);

    return () => observer.disconnect();
  }, [measureCarouselStep, carouselProducts.length]);

  useEffect(() => {
    carouselIndexRef.current = carouselIndex;
  }, [carouselIndex]);

  useEffect(() => {
    setIsCarouselAnimating(false);
    setCarouselIndex(0);

    const frame = requestAnimationFrame(() => {
      setIsCarouselAnimating(true);
    });

    return () => cancelAnimationFrame(frame);
  }, [carouselProducts.length]);

  const moveCarousel = useCallback(
    (direction) => {
      if (carouselProducts.length < 2) return;

      if (direction > 0) {
        setIsCarouselAnimating(true);
        setCarouselIndex((currentIndex) => currentIndex + 1);
        return;
      }

      if (carouselIndexRef.current === 0) {
        setIsCarouselAnimating(false);
        setCarouselIndex(carouselProducts.length);

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setIsCarouselAnimating(true);
            setCarouselIndex(carouselProducts.length - 1);
          });
        });
        return;
      }

      setIsCarouselAnimating(true);
      setCarouselIndex((currentIndex) => currentIndex - 1);
    },
    [carouselProducts.length]
  );

  const handleCarouselTransitionEnd = () => {
    if (carouselProducts.length < 2 || carouselIndex < carouselProducts.length) return;

    setIsCarouselAnimating(false);
    setCarouselIndex(0);

    requestAnimationFrame(() => {
      setIsCarouselAnimating(true);
    });
  };

  useEffect(() => {
    if (carouselProducts.length < 2) return undefined;

    const interval = setInterval(() => {
      moveCarousel(1);
    }, 3000);

    return () => clearInterval(interval);
  }, [carouselProducts.length, moveCarousel]);

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
          <div className="carousel-viewport" ref={carouselViewportRef}>
            <div
              className={`carousel-track${isCarouselAnimating ? '' : ' no-transition'}`}
              ref={carouselTrackRef}
              onTransitionEnd={handleCarouselTransitionEnd}
              style={{ transform: `translate3d(-${carouselIndex * carouselStep}px, 0, 0)` }}
            >
              {loopingCarouselProducts.map((product, index) => {
                const image = product.images?.[0] || product.image || 'https://placehold.co/900x600?text=LocalKart';

                return (
                  <article
                    className="carousel-item"
                    key={`${product._id || product.id}-${index}`}
                    ref={index === 0 ? carouselItemRef : null}
                  >
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
