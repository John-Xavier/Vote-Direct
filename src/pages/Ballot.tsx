import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { canVoteInPoll, computeResults } from '../lib/rules';
import {
  activeWhoPolls,
  candidaciesForRole,
  candidacyById,
  roleOfPoll,
  totalVotesInPoll,
  userById,
  userVoteInPoll,
} from '../lib/selectors';
import { LiveIndicator } from '../components/Bits';
import { t } from '../i18n';
import type { Poll, RoleScope } from '../data/types';

const GROUPS: { scope: RoleScope; label: string }[] = [
  { scope: 'everyone', label: t.ballot.openPolls },
  { scope: 'front', label: t.ballot.frontPolls },
  { scope: 'party', label: t.ballot.partyPolls },
  { scope: 'constituency', label: t.ballot.seatPolls },
];

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="card px-4 py-3">
      <div className="text-2xl font-bold tabular-nums text-ink">{value}</div>
      <div className="text-xs text-muted mt-0.5">{label}</div>
    </div>
  );
}

function PollCard({ poll }: { poll: Poll }) {
  const data = useStore((s) => s.data);
  const user = useStore((s) => s.currentUser())!;
  const now = useStore((s) => s.now());

  const role = roleOfPoll(data, poll);
  const elig = canVoteInPoll({ user, role, poll, fronts: data.fronts, now });
  const myVote = userVoteInPoll(data, user.id, poll.id);
  const total = totalVotesInPoll(data, poll.id);
  const candCount = candidaciesForRole(data, role.id).length;
  const res = computeResults({
    poll,
    votes: data.votes,
    users: data.users,
    candidacies: data.candidacies,
    segment: 'all',
  });
  const leader = res.ranked[0];
  const leaderUser = leader ? userById(data, candidacyById(data, leader.candidacyId)?.userId ?? '') : undefined;
  const myCand = myVote ? userById(data, candidacyById(data, myVote.candidacyId)?.userId ?? '') : undefined;

  return (
    <Link
      to={`/app/poll/${poll.id}`}
      className="card p-4 hover:border-plum/40 hover:shadow-md transition-all block focus:outline-none"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-ink leading-snug">{role.title}</h3>
        {elig.eligible ? (
          myVote ? (
            <span className="chip bg-approve/10 text-approve shrink-0">✓ {t.ballot.voted}</span>
          ) : (
            <span className="chip bg-plum/10 text-plum shrink-0">{t.ballot.notVoted}</span>
          )
        ) : (
          <span className="chip bg-black/5 text-muted shrink-0">{t.ballot.viewOnly}</span>
        )}
      </div>

      {/* Leading candidate infographic */}
      <div className="mt-3">
        {res.hidden ? (
          <div className="rounded-lg bg-bg border border-dashed border-black/15 px-3 py-2 text-xs text-muted">
            {t.hiddenUntil} · {res.total}/20
          </div>
        ) : leader ? (
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-muted truncate">
                Leading: <span className="text-ink font-medium">{leaderUser?.name ?? 'Candidate'}</span>
              </span>
              <span className="font-bold tabular-nums text-ink">{Math.round(leader.share * 100)}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-black/5 overflow-hidden">
              <div className="h-full rounded-full bg-plum" style={{ width: `${Math.max(leader.share * 100, 2)}%` }} />
            </div>
          </div>
        ) : (
          <div className="text-xs text-muted">No candidates yet.</div>
        )}
      </div>

      {/* Meta row */}
      <div className="mt-3 flex items-center gap-3 text-xs text-muted">
        <span className="tabular-nums font-medium text-ink">{total}</span>
        <span>votes</span>
        <span className="text-black/20">·</span>
        <span className="tabular-nums font-medium text-ink">{candCount}</span>
        <span>candidates</span>
      </div>

      {myVote && myCand && (
        <div className="mt-2 text-xs text-plum">Your vote: {myCand.name}</div>
      )}
      {!elig.eligible && (
        <p className="mt-2 text-xs text-disapprove/90 leading-snug">{elig.reason}</p>
      )}
    </Link>
  );
}

export function Ballot() {
  const data = useStore((s) => s.data);
  const user = useStore((s) => s.currentUser());
  const now = useStore((s) => s.now());
  if (!user) return null;

  const polls = activeWhoPolls(data);
  const votable = polls.filter(
    (p) => canVoteInPoll({ user, role: roleOfPoll(data, p), poll: p, fronts: data.fronts, now }).eligible,
  );
  const votedCount = votable.filter((p) => userVoteInPoll(data, user.id, p.id)).length;
  const viewOnly = polls.length - votable.length;

  return (
    <div>
      <div className="mb-5 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">{t.ballot.title}</h1>
          <p className="text-muted mt-1">{t.ballot.subtitle}</p>
        </div>
        <LiveIndicator />
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <Stat value={votable.length} label="Polls you can vote in" />
        <Stat value={votedCount} label="Votes cast" />
        <Stat value={Math.max(votable.length - votedCount, 0)} label="Still to vote" />
        <Stat value={viewOnly} label="View-only polls" />
      </div>

      <div className="space-y-8">
        {GROUPS.map((group) => {
          const groupPolls = polls.filter((p) => roleOfPoll(data, p).scope === group.scope);
          if (groupPolls.length === 0) return null;
          const groupVotable = groupPolls.filter(
            (p) => canVoteInPoll({ user, role: roleOfPoll(data, p), poll: p, fronts: data.fronts, now }).eligible,
          ).length;
          return (
            <section key={group.scope}>
              <div className="flex items-baseline justify-between mb-3">
                <h2 className="text-xl font-semibold">{group.label}</h2>
                <span className="text-xs text-muted">
                  {groupVotable}/{groupPolls.length} votable
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {groupPolls.map((poll) => (
                  <PollCard key={poll.id} poll={poll} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
