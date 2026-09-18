import type { Segment } from '../data/types';
import { t } from '../i18n';

const LABELS: Record<Segment, string> = {
  all: t.poll.segAll,
  members: t.poll.segMembers,
  verified: t.poll.segVerified,
};

export function SegmentTabs({
  value,
  onChange,
}: {
  value: Segment;
  onChange: (s: Segment) => void;
}) {
  const segments: Segment[] = ['all', 'members', 'verified'];
  return (
    <div
      role="tablist"
      aria-label="Result segment"
      className="inline-flex rounded-lg border border-black/10 bg-bg p-1"
    >
      {segments.map((s) => (
        <button
          key={s}
          role="tab"
          aria-selected={value === s}
          onClick={() => onChange(s)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            value === s ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink'
          }`}
        >
          {LABELS[s]}
        </button>
      ))}
    </div>
  );
}
