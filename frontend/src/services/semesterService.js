import api from './api';

export const semesterService = {
  getAll: (params) => api.get('/semesters', { params }),
  getById: (id) => api.get(`/semesters/${id}`),
  create: (data) => api.post('/semesters', data),
  update: (id, data) => api.put(`/semesters/${id}`, data),
  setCurrent: (id) => api.put(`/semesters/${id}/set-current`),
  delete: (id) => api.delete(`/semesters/${id}`),
};

export default semesterService;
