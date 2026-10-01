import api from './api';

export const facultyService = {
  getAll: (params = {}) => api.get('/faculties', { params }),
  getById: (id) => api.get(`/faculties/${id}`),
  create: (data) => api.post('/faculties', data),
  update: (id, data) => api.put(`/faculties/${id}`, data),
  delete: (id) => api.delete(`/faculties/${id}`),
};
