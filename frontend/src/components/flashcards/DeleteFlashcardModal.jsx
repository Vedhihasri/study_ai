import React from 'react';
import { Modal, Spinner } from 'react-bootstrap';
import { AlertTriangle } from 'lucide-react';

const DeleteFlashcardModal = ({
  show,
  onHide,
  flashcardSet,
  onConfirmDelete,
  deleting = false
}) => {
  if (!flashcardSet) return null;

  return (
    <Modal show={show} onHide={onHide} centered size="sm" backdrop="static">
      <Modal.Header closeButton={!deleting} className="border-0 pb-0">
        <Modal.Title className="fs-6 fw-bold text-dark d-flex align-items-center gap-2">
          <AlertTriangle size={18} className="text-danger" />
          <span>Delete flashcard set?</span>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="text-secondary fs-7 py-3">
        Are you sure you want to permanently delete <strong className="text-dark">"{flashcardSet.title || flashcardSet.topic}"</strong>? This action cannot be undone.
      </Modal.Body>
      <Modal.Footer className="border-0 pt-0">
        <button
          type="button"
          className="btn-secondary-sa py-1 px-3 fs-7"
          onClick={onHide}
          disabled={deleting}
        >
          Cancel
        </button>
        <button
          type="button"
          className="btn-primary-sa bg-danger border-danger py-1 px-3 fs-7"
          onClick={() => onConfirmDelete(flashcardSet.id)}
          disabled={deleting}
        >
          {deleting ? (
            <>
              <Spinner animation="border" size="sm" me={1} />
              <span>Deleting...</span>
            </>
          ) : (
            <span>Delete</span>
          )}
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default DeleteFlashcardModal;
