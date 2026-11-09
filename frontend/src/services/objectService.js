import { api } from './api';

/** Сервис информационных объектов. */
export const objectService = {
  getAll: () => api.get('/objects'),
  getById: (id) => api.get(`/objects/${id}`),
  create: (payload) => api.post('/objects', payload),
  update: (id, payload) => api.put(`/objects/${id}`, payload),
  updatePosition: (id, position) => api.put(`/objects/${id}/position`, position),
  markOpened: (id) => api.post(`/objects/${id}/open`),
  remove: (id) => api.delete(`/objects/${id}`),
};
