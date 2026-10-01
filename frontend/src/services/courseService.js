import api from './api';

export const courseService = {
  getAll: (params) => api.get('/courses', { params }),
  getById: (id) => api.get(`/courses/${id}`),
  create: (data) => api.post('/courses', data),
  update: (id, data) => api.put(`/courses/${id}`, data),
  delete: (id) => api.delete(`/courses/${id}`),
  getEnrolled: (id) => api.get(`/courses/${id}/students`),
  getAvailable: (params) => api.get('/courses/available', { params }),
};
