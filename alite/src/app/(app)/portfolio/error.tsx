// filepath: alite/src/app/(app)/portfolio/error.tsx
'use client'

import PortfolioError from '@/components/portfolio-error'

export default function PortfolioErrorPage(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <PortfolioError {...props} />
}