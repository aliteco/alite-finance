'use client'

import { useState, useTransition } from 'react'
import { updateAccount, archiveAccount } from '@/app/actions/transactions'

const ACCOUNT_TYPES = [
  { value: 'bank', label: 'Bank' },
  { value: 'cash', label: 'Cash' },
  { value: 'savings', label: 'Savings' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'investment', label: 'Investment' },
  { value: 'other', label: 'Other' },
]

interface EditAccountFormProps {
  accountId: string
  initialName: string
  initialType: string
  initialIncludeInNetWorth: boolean
  currency: string
}

export default function EditAccountForm({
  accountId,
  initialName,
  initialType,
  initialIncludeInNetWorth,
  currency,
}: EditAccountFormProps) {
  const [isPending, startTransition] = useTransition()
  const [isArchiving, setIsArchiving] = useState(false)
  const [confirmArchive, setConfirmArchive] = useState(false)

  const [name, setName] = useState(initialName)
  const [type, setType] = useState(initialType)
  const [includeInNetWorth, setIncludeInNetWorth] = useState(initialIncludeInNetWorth)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaved(false)

    if (!name.trim()) { setError('Account name cannot be empty.'); return }

    startTransition(async () => {
      const result = await updateAccount(accountId, {
        name: name.trim(),
        type,
        include_in_net_worth: includeInNetWorth,
      })
      if (result.error) {
        setError(result.error)
      } else {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    })
  }

  async function handleArchive() {
    if (!confirmArchive) {
      setConfirmArchive(true)
      return
    }
    setIsArchiving(true)
    await archiveAccount(accountId)
    // archiveAccount redirects on success
  }

  return (
    <div className="space-y-3">
      <form onSubmit={handleSave} className="space-y-3">

        {/* Name */}
        <div className="bg-card border border-border rounded-2xl px-4 py-4">
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block mb-2">
            Account name
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={60}
            className="w-full bg-transparent text-base font-medium text-foreground focus:outline-none"
          />
        </div>

        {/* Type */}
        <div className="bg-card border border-border rounded-2xl px-4 py-4">
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block mb-2.5">
            Type
          </label>
          <div className="flex flex-wrap gap-2">
            {ACCOUNT_TYPES.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value)}
                className={`rounded-xl px-3 py-2 text-xs font-medium transition-colors
                  ${type === t.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground mt-3">
            Currency ({currency}) cannot be changed after an account is created.
          </p>
        </div>

        {/* Net worth toggle */}
        <button
          type="button"
          onClick={() => setIncludeInNetWorth(v => !v)}
          className="w-full bg-card border border-border rounded-2xl px-4 py-4 flex items-center justify-between"
        >
          <div className="text-left">
            <p className="text-sm font-medium text-foreground">Include in net worth</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Turn off for accounts you don't want counted, like a shared or external account.
            </p>
          </div>
          <span
            className={`shrink-0 w-11 h-6 rounded-full relative transition-colors ml-3
              ${includeInNetWorth ? 'bg-income' : 'bg-muted'}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform
                ${includeInNetWorth ? 'translate-x-5' : 'translate-x-0'}`}
            />
          </span>
        </button>

        {error && (
          <p className="text-xs text-expense bg-expense/10 rounded-xl px-4 py-3 border border-expense/20">
            {error}
          </p>
        )}
        {saved && (
          <p className="text-xs text-income bg-income/10 rounded-xl px-4 py-3 border border-income/20">
            Account updated.
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full h-11 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold tracking-tight transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {isPending ? 'Saving…' : 'Save changes'}
        </button>
      </form>

      {/* Danger zone */}
      <div className="bg-card border border-border rounded-2xl px-4 py-4">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">
          Danger zone
        </p>
        <button
          type="button"
          onClick={handleArchive}
          disabled={isArchiving}
          className="w-full h-10 rounded-xl border border-expense/30 text-expense text-xs font-semibold hover:bg-expense/10 transition-colors disabled:opacity-50"
        >
          {isArchiving
            ? 'Archiving…'
            : confirmArchive
              ? 'Tap again to confirm archive'
              : 'Archive account'}
        </button>
        {confirmArchive && !isArchiving && (
          <p className="text-[11px] text-muted-foreground mt-2 text-center">
            This hides the account but keeps its transaction history.
          </p>
        )}
      </div>
    </div>
  )
}