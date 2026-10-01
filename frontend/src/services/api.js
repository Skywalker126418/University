import axios from 'axios';

// Use relative /api so requests go through the Vite proxy — avoids CORS issues
// regardless of whether the user opens localhost or 127.0.0.1
const BASE_URL = '/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor: attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('ums_token') || localStorage.getItem('ums_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401, normalize errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem('ums_token');
      sessionStorage.removeItem('ums_user');
      localStorage.removeItem('ums_token');
      localStorage.removeItem('ums_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'An unexpected error occurred';

    return Promise.reject({ ...error, message });
  }
);

export default api;
