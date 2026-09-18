import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { canVoteInPoll } from '../lib/rules';
import { activeWhoPolls, roleOfPoll, userVoteInPoll } from '../lib/selectors';
import { t } from '../i18n';
import type { RoleScope } from '../data/types';

const GROUPS: { scope: RoleScope; label: string }[] = [
  { scope: 'everyone', label: t.ballot.openPolls },
  { scope: 'front', label: t.ballot.frontPolls },
  { scope: 'party', label: t.ballot.partyPolls },
  { scope: 'constituency', label: t.ballot.seatPolls },
];

export function Ballot() {
  const data = useStore((s) => s.data);
  const user = useStore((s) => s.currentUser());
  const now = useStore((s) => s.now());
  if (!user) return null;

  const polls = activeWhoPolls(data);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-3xl">{t.ballot.title}</h1>
        <p className="text-muted mt-1">{t.ballot.subtitle}</p>
      </div>

      <div className="space-y-8">
        {GROUPS.map((group) => {
          const groupPolls = polls.filter(
            (p) => roleOfPoll(data, p).scope === group.scope,
          );
          if (groupPolls.length === 0) return null;
          return (
            <section key={group.scope}>
              <h2 className="font-heading text-xl mb-3">{group.label}</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {groupPolls.map((poll) => {
                  const role = roleOfPoll(data, poll);
                  const elig = canVoteInPoll({ user, role, poll, fronts: data.fronts, now });
                  const myVote = userVoteInPoll(data, user.id, poll.id);
                  return (
                    <Link
                      key={poll.id}
                      to={`/app/poll/${poll.id}`}
                      className="card p-4 hover:border-plum/30 transition-colors block"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-medium text-ink">{role.title}</h3>
                        {elig.eligible ? (
                          myVote ? (
                            <span className="chip bg-approve/10 text-approve shrink-0">
                              {t.ballot.voted}
                            </span>
                          ) : (
                            <span className="chip bg-plum/10 text-plum shrink-0">
                              {t.ballot.notVoted}
                            </span>
                          )
                        ) : (
                          <span className="chip bg-black/5 text-muted shrink-0">
                            {t.ballot.viewOnly}
                          </span>
                        )}
                      </div>
                      {!elig.eligible && (
                        <p className="mt-2 text-xs text-disapprove/90">{elig.reason}</p>
                      )}
                      {elig.eligible && (
                        <p className="mt-2 text-xs text-muted">{t.ballot.canVote}</p>
                      )}
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
