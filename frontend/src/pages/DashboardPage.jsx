import React from 'react';

export default function DashboardPage() {
  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <p className="eyebrow">Your account</p>
          <h2>Seller Dashboard</h2>
        </div>
        <button className="btn btn-primary">+ New Listing</button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span>Total Listings</span>
          <strong>12</strong>
        </div>
        <div className="stat-card">
          <span>Active Items</span>
          <strong>8</strong>
        </div>
        <div className="stat-card">
          <span>Sold</span>
          <strong>4</strong>
        </div>
        <div className="stat-card">
          <span>Revenue</span>
          <strong>₹24,500</strong>
        </div>
      </div>

      <div className="dashboard-list">
        <h3>Recent listings</h3>
        <ul>
          <li>
            <span>Canon DSLR Camera 700D</span>
            <strong>₹22,000</strong>
          </li>
          <li>
            <span>Hero MTB Cycle</span>
            <strong>₹8,500</strong>
          </li>
          <li>
            <span>Operating Systems Book</span>
            <strong>₹600</strong>
          </li>
        </ul>
      </div>
    </div>
  );
}
