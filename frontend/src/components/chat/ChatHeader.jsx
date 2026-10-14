import React from 'react';
import { Dropdown, Spinner } from 'react-bootstrap';
import { PanelLeft, FileText, ChevronDown } from 'lucide-react';

const ChatHeader = ({
  onToggleMobileSidebar,
  documents = [],
  documentsLoading = false,
  selectedDoc = 'All Documents',
  onSelectDoc
}) => {
  return (
    <div className="chat-header">
      <div className="d-flex align-items-center gap-2">
        <button
          className="btn-icon-sa d-lg-none"
          onClick={onToggleMobileSidebar}
          title="Open chat history"
        >
          <PanelLeft size={18} />
        </button>

        <div>
          <h3 className="fs-6 fw-bold mb-0 text-dark">AI Study Assistant</h3>
          <span className="text-secondary fs-7" style={{ fontSize: '0.75rem' }}>
            Ask questions from your study materials
          </span>
        </div>
      </div>

      <div>
        <Dropdown align="end">
          <Dropdown.Toggle
            as="button"
            className="btn-secondary-sa py-1 px-2.5 fs-7 border"
            id="doc-selector-dropdown"
            disabled={documentsLoading}
          >
            <FileText size={15} className="text-primary" />
            <span className="text-truncate" style={{ maxWidth: '160px' }}>
              {documentsLoading ? 'Loading...' : selectedDoc}
            </span>
            <ChevronDown size={14} className="text-muted" />
          </Dropdown.Toggle>

          <Dropdown.Menu className="shadow-dropdown border-0 mt-1 p-1" style={{ fontSize: '0.8125rem' }}>
            <Dropdown.Header className="fs-7 text-uppercase fw-semibold py-1">Document Context</Dropdown.Header>
            <Dropdown.Item
              active={selectedDoc === 'All Documents'}
              onClick={() => onSelectDoc && onSelectDoc('All Documents')}
              className="rounded-2 py-1.5 fw-medium"
            >
              All Documents
            </Dropdown.Item>

            {documentsLoading ? (
              <div className="text-center py-2 text-muted fs-7">
                <Spinner animation="border" size="sm" me={1} />
                <span>Loading documents...</span>
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-2 text-muted fs-7">
                No documents uploaded
              </div>
            ) : (
              documents.map((doc) => (
                <Dropdown.Item
                  key={doc.id}
                  active={selectedDoc === doc.filename}
                  onClick={() => onSelectDoc && onSelectDoc(doc.filename)}
                  className="rounded-2 py-1.5"
                >
                  <div className="d-flex align-items-center justify-content-between gap-2">
                    <span className="text-truncate">{doc.filename}</span>
                    <span className="badge bg-light text-secondary border uppercase" style={{ fontSize: '0.65rem' }}>
                      {doc.file_type}
                    </span>
                  </div>
                </Dropdown.Item>
              ))
            )}
          </Dropdown.Menu>
        </Dropdown>
      </div>
    </div>
  );
};

export default ChatHeader;
