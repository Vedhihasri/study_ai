import React from 'react';

const StatCard = ({ icon: Icon, title, value, change, trend = 'up' }) => {
  return (
    <div className="card-sa card-sa-hover p-4 h-100">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <span className="text-secondary fw-medium fs-7">{title}</span>
        {Icon && (
          <div
            className="p-2 rounded-2"
            style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}
          >
            <Icon size={18} />
          </div>
        )}
      </div>
      <div className="d-flex align-items-baseline justify-content-between">
        <h3 className="fs-3 fw-bold mb-0 text-dark">{value}</h3>
        {change && (
          <span
            className={`badge-sa ${
              trend === 'up' ? 'badge-sa-ready' : 'badge-sa-processing'
            }`}
          >
            {change}
          </span>
        )}
      </div>
    </div>
  );
};

export default StatCard;
