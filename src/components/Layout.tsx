import { NavLink, Outlet } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { DemoPanel } from './DemoPanel';
import { StatusBadge } from './StatusBadge';
import { t } from '../i18n';

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          isActive ? 'bg-plum/10 text-plum' : 'text-muted hover:text-ink hover:bg-black/5'
        }`
      }
    >
      {label}
    </NavLink>
  );
}

export function Layout() {
  const user = useStore((s) => s.currentUser());
  const isAdmin = user?.role === 'party_admin';
  const isCoalition = user?.role === 'coalition_admin';

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 border-b border-black/5 bg-surface/90 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center gap-3 flex-wrap">
          <NavLink to="/app" className="font-heading text-xl text-ink mr-2">
            {t.appName}
            <span className="ml-2 chip bg-plum/10 text-plum align-middle">demo</span>
          </NavLink>
          <nav className="flex items-center gap-1 flex-wrap">
            <NavItem to="/app" label={t.nav.ballot} />
            <NavItem to="/app/approvals" label={t.nav.approvals} />
            <NavItem to="/app/become-candidate" label={t.nav.becomeCandidate} />
            <NavItem to="/app/profile" label={t.nav.profile} />
            {isAdmin && <NavItem to="/app/admin" label={t.nav.adminPanel} />}
            {isCoalition && <NavItem to="/app/coalition" label={t.nav.coalition} />}
          </nav>
          <div className="ml-auto flex items-center gap-2 text-sm text-muted">
            {user && (
              <>
                <span className="hidden sm:inline max-w-[12rem] truncate">{user.name}</span>
                <StatusBadge status={user.membershipStatus} />
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-6">
        <Outlet />
      </main>

      <footer className="border-t border-black/5 bg-surface">
        <div className="mx-auto max-w-5xl px-4 py-4 text-xs text-muted flex items-center justify-between flex-wrap gap-2">
          <span>
            {t.appName} · {t.footer.note}
          </span>
          <span>{t.notScientific}</span>
        </div>
      </footer>

      <DemoPanel />
    </div>
  );
}
