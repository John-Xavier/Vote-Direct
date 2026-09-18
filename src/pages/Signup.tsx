import { useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { t } from '../i18n';

type Step = 'phone' | 'otp' | 'constituency' | 'party' | 'profile';

export function Signup() {
  const navigate = useNavigate();
  const data = useStore((s) => s.data);
  const signup = useStore((s) => s.signup);

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [search, setSearch] = useState('');
  const [constituencyId, setConstituencyId] = useState('');
  const [partyId, setPartyId] = useState<string | null>(null);
  const [profile, setProfile] = useState({
    name: '',
    profession: '',
    education: '',
    description: '',
    achievements: '',
  });

  const filtered = useMemo(
    () =>
      data.constituencies.filter((c) =>
        `${c.name} ${c.district}`.toLowerCase().includes(search.toLowerCase()),
      ),
    [data.constituencies, search],
  );

  const phoneOk = /^\+?\d[\d\s]{7,}$/.test(phone.trim());
  const otpOk = /^\d{6}$/.test(otp.trim());

  const finish = () => {
    signup({
      phone: phone.trim(),
      name: profile.name || 'Demo User',
      profession: profile.profession,
      education: profile.education,
      description: profile.description,
      achievements: profile.achievements,
      constituencyId,
      partyId,
    });
    navigate('/app');
  };

  return (
    <div className="min-h-screen">
      <header className="mx-auto max-w-2xl px-4 py-5 flex items-center justify-between">
        <Link to="/" className="font-heading text-xl">
          {t.appName}
        </Link>
        <span className="chip bg-plum/10 text-plum">{t.demoBadge}</span>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="font-heading text-3xl mb-1">{t.signup.title}</h1>
        <ol className="flex gap-2 text-xs text-muted mb-6">
          {(['phone', 'otp', 'constituency', 'party', 'profile'] as Step[]).map((s, i) => (
            <li
              key={s}
              className={`chip ${step === s ? 'bg-plum text-white' : 'bg-black/5 text-muted'}`}
            >
              {i + 1}
            </li>
          ))}
        </ol>

        <div className="card p-6">
          {step === 'phone' && (
            <div>
              <h2 className="font-heading text-xl mb-1">{t.signup.phoneStep}</h2>
              <p className="text-sm text-muted mb-4">{t.signup.phoneHelp}</p>
              <label className="label" htmlFor="phone">
                {t.signup.phoneLabel}
              </label>
              <input
                id="phone"
                className="input"
                inputMode="tel"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <div className="mt-5">
                <button className="btn-primary" disabled={!phoneOk} onClick={() => setStep('otp')}>
                  {t.signup.sendOtp}
                </button>
              </div>
            </div>
          )}

          {step === 'otp' && (
            <div>
              <h2 className="font-heading text-xl mb-1">{t.signup.otpStep}</h2>
              <p className="text-sm text-muted mb-4">{t.signup.otpHelp}</p>
              <label className="label" htmlFor="otp">
                {t.signup.otpLabel}
              </label>
              <input
                id="otp"
                className="input tracking-[0.4em] text-center text-lg"
                inputMode="numeric"
                maxLength={6}
                placeholder="••••••"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              />
              <div className="mt-5 flex gap-2">
                <button className="btn-ghost" onClick={() => setStep('phone')}>
                  {t.signup.back}
                </button>
                <button className="btn-primary" disabled={!otpOk} onClick={() => setStep('constituency')}>
                  {t.signup.verify}
                </button>
              </div>
            </div>
          )}

          {step === 'constituency' && (
            <div>
              <h2 className="font-heading text-xl mb-1">{t.signup.constituencyStep}</h2>
              <p className="text-sm text-muted mb-4">{t.signup.constituencyHelp}</p>
              <input
                className="input mb-3"
                placeholder={t.signup.searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label={t.signup.searchPlaceholder}
              />
              <ul className="max-h-64 overflow-auto rounded-lg border border-black/10 divide-y divide-black/5">
                {filtered.map((c) => (
                  <li key={c.id}>
                    <button
                      className={`w-full text-left px-3 py-2 hover:bg-plum/5 ${
                        constituencyId === c.id ? 'bg-plum/10 text-plum font-medium' : ''
                      }`}
                      onClick={() => setConstituencyId(c.id)}
                    >
                      {c.name}
                      <span className="text-xs text-muted ml-2">{c.district}</span>
                    </button>
                  </li>
                ))}
                {filtered.length === 0 && (
                  <li className="px-3 py-2 text-sm text-muted">No matches.</li>
                )}
              </ul>
              <div className="mt-5 flex gap-2">
                <button className="btn-ghost" onClick={() => setStep('otp')}>
                  {t.signup.back}
                </button>
                <button className="btn-primary" disabled={!constituencyId} onClick={() => setStep('party')}>
                  {t.signup.next}
                </button>
              </div>
            </div>
          )}

          {step === 'party' && (
            <div>
              <h2 className="font-heading text-xl mb-1">{t.signup.partyStep}</h2>
              <p className="text-sm text-muted mb-4">{t.signup.partyHelp}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  className={`rounded-lg border p-3 text-left ${
                    partyId === null ? 'border-plum bg-plum/5' : 'border-black/10'
                  }`}
                  onClick={() => setPartyId(null)}
                >
                  <div className="font-medium">{t.signup.independent}</div>
                  <div className="text-xs text-muted">No party affiliation.</div>
                </button>
                {data.parties.map((p) => {
                  const front = data.fronts.find((f) => f.id === p.frontId);
                  return (
                    <button
                      key={p.id}
                      className={`rounded-lg border p-3 text-left ${
                        partyId === p.id ? 'border-plum bg-plum/5' : 'border-black/10'
                      }`}
                      onClick={() => setPartyId(p.id)}
                    >
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-muted">{front?.name}</div>
                    </button>
                  );
                })}
              </div>
              <div className="mt-5 flex gap-2">
                <button className="btn-ghost" onClick={() => setStep('constituency')}>
                  {t.signup.back}
                </button>
                <button className="btn-primary" onClick={() => setStep('profile')}>
                  {t.signup.next}
                </button>
              </div>
            </div>
          )}

          {step === 'profile' && (
            <div>
              <h2 className="font-heading text-xl mb-1">{t.signup.profileStep}</h2>
              <div className="grid gap-3">
                <div>
                  <label className="label" htmlFor="name">{t.signup.name}</label>
                  <input id="name" className="input" value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="label" htmlFor="prof">{t.signup.profession}</label>
                    <input id="prof" className="input" value={profile.profession}
                      onChange={(e) => setProfile({ ...profile, profession: e.target.value })} />
                  </div>
                  <div>
                    <label className="label" htmlFor="edu">{t.signup.education}</label>
                    <input id="edu" className="input" value={profile.education}
                      onChange={(e) => setProfile({ ...profile, education: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="label" htmlFor="desc">{t.signup.description}</label>
                  <textarea id="desc" className="input" rows={3} value={profile.description}
                    onChange={(e) => setProfile({ ...profile, description: e.target.value })} />
                </div>
                <div>
                  <label className="label" htmlFor="ach">{t.signup.achievements}</label>
                  <textarea id="ach" className="input" rows={2} value={profile.achievements}
                    onChange={(e) => setProfile({ ...profile, achievements: e.target.value })} />
                </div>
              </div>
              <div className="mt-5 flex gap-2">
                <button className="btn-ghost" onClick={() => setStep('party')}>
                  {t.signup.back}
                </button>
                <button className="btn-primary" disabled={!profile.name} onClick={finish}>
                  {t.signup.finish}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
