'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { driverService } from '@/services/driverService';
import { Driver } from '@/types';
import StatusBadge from '@/components/StatusBadge';
import Modal from '@/components/Modal';
import Field, { inputClass } from '@/components/Field';

const EMPTY_FORM = {
  name: '',
  licenseNumber: '',
  licenseCategory: '',
  licenseExpiryDate: '',
  contactNumber: '',
  safetyScore: '100',
};

export default function DriversPage() {
  const { user } = useAuth({ redirectIfUnauthenticated: false });
  const router = useRouter();
  useEffect(() => {
    if (user && !['ADMIN', 'FLEET_MANAGER'].includes(user.role)) router.replace('/dashboard');
  }, [user, router]);
  const canEdit = user?.role === 'ADMIN' || user?.role === 'FLEET_MANAGER';
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Driver | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    driverService
      .list(statusFilter ? { status: statusFilter } : undefined)
      .then(setDrivers)
      .finally(() => setLoading(false));
  }

  useEffect(load, [statusFilter]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await driverService.create({
        name: form.name,
        licenseNumber: form.licenseNumber,
        licenseCategory: form.licenseCategory,
        licenseExpiryDate: form.licenseExpiryDate,
        contactNumber: form.contactNumber,
        safetyScore: Number(form.safetyScore),
      });
      setShowForm(false);
      setForm(EMPTY_FORM);
      load();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to add driver');
    }
  }

  function startEdit(d: Driver) {
    setEditTarget(d);
    setForm({
      name: d.name,
      licenseNumber: d.licenseNumber,
      licenseCategory: d.licenseCategory,
      licenseExpiryDate: d.licenseExpiryDate.split('T')[0],
      contactNumber: d.contactNumber,
      safetyScore: String(d.safetyScore),
    });
    setError(null);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    setError(null);
    try {
      await driverService.update(editTarget.id, {
        name: form.name,
        licenseNumber: form.licenseNumber,
        licenseCategory: form.licenseCategory,
        licenseExpiryDate: form.licenseExpiryDate,
        contactNumber: form.contactNumber,
        safetyScore: Number(form.safetyScore),
      });
      setEditTarget(null);
      setForm(EMPTY_FORM);
      load();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to update driver');
    }
  }

  async function suspend(d: Driver) {
    if (!confirm(`Suspend ${d.name}? They will be blocked from new trip assignments.`)) return;
    await driverService.update(d.id, { status: 'SUSPENDED' });
    load();
  }

  function isExpired(d: Driver) {
    return new Date(d.licenseExpiryDate) < new Date();
  }

  return (
    <div>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wide text-muted">Compliance &amp; Roster</p>
          <h1 className="font-display text-2xl font-medium text-ink">Drivers</h1>
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
            <option value="OFF_DUTY">Off Duty</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
          <button
            onClick={() => setShowForm(true)}
            className="focus-ring flex items-center gap-2 rounded bg-ink px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            <Plus size={16} /> Add Driver
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-line bg-panel">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-paper font-mono text-[11px] uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">License No.</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">License Expiry</th>
              <th className="px-4 py-3">Safety Score</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={7} className="px-4 py-6 text-center text-muted">Loading…</td></tr>}
            {!loading && drivers.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-muted">No drivers yet.</td></tr>
            )}
            {drivers.map((d) => (
              <tr key={d.id} className="border-b border-line last:border-0 hover:bg-paper/60">
                <td className="px-4 py-3">{d.name}</td>
                <td className="px-4 py-3 font-mono">{d.licenseNumber}</td>
                <td className="px-4 py-3">{d.licenseCategory}</td>
                <td className={`px-4 py-3 font-mono ${isExpired(d) ? 'text-alert' : ''}`}>
                  {new Date(d.licenseExpiryDate).toLocaleDateString()}
                  {isExpired(d) && ' (expired)'}
                </td>
                <td className="px-4 py-3 font-mono">{d.safetyScore}</td>
                <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                <td className="px-4 py-3 text-right space-x-3 whitespace-nowrap">
                  {canEdit && (
                    <button onClick={() => startEdit(d)} className="text-xs font-medium text-signal hover:underline">
                      Edit
                    </button>
                  )}
                  {canEdit && d.status !== 'SUSPENDED' && (
                    <button onClick={() => suspend(d)} className="text-xs text-alert hover:underline">
                      Suspend
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <Modal title="Add Driver" onClose={() => setShowForm(false)}>
          <form onSubmit={handleCreate}>
            <Field label="Name">
              <input className={inputClass} required value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="License Number">
              <input className={inputClass} required value={form.licenseNumber}
                onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} />
            </Field>
            <Field label="License Category">
              <input className={inputClass} required value={form.licenseCategory}
                onChange={(e) => setForm({ ...form, licenseCategory: e.target.value })}
                placeholder="Light Motor Vehicle, Heavy Motor Vehicle…" />
            </Field>
            <Field label="License Expiry Date">
              <input className={inputClass} type="date" required value={form.licenseExpiryDate}
                onChange={(e) => setForm({ ...form, licenseExpiryDate: e.target.value })} />
            </Field>
            <Field label="Contact Number">
              <input className={inputClass} required value={form.contactNumber}
                onChange={(e) => setForm({ ...form, contactNumber: e.target.value })} />
            </Field>
            <Field label="Safety Score">
              <input className={inputClass} type="number" min={0} max={100} value={form.safetyScore}
                onChange={(e) => setForm({ ...form, safetyScore: e.target.value })} />
            </Field>

            {error && <p className="mb-3 rounded-sm bg-alert-soft px-3 py-2 text-sm text-alert">{error}</p>}

            <button type="submit" className="focus-ring w-full rounded bg-signal py-2.5 text-sm font-medium text-white hover:opacity-90">
              Add Driver
            </button>
          </form>
        </Modal>
      )}

      {editTarget && (
        <Modal title={`Edit Driver: ${editTarget.name}`} onClose={() => { setEditTarget(null); setForm(EMPTY_FORM); setError(null); }}>
          <form onSubmit={handleEdit}>
            <Field label="Name">
              <input className={inputClass} required value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="License Number">
              <input className={inputClass} required value={form.licenseNumber}
                onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} />
            </Field>
            <Field label="License Category">
              <input className={inputClass} required value={form.licenseCategory}
                onChange={(e) => setForm({ ...form, licenseCategory: e.target.value })} />
            </Field>
            <Field label="License Expiry Date">
              <input className={inputClass} type="date" required value={form.licenseExpiryDate}
                onChange={(e) => setForm({ ...form, licenseExpiryDate: e.target.value })} />
            </Field>
            <Field label="Contact Number">
              <input className={inputClass} required value={form.contactNumber}
                onChange={(e) => setForm({ ...form, contactNumber: e.target.value })} />
            </Field>
            <Field label="Safety Score">
              <input className={inputClass} type="number" min={0} max={100} value={form.safetyScore}
                onChange={(e) => setForm({ ...form, safetyScore: e.target.value })} />
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
