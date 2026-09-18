import { useState } from 'react';
import { useStore } from '../store/useStore';
import { computeResults } from '../lib/rules';
import { candidacyById, constituencyName, userById } from '../lib/selectors';
import { StatusBadge } from '../components/StatusBadge';
import { InfoBanner } from '../components/Bits';
import { NotScientificNote } from '../components/NotScientificNote';
import { t } from '../i18n';
import type { AuditLogEntry } from '../data/types';

type Section = 'queue' | 'members' | 'positions' | 'results' | 'coalition' | 'audit' | 'billing';

const SECTIONS: { id: Section; label: string }[] = [
  { id: 'queue', label: t.admin.queue },
  { id: 'members', label: t.admin.members },
  { id: 'positions', label: t.admin.positions },
  { id: 'results', label: t.admin.results },
  { id: 'coalition', label: t.admin.coalition },
  { id: 'audit', label: t.admin.audit },
  { id: 'billing', label: t.admin.billing },
];

const POSITION_OPTIONS = [
  'District Secretary',
  'Youth Wing President',
  'Booth Committee Convener',
  'Women’s Wing Coordinator',
  'Treasurer',
];

export function AdminPanel() {
  const [section, setSection] = useState<Section>('queue');
  const admin = useStore((s) => s.currentUser());
  const partyId = admin?.adminOfPartyId ?? null;

  if (!admin || !partyId) {
    return (
      <InfoBanner>
        This persona is not a party admin. Switch to “Party A — admin” in the demo panel.
      </InfoBanner>
    );
  }

  return (
    <div>
      <h1 className="font-heading text-3xl mb-1">{t.admin.title}</h1>
      <InfoBanner>{t.admin.aggregatesOnly}</InfoBanner>
      <div className="mt-4 grid gap-4 md:grid-cols-[12rem,1fr]">
        <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className={`rounded-lg px-3 py-2 text-sm text-left whitespace-nowrap ${
                section === s.id ? 'bg-plum/10 text-plum font-medium' : 'text-muted hover:bg-black/5'
              }`}
            >
              {s.label}
            </button>
          ))}
        </nav>
        <div>
          {section === 'queue' && <Queue partyId={partyId} />}
          {section === 'members' && <Members partyId={partyId} />}
          {section === 'positions' && <Positions partyId={partyId} />}
          {section === 'results' && <Results partyId={partyId} />}
          {section === 'coalition' && <Coalition partyId={partyId} />}
          {section === 'audit' && <Audit partyId={partyId} />}
          {section === 'billing' && <Billing />}
        </div>
      </div>
    </div>
  );
}

