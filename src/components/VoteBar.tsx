import { Link } from 'react-router-dom';

/** A single ranked candidate row with a vote-share bar. */
export function VoteBar({
  name,
  subtitle,
  share,
  count,
  candidacyId,
  isYourVote,
  onVote,
  voteLabel,
  highlight,
}: {
  name: string;
  subtitle?: string;
  share: number; // 0..1
  count: number;
  candidacyId?: string;
  isYourVote?: boolean;
  onVote?: () => void;
  voteLabel?: string;
  highlight?: boolean;
}) {
  const pct = Math.round(share * 100);
  return (
    <div
      className={`rounded-lg border p-3 ${
        highlight ? 'border-plum/40 bg-plum/5' : 'border-black/5 bg-surface'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {candidacyId ? (
              <Link
                to={`/candidate/${candidacyId}`}
                className="font-medium text-ink hover:text-plum truncate"
              >
                {name}
              </Link>
            ) : (
              <span className="font-medium text-ink truncate">{name}</span>
            )}
            {isYourVote && (
              <span className="chip bg-plum/10 text-plum shrink-0">Your vote</span>
            )}
          </div>
          {subtitle && <p className="text-xs text-muted truncate">{subtitle}</p>}
        </div>
        <div className="text-right shrink-0">
          <div className="font-heading text-lg text-ink tabular-nums">{pct}%</div>
          <div className="text-xs text-muted tabular-nums">{count} votes</div>
        </div>
      </div>
      <div className="mt-2 h-2.5 w-full rounded-full bg-black/5 overflow-hidden">
        <div
          className={`h-full rounded-full ${isYourVote ? 'bg-plum' : 'bg-plum/50'}`}
          style={{ width: `${Math.max(pct, 1)}%` }}
        />
      </div>
      {onVote && (
        <button
          onClick={onVote}
          className={`mt-2 text-sm ${isYourVote ? 'btn-outline' : 'btn-primary'}`}
          aria-pressed={isYourVote}
        >
          {voteLabel}
        </button>
      )}
    </div>
  );
}
