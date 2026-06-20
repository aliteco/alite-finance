import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    template: '%s · Alite',
    default: 'Sign in · Alite',
  },
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children
}