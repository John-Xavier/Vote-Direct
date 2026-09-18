import { useParams, Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { canVoteInPoll, computeResults } from '../lib/rules';
import {
  constituencyName,
  partyName,
  userById,
  userVoteInPoll,
} from '../lib/selectors';
import { TrendChart } from '../components/TrendChart';
import { NotScientificNote } from '../components/NotScientificNote';
import { t } from '../i18n';
import type { Segment } from '../data/types';

const SEG_LABEL: Record<Segment, string> = {
  all: t.poll.segAll,
  members: t.poll.segMembers,
  verified: t.poll.segVerified,
};
const SEG_COLOR: Record<Segment, string> = {
  all: '#5A3D7A',
  members: '#2F6B47',
  verified: '#B4532A',
};

export function CandidateProfile() {
  const { candidacyId } = useParams();
  const data = useStore((s) => s.data);
  const user = useStore((s) => s.currentUser());
  const now = useStore((s) => s.now());
  const castVote = useStore((s) => s.castVote);

  const cand = data.candidacies.find((c) => c.id === candidacyId);
  if (!cand || !user) return <p className="text-muted">Candidate not found.</p>;
  const candUser = userById(data, cand.userId);
  const role = data.roles.find((r) => r.id === cand.roleId);
  const poll = data.polls.find((p) => p.roleId === cand.roleId && p.type === 'who_should_hold');

  const elig = poll && role
    ? canVoteInPoll({ user, role, poll, fronts: data.fronts, now })
    : { eligible: false, reason: '' };
  const myVote = poll ? userVoteInPoll(data, user.id, poll.id) : undefined;
  const isYourVote = myVote?.candidacyId === cand.id;

  const segments: Segment[] = ['all', 'members', 'verified'];
  const perSegment = poll
    ? segments.map((seg) => {
        const res = computeResults({
          poll,
          votes: data.votes,
          users: data.users,
          candidacies: data.candidacies,
          segment: seg,
        });
        const row = res.ranked.find((r) => r.candidacyId === cand.id);
        return { seg, hidden: res.hidden, share: row?.share ?? 0, count: row?.count ?? 0 };
      })
    : [];

  const trendSeries = segments.map((seg) => ({
    label: SEG_LABEL[seg],
    color: SEG_COLOR[seg],
    points: data.trends
      .filter((tp) => tp.candidacyId === cand.id && tp.segment === seg)
      .sort((a, b) => a.week - b.week)
      .map((tp) => tp.share),
  }));

  return (
    <div>
      {poll && (
        <Link to={`/app/poll/${poll.id}`} className="text-sm text-plum hover:underline">
          ← {role?.title}
        </Link>
      )}
      <div className="mt-2 mb-4">
        <h1 className="font-heading text-3xl">{candUser?.name}</h1>
        <p className="text-muted">
          {candUser?.profession} · {partyName(data, candUser?.partyId ?? null)} ·{' '}
          {candUser && constituencyName(data, candUser.constituencyId)}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2 space-y-4">
          {/* Pitch */}
          <div className="card p-5">
            <h2 className="font-heading text-xl mb-2">{t.candidate.pitch}</h2>
            {cand.pitch?.kind === 'video' ? (
              <div>
                <div className="aspect-video w-full rounded-lg bg-ink/90 text-white flex items-center justify-center text-center px-4">
                  <div>
                    <div className="text-3xl">▶</div>
                    <p className="text-sm mt-2 opacity-80">{t.candidate.videoPlaceholder}</p>
                  </div>
                </div>
                <a
                  href={cand.pitch.content}
                  className="text-xs text-plum hover:underline break-all mt-2 inline-block"
                >
                  {cand.pitch.content}
                </a>
              </div>
            ) : cand.pitch ? (
              <p className="text-ink whitespace-pre-wrap">{cand.pitch.content}</p>
            ) : (
              <p className="text-muted text-sm">No pitch yet.</p>
            )}
          </div>

          {/* Results by segment */}
          <div className="card p-5">
            <h2 className="font-heading text-xl mb-3">{t.candidate.results}</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {perSegment.map((r) => (
                <div key={r.seg} className="rounded-lg border border-black/5 p-3">
                  <div className="text-xs text-muted">{SEG_LABEL[r.seg]}</div>
                  {r.hidden ? (
                    <div className="text-sm font-medium mt-1">{t.hiddenUntil}</div>
                  ) : (
                    <>
                      <div className="font-heading text-2xl">{Math.round(r.share * 100)}%</div>
                      <div className="text-xs text-muted">{r.count} votes</div>
                    </>
                  )}
                </div>
              ))}
            </div>
            <NotScientificNote />
          </div>

          {/* Trend */}
          <div className="card p-5">
            <h2 className="font-heading text-xl mb-3">{t.candidate.trend}</h2>
            <TrendChart series={trendSeries} />
            <div className="mt-2 flex gap-4 text-xs text-muted">
              {segments.map((seg) => (
                <span key={seg} className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: SEG_COLOR[seg] }} />
                  {SEG_LABEL[seg]}
                </span>
              ))}
            </div>
            <NotScientificNote />
          </div>
        </div>

        <div className="space-y-4">
          {/* Vote action */}
          {poll && (
            <div className="card p-5">
              <h2 className="font-heading text-lg mb-2">{role?.title}</h2>
              {elig.eligible ? (
                <button
                  className={isYourVote ? 'btn-outline w-full' : 'btn-primary w-full'}
                  onClick={() => castVote(poll.id, cand.id)}
                >
                  {isYourVote ? t.poll.voteRecorded : myVote ? t.poll.changeVote : t.poll.vote}
                </button>
              ) : (
                <p className="text-sm text-disapprove/90">{elig.reason}</p>
              )}
            </div>
          )}

          {/* Positions */}
          <div className="card p-5">
            <h2 className="font-heading text-lg mb-2">{t.candidate.positions}</h2>
            {cand.confirmedPositions.length > 0 ? (
              <ul className="space-y-1">
                {cand.confirmedPositions.map((p) => (
                  <li key={p} className="chip bg-approve/10 text-approve mr-1">
                    {p}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">{t.candidate.noPositions}</p>
            )}
          </div>

          {/* Profile */}
          <div className="card p-5">
            <h2 className="font-heading text-lg mb-2">{t.candidate.profileDetails}</h2>
            <dl className="text-sm space-y-2">
              <div>
                <dt className="text-muted">{t.signup.education}</dt>
                <dd>{candUser?.education}</dd>
              </div>
              <div>
                <dt className="text-muted">{t.signup.description}</dt>
                <dd>{candUser?.description}</dd>
              </div>
              <div>
                <dt className="text-muted">{t.signup.achievements}</dt>
                <dd>{candUser?.achievements}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
