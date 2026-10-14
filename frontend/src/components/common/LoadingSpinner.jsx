import React from 'react';
import { Spinner } from 'react-bootstrap';

const LoadingSpinner = ({ label = 'Loading...', size = 'border', className = '' }) => {
  return (
    <div className={`d-flex align-items-center justify-content-center p-5 gap-3 ${className}`}>
      <Spinner animation={size} role="status" variant="primary" style={{ width: '1.75rem', height: '1.75rem' }}>
        <span className="visually-hidden">Loading...</span>
      </Spinner>
      <span className="text-secondary fw-medium">{label}</span>
    </div>
  );
};

export default LoadingSpinner;
