'use client'

import React, { useState, useTransition, useRef, useEffect } from 'react'
import { updateProfile } from '@/app/actions/transactions'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const CURRENCIES = [
  { code: 'IDR', label: 'Indonesian Rupiah', flag: '🇮🇩' },
  { code: 'USD', label: 'US Dollar', flag: '🇺🇸' },
  { code: 'EUR', label: 'Euro', flag: '🇪🇺' },
  { code: 'SGD', label: 'Singapore Dollar', flag: '🇸🇬' },
  { code: 'JPY', label: 'Japanese Yen', flag: '🇯🇵' },
  { code: 'GBP', label: 'British Pound', flag: '🇬🇧' },
  { code: 'AUD', label: 'Australian Dollar', flag: '🇦🇺' },
  { code: 'MYR', label: 'Malaysian Ringgit', flag: '🇲🇾' },
]

interface SettingsFormProps {
  initialName: string
  initialCurrency: string
  email: string
}

export default function SettingsForm({ initialName, initialCurrency, email }: SettingsFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const [fullName, setFullName] = useState(initialName)
  const [baseCurrency, setBaseCurrency] = useState(initialCurrency)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const errorRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    if (error) errorRef.current?.focus()
  }, [error])

  // FIX: was typed `React.SubmitEvent` (not a real React type — would fail
  // type-checking under strict mode); correct type is React.FormEvent.
  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaved(false)

    if (!fullName.trim()) {
      setError('Name cannot be empty.')
      return
    }

    startTransition(async () => {
      const result = await updateProfile({ full_name: fullName.trim(), base_currency: baseCurrency })
      if (result.error) {
        setError(result.error)
      } else {
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      }
    })
  }

  async function handleSignOut() {
    setIsSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <form onSubmit={handleSave} className="space-y-3" noValidate>

      {/* Profile */}
      <div className="bg-card border border-border rounded-2xl px-4 py-4 space-y-4">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Profile</p>

        <div>
          <label htmlFor="full-name" className="text-[10px] font-medium text-muted-foreground block mb-1.5">Full name</label>
          <input
            id="full-name"
            type="text"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder="Your name"
            aria-invalid={!!error}
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
          />
        </div>

        <div className="border-t border-border pt-4">
          <span id="email-label" className="text-[10px] font-medium text-muted-foreground block mb-1.5">Email</span>
          <p aria-labelledby="email-label" className="text-sm text-muted-foreground">{email}</p>
        </div>
      </div>

      {/* Base currency */}
      <div className="bg-card border border-border rounded-2xl px-4 py-4">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">
          Base currency
        </p>
        <p className="text-[11px] text-muted-foreground mb-3">
          All amounts are converted to this currency for metrics. Historical transactions are not affected.
        </p>
        <div role="radiogroup" aria-label="Base currency" className="space-y-1">
          {CURRENCIES.map(c => (
            <button
              key={c.code}
              type="button"
              role="radio"
              aria-checked={baseCurrency === c.code}
              onClick={() => setBaseCurrency(c.code)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-colors focus-visible:ring-2
                ${baseCurrency === c.code
                  ? 'bg-primary/10 text-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
            >
              <span className="font-medium">{c.label}</span>

              <div className="flex items-center gap-2">
                <span className="text-base leading-none" aria-hidden="true">{c.flag}</span>

                <span className="text-xs text-muted-foreground font-mono">
                  {c.code}
                </span>

                {baseCurrency === c.code && (
                  <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-income" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Error / success */}
      {error && (
        <p
          ref={errorRef}
          role="alert"
          tabIndex={-1}
          className="text-xs text-expense bg-expense/10 rounded-xl px-4 py-3 border border-expense/20 focus:outline-none"
        >
          {error}
        </p>
      )}
      {saved && (
        <p role="status" className="text-xs text-income bg-income/10 rounded-xl px-4 py-3 border border-income/20">
          Settings saved.
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full h-11 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold tracking-tight transition-all active:scale-[0.98] disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-offset-2"
      >
        {isPending ? 'Saving…' : 'Save changes'}
      </button>

      {/* Danger zone */}
      <div className="bg-card border border-border rounded-2xl px-4 py-4 mt-4">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">Account</p>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="w-full h-10 rounded-xl border border-expense/30 text-expense text-xs font-semibold hover:bg-expense/10 transition-colors disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          {isSigningOut ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    </form>
  )
}