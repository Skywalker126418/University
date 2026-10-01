import api from './api';

export const timetableService = {
  getMy: (params) => api.get('/timetable/my', { params }),
  getAll: (params) => api.get('/timetable', { params }),
  getTimetable: (params) => api.get('/timetable', { params }),
  create: (data) => api.post('/timetable', data),
  update: (id, data) => api.put(`/timetable/${id}`, data),
  delete: (id) => api.delete(`/timetable/${id}`),
};
