import Link from 'next/link'

const FEATURES = [
  {
    icon: '₿',
    title: 'Multi-currency',
    body: 'Track IDR, USD, EUR and more. Every transaction stored at the exact exchange rate used — historical accuracy guaranteed.',
  },
  {
    icon: '↕',
    title: 'Honest metrics',
    body: 'Income, expenses, and savings rate computed from real data in real-time. No estimates, no interpolation.',
  },
  {
    icon: '⇄',
    title: 'Transfer-aware',
    body: 'Moving money between your accounts never inflates your income or expense totals. Accounting done right.',
  },
  {
    icon: '◎',
    title: 'Budget control',
    body: 'Per-category spending limits with live progress. Know where you stand before you overspend.',
  },
]

const PREVIEW_TXS = [
  { icon: 'S', name: 'Salary', meta: 'Income · Today', amount: '+Rp 18.4M', positive: true },
  { icon: 'G', name: 'Grab', meta: 'Transport · Today', amount: '−Rp 45K', positive: false },
  { icon: 'A', name: 'Alfa Mart', meta: 'Groceries · Yesterday', amount: '−Rp 312K', positive: false },
  { icon: 'N', name: 'Netflix', meta: 'Subscriptions · Dec 14', amount: '−$15.99', positive: false },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen w-full bg-background text-foreground">

      {/* ── Nav ── */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <span className="text-primary-foreground font-bold text-sm leading-none">A</span>
            </div>
            <span className="text-sm font-semibold tracking-tight">Alite</span>
          </div>

          {/* Links — hidden on mobile */}
          <nav className="hidden md:flex items-center gap-7">
            {['Features', 'Accounts', 'Security'].map(l => (
              <span key={l} className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                {l}
              </span>
            ))}
          </nav>

          {/* CTAs */}
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

      {/* ── Hero ── */}
      <section className="max-w-2xl mx-auto px-6 pt-20 pb-16 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-muted border border-border rounded-full px-3.5 py-1.5 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-income shrink-0" />
          <span className="text-[11px] text-muted-foreground tracking-wide">Multi-currency · Real-time tracking</span>
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold tracking-[-0.04em] leading-[1.04] text-foreground mb-5">
          Your money,
          <br />
          <span className="text-muted-foreground">finally clear.</span>
        </h1>

        <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto mb-8">
          Track spending, net worth, and budgets across every currency and account — without the noise.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Link
            href="/register"
            className="h-10 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold tracking-tight hover:opacity-90 transition-opacity flex items-center"
          >
            Create free account
          </Link>
          <Link
            href="/login"
            className="h-10 px-5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:border-border-strong transition-colors flex items-center"
          >
            Sign in →
          </Link>
        </div>
      </section>

      {/* ── App Preview ── */}
      <section className="max-w-xs mx-auto px-6 pb-20" style={{ width: '500px', maxWidth: '500px' }}>

        {/* Net Worth Card */}
        <div className="bg-card border border-border rounded-[22px] p-5 mb-3">
          <div className="flex items-center justify-between mb-6">
            <span className="text-[10px] font-semibold text-muted-foreground tracking-[0.8px] uppercase">
              Net Worth
            </span>
            <div className="flex gap-1">
              <span className="w-2 h-2 rounded-full bg-income" />
              <span className="w-2 h-2 rounded-full bg-border" />
            </div>
          </div>

          <div className="tabnum text-4xl font-bold tracking-[-1.5px] text-foreground mb-1">
            Rp 487.2M
          </div>
          <div className="text-[11px] text-muted-foreground mb-5">IDR · 4 accounts</div>

          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border">
            {[
              { label: 'Income', value: '+18.4M', color: 'text-income' },
              { label: 'Expenses', value: '−11.2M', color: 'text-expense' },
              { label: 'Saved', value: '7.2M', color: 'text-income' },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <div className="text-[10px] text-muted-foreground uppercase tracking-[0.5px] mb-1">{label}</div>
                <div className={`tabnum text-sm font-semibold ${color}`}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-card border border-border rounded-[22px] overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <span className="text-[10px] font-semibold text-muted-foreground tracking-[0.8px] uppercase">
              Recent
            </span>
          </div>
          {PREVIEW_TXS.map(({ icon, name, meta, amount, positive }) => (
            <div key={name} className="flex items-center gap-3 px-5 py-3 border-b border-border last:border-0">
              <div className="w-8 h-8 rounded-[9px] bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                {icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-foreground truncate">{name}</div>
                <div className="text-[10px] text-muted-foreground">{meta}</div>
              </div>
              <div className={`tabnum text-xs font-semibold shrink-0 ${positive ? 'text-income' : 'text-expense'}`}>
                {amount}
              </div>
            </div>
          ))}
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