import api from './api';

/**
 * Fetch all saved notes for current user: GET /notes
 */
export const getNotes = async () => {
  const response = await api.get('/notes');
  return response.data;
};

/**
 * Fetch single note by ID: GET /notes/{note_id}
 * @param {number} noteId
 */
export const getNote = async (noteId) => {
  const response = await api.get(`/notes/${noteId}`);
  return response.data;
};

/**
 * Generate AI study notes using document RAG context: POST /notes/generate
 * @param {Object} params
 * @param {string} params.topic
 * @param {string} [params.depth] - 'quick' | 'medium' | 'detailed'
 * @param {string} [params.style] - 'study_notes' | 'revision' | 'concept_breakdown' | 'exam_preparation'
 * @param {number} params.documentId
 */
export const generateNote = async ({ topic, depth = 'medium', style = 'study_notes', documentId }) => {
  const response = await api.post('/notes/generate', {
    topic,
    depth,
    style,
    document_id: documentId
  });
  return response.data;
};

/**
 * Create a manual note: POST /notes
 * @param {Object} noteData
 */
export const createNote = async (noteData) => {
  const response = await api.post('/notes', noteData);
  return response.data;
};

/**
 * Delete a note by ID: DELETE /notes/{note_id}
 * @param {number} noteId
 */
export const deleteNote = async (noteId) => {
  const response = await api.delete(`/notes/${noteId}`);
  return response.data;
};

const notesService = {
  getNotes,
  getNote,
  generateNote,
  createNote,
  deleteNote
};

export default notesService;
