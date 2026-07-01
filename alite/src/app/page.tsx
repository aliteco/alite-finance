import Link from 'next/link'

const NAV_LINKS = [
  { label: 'Features', href: '/features' },
  { label: 'How it works', href: '/how-it-works' },
  { label: 'FAQ', href: '/faq' },
]

const FEATURES = [
  {
    icon: '$',
    title: 'Multi-currency',
    body: 'Hold IDR, USD, EUR, or more. Each transaction keeps the exchange rate it happened at, so old balances never quietly change value.',
  },
  {
    icon: '↕',
    title: 'Accurate net worth',
    body: 'Income, expenses, and savings rate are calculated straight from your transactions, in real time. No estimates, no rounding.',
  },
  {
    icon: '⇄',
    title: 'Transfer-aware',
    body: 'Move money between your own accounts without it ever showing up as income or an expense.',
  },
  {
    icon: '◎',
    title: 'Budget control',
    body: 'Set a limit per category and watch your progress live, not in a report you read after the month is over.',
  },
]

const PREVIEW_TXS = [
  { icon: 'S', name: 'Salary', meta: 'Income · Today', amount: '+Rp 18.4M', tone: 'income' as const },
  { icon: 'T', name: 'To Jago Savings', meta: 'Transfer · Today', amount: 'Rp 5.0M', tone: 'transfer' as const },
  { icon: 'G', name: 'Grab', meta: 'Transport · Today', amount: '−Rp 45K', tone: 'expense' as const },
  { icon: 'N', name: 'Netflix', meta: 'Subscriptions · Dec 14', amount: '−$15.99', tone: 'expense' as const },
]

const STEPS = [
  {
    n: '01',
    title: 'Add your accounts',
    body: 'Bank, cash, e-wallet — in whatever currency they actually hold.',
  },
  {
    n: '02',
    title: 'Log money as it moves',
    body: 'Spend, earn, or transfer between your own accounts. Alite keeps the totals honest either way.',
  },
  {
    n: '03',
    title: 'See the real picture',
    body: 'Net worth, savings rate, and budgets, calculated live from what actually happened.',
  },
]

function toneColor(tone: 'income' | 'expense' | 'transfer') {
  if (tone === 'income') return 'text-income'
  if (tone === 'expense') return 'text-expense'
  return 'text-muted-foreground'
}

