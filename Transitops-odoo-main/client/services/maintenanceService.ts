import api from '@/lib/api';
import { MaintenanceLog } from '@/types';

export const maintenanceService = {
  list: (params?: Record<string, string>) =>
    api.get<MaintenanceLog[]>('/maintenance', { params }).then((r) => r.data),
  create: (data: { vehicleId: string; description: string; cost?: number }) =>
    api.post<MaintenanceLog>('/maintenance', data).then((r) => r.data),
  update: (id: string, data: { description?: string; cost?: number }) =>
    api.put<MaintenanceLog>(`/maintenance/${id}`, data).then((r) => r.data),
  close: (id: string, cost?: number) =>
    api.post<MaintenanceLog>(`/maintenance/${id}/close`, { cost }).then((r) => r.data),
};
