// filepath: alite/src/components/edit-account-form.tsx
'use client'

import { useState, useTransition } from 'react'
import { updateAccount, archiveAccount } from '@/app/actions/transactions'
import { useCurrency } from '@/components/currency-provider'

const ACCOUNT_TYPES = [
  { value: 'bank', label: 'Bank' },
  { value: 'cash', label: 'Cash' },
  { value: 'savings', label: 'Savings' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'investment', label: 'Investment' },
  { value: 'other', label: 'Other' },
]

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16', '#3b82f6', '#6b7280']

function accountTypeAllowsNegativeBalance(type: string) {
  return type === 'credit_card'
}

interface EditAccountFormProps {
  accountId: string
  initialName: string
  initialType: string
  initialColor: string
  initialIncludeInNetWorth: boolean
  currency: string
  currentBalance: number
}

export default function EditAccountForm({
  accountId,
  initialName,
  initialType,
  initialColor,
  initialIncludeInNetWorth,
  currency,
  currentBalance,
}: EditAccountFormProps) {
  const [isPending, startTransition] = useTransition()
  const [isArchiving, setIsArchiving] = useState(false)
  const [confirmArchive, setConfirmArchive] = useState(false)
  const { convert, format } = useCurrency()

  const [name, setName] = useState(initialName)
  const [type, setType] = useState(initialType)
  const [color, setColor] = useState(initialColor || COLORS[0])
  const [includeInNetWorth, setIncludeInNetWorth] = useState(initialIncludeInNetWorth)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const hasNonZeroBalance = Math.abs(currentBalance) > 0.01
  const wouldBlockNegativeType =
    currentBalance < 0 && type !== initialType && !accountTypeAllowsNegativeBalance(type)

  const displayBalance = format(convert(currentBalance, currency))

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaved(false)

    if (!name.trim()) { setError('Account name cannot be empty.'); return }
    if (wouldBlockNegativeType) {
      setError(`Cannot switch to "${ACCOUNT_TYPES.find(t => t.value === type)?.label}" while the balance is negative. Settle the balance first or choose Credit Card.`)
      return
    }

    startTransition(async () => {
      const result = await updateAccount(accountId, {
        name: name.trim(),
        type,
        color,
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
      <form onSubmit={handleSave} className="space-y-3" noValidate>

        {/* Name */}
        <div className="bg-card border border-border rounded-2xl px-4 py-4">
          <label htmlFor="edit-account-name" className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block mb-2">
            Account name
          </label>
          <input
            id="edit-account-name"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={60}
            className="w-full bg-transparent text-base font-medium text-foreground focus:outline-none"
          />
        </div>

        {/* Color */}
        <div className="bg-card border border-border rounded-2xl px-4 py-4">
          <fieldset>
            <legend className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block mb-2.5">
              Color
            </legend>
            <div className="flex flex-wrap gap-2">
              {COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  aria-pressed={color === c}
                  aria-label={`Select color ${c}`}
                  className="w-8 h-8 rounded-full transition-all focus-visible:ring-2"
                  style={{
                    background: c,
                    outline: color === c ? '2px solid var(--foreground)' : 'none',
                    outlineOffset: '2px',
                  }}
                />
              ))}
            </div>
          </fieldset>
        </div>

        {/* Type */}
        <div className="bg-card border border-border rounded-2xl px-4 py-4">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block mb-2.5">
            Type
          </span>
          <div role="radiogroup" aria-label="Account type" className="flex flex-wrap gap-2">
            {ACCOUNT_TYPES.map(t => (
              <button
                key={t.value}
                type="button"
                role="radio"
                aria-checked={type === t.value}
                onClick={() => setType(t.value)}
                className={`rounded-xl px-3 py-2 text-xs font-medium transition-colors focus-visible:ring-2 border ${
                  type === t.value
                    ? 'bg-selected-bg border-selected-border text-selected-fg'
                    : 'bg-muted border-border text-muted-foreground hover:text-foreground'
                  }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground mt-3">
            Currency ({currency}) cannot be changed after an account is created.
          </p>
          {wouldBlockNegativeType && (
            <p role="alert" className="text-[11px] text-expense mt-2 bg-expense/10 rounded-lg px-2.5 py-2">
              This account has a negative balance — only Credit Card accounts may carry one.
            </p>
          )}
        </div>

        {/* Net worth toggle */}
        <button
          type="button"
          onClick={() => setIncludeInNetWorth(v => !v)}
          aria-pressed={includeInNetWorth}
          className="w-full bg-card border border-border rounded-2xl px-4 py-4 flex items-center justify-between focus-visible:ring-2"
        >
          <div className="text-left">
            <p className="text-sm font-medium text-foreground">Include in net worth</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Turn off for accounts you don&apos;t want counted, like a shared or external account.
            </p>
          </div>
          <span
            aria-hidden="true"
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
          <p role="alert" className="text-xs text-expense bg-expense/10 rounded-xl px-4 py-3 border border-expense/20">
            {error}
          </p>
        )}
        {saved && (
          <p role="status" className="text-xs text-income bg-income/10 rounded-xl px-4 py-3 border border-income/20">
            Account updated.
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full h-11 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold tracking-tight transition-all active:scale-[0.98] disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          {isPending ? 'Saving…' : 'Save changes'}
        </button>
      </form>

      {/* Danger zone */}
      <div className="bg-card border border-border rounded-2xl px-4 py-4">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">
          Danger zone
        </p>

        {hasNonZeroBalance && (
          <p role="alert" className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-500/10 rounded-xl px-3 py-2.5 border border-amber-500/20 mb-3">
            This account still holds a balance of <strong>{displayBalance}</strong> ({currency} {currentBalance.toLocaleString()}).
            Archiving removes it from your net worth total — transaction history is kept, but
            the balance will no longer be counted anywhere.
          </p>
        )}

        <button
          type="button"
          onClick={handleArchive}
          disabled={isArchiving}
          className="w-full h-10 rounded-xl border border-expense/30 text-expense text-xs font-semibold hover:bg-expense/10 transition-colors disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          {isArchiving
            ? 'Archiving…'
            : confirmArchive
              ? 'Tap again to confirm archive'
              : 'Archive account'}
        </button>
        {confirmArchive && !isArchiving && (
          <button
            type="button"
            onClick={() => setConfirmArchive(false)}
            className="w-full h-9 mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors focus-visible:ring-2 rounded-lg"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}