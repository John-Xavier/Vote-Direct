import { useState } from 'react';
import { useStore } from '../store/useStore';
import { cooldownRemainingDays } from '../lib/rules';
import { constituencyName, partyName } from '../lib/selectors';
import { StatusBadge } from '../components/StatusBadge';
import { InfoBanner } from '../components/Bits';
import { t } from '../i18n';

export function Profile() {
  const data = useStore((s) => s.data);
  const user = useStore((s) => s.currentUser());
  const now = useStore((s) => s.now());
  const updateProfile = useStore((s) => s.updateProfile);
  const changeParty = useStore((s) => s.changeParty);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(() => ({
    name: user?.name ?? '',
    profession: user?.profession ?? '',
    education: user?.education ?? '',
    description: user?.description ?? '',
    achievements: user?.achievements ?? '',
  }));
  const [pendingParty, setPendingParty] = useState<string | null | undefined>(undefined);

  if (!user) return null;

  const save = () => {
    updateProfile(form);
    setEditing(false);
  };

  return (
    <div className="max-w-3xl">
      <h1 className="font-heading text-3xl mb-6">{t.profile.title}</h1>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Profile card */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading text-xl">{t.candidate.profileDetails}</h2>
            {!editing && (
              <button className="btn-outline text-sm" onClick={() => setEditing(true)}>
                {t.profile.edit}
              </button>
            )}
          </div>
          {editing ? (
            <div className="space-y-3">
              {(['name', 'profession', 'education'] as const).map((f) => (
                <div key={f}>
                  <label className="label capitalize" htmlFor={f}>{f}</label>
                  <input
                    id={f}
                    className="input"
                    value={form[f]}
                    onChange={(e) => setForm({ ...form, [f]: e.target.value })}
                  />
                </div>
              ))}
              <div>
                <label className="label" htmlFor="description">{t.signup.description}</label>
                <textarea id="description" className="input" rows={3} value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <label className="label" htmlFor="achievements">{t.signup.achievements}</label>
                <textarea id="achievements" className="input" rows={2} value={form.achievements}
                  onChange={(e) => setForm({ ...form, achievements: e.target.value })} />
              </div>
              <div className="flex gap-2">
                <button className="btn-primary" onClick={save}>{t.profile.save}</button>
                <button className="btn-ghost" onClick={() => setEditing(false)}>{t.profile.cancel}</button>
              </div>
            </div>
          ) : (
            <dl className="text-sm space-y-2">
              <div><dt className="text-muted">Name</dt><dd>{user.name}</dd></div>
              <div><dt className="text-muted">Profession</dt><dd>{user.profession}</dd></div>
              <div><dt className="text-muted">Education</dt><dd>{user.education}</dd></div>
              <div><dt className="text-muted">Constituency</dt><dd>{constituencyName(data, user.constituencyId)}</dd></div>
              <div><dt className="text-muted">About</dt><dd>{user.description}</dd></div>
              <div><dt className="text-muted">Achievements</dt><dd>{user.achievements}</dd></div>
            </dl>
          )}
        </div>

        {/* Status + party */}
        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="font-heading text-xl mb-3">{t.profile.verification}</h2>
            <div className="flex items-center gap-2">
              <StatusBadge status={user.membershipStatus} />
              <span className="text-sm text-muted">{partyName(data, user.partyId)}</span>
            </div>
            {user.cooldowns.filter((c) => c.until > now).map((c) => (
              <p key={c.partyId} className="mt-3 text-xs text-disapprove">
                {t.profile.cooldownActive}: {partyName(data, c.partyId)} —{' '}
                {cooldownRemainingDays(user, c.partyId, now)} days left ({c.reason.replace('_', ' ')}).
              </p>
            ))}
          </div>

          <div className="card p-5">
            <h2 className="font-heading text-xl mb-3">{t.profile.changeParty}</h2>
            <InfoBanner>{t.profile.changePartyWarn}</InfoBanner>
            <div className="mt-3">
              <label className="label" htmlFor="newparty">New affiliation</label>
              <select
                id="newparty"
                className="input"
                value={pendingParty === undefined ? '__none__' : pendingParty ?? ''}
                onChange={(e) =>
                  setPendingParty(e.target.value === '' ? null : e.target.value)
                }
              >
                <option value="__none__" disabled>Select…</option>
                <option value="">Independent</option>
                {data.parties.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <button
              className="btn-primary mt-3"
              disabled={pendingParty === undefined || pendingParty === user.partyId}
              onClick={() => {
                if (pendingParty !== undefined) {
                  changeParty(pendingParty);
                  setPendingParty(undefined);
                }
              }}
            >
              {t.profile.confirmChange}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
