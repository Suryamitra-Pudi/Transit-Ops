import { ReactNode } from 'react';

export default function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="mb-3 block">
      <span className="mb-1 block font-mono text-[11px] uppercase tracking-wide text-muted">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  'focus-ring w-full rounded border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-muted/70';
