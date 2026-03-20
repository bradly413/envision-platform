import axios from 'axios';
import { usePortalStore } from './store';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'https://envision-platform-production.up.railway.app/api' });

api.interceptors.request.use(config => {
  const token = usePortalStore.getState().token;
  if (token) config.headers['x-portal-token'] = token;
  return config;
});

export const portalAuth = {
  login: (slug, password) => api.post('/auth/portal-login', { slug, password }).then(r => r.data),
};

export const track = {
  event: (portalId, event_type, payload = {}) =>
    api.post(`/portals/${portalId}/events`, { event_type, payload }).catch(() => {}),
};

export const comments = {
  list: (portalId) => api.get(`/portals/${portalId}/comments`).then(r => r.data),
  add: (portalId, data) => api.post(`/portals/${portalId}/comments`, data).then(r => r.data),
};
