import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: do not run code between createServerClient and getUser().
  // A simple mistake could make it very hard to debug issues with users
  // being randomly logged out.
  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  // /reset-password is intentionally excluded from both groups below: a
  // user lands there via a Supabase recovery link, which signs them in
  // with a temporary session. They are technically "logged in" at that
  // point, but redirecting them away (as isAuthRoute would) breaks the
  // password-reset flow before they can set a new password.
  const isAuthRoute =
    path.startsWith('/login') || path.startsWith('/register') || path.startsWith('/forgot-password')

  const isProtectedRoute =
    path.startsWith('/dashboard') ||
    path.startsWith('/accounts') ||
    path.startsWith('/transactions') ||
    path.startsWith('/budgets') ||
    path.startsWith('/goals') ||
    path.startsWith('/recurring') ||
    path.startsWith('/settings')

  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', path)
    return NextResponse.redirect(url)
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    url.search = ''
    return NextResponse.redirect(url)
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
