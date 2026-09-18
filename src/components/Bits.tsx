import { t } from '../i18n';

export function LiveIndicator() {
  return (
    <span className="chip bg-approve/10 text-approve">
      <span className="inline-block h-2 w-2 rounded-full bg-approve animate-pulse" aria-hidden />
      {t.live}
    </span>
  );
}

export function HiddenSegment({ total }: { total: number }) {
  return (
    <div className="rounded-lg border border-dashed border-black/15 bg-bg p-4 text-center">
      <p className="font-medium text-ink">{t.hiddenUntil}</p>
      <p className="text-xs text-muted mt-1">
        This segment has {total} of 20 votes needed to show a result.
      </p>
    </div>
  );
}

export function InfoBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-plum/20 bg-plum/5 p-3 text-sm text-ink">
      {children}
    </div>
  );
}
