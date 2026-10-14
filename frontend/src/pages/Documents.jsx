import React, { useEffect, useRef, useState } from 'react';
import {
  FileText,
  Upload,
  Trash2,
  Eye,
  MessageSquare,
  RefreshCw,
  X,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

import PageContainer from '../components/layout/PageContainer';
import PageHeader from '../components/common/PageHeader';
import EmptyState from '../components/common/EmptyState';

import {
  getDocuments,
  uploadDocument,
  deleteDocument
} from '../services/documentService';

import { useNavigate } from 'react-router-dom';

const Documents = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');

  const [selectedDocument, setSelectedDocument] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // ---------------------------------------
  // Load documents
  // ---------------------------------------

  const loadDocuments = async () => {
    try {
      setLoading(true);

      const data = await getDocuments();

      setDocuments(data || []);
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  // ---------------------------------------
  // Open file selector
  // ---------------------------------------

  const handleUploadClick = () => {
    setUploadError('');
    setUploadSuccess('');

    fileInputRef.current?.click();
  };

  // ---------------------------------------
  // Upload document
  // ---------------------------------------

  const handleFileSelected = async (event) => {
    const file = event.target.files?.[0];

    // Reset input so the same file can be selected again
    event.target.value = '';

    if (!file) {
      return;
    }

    const allowedTypes = ['pdf', 'docx', 'txt'];

    const extension = file.name
      .split('.')
      .pop()
      ?.toLowerCase();

    if (!allowedTypes.includes(extension)) {
      setUploadError(
        'Only PDF, DOCX and TXT files are supported.'
      );

      return;
    }

    const formData = new FormData();

    formData.append('file', file);

    try {
      setUploading(true);
      setUploadError('');
      setUploadSuccess('');

      await uploadDocument(formData);

      setUploadSuccess(
        `${file.name} uploaded and processed successfully.`
      );

      await loadDocuments();

    } catch (error) {
      console.error('Upload failed:', error);

      const message =
        error?.response?.data?.detail ||
        'Failed to upload the document. Please try again.';

      setUploadError(message);

    } finally {
      setUploading(false);
    }
  };

  // ---------------------------------------
  // Delete document
  // ---------------------------------------

  const handleDelete = async (document) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${document.filename}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(document.id);

      await deleteDocument(document.id);

      setDocuments((prev) =>
        prev.filter((item) => item.id !== document.id)
      );

      if (selectedDocument?.id === document.id) {
        setSelectedDocument(null);
      }

    } catch (error) {
      console.error('Delete failed:', error);

      alert(
        error?.response?.data?.detail ||
        'Failed to delete the document.'
      );

    } finally {
      setDeletingId(null);
    }
  };

  // ---------------------------------------
  // Ask AI about document
  // ---------------------------------------

  const handleAskAI = (document) => {
    if (document.status !== 'processed') {
      return;
    }

    navigate(`/chat?document=${document.id}`);
  };

  // ---------------------------------------
  // View document details
  // ---------------------------------------

  const handleView = (document) => {
    setSelectedDocument(document);
  };

  // ---------------------------------------
  // Status UI
  // ---------------------------------------

  const renderStatus = (status) => {
    if (status === 'processed') {
      return (
        <span className="badge bg-success-subtle text-success d-inline-flex align-items-center gap-1">
          <CheckCircle size={13} />
          Processed
        </span>
      );
    }

    if (status === 'pending') {
      return (
        <span className="badge bg-warning-subtle text-warning-emphasis d-inline-flex align-items-center gap-1">
          <Loader2 size={13} />
          Processing
        </span>
      );
    }

    if (status === 'failed') {
      return (
        <span className="badge bg-danger-subtle text-danger d-inline-flex align-items-center gap-1">
          <AlertCircle size={13} />
          Failed
        </span>
      );
    }

    return (
      <span className="badge bg-secondary-subtle text-secondary">
        {status || 'Unknown'}
      </span>
    );
  };

  // ---------------------------------------
  // Loading
  // ---------------------------------------

  if (loading) {
    return (
      <PageContainer>
        <PageHeader
          title="Documents Library"
          subtitle="Manage the study materials your AI assistant uses."
          action={
            <button
              className="btn-primary-sa"
              onClick={handleUploadClick}
              disabled
            >
              <Upload size={16} />
              Upload Document
            </button>
          }
        />

        <div className="card-sa p-5 text-center">
          <RefreshCw
            size={28}
            className="text-primary mb-3"
          />

          <p className="text-secondary mb-0">
            Loading your documents...
          </p>
        </div>
      </PageContainer>
    );
  }

  // ---------------------------------------
  // Main UI
  // ---------------------------------------

  return (
    <PageContainer>

      {/* Header */}
      <PageHeader
        title="Documents Library"
        subtitle="Manage the study materials your AI assistant uses."
        action={
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt"
              className="d-none"
              onChange={handleFileSelected}
            />

            <button
              className="btn-primary-sa"
              onClick={handleUploadClick}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2
                    size={16}
                    className="spinner-border"
                  />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={16} />
                  Upload Document
                </>
              )}
            </button>
          </>
        }
      />

      {/* Success message */}
      {uploadSuccess && (
        <div className="alert alert-success d-flex align-items-center gap-2 mb-4">
          <CheckCircle size={18} />
          <span>{uploadSuccess}</span>

          <button
            type="button"
            className="btn-close ms-auto"
            onClick={() => setUploadSuccess('')}
          />
        </div>
      )}

      {/* Error message */}
      {uploadError && (
        <div className="alert alert-danger d-flex align-items-center gap-2 mb-4">
          <AlertCircle size={18} />
          <span>{uploadError}</span>

          <button
            type="button"
            className="btn-close ms-auto"
            onClick={() => setUploadError('')}
          />
        </div>
      )}

      {/* Empty state */}
      {documents.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No documents yet"
          description="Upload your study materials in PDF, DOCX, or TXT format to start asking questions with StudyAI."
          action={
            <button
              className="btn-primary-sa"
              onClick={handleUploadClick}
            >
              <Upload size={16} />
              Upload Your First Document
            </button>
          }
        />
      ) : (
        <>
          {/* Document count */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <span className="fw-semibold">
                Your Documents
              </span>

              <span className="text-secondary ms-2 fs-7">
                {documents.length}{' '}
                {documents.length === 1
                  ? 'document'
                  : 'documents'}
              </span>
            </div>

            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={loadDocuments}
              disabled={loading}
            >
              <RefreshCw size={14} />
            </button>
          </div>

          {/* Document list */}
          <div className="d-flex flex-column gap-3">

            {documents.map((document) => (
              <div
                key={document.id}
                className="card-sa p-3"
              >
                <div className="d-flex align-items-center gap-3">

                  {/* File icon */}
                  <div
                    className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                    style={{
                      width: 46,
                      height: 46,
                      backgroundColor: 'var(--primary-light)',
                      color: 'var(--primary)'
                    }}
                  >
                    <FileText size={22} />
                  </div>

                  {/* Information */}
                  <div className="flex-grow-1 min-width-0">

                    <div className="d-flex flex-wrap align-items-center gap-2 mb-1">

                      <h6 className="mb-0 text-truncate">
                        {document.filename}
                      </h6>

                      {renderStatus(document.status)}

                    </div>

                    <div className="text-secondary fs-7">

                      {document.file_type?.toUpperCase()}

                      {document.created_at && (
                        <>
                          <span className="mx-2">
                            •
                          </span>

                          {new Date(
                            document.created_at
                          ).toLocaleDateString()}
                        </>
                      )}

                    </div>

                  </div>

                  {/* Actions */}
                  <div className="d-flex align-items-center gap-2 flex-shrink-0">

                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() =>
                        handleView(document)
                      }
                      title="View details"
                    >
                      <Eye size={15} />
                      <span className="d-none d-md-inline ms-1">
                        View
                      </span>
                    </button>

                    <button
                      className="btn btn-sm btn-primary"
                      disabled={
                        document.status !== 'processed'
                      }
                      onClick={() =>
                        handleAskAI(document)
                      }
                      title={
                        document.status === 'processed'
                          ? 'Ask AI'
                          : 'Document is still processing'
                      }
                    >
                      <MessageSquare size={15} />
                      <span className="d-none d-md-inline ms-1">
                        Ask AI
                      </span>
                    </button>

                    <button
                      className="btn btn-sm btn-outline-danger"
                      disabled={
                        deletingId === document.id
                      }
                      onClick={() =>
                        handleDelete(document)
                      }
                      title="Delete document"
                    >
                      {deletingId === document.id ? (
                        <Loader2
                          size={15}
                          className="spinner-border"
                        />
                      ) : (
                        <Trash2 size={15} />
                      )}
                    </button>

                  </div>

                </div>
              </div>
            ))}

          </div>
        </>
      )}

      {/* -------------------------------- */}
      {/* Document Details Modal */}
      {/* -------------------------------- */}

      {selectedDocument && (
        <div
          className="modal d-block"
          tabIndex="-1"
          style={{
            backgroundColor: 'rgba(0,0,0,0.45)'
          }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">

              <div className="modal-header">

                <div>
                  <h5 className="modal-title mb-1">
                    {selectedDocument.filename}
                  </h5>

                  <div className="text-secondary fs-7">
                    Document details
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-sm btn-light"
                  onClick={() =>
                    setSelectedDocument(null)
                  }
                >
                  <X size={18} />
                </button>

              </div>

              <div className="modal-body">

                <div className="row g-3">

                  <div className="col-md-6">
                    <div className="text-secondary fs-7">
                      File type
                    </div>

                    <div className="fw-semibold">
                      {selectedDocument.file_type?.toUpperCase()}
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="text-secondary fs-7">
                      Status
                    </div>

                    <div className="mt-1">
                      {renderStatus(
                        selectedDocument.status
                      )}
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="text-secondary fs-7">
                      Document ID
                    </div>

                    <div className="fw-semibold">
                      #{selectedDocument.id}
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="text-secondary fs-7">
                      Uploaded
                    </div>

                    <div className="fw-semibold">
                      {selectedDocument.created_at
                        ? new Date(
                            selectedDocument.created_at
                          ).toLocaleString()
                        : 'Unknown'}
                    </div>
                  </div>

                </div>

                <div className="alert alert-light mt-4 mb-0">
                  <div className="d-flex gap-2">

                    <FileText
                      size={18}
                      className="text-primary flex-shrink-0"
                    />

                    <div className="fs-7">
                      StudyAI uses this document's extracted
                      content and indexed embeddings to answer
                      your questions. You don't need to view
                      the extracted chunks directly.
                    </div>

                  </div>
                </div>

              </div>

              <div className="modal-footer">

                <button
                  className="btn btn-light"
                  onClick={() =>
                    setSelectedDocument(null)
                  }
                >
                  Close
                </button>

                <button
                  className="btn btn-primary"
                  disabled={
                    selectedDocument.status !== 'processed'
                  }
                  onClick={() => {
                    setSelectedDocument(null);
                    handleAskAI(selectedDocument);
                  }}
                >
                  <MessageSquare size={16} />
                  Ask AI
                </button>

              </div>

            </div>
          </div>
        </div>
      )}

    </PageContainer>
  );
};

export default Documents;