import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
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

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  // ── Routes auth : rediriger si déjà connecté ─────────────
  if (user && (path === '/auth/login' || path === '/auth/register')) {
    // Tenter de lire le rôle — si 403 ou absent, laisser passer (le client gère)
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      const role = profile?.role ?? 'candidate'
      const dashboardMap: Record<string, string> = {
        candidate: '/candidate/dashboard',
        recruiter: '/recruiter/dashboard',
        admin:     '/admin/dashboard',
      }
      return NextResponse.redirect(new URL(dashboardMap[role] ?? '/candidate/dashboard', request.url))
    } catch {
      // Profil inaccessible (403) → laisser le client gérer
      return supabaseResponse
    }
  }

  // ── Routes protégées : rediriger si non connecté ──────────
  const protectedPrefixes = ['/candidate', '/recruiter', '/admin']
  const isProtected = protectedPrefixes.some((p) => path.startsWith(p))

  if (isProtected && !user) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // ── Vérification du rôle (best-effort, sans bloquer si 403) ──
  if (user && isProtected) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role) {
        const role = profile.role as string

        if (path.startsWith('/candidate') && role !== 'candidate' && role !== 'admin') {
          return NextResponse.redirect(new URL(`/${role}/dashboard`, request.url))
        }
        if (path.startsWith('/recruiter') && role !== 'recruiter' && role !== 'admin') {
          return NextResponse.redirect(new URL(`/${role}/dashboard`, request.url))
        }
        if (path.startsWith('/admin') && role !== 'admin') {
          return NextResponse.redirect(new URL(`/${role}/dashboard`, request.url))
        }
      }
      // Si profil absent ou erreur → laisser passer, le client créera le profil
    } catch {
      // 403 ou autre erreur → ne pas bloquer, laisser le client gérer
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
