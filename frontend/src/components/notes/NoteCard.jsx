import React from 'react';
import { FileText, Eye, Trash2, Calendar, BookOpen, Layers } from 'lucide-react';

const formatDepthLabel = (depth) => {
  if (depth === 'quick') return 'Quick';
  if (depth === 'detailed') return 'Detailed';
  return 'Medium';
};

const formatStyleLabel = (style) => {
  if (style === 'revision') return 'Revision Notes';
  if (style === 'concept_breakdown') return 'Concept Breakdown';
  if (style === 'exam_preparation') return 'Exam Prep';
  return 'Study Notes';
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

const NoteCard = ({ note, documentName, onOpen, onDelete }) => {
  return (
    <div className="card-sa card-sa-hover h-100 d-flex flex-column justify-content-between p-3.5">
      <div>
        <div className="d-flex align-items-start justify-content-between gap-2 mb-2">
          <h4 className="fs-6 fw-bold text-dark mb-0 text-truncate" title={note.title}>
            {note.title || `${note.topic} - AI Notes`}
          </h4>
          <span className="badge bg-light text-primary border border-primary-subtle fs-7 font-normal">
            {formatDepthLabel(note.depth)}
          </span>
        </div>

        <div className="mb-3">
          <div className="text-secondary fs-7 mb-1">
            <span className="fw-medium text-dark">Topic:</span> {note.topic}
          </div>
          {documentName && (
            <div className="d-flex align-items-center gap-1.5 text-muted fs-7">
              <FileText size={14} className="text-primary flex-shrink-0" />
              <span className="text-truncate">{documentName}</span>
            </div>
          )}
        </div>
      </div>

      <div className="pt-3 border-top border-light mt-2">
        <div className="d-flex align-items-center justify-content-between fs-7 text-muted mb-3">
          <span className="badge bg-secondary text-dark border-0">
            {formatStyleLabel(note.style)}
          </span>
          <div className="d-flex align-items-center gap-1">
            <Calendar size={13} />
            <span>{formatDate(note.created_at)}</span>
          </div>
        </div>

        <div className="d-flex align-items-center justify-content-between gap-2">
          <button
            type="button"
            className="btn-secondary-sa flex-grow-1 justify-content-center py-1.5 fs-7"
            onClick={() => onOpen(note)}
          >
            <Eye size={15} />
            <span>Open Note</span>
          </button>
          <button
            type="button"
            className="btn-icon-sa text-danger hover-bg-danger-subtle"
            title="Delete note"
            onClick={() => onDelete(note)}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoteCard;
