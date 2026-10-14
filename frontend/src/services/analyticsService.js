import api from "./api";

export const getAnalyticsOverview = async () => {
  const response = await api.get("/analytics/overview");
  return response.data;
};

export const getAnalyticsPerformance = async () => {
  const response = await api.get("/analytics/performance");
  return response.data;
};

export const getAnalyticsTopics = async () => {
  const response = await api.get("/analytics/topics");
  return response.data;
};

export const getAnalyticsWeakAreas = async () => {
  const response = await api.get("/analytics/weak-areas");
  return response.data;
};

export const getAnalyticsStudyActivity = async () => {
  const response = await api.get("/analytics/study-activity");
  return response.data;
};