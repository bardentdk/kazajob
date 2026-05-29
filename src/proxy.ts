import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

// Routes publiques sous /candidate accessibles sans connexion
const PUBLIC_CANDIDATE_PATHS = ['/candidate/jobs']

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

  // Onboarding — protégé
  if (path.startsWith('/onboarding') && !user) {
    return NextResponse.redirect(new URL('/auth/register', request.url))
  }

  // Routes auth → rediriger si déjà connecté
  if (user && (path === '/auth/login' || path === '/auth/register')) {
    try {
      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single()
      const role = profile?.role ?? 'candidate'
      const map: Record<string, string> = {
        candidate: '/candidate/dashboard',
        recruiter: '/recruiter/dashboard',
        admin:     '/admin/dashboard',
      }
      return NextResponse.redirect(new URL(map[role] ?? '/candidate/dashboard', request.url))
    } catch {
      return supabaseResponse
    }
  }

  // Routes protégées
  const isPublicCandidatePath = PUBLIC_CANDIDATE_PATHS.some(p =>
    path === p || path.startsWith(p + '/')
  )

  const protectedPrefixes = ['/candidate', '/recruiter', '/admin']
  const isProtected = protectedPrefixes.some((p) => path.startsWith(p)) && !isPublicCandidatePath

  if (isProtected && !user) {
    const next = encodeURIComponent(path)
    return NextResponse.redirect(new URL(`/auth/login?next=${next}`, request.url))
  }

  // Vérification du rôle — STRICT : en cas d'échec on redirige vers login
  if (user && isProtected) {
    try {
      const { data: profile, error } = await supabase
        .from('profiles').select('role').eq('id', user.id).single()

      if (error || !profile?.role) {
        // Profil inaccessible → laisser le client créer le profil
        return supabaseResponse
      }

      const role = profile.role as string

      // Accès /candidate → réservé aux candidats et admins
      if (path.startsWith('/candidate') && role !== 'candidate' && role !== 'admin') {
        return NextResponse.redirect(new URL(`/${role}/dashboard`, request.url))
      }
      // Accès /recruiter → réservé aux recruteurs et admins
      if (path.startsWith('/recruiter') && role !== 'recruiter' && role !== 'admin') {
        return NextResponse.redirect(new URL(`/${role}/dashboard`, request.url))
      }
      // Accès /admin → réservé aux admins uniquement
      if (path.startsWith('/admin') && role !== 'admin') {
        return NextResponse.redirect(new URL(`/${role}/dashboard`, request.url))
      }
    } catch {
      // En cas d'erreur réseau, laisser passer — le layout client gère
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
