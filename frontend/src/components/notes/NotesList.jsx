import React, { useState } from 'react';
import NoteCard from './NoteCard';
import { Search, NotebookPen, SearchX } from 'lucide-react';
import { Spinner } from 'react-bootstrap';

const NotesList = ({
  notes = [],
  documents = [],
  notesLoading = false,
  onOpenNote,
  onDeleteNote
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Map document_id to filename
  const getDocumentName = (docId) => {
    if (!docId) return null;
    const found = documents.find((d) => d.id === docId);
    return found ? found.filename : null;
  };

  // Filter notes by title or topic
  const filteredNotes = notes.filter((n) => {
    const query = searchQuery.toLowerCase();
    const titleMatch = (n.title || '').toLowerCase().includes(query);
    const topicMatch = (n.topic || '').toLowerCase().includes(query);
    return titleMatch || topicMatch;
  });

  return (
    <div className="card-sa p-4">
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4">
        <div>
          <h3 className="fs-5 fw-bold mb-0 text-dark">Saved Notes</h3>
          <span className="text-secondary fs-7">Your previously generated study notes.</span>
        </div>

        {/* Search Input */}
        <div className="position-relative" style={{ maxWidth: '280px', width: '100%' }}>
          <Search
            size={16}
            className="position-absolute top-50 translate-middle-y ms-3 text-muted"
            style={{ left: 0 }}
          />
          <input
            type="text"
            className="form-control form-control-sm ps-5 py-2 fs-7 bg-light border"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {notesLoading ? (
        <div className="text-center py-5 text-muted fs-7">
          <Spinner animation="border" size="sm" me={2} />
          <span>Loading saved notes...</span>
        </div>
      ) : notes.length === 0 ? (
        <div className="text-center py-5">
          <div className="p-3 rounded-circle bg-light text-secondary d-inline-flex mb-3">
            <NotebookPen size={32} />
          </div>
          <h4 className="fs-6 fw-semibold text-dark mb-1">No saved notes yet</h4>
          <p className="text-secondary fs-7 mb-0" style={{ maxWidth: '380px', margin: '0 auto' }}>
            Use the generator above to turn your study materials into structured revision notes.
          </p>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="text-center py-5">
          <div className="p-3 rounded-circle bg-light text-secondary d-inline-flex mb-3">
            <SearchX size={32} />
          </div>
          <h4 className="fs-6 fw-semibold text-dark mb-1">No notes found</h4>
          <p className="text-secondary fs-7 mb-0">
            No notes match your search term "{searchQuery}".
          </p>
        </div>
      ) : (
        <div className="row g-3">
          {filteredNotes.map((note) => (
            <div key={note.id} className="col-12 col-md-6 col-lg-4">
              <NoteCard
                note={note}
                documentName={getDocumentName(note.document_id)}
                onOpen={onOpenNote}
                onDelete={onDeleteNote}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotesList;
