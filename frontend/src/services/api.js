import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export const TOKEN_KEY = "study_ai_token";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* =========================
   CHAT API
========================= */

export const getChatSessions = async () => {
  const response = await api.get('/chat/sessions');
  return response.data;
};

export const getChatMessages = async (sessionId) => {
  const response = await api.get(
    `/chat/sessions/${sessionId}/messages`
  );

  return response.data;
};

/* =========================
   AI TUTOR API
========================= */

// Create a tutoring session
export const createTutorSession = async (sessionData) => {
  const response = await api.post(
    "/tutor/sessions",
    sessionData
  );
  return response.data;
};

// Get all tutoring sessions
export const getTutorSessions = async () => {
  const response = await api.get("/tutor/sessions");
  return response.data;
};

// Get one session with its message history
export const getTutorSession = async (sessionId) => {
  const response = await api.get(
    `/tutor/sessions/${sessionId}`
  );
  return response.data;
};

// Send a message to the tutor
export const sendTutorMessage = async (sessionId, content) => {
  const response = await api.post(
    `/tutor/sessions/${sessionId}/messages`,
    { content }
  );
  return response.data;
};

// End a tutoring session
export const endTutorSession = async (sessionId) => {
  const response = await api.post(
    `/tutor/sessions/${sessionId}/end`
  );
  return response.data;
};

export const getTutorHint = async (sessionId) => {
  const response = await api.post(
    `/tutor/sessions/${sessionId}/hint`
  );

  return response.data;
};

// Generate an AI quick-check question
export const generateTutorQuickCheck = async (sessionId) => {
  const response = await api.post(
    `/tutor/sessions/${sessionId}/quick-check`
  );

  return response.data;
};

// Submit an answer for evaluation
export const submitTutorQuickCheck = async (
  sessionId,
  questionId,
  selectedAnswer
) => {
  const response = await api.post(
    `/tutor/sessions/${sessionId}/quick-check/${questionId}/answer`,
    { content: selectedAnswer }
  );

  return response.data;
};


/* =========================
   DOCUMENTS API
========================= */

// Get the logged-in user's uploaded documents
export const getDocuments = async () => {
  const response = await api.get("/documents/");
  return response.data;
};


/* =========================
   DASHBOARD API
========================= */

// Get dashboard statistics
export const getDashboardStats = async () => {
  const response = await api.get("/dashboard/stats");
  return response.data;
};

/* =========================
   ANALYTICS API
========================= */

export const getAnalyticsOverview = async () => {
  const response = await api.get("/analytics/overview");
  return response.data;
};

export const getAnalyticsWeakAreas = async () => {
  const response = await api.get("/analytics/weak-areas");
  return response.data;
};
export const searchDocuments = async (query, top_k = 5) => {
  const response = await api.post("/search", {
    query,
    top_k,
  });

  return response.data;
};
export default api;
