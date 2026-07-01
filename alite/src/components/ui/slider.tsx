// filepath: alite/src/components/ui/slider.tsx
'use client'

import React from 'react'

interface SliderProps {
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  step: number
  label?: React.ReactNode
  className?: string
}

export default function Slider({ value, onChange, min, max, step, label, className = '' }: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="text-[10px] font-bold uppercase text-muted-foreground block">
          {label}
        </label>
      )}
      <div className="relative h-1.5">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        <div className="absolute inset-0 h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-neutral-900 dark:bg-neutral-200 transition-all duration-75"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-neutral-900 dark:bg-neutral-200 border-2 border-card shadow-md transition-all duration-75 pointer-events-none"
          style={{ left: `calc(${pct}% - 7px)` }}
        />
      </div>
    </div>
  )
}