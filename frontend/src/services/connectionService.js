import { api } from './api';

/** Сервис связей между узлами. */
export const connectionService = {
  getAll: () => api.get('/connections'),
  getById: (id) => api.get(`/connections/${id}`),
  create: (payload) => api.post('/connections', payload),
  update: (id, payload) => api.put(`/connections/${id}`, payload),
  remove: (id) => api.delete(`/connections/${id}`),
};
