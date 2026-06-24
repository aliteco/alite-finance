import Link from 'next/link'

const NAV_LINKS = [
  { label: 'Features', href: '/features' },
  { label: 'How it works', href: '/how-it-works' },
  { label: 'FAQ', href: '/faq' },
]

const DETAILS = [
  {
    icon: '⇄',
    title: 'Transfer-aware accounting',
    body: 'Tell Alite once which accounts are yours. After that, every transfer between them is recognized automatically — it never shows up as income, never shows up as an expense, and never distorts your savings rate. Your numbers reflect money that actually entered or left your life.',
    points: [
      'Transfers excluded from income & expense totals',
      'Works across any number of accounts',
      'Net worth stays accurate no matter how often you move money',
    ],
  },
  {
    icon: '₿',
    title: 'True multi-currency tracking',
    body: 'Hold IDR, USD, EUR, or anything else. Every transaction is stored at the exchange rate that was actually in effect when it happened, so historical balances never quietly reinterpret themselves at today’s rate.',
    points: [
      'Per-transaction historical exchange rates',
      'Mix currencies across accounts without losing accuracy',
      'Net worth converts cleanly into one home currency',
    ],
  },
  {
    icon: '◎',
    title: 'Live budgets',
    body: 'Set a limit per category and watch your progress update as you spend — not in a monthly report you read after the damage is done.',
    points: [
      'Per-category spending limits',
      'Real-time progress as transactions land',
      'Clear signal before you overspend, not after',
    ],
  },
  {
    icon: '↕',
    title: 'Honest, computed metrics',
    body: 'Net worth, income, expenses, and savings rate are calculated directly from your transaction data, every time you open the app. No estimates, no interpolation, no stale snapshots.',
    points: [
      'Real-time calculation, not periodic batch jobs',
      'No smoothing or rounding that hides reality',
      'The same number whether you check it once a day or fifty times',
    ],
  },
]

export default function FeaturesPage() {
  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <span className="text-primary-foreground font-bold text-sm leading-none">A</span>
            </div>
            <span className="text-sm font-semibold tracking-tight">Alite</span>
          </Link>

          <nav className="hidden md:flex items-center gap-7">
            {NAV_LINKS.map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className={`text-xs transition-colors ${
                  label === 'Features' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2.5">
            <Link
              href="/login"
              className="hidden sm:block text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="text-xs font-medium bg-primary text-primary-foreground rounded-lg px-3.5 py-1.5 hover:opacity-90 transition-opacity"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <section className="max-w-2xl mx-auto px-6 pt-16 pb-12 text-center">
        <p className="text-[11px] text-muted-foreground tracking-widest uppercase mb-3">Features</p>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-[-0.04em] leading-[1.08] mb-5">
          Built for the way<br /><span className="text-muted-foreground">money actually moves.</span>
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
          Every feature below exists to answer one question honestly: how much do you actually have, and where did it come from?
        </p>
      </section>

      <section className="max-w-2xl mx-auto px-6 pb-24">
        <div className="space-y-4">
          {DETAILS.map(({ icon, title, body, points }) => (
            <div key={title} className="bg-card border border-border rounded-[18px] p-6 sm:p-8">
              <div className="w-10 h-10 rounded-[10px] bg-muted flex items-center justify-center text-lg mb-5">
                {icon}
              </div>
              <h2 className="text-xl font-semibold tracking-tight mb-2">{title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-5 max-w-xl">{body}</p>
              <ul className="space-y-2">
                {points.map((point) => (
                  <li key={point} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <span className="text-income mt-0.5 shrink-0">✓</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-border">
        <div className="max-w-2xl mx-auto px-6 py-20 text-center">
          <h2 className="text-3xl font-bold tracking-[-0.05em] mb-3">See it work on your own numbers.</h2>
          <p className="text-sm text-muted-foreground mb-8">Free to use. No card required.</p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/register"
              className="h-10 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity flex items-center"
            >
              Create free account
            </Link>
            <Link
              href="/how-it-works"
              className="h-10 px-5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center"
            >
              See how it works
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border px-6 py-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-[10px]">A</span>
            </div>
            <span className="text-[11px] text-muted-foreground">Alite · Personal Finance</span>
          </div>
          <a
            href="mailto:cs.alitecompany@gmail.com"
            className="hidden sm:flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>📧</span>
            <span>cs.alitecompany@gmail.com</span>
          </a>
        </div>
      </footer>
    </div>
  )
}
