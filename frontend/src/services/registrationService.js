import api from './api';

export const registrationService = {
  register: (data) => api.post('/registrations', data),
  getMyRegistrations: (params) => api.get('/registrations/my', { params }),
  getAll: (params) => api.get('/registrations', { params }),
  approve: (id) => api.put(`/registrations/${id}/approve`),
  reject: (id, reason) => api.put(`/registrations/${id}/reject`, { reason }),
  cancel: (id) => api.delete(`/registrations/${id}`),
  getPeriodStatus: (params) => api.get('/registrations/periods/status', { params }),
  getPeriods: () => api.get('/registrations/periods'),
  togglePeriod: (data) => api.post('/registrations/periods/toggle', data),
  savePeriod: (data) => api.post('/registrations/periods', data),
};

export default registrationService;
