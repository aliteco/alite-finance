'use client'

import { useState, useRef, useEffect } from 'react'
import { Download, Table, FileCode, ChevronDown } from 'lucide-react'

interface ExportTransaction {
  id: string
  type: string
  amount: number
  currency: string
  description: string | null
  date: string
  categories?: { name: string } | null
  accounts?: { name: string } | null
}

interface ExportLedgerButtonProps {
  transactions: ExportTransaction[]
}

export default function ExportLedgerButton({ transactions }: ExportLedgerButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleExportCSV = () => {
    if (transactions.length === 0) return

    const headers = ['Date', 'Description', 'Type', 'Amount', 'Currency', 'Account', 'Category']
    const rows = transactions.map(tx => [
      tx.date,
      tx.description || '',
      tx.type,
      tx.amount,
      tx.currency,
      tx.accounts?.name || 'Unassigned',
      tx.categories?.name || 'Uncategorized'
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `alite_ledger_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setIsOpen(false)
  }

  const handleExportJSON = () => {
    if (transactions.length === 0) return

    const jsonContent = JSON.stringify(transactions, null, 2)
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `alite_ledger_${new Date().toISOString().split('T')[0]}.json`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setIsOpen(false)
  }

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl border border-border bg-card text-foreground text-xs font-semibold hover:bg-muted/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/25"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <Download size={14} className="text-muted-foreground" />
        <span>Export Ledger</span>
        <ChevronDown size={12} className={`text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-44 rounded-xl bg-card border border-border shadow-lg z-50 py-1.5 animate-in fade-in slide-in-from-top-2 duration-155">
          <button
            onClick={handleExportCSV}
            className="flex items-center w-full gap-2 px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors text-left"
          >
            <Table size={13} className="text-green-500" />
            <span>Export to CSV (.csv)</span>
          </button>
          <button
            onClick={handleExportJSON}
            className="flex items-center w-full gap-2 px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors text-left"
          >
            <FileCode size={13} className="text-blue-500" />
            <span>Export to JSON (.json)</span>
          </button>
        </div>
      )}
    </div>
  )
}
