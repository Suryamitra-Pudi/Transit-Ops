'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { fuelService, expenseService } from '@/services/fuelExpenseService';
import { vehicleService } from '@/services/vehicleService';
import { FuelLog, Expense, Vehicle } from '@/types';
import Modal from '@/components/Modal';
import Field, { inputClass } from '@/components/Field';

export default function FuelExpensesPage() {
  const { user } = useAuth({ redirectIfUnauthenticated: false });
  const router = useRouter();
  useEffect(() => {
    if (user && !['ADMIN', 'FLEET_MANAGER', 'DRIVER', 'FINANCIAL_ANALYST'].includes(user.role)) router.replace('/dashboard');
  }, [user, router]);
  const canEdit = user?.role === 'ADMIN' || user?.role === 'FLEET_MANAGER';
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'fuel' | 'expense'>('fuel');
  const [showForm, setShowForm] = useState(false);
  const [editFuelTarget, setEditFuelTarget] = useState<FuelLog | null>(null);
  const [editExpenseTarget, setEditExpenseTarget] = useState<Expense | null>(null);

  const [fuelForm, setFuelForm] = useState({ vehicleId: '', liters: '', cost: '', date: '' });
  const [expenseForm, setExpenseForm] = useState({ vehicleId: '', category: 'Toll', amount: '', date: '', notes: '' });
  const [formError, setFormError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    Promise.all([fuelService.list(), expenseService.list(), vehicleService.list()])
      .then(([f, e, v]) => {
        setFuelLogs(f);
        setExpenses(e);
        setVehicles(v);
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  function startEditFuel(f: FuelLog) {
    setEditFuelTarget(f);
    setFuelForm({
      vehicleId: f.vehicleId,
      liters: String(f.liters),
      cost: String(f.cost),
      date: f.date.split('T')[0],
    });
  }

  async function handleEditFuel(e: React.FormEvent) {
    e.preventDefault();
    if (!editFuelTarget) return;
    await fuelService.update(editFuelTarget.id, {
      vehicleId: fuelForm.vehicleId,
      liters: Number(fuelForm.liters),
      cost: Number(fuelForm.cost),
      date: fuelForm.date || undefined,
    });
    setEditFuelTarget(null);
    setFuelForm({ vehicleId: '', liters: '', cost: '', date: '' });
    load();
  }

  function startEditExpense(ex: Expense) {
    setEditExpenseTarget(ex);
    setExpenseForm({
      vehicleId: ex.vehicleId,
      category: ex.category,
      amount: String(ex.amount),
      date: ex.date.split('T')[0],
      notes: ex.notes || '',
    });
  }

  async function handleEditExpense(e: React.FormEvent) {
    e.preventDefault();
    if (!editExpenseTarget) return;
    await expenseService.update(editExpenseTarget.id, {
      vehicleId: expenseForm.vehicleId,
      category: expenseForm.category,
      amount: Number(expenseForm.amount),
      date: expenseForm.date || undefined,
      notes: expenseForm.notes || undefined,
    });
    setEditExpenseTarget(null);
    setExpenseForm({ vehicleId: '', category: 'Toll', amount: '', date: '', notes: '' });
    load();
  }

  async function submitFuel(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    try {
      await fuelService.create({
        vehicleId: fuelForm.vehicleId,
        liters: Number(fuelForm.liters),
        cost: Number(fuelForm.cost),
        date: fuelForm.date || undefined,
      });
      setShowForm(false);
      setFuelForm({ vehicleId: '', liters: '', cost: '', date: '' });
      load();
    } catch (err: any) {
      setFormError(err?.response?.data?.error || 'Failed to save fuel log');
    }
  }

  async function submitExpense(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    try {
      await expenseService.create({
        vehicleId: expenseForm.vehicleId,
        category: expenseForm.category,
        amount: Number(expenseForm.amount),
        date: expenseForm.date || undefined,
        notes: expenseForm.notes || undefined,
      });
      setShowForm(false);
      setExpenseForm({ vehicleId: '', category: 'Toll', amount: '', date: '', notes: '' });
      load();
    } catch (err: any) {
      setFormError(err?.response?.data?.error || 'Failed to save expense');
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wide text-muted">Cost Tracking</p>
          <h1 className="font-display text-2xl font-medium text-ink">Fuel &amp; Expenses</h1>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="focus-ring flex items-center gap-2 rounded bg-ink px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          <Plus size={16} /> Log Entry
        </button>
      </div>

      <div className="mb-4 flex gap-1 border-b border-line">
        {(['fuel', 'expense'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium ${tab === t ? 'border-b-2 border-signal text-ink' : 'text-muted'}`}
          >
            {t === 'fuel' ? 'Fuel Logs' : 'Other Expenses'}
          </button>
        ))}
      </div>

      {tab === 'fuel' ? (
        <div className="overflow-hidden rounded-lg border border-line bg-panel">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-paper font-mono text-[11px] uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Vehicle</th>
                <th className="px-4 py-3">Liters</th>
                <th className="px-4 py-3">Cost</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={6} className="px-4 py-6 text-center text-muted">Loading…</td></tr>}
              {!loading && fuelLogs.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-muted">No fuel logs yet.</td></tr>
              )}
              {fuelLogs.map((f) => (
                <tr key={f.id} className="border-b border-line last:border-0 hover:bg-paper/60">
                  <td className="px-4 py-3 font-mono">{f.vehicle?.registrationNumber}</td>
                  <td className="px-4 py-3 font-mono">{f.liters} L</td>
                  <td className="px-4 py-3 font-mono">${f.cost.toFixed(2)}</td>
                  <td className="px-4 py-3 font-mono">{new Date(f.date).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${f.status === 'APPROVED' ? 'bg-route/20 text-route' : f.status === 'PENDING' ? 'bg-signal/20 text-signal' : 'bg-alert/20 text-alert'}`}>
                      {f.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                    {f.status === 'PENDING' && canEdit && (
                      <>
                        <button onClick={async () => { await fuelService.approve(f.id); load(); }} className="text-xs font-medium text-route hover:underline">Approve</button>
                        <button onClick={async () => { await fuelService.reject(f.id); load(); }} className="text-xs text-alert hover:underline">Reject</button>
                      </>
                    )}
                    {canEdit && f.status === 'APPROVED' && (
                      <button onClick={() => startEditFuel(f)} className="text-xs font-medium text-signal hover:underline">Edit</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-line bg-panel">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-paper font-mono text-[11px] uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Vehicle</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Notes</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7} className="px-4 py-6 text-center text-muted">Loading…</td></tr>}
              {!loading && expenses.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-muted">No expenses yet.</td></tr>
              )}
              {expenses.map((ex) => (
                <tr key={ex.id} className="border-b border-line last:border-0 hover:bg-paper/60">
                  <td className="px-4 py-3 font-mono">{ex.vehicle?.registrationNumber}</td>
                  <td className="px-4 py-3">{ex.category}</td>
                  <td className="px-4 py-3 font-mono">${ex.amount.toFixed(2)}</td>
                  <td className="px-4 py-3 font-mono">{new Date(ex.date).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-muted">{ex.notes || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${ex.status === 'APPROVED' ? 'bg-route/20 text-route' : ex.status === 'PENDING' ? 'bg-signal/20 text-signal' : 'bg-alert/20 text-alert'}`}>
                      {ex.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                    {ex.status === 'PENDING' && canEdit && (
                      <>
                        <button onClick={async () => { await expenseService.approve(ex.id); load(); }} className="text-xs font-medium text-route hover:underline">Approve</button>
                        <button onClick={async () => { await expenseService.reject(ex.id); load(); }} className="text-xs text-alert hover:underline">Reject</button>
                      </>
                    )}
                    {canEdit && ex.status === 'APPROVED' && (
                      <button onClick={() => startEditExpense(ex)} className="text-xs font-medium text-signal hover:underline">Edit</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <Modal title={tab === 'fuel' ? 'Log Fuel' : 'Log Expense'} onClose={() => setShowForm(false)}>
          {tab === 'fuel' ? (
            <form onSubmit={submitFuel}>
              <Field label="Vehicle">
                <select className={inputClass} required value={fuelForm.vehicleId}
                  onChange={(e) => setFuelForm({ ...fuelForm, vehicleId: e.target.value })}>
                  <option value="">Select a vehicle</option>
                  {vehicles.map((v) => <option key={v.id} value={v.id}>{v.registrationNumber} — {v.name}</option>)}
                </select>
              </Field>
              <Field label="Liters">
                <input className={inputClass} type="number" required value={fuelForm.liters}
                  onChange={(e) => setFuelForm({ ...fuelForm, liters: e.target.value })} />
              </Field>
              <Field label="Cost">
                <input className={inputClass} type="number" required value={fuelForm.cost}
                  onChange={(e) => setFuelForm({ ...fuelForm, cost: e.target.value })} />
              </Field>
              <Field label="Date">
                <input className={inputClass} type="date" value={fuelForm.date}
                  onChange={(e) => setFuelForm({ ...fuelForm, date: e.target.value })} />
              </Field>
              {formError && <p className="mb-3 rounded-sm bg-alert-soft px-3 py-2 text-sm text-alert">{formError}</p>}
              <button type="submit" className="focus-ring w-full rounded bg-signal py-2.5 text-sm font-medium text-white hover:opacity-90">
                Save Fuel Log
              </button>
            </form>
          ) : (
            <form onSubmit={submitExpense}>
              <Field label="Vehicle">
                <select className={inputClass} required value={expenseForm.vehicleId}
                  onChange={(e) => setExpenseForm({ ...expenseForm, vehicleId: e.target.value })}>
                  <option value="">Select a vehicle</option>
                  {vehicles.map((v) => <option key={v.id} value={v.id}>{v.registrationNumber} — {v.name}</option>)}
                </select>
              </Field>
              <Field label="Category">
                <select className={inputClass} value={expenseForm.category}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}>
                  <option>Toll</option>
                  <option>Maintenance</option>
                  <option>Parking</option>
                  <option>Other</option>
                </select>
              </Field>
              <Field label="Amount">
                <input className={inputClass} type="number" required value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} />
              </Field>
              <Field label="Date">
                <input className={inputClass} type="date" value={expenseForm.date}
                  onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })} />
              </Field>
              <Field label="Notes (optional)">
                <input className={inputClass} value={expenseForm.notes}
                  onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })} />
              </Field>
              {formError && <p className="mb-3 rounded-sm bg-alert-soft px-3 py-2 text-sm text-alert">{formError}</p>}
              <button type="submit" className="focus-ring w-full rounded bg-signal py-2.5 text-sm font-medium text-white hover:opacity-90">
                Save Expense
              </button>
            </form>
          )}
        </Modal>
      )}

      {editFuelTarget && (
        <Modal title={`Edit Fuel Log: ${editFuelTarget.vehicle?.registrationNumber}`} onClose={() => { setEditFuelTarget(null); setFuelForm({ vehicleId: '', liters: '', cost: '', date: '' }); }}>
          <form onSubmit={handleEditFuel}>
            <Field label="Vehicle">
              <select className={inputClass} required value={fuelForm.vehicleId}
                onChange={(e) => setFuelForm({ ...fuelForm, vehicleId: e.target.value })}>
                <option value="">Select a vehicle</option>
                {vehicles.map((v) => <option key={v.id} value={v.id}>{v.registrationNumber} — {v.name}</option>)}
              </select>
            </Field>
            <Field label="Liters">
              <input className={inputClass} type="number" required value={fuelForm.liters}
                onChange={(e) => setFuelForm({ ...fuelForm, liters: e.target.value })} />
            </Field>
            <Field label="Cost">
              <input className={inputClass} type="number" required value={fuelForm.cost}
                onChange={(e) => setFuelForm({ ...fuelForm, cost: e.target.value })} />
            </Field>
            <Field label="Date">
              <input className={inputClass} type="date" value={fuelForm.date}
                onChange={(e) => setFuelForm({ ...fuelForm, date: e.target.value })} />
            </Field>
            <button type="submit" className="focus-ring w-full rounded bg-signal py-2.5 text-sm font-medium text-white hover:opacity-90">
              Save Changes
            </button>
          </form>
        </Modal>
      )}

      {editExpenseTarget && (
        <Modal title={`Edit Expense: ${editExpenseTarget.vehicle?.registrationNumber}`} onClose={() => { setEditExpenseTarget(null); setExpenseForm({ vehicleId: '', category: 'Toll', amount: '', date: '', notes: '' }); }}>
          <form onSubmit={handleEditExpense}>
            <Field label="Vehicle">
              <select className={inputClass} required value={expenseForm.vehicleId}
                onChange={(e) => setExpenseForm({ ...expenseForm, vehicleId: e.target.value })}>
                <option value="">Select a vehicle</option>
                {vehicles.map((v) => <option key={v.id} value={v.id}>{v.registrationNumber} — {v.name}</option>)}
              </select>
            </Field>
            <Field label="Category">
              <select className={inputClass} value={expenseForm.category}
                onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}>
                <option>Toll</option>
                <option>Maintenance</option>
                <option>Parking</option>
                <option>Other</option>
              </select>
            </Field>
            <Field label="Amount">
              <input className={inputClass} type="number" required value={expenseForm.amount}
                onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} />
            </Field>
            <Field label="Date">
              <input className={inputClass} type="date" value={expenseForm.date}
                onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })} />
            </Field>
            <Field label="Notes (optional)">
              <input className={inputClass} value={expenseForm.notes}
                onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })} />
            </Field>
            <button type="submit" className="focus-ring w-full rounded bg-signal py-2.5 text-sm font-medium text-white hover:opacity-90">
              Save Changes
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
