import api from '@/lib/api';
import { DashboardKpis, VehicleAnalytics } from '@/types';

export const reportService = {
  dashboard: (params?: Record<string, string>) =>
    api.get<DashboardKpis>('/reports/dashboard', { params }).then((r) => r.data),
  analytics: () => api.get<VehicleAnalytics[]>('/reports/analytics').then((r) => r.data),
  exportCsvUrl: () => '/api/reports/export/csv',
};