export default function LandingPage() {
  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      {/* ── Nav ── */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <span className="text-primary-foreground font-bold text-sm leading-none">A</span>
            </div>
            <span className="text-sm font-semibold tracking-tight">Alite</span>
          </div>

          <nav className="hidden md:flex items-center gap-7">
            {NAV_LINKS.map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
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

     {/* ── Hero Section ── */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-24 md:pt-24 md:pb-32 overflow-hidden">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Typography & Core Action */}
          <div className="lg:col-span-7 flex flex-col items-center text-center lg:items-start lg:text-left">
            <div className="inline-flex items-center gap-2 bg-muted border border-border/80 rounded-full px-3.5 py-1.5 mb-6 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-income shrink-0 animate-pulse" />
              <span className="text-[11px] font-medium text-muted-foreground tracking-wide uppercase">Multi-Currency · Real-Time Tracking</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.06] text-foreground mb-6 text-balance">
              Everything you own,
              <br />
              <span className="bg-gradient-to-r from-foreground via-foreground/80 to-muted-foreground bg-clip-text text-transparent">
                finally adds up.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl mb-8 text-balance">
              Track income, expenses, and net worth across every account and currency you use — computed instantly from raw data, never estimated.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto mb-12">
              <Link
                href="/register"
                className="h-11 px-6 w-full sm:w-auto justify-center rounded-xl bg-primary text-primary-foreground text-sm font-semibold tracking-tight hover:opacity-95 transition-all flex items-center shadow-md shadow-primary/10 hover:scale-[1.01]"
              >
                Create free account
              </Link>
              <Link
                href="/login"
                className="h-11 px-6 w-full sm:w-auto justify-center rounded-xl border border-border bg-background text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all flex items-center"
              >
                Sign in →
              </Link>
            </div>

            {/* Micro Metrics Dashboard Integration */}
            <div className="grid grid-cols-2 gap-8 border-t border-border/60 pt-8 w-full max-w-sm lg:max-w-none justify-center lg:justify-start">
              <div>
                <div className="text-xs font-bold text-foreground uppercase tracking-wider mb-1">Multi Currencies</div>
                <div className="text-xs text-muted-foreground">Support up to 10 currencies</div>
              </div>
              <div>
                <div className="text-xs font-bold text-foreground uppercase tracking-wider mb-1">Honest metrics</div>
                <div className="text-xs text-muted-foreground">Income, expenses, and savings rate computed from real data in real-time. No estimates.</div>
              </div>
            </div>
          </div>

          {/* Right Column: Premium App Visual Mockup */}
          <div className="lg:col-span-5 w-full max-w-sm mx-auto lg:max-w-none lg:pl-6">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-2xl shadow-foreground/[0.02] ring-1 ring-border/20 transition-all duration-500 hover:shadow-foreground/[0.04]">
              
              {/* Card Title Block */}
              <div className="flex justify-between items-center mb-6">
                <span className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">
                  Net Worth
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-muted text-muted-foreground border border-border font-mono">
                  4 ACCOUNTS
                </span>
              </div>

              {/* Major Value Display */}
              <div className="tabnum text-4xl font-extrabold tracking-tight text-foreground mb-1">
                Rp 487.2M
              </div>
              <div className="text-xs text-muted-foreground mb-6">IDR</div>
              
              {/* Interactive Performance Matrix Grid */}
              <div className="grid grid-cols-3 gap-3 py-4 border-y border-border mb-6">
                {[
                  { label: 'Income', value: '+18.4M', color: 'text-income' },
                  { label: 'Expenses', value: '−11.2M', color: 'text-expense' },
                  { label: 'Saved', value: '7.2M', color: 'text-income' },
                ].map(({ label, value, color }) => (
                  <div key={label}>
                    <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">{label}</div>
                    <div className={`tabnum text-xs font-bold ${
                      color === 'text-income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'
                    }`}>{value}</div>
                  </div>
                ))}
              </div>

              {/* App Ledger Preview Row Stacks */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase block mb-1">Recent Transactions</span>
                {PREVIEW_TXS.map(({ icon, name, meta, amount, tone }) => (
                  <div key={name} className="flex items-center justify-between gap-4 py-1">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-md bg-muted border border-border/40 flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0">
                        {icon}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-foreground truncate">{name}</div>
                        <div className="text-[10px] text-muted-foreground truncate mt-0.5">
                          {meta} {tone === 'transfer' && <span className="text-amber-600 dark:text-amber-400 font-medium ml-1">· transfer</span>}
                        </div>
                      </div>
                    </div>
                    <div className={`tabnum text-xs font-bold font-mono ${
                      tone === 'income' ? 'text-emerald-600 dark:text-emerald-400' : tone === 'transfer' ? 'text-muted-foreground opacity-60 line-through' : 'text-foreground'
                    }`}>
                      {amount}
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ── Features ── */}
      <section className="max-w-2xl mx-auto px-6 pb-24">
        <div className="text-center mb-10">
          <p className="text-[11px] text-muted-foreground tracking-widest uppercase mb-2">Built different</p>
          <h2 className="text-3xl font-bold tracking-[-0.05em]">Everything you need,<br />nothing you don&apos;t.</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FEATURES.map(({ icon, title, body }) => (
            <div key={title} className="bg-card border border-border rounded-[18px] p-5">
              <div className="w-8 h-8 rounded-[9px] bg-muted flex items-center justify-center text-base mb-4">
                {icon}
              </div>
              <h3 className="text-sm font-semibold mb-2 tracking-tight">{title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="border-t border-border">
        <div className="max-w-2xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <p className="text-[11px] text-muted-foreground tracking-widest uppercase mb-2">How it works</p>
            <h2 className="text-3xl font-bold tracking-[-0.05em]">Set up once.<br />Trust it from then on.</h2>
          </div>
          <div className="space-y-6">
            {STEPS.map(({ n, title, body }) => (
              <div key={n} className="flex gap-4 items-start">
                <span className="tabnum text-xs font-semibold text-muted-foreground border border-border rounded-full w-7 h-7 flex items-center justify-center shrink-0 mt-0.5">
                  {n}
                </span>
                <div>
                  <h3 className="text-sm font-semibold mb-1 tracking-tight">{title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed max-w-md">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="border-t border-border">
        <div className="max-w-2xl mx-auto px-6 py-20 text-center">
          <h2 className="text-3xl font-bold tracking-[-0.05em] mb-3">
            Start tracking today.
          </h2>
          <p className="text-sm text-muted-foreground mb-8">Free to use. No card required.</p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/register"
              className="h-10 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity flex items-center"
            >
              Create account
            </Link>
            <Link
              href="/login"
              className="h-10 px-5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
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
