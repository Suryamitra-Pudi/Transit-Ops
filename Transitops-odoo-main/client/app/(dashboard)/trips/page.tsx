'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { tripService } from '@/services/tripService';
import { vehicleService } from '@/services/vehicleService';
import { driverService } from '@/services/driverService';
import { Trip, Vehicle, Driver } from '@/types';
import StatusBadge from '@/components/StatusBadge';
import Modal from '@/components/Modal';
import Field, { inputClass } from '@/components/Field';

const EMPTY_FORM = {
  source: '',
  destination: '',
  vehicleId: '',
  driverId: '',
  cargoWeightKg: '',
  plannedDistanceKm: '',
};

export default function TripsPage() {
  const { user } = useAuth({ redirectIfUnauthenticated: false });
  const router = useRouter();
  useEffect(() => {
    if (user && !['ADMIN', 'FLEET_MANAGER', 'DRIVER', 'SAFETY_OFFICER'].includes(user.role)) router.replace('/dashboard');
  }, [user, router]);
  const canEdit = user?.role === 'ADMIN' || user?.role === 'FLEET_MANAGER';
  const canAct = user?.role === 'ADMIN' || user?.role === 'FLEET_MANAGER' || user?.role === 'DRIVER';
  const [trips, setTrips] = useState<Trip[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Trip | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [completingTrip, setCompletingTrip] = useState<Trip | null>(null);
  const [completeForm, setCompleteForm] = useState({ finalOdometerKm: '', fuelConsumedL: '' });

  function load() {
    setLoading(true);
    tripService
      .list(statusFilter ? { status: statusFilter } : undefined)
      .then(setTrips)
      .finally(() => setLoading(false));
  }

  useEffect(load, [statusFilter]);

  function loadFormOptions() {
    // Only dispatchable vehicles/drivers are offered, per the mandatory
    // business rules (no retired/in-shop vehicles, no suspended/expired drivers).
    vehicleService.list({ dispatchable: 'true' }).then(setVehicles);
    driverService.list({ dispatchable: 'true' }).then(setDrivers);
  }

  const selectedVehicle = vehicles.find((v) => v.id === form.vehicleId);
  const cargoExceedsCapacity =
    selectedVehicle && form.cargoWeightKg && Number(form.cargoWeightKg) > selectedVehicle.maxLoadCapacityKg;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await tripService.create({
        source: form.source,
        destination: form.destination,
        vehicleId: form.vehicleId,
        driverId: form.driverId,
        cargoWeightKg: Number(form.cargoWeightKg),
        plannedDistanceKm: Number(form.plannedDistanceKm),
      });
      setShowForm(false);
      setForm(EMPTY_FORM);
      load();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to create trip');
    }
  }

  function startEdit(t: Trip) {
    if (t.status !== 'DRAFT') return;
    setEditTarget(t);
    setForm({
      source: t.source,
      destination: t.destination,
      vehicleId: t.vehicleId,
      driverId: t.driverId,
      cargoWeightKg: String(t.cargoWeightKg),
      plannedDistanceKm: String(t.plannedDistanceKm),
    });
    setError(null);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    setError(null);
    try {
      await tripService.update(editTarget.id, {
        source: form.source,
        destination: form.destination,
        cargoWeightKg: Number(form.cargoWeightKg),
        plannedDistanceKm: Number(form.plannedDistanceKm),
      });
      setEditTarget(null);
      setForm(EMPTY_FORM);
      load();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to update trip');
    }
  }

  async function dispatch(trip: Trip) {
    try {
      await tripService.dispatch(trip.id);
      load();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to dispatch trip');
    }
  }

  async function cancel(trip: Trip) {
    if (!confirm('Cancel this trip? Vehicle and driver will be restored to Available.')) return;
    try {
      await tripService.cancel(trip.id);
      load();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to cancel trip');
    }
  }

  async function submitComplete(e: React.FormEvent) {
    e.preventDefault();
    if (!completingTrip) return;
    try {
      await tripService.complete(completingTrip.id, {
        finalOdometerKm: completeForm.finalOdometerKm ? Number(completeForm.finalOdometerKm) : undefined,
        fuelConsumedL: completeForm.fuelConsumedL ? Number(completeForm.fuelConsumedL) : undefined,
      });
      setCompletingTrip(null);
      setCompleteForm({ finalOdometerKm: '', fuelConsumedL: '' });
      load();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to complete trip');
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wide text-muted">Dispatch</p>
          <h1 className="font-display text-2xl font-medium text-ink">Trips</h1>
        </div>
        <div className="flex gap-2">
          <select
            className="focus-ring rounded border border-line bg-panel px-3 py-2 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="DISPATCHED">Dispatched</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          {canEdit && (
            <button
              onClick={() => { loadFormOptions(); setShowForm(true); }}
              className="focus-ring flex items-center gap-2 rounded bg-ink px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              <Plus size={16} /> Create Trip
            </button>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-line bg-panel">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-paper font-mono text-[11px] uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">Route</th>
              <th className="px-4 py-3">Vehicle</th>
              <th className="px-4 py-3">Driver</th>
              <th className="px-4 py-3">Cargo</th>
              <th className="px-4 py-3">Distance</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={7} className="px-4 py-6 text-center text-muted">Loading…</td></tr>}
            {!loading && trips.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-muted">No trips yet.</td></tr>
            )}
            {trips.map((t) => (
              <tr key={t.id} className="border-b border-line last:border-0 hover:bg-paper/60">
                <td className="px-4 py-3">{t.source} → {t.destination}</td>
                <td className="px-4 py-3 font-mono">{t.vehicle?.registrationNumber}</td>
                <td className="px-4 py-3">{t.driver?.name}</td>
                <td className="px-4 py-3 font-mono">{t.cargoWeightKg} kg</td>
                <td className="px-4 py-3 font-mono">{t.plannedDistanceKm} km</td>
                <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                <td className="px-4 py-3 text-right space-x-3 whitespace-nowrap">
                  {t.status === 'DRAFT' && (
                    <>
                      {canEdit && (
                        <button onClick={() => startEdit(t)} className="text-xs font-medium text-signal hover:underline">
                          Edit
                        </button>
                      )}
                      {canAct && (
                        <button onClick={() => dispatch(t)} className="text-xs font-medium text-transit hover:underline">
                          Dispatch
                        </button>
                      )}
                    </>
                  )}
                  {t.status === 'DISPATCHED' && canAct && (
                    <button onClick={() => setCompletingTrip(t)} className="text-xs font-medium text-route hover:underline">
                      Complete
                    </button>
                  )}
                  {['DRAFT', 'DISPATCHED'].includes(t.status) && canAct && (
                    <button onClick={() => cancel(t)} className="text-xs text-alert hover:underline">
                      Cancel
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editTarget && (
        <Modal title={`Edit Trip: ${editTarget.source} → ${editTarget.destination}`} onClose={() => { setEditTarget(null); setForm(EMPTY_FORM); setError(null); }}>
          <form onSubmit={handleEdit}>
            <Field label="Source">
              <input className={inputClass} required value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })} />
            </Field>
            <Field label="Destination">
              <input className={inputClass} required value={form.destination}
                onChange={(e) => setForm({ ...form, destination: e.target.value })} />
            </Field>
            <Field label="Cargo Weight (kg)">
              <input className={inputClass} type="number" required value={form.cargoWeightKg}
                onChange={(e) => setForm({ ...form, cargoWeightKg: e.target.value })} />
            </Field>
            <Field label="Planned Distance (km)">
              <input className={inputClass} type="number" required value={form.plannedDistanceKm}
                onChange={(e) => setForm({ ...form, plannedDistanceKm: e.target.value })} />
            </Field>

            {error && <p className="mb-3 rounded-sm bg-alert-soft px-3 py-2 text-sm text-alert">{error}</p>}

            <button type="submit" className="focus-ring w-full rounded bg-signal py-2.5 text-sm font-medium text-white hover:opacity-90">
              Save Changes
            </button>
          </form>
        </Modal>
      )}

      {showForm && (
        <Modal title="Create Trip" onClose={() => setShowForm(false)}>
          <form onSubmit={handleCreate}>
            <Field label="Source">
              <input className={inputClass} required value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })} />
            </Field>
            <Field label="Destination">
              <input className={inputClass} required value={form.destination}
                onChange={(e) => setForm({ ...form, destination: e.target.value })} />
            </Field>
            <Field label="Vehicle (available only)">
              <select className={inputClass} required value={form.vehicleId}
                onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}>
                <option value="">Select a vehicle</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.registrationNumber} — {v.name} (max {v.maxLoadCapacityKg} kg)
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Driver (available, license valid)">
              <select className={inputClass} required value={form.driverId}
                onChange={(e) => setForm({ ...form, driverId: e.target.value })}>
                <option value="">Select a driver</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} — {d.licenseNumber}</option>
                ))}
              </select>
            </Field>
            <Field label="Cargo Weight (kg)">
              <input className={inputClass} type="number" required value={form.cargoWeightKg}
                onChange={(e) => setForm({ ...form, cargoWeightKg: e.target.value })} />
            </Field>
            {cargoExceedsCapacity && (
              <p className="-mt-2 mb-3 text-xs text-alert">
                Exceeds {selectedVehicle?.registrationNumber}&apos;s max load capacity of {selectedVehicle?.maxLoadCapacityKg} kg.
              </p>
            )}
            <Field label="Planned Distance (km)">
              <input className={inputClass} type="number" required value={form.plannedDistanceKm}
                onChange={(e) => setForm({ ...form, plannedDistanceKm: e.target.value })} />
            </Field>

            {error && <p className="mb-3 rounded-sm bg-alert-soft px-3 py-2 text-sm text-alert">{error}</p>}

            <button
              type="submit"
              disabled={!!cargoExceedsCapacity}
              className="focus-ring w-full rounded bg-signal py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              Save as Draft
            </button>
          </form>
        </Modal>
      )}

      {completingTrip && (
        <Modal title={`Complete Trip: ${completingTrip.source} → ${completingTrip.destination}`} onClose={() => setCompletingTrip(null)}>
          <form onSubmit={submitComplete}>
            <Field label="Final Odometer (km)">
              <input className={inputClass} type="number" value={completeForm.finalOdometerKm}
                onChange={(e) => setCompleteForm({ ...completeForm, finalOdometerKm: e.target.value })}
                placeholder={`Current: ${completingTrip.vehicle?.odometerKm ?? '—'} km`} />
            </Field>
            <Field label="Fuel Consumed (liters)">
              <input className={inputClass} type="number" value={completeForm.fuelConsumedL}
                onChange={(e) => setCompleteForm({ ...completeForm, fuelConsumedL: e.target.value })} />
            </Field>
            <button type="submit" className="focus-ring w-full rounded bg-route py-2.5 text-sm font-medium text-white hover:opacity-90">
              Mark Completed
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
