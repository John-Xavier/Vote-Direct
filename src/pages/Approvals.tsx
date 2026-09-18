import { useState } from 'react';
import { useStore } from '../store/useStore';
import { computeApproval } from '../lib/rules';
import { userApprovalInPoll } from '../lib/selectors';
import { SegmentTabs } from '../components/SegmentTabs';
import { NotScientificNote } from '../components/NotScientificNote';
import { HiddenSegment, LiveIndicator } from '../components/Bits';
import { TrendChart } from '../components/TrendChart';
import { t } from '../i18n';
import type { Poll, Segment } from '../data/types';

// Deterministic placeholder trend easing toward the current approve share.
function approvalTrend(seed: string, endShare: number): number[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const start = Math.max(0.2, endShare - 0.12);
  return Array.from({ length: 12 }, (_, w) => {
    h = (h * 1103515245 + 12345) >>> 0;
    const noise = ((h % 100) / 100 - 0.5) * 0.04;
    return Math.min(0.95, Math.max(0.05, start + ((endShare - start) * w) / 11 + noise));
  });
}

function ApprovalCard({ poll }: { poll: Poll }) {
  const data = useStore((s) => s.data);
  const user = useStore((s) => s.currentUser());
  const cast = useStore((s) => s.castApproval);
  const [segment, setSegment] = useState<Segment>('all');
  if (!user) return null;

  const res = computeApproval({ poll, approvals: data.approvals, users: data.users, segment });
  const mine = userApprovalInPoll(data, user.id, poll.id);
  const trend = approvalTrend(
    poll.id,
    computeApproval({ poll, approvals: data.approvals, users: data.users, segment: 'all' })
      .approveShare,
  );

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-heading text-xl">{poll.currentHolderName}</h2>
          <p className="text-xs text-muted">Approve / disapprove of the current office holder</p>
        </div>
        <LiveIndicator />
      </div>

      <div className="mt-4 flex gap-2">
        <button
          className={mine?.value === 'approve' ? 'btn text-white bg-approve' : 'btn-outline'}
          style={mine?.value === 'approve' ? {} : { borderColor: '#2F6B47', color: '#2F6B47' }}
          aria-pressed={mine?.value === 'approve'}
          onClick={() => cast(poll.id, 'approve')}
        >
          👍 {t.approvals.approve}
        </button>
        <button
          className={mine?.value === 'disapprove' ? 'btn text-white' : 'btn-outline'}
          style={
            mine?.value === 'disapprove'
              ? { background: '#B4532A' }
              : { borderColor: '#B4532A', color: '#B4532A' }
          }
          aria-pressed={mine?.value === 'disapprove'}
          onClick={() => cast(poll.id, 'disapprove')}
        >
          👎 {t.approvals.disapprove}
        </button>
        {mine && (
          <span className="chip bg-black/5 text-muted self-center">
            {t.approvals.yourRating}: {mine.value === 'approve' ? t.approvals.approve : t.approvals.disapprove}
          </span>
        )}
      </div>

      <div className="mt-5">
        <SegmentTabs value={segment} onChange={setSegment} />
        <div className="mt-3">
          {res.hidden ? (
            <HiddenSegment total={res.total} />
          ) : (
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-approve font-medium">
                  {t.approvals.approve} {Math.round(res.approveShare * 100)}%
                </span>
                <span className="text-disapprove font-medium">
                  {t.approvals.disapprove} {Math.round((1 - res.approveShare) * 100)}%
                </span>
              </div>
              <div className="h-3 w-full rounded-full overflow-hidden bg-disapprove/70">
                <div className="h-full bg-approve" style={{ width: `${res.approveShare * 100}%` }} />
              </div>
              <p className="text-xs text-muted mt-1">{res.total} ratings</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-5">
        <h3 className="text-sm font-medium text-muted mb-2">Approval — 12-week trend</h3>
        <TrendChart series={[{ label: 'Approve', color: '#2F6B47', points: trend }]} height={130} />
      </div>

      <NotScientificNote />
    </div>
  );
}

export function Approvals() {
  const data = useStore((s) => s.data);
  const approvalPolls = data.polls.filter((p) => p.type === 'approval');
  return (
    <div>
      <h1 className="font-heading text-3xl mb-1">{t.approvals.title}</h1>
      <p className="text-muted mb-6">{t.approvals.subtitle}</p>
      <div className="grid gap-4 md:grid-cols-2">
        {approvalPolls.map((p) => (
          <ApprovalCard key={p.id} poll={p} />
        ))}
      </div>
    </div>
  );
}
