'use client'

import React, { useState, useTransition, useRef, useEffect } from 'react'
import { updateProfile } from '@/app/actions/transactions'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useCurrency } from '@/components/currency-provider'

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
  const [isPending, startTransition] = useTransition()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const { displayCurrency, setDisplayCurrency } = useCurrency()

  const [fullName, setFullName] = useState(initialName)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const errorRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    if (error) errorRef.current?.focus()
  }, [error])

  // sync initial value once (safe hydration)
  useEffect(() => {
    if (initialDisplayCurrency && !displayCurrency) {
      setDisplayCurrency(initialDisplayCurrency)
    }
  }, [initialDisplayCurrency])

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
      className="space-y-4 md:space-y-6 max-w-xl mx-auto w-full"
    >

      {/* Profile */}
      <div className="bg-card border border-border rounded-2xl md:rounded-3xl px-4 py-4 md:px-5 md:py-5">
        <p className="text-[10px] uppercase text-muted-foreground mb-3">
          Profile
        </p>

        <input
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          className="w-full text-sm bg-transparent outline-none"
          placeholder="Full name"
        />

        <p className="text-xs text-muted-foreground mt-3">
          {email}
        </p>
      </div>

      {/* Display Currency */}
      <div className="bg-card border border-border rounded-2xl md:rounded-3xl px-4 py-4 md:px-5 md:py-5">
        <p className="text-[10px] uppercase text-muted-foreground mb-3">
          Display Currency (Visual Only)
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {CURRENCIES.map(c => (
            <button
              key={c.code}
              type="button"
              onClick={() => setDisplayCurrency(c.code)}
              className={`px-3 py-2 rounded-xl text-xs border flex items-center justify-between transition
                ${displayCurrency === c.code
                  ? 'bg-primary/10 border-primary'
                  : 'border-transparent hover:bg-muted'
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
          className="text-xs text-red-500"
        >
          {error}
        </p>
      )}

      {/* Success */}
      {saved && (
        <p className="text-xs text-green-600">
          Settings saved
        </p>
      )}

      {/* Save */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full h-11 rounded-2xl bg-primary text-white font-medium"
      >
        {isPending ? 'Saving…' : 'Save changes'}
      </button>

      {/* Sign out */}
      <button
        type="button"
        onClick={handleSignOut}
        disabled={isSigningOut}
        className="w-full h-10 border border-red-500 text-red-500 rounded-xl hover:bg-red-500/10 transition"
      >
        {isSigningOut ? 'Signing out…' : 'Sign out'}
      </button>
    </form>
  )
}