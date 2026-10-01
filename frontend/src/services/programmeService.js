import api from './api';

export const programmeService = {
  getAll: (params = {}) => api.get('/programmes', { params }),
  getById: (id) => api.get(`/programmes/${id}`),
  create: (data) => api.post('/programmes', data),
  update: (id, data) => api.put(`/programmes/${id}`, data),
  delete: (id) => api.delete(`/programmes/${id}`),
};
