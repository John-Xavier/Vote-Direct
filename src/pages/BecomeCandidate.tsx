import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { eligibleRolesForUser } from '../lib/rules';
import { t } from '../i18n';
import type { PitchKind } from '../data/types';

export function BecomeCandidate() {
  const navigate = useNavigate();
  const data = useStore((s) => s.data);
  const user = useStore((s) => s.currentUser());
  const becomeCandidate = useStore((s) => s.becomeCandidate);

  const [roleId, setRoleId] = useState('');
  const [kind, setKind] = useState<PitchKind>('post');
  const [content, setContent] = useState('');

  if (!user) return null;
  const roles = eligibleRolesForUser(user, data.roles, data.fronts);
  const canPublish = roleId !== '' && content.trim().length > 0;

  const publish = () => {
    becomeCandidate(roleId, { kind, content: content.trim() });
    const cand = useStore
      .getState()
      .data.candidacies.find((c) => c.userId === user.id && c.roleId === roleId);
    if (cand) navigate(`/app/candidate/${cand.id}`);
  };

  return (
    <div>
      <h1 className="font-heading text-3xl mb-1">{t.become.title}</h1>
      <p className="text-muted mb-6">{t.become.subtitle}</p>

      {roles.length === 0 ? (
        <div className="card p-6 text-muted">{t.become.noEligible}</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="card p-5">
            <h2 className="font-heading text-xl mb-3">{t.become.pickRole}</h2>
            <div className="space-y-2 max-h-80 overflow-auto">
              {roles.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setRoleId(r.id)}
                  className={`w-full text-left rounded-lg border p-3 ${
                    roleId === r.id ? 'border-plum bg-plum/5' : 'border-black/10'
                  }`}
                >
                  <div className="font-medium">{r.title}</div>
                  <div className="text-xs text-muted capitalize">{r.scope} role</div>
                </button>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <h2 className="font-heading text-xl mb-3">{t.become.addPitch}</h2>
            <div className="flex gap-2 mb-3" role="tablist" aria-label={t.become.pitchKind}>
              <button
                role="tab"
                aria-selected={kind === 'post'}
                className={kind === 'post' ? 'btn-primary text-sm' : 'btn-outline text-sm'}
                onClick={() => setKind('post')}
              >
                {t.become.post}
              </button>
              <button
                role="tab"
                aria-selected={kind === 'video'}
                className={kind === 'video' ? 'btn-primary text-sm' : 'btn-outline text-sm'}
                onClick={() => setKind('video')}
              >
                {t.become.video}
              </button>
            </div>
            {kind === 'video' ? (
              <div>
                <label className="label" htmlFor="vid">{t.become.videoUrlLabel}</label>
                <input
                  id="vid"
                  className="input"
                  placeholder="https://…"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>
            ) : (
              <div>
                <label className="label" htmlFor="post">{t.become.postLabel}</label>
                <textarea
                  id="post"
                  className="input"
                  rows={6}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>
            )}
            <div className="mt-4">
              <button className="btn-primary" disabled={!canPublish} onClick={publish}>
                {t.become.publish}
              </button>
              {!canPublish && <p className="mt-2 text-xs text-muted">{t.become.needPitch}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
