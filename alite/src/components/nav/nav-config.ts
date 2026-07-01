// filepath: alite/src/components/nav/nav-config.ts

import {
  Home,
  CreditCard,
  BarChart3,
  LineChart,
  Repeat,
  Target,
  Briefcase,
  Settings,
  Wallet,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  href: string
  label: string
  mobileLabel?: string
  icon: LucideIcon
}

export const NAV_ITEMS: readonly NavItem[] = [
  { href: '/dashboard', label: 'Overview', icon: Home },
  { href: '/accounts', label: 'Accounts', icon: CreditCard },
  { href: '/transactions', label: 'Activity', mobileLabel: 'Activity', icon: BarChart3 },
  { href: '/insights', label: 'Insights', icon: LineChart },
  { href: '/budgets', label: 'Budgets', icon: Wallet },
  { href: '/recurring', label: 'Subscriptions', mobileLabel: 'Subs', icon: Repeat },
  { href: '/goals', label: 'Goals', icon: Target },
  { href: '/portfolio', label: 'Portfolio', icon: Briefcase },
  { href: '/settings', label: 'Settings', icon: Settings },
] as const

/** First N items shown directly in the mobile bottom bar; the rest live behind "More". */
export const MOBILE_CORE_COUNT = 3