'use client'

import React, { useState, useTransition, useRef, useEffect } from 'react'
import { updateProfile } from '@/app/actions/transactions'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useCurrency } from '@/components/currency-provider'
import { useTheme } from 'next-themes'
import { Sun, Moon, Monitor, Eye, EyeOff, ShieldCheck, PiggyBank, RefreshCw } from 'lucide-react'

const CURRENCIES = [
  { code: 'USD', label: 'US Dollar', flag: '🇺🇸' },
  { code: 'EUR', label: 'Euro', flag: '🇪🇺' },
  { code: 'JPY', label: 'Japanese Yen', flag: '🇯🇵' },
  { code: 'TWD', label: 'New Taiwan Dollar', flag: '🇹🇼' },
  { code: 'SGD', label: 'Singapore Dollar', flag: '🇸🇬' },
  { code: 'GBP', label: 'British Pound', flag: '🇬🇧' },
  { code: 'AUD', label: 'Australian Dollar', flag: '🇦🇺' },
  { code: 'CNY', label: 'Chinese Yuan', flag: '🇨🇳' },
  { code: 'HKD', label: 'Hong Kong Dollar', flag: '🇭🇰' },
  { code: 'KRW', label: 'South Korean Won', flag: '🇰🇷' },
  { code: 'MYR', label: 'Malaysian Ringgit', flag: '🇲🇾' },
  { code: 'THB', label: 'Thai Baht', flag: '🇹🇭' },
  { code: 'PHP', label: 'Philippine Peso', flag: '🇵🇭' },
  { code: 'VND', label: 'Vietnamese Dong', flag: '🇻🇳' },
  { code: 'IDR', label: 'Indonesian Rupiah', flag: '🇮🇩' }
]

interface SettingsFormProps {
  initialName: string
  initialDisplayCurrency: string
  email: string
}

