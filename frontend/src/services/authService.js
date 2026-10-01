import api from './api';

export const authService = {
  login: (email, password) =>
    api.post('/auth/login', { email, password }),

  logout: () =>
    api.post('/auth/logout'),

  getProfile: () =>
    api.get('/auth/me'),

  updateProfile: (data) =>
    api.put('/auth/me', data),

  changePassword: (data) =>
    api.put('/auth/me/password', data),

  verifyAdminGate: (pinOrPassword) =>
    api.post('/auth/verify-admin-gate', { pinOrPassword }),

  registerAdmin: (formData) =>
    api.post('/auth/register-admin', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  uploadProfilePhoto: (file) => {
    const formData = new FormData();
    formData.append('photo', file);
    return api.post('/users/profile-photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  uploadUserPhoto: (userId, file) => {
    const formData = new FormData();
    formData.append('photo', file);
    return api.post(`/users/${userId}/profile-photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  deleteProfilePhoto: () =>
    api.delete('/users/profile-photo'),

  deleteUserPhoto: (userId) =>
    api.delete(`/users/${userId}/profile-photo`),

  getSecurityGateSettings: () =>
    api.get('/users/security-gate'),

  updateSecurityGateSettings: (data) =>
    api.put('/users/security-gate', data),

  getRegistrars: () =>
    api.get('/users/registrars'),

  createRegistrar: (formData) =>
    api.post('/users/registrars', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};
