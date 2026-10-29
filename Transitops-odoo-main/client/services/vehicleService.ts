import api from '@/lib/api';
import { Vehicle } from '@/types';

export const vehicleService = {
  list: (params?: Record<string, string>) => api.get<Vehicle[]>('/vehicles', { params }).then((r) => r.data),
  get: (id: string) => api.get<Vehicle>(`/vehicles/${id}`).then((r) => r.data),
  create: (data: Partial<Vehicle>) => api.post<Vehicle>('/vehicles', data).then((r) => r.data),
  update: (id: string, data: Partial<Vehicle>) => api.put<Vehicle>(`/vehicles/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/vehicles/${id}`),
};
