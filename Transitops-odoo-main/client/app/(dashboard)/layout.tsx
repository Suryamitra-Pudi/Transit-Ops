'use client';

import { useAuth } from '@/hooks/useAuth';
import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-paper">
        <p className="font-mono text-sm text-muted">Loading TransitOps…</p>
      </div>
    );
  }

  if (!user) return null; // useAuth already redirects to /login

  return (
    <div className="flex h-screen bg-paper">
      <Sidebar user={user} onLogout={logout} />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
