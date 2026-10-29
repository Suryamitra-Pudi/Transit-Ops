'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { maintenanceService } from '@/services/maintenanceService';
import { vehicleService } from '@/services/vehicleService';
import { MaintenanceLog, Vehicle } from '@/types';
import StatusBadge from '@/components/StatusBadge';
import Modal from '@/components/Modal';
import Field, { inputClass } from '@/components/Field';

const EMPTY_FORM = { vehicleId: '', description: '', cost: '' };

export default function MaintenancePage() {
  const { user } = useAuth({ redirectIfUnauthenticated: false });
  const router = useRouter();
  useEffect(() => {
    if (user && !['ADMIN', 'FLEET_MANAGER', 'SAFETY_OFFICER'].includes(user.role)) router.replace('/dashboard');
  }, [user, router]);
  const canEdit = user?.role === 'ADMIN' || user?.role === 'FLEET_MANAGER' || user?.role === 'SAFETY_OFFICER';
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<MaintenanceLog | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    maintenanceService
      .list(statusFilter ? { status: statusFilter } : undefined)
      .then(setLogs)
      .finally(() => setLoading(false));
  }

  useEffect(load, [statusFilter]);

  function openForm() {
    vehicleService.list().then((all) => setVehicles(all.filter((v) => v.status !== 'RETIRED' && v.status !== 'ON_TRIP')));
    setShowForm(true);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await maintenanceService.create({
        vehicleId: form.vehicleId,
        description: form.description,
        cost: form.cost ? Number(form.cost) : undefined,
      });
      setShowForm(false);
      setForm(EMPTY_FORM);
      load();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to open maintenance record');
    }
  }

  function startEdit(log: MaintenanceLog) {
    if (log.status !== 'OPEN') return;
    setEditTarget(log);
    setForm({
      vehicleId: log.vehicleId,
      description: log.description,
      cost: String(log.cost),
    });
    setError(null);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    setError(null);
    try {
      await maintenanceService.update(editTarget.id, {
        description: form.description,
        cost: form.cost ? Number(form.cost) : undefined,
      });
      setEditTarget(null);
      setForm(EMPTY_FORM);
      load();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to update maintenance record');
    }
  }

  async function close(log: MaintenanceLog) {
    const cost = prompt('Final cost for this maintenance record?', String(log.cost));
    if (cost === null) return;
    try {
      await maintenanceService.close(log.id, Number(cost));
      load();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to close maintenance record');
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wide text-muted">Vehicle Lifecycle</p>
          <h1 className="font-display text-2xl font-medium text-ink">Maintenance</h1>
        </div>
        <div className="flex gap-2">
          <select
            className="focus-ring rounded border border-line bg-panel px-3 py-2 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="OPEN">Open</option>
            <option value="CLOSED">Closed</option>
          </select>
          <button
            onClick={openForm}
            className="focus-ring flex items-center gap-2 rounded bg-ink px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            <Plus size={16} /> Log Maintenance
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-line bg-panel">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-paper font-mono text-[11px] uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">Vehicle</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Cost</th>
              <th className="px-4 py-3">Opened</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6} className="px-4 py-6 text-center text-muted">Loading…</td></tr>}
            {!loading && logs.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-muted">No maintenance records yet.</td></tr>
            )}
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-line last:border-0 hover:bg-paper/60">
                <td className="px-4 py-3 font-mono">{log.vehicle?.registrationNumber}</td>
                <td className="px-4 py-3">{log.description}</td>
                <td className="px-4 py-3 font-mono">${log.cost.toFixed(2)}</td>
                <td className="px-4 py-3 font-mono">{new Date(log.openedAt).toLocaleDateString()}</td>
                <td className="px-4 py-3"><StatusBadge status={log.status} /></td>
                <td className="px-4 py-3 text-right space-x-3 whitespace-nowrap">
                  {log.status === 'OPEN' && (
                    <>
                      {canEdit && (
                        <button onClick={() => startEdit(log)} className="text-xs font-medium text-signal hover:underline">
                          Edit
                        </button>
                      )}
                      <button onClick={() => close(log)} className="text-xs font-medium text-route hover:underline">
                        Close
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <Modal title="Log Maintenance" onClose={() => setShowForm(false)}>
          <form onSubmit={handleCreate}>
            <Field label="Vehicle (available only)">
              <select className={inputClass} required value={form.vehicleId}
                onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}>
                <option value="">Select a vehicle</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>{v.registrationNumber} — {v.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Description">
              <input className={inputClass} required value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Oil change, brake inspection…" />
            </Field>
            <Field label="Estimated Cost">
              <input className={inputClass} type="number" value={form.cost}
                onChange={(e) => setForm({ ...form, cost: e.target.value })} />
            </Field>

            <p className="mb-3 rounded-sm bg-signal-soft px-3 py-2 text-xs text-signal">
              Opening this record will move the vehicle to &quot;In Shop&quot; and remove it from dispatch.
            </p>

            {error && <p className="mb-3 rounded-sm bg-alert-soft px-3 py-2 text-sm text-alert">{error}</p>}

            <button type="submit" className="focus-ring w-full rounded bg-signal py-2.5 text-sm font-medium text-white hover:opacity-90">
              Open Maintenance Record
            </button>
          </form>
        </Modal>
      )}

      {editTarget && (
        <Modal title={`Edit Maintenance: ${editTarget.vehicle?.registrationNumber}`} onClose={() => { setEditTarget(null); setForm(EMPTY_FORM); setError(null); }}>
          <form onSubmit={handleEdit}>
            <Field label="Description">
              <input className={inputClass} required value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Field>
            <Field label="Cost">
              <input className={inputClass} type="number" value={form.cost}
                onChange={(e) => setForm({ ...form, cost: e.target.value })} />
            </Field>

            {error && <p className="mb-3 rounded-sm bg-alert-soft px-3 py-2 text-sm text-alert">{error}</p>}

            <button type="submit" className="focus-ring w-full rounded bg-signal py-2.5 text-sm font-medium text-white hover:opacity-90">
              Save Changes
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
