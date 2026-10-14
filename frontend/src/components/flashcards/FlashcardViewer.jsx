import React, { useState, useEffect } from 'react';
import { ProgressBar } from 'react-bootstrap';
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  RotateCcw,
  Plus,
  CheckCircle2,
  Copy,
  Check,
  HelpCircle,
  FileText
} from 'lucide-react';

const formatDifficulty = (difficulty) => {
  if (difficulty === 'easy') return { label: 'Easy', bg: 'badge-sa-ready' };
  if (difficulty === 'hard') return { label: 'Hard', bg: 'badge-sa-failed' };
  return { label: 'Medium', bg: 'badge-sa-processing' };
};

const FlashcardViewer = ({
  flashcardSet,
  onResetSet
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [copiedQuestion, setCopiedQuestion] = useState(false);
  const [copiedAnswer, setCopiedAnswer] = useState(false);

  // Reset indices when set changes
  useEffect(() => {
    setCurrentIndex(0);
    setShowAnswer(false);
    setIsCompleted(false);
  }, [flashcardSet]);

  if (!flashcardSet || !flashcardSet.flashcards || flashcardSet.flashcards.length === 0) {
    return null;
  }

  const cards = flashcardSet.flashcards;
  const totalCards = cards.length;
  const currentCard = cards[currentIndex];
  const progressPercent = Math.round(((currentIndex + 1) / totalCards) * 100);
  const diffBadge = formatDifficulty(flashcardSet.difficulty);

  const handleNext = () => {
    setShowAnswer(false);
    if (currentIndex < totalCards - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsCompleted(true);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setShowAnswer(false);
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleReviewAgain = () => {
    setCurrentIndex(0);
    setShowAnswer(false);
    setIsCompleted(false);
  };

  const handleCopyQuestion = () => {
    if (currentCard && navigator.clipboard) {
      navigator.clipboard.writeText(currentCard.question);
      setCopiedQuestion(true);
      setTimeout(() => setCopiedQuestion(false), 2000);
    }
  };

  const handleCopyAnswer = () => {
    if (currentCard && navigator.clipboard) {
      navigator.clipboard.writeText(currentCard.answer);
      setCopiedAnswer(true);
      setTimeout(() => setCopiedAnswer(false), 2000);
    }
  };

  return (
    <div className="card-sa mb-4 border-primary-subtle shadow-sm">
      {/* Header & Meta */}
      <div className="card-sa-header flex-column flex-sm-row gap-2 align-items-start align-items-sm-center">
        <div>
          <h3 className="fs-5 fw-bold text-dark mb-1">{flashcardSet.title || `${flashcardSet.topic} Flashcards`}</h3>
          <div className="d-flex align-items-center gap-2 fs-7 text-secondary">
            <span>Topic: <strong className="text-dark">{flashcardSet.topic}</strong></span>
            <span>•</span>
            <span className={`badge-sa ${diffBadge.bg}`}>{diffBadge.label}</span>
          </div>
        </div>
        <div className="text-sm-end fs-7 text-secondary">
          <span className="fw-semibold text-dark">Card {Math.min(currentIndex + 1, totalCards)}</span> of {totalCards}
        </div>
      </div>

      <div className="card-sa-body p-4">
        {/* Progress Bar */}
        <div className="mb-4">
          <div className="d-flex justify-content-between text-secondary fs-7 mb-1">
            <span>Progress</span>
            <span className="fw-semibold text-dark">{progressPercent}%</span>
          </div>
          <ProgressBar
            now={progressPercent}
            variant="indigo"
            style={{ height: '6px', backgroundColor: 'var(--bg-tertiary)' }}
          />
        </div>

        {/* Completion Screen */}
        {isCompleted ? (
          <div className="text-center py-5 px-3">
            <div
              className="p-3 rounded-circle bg-success bg-opacity-10 text-success d-inline-flex mb-3"
            >
              <CheckCircle2 size={40} />
            </div>
            <h4 className="fs-4 fw-bold text-dark mb-2">Great work!</h4>
            <p className="text-secondary fs-6 mb-4" style={{ maxWidth: '420px', margin: '0 auto' }}>
              You've completed all {totalCards} flashcards in this study set.
            </p>

            <div className="d-flex flex-column flex-sm-row justify-content-center gap-3">
              <button
                type="button"
                className="btn-secondary-sa justify-content-center py-2 px-4 fs-7"
                onClick={handleReviewAgain}
              >
                <RotateCcw size={16} />
                <span>Review Again</span>
              </button>

              <button
                type="button"
                className="btn-primary-sa justify-content-center py-2 px-4 fs-7"
                onClick={onResetSet}
              >
                <Plus size={16} />
                <span>Generate New Set</span>
              </button>
            </div>
          </div>
        ) : (
          /* Active Flashcard Display */
          <div style={{ maxWidth: '680px', margin: '0 auto' }}>
            <div
              className="card-sa p-4 p-md-5 text-center position-relative mb-4"
              style={{
                minHeight: '260px',
                backgroundColor: showAnswer ? '#FAFAFD' : 'var(--bg-secondary)',
                borderColor: showAnswer ? 'var(--primary-border)' : 'var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                transition: 'all 0.25s ease'
              }}
            >
              {/* Card Face Label */}
              <div
                className="position-absolute top-0 start-0 m-3 fs-7 fw-bold uppercase text-muted tracking-wider"
                style={{ fontSize: '0.6875rem' }}
              >
                {showAnswer ? 'ANSWER' : 'QUESTION'}
              </div>

              {/* Copy Question/Answer Helper Button */}
              <button
                type="button"
                className="btn-icon-sa position-absolute top-0 end-0 m-2"
                title={showAnswer ? 'Copy answer' : 'Copy question'}
                onClick={showAnswer ? handleCopyAnswer : handleCopyQuestion}
              >
                {(showAnswer ? copiedAnswer : copiedQuestion) ? (
                  <Check size={16} className="text-success" />
                ) : (
                  <Copy size={16} />
                )}
              </button>

              {/* Question Text */}
              <div className="w-100 my-auto">
                <h4 className="fs-5 fw-bold text-dark mb-3" style={{ lineHeight: 1.5 }}>
                  {currentCard.question}
                </h4>

                {/* Hidden / Revealed Answer */}
                {showAnswer ? (
                  <div className="pt-3 border-top border-light mt-3 animate-fade-in">
                    <p className="fs-6 text-primary mb-0 fw-medium" style={{ lineHeight: 1.6 }}>
                      {currentCard.answer}
                    </p>
                  </div>
                ) : null}
              </div>

              {/* Reveal Toggle Button */}
              <button
                type="button"
                className="btn-secondary-sa py-1.5 px-3 fs-7 mt-3"
                onClick={() => setShowAnswer((prev) => !prev)}
              >
                {showAnswer ? (
                  <>
                    <EyeOff size={16} />
                    <span>Hide Answer</span>
                  </>
                ) : (
                  <>
                    <Eye size={16} />
                    <span>Show Answer</span>
                  </>
                )}
              </button>
            </div>

            {/* Deck Navigation Bar */}
            <div className="d-flex align-items-center justify-content-between gap-3">
              <button
                type="button"
                className="btn-secondary-sa py-2 px-3 fs-7"
                onClick={handlePrevious}
                disabled={currentIndex === 0}
              >
                <ChevronLeft size={18} />
                <span className="d-none d-sm-inline">Previous</span>
              </button>

              <div className="text-muted fs-7 font-medium">
                {currentIndex + 1} of {totalCards}
              </div>

              <button
                type="button"
                className="btn-primary-sa py-2 px-3 fs-7"
                onClick={handleNext}
              >
                <span>{currentIndex === totalCards - 1 ? 'Finish' : 'Next'}</span>
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FlashcardViewer;
