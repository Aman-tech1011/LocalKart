import React, { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../api/axios';
import MarketplaceImage from '../components/MarketplaceImage';

const formatPrice = (price) => `₹${Number(price || 0).toLocaleString('en-IN')}`;

export default function DashboardPage() {
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(location.state?.notice || '');
  const [confirmingSaleId, setConfirmingSaleId] = useState('');

  const loadDashboard = useCallback(async () => {
    try {
      const [productResponse, messageResponse] = await Promise.all([
        api.get('/products/mine'),
        api.get('/messages'),
      ]);
      setProducts(productResponse.data);
      setMessages(messageResponse.data);
      setError('');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load your dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    const interval = window.setInterval(loadDashboard, 15000);
    window.addEventListener('focus', loadDashboard);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', loadDashboard);
    };
  }, [loadDashboard]);

  const updateStatus = async (product) => {
    setError('');
    setNotice('');
    try {
      const status = product.status === 'sold' ? 'active' : 'sold';
      await api.put(`/products/${product._id}`, { status });
      setProducts((current) => current.map((item) => item._id === product._id ? { ...item, status } : item));
      setNotice(status === 'sold' ? 'Listing marked as sold.' : 'Listing is live again.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not update this listing.');
    }
  };

  const confirmSale = async (product) => {
    const buyerName = product.purchaseRequestedBy?.name || 'the buyer';
    if (!window.confirm(`Confirm that you sold "${product.title}" to ${buyerName}? This will mark the listing as sold and remove it from Buy.`)) return;

    setConfirmingSaleId(product._id);
    setError('');
    setNotice('');
    try {
      await api.post(`/products/${product._id}/confirm-sale`);
      setProducts((current) => current.map((item) => (
        item._id === product._id
          ? { ...item, status: 'sold', purchasedBy: item.purchaseRequestedBy, purchaseRequestedBy: null }
          : item
      )));
      setNotice(`Sale confirmed for "${product.title}". The listing is no longer visible to buyers.`);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not confirm this sale.');
    } finally {
      setConfirmingSaleId('');
    }
  };

  const deleteListing = async (product) => {
    if (!window.confirm(`Remove "${product.title}" from the marketplace?`)) return;
    setError('');
    try {
      await api.delete(`/products/${product._id}`);
      setProducts((current) => current.filter((item) => item._id !== product._id));
      setNotice('Listing removed.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not remove this listing.');
    }
  };

  if (loading) return <div className="empty-state">Loading your campus dashboard…</div>;

  const activeCount = products.filter((product) => product.status === 'active').length;
  const soldCount = products.filter((product) => product.status === 'sold').length;

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <p className="eyebrow">Your campus account</p>
          <h1>My dashboard</h1>
          <p className="dashboard-subtitle">Manage listings and talk to students interested in your items.</p>
        </div>
        <div className="dashboard-actions">
          <Link className="btn btn-light" to="/messages">Messages</Link>
          <Link className="btn btn-primary" to="/sell">Sell</Link>
        </div>
      </div>

      {notice && <p className="form-message">{notice}</p>}
      {error && <p className="form-message error-message">{error}</p>}

      <div className="stats-grid">
        <div className="stat-card"><span>My listings</span><strong>{products.length}</strong></div>
        <div className="stat-card"><span>Live items</span><strong>{activeCount}</strong></div>
        <div className="stat-card"><span>Marked sold</span><strong>{soldCount}</strong></div>
        <div className="stat-card"><span>Messages</span><strong>{messages.length}</strong></div>
      </div>

      <section className="dashboard-listings">
        <div className="section-heading">
          <div><p className="eyebrow">Your items</p><h2>My listings</h2></div>
          <Link className="text-link" to="/messages">Open inbox →</Link>
        </div>

        {products.length ? (
          <div className="seller-listings">
            {products.map((product) => (
              <article className="seller-listing" key={product._id}>
                <MarketplaceImage src={product.images?.[0]} alt="" category={product.category} className="seller-listing-placeholder" />
                <div className="seller-listing-copy">
                  <span className={`status-chip ${product.status === 'sold' ? 'sold' : ''}`}>{product.status === 'sold' ? 'Sold' : product.purchaseRequestedBy ? 'Sale requested' : 'Live'}</span>
                  <h3><Link to={`/product/${product._id}`}>{product.title}</Link></h3>
                  <p>{product.category} · {product.condition} · {new Date(product.createdAt).toLocaleDateString()}</p>
                  {product.purchaseRequestedBy && <p className="purchase-request-note">{product.purchaseRequestedBy.name || 'A buyer'} says they bought this item.</p>}
                  <strong>{formatPrice(product.price)}</strong>
                </div>
                <div className="seller-listing-actions">
                  <Link className="btn btn-light" to={`/product/${product._id}`}>View</Link>
                  {product.purchaseRequestedBy ? (
                    <button
                      className="btn btn-primary"
                      onClick={() => confirmSale(product)}
                      disabled={confirmingSaleId === product._id}
                    >
                      {confirmingSaleId === product._id ? 'Confirming…' : 'Confirm sale'}
                    </button>
                  ) : (
                    <button className="btn btn-light" onClick={() => updateStatus(product)}>
                      {product.status === 'sold' ? 'Relist' : 'Mark sold'}
                    </button>
                  )}
                  <button className="btn btn-danger-light" onClick={() => deleteListing(product)}>Remove</button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h3>Your first listing is one step away</h3>
            <p>Post a book, phone, laptop, cycle or anything useful to another student.</p>
            <Link className="btn btn-primary" to="/sell">Sell</Link>
          </div>
        )}
      </section>
    </div>
  );
}
