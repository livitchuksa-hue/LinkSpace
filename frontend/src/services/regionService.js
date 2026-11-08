import { api } from './api';

/** Сервис визуальных областей графа. */
export const regionService = {
  getAll: () => api.get('/regions'),
  getById: (id) => api.get(`/regions/${id}`),
  create: (payload) => api.post('/regions', payload),
  update: (id, payload) => api.put(`/regions/${id}`, payload),
  remove: (id) => api.delete(`/regions/${id}`),
};
