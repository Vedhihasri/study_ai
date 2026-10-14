import React from 'react';

const EmptyState = ({ icon: Icon, title, description, action }) => {
  return (
    <div className="card-sa text-center p-5">
      {Icon && (
        <div className="d-inline-flex align-items-center justify-content-center p-3 rounded-circle bg-light text-secondary mb-3">
          <Icon size={32} />
        </div>
      )}
      <h3 className="fs-5 fw-semibold mb-2">{title}</h3>
      {description && <p className="text-secondary mx-auto mb-4" style={{ maxWidth: '420px' }}>{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
};

export default EmptyState;
