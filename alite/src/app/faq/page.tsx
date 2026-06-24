import Link from 'next/link'

const NAV_LINKS = [
  { label: 'Features', href: '/features' },
  { label: 'How it works', href: '/how-it-works' },
  { label: 'FAQ', href: '/faq' },
]

const FAQ_GROUPS = [
  {
    group: 'Accounting',
    items: [
      {
        q: 'How is Alite different from a normal budgeting app?',
        a: 'Most apps treat every transaction the same way, so moving Rp 5,000,000 from checking to savings looks identical to earning it. Alite tells the difference, so income and expenses only ever reflect money that actually entered or left your life.',
      },
      {
        q: 'Do I need to manually mark something as a transfer?',
        a: 'No. Once you’ve told Alite which accounts are yours, money moving between them is recognized automatically and excluded from your income and expense totals.',
      },
      {
        q: 'What if I transfer money to someone else’s account, not my own?',
        a: 'That’s treated as a normal expense, since the money has actually left your accounts. Only transfers between accounts you’ve added to Alite are excluded.',
      },
      {
        q: 'Does this affect my savings rate calculation?',
        a: 'Yes, and that’s the point. Savings rate is calculated from real income and real expenses, so transfers between your own accounts can’t make it look better or worse than it actually is.',
      },
    ],
  },
  {
    group: 'Multi-currency',
    items: [
      {
        q: 'What happens if I hold money in more than one currency?',
        a: 'Every transaction is stored at the exchange rate it happened at. A balance from last year doesn’t quietly reinterpret itself at today’s rate — historical accuracy is the whole point.',
      },
      {
        q: 'How is my net worth calculated across currencies?',
        a: 'Each account keeps its own currency, and your overall net worth is converted into a home currency you choose, using current rates for your live totals.',
      },
      {
        q: 'Can I add accounts in currencies I don’t use often?',
        a: 'Yes. There’s no limit on how many currencies or accounts you track — useful if you hold savings or investments in something other than your everyday currency.',
      },
    ],
  },
  {
    group: 'Account & billing',
    items: [
      {
        q: 'Is Alite free?',
        a: 'Yes. Creating an account and tracking your finances on Alite is free, no card required.',
      },
      {
        q: 'Can I track joint or business accounts too?',
        a: 'Yes. Add as many accounts as you need and group them however makes sense for you — net worth and budgets are calculated across all of them.',
      },
      {
        q: 'Is my financial data secure?',
        a: 'Your data is stored to protect your privacy and is never sold or shared with advertisers. If you have specific security questions, reach out at cs.alitecompany@gmail.com.',
      },
    ],
  },
]

export default function FaqPage() {
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
                  label === 'FAQ' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
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
        <p className="text-[11px] text-muted-foreground tracking-widest uppercase mb-3">FAQ</p>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-[-0.04em] leading-[1.08] mb-5">
          Questions, answered<br /><span className="text-muted-foreground">in plain terms.</span>
        </h1>
      </section>

      <section className="max-w-2xl mx-auto px-6 pb-24">
        <div className="space-y-10">
          {FAQ_GROUPS.map(({ group, items }) => (
            <div key={group}>
              <h2 className="text-[11px] text-muted-foreground tracking-widest uppercase mb-3">{group}</h2>
              <div className="space-y-3">
                {items.map(({ q, a }) => (
                  <details key={q} className="group bg-card border border-border rounded-[14px] px-5 py-4">
                    <summary className="flex items-center justify-between gap-3 cursor-pointer list-none text-sm font-medium text-foreground">
                      {q}
                      <span className="text-muted-foreground transition-transform group-open:rotate-45 text-base shrink-0">+</span>
                    </summary>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-3">{a}</p>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-border">
        <div className="max-w-2xl mx-auto px-6 py-20 text-center">
          <h2 className="text-3xl font-bold tracking-[-0.05em] mb-3">Still have a question?</h2>
          <p className="text-sm text-muted-foreground mb-8">Write to us and we’ll get back to you directly.</p>
          <div className="flex items-center justify-center gap-3">
            <a
              href="mailto:cs.alitecompany@gmail.com"
              className="h-10 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity flex items-center"
            >
              Email support
            </a>
            <Link
              href="/register"
              className="h-10 px-5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center"
            >
              Create free account
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
