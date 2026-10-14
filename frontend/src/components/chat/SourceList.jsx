import React from 'react';
import { FileText } from 'lucide-react';

const SourceList = ({ sources }) => {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="source-section">
      <div className="text-muted fw-semibold fs-7 mb-2" style={{ fontSize: '0.725rem' }}>
        Sources Cited ({sources.length})
      </div>
      <div className="d-flex flex-wrap gap-2">
        {sources.map((src, index) => (
          <div key={index} className="source-card" title={`Source details: ${src.filename} Page ${src.page_number}`}>
            <FileText size={13} className="text-primary" />
            <span className="fw-medium">{src.filename}</span>
            <span className="text-muted">• Page {src.page_number}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SourceList;
