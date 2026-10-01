import api from './api';

export const academicYearService = {
  getAll: () => api.get('/academic-years'),
  getById: (id) => api.get(`/academic-years/${id}`),
  create: (data) => api.post('/academic-years', data),
  update: (id, data) => api.put(`/academic-years/${id}`, data),
  setCurrent: (id) => api.put(`/academic-years/${id}/set-current`),
  delete: (id) => api.delete(`/academic-years/${id}`),
};

export default academicYearService;
