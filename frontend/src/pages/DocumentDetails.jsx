import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Calendar,
  Layers,
  MessageSquare,
  Trash2
} from 'lucide-react';

import PageContainer from '../components/layout/PageContainer';
import PageHeader from '../components/common/PageHeader';

const API_URL =
  import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const DocumentDetails = () => {
  const { documentId } = useParams();
  const navigate = useNavigate();

  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (documentId) {
      fetchDocument();
    }
  }, [documentId]);

  const fetchDocument = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('study_ai_token');

      if (!token) {
        setError('Authentication token not found. Please login again.');
        return;
      }

      const response = await fetch(
        `${API_URL}/documents/${documentId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail || 'Failed to load document'
        );
      }

      setDocument(data);

    } catch (err) {
      console.error('Document fetch error:', err);

      setError(
        err.message || 'Unable to load document.'
      );

    } finally {
      setLoading(false);
    }
  };

  /* ---------------- STATUS ---------------- */

  const getStatusIcon = () => {
    switch (document?.status) {
      case 'processed':
        return (
          <CheckCircle2
            size={22}
            className="text-success"
          />
        );

      case 'pending':
        return (
          <Clock
            size={22}
            className="text-warning"
          />
        );

      case 'failed':
        return (
          <XCircle
            size={22}
            className="text-danger"
          />
        );

      default:
        return (
          <Clock
            size={22}
            className="text-muted"
          />
        );
    }
  };

  const getStatusClass = () => {
    switch (document?.status) {
      case 'processed':
        return 'text-success';

      case 'pending':
        return 'text-warning';

      case 'failed':
        return 'text-danger';

      default:
        return 'text-muted';
    }
  };

  /* ---------------- DELETE ---------------- */

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${document.filename}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);

      const token = localStorage.getItem('study_ai_token');

      const response = await fetch(
        `${API_URL}/documents/${documentId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail || 'Failed to delete document'
        );
      }

      navigate('/documents');

    } catch (err) {
      console.error('Delete document error:', err);

      alert(
        err.message || 'Unable to delete document.'
      );

    } finally {
      setDeleting(false);
    }
  };

  /* ---------------- ASK AI ---------------- */

  const handleAskAI = () => {
    if (document.status !== 'processed') {
      return;
    }

    navigate(`/chat?document=${document.id}`);
  };

  /* ---------------- LOADING ---------------- */

  if (loading) {
    return (
      <PageContainer>
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ minHeight: '400px' }}
        >
          <div className="text-center">
            <Loader2
              size={36}
              className="spin mb-3"
            />

            <p className="text-muted mb-0">
              Loading document...
            </p>
          </div>
        </div>
      </PageContainer>
    );
  }

  /* ---------------- ERROR ---------------- */

  if (error || !document) {
    return (
      <PageContainer>

        <button
          className="btn btn-link p-0 mb-4 text-decoration-none"
          onClick={() => navigate('/documents')}
        >
          <ArrowLeft size={17} />

          <span className="ms-2">
            Back to Documents
          </span>
        </button>

        <div className="alert alert-danger d-flex align-items-center gap-2">

          <AlertCircle size={20} />

          <div>
            <strong>
              Unable to load document
            </strong>

            <div>
              {error || 'Document not found'}
            </div>
          </div>

        </div>

      </PageContainer>
    );
  }

  const chunks = document.chunks || [];

  /* ---------------- MAIN UI ---------------- */

  return (
    <PageContainer>

      {/* Back button */}

      <button
        className="btn btn-link p-0 mb-4 text-decoration-none"
        onClick={() => navigate('/documents')}
      >
        <ArrowLeft size={17} />

        <span className="ms-2">
          Back to Documents
        </span>
      </button>


      {/* Header */}

      <PageHeader
        title={document.filename}
        subtitle={`${document.file_type?.toUpperCase() || 'FILE'} document`}
      />


      {/* Document statistics */}

      <div className="row g-4 mb-4">

        {/* File Type */}

        <div className="col-md-3">
          <div className="sa-card p-4 h-100">

            <div className="d-flex align-items-center gap-3">

              <FileText size={24} />

              <div>

                <small className="text-muted">
                  File Type
                </small>

                <div className="fw-semibold">
                  {document.file_type?.toUpperCase() || '-'}
                </div>

              </div>

            </div>

          </div>
        </div>


        {/* Chunks */}

        <div className="col-md-3">
          <div className="sa-card p-4 h-100">

            <div className="d-flex align-items-center gap-3">

              <Layers size={24} />

              <div>

                <small className="text-muted">
                  Indexed Chunks
                </small>

                <div className="fw-semibold">
                  {chunks.length}
                </div>

              </div>

            </div>

          </div>
        </div>


        {/* Status */}

        <div className="col-md-3">
          <div className="sa-card p-4 h-100">

            <div className="d-flex align-items-center gap-3">

              {getStatusIcon()}

              <div>

                <small className="text-muted">
                  Status
                </small>

                <div
                  className={`fw-semibold text-capitalize ${getStatusClass()}`}
                >
                  {document.status || 'unknown'}
                </div>

              </div>

            </div>

          </div>
        </div>


        {/* Created */}

        <div className="col-md-3">
          <div className="sa-card p-4 h-100">

            <div className="d-flex align-items-center gap-3">

              <Calendar size={22} />

              <div>

                <small className="text-muted">
                  Created
                </small>

                <div className="fw-semibold">

                  {document.created_at
                    ? new Date(
                        document.created_at
                      ).toLocaleDateString()
                    : '-'
                  }

                </div>

              </div>

            </div>

          </div>
        </div>

      </div>


      {/* Processing status */}

      {document.status === 'pending' && (

        <div className="alert alert-warning d-flex align-items-center gap-2 mb-4">

          <Clock size={20} />

          <div>

            <strong>
              Document is still processing.
            </strong>

            <div>
              The document is being prepared for AI-powered
              search and question answering.
            </div>

          </div>

        </div>

      )}


      {document.status === 'failed' && (

        <div className="alert alert-danger d-flex align-items-center gap-2 mb-4">

          <XCircle size={20} />

          <div>

            <strong>
              Document processing failed.
            </strong>

            <div>
              Please upload the document again.
            </div>

          </div>

        </div>

      )}


      {/* AI Action Card */}

      <div className="sa-card p-4 mb-4">

        <div className="row align-items-center">

          <div className="col-md-8">

            <div className="d-flex align-items-start gap-3">

              <div
                className="d-flex align-items-center justify-content-center rounded-3"
                style={{
                  width: '48px',
                  height: '48px',
                  background: 'rgba(99, 102, 241, 0.1)'
                }}
              >
                <MessageSquare size={24} />
              </div>

              <div>

                <h5 className="mb-1">
                  Ask AI about this document
                </h5>

                <p className="text-muted mb-0">
                  Ask questions about the contents of this
                  document and get answers based on the
                  uploaded material.
                </p>

              </div>

            </div>

          </div>


          <div className="col-md-4 mt-3 mt-md-0 text-md-end">

            <button
              className="btn-primary-sa"
              onClick={handleAskAI}
              disabled={
                document.status !== 'processed'
              }
            >

              <MessageSquare size={17} />

              <span>
                {document.status === 'processed'
                  ? 'Ask AI'
                  : 'Processing...'
                }
              </span>

            </button>

          </div>

        </div>

      </div>


      {/* Document information */}

      <div className="sa-card p-4 mb-4">

        <h5 className="mb-1">
          Document Information
        </h5>

        <p className="text-muted mb-4">
          Information about this uploaded study material.
        </p>


        <div className="row g-4">

          <div className="col-md-6">

            <small className="text-muted d-block mb-1">
              Filename
            </small>

            <div className="fw-semibold">
              {document.filename}
            </div>

          </div>


          <div className="col-md-6">

            <small className="text-muted d-block mb-1">
              File Type
            </small>

            <div className="fw-semibold text-uppercase">
              {document.file_type || '-'}
            </div>

          </div>


          <div className="col-md-6">

            <small className="text-muted d-block mb-1">
              Processing Status
            </small>

            <div
              className={`fw-semibold text-capitalize ${getStatusClass()}`}
            >
              {document.status}
            </div>

          </div>


          <div className="col-md-6">

            <small className="text-muted d-block mb-1">
              Indexed Chunks
            </small>

            <div className="fw-semibold">
              {chunks.length}
            </div>

          </div>


          <div className="col-md-6">

            <small className="text-muted d-block mb-1">
              Created At
            </small>

            <div className="fw-semibold">

              {document.created_at
                ? new Date(
                    document.created_at
                  ).toLocaleString()
                : '-'
              }

            </div>

          </div>

        </div>

      </div>


      {/* Delete */}

      <div className="sa-card p-4">

        <div className="d-flex justify-content-between align-items-center">

          <div>

            <h6 className="mb-1">
              Delete Document
            </h6>

            <p className="text-muted mb-0">
              Permanently remove this document and its
              indexed data.
            </p>

          </div>


          <button
            className="btn btn-outline-danger d-flex align-items-center gap-2"
            onClick={handleDelete}
            disabled={deleting}
          >

            {deleting ? (
              <Loader2
                size={17}
                className="spin"
              />
            ) : (
              <Trash2 size={17} />
            )}

            <span>
              {deleting
                ? 'Deleting...'
                : 'Delete Document'
              }
            </span>

          </button>

        </div>

      </div>

    </PageContainer>
  );
};

export default DocumentDetails;