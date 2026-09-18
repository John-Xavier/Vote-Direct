import { t } from '../i18n';

/** Shown on every results view. */
export function NotScientificNote() {
  return (
    <p className="mt-3 text-xs text-muted flex items-center gap-1.5">
      <span aria-hidden>ⓘ</span>
      {t.notScientific}
    </p>
  );
}
