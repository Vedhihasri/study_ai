import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, FileText, Upload, AlertCircle, Sparkles } from 'lucide-react';
import { Spinner } from 'react-bootstrap';

const difficultyOptions = [
  { value: 'easy', label: 'Easy (Basic Definitions & Concepts)' },
  { value: 'medium', label: 'Medium (Standard Balanced Deck)' },
  { value: 'hard', label: 'Hard (Challenging & Deep Recall)' }
];

const cardCountOptions = [5, 10, 15, 20];

const FlashcardGenerator = ({
  documents = [],
  documentsLoading = false,
  onGenerateFlashcards,
  generating = false,
  error = ''
}) => {
  const navigate = useNavigate();

  const [documentId, setDocumentId] = useState('');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [cardCount, setCardCount] = useState(5);
  const [validationError, setValidationError] = useState('');

  // Filter processed documents
  const processedDocuments = documents.filter((doc) => doc.status === 'processed');

  // Auto-select first processed document when documents load
  useEffect(() => {
    if (processedDocuments.length > 0 && !documentId) {
      setDocumentId(processedDocuments[0].id.toString());
    }
  }, [documents]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError('');

    if (!documentId) {
      setValidationError('Please select a processed study document.');
      return;
    }
    if (!topic.trim()) {
      setValidationError('Please enter a topic to generate flashcards.');
      return;
    }

    onGenerateFlashcards({
      documentId: parseInt(documentId, 10),
      topic: topic.trim(),
      difficulty,
      cardCount: parseInt(cardCount, 10)
    });
  };

  return (
    <div className="card-sa mb-4">
      <div className="card-sa-header">
        <div className="d-flex align-items-center gap-2">
          <div
            className="p-2 rounded-2"
            style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}
          >
            <Layers size={18} />
          </div>
          <div>
            <h3 className="fs-6 fw-bold mb-0">Generate Flashcards</h3>
            <span className="text-secondary fs-7">
              Select a study document and topic to generate interactive AI-powered flashcards.
            </span>
          </div>
        </div>
      </div>

      <div className="card-sa-body">
        {/* Error Alert */}
        {(error || validationError) && (
          <div className="alert alert-danger d-flex align-items-center gap-2 py-2 px-3 fs-7 mb-3 border-0 bg-danger bg-opacity-10 text-danger rounded-3">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{validationError || error}</span>
          </div>
        )}

        {documentsLoading ? (
          <div className="text-center py-4 text-muted fs-7">
            <Spinner animation="border" size="sm" me={2} />
            <span>Loading uploaded documents...</span>
          </div>
        ) : processedDocuments.length === 0 ? (
          <div className="text-center py-4 px-3 bg-light rounded-3">
            <FileText size={32} className="text-muted mb-2" />
            <h4 className="fs-6 fw-semibold text-dark mb-1">No processed documents available</h4>
            <p className="text-secondary fs-7 mb-3" style={{ maxWidth: '420px', margin: '0 auto' }}>
              Upload and process a study document (PDF, DOCX, or TXT) first before generating flashcards.
            </p>
            <button
              type="button"
              className="btn-primary-sa"
              onClick={() => navigate('/documents')}
            >
              <Upload size={16} />
              <span>Go to Documents</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="row g-3 mb-3">
              {/* Document Selector */}
              <div className="col-12 col-md-6">
                <label className="form-label text-secondary fs-7 fw-medium mb-1">
                  Study Document <span className="text-danger">*</span>
                </label>
                <select
                  className="form-select fs-7 py-2"
                  value={documentId}
                  onChange={(e) => setDocumentId(e.target.value)}
                  disabled={generating}
                  required
                >
                  <option value="" disabled>-- Select a Processed Document --</option>
                  {documents.map((doc) => (
                    <option
                      key={doc.id}
                      value={doc.id}
                      disabled={doc.status !== 'processed'}
                    >
                      📄 {doc.filename} {doc.status !== 'processed' ? `(${doc.status})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Topic Input */}
              <div className="col-12 col-md-6">
                <label className="form-label text-secondary fs-7 fw-medium mb-1">
                  Topic <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control fs-7 py-2"
                  placeholder="e.g. Reflection of Light"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  disabled={generating}
                  required
                />
              </div>
            </div>

            <div className="row g-3 mb-4">
              {/* Difficulty Selector */}
              <div className="col-12 col-md-6">
                <label className="form-label text-secondary fs-7 fw-medium mb-1">Difficulty</label>
                <select
                  className="form-select fs-7 py-2"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  disabled={generating}
                >
                  {difficultyOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Number of Cards Selector */}
              <div className="col-12 col-md-6">
                <label className="form-label text-secondary fs-7 fw-medium mb-1">Number of Cards</label>
                <select
                  className="form-select fs-7 py-2"
                  value={cardCount}
                  onChange={(e) => setCardCount(e.target.value)}
                  disabled={generating}
                >
                  {cardCountOptions.map((count) => (
                    <option key={count} value={count}>
                      {count} Cards
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="d-flex justify-content-end">
              <button
                type="submit"
                className="btn-primary-sa py-2 px-4 fs-7"
                disabled={generating}
              >
                {generating ? (
                  <>
                    <Spinner animation="border" size="sm" me={2} />
                    <span>Generating flashcards...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Generate Flashcards</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default FlashcardGenerator;
