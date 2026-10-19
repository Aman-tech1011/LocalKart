import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import MarketplaceImage from '../components/MarketplaceImage';
import { useAuth } from '../context/AuthContext';

const formatPrice = (price) => `₹${Number(price || 0).toLocaleString('en-IN')}`;

export default function ProductPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [purchaseError, setPurchaseError] = useState('');
  const [hasConversation, setHasConversation] = useState(false);
  const [isRequestingPurchase, setIsRequestingPurchase] = useState(false);

  useEffect(() => {
    let isCurrent = true;
    setLoading(true);
    setError('');

    api.get(`/products/${productId}`, {
      params: user?.college && !import.meta.env.VITE_CAMPUS_NAME ? { college: user.college } : undefined,
    })
      .then((response) => {
        if (isCurrent) setProduct(response.data);
      })
      .catch((requestError) => {
        if (isCurrent) setError(requestError.response?.data?.message || 'Could not load this listing.');
      })
      .finally(() => {
        if (isCurrent) setLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [productId, user?.college]);

  useEffect(() => {
    const userId = user?.id || user?._id;
    const sellerId = product?.seller?._id || product?.seller?.id;
    if (!product || !userId || String(userId) === String(sellerId) || product.status !== 'active') {
      setHasConversation(false);
      return undefined;
    }

    let isCurrent = true;
    api.get('/messages', { params: { product: product._id } })
      .then(({ data }) => {
        const hasBuyerConversation = data.some((message) => {
          const senderId = message.sender?._id || message.sender?.id;
          const receiverId = message.receiver?._id || message.receiver?.id;
          return (String(senderId) === String(userId) && String(receiverId) === String(sellerId))
            || (String(senderId) === String(sellerId) && String(receiverId) === String(userId));
        });
        if (isCurrent) {
          setHasConversation(hasBuyerConversation);
          setPurchaseError('');
        }
      })
      .catch((requestError) => {
        if (isCurrent) {
          setHasConversation(false);
          setPurchaseError(requestError.response?.data?.message || 'Could not verify your conversation with the seller.');
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [product, user?.id, user?._id]);

  const handleConfirmPurchase = async () => {
    if (!window.confirm('Send a purchase request to the seller? The item will stay listed until the seller confirms the sale.')) return;

    setIsRequestingPurchase(true);
    setPurchaseError('');
    try {
      const { data } = await api.post(`/products/${product._id}/purchase`);
      setProduct((current) => ({ ...current, purchaseRequestedBy: user.id || user._id }));
      setPurchaseError('');
      window.alert(data.message);
    } catch (requestError) {
      setPurchaseError(requestError.response?.data?.message || 'Could not send the purchase request. Please try again.');
    } finally {
      setIsRequestingPurchase(false);
    }
  };

  if (loading) return <div className="empty-state">Loading item details…</div>;
  if (error || !product) {
    return (
      <div className="empty-state product-error">
        <h2>We couldn't find that listing</h2>
        <p>{error || 'This item may have been removed.'}</p>
        <Link className="btn btn-primary" to="/">Explore campus listings</Link>
      </div>
    );
  }

  const seller = product.seller || {};
  const isSeller = user && String(user.id || user._id) === String(seller._id || seller.id);
  const messagePath = `/messages/${product._id}/${seller._id || seller.id}`;
  const loginPath = `/login?intent=buy&next=${encodeURIComponent(messagePath)}`;
  const image = product.images?.[0];

  return (
    <div className="product-detail-page">
      <Link className="back-link" to="/">← Back to campus listings</Link>
      <div className="product-detail-layout">
        <div className="product-detail-image-wrap">
          <MarketplaceImage src={image} className={image ? 'product-detail-image' : 'product-image-placeholder'} alt={product.title} category={product.category} />
        </div>

        <section className="product-detail-card">
          <div className="product-topline">
            <span className="product-category">{product.category}</span>
            <span className="product-condition">{product.condition}</span>
          </div>
          <h1>{product.title}</h1>
          <p className="product-detail-price">{formatPrice(product.price)}</p>
          <p className="product-detail-description">{product.description}</p>

          <div className="detail-facts">
            <div><span>Campus</span><strong>{product.college || seller.college || 'Campus community'}</strong></div>
            <div><span>Meetup area</span><strong>{product.location || 'Agree with seller'}</strong></div>
            <div><span>Listed by</span><strong>{seller.name || 'Student seller'}</strong></div>
          </div>

          {product.status === 'sold' ? (
            <p className="sold-notice">This item has been marked as sold.</p>
          ) : isSeller ? (
            <Link className="btn btn-primary wide-btn" to="/dashboard">Manage your listing</Link>
          ) : user ? (
            <>
              <button className="btn btn-primary wide-btn" onClick={() => navigate(messagePath)}>
                Message seller about this item
              </button>
              {hasConversation && String(product.purchaseRequestedBy || '') === String(user.id || user._id) ? (
                <p className="sold-notice">Purchase request sent. The item stays listed until the seller confirms the sale.</p>
              ) : hasConversation && !product.purchaseRequestedBy ? (
                <button
                  className="btn btn-light wide-btn purchase-confirm-button"
                  type="button"
                  onClick={handleConfirmPurchase}
                  disabled={isRequestingPurchase}
                >
                  {isRequestingPurchase ? 'Sending request…' : 'I bought this item'}
                </button>
              ) : product.purchaseRequestedBy ? (
                <p className="sold-notice">Another buyer has sent a purchase request. The item remains available until the seller confirms.</p>
              ) : null}
            </>
          ) : (
            <Link className="btn btn-primary wide-btn" to={loginPath}>Login to contact seller</Link>
          )}
          {purchaseError && <p className="form-message error-message" role="alert">{purchaseError}</p>}
          <p className="meetup-note">After you and the seller finalize the deal, send a purchase request here. The seller will confirm the sale before the listing is marked sold. Arrange a safe campus meetup and payment directly; LocalKart does not process payments.</p>
        </section>
      </div>
    </div>
  );
}
