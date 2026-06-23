// filepath: alite/src/components/currency-input.tsx

'use client'

interface CurrencyInputProps {
  id: string
  label: string
  currency: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  autoFocus?: boolean
  helperText?: string
}

export default function CurrencyInput({
  id,
  label,
  currency,
  value,
  onChange,
  placeholder = '0',
  autoFocus,
  helperText,
}: CurrencyInputProps) {
  return (
    <div className="bg-card border border-border rounded-2xl px-4 py-4">
      <label htmlFor={id} className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block mb-2">
        {label}
      </label>
      <div className="flex items-center gap-3">
        <span className="shrink-0 text-sm font-semibold text-muted-foreground bg-muted rounded-lg px-2.5 py-1.5">
          {currency}
        </span>
        <input
          id={id}
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          placeholder={placeholder}
          autoFocus={autoFocus}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="flex-1 bg-transparent text-2xl font-bold tabular-nums text-foreground placeholder:text-muted-foreground/40 focus:outline-none min-w-0"
        />
      </div>
      {helperText && (
        <p className="text-[11px] text-muted-foreground mt-2">{helperText}</p>
      )}
    </div>
  )
}