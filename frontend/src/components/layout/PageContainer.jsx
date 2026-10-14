import React from 'react';

const PageContainer = ({ children, className = '' }) => {
  return (
    <main className={`page-container ${className}`}>
      {children}
    </main>
  );
};

export default PageContainer;
