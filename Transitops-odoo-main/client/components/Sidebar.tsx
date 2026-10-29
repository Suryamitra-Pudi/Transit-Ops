'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import {
  LayoutDashboard,
  Truck,
  UserRound,
  Route,
  Wrench,
  Fuel,
  BarChart3,
  LogOut,
} from 'lucide-react';
import { User, Role } from '@/types';
import { ROLE_LABELS } from '@/lib/auth';

function navLinks(role: Role) {
  const all = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/vehicles', label: 'Vehicle Registry', icon: Truck },
    { href: '/drivers', label: 'Drivers', icon: UserRound },
    { href: '/trips', label: 'Trips', icon: Route },
    { href: '/maintenance', label: 'Maintenance', icon: Wrench },
    { href: '/fuel-expenses', label: 'Fuel & Expenses', icon: Fuel },
    { href: '/reports', label: 'Reports', icon: BarChart3 },
  ];
  if (role === 'ADMIN' || role === 'FLEET_MANAGER') return all;
  if (role === 'DRIVER')
    return [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/trips', label: 'My Trips', icon: Route },
      { href: '/fuel-expenses', label: 'Fuel & Expenses', icon: Fuel },
    ];
  if (role === 'SAFETY_OFFICER')
    return [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/vehicles', label: 'Vehicles', icon: Truck },
      { href: '/trips', label: 'Trips', icon: Route },
      { href: '/maintenance', label: 'Maintenance', icon: Wrench },
      { href: '/reports', label: 'Reports', icon: BarChart3 },
    ];
  if (role === 'FINANCIAL_ANALYST')
    return [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/fuel-expenses', label: 'Fuel & Expenses', icon: Fuel },
      { href: '/reports', label: 'Reports', icon: BarChart3 },
    ];
  return all;
}

export default function Sidebar({ user, onLogout }: { user: User; onLogout: () => void }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col bg-ink text-white">
      <div className="px-5 py-6">
        <p className="font-display text-xl font-bold tracking-tight">TransitOps</p>
        <p className="font-mono text-[10px] uppercase tracking-widest text-white/40">
          Fleet &amp; Dispatch Console
        </p>
      </div>
      <div className="route-line h-[3px] w-full opacity-80" />

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navLinks(user.role).map(({ href, label, icon: Icon }) => {
          const active = pathname?.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'focus-ring flex items-center gap-3 rounded-sm border-l-2 px-3 py-2 text-sm transition-colors',
                active
                  ? 'border-signal bg-white/5 text-white'
                  : 'border-transparent text-white/60 hover:bg-white/5 hover:text-white'
              )}
            >
              <Icon size={17} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-4 py-4">
        <p className="text-sm font-medium text-white">{user.name}</p>
        <p className="font-mono text-[11px] uppercase tracking-wide text-white/40">
          {ROLE_LABELS[user.role] || user.role}
        </p>
        <button
          onClick={onLogout}
          className="focus-ring mt-3 flex items-center gap-2 text-sm text-white/60 hover:text-signal"
        >
          <LogOut size={15} /> Sign out
        </button>
      </div>
    </aside>
  );
}
