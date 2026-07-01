'use client'

import React, { useMemo } from 'react'
import { CURRENCY_SYMBOLS } from '@/lib/services/currency-types'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend
} from 'recharts'

interface BudgetData {
  name: string
  amount: number
  spent: number
  percentage: number
  category_color: string | null
}

interface BudgetChartProps {
  data: BudgetData[]
  baseCurrency: string
}

function formatCurrency(amount: number, currency: string) {
  const symbol = CURRENCY_SYMBOLS[currency] ?? `${currency} `

  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)

  return `${symbol}${formatted}`
}

export default function BudgetChart({ data, baseCurrency }: BudgetChartProps) {
  const chartData = useMemo(() => {
    return data.map(item => ({
      name: item.name,
      Limit: item.amount,
      Spent: Math.round(item.spent),
      percentage: item.percentage,
      color: item.category_color ?? '#6366f1'
    }))
  }, [data])

  if (chartData.length === 0) {
    return null
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-xs relative overflow-hidden" id="budget-chart-container">
      <div className="mb-4">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Utilization Overview</h3>
        <p className="text-[10px] text-muted-foreground">Compare spending limits against actual expense disbursements</p>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
            barGap={4}
          >
            <XAxis
              dataKey="name"
              tick={{ fill: 'var(--muted-foreground)', fontSize: 10, fontWeight: 550 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(value) => formatCurrency(value, baseCurrency)}
              tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const limit = payload[0]?.value as number
                  const spent = payload[1]?.value as number
                  const pct = Math.round((spent / (limit || 1)) * 100)
                  return (
                    <div className="bg-card border border-border p-3 rounded-xl shadow-md text-xs space-y-1">
                      <p className="font-bold text-foreground">{payload[0]?.payload?.name}</p>
                      <div className="flex items-center justify-between gap-6">
                        <span className="text-muted-foreground">Budget Limit:</span>
                        <span className="font-semibold text-foreground">{formatCurrency(limit, baseCurrency)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-6">
                        <span className="text-muted-foreground">Actual Spent:</span>
                        <span className={`font-bold ${spent > limit ? 'text-expense' : 'text-income'}`}>
                          {formatCurrency(spent, baseCurrency)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-6 pt-1 border-t border-border/60">
                        <span className="text-muted-foreground">Utilization:</span>
                        <span className={`font-black ${spent > limit ? 'text-expense font-extrabold' : 'text-foreground'}`}>
                          {pct}%
                        </span>
                      </div>
                    </div>
                  )
                }
                return null
              }}
              cursor={{ fill: 'rgba(120, 120, 120, 0.05)' }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 10, fontWeight: 'medium' }}
            />
            <Bar
              dataKey="Limit"
              fill="rgba(120, 120, 120, 0.12)"
              name="Budget Limit"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="Spent"
              name="Actual Spent"
              radius={[4, 4, 0, 0]}
            >
              {chartData.map((entry, index) => {
                const isOver = entry.Spent > entry.Limit
                const activeColor = isOver ? '#ef4444' : entry.color
                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={activeColor}
                  />
                )
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
