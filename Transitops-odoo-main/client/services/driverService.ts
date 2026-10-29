import api from '@/lib/api';
import { Driver } from '@/types';

export const driverService = {
  list: (params?: Record<string, string>) => api.get<Driver[]>('/drivers', { params }).then((r) => r.data),
  get: (id: string) => api.get<Driver>(`/drivers/${id}`).then((r) => r.data),
  getMyProfile: () => api.get<Driver>('/drivers/me').then((r) => r.data),
  create: (data: Partial<Driver>) => api.post<Driver>('/drivers', data).then((r) => r.data),
  update: (id: string, data: Partial<Driver>) => api.put<Driver>(`/drivers/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/drivers/${id}`),
  expiringLicenses: (days = 30) =>
    api.get<Driver[]>('/drivers/expiring-licenses', { params: { days: String(days) } }).then((r) => r.data),
};
