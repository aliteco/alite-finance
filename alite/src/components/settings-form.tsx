'use client'

import React, { useState, useTransition, useRef, useEffect } from 'react'
import { updateProfile } from '@/app/actions/transactions'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useCurrency } from '@/components/currency-provider'

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
  const { displayCurrency, setDisplayCurrency } = useCurrency()

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
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1 font-mono">
          Base currency (Reporting)
        </p>
        <p className="text-[11px] text-muted-foreground mb-3">
          All values are hard-recorded in Supabase Database in terms of this currency for normalization.
        </p>
        <div role="radiogroup" aria-label="Base currency" className="grid grid-cols-2 gap-2">
          {CURRENCIES.map(c => (
            <button
              key={c.code}
              type="button"
              role="radio"
              aria-checked={baseCurrency === c.code}
              onClick={() => setBaseCurrency(c.code)}
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors focus-visible:ring-2
                ${baseCurrency === c.code
                  ? 'bg-primary/10 text-foreground border border-primary/50'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent'
                }`}
            >
              <span className="font-semibold">{c.code}</span>
              <span className="text-sm" aria-hidden="true">{c.flag}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Display currency */}
      <div className="bg-card border border-border rounded-2xl px-4 py-4">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1 font-mono">
          Display Currency (Visual Only)
        </p>
        <p className="text-[11px] text-muted-foreground mb-3">
          On-the-fly visual converter. Does not alter transactions or database rates. Toggles in real-time.
        </p>
        <div role="radiogroup" aria-label="Display currency" className="grid grid-cols-2 gap-2">
          {CURRENCIES.map(c => (
            <button
              key={c.code}
              type="button"
              role="radio"
              aria-checked={displayCurrency === c.code}
              onClick={() => setDisplayCurrency(c.code)}
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors focus-visible:ring-2
                ${displayCurrency === c.code
                  ? 'bg-primary/10 text-foreground border border-primary/50'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent'
                }`}
            >
              <span className="font-semibold">{c.code}</span>
              <span className="text-sm" aria-hidden="true">{c.flag}</span>
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