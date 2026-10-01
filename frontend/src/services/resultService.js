import api from './api';

export const resultService = {
  getMyResults: (params) => api.get('/results/my', { params }),
  getByStudent: (studentId, params) => api.get(`/results/student/${studentId}`, { params }),
  getByCourse: (courseId) => api.get(`/results/course/${courseId}`),
  enterResults: (data) => api.post('/results', data),
  enterBulk: (data) => api.post('/results/bulk', data),
  updateResult: (id, data) => api.put(`/results/${id}`, data),
  getGPA: () => api.get('/results/gpa'),
};
