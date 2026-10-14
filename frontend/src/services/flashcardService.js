import api from './api';

/**
 * Generate a new AI flashcard set: POST /flashcards/generate
 * @param {Object} params
 * @param {number} params.documentId
 * @param {string} params.topic
 * @param {string} [params.difficulty] - 'easy' | 'medium' | 'hard'
 * @param {number} [params.cardCount] - 1 to 30
 */
export const generateFlashcards = async ({ documentId, topic, difficulty = 'medium', cardCount = 10 }) => {
  const response = await api.post('/flashcards/generate', {
    document_id: documentId,
    topic,
    difficulty,
    card_count: cardCount
  });
  return response.data;
};

/**
 * Fetch all saved flashcard sets for current user: GET /flashcards
 */
export const getFlashcardSets = async () => {
  const response = await api.get('/flashcards');
  return response.data;
};

/**
 * Fetch single flashcard set with cards: GET /flashcards/{set_id}
 * @param {number} setId
 */
export const getFlashcardSet = async (setId) => {
  const response = await api.get(`/flashcards/${setId}`);
  return response.data;
};

/**
 * Delete a flashcard set: DELETE /flashcards/{set_id}
 * @param {number} setId
 */
export const deleteFlashcardSet = async (setId) => {
  const response = await api.delete(`/flashcards/${setId}`);
  return response.data;
};

const flashcardService = {
  generateFlashcards,
  getFlashcardSets,
  getFlashcardSet,
  deleteFlashcardSet
};

export default flashcardService;
