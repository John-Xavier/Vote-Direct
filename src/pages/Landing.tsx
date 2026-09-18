import { Link } from 'react-router-dom';
import { t } from '../i18n';

function Step({ title, body }: { title: string; body: string }) {
  return (
    <div className="card p-5">
      <h3 className="font-heading text-lg text-ink">{title}</h3>
      <p className="mt-2 text-sm text-muted">{body}</p>
    </div>
  );
}

export function Landing() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="mx-auto w-full max-w-5xl px-4 py-5 flex items-center justify-between">
        <span className="font-heading text-xl">
          {t.appName}
          <span className="ml-2 chip bg-plum/10 text-plum align-middle">demo</span>
        </span>
        <Link to="/signup" className="btn-outline text-sm">
          {t.landing.tryDemo}
        </Link>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-4 py-12 md:py-20">
          <p className="text-plum font-medium">{t.tagline}</p>
          <h1 className="mt-3 font-heading text-4xl md:text-5xl leading-tight text-ink max-w-3xl">
            {t.landing.heroTitle}
          </h1>
          <p className="mt-4 text-lg text-muted max-w-2xl">{t.landing.heroSubtitle}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/signup" className="btn-primary">
              {t.landing.tryDemo}
            </Link>
            <Link to="/app" className="btn-outline">
              Skip to the app
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-8">
          <h2 className="font-heading text-2xl mb-5">{t.landing.howItWorks}</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Step title={t.landing.step1Title} body={t.landing.step1Body} />
            <Step title={t.landing.step2Title} body={t.landing.step2Body} />
            <Step title={t.landing.step3Title} body={t.landing.step3Body} />
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-8 pb-16">
          <div className="card p-6">
            <h2 className="font-heading text-2xl">{t.landing.forParties}</h2>
            <p className="mt-2 text-muted max-w-2xl">{t.landing.forPartiesBody}</p>
          </div>
        </section>
      </main>

      <footer className="border-t border-black/5">
        <div className="mx-auto max-w-5xl px-4 py-4 text-xs text-muted">
          {t.appName} · {t.footer.note}
        </div>
      </footer>
    </div>
  );
}
