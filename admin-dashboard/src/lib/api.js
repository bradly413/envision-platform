import axios from 'axios';
import { useAuthStore } from './store';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api' });

function isLikelyJwt(token) {
  if (typeof token !== 'string') return false;
  if (/[\u0000-\u001F\u007F\s]/.test(token)) return false;
  return /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token);
}

api.interceptors.request.use(config => {
  const token = useAuthStore.getState().token;
  if (token) {
    if (!isLikelyJwt(token)) {
      useAuthStore.getState().logout();
      return Promise.reject(new Error('Session expired — please sign in again'));
    }
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  res => res.data,
  err => {
    if (err.response?.status === 401) useAuthStore.getState().logout();
    if (!err.response && err.message === 'Network Error' && useAuthStore.getState().token) {
      return Promise.reject('Network Error — if this keeps happening, sign out and back in to refresh your admin session.');
    }
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
  updateContent: (id, content) => api.put(`/portals/${id}/content`, { content }),
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

export const ai = {
  generateBuilderContent: (payload) => api.post('/ai/builder', payload),
  generatePortalContent: (payload) => api.post('/ai/portal-editor', payload),
};

export const designSystems = {
  list: () => api.get('/design-systems'),
  create: (data) => api.post('/design-systems', data),
  fromPortal: (portalId, data) => api.post(`/design-systems/from-portal/${portalId}`, data),
  update: (id, data) => api.patch(`/design-systems/${id}`, data),
  delete: (id) => api.delete(`/design-systems/${id}`),
};

export default api;
