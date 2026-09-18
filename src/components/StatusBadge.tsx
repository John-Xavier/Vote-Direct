import type { MembershipStatus } from '../data/types';

const MAP: Record<MembershipStatus, { label: string; cls: string }> = {
  independent: { label: 'Independent', cls: 'bg-black/5 text-muted' },
  self_declared: { label: 'Self-declared', cls: 'bg-plum/10 text-plum' },
  verified: { label: 'Verified', cls: 'bg-approve/10 text-approve' },
};

export function StatusBadge({ status }: { status: MembershipStatus }) {
  const m = MAP[status];
  return <span className={`chip ${m.cls}`}>{m.label}</span>;
}
