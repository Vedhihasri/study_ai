import React, { useState, useEffect, useRef } from 'react';
import PageContainer from '../components/layout/PageContainer';
import PageHeader from '../components/common/PageHeader';
import FlashcardGenerator from '../components/flashcards/FlashcardGenerator';
import FlashcardViewer from '../components/flashcards/FlashcardViewer';
import FlashcardHistory from '../components/flashcards/FlashcardHistory';
import DeleteFlashcardModal from '../components/flashcards/DeleteFlashcardModal';
import { getDocuments } from '../services/documentService';
import flashcardService from '../services/flashcardService';

const Flashcards = () => {
  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);

  const [flashcardSets, setFlashcardSets] = useState([]);
  const [setsLoading, setSetsLoading] = useState(true);

  const [activeSet, setActiveSet] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState('');

  // Delete modal state
  const [setToDelete, setSetToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const viewerRef = useRef(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    // Fetch documents
    try {
      const docs = await getDocuments();
      setDocuments(docs || []);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setDocumentsLoading(false);
    }

    // Fetch saved flashcard sets
    try {
      const sets = await flashcardService.getFlashcardSets();
      setFlashcardSets(sets || []);
    } catch (err) {
      console.error('Failed to load flashcard sets:', err);
    } finally {
      setSetsLoading(false);
    }
  };

  const handleGenerateFlashcards = async ({ documentId, topic, difficulty, cardCount }) => {
    setGenerating(true);
    setGenerationError('');

    try {
      const generatedSet = await flashcardService.generateFlashcards({
        documentId,
        topic,
        difficulty,
        cardCount
      });

      setActiveSet(generatedSet);
      setFlashcardSets((prev) => [generatedSet, ...prev]);

      // Scroll smoothly to active deck viewer
      setTimeout(() => {
        viewerRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      console.error('Flashcard generation failed:', err);
      let errMsg = 'Unable to generate flashcards right now. Please try again.';
      if (err.message) {
        errMsg = err.message;
      }
      setGenerationError(errMsg);
    } finally {
      setGenerating(false);
    }
  };

  const handleSelectSet = async (set) => {
    try {
      // Fetch full set with flashcards array if needed
      const fullSet = await flashcardService.getFlashcardSet(set.id);
      setActiveSet(fullSet);
    } catch (err) {
      console.error(`Failed to load flashcard set ${set.id}:`, err);
      setActiveSet(set);
    }

    setTimeout(() => {
      viewerRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handlePromptDeleteSet = (set) => {
    setSetToDelete(set);
    setShowDeleteModal(true);
  };

  const handleConfirmDeleteSet = async (setId) => {
    setDeleting(true);
    try {
      await flashcardService.deleteFlashcardSet(setId);
      setFlashcardSets((prev) => prev.filter((s) => s.id !== setId));
      setShowDeleteModal(false);
      if (activeSet?.id === setId) {
        setActiveSet(null);
      }
    } catch (err) {
      console.error('Failed to delete flashcard set:', err);
      alert(err.message || 'Unable to delete this flashcard set. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="AI Flashcards"
        subtitle="Turn your study documents into interactive flashcards."
      />

      {/* Generator Section */}
      <FlashcardGenerator
        documents={documents}
        documentsLoading={documentsLoading}
        onGenerateFlashcards={handleGenerateFlashcards}
        generating={generating}
        error={generationError}
      />

      {/* Active Deck Viewer Section */}
      <div ref={viewerRef}>
        {activeSet && (
          <FlashcardViewer
            flashcardSet={activeSet}
            onResetSet={() => setActiveSet(null)}
          />
        )}
      </div>

      {/* History Section */}
      <FlashcardHistory
        sets={flashcardSets}
        documents={documents}
        setsLoading={setsLoading}
        onSelectSet={handleSelectSet}
        onDeleteSet={handlePromptDeleteSet}
      />

      {/* Delete Confirmation Modal */}
      <DeleteFlashcardModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        flashcardSet={setToDelete}
        onConfirmDelete={handleConfirmDeleteSet}
        deleting={deleting}
      />
    </PageContainer>
  );
};

export default Flashcards;
