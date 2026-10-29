'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { inputClass } from '@/components/Field';

const DEMO_LOGINS = [
  { role: 'Fleet Manager', email: 'fleet.manager@transitops.dev' },
  { role: 'Driver', email: 'driver@transitops.dev' },
  { role: 'Safety Officer', email: 'safety.officer@transitops.dev' },
  { role: 'Financial Analyst', email: 'financial.analyst@transitops.dev' },
];

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth({ redirectIfUnauthenticated: false });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Unable to sign in. Check your credentials.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="font-display text-3xl font-bold text-white">TransitOps</p>
          <p className="mt-1 font-mono text-xs uppercase tracking-widest text-white/40">
            Smart Transport Operations Platform
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-lg border border-white/10 bg-panel p-6">
          <label className="mb-3 block">
            <span className="mb-1 block font-mono text-[11px] uppercase tracking-wide text-muted">Email</span>
            <input
              className={inputClass}
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@transitops.dev"
            />
          </label>
          <label className="mb-4 block">
            <span className="mb-1 block font-mono text-[11px] uppercase tracking-wide text-muted">Password</span>
            <input
              className={inputClass}
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </label>

          {error && (
            <p className="mb-4 rounded-sm bg-alert-soft px-3 py-2 text-sm text-alert">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="focus-ring w-full rounded bg-signal py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="mt-5 rounded-lg border border-white/10 bg-white/5 p-4">
          <p className="mb-2 font-mono text-[11px] uppercase tracking-wide text-white/50">
            Demo logins (password: password123)
          </p>
          <ul className="space-y-1">
            {DEMO_LOGINS.map((d) => (
              <li key={d.email} className="flex justify-between text-xs text-white/70">
                <span>{d.role}</span>
                <button
                  type="button"
                  className="font-mono text-white/50 hover:text-signal"
                  onClick={() => {
                    setEmail(d.email);
                    setPassword('password123');
                  }}
                >
                  {d.email}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
