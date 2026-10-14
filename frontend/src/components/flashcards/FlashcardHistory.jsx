import React from 'react';
import { Layers, Play, Trash2, Calendar, FileText } from 'lucide-react';
import { Spinner } from 'react-bootstrap';

const formatDifficulty = (difficulty) => {
  if (difficulty === 'easy') return { label: 'Easy', bg: 'badge-sa-ready' };
  if (difficulty === 'hard') return { label: 'Hard', bg: 'badge-sa-failed' };
  return { label: 'Medium', bg: 'badge-sa-processing' };
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const FlashcardHistory = ({
  sets = [],
  documents = [],
  setsLoading = false,
  onSelectSet,
  onDeleteSet
}) => {
  const getDocumentName = (docId) => {
    if (!docId) return null;
    const found = documents.find((d) => d.id === docId);
    return found ? found.filename : null;
  };

  return (
    <div className="card-sa p-4">
      <div className="d-flex align-items-center gap-2 mb-4">
        <Layers size={20} className="text-primary" />
        <div>
          <h3 className="fs-5 fw-bold mb-0 text-dark">Saved Flashcard Sets</h3>
          <span className="text-secondary fs-7">Your previously generated study decks.</span>
        </div>
      </div>

      {setsLoading ? (
        <div className="text-center py-5 text-muted fs-7">
          <Spinner animation="border" size="sm" me={2} />
          <span>Loading flashcard sets...</span>
        </div>
      ) : sets.length === 0 ? (
        <div className="text-center py-5">
          <div className="p-3 rounded-circle bg-light text-secondary d-inline-flex mb-3">
            <Layers size={32} />
          </div>
          <h4 className="fs-6 fw-semibold text-dark mb-1">Create your first flashcard set</h4>
          <p className="text-secondary fs-7 mb-0" style={{ maxWidth: '380px', margin: '0 auto' }}>
            Select a study document and generate AI-powered flashcards to test your understanding.
          </p>
        </div>
      ) : (
        <div className="row g-3">
          {sets.map((set) => {
            const diffBadge = formatDifficulty(set.difficulty);
            const docName = getDocumentName(set.document_id);

            return (
              <div key={set.id} className="col-12 col-md-6 col-lg-4">
                <div className="card-sa card-sa-hover h-100 d-flex flex-column justify-content-between p-3.5">
                  <div>
                    <div className="d-flex align-items-start justify-content-between gap-2 mb-2">
                      <h4 className="fs-6 fw-bold text-dark mb-0 text-truncate" title={set.title}>
                        {set.title || `${set.topic} Flashcards`}
                      </h4>
                      <span className={`badge-sa ${diffBadge.bg}`}>{diffBadge.label}</span>
                    </div>

                    <div className="mb-3">
                      <div className="text-secondary fs-7 mb-1">
                        <span className="fw-medium text-dark">Topic:</span> {set.topic}
                      </div>
                      {docName && (
                        <div className="d-flex align-items-center gap-1.5 text-muted fs-7">
                          <FileText size={14} className="text-primary flex-shrink-0" />
                          <span className="text-truncate">{docName}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-top border-light mt-2">
                    <div className="d-flex align-items-center justify-content-between fs-7 text-muted mb-3">
                      <span className="badge bg-secondary text-dark border-0">
                        {set.card_count || set.flashcards?.length || 0} Cards
                      </span>
                      <div className="d-flex align-items-center gap-1">
                        <Calendar size={13} />
                        <span>{formatDate(set.created_at)}</span>
                      </div>
                    </div>

                    <div className="d-flex align-items-center justify-content-between gap-2">
                      <button
                        type="button"
                        className="btn-primary-sa flex-grow-1 justify-content-center py-1.5 fs-7"
                        onClick={() => onSelectSet(set)}
                      >
                        <Play size={14} />
                        <span>Study Set</span>
                      </button>
                      <button
                        type="button"
                        className="btn-icon-sa text-danger hover-bg-danger-subtle"
                        title="Delete flashcard set"
                        onClick={() => onDeleteSet(set)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FlashcardHistory;
