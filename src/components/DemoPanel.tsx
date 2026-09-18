import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { PERSONA_IDS } from '../data/seed';
import { t } from '../i18n';

const PERSONAS: { id: string; label: string }[] = [
  { id: PERSONA_IDS.independent, label: t.demo.personaIndependent },
  { id: PERSONA_IDS.selfA, label: t.demo.personaSelfA },
  { id: PERSONA_IDS.verifiedA, label: t.demo.personaVerifiedA },
  { id: PERSONA_IDS.verifiedB, label: t.demo.personaVerifiedB },
  { id: PERSONA_IDS.adminA, label: t.demo.personaAdminA },
  { id: PERSONA_IDS.coadmin1, label: t.demo.personaCoadmin1 },
];

export function DemoPanel() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const currentUserId = useStore((s) => s.currentUserId);
  const clockOffsetMs = useStore((s) => s.data.clockOffsetMs);
  const simulateLive = useStore((s) => s.simulateLive);
  const setPersona = useStore((s) => s.setPersona);
  const advance90 = useStore((s) => s.advance90Days);
  const toggleLive = useStore((s) => s.toggleSimulateLive);
  const tick = useStore((s) => s.tickLiveActivity);
  const reset = useStore((s) => s.reset);

  // Live-activity interval: adds random votes every ~2.5s while enabled.
  useEffect(() => {
    if (!simulateLive) return;
    const id = window.setInterval(() => tick(), 2500);
    return () => window.clearInterval(id);
  }, [simulateLive, tick]);

  const daysAdvanced = Math.round(clockOffsetMs / (24 * 60 * 60 * 1000));

  return (
    <div className="fixed bottom-4 right-4 z-50 print:hidden">
      {open ? (
        <div className="card w-[min(92vw,20rem)] p-4 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading text-lg">{t.demo.title}</h2>
            <button className="btn-ghost px-2 py-1 text-sm" onClick={() => setOpen(false)} aria-label="Close demo panel">
              ✕
            </button>
          </div>

          <label className="label" htmlFor="persona">
            {t.demo.persona}
          </label>
          <select
            id="persona"
            className="input mb-3"
            value={PERSONAS.some((p) => p.id === currentUserId) ? currentUserId : ''}
            onChange={(e) => {
              setPersona(e.target.value);
              navigate('/app');
            }}
          >
            {!PERSONAS.some((p) => p.id === currentUserId) && (
              <option value="">Signed-up user (custom)</option>
            )}
            {PERSONAS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>

          <div className="grid grid-cols-1 gap-2">
            <button className="btn-outline text-sm" onClick={advance90}>
              {t.demo.advance}
            </button>
            <div className="flex items-center justify-between rounded-lg border border-black/10 px-3 py-2">
              <span className="text-sm">{t.demo.simulate}</span>
              <button
                role="switch"
                aria-checked={simulateLive}
                onClick={toggleLive}
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  simulateLive ? 'bg-approve' : 'bg-black/20'
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                    simulateLive ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
            <button
              className="btn-ghost text-sm border border-disapprove/30 text-disapprove"
              onClick={() => {
                reset();
                navigate('/app');
              }}
            >
              {t.demo.reset}
            </button>
          </div>

          <p className="mt-3 text-xs text-muted">
            {t.demo.clock}: +{daysAdvanced} days{simulateLive ? ` · ${t.demo.simulateOn}` : ''}
          </p>
        </div>
      ) : (
        <button
          className="btn-primary shadow-lg"
          onClick={() => setOpen(true)}
          aria-label="Open demo panel"
        >
          <span aria-hidden>🎛</span> {t.demo.title}
        </button>
      )}
    </div>
  );
}
