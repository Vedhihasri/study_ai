import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, File, ExternalLink, Upload } from 'lucide-react';

const RecentDocuments = ({ documents = [] }) => {
  const navigate = useNavigate();

  if (!documents || documents.length === 0) {
    return (
      <div className="card-sa h-100">
        <div className="card-sa-header">
          <div className="d-flex align-items-center gap-2">
            <FileText size={18} className="text-primary" />
            <h3 className="fs-6 fw-semibold mb-0">Recent Documents</h3>
          </div>
        </div>
        <div className="card-sa-body d-flex flex-column align-items-center justify-content-center text-center p-5">
          <div className="p-3 rounded-circle bg-light text-secondary mb-3">
            <FileText size={28} />
          </div>
          <h4 className="fs-6 fw-semibold text-dark mb-1">No documents uploaded yet</h4>
          <p className="text-secondary fs-7 mb-4" style={{ maxWidth: '360px' }}>
            Upload your PDFs, DOCX, or TXT study materials to enable grounded AI assistance and notes.
          </p>
          <button
            className="btn-primary-sa"
            onClick={() => navigate('/documents')}
          >
            <Upload size={16} />
            <span>Upload Document</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card-sa">
      <div className="card-sa-header">
        <div className="d-flex align-items-center gap-2">
          <FileText size={18} className="text-primary" />
          <h3 className="fs-6 fw-semibold mb-0">Recent Documents</h3>
        </div>
        <button
          className="btn-secondary-sa py-1 px-3 fs-7"
          onClick={() => navigate('/documents')}
        >
          View Library
        </button>
      </div>

      <div className="table-responsive">
        <table className="table-sa">
          <thead>
            <tr>
              <th>Document Name</th>
              <th>Type</th>
              <th>Status</th>
              <th>Uploaded</th>
              <th className="text-end">Action</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr key={doc.id}>
                <td>
                  <div className="d-flex align-items-center gap-2">
                    <File size={16} className="text-secondary" />
                    <span className="fw-medium text-dark">{doc.filename}</span>
                  </div>
                </td>
                <td>
                  <span className="text-muted uppercase fs-7 fw-semibold">{doc.type}</span>
                </td>
                <td>
                  <span className={`badge-sa badge-sa-${doc.status}`}>
                    {doc.status === 'ready' ? 'Ready' : doc.status === 'processing' ? 'Processing' : 'Failed'}
                  </span>
                </td>
                <td>
                  <span className="text-secondary fs-7">{doc.date}</span>
                </td>
                <td className="text-end">
                  <button
                    className="btn-icon-sa"
                    onClick={() => navigate(`/documents/${doc.id}`)}
                    title="View details"
                  >
                    <ExternalLink size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentDocuments;