import Link from 'next/link'

const NAV_LINKS = [
  { label: 'Features', href: '/features' },
  { label: 'How it works', href: '/how-it-works' },
  { label: 'FAQ', href: '/faq' },
]

const STEPS = [
  {
    n: '01',
    title: 'Add your accounts',
    body: 'Bank accounts, cash, e-wallets — add each one in whatever currency it actually holds. Alite doesn’t force everything into a single currency up front; it keeps each account true to itself.',
  },
  {
    n: '02',
    title: 'Tell Alite which accounts are yours',
    body: 'This is the one setup step that does the heavy lifting. Once Alite knows your accounts belong to you, it can recognize when money moves between them instead of treating every transaction the same way.',
  },
  {
    n: '03',
    title: 'Log money as it moves',
    body: 'Record income, expenses, and transfers as they happen. A transfer from checking to savings is automatically tagged and excluded from your income and expense totals — you don’t have to remember to mark it.',
  },
  {
    n: '04',
    title: 'Set budgets per category',
    body: 'Put a limit on groceries, transport, subscriptions, whatever matters to you. Progress updates live as transactions land, not at the end of the month.',
  },
  {
    n: '05',
    title: 'See the real picture',
    body: 'Net worth, savings rate, and category spending are calculated directly from your transaction history, every time you open the app — converted cleanly across currencies, with transfers correctly excluded.',
  },
]

export default function HowItWorksPage() {
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
                  label === 'How it works' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
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
        <p className="text-[11px] text-muted-foreground tracking-widest uppercase mb-3">How it works</p>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-[-0.04em] leading-[1.08] mb-5">
          Five minutes to set up.<br /><span className="text-muted-foreground">Honest numbers after that.</span>
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
          There’s only one step that matters more than the rest: telling Alite which accounts are yours.
        </p>
      </section>

      <section className="max-w-2xl mx-auto px-6 pb-24">
        <div className="relative">
          <div className="absolute left-[13px] top-2 bottom-2 w-px bg-border" />
          <div className="space-y-8">
            {STEPS.map(({ n, title, body }) => (
              <div key={n} className="flex gap-4 items-start relative">
                <span className="tabnum text-xs font-semibold text-muted-foreground bg-background border border-border rounded-full w-7 h-7 flex items-center justify-center shrink-0 relative z-10">
                  {n}
                </span>
                <div className="pt-0.5">
                  <h2 className="text-base font-semibold mb-1.5 tracking-tight">{title}</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border">
        <div className="max-w-2xl mx-auto px-6 py-20 text-center">
          <h2 className="text-3xl font-bold tracking-[-0.05em] mb-3">Set it up once. Trust it forever.</h2>
          <p className="text-sm text-muted-foreground mb-8">Free to use. No card required.</p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/register"
              className="h-10 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity flex items-center"
            >
              Create free account
            </Link>
            <Link
              href="/faq"
              className="h-10 px-5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center"
            >
              Read the FAQ
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
