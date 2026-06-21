import * as React from 'react'
import {
  Tv,
  Car,
  GraduationCap,
  Utensils,
  Laptop,
  Gift,
  HeartPulse,
  Home,
  TrendingUp,
  Circle,
  Smile,
  Briefcase,
  ShoppingBag,
  Repeat,
  Plane,
  Zap,
  Building,
} from 'lucide-react'

export const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  building: Building,
  tv: Tv,
  car: Car,
  'graduation-cap': GraduationCap,
  utensils: Utensils,
  laptop: Laptop,
  gift: Gift,
  'heart-pulse': HeartPulse,
  home: Home,
  'trending-up': TrendingUp,
  circle: Circle,
  smile: Smile,
  briefcase: Briefcase,
  'shopping-bag': ShoppingBag,
  repeat: Repeat,
  plane: Plane,
  zap: Zap,
}

export function renderCategoryIcon(
  iconKey: string | null | undefined,
  fallbackName?: string,
  className: string = 'w-4 h-4'
): React.ReactNode {
  if (!iconKey) {
    return (fallbackName ?? 'U').charAt(0).toUpperCase()
  }
  const Icon = ICONS[iconKey]
  if (Icon) {
    return React.createElement(Icon, { className })
  }
  return iconKey
}
