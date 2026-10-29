import api from '@/lib/api';
import { FuelLog, Expense } from '@/types';

export const fuelService = {
  list: (params?: Record<string, string>) => api.get<FuelLog[]>('/fuel-logs', { params }).then((r) => r.data),
  create: (data: { vehicleId: string; liters: number; cost: number; date?: string }) =>
    api.post<FuelLog>('/fuel-logs', data).then((r) => r.data),
  update: (id: string, data: { vehicleId?: string; liters?: number; cost?: number; date?: string }) =>
    api.put<FuelLog>(`/fuel-logs/${id}`, data).then((r) => r.data),
  approve: (id: string) => api.post<FuelLog>(`/fuel-logs/${id}/approve`).then((r) => r.data),
  reject: (id: string) => api.post(`/fuel-logs/${id}/reject`),
  remove: (id: string) => api.delete(`/fuel-logs/${id}`),
};

export const expenseService = {
  list: (params?: Record<string, string>) => api.get<Expense[]>('/expenses', { params }).then((r) => r.data),
  create: (data: { vehicleId: string; category: string; amount: number; date?: string; notes?: string }) =>
    api.post<Expense>('/expenses', data).then((r) => r.data),
  update: (id: string, data: { vehicleId?: string; category?: string; amount?: number; date?: string; notes?: string }) =>
    api.put<Expense>(`/expenses/${id}`, data).then((r) => r.data),
  approve: (id: string) => api.post<Expense>(`/expenses/${id}/approve`).then((r) => r.data),
  reject: (id: string) => api.post(`/expenses/${id}/reject`),
  remove: (id: string) => api.delete(`/expenses/${id}`),
};
