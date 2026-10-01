import api from './api';

export const reportService = {
  getEnrollmentReport: (params) => api.get('/reports/enrollment', { params }),
  getResultsReport: (params) => api.get('/reports/results', { params }),
  getRegistrationReport: (params) => api.get('/reports/registrations', { params }),
  exportPDF: (type, params) => api.get(`/reports/${type}/export`, { params, responseType: 'blob' }),
};
