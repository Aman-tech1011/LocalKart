import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const getId = (value) => String(value?._id || value?.id || value || '');

export default function MessagesPage() {
  const { productId, otherUserId } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [product, setProduct] = useState(null);
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [productLoading, setProductLoading] = useState(Boolean(productId));
  const [sending, setSending] = useState(false);

  const loadMessages = useCallback(async () => {
    try {
      const response = await api.get('/messages', {
        params: productId ? { product: productId, ...(otherUserId ? { with: otherUserId } : {}) } : undefined,
      });
      setMessages(response.data);
      setError('');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load your messages.');
    } finally {
      setLoading(false);
    }
  }, [productId, otherUserId]);

  useEffect(() => {
    let isCurrent = true;
    const loadProduct = async () => {
      if (!productId) return;
      setProduct(null);
      setProductLoading(true);
      try {
        const response = await api.get(`/products/${productId}`, {
          params: user?.college && !import.meta.env.VITE_CAMPUS_NAME ? { college: user.college } : undefined,
        });
        if (isCurrent) setProduct(response.data);
      } catch (requestError) {
        if (isCurrent) setError(requestError.response?.data?.message || 'Could not load the listing.');
      } finally {
        if (isCurrent) setProductLoading(false);
      }
    };
    loadProduct();
    loadMessages();
    const timer = window.setInterval(loadMessages, 5000);

    return () => {
      isCurrent = false;
      window.clearInterval(timer);
    };
  }, [productId, loadMessages, user?.college]);

  const conversations = useMemo(() => {
    const grouped = new Map();
    messages.forEach((message) => {
      const listing = message.product;
      if (!listing) return;
      const key = `${getId(listing)}:${getId(message.sender) === getId(user) ? getId(message.receiver) : getId(message.sender)}`;
      const current = grouped.get(key);
      const person = getId(message.sender) === getId(user) ? message.receiver : message.sender;
      grouped.set(key, { product: listing, person, latest: message });
    });
    return [...grouped.values()].sort((a, b) => new Date(b.latest.createdAt) - new Date(a.latest.createdAt));
  }, [messages, user]);

  const currentUserId = getId(user);
  const isSeller = currentUserId === getId(product?.seller);
  const canReply = !isSeller || messages.length > 0;

  const handleSubmit = async (event) => {
    event.preventDefault();
    const sellerId = getId(product?.seller);
    const previousMessage = messages[0];
    const receiverId = otherUserId || (currentUserId === sellerId
      ? (previousMessage
        ? getId(previousMessage.sender) === currentUserId
          ? getId(previousMessage.receiver)
          : getId(previousMessage.sender)
        : '')
      : sellerId);
    if (!content.trim() || !receiverId || sending) return;

    setSending(true);
    setError('');
    try {
      const response = await api.post('/messages', {
        receiver: receiverId,
        product: productId,
        content: content.trim(),
      });
      setMessages((current) => [...current, response.data.data]);
      setContent('');
      await loadMessages();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Message could not be sent. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (loading || (productId && productLoading)) return <div className="empty-state">Loading messages…</div>;

  if (!productId) {
    return (
      <section className="messages-page">
        <div className="messages-heading">
          <div><p className="eyebrow">Buyer and seller chats</p><h1>Your messages</h1></div>
          <Link className="btn btn-light" to="/dashboard">My dashboard</Link>
        </div>
        {error && <p className="form-message error-message">{error}</p>}
        {conversations.length ? (
          <div className="conversation-list">
            {conversations.map(({ product: listing, person, latest }) => (
              <Link className="conversation-row" to={`/messages/${getId(listing)}/${getId(person)}`} key={`${getId(listing)}-${getId(person)}`}>
                <div className="conversation-avatar">{(person?.name || 'S').charAt(0).toUpperCase()}</div>
                <div className="conversation-copy">
                  <strong>{listing.title}</strong>
                  <span>{person?.name || 'Campus student'} · {latest.content}</span>
                </div>
                <time>{new Date(latest.createdAt).toLocaleDateString()}</time>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-state"><h2>No conversations yet</h2><p>Open a listing and message the student selling it.</p><Link className="btn btn-primary" to="/">Browse items</Link></div>
        )}
      </section>
    );
  }

  return (
    <section className="messages-page">
      <div className="messages-heading">
        <div>
          <Link className="back-link" to="/messages">← All messages</Link>
          <p className="eyebrow">Campus marketplace chat</p>
          <h1>{product?.title || 'Listing conversation'}</h1>
        </div>
        {product && <Link className="btn btn-light" to={`/product/${productId}`}>View item · ₹{Number(product.price || 0).toLocaleString('en-IN')}</Link>}
      </div>

      {error && <p className="form-message error-message">{error}</p>}
      <div className="chat-panel">
        <div className="chat-messages" aria-live="polite">
          {messages.map((message) => {
            const isMine = getId(message.sender) === currentUserId;
            return (
              <div className={`chat-message${isMine ? ' mine' : ''}`} key={message._id}>
                <span>{isMine ? 'You' : message.sender?.name || 'Campus student'}</span>
                <p>{message.content}</p>
                <time>{new Date(message.createdAt).toLocaleString()}</time>
              </div>
            );
          })}
          {!messages.length && <p className="chat-empty">Say hello and ask the seller about this item or a campus meetup.</p>}
        </div>

        {product && product.status === 'active' && canReply ? (
          <form className="chat-compose" onSubmit={handleSubmit}>
            <textarea
              aria-label="Write your message"
              rows="2"
              maxLength="2000"
              placeholder="Ask a question or arrange a meetup…"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              required
            />
            <button className="btn btn-primary" type="submit" disabled={sending || !content.trim()}>
              {sending ? 'Sending…' : 'Send message'}
            </button>
          </form>
        ) : <p className="sold-notice chat-sold">This item is no longer available for new messages.</p>}
      </div>
    </section>
  );
}