function Queue({ partyId }: { partyId: string }) {
  const data = useStore((s) => s.data);
  const verify = useStore((s) => s.adminVerify);
  const reject = useStore((s) => s.adminReject);
  const [con, setCon] = useState('');

  const pending = data.users.filter(
    (u) => u.partyId === partyId && u.membershipStatus === 'self_declared' && (!con || u.constituencyId === con),
  );

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <h2 className="font-heading text-xl">{t.admin.queue}</h2>
        <div>
          <label className="label inline mr-2">{t.admin.filterConstituency}</label>
          <select className="input inline w-auto" value={con} onChange={(e) => setCon(e.target.value)}>
            <option value="">{t.admin.all}</option>
            {data.constituencies.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>
      {pending.length === 0 ? (
        <p className="text-muted text-sm">No members waiting for verification.</p>
      ) : (
        <ul className="divide-y divide-black/5">
          {pending.map((u) => (
            <li key={u.id} className="flex items-center justify-between gap-3 py-3">
              <div>
                <div className="font-medium">{u.name}</div>
                <div className="text-xs text-muted">
                  {u.profession} · {constituencyName(data, u.constituencyId)}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button className="btn text-white bg-approve text-sm" onClick={() => verify(u.id)}>
                  {t.admin.approve}
                </button>
                <button className="btn text-white text-sm" style={{ background: '#B4532A' }} onClick={() => reject(u.id)}>
                  {t.admin.reject}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Members({ partyId }: { partyId: string }) {
  const data = useStore((s) => s.data);
  const now = useStore((s) => s.now());
  const reAdd = useStore((s) => s.adminReAdd);

  const members = data.users.filter((u) => u.partyId === partyId);
  const rejected = data.users.filter(
    (u) => u.partyId === null && u.cooldowns.some((c) => c.partyId === partyId && c.reason === 'rejected' && c.until > now),
  );

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <h2 className="font-heading text-xl mb-3">{t.admin.members} ({members.length})</h2>
        <ul className="divide-y divide-black/5">
          {members.map((u) => (
            <li key={u.id} className="flex items-center justify-between py-2">
              <span>{u.name} <span className="text-xs text-muted">· {constituencyName(data, u.constituencyId)}</span></span>
              <StatusBadge status={u.membershipStatus} />
            </li>
          ))}
        </ul>
      </div>
      <div className="card p-5">
        <h2 className="font-heading text-xl mb-3">Rejected — can be re-added</h2>
        {rejected.length === 0 ? (
          <p className="text-muted text-sm">No rejected members in cooldown.</p>
        ) : (
          <ul className="divide-y divide-black/5">
            {rejected.map((u) => (
              <li key={u.id} className="flex items-center justify-between py-2">
                <span>{u.name}</span>
                <button className="btn-outline text-sm" onClick={() => reAdd(u.id)}>{t.admin.reAdd}</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Positions({ partyId }: { partyId: string }) {
  const data = useStore((s) => s.data);
  const assign = useStore((s) => s.assignPosition);
  const remove = useStore((s) => s.removePosition);
  const [userId, setUserId] = useState('');
  const [position, setPosition] = useState(POSITION_OPTIONS[0]);

  const members = data.users.filter((u) => u.partyId === partyId && u.membershipStatus !== 'independent');
  const held = data.candidacies
    .filter((c) => c.confirmedPositions.length > 0 && members.some((m) => m.id === c.userId))
    .flatMap((c) => c.confirmedPositions.map((p) => ({ userId: c.userId, position: p })));

  return (
    <div className="card p-5">
      <h2 className="font-heading text-xl mb-3">{t.admin.positions}</h2>
      <div className="grid gap-3 sm:grid-cols-3 items-end">
        <div>
          <label className="label" htmlFor="member">Member</label>
          <select id="member" className="input" value={userId} onChange={(e) => setUserId(e.target.value)}>
            <option value="">Select…</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="pos">Position</label>
          <select id="pos" className="input" value={position} onChange={(e) => setPosition(e.target.value)}>
            {POSITION_OPTIONS.map((p) => <option key={p}>{p}</option>)}
          </select>
        </div>
        <button className="btn-primary" disabled={!userId} onClick={() => userId && assign(userId, position)}>
          {t.admin.assign}
        </button>
      </div>

      <h3 className="font-medium mt-6 mb-2">Confirmed positions</h3>
      {held.length === 0 ? (
        <p className="text-muted text-sm">No positions assigned yet.</p>
      ) : (
        <ul className="divide-y divide-black/5">
          {held.map((h, i) => (
            <li key={i} className="flex items-center justify-between py-2">
              <span>{userById(data, h.userId)?.name} — <span className="text-plum">{h.position}</span></span>
              <button className="btn-ghost text-sm text-disapprove" onClick={() => remove(h.userId, h.position)}>
                {t.admin.remove}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Results({ partyId }: { partyId: string }) {
  const data = useStore((s) => s.data);
  // Party-scoped polls (internal + constituency candidates for this party).
  const partyRoleIds = data.roles.filter((r) => r.partyId === partyId).map((r) => r.id);
  const polls = data.polls.filter((p) => p.type === 'who_should_hold' && partyRoleIds.includes(p.roleId));

  return (
    <div className="card p-5">
      <h2 className="font-heading text-xl mb-1">{t.admin.results}</h2>
      <p className="text-xs text-muted mb-4">{t.admin.aggregatesOnly}</p>
      <div className="space-y-4">
        {polls.map((poll) => {
          const role = data.roles.find((r) => r.id === poll.roleId)!;
          const res = computeResults({
            poll,
            votes: data.votes,
            users: data.users,
            candidacies: data.candidacies,
            segment: 'members',
          });
          return (
            <div key={poll.id} className="rounded-lg border border-black/5 p-3">
              <div className="flex justify-between items-baseline">
                <h3 className="font-medium">{role.title}</h3>
                <span className="text-xs text-muted">{res.total} votes · members segment</span>
              </div>
              {res.hidden ? (
                <p className="text-sm text-muted mt-1">{t.hiddenUntil}</p>
              ) : (
                <ol className="mt-2 space-y-1 text-sm">
                  {res.ranked.slice(0, 3).map((r) => {
                    const cu = userById(data, candidacyById(data, r.candidacyId)?.userId ?? '');
                    return (
                      <li key={r.candidacyId} className="flex justify-between">
                        <span>{cu?.name ?? 'Candidate'}</span>
                        <span className="tabular-nums text-muted">{Math.round(r.share * 100)}%</span>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          );
        })}
      </div>
      <NotScientificNote />
    </div>
  );
}

function Coalition({ partyId }: { partyId: string }) {
  const data = useStore((s) => s.data);
  const appoint = useStore((s) => s.appointCoalitionAdmin);
  const front = data.fronts.find((f) => f.partyIds.includes(partyId));
  const current = front?.coalitionAdminUserId ? userById(data, front.coalitionAdminUserId) : null;
  const [userId, setUserId] = useState('');
  const members = data.users.filter((u) => u.partyId === partyId && u.membershipStatus === 'verified');

  return (
    <div className="card p-5">
      <h2 className="font-heading text-xl mb-3">{t.admin.coalition}</h2>
      <p className="text-sm text-muted mb-3">
        {front?.name} coalition admin runs the front’s CM candidate poll.
      </p>
      {current && (
        <p className="mb-3 text-sm">
          Current {t.admin.appointed}: <strong>{current.name}</strong>
        </p>
      )}
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <label className="label" htmlFor="coadmin">Appoint from your verified members</label>
          <select id="coadmin" className="input" value={userId} onChange={(e) => setUserId(e.target.value)}>
            <option value="">Select…</option>
            {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <button className="btn-primary" disabled={!userId} onClick={() => userId && appoint(userId)}>
          {t.admin.appoint}
        </button>
      </div>
    </div>
  );
}

function Audit({ partyId }: { partyId: string }) {
  const data = useStore((s) => s.data);
  const entries = data.auditLog.filter((e) => e.partyId === partyId);
  return (
    <div className="card p-5">
      <h2 className="font-heading text-xl mb-3">{t.admin.audit}</h2>
      {entries.length === 0 ? (
        <p className="text-muted text-sm">No audit entries yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted">
              <tr>
                <th className="py-1 pr-3">{t.admin.when}</th>
                <th className="py-1 pr-3">{t.admin.who}</th>
                <th className="py-1 pr-3">{t.admin.action}</th>
                <th className="py-1 pr-3">{t.admin.target}</th>
                <th className="py-1">{t.admin.detail}</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e: AuditLogEntry) => (
                <tr key={e.id} className="border-t border-black/5 align-top">
                  <td className="py-2 pr-3 whitespace-nowrap text-muted">
                    {new Date(e.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-2 pr-3">{e.adminName}</td>
                  <td className="py-2 pr-3">
                    <span className="chip bg-black/5">{e.action.replace(/_/g, ' ')}</span>
                  </td>
                  <td className="py-2 pr-3">{e.targetUserName}</td>
                  <td className="py-2">{e.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const PLANS: { name: string; price: string; features: string[] }[] = [
  { name: 'Starter', price: '₹0 (demo)', features: ['Up to 500 members', 'Verification queue', 'Aggregate results'] },
  { name: 'District', price: '₹4,999 / mo (placeholder)', features: ['Up to 10,000 members', 'Positions & audit log', 'Coalition admin'] },
  { name: 'State', price: 'Custom (placeholder)', features: ['Unlimited members', 'Priority support', 'Export aggregates'] },
];

function Billing() {
  return (
    <div className="card p-5">
      <h2 className="font-heading text-xl mb-1">{t.admin.billing}</h2>
      <InfoBanner>No real payments in this demo — plans are placeholders.</InfoBanner>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {PLANS.map((p) => (
          <div key={p.name} className="rounded-lg border border-black/10 p-4">
            <h3 className="font-heading text-lg">{p.name}</h3>
            <p className="text-plum font-medium mt-1">{p.price}</p>
            <ul className="mt-3 space-y-1 text-sm text-muted">
              {p.features.map((f) => <li key={f}>• {f}</li>)}
            </ul>
            <button className="btn-outline w-full mt-4 text-sm" disabled>Choose (demo)</button>
          </div>
        ))}
      </div>
    </div>
  );
}
