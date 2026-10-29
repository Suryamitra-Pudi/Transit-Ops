interface KpiCardProps {
  label: string;
  value: string | number;
  suffix?: string;
  accent?: 'signal' | 'route' | 'transit' | 'alert';
}

const ACCENT_BAR: Record<string, string> = {
  signal: 'bg-signal',
  route: 'bg-route',
  transit: 'bg-transit',
  alert: 'bg-alert',
};

export default function KpiCard({ label, value, suffix, accent = 'transit' }: KpiCardProps) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-line bg-panel p-4">
      <div className={`absolute left-0 top-0 h-1 w-full ${ACCENT_BAR[accent]}`} />
      <p className="font-mono text-[11px] uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-2 font-display text-3xl font-medium text-ink">
        {value}
        {suffix && <span className="ml-1 text-base text-muted">{suffix}</span>}
      </p>
    </div>
  );
}
