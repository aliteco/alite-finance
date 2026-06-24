'use client'

import React, {
  useState,
  useTransition,
  useRef,
  useEffect
} from 'react'

import { updateProfile } from '@/app/actions/transactions'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useCurrency } from '@/components/currency-provider'
import { useTheme } from 'next-themes'

import {
  Sun,
  Moon,
  Monitor,
  Eye,
  EyeOff,
  ShieldCheck,
  PiggyBank,
  LogOut,
  Check
} from 'lucide-react'

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
  email
}: SettingsFormProps) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { displayCurrency, setDisplayCurrency } = useCurrency()

  const [isPending, startTransition] = useTransition()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const [fullName, setFullName] = useState(initialName)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const [privacyMode, setPrivacyMode] = useState(false)
  const [savingsTarget, setSavingsTarget] = useState(20)

  const errorRef = useRef<HTMLParagraphElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (error) errorRef.current?.focus()
  }, [error])

  useEffect(() => {
    const privacy = localStorage.getItem('alite_privacy_mode') === 'true'
    setPrivacyMode(privacy)

    const target = localStorage.getItem('alite_savings_target')
    if (target) setSavingsTarget(Number(target))
  }, [])

  useEffect(() => {
    if (initialDisplayCurrency && !displayCurrency) {
      setDisplayCurrency(initialDisplayCurrency)
    }
  }, [initialDisplayCurrency, displayCurrency, setDisplayCurrency])

  const togglePrivacyMode = () => {
    const value = !privacyMode
    setPrivacyMode(value)
    localStorage.setItem('alite_privacy_mode', String(value))
    window.dispatchEvent(new Event('alite_privacy_changed'))
  }

  const changeSavingsTarget = (value: number) => {
    setSavingsTarget(value)
    localStorage.setItem('alite_savings_target', String(value))
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
        full_name: fullName.trim()
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
    <div className="w-full space-y-5">
      <form onSubmit={handleSave} className="space-y-5" noValidate>
        
        {/* PROFILE SETTINGS */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Profile Settings
          </p>

          <div className="space-y-1.5">
            <label htmlFor="fullName" className="text-xs font-semibold text-muted-foreground">
              Full Name
            </label>
            <input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full h-11 rounded-xl bg-muted/20 border border-border px-3.5 text-sm outline-none focus:border-foreground/40 focus:bg-card transition-all font-medium"
              placeholder="Full name"
            />
          </div>

          <div className="pt-3 border-t border-border/40 flex flex-col gap-0.5">
            <p className="text-xs font-semibold text-muted-foreground">Account Email</p>
            <p className="text-sm font-mono font-semibold tracking-wide text-foreground">
              {email}
            </p>
          </div>
        </div>

        {/* APPLICATION APPEARANCE */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
            Appearance
          </p>

          <div className="grid grid-cols-3 gap-1 bg-muted/60 p-1 rounded-xl border border-border/40">
            {[
              { id: 'light', label: 'Light', icon: <Sun size={14} /> },
              { id: 'dark', label: 'Dark', icon: <Moon size={14} /> },
              { id: 'system', label: 'System', icon: <Monitor size={14} /> }
            ].map((t) => {
              const selected = mounted && theme === t.id
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTheme(t.id)}
                  className={`h-9 rounded-lg flex items-center justify-center gap-2 text-xs font-semibold transition-all duration-150 active:scale-[0.98]
                    ${selected
                      ? 'bg-neutral-900 text-white dark:bg-neutral-800 shadow-sm font-bold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-card/40'
                    }`}
                >
                  {t.icon}
                  <span>{t.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* PRIVACY MODE */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Privacy Mode
              </p>
              <p className="text-xs text-muted-foreground leading-normal">
                Hide and obscure sensitive balance metrics across your dashboards.
              </p>
            </div>

            <button
              type="button"
              onClick={togglePrivacyMode}
              className={`w-11 h-6 rounded-full p-1 transition-colors duration-200 outline-none shrink-0 relative flex items-center border
                ${privacyMode 
                  ? 'bg-neutral-900 border-neutral-900 dark:bg-neutral-800 dark:border-neutral-700' 
                  : 'bg-muted border-border-strong/20'
                }`}
              aria-pressed={privacyMode}
            >
              <span
                className={`block w-4 h-4 rounded-full shadow-sm transition-transform duration-200 ease-in-out bg-white
                  ${privacyMode 
                    ? 'translate-x-5' 
                    : 'translate-x-0'
                  }`}
              />
            </button>
          </div>

          <div className="bg-muted/30 border border-border/40 rounded-xl p-3 flex gap-2.5 items-center text-xs">
            {privacyMode ? <EyeOff size={14} className="text-foreground" /> : <Eye size={14} className="text-muted-foreground" />}
            <span className="text-muted-foreground">
              Privacy Status: <b className="text-foreground">{privacyMode ? 'Hidden' : 'Visible'}</b>
            </span>
          </div>
        </div>

        {/* SAVINGS TARGET RATE */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
              Savings Target Rate
            </p>
            <div className="font-mono font-black text-xs text-foreground bg-muted border border-border/60 px-2 py-0.5 rounded-md">
              {savingsTarget}%
            </div>
          </div>

          <input
            type="range"
            min="5"
            max="75"
            step="5"
            value={savingsTarget}
            onChange={(e) => changeSavingsTarget(Number(e.target.value))}
            className="w-full accent-neutral-900 dark:accent-neutral-400 cursor-pointer bg-muted rounded-full appearance-none h-1.5"
          />

          <div className="flex gap-2 items-center text-xs text-muted-foreground pt-1">
            <PiggyBank size={14} className="text-muted-foreground shrink-0" />
            <span>Recommended baseline is 20% (Standard 50/30/20 budget framework).</span>
          </div>
        </div>

        {/* DISPLAY CURRENCY */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Display Currency
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1 border border-border/40 p-1.5 rounded-xl bg-muted/10">
            {CURRENCIES.map((c) => {
              const selected = displayCurrency === c.code
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => setDisplayCurrency(c.code)}
                  className={`flex items-center justify-between rounded-xl border px-3 py-2.5 transition-all duration-150 active:scale-[0.98]
                    ${selected
                      ? 'bg-neutral-900 border-neutral-900 text-white dark:bg-neutral-800 dark:border-neutral-700 font-bold shadow-sm'
                      : 'bg-card border-border text-foreground hover:bg-muted/60 hover:border-border-strong'
                    }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm select-none leading-none">{c.flag}</span>
                    <div className="text-left">
                      <p className="text-xs font-bold">{c.code}</p>
                      <p className={`text-[10px] tracking-tight leading-none ${selected ? 'text-white/80' : 'text-muted-foreground'}`}>{c.label}</p>
                    </div>
                  </div>

                  {selected && <Check size={13} strokeWidth={3} className="shrink-0" />}
                </button>
              )
            })}
          </div>
        </div>

        {/* FEEDBACK STATUSES */}
        {error && (
          <p ref={errorRef} tabIndex={-1} role="alert" className="text-xs font-semibold text-red-500 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl outline-none">
            {error}
          </p>
        )}

        {saved && (
          <p className="text-xs font-semibold text-green-600 bg-green-500/10 border border-green-500/20 px-4 py-3 rounded-xl flex items-center gap-2">
            <ShieldCheck size={14} className="shrink-0" />
            <span>Profile parameters synced successfully.</span>
          </p>
        )}

        {/* GLOBAL SAVE ACTION */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full h-11 rounded-xl bg-neutral-900 text-white dark:bg-neutral-800 dark:text-white text-xs font-bold hover:opacity-90 active:scale-[0.99] transition-all flex items-center justify-center shadow-sm disabled:opacity-40"
        >
          {isPending ? 'Saving settings...' : 'Save settings'}
        </button>
      </form>

      {/* ACCOUNT CONTROL SESSION BLOCK */}
      <div className="border border-red-500/20 bg-red-500/[0.01] rounded-2xl p-5 flex justify-between items-center gap-4">
        <div className="space-y-0.5">
          <p className="text-[10px] uppercase font-bold tracking-wider text-red-500">
            Session Management
          </p>
          <p className="text-xs text-muted-foreground leading-normal">
            Sign out of your active account profile context on this device.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="bg-red-600 hover:bg-red-700 text-white px-4 h-10 rounded-xl text-xs font-bold flex gap-2 items-center shrink-0 active:scale-[0.98] transition-all disabled:opacity-40"
        >
          <LogOut size={13} />
          <span>{isSigningOut ? 'Signing out' : 'Sign out'}</span>
        </button>
      </div>
    </div>
  )
}