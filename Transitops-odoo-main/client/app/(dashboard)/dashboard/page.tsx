'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { reportService } from '@/services/reportService';
import { vehicleService } from '@/services/vehicleService';
import { tripService } from '@/services/tripService';
import { fuelService } from '@/services/fuelExpenseService';
import { driverService } from '@/services/driverService';
import { DashboardKpis, Vehicle, Trip, FuelLog, Driver as DriverType } from '@/types';
import KpiCard from '@/components/KpiCard';
import Modal from '@/components/Modal';
import Field, { inputClass } from '@/components/Field';

function ManagerDashboard() {
  const [kpis, setKpis] = useState<DashboardKpis | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [type, setType] = useState('');
  const [region, setRegion] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { vehicleService.list().then(setVehicles); }, []);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (type) params.type = type;
    if (region) params.region = region;
    reportService.dashboard(params).then(setKpis).finally(() => setLoading(false));
  }, [type, region]);

  const types = Array.from(new Set(vehicles.map((v) => v.type))).filter(Boolean);
  const regions = Array.from(new Set(vehicles.map((v) => v.region).filter(Boolean))) as string[];

  return (
    <div>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wide text-muted">Overview</p>
          <h1 className="font-display text-2xl font-medium text-ink">Operations Dashboard</h1>
        </div>
        <div className="flex gap-2">
          <select className="focus-ring rounded border border-line bg-panel px-3 py-2 text-sm" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">All vehicle types</option>
            {types.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select className="focus-ring rounded border border-line bg-panel px-3 py-2 text-sm" value={region} onChange={(e) => setRegion(e.target.value)}>
            <option value="">All regions</option>
            {regions.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>
      {loading || !kpis ? (
        <p className="font-mono text-sm text-muted">Loading KPIs…</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          <KpiCard label="Active Vehicles" value={kpis.activeVehicles} accent="transit" />
          <KpiCard label="Available Vehicles" value={kpis.availableVehicles} accent="route" />
          <KpiCard label="Vehicles In Maintenance" value={kpis.vehiclesInMaintenance} accent="signal" />
          <KpiCard label="Active Trips" value={kpis.activeTrips} accent="transit" />
          <KpiCard label="Pending Trips" value={kpis.pendingTrips} accent="signal" />
          <KpiCard label="Drivers On Duty" value={kpis.driversOnDuty} accent="route" />
          <KpiCard label="Fleet Utilization" value={kpis.fleetUtilization} suffix="%" accent="alert" />
        </div>
      )}
    </div>
  );
}

function DriverDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<DriverType | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', licenseNumber: '' });
  const [editError, setEditError] = useState<string | null>(null);

  function loadAll() {
    setLoading(true);
    Promise.all([driverService.getMyProfile().catch(() => null), tripService.list(), fuelService.list()])
      .then(([p, t, f]) => { setProfile(p); setTrips(t); setFuelLogs(f); })
      .finally(() => setLoading(false));
  }

  useEffect(loadAll, []);

  function openEditProfile() {
    if (!profile) return;
    setEditForm({ name: profile.name, licenseNumber: profile.licenseNumber });
    setEditError(null);
    setShowEditProfile(true);
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setEditError(null);
    try {
      const updated = await driverService.update(profile.id, {
        name: editForm.name,
        licenseNumber: editForm.licenseNumber,
      });
      setProfile(updated);
      setShowEditProfile(false);
    } catch (err: any) {
      setEditError(err?.response?.data?.error || 'Failed to update profile');
    }
  }

  const totalTrips = trips.length;
  const completedTrips = trips.filter((t) => t.status === 'COMPLETED').length;
  const totalFuelCost = fuelLogs.reduce((s, f) => s + f.cost, 0);

  if (loading) return <p className="font-mono text-sm text-muted">Loading your dashboard…</p>;

  return (
    <div>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wide text-muted">Welcome</p>
          <h1 className="font-display text-2xl font-medium text-ink">{user?.name || 'Driver'}</h1>
          <p className="mt-1 text-sm text-muted">{user?.email} &middot; Driver</p>
        </div>
      </div>

      {profile && (
        <div className="mb-6 rounded-lg border border-line bg-panel p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wide text-muted">Your Profile</p>
              <p className="mt-2 text-sm"><span className="text-muted">Name:</span> {profile.name}</p>
              <p className="text-sm"><span className="text-muted">License:</span> {profile.licenseNumber} ({profile.licenseCategory})</p>
              <p className="text-sm"><span className="text-muted">Expires:</span> {new Date(profile.licenseExpiryDate).toLocaleDateString()}</p>
              <p className="text-sm"><span className="text-muted">Contact:</span> {profile.contactNumber}</p>
              <p className="text-sm"><span className="text-muted">Safety Score:</span> {profile.safetyScore}</p>
            </div>
            <button onClick={openEditProfile} className="text-xs font-medium text-signal hover:underline">
              Edit Profile
            </button>
          </div>
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard label="Total Trips" value={totalTrips} accent="transit" />
        <KpiCard label="Completed Trips" value={completedTrips} accent="route" />
        <KpiCard label="Total Fuel Cost" value={`$${totalFuelCost.toFixed(0)}`} accent="signal" />
        <KpiCard label="Pending Trips" value={trips.filter((t) => t.status === 'DRAFT').length} accent="alert" />
      </div>

      <div className="rounded-lg border border-line bg-panel">
        <div className="border-b border-line px-4 py-3">
          <p className="font-mono text-[11px] uppercase tracking-wide text-muted">Recent Trips</p>
        </div>
        {trips.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted">No trips assigned yet.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-paper font-mono text-[11px] uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Route</th>
                <th className="px-4 py-3">Vehicle</th>
                <th className="px-4 py-3">Cargo</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {trips.slice(0, 5).map((t) => (
                <tr key={t.id} className="border-b border-line last:border-0 hover:bg-paper/60">
                  <td className="px-4 py-3">{t.source} → {t.destination}</td>
                  <td className="px-4 py-3 font-mono">{t.vehicle?.registrationNumber}</td>
                  <td className="px-4 py-3 font-mono">{t.cargoWeightKg} kg</td>
                  <td className="px-4 py-3"><span className={`rounded px-2 py-0.5 text-xs font-medium ${t.status === 'COMPLETED' ? 'bg-route/20 text-route' : t.status === 'DISPATCHED' ? 'bg-transit/20 text-transit' : t.status === 'CANCELLED' ? 'bg-alert/20 text-alert' : 'bg-muted/20 text-muted'}`}>{t.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showEditProfile && profile && (
        <Modal title="Edit Your Profile" onClose={() => setShowEditProfile(false)}>
          <form onSubmit={saveProfile}>
            <Field label="Name">
              <input className={inputClass} required value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            </Field>
            <Field label="License Number">
              <input className={inputClass} required value={editForm.licenseNumber}
                onChange={(e) => setEditForm({ ...editForm, licenseNumber: e.target.value })} />
            </Field>
            {editError && <p className="mb-3 rounded-sm bg-alert-soft px-3 py-2 text-sm text-alert">{editError}</p>}
            <button type="submit" className="focus-ring w-full rounded bg-signal py-2.5 text-sm font-medium text-white hover:opacity-90">
              Save Changes
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

function SafetyOfficerDashboard() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([vehicleService.list(), tripService.list()])
      .then(([v, t]) => { setVehicles(v); setTrips(t); })
      .finally(() => setLoading(false));
  }, []);

  const inMaintenance = vehicles.filter((v) => v.status === 'IN_SHOP').length;
  const available = vehicles.filter((v) => v.status === 'AVAILABLE').length;
  const onTrip = vehicles.filter((v) => v.status === 'ON_TRIP').length;
  const activeTrips = trips.filter((t) => t.status === 'DISPATCHED').length;
  const openMaint = vehicles.filter((v) => v.status === 'IN_SHOP').length;

  if (loading) return <p className="font-mono text-sm text-muted">Loading fleet status…</p>;

  return (
    <div>
      <div className="mb-6">
        <p className="font-mono text-[11px] uppercase tracking-wide text-muted">Fleet Safety &amp; Health</p>
        <h1 className="font-display text-2xl font-medium text-ink">Safety Dashboard</h1>
      </div>
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard label="Total Vehicles" value={vehicles.length} accent="transit" />
        <KpiCard label="In Maintenance" value={inMaintenance} accent="signal" />
        <KpiCard label="Available" value={available} accent="route" />
        <KpiCard label="On Trip" value={onTrip} accent="transit" />
        <KpiCard label="Active Trips" value={activeTrips} accent="transit" />
        <KpiCard label="Requires Attention" value={inMaintenance} accent="alert" />
      </div>
      <div className="rounded-lg border border-line bg-panel">
        <div className="border-b border-line px-4 py-3">
          <p className="font-mono text-[11px] uppercase tracking-wide text-muted">Vehicle Status Breakdown</p>
        </div>
        {vehicles.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted">No vehicles registered.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-paper font-mono text-[11px] uppercase tracking-wide text-muted">
              <tr><th className="px-4 py-3">Vehicle</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Odometer</th><th className="px-4 py-3">Status</th></tr>
            </thead>
            <tbody>
              {vehicles.map((v) => (
                <tr key={v.id} className="border-b border-line last:border-0 hover:bg-paper/60">
                  <td className="px-4 py-3 font-mono">{v.registrationNumber}</td>
                  <td className="px-4 py-3">{v.type}</td>
                  <td className="px-4 py-3 font-mono">{v.odometerKm.toLocaleString()} km</td>
                  <td className="px-4 py-3"><span className={`rounded px-2 py-0.5 text-xs font-medium ${v.status === 'AVAILABLE' ? 'bg-route/20 text-route' : v.status === 'ON_TRIP' ? 'bg-transit/20 text-transit' : v.status === 'IN_SHOP' ? 'bg-signal/20 text-signal' : 'bg-alert/20 text-alert'}`}>{v.status.replace('_', ' ')}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function FinancialAnalystDashboard() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportService.analytics().then(setData).finally(() => setLoading(false));
  }, []);

  const totalOpCost = data.reduce((s, r) => s + r.operationalCost, 0);
  const totalFuelCost = data.reduce((s, r) => s + r.totalFuelCost, 0);
  const totalMaintCost = data.reduce((s, r) => s + r.totalMaintenanceCost, 0);
  const totalOther = data.reduce((s, r) => s + r.totalOtherExpenses, 0);
  const avgEfficiency = data.length ? (data.reduce((s, r) => s + r.fuelEfficiencyKmPerL, 0) / data.length).toFixed(1) : '—';

  if (loading) return <p className="font-mono text-sm text-muted">Crunching the numbers…</p>;

  return (
    <div>
      <div className="mb-6">
        <p className="font-mono text-[11px] uppercase tracking-wide text-muted">Financial Overview</p>
        <h1 className="font-display text-2xl font-medium text-ink">Financial Dashboard</h1>
      </div>
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard label="Total Op. Cost" value={`$${totalOpCost.toFixed(0)}`} accent="alert" />
        <KpiCard label="Fuel Cost" value={`$${totalFuelCost.toFixed(0)}`} accent="signal" />
        <KpiCard label="Maintenance Cost" value={`$${totalMaintCost.toFixed(0)}`} accent="signal" />
        <KpiCard label="Other Expenses" value={`$${totalOther.toFixed(0)}`} accent="signal" />
        <KpiCard label="Avg Fuel Efficiency" value={avgEfficiency} suffix="km/L" accent="route" />
        <KpiCard label="Avg ROI" value={data.length ? `${(data.reduce((s, r) => s + r.roi, 0) / data.length * 100).toFixed(1)}%` : '—'} accent={data.reduce((s, r) => s + r.roi, 0) >= 0 ? 'route' : 'alert'} />
      </div>
      {data.length > 0 && (
        <div className="rounded-lg border border-line bg-panel">
          <div className="border-b border-line px-4 py-3">
            <p className="font-mono text-[11px] uppercase tracking-wide text-muted">Vehicle Cost Breakdown</p>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-paper font-mono text-[11px] uppercase tracking-wide text-muted">
              <tr><th className="px-4 py-3">Vehicle</th><th className="px-4 py-3">Fuel Cost</th><th className="px-4 py-3">Maint. Cost</th><th className="px-4 py-3">Other</th><th className="px-4 py-3">Total Op.</th><th className="px-4 py-3">ROI</th></tr>
            </thead>
            <tbody>
              {data.map((row: any) => (
                <tr key={row.vehicleId} className="border-b border-line last:border-0 hover:bg-paper/60">
                  <td className="px-4 py-3 font-mono">{row.registrationNumber}</td>
                  <td className="px-4 py-3 font-mono">${row.totalFuelCost.toFixed(0)}</td>
                  <td className="px-4 py-3 font-mono">${row.totalMaintenanceCost.toFixed(0)}</td>
                  <td className="px-4 py-3 font-mono">${row.totalOtherExpenses.toFixed(0)}</td>
                  <td className="px-4 py-3 font-mono">${row.operationalCost.toFixed(0)}</td>
                  <td className={`px-4 py-3 font-mono ${row.roi >= 0 ? 'text-route' : 'text-alert'}`}>{(row.roi * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth({ redirectIfUnauthenticated: false });

  if (!user) return <p className="font-mono text-sm text-muted">Loading…</p>;

  if (user.role === 'DRIVER') return <DriverDashboard />;
  if (user.role === 'SAFETY_OFFICER') return <SafetyOfficerDashboard />;
  if (user.role === 'FINANCIAL_ANALYST') return <FinancialAnalystDashboard />;

  return <ManagerDashboard />;
}
