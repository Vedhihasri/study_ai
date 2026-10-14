import api from "./api";

export const generateQuiz = async (payload) => {
  const response = await api.post("/quiz/generate", payload);
  return response.data;
};

export const getQuizzes = async () => {
  const response = await api.get("/quiz");
  return response.data;
};

export const getQuiz = async (quizId) => {
  const response = await api.get(`/quiz/${quizId}`);
  return response.data;
};

export const submitQuiz = async (quizId, answers) => {
  const response = await api.post(
    `/quiz/${quizId}/submit`,
    { answers }
  );

  return response.data;
};

export const getQuizAttempts = async (quizId) => {
  const response = await api.get(
    `/quiz/${quizId}/attempts`
  );

  return response.data;
};

export const deleteQuiz = async (quizId) => {
  const response = await api.delete(
    `/quiz/${quizId}`
  );

  return response.data;
};
