import React from 'react';

const PageHeader = ({ title, subtitle, action }) => {
  return (
    <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4">
      <div>
        <h1 className="mb-1">{title}</h1>
        {subtitle && <p className="text-secondary mb-0 fs-6">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};

export default PageHeader;