export default function SettingsForm({
  initialName,
  initialDisplayCurrency,
  email,
}: SettingsFormProps) {
  const router = useRouter()
  const { setTheme, theme, resolvedTheme } = useTheme()
  const [isPending, startTransition] = useTransition()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const { displayCurrency, setDisplayCurrency } = useCurrency()

  const [fullName, setFullName] = useState(initialName)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  // State-backed preferences
  const [privacyMode, setPrivacyMode] = useState(false)
  const [savingsTarget, setSavingsTarget] = useState(20)

  const errorRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    if (error) errorRef.current?.focus()
  }, [error])

  // Load local preference values on mount
  useEffect(() => {
    const storedPrivacy = localStorage.getItem('alite_privacy_mode') === 'true'
    setPrivacyMode(storedPrivacy)

    const storedTarget = localStorage.getItem('alite_savings_target')
    if (storedTarget) {
      setSavingsTarget(parseInt(storedTarget, 10))
    }
  }, [])

  // sync initial value once (safe hydration)
  useEffect(() => {
    if (initialDisplayCurrency && !displayCurrency) {
      setDisplayCurrency(initialDisplayCurrency)
    }
  }, [initialDisplayCurrency])

  const togglePrivacyMode = () => {
    const newValue = !privacyMode
    setPrivacyMode(newValue)
    localStorage.setItem('alite_privacy_mode', String(newValue))
    // Dispatch a custom event so other components receive the update immediately!
    window.dispatchEvent(new Event('alite_privacy_changed'))
  }

  const changeSavingsTarget = (val: number) => {
    setSavingsTarget(val)
    localStorage.setItem('alite_savings_target', String(val))
    window.dispatchEvent(new Event('alite_savings_target_changed'))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaved(false)

    if (!fullName.trim()) {
      setError('Name cannot be empty.')
      return
    }

    startTransition(async () => {
      const result = await updateProfile({
        full_name: fullName.trim(),
      })

      if (result?.error) {
        setError(result.error)
        return
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  async function handleSignOut() {
    setIsSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <form
      onSubmit={handleSave}
      noValidate
      className="space-y-4 md:space-y-6 max-w-xl mx-auto w-full pb-12"
    >

      {/* Profile */}
      <div className="bg-card border border-border rounded-2xl md:rounded-3xl px-4 py-4 md:px-5 md:py-5 space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Profile Settings
        </p>

        <div className="flex flex-col gap-1">
          <label htmlFor="fullName" className="text-xs font-semibold text-muted-foreground">Full Name</label>
          <input
            id="fullName"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            className="w-full text-sm bg-muted/30 border border-border/50 rounded-xl px-3 h-11 outline-none focus:border-primary/55 transition-colors"
            placeholder="Full name"
          />
        </div>

        <div className="pt-2 border-t border-border/20">
          <p className="text-xs font-semibold text-muted-foreground">Account Email</p>
          <p className="text-sm font-semibold text-foreground mt-0.5">
            {email}
          </p>
        </div>
      </div>

      {/* App Theme Selection */}
      <div className="bg-card border border-border rounded-2xl md:rounded-3xl px-4 py-4 md:px-5 md:py-5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
          Application Appearance
        </p>

        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'light', label: 'Light', icon: <Sun size={15} /> },
            { id: 'dark', label: 'Dark', icon: <Moon size={15} /> },
            { id: 'system', label: 'System', icon: <Monitor size={15} /> }
          ].map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTheme(t.id)}
              className={`px-3 py-2.5 rounded-xl text-xs border flex flex-col items-center justify-center gap-1.5 transition-all duration-200
                ${theme === t.id
                  ? 'bg-primary/10 border-primary text-primary font-bold'
                  : 'border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground'
                }`}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Privacy Mode Option */}
      <div className="bg-card border border-border rounded-2xl md:rounded-3xl px-4 py-4 md:px-5 md:py-5 space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Privacy Mode
            </p>
            <p className="text-xs text-muted-foreground mr-4">
              Obscure your metrics with smooth blurs of balance text — ideal for public auditing.
            </p>
          </div>
          <button
            type="button"
            onClick={togglePrivacyMode}
            className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out shrink-0
              ${privacyMode ? 'bg-primary' : 'bg-muted-foreground/30'}`}
            aria-pressed={privacyMode}
          >
            <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ease-in-out transform
              ${privacyMode ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>

        <div className="bg-muted/15 border border-border/30 p-3 rounded-xl flex items-center gap-2.5">
          {privacyMode ? <EyeOff size={16} className="text-primary" /> : <Eye size={16} className="text-muted-foreground" />}
          <span className="text-xs font-semibold text-muted-foreground">
            Privacy Mode: <span className={privacyMode ? 'text-primary font-bold' : 'text-foreground'}>{privacyMode ? 'Enabled' : 'Disabled'}</span>
          </span>
        </div>
      </div>

      {/* Savings Goal Target Rate */}
      <div className="bg-card border border-border rounded-2xl md:rounded-3xl px-4 py-4 md:px-5 md:py-5 space-y-3.5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
            Savings Target Rate
          </p>
          <p className="text-xs text-muted-foreground">
            Set the golden percentage of your cashflow to reinvest every month. Used for dynamic health rating.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <input
            type="range"
            min="5"
            max="75"
            step="5"
            value={savingsTarget}
            onChange={e => changeSavingsTarget(parseInt(e.target.value, 10))}
            className="flex-1 accent-primary cursor-pointer h-1.5"
          />
          <span className="text-sm font-black text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-lg min-w-[55px] text-center font-mono shrink-0">
            {savingsTarget}%
          </span>
        </div>

        <div className="bg-muted/10 border border-border/30 p-2.5 rounded-xl flex items-center gap-2 text-[10px] text-muted-foreground">
          <PiggyBank size={14} className="text-indigo-400 shrink-0" />
          <span>Recommended baseline is 20% (The standard 50/30/20 budget framework).</span>
        </div>
      </div>

      {/* Display Currency */}
      <div className="bg-card border border-border rounded-2xl md:rounded-3xl px-4 py-4 md:px-5 md:py-5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
          Display Currency (Visual Only)
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-52 overflow-y-auto pr-1">
          {CURRENCIES.map(c => (
            <button
              key={c.code}
              type="button"
              onClick={() => setDisplayCurrency(c.code)}
              className={`px-3 py-2 rounded-xl text-xs border flex items-center justify-between transition duration-200
                ${displayCurrency === c.code
                  ? 'bg-primary/10 border-primary text-primary font-bold'
                  : 'border-border/60 hover:bg-muted font-medium'
                }`}
            >
              <span className="font-semibold">{c.code}</span>
              <span>{c.flag}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <p
          ref={errorRef}
          role="alert"
          tabIndex={-1}
          className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 px-3 py-2.5 rounded-xl font-medium"
        >
          {error}
        </p>
      )}

      {/* Success */}
      {saved && (
        <p className="text-xs text-green-600 bg-green-500/10 border border-green-500/20 px-3 py-2.5 rounded-xl font-medium flex items-center gap-1.5">
          <ShieldCheck size={14} /> Settings profile saved successfully
        </p>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 h-11 rounded-2xl bg-primary text-white text-xs font-bold hover:opacity-90 active:scale-[0.99] transition-all"
        >
          {isPending ? 'Saving…' : 'Save all settings'}
        </button>

        <button
          type="button"
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="px-4 h-11 border border-red-500/40 text-red-500 rounded-2xl hover:bg-red-500/5 text-xs font-bold transition-all shrink-0"
        >
          {isSigningOut ? 'Signout…' : 'Sign out'}
        </button>
      </div>
    </form>
  )
}
