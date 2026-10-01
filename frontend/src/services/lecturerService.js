import api from './api';

// NOTE: api.js interceptor already transforms axios response → response.data
// So api.get('/lecturers') resolves to: { success, data: [...], pagination }
// Do NOT add .then(r => r.data) — that would double-unwrap

const lecturerService = {
  getAll: (params) => api.get('/lecturers', { params }),
  getById: (id) => api.get(`/lecturers/${id}`),
  create: (data) => api.post('/lecturers', data),
  update: (id, data) => api.put(`/lecturers/${id}`, data),
  delete: (id) => api.delete(`/lecturers/${id}`),
  getMyProfile: () => api.get('/lecturers/me'),
  getCourses: (id) => api.get(`/lecturers/${id}/courses`),
};

export default lecturerService;
export { lecturerService };
