import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import MarketplaceImage from '../components/MarketplaceImage';
import ProductCard from '../components/ProductCard';
import { useAuth } from '../context/AuthContext';

const categories = [
  { name: 'Mobiles', icon: '📱' },
  { name: 'Laptops', icon: '💻' },
  { name: 'Audio', icon: '🎧' },
  { name: 'Books', icon: '📚' },
  { name: 'Cycles', icon: '🚲' },
  { name: 'Accessories', icon: '⌨️' },
  { name: 'Furniture', icon: '🪑' },
  { name: 'Study Materials', icon: '🎒', label: 'Study gear' },
  { name: 'Electronics', icon: '📷' },
  { name: 'Gadgets', icon: '⌚' },
  { name: 'Clothes', icon: '👕' },
  { name: 'Others', icon: '🛍️' },
];

const getCategoryId = (categoryName) => `category-${categoryName.replace(/\W+/g, '-').toLowerCase()}`;
const isDemoListing = (product) => product.isDemo === true || /^LocalKart Demo \d+:/i.test(product.title || '');

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
  const [maxPrice, setMaxPrice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const sellPath = user ? '/sell' : '/login?next=%2Fsell';
  const categoryRailRefs = useRef({});
  const pendingCategoryScrollRef = useRef('');

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

  useEffect(() => {
    const query = searchParams.get('search') || '';
    setSearch(query);

    if (query) {
      setSelectedCategory('');
    }
  }, [searchParams]);

  const maxAvailablePrice = useMemo(
    () => Math.max(50000, ...products.map((product) => Math.ceil((Number(product.price) || 0) / 500) * 500)),
    [products]
  );

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products.filter((product) => {
      const searchableText = `${product.title || ''} ${product.category || ''} ${product.description || ''} ${product.location || ''}`.toLowerCase();
      return product.status === 'active'
        && (!query || searchableText.includes(query))
        && Number(product.price) <= (maxPrice ?? maxAvailablePrice);
    }).sort((first, second) => {
      if (isDemoListing(first) !== isDemoListing(second)) return isDemoListing(first) ? 1 : -1;
      return (Date.parse(second.createdAt) || 0) - (Date.parse(first.createdAt) || 0);
    });
  }, [search, maxPrice, maxAvailablePrice, products]);

  const categoryRails = useMemo(() => {
    const productsByCategory = new Map();
    filteredProducts.forEach((product) => {
      const categoryProducts = productsByCategory.get(product.category) || [];
      if (categoryProducts.length < 20) categoryProducts.push(product);
      productsByCategory.set(product.category, categoryProducts);
    });

    return categories
      .map((category) => ({
        ...category,
        items: productsByCategory.get(category.name) || [],
      }))
      .filter(({ items }) => items.length > 0);
  }, [filteredProducts]);

  const visibleProductCount = categoryRails.reduce((count, category) => count + category.items.length, 0);

  useEffect(() => {
    const categoryName = pendingCategoryScrollRef.current;
    if (!categoryName || categoryName !== selectedCategory) return;

    const categorySection = document.getElementById(getCategoryId(categoryName));
    if (categorySection) {
      categorySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      pendingCategoryScrollRef.current = '';
    } else if (!loading) {
      pendingCategoryScrollRef.current = '';
    }
  }, [categoryRails, loading, selectedCategory]);

  const handleCategoryClick = (categoryName) => {
    const categorySection = document.getElementById(getCategoryId(categoryName));
    if (categorySection) {
      categorySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      pendingCategoryScrollRef.current = categoryName;
    }
    setSelectedCategory(categoryName);
    setSearch('');
    setSearchParams({});
  };

  const handleSeeAllListings = (event) => {
    event.preventDefault();
    setSelectedCategory('');
    setSearch('');
    setSearchParams({});
    document.getElementById('marketplace')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleHomeSearch = (event) => {
    event.preventDefault();
    const query = search.trim();
    setSearchParams(query ? { search: query } : {});
    document.getElementById('marketplace')?.scrollIntoView({ behavior: 'smooth' });
  };

  const heroProducts = products
    .filter((product) => product.status === 'active')
    .slice(0, 2);

  const scrollCategoryRail = (categoryName, direction) => {
    const rail = categoryRailRefs.current[categoryName];
    rail?.scrollBy({
      left: direction * rail.clientWidth * 0.8,
      behavior: 'smooth',
    });
  };

  return (
    <div className="home-page">
      <section className="landing-hero">
        <div className="landing-hero-copy">
          <span className="campus-tag"><span aria-hidden="true">✦</span> Your campus. Your marketplace.</span>
          <h1>Good finds.<br /><span>Right on campus.</span></h1>
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
          <div className="hero-art-grid" aria-hidden="true" />
          <div className="hero-art-label"><span className="online-dot" /> THE CAMPUS EDIT</div>
          {heroProducts.length > 0 ? (
            heroProducts.map((product, index) => (
              <Link
                className={`hero-product-preview hero-product-preview-${index + 1}`}
                key={product._id || product.id}
                to={`/product/${product._id || product.id}`}
              >
                <MarketplaceImage
                  src={product.images?.[0] || product.image}
                  alt={product.title}
                  category={product.category}
                  title={product.title}
                  className="hero-product-image"
                />
                <div className="hero-product-details">
                  <div>
                    <span>{product.category || 'Campus find'}</span>
                    <strong>{product.title}</strong>
                  </div>
                  <b>₹{Number(product.price || 0).toLocaleString('en-IN')}</b>
                </div>
              </Link>
            ))
          ) : (
            <>
              <div className="hero-product-preview hero-product-preview-1 hero-product-placeholder">
                <span aria-hidden="true">🎧</span>
                <div className="hero-product-details">
                  <div><span>STUDENT ESSENTIAL</span><strong>Find your next favourite</strong></div>
                  <b>Explore</b>
                </div>
              </div>
              <div className="hero-product-preview hero-product-preview-2 hero-product-placeholder">
                <span aria-hidden="true">📚</span>
                <div className="hero-product-details">
                  <div><span>MADE FOR CAMPUS</span><strong>Good things, close by</strong></div>
                  <b>Local</b>
                </div>
              </div>
            </>
          )}
          <div className="hero-art-caption"><span className="online-dot" /> Better finds, closer to home</div>
        </div>
      </section>

      <section className="category-section" aria-labelledby="category-title">
        <div className="section-heading category-heading">
          <div><p className="eyebrow">Find what you need</p><h2 id="category-title">Shop by category</h2></div>
          <a className="text-link" href="#marketplace" onClick={handleSeeAllListings}>See all listings <span aria-hidden="true">→</span></a>
        </div>
        <div className="category-grid">
          {categories.map((category) => (
            <button
              className={`category-tile${selectedCategory === category.name ? ' active' : ''}`}
              key={category.name}
              type="button"
              aria-pressed={selectedCategory === category.name}
              onClick={() => handleCategoryClick(category.name)}
            >
              <span className="category-icon" aria-hidden="true">{category.icon}</span>
              <span>{category.label || category.name}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="filter-section section-block product-browser" id="marketplace" aria-labelledby="marketplace-title">
        <div className="section-heading product-browser-heading">
          <div>
            <p className="eyebrow">Browse campus listings</p>
            <h2 id="marketplace-title">{search ? 'Search results' : 'Campus marketplace'}</h2>
          </div>
          <span className="listing-count">
            {visibleProductCount} {visibleProductCount === 1 ? 'item' : 'items'}
          </span>
        </div>

        <div className="filter-row">
          <label className="price-filter" htmlFor="priceRange">
            <span>Max price: ₹{(maxPrice ?? maxAvailablePrice).toLocaleString('en-IN')}</span>
            <input
              id="priceRange"
              type="range"
              min="500"
              max={maxAvailablePrice}
              step="500"
              value={Math.min(maxPrice ?? maxAvailablePrice, maxAvailablePrice)}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
            />
          </label>
        </div>

        {loading ? (
          <div className="empty-state">Loading products...</div>
        ) : loadError ? (
          <div className="empty-state">{loadError}</div>
        ) : categoryRails.length > 0 ? (
          <div className="category-shelves">
            {categoryRails.map(({ name, items }) => (
              <section className="category-shelf" id={getCategoryId(name)} key={name} aria-labelledby={`${getCategoryId(name)}-title`}>
                <div className="category-shelf-heading">
                  <div>
                    <p className="eyebrow">{items.length} {items.length === 1 ? 'campus find' : 'campus finds'}</p>
                    <h3 id={`${getCategoryId(name)}-title`}>{name}</h3>
                  </div>
                  <div className="product-rail-actions">
                    <button className="carousel-button" type="button" aria-label={`Scroll ${name} products left`} onClick={() => scrollCategoryRail(name, -1)}>&#8592;</button>
                    <button className="carousel-button" type="button" aria-label={`Scroll ${name} products right`} onClick={() => scrollCategoryRail(name, 1)}>&#8594;</button>
                  </div>
                </div>
                <div
                  className="category-product-rail"
                  ref={(rail) => {
                    categoryRailRefs.current[name] = rail;
                  }}
                  aria-label={`${name} listings`}
                >
                  {items.map((product) => (
                    <ProductCard key={product._id || product.id} product={product} variant="rail" />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="empty-state">{products.length ? 'No items match your filters.' : 'No live items yet. Be the first to list something for your campus.'}</div>
        )}
      </section>

      <section className="seller-banner">
        <div><p className="eyebrow">Give your stuff a second life</p><h2>Have something your campus needs?</h2><p>Turn unused essentials into extra cash. Listing takes just a few minutes.</p></div>
        <Link className="btn btn-primary" to={sellPath}>Sell on LocalKart <span aria-hidden="true">→</span></Link>
      </section>
    </div>
  );
}
