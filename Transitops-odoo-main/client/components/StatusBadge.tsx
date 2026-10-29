import clsx from 'clsx';

const STATUS_STYLES: Record<string, string> = {
  AVAILABLE: 'bg-route-soft text-route',
  ON_TRIP: 'bg-transit-soft text-transit',
  IN_SHOP: 'bg-signal-soft text-signal',
  RETIRED: 'bg-line text-muted',
  OFF_DUTY: 'bg-line text-muted',
  SUSPENDED: 'bg-alert-soft text-alert',
  DRAFT: 'bg-line text-muted',
  DISPATCHED: 'bg-transit-soft text-transit',
  COMPLETED: 'bg-route-soft text-route',
  CANCELLED: 'bg-alert-soft text-alert',
  OPEN: 'bg-signal-soft text-signal',
  CLOSED: 'bg-route-soft text-route',
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-sm px-2 py-0.5 text-[11px] font-mono font-medium uppercase tracking-wide',
        STATUS_STYLES[status] || 'bg-line text-muted'
      )}
    >
      {status.replace('_', ' ')}
    </span>
  );
}
