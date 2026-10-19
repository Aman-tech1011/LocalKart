import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import MarketplaceImage from '../components/MarketplaceImage';
import ProductCard from '../components/ProductCard';
import { useAuth } from '../context/AuthContext';

const categories = [
  { name: 'Mobiles', icon: '📱', search: 'mobile phone' },
  { name: 'Laptops', icon: '💻', search: 'laptop notebook' },
  { name: 'Audio', icon: '🎧', search: 'earphone earbuds headphones' },
  { name: 'Books', icon: '📚', search: 'book textbook' },
  { name: 'Cycles', icon: '🚲', search: 'cycle bicycle' },
  { name: 'Accessories', icon: '⌨️', search: 'mouse keyboard' },
  { name: 'Furniture', icon: '🪑', search: 'table lamp chair' },
  { name: 'Study gear', icon: '🎒', search: 'study material drawing kit' },
];

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
  const { user } = useAuth();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [maxPrice, setMaxPrice] = useState(50000);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [carouselStep, setCarouselStep] = useState(0);
  const [isCarouselAnimating, setIsCarouselAnimating] = useState(true);
  const [activeCategory, setActiveCategory] = useState('');
  const sellPath = user ? '/sell' : '/login?next=%2Fsell';
  const carouselIndexRef = useRef(0);
  const carouselViewportRef = useRef(null);
  const carouselTrackRef = useRef(null);
  const carouselItemRef = useRef(null);

  useEffect(() => {
    if (location.hash !== '#marketplace') return undefined;

    const frame = window.requestAnimationFrame(() => {
      document.getElementById('marketplace')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [location.hash]);

  useEffect(() => {
    let isCurrent = true;
    let isFetching = false;
    const fetchProducts = async () => {
      if (isFetching) return;
      isFetching = true;

      try {
        const res = await api.get('/products', {
          params: user?.college && !import.meta.env.VITE_CAMPUS_NAME ? { college: user.college } : undefined,
        });
        if (isCurrent) {
          setProducts(removeDuplicateListings(res.data || []));
          setLoadError('');
        }
      } catch (error) {
        console.error('Failed to load products:', error);
        if (isCurrent) {
          setProducts([]);
          setLoadError(error.response?.data?.message || 'Listings could not be loaded. Please check that the LocalKart server is running.');
        }
      } finally {
        isFetching = false;
        if (isCurrent) setLoading(false);
      }
    };

    fetchProducts();

    const refreshInterval = window.setInterval(fetchProducts, 15000);
    window.addEventListener('focus', fetchProducts);
    return () => {
      isCurrent = false;
      window.clearInterval(refreshInterval);
      window.removeEventListener('focus', fetchProducts);
    };
  }, [user?.college]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const searchableText = `${product.title || ''} ${product.category || ''} ${product.description || ''}`.toLowerCase();
      const matchesCategory = !selectedCategory || selectedCategory
        .split(' ')
        .some((term) => searchableText.includes(term));
      const matchesSearch = !search || searchableText.includes(search.toLowerCase());
      const matchesPrice = Number(product.price) <= maxPrice;

      return matchesCategory && matchesSearch && matchesPrice;
    });
  }, [selectedCategory, search, maxPrice, products]);

  useEffect(() => {
    const query = searchParams.get('search') || '';
    setSearch(query);

    if (query) {
      setSelectedCategory('');
      setActiveCategory('');
    }
  }, [searchParams]);

  const handleCategoryClick = (category) => {
    setActiveCategory(category.name);
    setSelectedCategory(category.search);
    document.getElementById('marketplace')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleHomeSearch = (event) => {
    event.preventDefault();
    const query = search.trim();
    setSearchParams(query ? { search: query } : {});
    document.getElementById('marketplace')?.scrollIntoView({ behavior: 'smooth' });
  };

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
      <section className="landing-hero">
        <div className="landing-hero-copy">
          <span className="campus-tag"><span aria-hidden="true">✦</span> Your campus. Your marketplace.</span>
          <h1>Good finds.<br /><span>Right around campus.</span></h1>
          <p>Buy and sell pre-loved essentials with students at your university. Great deals, easy meetups, less waste.</p>
          <form className="hero-search" role="search" onSubmit={handleHomeSearch}>
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              aria-label="Search items"
              placeholder="What are you looking for?"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <button className="btn btn-primary" type="submit">Find items</button>
          </form>
          <div className="hero-actions">
            <a className="btn btn-primary" href="#marketplace">Explore listings <span aria-hidden="true">→</span></a>
            <Link className="btn btn-outline" to={sellPath}>Sell</Link>
          </div>
          <div className="hero-trust"><span aria-hidden="true">✓</span> Made for students <span className="trust-dot">·</span> Meet on campus <span className="trust-dot">·</span> Shop local</div>
        </div>
        <div className="landing-hero-art" aria-label="Popular student essentials">
          <div className="hero-art-glow" />
          <div className="hero-item hero-item-laptop"><span>💻</span><small>Tech deals</small></div>
          <div className="hero-item hero-item-book"><span>📚</span><small>Semester reads</small></div>
          <div className="hero-item hero-item-cycle"><span>🚲</span><small>Campus rides</small></div>
          <div className="hero-art-caption"><span className="online-dot" /> New finds added every day</div>
        </div>
      </section>

      <section className="category-section" aria-labelledby="category-title">
        <div className="section-heading category-heading">
          <div><p className="eyebrow">Find what you need</p><h2 id="category-title">Shop by category</h2></div>
          <a className="text-link" href="#marketplace">See all listings <span aria-hidden="true">→</span></a>
        </div>
        <div className="category-grid">
          {categories.map((category) => (
            <button
              className={`category-tile${activeCategory === category.name ? ' active' : ''}`}
              key={category.name}
              type="button"
              onClick={() => handleCategoryClick(category)}
            >
              <span className="category-icon" aria-hidden="true">{category.icon}</span>
              <span>{category.name}</span>
            </button>
          ))}
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
                const image = product.images?.[0] || product.image;

                return (
                  <article
                    className="carousel-item"
                    key={`${product._id || product.id}-${index}`}
                    ref={index === 0 ? carouselItemRef : null}
                  >
                    <MarketplaceImage src={image} alt={product.title} category={product.category} />
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
          <div className="carousel-empty">{loadError || 'No live items yet. Be the first to list something for your campus.'}</div>
        )}
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div><p className="eyebrow">Picked for campus life</p><h2>Popular right now</h2></div>
        </div>

        <div className="featured-grid">
          {loading ? (
            <div className="empty-state">Loading products...</div>
          ) : loadError ? (
            <div className="empty-state">{loadError}</div>
          ) : (
            featuredProducts.map((product) => (
              <ProductCard key={product._id || product.id} product={product} />
            ))
          )}
        </div>
      </section>

      <section className="filter-section section-block" id="marketplace">
        <div className="section-heading">
          <div><p className="eyebrow">Buy from students near you</p><h2>Campus marketplace</h2></div>
          <span className="listing-count">{filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'}</span>
        </div>

        <div className="filter-row">
          <div className="category-pills">
            {['All', ...new Set(products.map((product) => product.category).filter(Boolean))].map((category) => (
              <button
                key={category}
                className={(selectedCategory === '' && category === 'All') || selectedCategory === category.toLowerCase() ? 'pill active' : 'pill'}
                onClick={() => {
                  setSelectedCategory(category === 'All' ? '' : category.toLowerCase());
                  setActiveCategory('');
                }}
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
            <div className="empty-state">{loading ? 'Loading products...' : loadError || 'No items match your filters.'}</div>
          )}
        </div>
      </section>

      <section className="seller-banner">
        <div><p className="eyebrow">Give your stuff a second life</p><h2>Have something your campus needs?</h2><p>Turn unused essentials into extra cash. Listing takes just a few minutes.</p></div>
        <Link className="btn btn-primary" to={sellPath}>Sell on LocalKart <span aria-hidden="true">→</span></Link>
      </section>
    </div>
  );
}
