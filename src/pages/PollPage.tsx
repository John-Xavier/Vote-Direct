import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { canVoteInPoll, computeResults } from '../lib/rules';
import {
  candidaciesForRole,
  candidacyById,
  roleOfPoll,
  totalVotesInPoll,
  userById,
  userVoteInPoll,
} from '../lib/selectors';
import { VoteBar } from '../components/VoteBar';
import { SegmentTabs } from '../components/SegmentTabs';
import { NotScientificNote } from '../components/NotScientificNote';
import { HiddenSegment, InfoBanner, LiveIndicator } from '../components/Bits';
import { t } from '../i18n';
import type { Segment } from '../data/types';

export function PollPage() {
  const { pollId } = useParams();
  const data = useStore((s) => s.data);
  const user = useStore((s) => s.currentUser());
  const now = useStore((s) => s.now());
  const castVote = useStore((s) => s.castVote);
  const [segment, setSegment] = useState<Segment>('all');

  const poll = data.polls.find((p) => p.id === pollId);
  if (!poll || !user) return <p className="text-muted">Poll not found.</p>;

  const role = roleOfPoll(data, poll);
  const elig = canVoteInPoll({ user, role, poll, fronts: data.fronts, now });
  const myVote = userVoteInPoll(data, user.id, poll.id);
  const results = computeResults({
    poll,
    votes: data.votes,
    users: data.users,
    candidacies: data.candidacies,
    segment,
  });
  const totalAll = totalVotesInPoll(data, poll.id);
  const cands = candidaciesForRole(data, role.id);

  return (
    <div>
      <Link to="/app" className="text-sm text-plum hover:underline">
        ← {t.nav.ballot}
      </Link>
      <div className="flex items-start justify-between gap-3 mt-2 mb-4 flex-wrap">
        <div>
          <h1 className="font-heading text-3xl">{role.title}</h1>
          <p className="text-muted mt-1">
            {totalAll} {t.poll.totalVotes}
          </p>
        </div>
        <LiveIndicator />
      </div>

      {!elig.eligible && (
        <div className="mb-4">
          <InfoBanner>
            <strong>{t.poll.blockedTitle}.</strong> {elig.reason}
          </InfoBanner>
        </div>
      )}

      <div className="card p-5">
        <SegmentTabs value={segment} onChange={setSegment} />
        <div className="mt-4 space-y-2">
          {results.hidden ? (
            <HiddenSegment total={results.total} />
          ) : (
            results.ranked.map((r) => {
              const cand = candidacyById(data, r.candidacyId);
              const candUser = cand ? userById(data, cand.userId) : undefined;
              const isYour = myVote?.candidacyId === r.candidacyId;
              return (
                <VoteBar
                  key={r.candidacyId}
                  candidacyId={r.candidacyId}
                  name={candUser?.name ?? 'Candidate'}
                  subtitle={candUser?.profession}
                  share={r.share}
                  count={r.count}
                  isYourVote={isYour}
                  onVote={elig.eligible ? () => castVote(poll.id, r.candidacyId) : undefined}
                  voteLabel={isYour ? t.poll.voteRecorded : myVote ? t.poll.changeVote : t.poll.vote}
                />
              );
            })
          )}
          {cands.length === 0 && (
            <p className="text-sm text-muted">No published candidates yet.</p>
          )}
        </div>
        <NotScientificNote />
      </div>
    </div>
  );
}
