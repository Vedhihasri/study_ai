import React, { useState } from 'react';
import { Modal } from 'react-bootstrap';
import {
  FileText,
  Copy,
  Check,
  Trash2,
  Calendar,
  BookOpen,
  Download
} from 'lucide-react';

const formatDepthLabel = (depth) => {
  if (depth === 'quick') return 'Quick Summary';
  if (depth === 'detailed') return 'Detailed Breakdown';
  return 'Medium Depth';
};

const formatStyleLabel = (style) => {
  if (style === 'revision') return 'Revision Notes';
  if (style === 'concept_breakdown') return 'Concept Breakdown';
  if (style === 'exam_preparation') return 'Exam Preparation';
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

const NoteViewer = ({
  show,
  onHide,
  note,
  documentName,
  onDelete
}) => {
  const [copied, setCopied] = useState(false);

  if (!note) return null;

  // --------------------------------
  // Copy note
  // --------------------------------

  const handleCopy = async () => {
    if (!navigator.clipboard || !note.content) return;

    try {
      await navigator.clipboard.writeText(
        `${note.title}\n\n${note.content}`
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);

    } catch (error) {
      console.error('Failed to copy note:', error);
    }
  };

  // --------------------------------
  // Download note
  // --------------------------------

  const handleDownload = () => {
    if (!note.content) return;

    const text = `${note.title || 'Study Notes'}\n\n${note.content}`;

    const blob = new Blob(
      [text],
      {
        type: 'text/plain;charset=utf-8'
      }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');

    link.href = url;

    link.download = `${note.title || 'study-notes'}`
      .replace(/[<>:"/\\|?*]+/g, '-')
      .trim() + '.txt';

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      size="lg"
      centered
      scrollable
      backdrop="static"
    >

      {/* -------------------------------- */}
      {/* Header */}
      {/* -------------------------------- */}

      <Modal.Header
        closeButton
        className="border-bottom pb-3"
      >
        <Modal.Title className="fs-5 fw-bold text-dark d-flex align-items-center gap-2">

          <BookOpen
            size={20}
            className="text-primary"
          />

          <span>
            {note.title || `${note.topic} - AI Notes`}
          </span>

        </Modal.Title>
      </Modal.Header>


      {/* -------------------------------- */}
      {/* Body */}
      {/* -------------------------------- */}

      <Modal.Body className="p-4">

        {/* Metadata */}

        <div className="bg-light p-3 rounded-3 mb-4 border">

          <div className="row g-2 fs-7">

            {/* Topic */}

            <div className="col-12 col-sm-6">

              <span className="text-muted">
                Topic:
              </span>{' '}

              <strong className="text-dark">
                {note.topic}
              </strong>

            </div>


            {/* Source document */}

            {documentName && (
              <div className="col-12 col-sm-6 d-flex align-items-center gap-1">

                <FileText
                  size={14}
                  className="text-primary"
                />

                <span className="text-muted">
                  Source:
                </span>{' '}

                <strong className="text-dark text-truncate">
                  {documentName}
                </strong>

              </div>
            )}


            {/* Depth + Style */}

            <div className="col-12 col-sm-6">

              <span className="text-muted">
                Depth & Style:
              </span>{' '}

              <span className="badge bg-white text-dark border me-1">

                {formatDepthLabel(note.depth)}

              </span>

              <span className="badge bg-white text-primary border">

                {formatStyleLabel(note.style)}

              </span>

            </div>


            {/* Created date */}

            <div className="col-12 col-sm-6 d-flex align-items-center gap-1">

              <Calendar
                size={13}
                className="text-muted"
              />

              <span className="text-muted">
                Created:
              </span>{' '}

              <span className="text-dark">
                {formatDate(note.created_at)}
              </span>

            </div>

          </div>

        </div>


        {/* -------------------------------- */}
        {/* Note Content */}
        {/* -------------------------------- */}

        <div className="note-content-area p-3 bg-white border rounded-3">

          <h5 className="fs-6 fw-semibold text-secondary mb-3 pb-2 border-bottom">

            Generated Notes

          </h5>

          <div
            className="text-dark fs-7"
            style={{
              whiteSpace: 'pre-wrap',
              lineHeight: 1.6,
              wordBreak: 'break-word',
              fontFamily: 'var(--font-sans)'
            }}
          >

            {note.content}

          </div>

        </div>

      </Modal.Body>


      {/* -------------------------------- */}
      {/* Footer */}
      {/* -------------------------------- */}

      <Modal.Footer
        className="border-top justify-content-between p-3"
      >

        {/* Left actions */}

        <div className="d-flex align-items-center gap-2">

          {/* Copy */}

          <button
            type="button"
            className="btn-secondary-sa py-1.5 px-3 fs-7"
            onClick={handleCopy}
          >

            {copied ? (
              <>
                <Check
                  size={16}
                  className="text-success"
                />

                <span>
                  Copied
                </span>
              </>
            ) : (
              <>
                <Copy size={16} />

                <span>
                  Copy Note
                </span>
              </>
            )}

          </button>


          {/* Download */}

          <button
            type="button"
            className="btn-secondary-sa py-1.5 px-3 fs-7"
            onClick={handleDownload}
          >

            <Download size={16} />

            <span>
              Download
            </span>

          </button>

        </div>


        {/* Right actions */}

        <div className="d-flex align-items-center gap-2">

          {/* Delete */}

          <button
            type="button"
            className="btn-secondary-sa text-danger border-danger-subtle py-1.5 px-3 fs-7"
            onClick={() => {
              onHide();
              onDelete(note);
            }}
          >

            <Trash2 size={16} />

            <span>
              Delete
            </span>

          </button>


          {/* Close */}

          <button
            type="button"
            className="btn-primary-sa py-1.5 px-3 fs-7"
            onClick={onHide}
          >

            Close

          </button>

        </div>

      </Modal.Footer>

    </Modal>
  );
};

export default NoteViewer;