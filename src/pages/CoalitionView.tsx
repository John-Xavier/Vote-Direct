import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { computeResults } from '../lib/rules';
import { candidacyById, userById } from '../lib/selectors';
import { SegmentTabs } from '../components/SegmentTabs';
import { NotScientificNote } from '../components/NotScientificNote';
import { HiddenSegment, InfoBanner, LiveIndicator } from '../components/Bits';
import { VoteBar } from '../components/VoteBar';
import { t } from '../i18n';
import type { Segment } from '../data/types';

export function CoalitionView() {
  const data = useStore((s) => s.data);
  const user = useStore((s) => s.currentUser());
  const [segment, setSegment] = useState<Segment>('all');

  const frontId = user?.adminOfFrontId;
  const front = data.fronts.find((f) => f.id === frontId);

  if (!user || !front) {
    return (
      <InfoBanner>
        This persona is not a coalition admin. Switch to “LDF — coalition admin” in the demo panel.
      </InfoBanner>
    );
  }

  const role = data.roles.find((r) => r.scope === 'front' && r.frontId === front.id);
  const poll = role && data.polls.find((p) => p.roleId === role.id && p.type === 'who_should_hold');
  const res = poll
    ? computeResults({
        poll,
        votes: data.votes,
        users: data.users,
        candidacies: data.candidacies,
        segment,
      })
    : null;

  return (
    <div>
      <h1 className="font-heading text-3xl mb-1">{t.coalitionAdmin.title}</h1>
      <p className="text-muted mb-4">
        {front.name} — {t.coalitionAdmin.subtitle}
      </p>
      <InfoBanner>{t.coalitionAdmin.onlyFront}</InfoBanner>

      {poll && res && (
        <div className="card p-5 mt-4">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h2 className="font-heading text-xl">{role?.title}</h2>
            <div className="flex items-center gap-2">
              <LiveIndicator />
              <Link to={`/app/poll/${poll.id}`} className="btn-outline text-sm">
                Open poll
              </Link>
            </div>
          </div>
          <SegmentTabs value={segment} onChange={setSegment} />
          <div className="mt-4 space-y-2">
            {res.hidden ? (
              <HiddenSegment total={res.total} />
            ) : (
              res.ranked.map((r) => {
                const cu = userById(data, candidacyById(data, r.candidacyId)?.userId ?? '');
                return (
                  <VoteBar
                    key={r.candidacyId}
                    candidacyId={r.candidacyId}
                    name={cu?.name ?? 'Candidate'}
                    subtitle={cu?.profession}
                    share={r.share}
                    count={r.count}
                  />
                );
              })
            )}
          </div>
          <NotScientificNote />
        </div>
      )}
    </div>
  );
}
