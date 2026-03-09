
import { api } from './api';

const vocabularyService = {
  // Vocabulary CRUD (Admin)
  getAll: (query = '', type = '', topicId = '') => 
    api.get(`/vocabulary-learning/vocabulary?query=${query}&type=${type}&topicId=${topicId}`),
  getById: (id) => api.get(`/vocabulary-learning/vocabulary/${id}`),
  create: (data) => api.post('/vocabulary-learning/vocabulary', data),
  update: (id, data) => api.put(`/vocabulary-learning/vocabulary/${id}`, data),
  delete: (id) => api.delete(`/vocabulary-learning/vocabulary/${id}`),
  importBulk: (formData) => api.post('/vocabulary-learning/vocabulary/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),

  // Topics
  getTopics: () => api.get('/vocabulary-learning/topics'),
  createTopic: (data) => api.post('/vocabulary-learning/topics', data),
  deleteTopic: (id) => api.delete(`/vocabulary-learning/topics/${id}`),

  // User Learning
  generateQuiz: (mode, limit = 10, topicId = '') => 
    api.get(`/vocabulary-learning/quiz/generate?mode=${mode}&limit=${limit}&topicId=${topicId}`),
  submitQuiz: (data) => api.post('/vocabulary-learning/quiz/submit', data),

  // Stats & Gamification
  getProgress: () => api.get('/vocabulary-learning/user/progress'),
  getStreak: () => api.get('/vocabulary-learning/streak'),
  getLeaderboard: (type = 'all_time') => api.get(`/vocabulary-learning/leaderboard/${type}`),
};

export default vocabularyService;
