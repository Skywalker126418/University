import api from './api';

export const dashboardService = {
  getDashboardData: () => api.get('/dashboard'),
  getAdminStats: () => api.get('/dashboard/admin'),
  getStudentStats: () => api.get('/dashboard/student'),
  getLecturerStats: () => api.get('/dashboard/lecturer'),
  getRegistrarStats: () => api.get('/dashboard/registrar'),
};
