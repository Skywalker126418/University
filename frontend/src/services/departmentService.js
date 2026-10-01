import api from './api';

// NOTE: api.js interceptor already transforms axios response → response.data
// So api.get('/departments') resolves to: { success, data: [...], pagination }
// We pass that through directly — callers access res.data for the array

const departmentService = {
  getAll: (params) => api.get('/departments', { params }),
  getById: (id) => api.get(`/departments/${id}`),
  create: (data) => api.post('/departments', data),
  update: (id, data) => api.put(`/departments/${id}`, data),
  delete: (id) => api.delete(`/departments/${id}`),
};

export default departmentService;
export { departmentService };
