import api from './api';

/**
 * Fetch all documents belonging to the current user.
 * GET /documents
 */
export const getDocuments = async () => {
  const response = await api.get('/documents');
  return response.data;
};


/**
 * Upload a new document.
 * Supported: PDF, DOCX, TXT
 *
 * POST /documents/upload
 *
 * @param {FormData} formData
 */
export const uploadDocument = async (formData) => {
  const response = await api.post(
    '/documents/upload',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }
  );

  return response.data;
};


/**
 * Get details of a specific document.
 *
 * GET /documents/{documentId}
 *
 * @param {number} documentId
 */
export const getDocument = async (documentId) => {
  const response = await api.get(
    `/documents/${documentId}`
  );

  return response.data;
};


/**
 * Delete a document.
 *
 * DELETE /documents/{documentId}
 *
 * This also removes:
 * - uploaded file
 * - PostgreSQL document record
 * - Pinecone vectors
 *
 * @param {number} documentId
 */
export const deleteDocument = async (documentId) => {
  const response = await api.delete(
    `/documents/${documentId}`
  );

  return response.data;
};


const documentService = {
  getDocuments,
  uploadDocument,
  getDocument,
  deleteDocument
};

export default documentService;