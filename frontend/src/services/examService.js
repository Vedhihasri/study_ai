import api from "./api";

export const generateExam = async (payload) => {
  const response = await api.post("/exam/generate", payload);
  return response.data;
};

export const getExam = async (examId) => {
  const response = await api.get(`/exam/${examId}`);
  return response.data;
};

export const submitExam = async (examId, answers, timeTakenSeconds) => {
  const response = await api.post(
    `/exam/${examId}/submit`,
    {
      answers,
      time_taken_seconds: timeTakenSeconds,
    }
  );

  return response.data;
};

export const getExamAttempts = async (examId) => {
  const response = await api.get(`/exam/${examId}/attempts`);
  return response.data;
};
export const getExams = async () => {
  const response = await api.get("/exam");
  return response.data;
};
