import axios from 'axios';
import { useAuthStore } from './store';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'https://envision-platform-production.up.railway.app/api' });

api.interceptors.request.use(config => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res.data,
  err => {
    if (err.response?.status === 401) useAuthStore.getState().logout();
    return Promise.reject(err.response?.data?.error || err.message);
  }
);

export const auth = {
  login: (email, password) => api.post('/auth/login', { email, password }),
};

export const clients = {
  list: (params) => api.get('/clients', { params }),
  get: (id) => api.get(`/clients/${id}`),
  create: (data) => api.post('/clients', data),
  update: (id, data) => api.patch(`/clients/${id}`, data),
  delete: (id) => api.delete(`/clients/${id}`),
};

export const portals = {
  list: () => api.get('/portals'),
  create: (data) => api.post('/portals', data),
  update: (id, data) => api.patch(`/portals/${id}`, data),
  analytics: (id) => api.get(`/portals/${id}/analytics`),
};

export const tasks = {
  list: (params) => api.get('/tasks', { params }),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.patch(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
};

export const agents = {
  run: (agent, context) => api.post('/agents/run', { agent, context }),
};

export const analytics = {
  overview: () => api.get('/analytics/overview'),
};

export default api;
