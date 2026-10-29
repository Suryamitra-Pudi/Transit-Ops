import api from '@/lib/api';
import { Trip } from '@/types';

export const tripService = {
  list: (params?: Record<string, string>) => api.get<Trip[]>('/trips', { params }).then((r) => r.data),
  get: (id: string) => api.get<Trip>(`/trips/${id}`).then((r) => r.data),
  create: (data: Partial<Trip>) => api.post<Trip>('/trips', data).then((r) => r.data),
  update: (id: string, data: Partial<Trip>) => api.put<Trip>(`/trips/${id}`, data).then((r) => r.data),
  dispatch: (id: string) => api.post<Trip>(`/trips/${id}/dispatch`).then((r) => r.data),
  complete: (id: string, data: { finalOdometerKm?: number; fuelConsumedL?: number }) =>
    api.post<Trip>(`/trips/${id}/complete`, data).then((r) => r.data),
  cancel: (id: string) => api.post<Trip>(`/trips/${id}/cancel`).then((r) => r.data),
};
