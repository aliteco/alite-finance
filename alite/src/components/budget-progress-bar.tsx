// filepath: alite/src/components/budget-progress-bar.tsx

interface BudgetProgressBarProps {
  percentage: number
  isOver: boolean
  color?: string | null
  height?: 'sm' | 'md'
}

export default function BudgetProgressBar({
  percentage,
  isOver,
  color,
  height = 'md',
}: BudgetProgressBarProps) {
  const isWarning = percentage >= 80 && !isOver
  const barColor = isOver ? 'var(--expense)' : isWarning ? '#f59e0b' : (color ?? 'var(--income)')
  const displayPct = Math.min(100, Math.max(0, percentage))
  const h = height === 'sm' ? 'h-1.5' : 'h-2'

  return (
    <div
      className={`${h} rounded-full overflow-hidden bg-muted relative`}
      role="progressbar"
      aria-valuenow={Math.round(displayPct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${displayPct}%`, background: barColor }}
      />
      {isOver && (
        <div
          className="absolute inset-0 rounded-full"
          style={{ boxShadow: 'inset 0 0 0 1px var(--expense)' }}
          aria-hidden="true"
        />
      )}
    </div>
  )
}