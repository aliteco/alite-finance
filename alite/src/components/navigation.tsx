// filepath: alite/src/components/navigation.tsx

import DesktopSidebar from '@/components/nav/desktop-sidebar'
import MobileNav from '@/components/nav/mobile-nav'

export default function Navigation() {
  return (
    <>
      <DesktopSidebar />
      <MobileNav />
    </>
  )
}