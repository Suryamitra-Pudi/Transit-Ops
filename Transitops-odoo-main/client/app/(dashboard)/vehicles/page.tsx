'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { vehicleService } from '@/services/vehicleService';
import { Vehicle } from '@/types';
import StatusBadge from '@/components/StatusBadge';
import Modal from '@/components/Modal';
import Field, { inputClass } from '@/components/Field';

const EMPTY_FORM = {
  registrationNumber: '',
  name: '',
  type: '',
  maxLoadCapacityKg: '',
  odometerKm: '',
  acquisitionCost: '',
  region: '',
};

export default function VehiclesPage() {
  const { user } = useAuth({ redirectIfUnauthenticated: false });
  const router = useRouter();
  const canEdit = user?.role === 'ADMIN' || user?.role === 'FLEET_MANAGER';
  useEffect(() => {
    if (user && !['ADMIN', 'FLEET_MANAGER', 'SAFETY_OFFICER'].includes(user.role)) router.replace('/dashboard');
  }, [user, router]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Vehicle | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    vehicleService
      .list(statusFilter ? { status: statusFilter } : undefined)
      .then(setVehicles)
      .finally(() => setLoading(false));
  }

  useEffect(load, [statusFilter]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await vehicleService.create({
        registrationNumber: form.registrationNumber,
        name: form.name,
        type: form.type,
        maxLoadCapacityKg: Number(form.maxLoadCapacityKg),
        odometerKm: Number(form.odometerKm) || 0,
        acquisitionCost: Number(form.acquisitionCost),
        region: form.region || null,
      });
      setShowForm(false);
      setForm(EMPTY_FORM);
      load();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to create vehicle');
    }
  }

  function startEdit(v: Vehicle) {
    setEditTarget(v);
    setForm({
      registrationNumber: v.registrationNumber,
      name: v.name,
      type: v.type,
      maxLoadCapacityKg: String(v.maxLoadCapacityKg),
      odometerKm: String(v.odometerKm),
      acquisitionCost: String(v.acquisitionCost),
      region: v.region || '',
    });
    setError(null);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    setError(null);
    try {
      await vehicleService.update(editTarget.id, {
        registrationNumber: form.registrationNumber,
        name: form.name,
        type: form.type,
        maxLoadCapacityKg: Number(form.maxLoadCapacityKg),
        odometerKm: Number(form.odometerKm) || 0,
        acquisitionCost: Number(form.acquisitionCost),
        region: form.region || null,
      });
      setEditTarget(null);
      setForm(EMPTY_FORM);
      load();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to update vehicle');
    }
  }

  async function retireVehicle(v: Vehicle) {
    if (!confirm(`Retire ${v.registrationNumber}? It will be permanently removed from dispatch selection.`)) return;
    await vehicleService.update(v.id, { status: 'RETIRED' });
    load();
  }

  return (
    <div>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wide text-muted">Fleet Assets</p>
          <h1 className="font-display text-2xl font-medium text-ink">Vehicle Registry</h1>
        </div>
        <div className="flex gap-2">
          <select
            className="focus-ring rounded border border-line bg-panel px-3 py-2 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="ON_TRIP">On Trip</option>
            <option value="IN_SHOP">In Shop</option>
            <option value="RETIRED">Retired</option>
          </select>
          <button
            onClick={() => setShowForm(true)}
            className="focus-ring flex items-center gap-2 rounded bg-ink px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            <Plus size={16} /> Register Vehicle
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-line bg-panel">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-paper font-mono text-[11px] uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">Reg. No.</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Max Load</th>
              <th className="px-4 py-3">Odometer</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-muted">Loading…</td></tr>
            )}
            {!loading && vehicles.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-muted">No vehicles yet. Register your first vehicle to get started.</td></tr>
            )}
            {vehicles.map((v) => (
              <tr key={v.id} className="border-b border-line last:border-0 hover:bg-paper/60">
                <td className="px-4 py-3 font-mono">{v.registrationNumber}</td>
                <td className="px-4 py-3">{v.name}</td>
                <td className="px-4 py-3">{v.type}</td>
                <td className="px-4 py-3 font-mono">{v.maxLoadCapacityKg} kg</td>
                <td className="px-4 py-3 font-mono">{v.odometerKm.toLocaleString()} km</td>
                <td className="px-4 py-3"><StatusBadge status={v.status} /></td>
                <td className="px-4 py-3 text-right space-x-3 whitespace-nowrap">
                  {canEdit && (
                    <button onClick={() => startEdit(v)} className="text-xs font-medium text-signal hover:underline">
                      Edit
                    </button>
                  )}
                  {canEdit && v.status !== 'RETIRED' && (
                    <button onClick={() => retireVehicle(v)} className="text-xs text-alert hover:underline">
                      Retire
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <Modal title="Register Vehicle" onClose={() => setShowForm(false)}>
          <form onSubmit={handleCreate}>
            <Field label="Registration Number">
              <input className={inputClass} required value={form.registrationNumber}
                onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })} placeholder="VAN-05" />
            </Field>
            <Field label="Vehicle Name / Model">
              <input className={inputClass} required value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Van-05" />
            </Field>
            <Field label="Type">
              <input className={inputClass} required value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })} placeholder="Van, Truck, Bike…" />
            </Field>
            <Field label="Max Load Capacity (kg)">
              <input className={inputClass} type="number" required value={form.maxLoadCapacityKg}
                onChange={(e) => setForm({ ...form, maxLoadCapacityKg: e.target.value })} />
            </Field>
            <Field label="Odometer (km)">
              <input className={inputClass} type="number" value={form.odometerKm}
                onChange={(e) => setForm({ ...form, odometerKm: e.target.value })} />
            </Field>
            <Field label="Acquisition Cost">
              <input className={inputClass} type="number" required value={form.acquisitionCost}
                onChange={(e) => setForm({ ...form, acquisitionCost: e.target.value })} />
            </Field>
            <Field label="Region (optional)">
              <input className={inputClass} value={form.region}
                onChange={(e) => setForm({ ...form, region: e.target.value })} placeholder="North, South…" />
            </Field>

            {error && <p className="mb-3 rounded-sm bg-alert-soft px-3 py-2 text-sm text-alert">{error}</p>}

            <button type="submit" className="focus-ring w-full rounded bg-signal py-2.5 text-sm font-medium text-white hover:opacity-90">
              Register Vehicle
            </button>
          </form>
        </Modal>
      )}

      {editTarget && (
        <Modal title={`Edit Vehicle: ${editTarget.registrationNumber}`} onClose={() => { setEditTarget(null); setForm(EMPTY_FORM); setError(null); }}>
          <form onSubmit={handleEdit}>
            <Field label="Registration Number">
              <input className={inputClass} required value={form.registrationNumber}
                onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })} />
            </Field>
            <Field label="Vehicle Name / Model">
              <input className={inputClass} required value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="Type">
              <input className={inputClass} required value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })} />
            </Field>
            <Field label="Max Load Capacity (kg)">
              <input className={inputClass} type="number" required value={form.maxLoadCapacityKg}
                onChange={(e) => setForm({ ...form, maxLoadCapacityKg: e.target.value })} />
            </Field>
            <Field label="Odometer (km)">
              <input className={inputClass} type="number" value={form.odometerKm}
                onChange={(e) => setForm({ ...form, odometerKm: e.target.value })} />
            </Field>
            <Field label="Acquisition Cost">
              <input className={inputClass} type="number" required value={form.acquisitionCost}
                onChange={(e) => setForm({ ...form, acquisitionCost: e.target.value })} />
            </Field>
            <Field label="Region (optional)">
              <input className={inputClass} value={form.region}
                onChange={(e) => setForm({ ...form, region: e.target.value })} />
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
