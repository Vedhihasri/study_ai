import React, { useState, useEffect } from 'react';
import PageContainer from '../components/layout/PageContainer';
import PageHeader from '../components/common/PageHeader';
import NoteGenerator from '../components/notes/NoteGenerator';
import NotesList from '../components/notes/NotesList';
import NoteViewer from '../components/notes/NoteViewer';
import DeleteNoteModal from '../components/notes/DeleteNoteModal';
import { getDocuments } from '../services/documentService';
import notesService from '../services/noteService';
import { Download } from 'lucide-react';

const Notes = () => {
  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);

  const [notes, setNotes] = useState([]);
  const [notesLoading, setNotesLoading] = useState(true);

  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState('');

  // Viewer state
  const [selectedNote, setSelectedNote] = useState(null);
  const [showViewer, setShowViewer] = useState(false);

  // Delete modal state
  const [noteToDelete, setNoteToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    // 1. Fetch user documents
    try {
      const docs = await getDocuments();
      setDocuments(docs || []);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setDocumentsLoading(false);
    }

    // 2. Fetch user saved notes
    try {
      const savedNotes = await notesService.getNotes();
      setNotes(savedNotes || []);
    } catch (err) {
      console.error('Failed to load notes:', err);
    } finally {
      setNotesLoading(false);
    }
  };

  const handleDownloadNote = (note) => {
  const text = `${note.title}\n\n${note.content}`;

  const blob = new Blob([text], {
    type: 'text/plain;charset=utf-8'
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${note.title || 'study-notes'}.txt`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};
  const handleGenerateNote = async ({ topic, depth, style, documentId }) => {
    setGenerating(true);
    setGenerationError('');

    try {
      const newNote = await notesService.generateNote({
        topic,
        depth,
        style,
        documentId
      });

      // Prepend newly generated note to notes list
      setNotes((prevNotes) => [newNote, ...prevNotes]);

      // Open new note immediately in viewer modal
      setSelectedNote(newNote);
      setShowViewer(true);
    } catch (err) {
      console.error('Note generation failed:', err);
      let errMsg = 'Unable to generate notes right now. Please try again.';
      if (err.message) {
        errMsg = err.message;
      }
      setGenerationError(errMsg);
    } finally {
      setGenerating(false);
    }
  };

  const handleOpenNote = (note) => {
    setSelectedNote(note);
    setShowViewer(true);
  };

  const handlePromptDelete = (note) => {
    setNoteToDelete(note);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async (noteId) => {
    setDeleting(true);
    try {
      await notesService.deleteNote(noteId);
      // Remove deleted note from state
      setNotes((prevNotes) => prevNotes.filter((n) => n.id !== noteId));
      setShowDeleteModal(false);
      if (selectedNote?.id === noteId) {
        setShowViewer(false);
        setSelectedNote(null);
      }
    } catch (err) {
      console.error('Failed to delete note:', err);
      alert(err.message || 'Unable to delete this note. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  // Map document_id to filename for viewer
  const getDocumentName = (docId) => {
    if (!docId) return null;
    const found = documents.find((d) => d.id === docId);
    return found ? found.filename : null;
  };

  return (
    <PageContainer>
      <PageHeader
        title="AI Generated Notes"
        subtitle="Turn your study materials into clear, structured revision notes."
      />

      {/* Section 1: Note Generator Form */}
      <NoteGenerator
        documents={documents}
        documentsLoading={documentsLoading}
        onGenerateNote={handleGenerateNote}
        generating={generating}
        error={generationError}
      />

      {/* Section 2: Saved Notes List & Search */}
      <NotesList
        notes={notes}
        documents={documents}
        notesLoading={notesLoading}
        onOpenNote={handleOpenNote}
        onDeleteNote={handlePromptDelete}
      />

      {/* Section 3: Note Viewer Modal */}
      <NoteViewer
        show={showViewer}
        onHide={() => setShowViewer(false)}
        note={selectedNote}
        documentName={getDocumentName(selectedNote?.document_id)}
        onDelete={handlePromptDelete}
      />

      {/* Section 4: Delete Confirmation Modal */}
      <DeleteNoteModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        note={noteToDelete}
        onConfirmDelete={handleConfirmDelete}
        deleting={deleting}
      />
    </PageContainer>
  );
};

export default Notes;
