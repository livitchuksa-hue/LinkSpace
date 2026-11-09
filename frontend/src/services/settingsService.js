import { api } from './api';

/** Настройки рабочего пространства, сохраняемые в SQLite. */
export const settingsService = {
  getAll: () => api.get('/settings'),
  get: async (key) => {
    const result = await api.get(`/settings/${encodeURIComponent(key)}`);
    return result?.value ?? null;
  },
  set: (key, value) => api.put(`/settings/${encodeURIComponent(key)}`, { value: String(value) }),
  remove: (key) => api.delete(`/settings/${encodeURIComponent(key)}`),
};
