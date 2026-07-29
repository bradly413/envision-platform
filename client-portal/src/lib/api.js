import axios from 'axios';
import { usePortalStore } from './store';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api' });

api.interceptors.request.use(config => {
  const token = usePortalStore.getState().token;
  if (token) config.headers['x-portal-token'] = token;
  return config;
});

export const portalAuth = {
  login: (slug, password) => api.post('/portals/login', { slug, password }).then(r => r.data),
};

const SILENT_TRACK_EVENTS = new Set([
  'login',
  'scroll',
  'section_view',
  'video_play',
  'presentation_open',
  'slide_view',
  'logout',
  'comment',
]);

export const track = {
  // Analytics beacons may fail silently; approve/revision must surface errors
  // so the UI never claims a decision was recorded when it was not.
  event: (portalId, event_type, payload = {}) => {
    const request = api.post(`/portals/${portalId}/events`, { event_type, payload });
    if (SILENT_TRACK_EVENTS.has(event_type)) {
      return request.catch(() => {});
    }
    return request.then((r) => r.data);
  },
};

export const portalAi = {
  chat: (portalId, message, conversationId) =>
    api.post(`/portals/${portalId}/ai/chat`, { message, conversationId }).then(r => r.data),
};
