import clsx from 'clsx';
import type { ReactNode } from 'react';

type Tone = 'neutral' | 'signal' | 'verified' | 'pending' | 'danger';

const toneClasses: Record<Tone, string> = {
  neutral: 'bg-blueprint-700 text-line-300',
  signal: 'bg-signal-950 text-signal-400 border border-signal-600/40',
  verified: 'bg-verified-950 text-verified-500 border border-verified-500/30',
  pending: 'bg-blueprint-800 text-pending-500 border border-pending-500/30',
  danger: 'bg-danger-950 text-danger-500 border border-danger-500/30',
};

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-sm px-2 py-0.5 font-mono text-[11px] uppercase tracking-[0.1em]',
        toneClasses[tone]
      )}
    >
      {children}
    </span>
  );
}

const statusToneMap: Record<string, Tone> = {
  open: 'signal',
  in_progress: 'pending',
  completed: 'verified',
  cancelled: 'danger',
  pending: 'pending',
  accepted: 'verified',
  rejected: 'danger',
  withdrawn: 'neutral',
  funded: 'verified',
  released: 'verified',
  disputed: 'danger',
  verified: 'verified',
  unverified: 'neutral',
};

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={statusToneMap[status] ?? 'neutral'}>{status.replace('_', ' ')}</Badge>;
}
