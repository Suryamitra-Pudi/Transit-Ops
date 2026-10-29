'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '@/hooks/useAuth';
import { reportService } from '@/services/reportService';
import { VehicleAnalytics } from '@/types';
import { getToken } from '@/lib/auth';

export default function ReportsPage() {
  const { user } = useAuth({ redirectIfUnauthenticated: false });
  const router = useRouter();
  useEffect(() => {
    if (user && !['ADMIN', 'FLEET_MANAGER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST'].includes(user.role)) router.replace('/dashboard');
  }, [user, router]);
  const [data, setData] = useState<VehicleAnalytics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportService.analytics().then(setData).finally(() => setLoading(false));
  }, []);

  async function downloadCsv() {
    const token = getToken();
    const res = await fetch(reportService.exportCsvUrl(), {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transitops-analytics.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wide text-muted">Insights</p>
          <h1 className="font-display text-2xl font-medium text-ink">Reports &amp; Analytics</h1>
        </div>
        <button
          onClick={downloadCsv}
          className="focus-ring flex items-center gap-2 rounded bg-ink px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          <Download size={16} /> Export CSV
        </button>
      </div>

      {loading ? (
        <p className="font-mono text-sm text-muted">Crunching the numbers…</p>
      ) : (
        <>
          <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-lg border border-line bg-panel p-4">
              <p className="mb-3 font-mono text-[11px] uppercase tracking-wide text-muted">
                Fuel Efficiency (km / L)
              </p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E4E3DC" />
                  <XAxis dataKey="registrationNumber" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="fuelEfficiencyKmPerL" fill="#1E6F5C" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-lg border border-line bg-panel p-4">
              <p className="mb-3 font-mono text-[11px] uppercase tracking-wide text-muted">
                Operational Cost (Fuel + Maintenance + Other)
              </p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E4E3DC" />
                  <XAxis dataKey="registrationNumber" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="operationalCost" fill="#FF7A1A" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-line bg-panel">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-paper font-mono text-[11px] uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3">Vehicle</th>
                  <th className="px-4 py-3">Distance</th>
                  <th className="px-4 py-3">Fuel Efficiency</th>
                  <th className="px-4 py-3">Fuel Cost</th>
                  <th className="px-4 py-3">Maintenance Cost</th>
                  <th className="px-4 py-3">Op. Cost</th>
                  <th className="px-4 py-3">ROI</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row.vehicleId} className="border-b border-line last:border-0 hover:bg-paper/60">
                    <td className="px-4 py-3 font-mono">{row.registrationNumber}</td>
                    <td className="px-4 py-3 font-mono">{row.totalDistanceKm} km</td>
                    <td className="px-4 py-3 font-mono">{row.fuelEfficiencyKmPerL} km/L</td>
                    <td className="px-4 py-3 font-mono">${row.totalFuelCost.toFixed(2)}</td>
                    <td className="px-4 py-3 font-mono">${row.totalMaintenanceCost.toFixed(2)}</td>
                    <td className="px-4 py-3 font-mono">${row.operationalCost.toFixed(2)}</td>
                    <td className={`px-4 py-3 font-mono ${row.roi >= 0 ? 'text-route' : 'text-alert'}`}>
                      {(row.roi * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-muted">
            ROI uses Revenue − (Maintenance + Fuel) ÷ Acquisition Cost. Revenue isn&apos;t a tracked entity yet,
            so it&apos;s estimated from completed trip distance for demonstration purposes — swap in real
            revenue data when available.
          </p>
        </>
      )}
    </div>
  );
}
