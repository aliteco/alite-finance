// filepath: alite/src/components/dashboard/net-worth-hero.tsx

'use client'

import { useMemo, useState, useEffect } from 'react'
import Link from 'next/link'
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip } from 'recharts'
import { ChevronRight } from 'lucide-react'
import { useCurrency } from '@/components/currency-provider'

interface NetWorthHeroProps {
  netWorth: number
  baseCurrency: string
  accountCount: number
  trend: { name: string; value: number }[]
  monthChangePct: number | null
}

export default function NetWorthHero({
  netWorth,
  baseCurrency,
  accountCount,
  trend,
  monthChangePct,
}: NetWorthHeroProps) {
  const { convert, format } = useCurrency()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isPositiveChange = (monthChangePct ?? 0) >= 0
  const convertedNetWorth = convert(netWorth, baseCurrency)

  const chartData = useMemo(() => trend, [trend])

  return (
    <div className="relative bg-card border border-border rounded-3xl p-5 md:p-7 overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 90% -10%, rgba(52,211,153,0.10) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      <div className="flex items-start justify-between gap-4 relative z-10">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-1.5">
            Net Worth
          </p>
          <h2 className="text-3xl md:text-4xl font-extrabold tabular-nums tracking-tight text-foreground leading-none break-all">
            {format(convertedNetWorth)}
          </h2>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-xs text-muted-foreground">
              · {accountCount} account{accountCount !== 1 ? 's' : ''}
            </span>
            {monthChangePct !== null && (
              <span
                className={`text-xs font-semibold inline-flex items-center gap-0.5 ${
                  isPositiveChange ? 'text-income' : 'text-expense'
                }`}
              >
                {isPositiveChange ? '↑' : '↓'} {Math.abs(monthChangePct).toFixed(1)}% this month
              </span>
            )}
          </div>
        </div>

        <Link
          href="/accounts"
          className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline focus-visible:ring-2 rounded px-1 py-1"
        >
          Accounts <ChevronRight size={13} aria-hidden="true" />
        </Link>
      </div>

      {chartData.length > 1 && (
        <div className="h-20 md:h-24 mt-4 -mx-2 relative z-10" aria-hidden="true">
          {mounted && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" hide />
                <Tooltip
                  contentStyle={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    fontSize: 11,
                  }}
                  formatter={(value) => [format(convert(Number(value ?? 0), baseCurrency)), 'Net worth']}
                  labelFormatter={() => ''}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#34d399"
                  strokeWidth={2}
                  fill="url(#netWorthGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      )}
    </div>
  )
}