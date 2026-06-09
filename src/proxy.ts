import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

// Routes publiques sous /candidate accessibles sans connexion
const PUBLIC_CANDIDATE_PATHS = ['/candidate/jobs']

const DASHBOARD: Record<string, string> = {
  candidate: '/candidate/dashboard',
  recruiter: '/recruiter/dashboard',
  admin:     '/admin/dashboard',
}

export default auth((request) => {
  const user = request.auth?.user
  const role = user?.role ?? 'candidate'
  const path = request.nextUrl.pathname

  // Onboarding — protégé
  if (path.startsWith('/onboarding') && !user) {
    return NextResponse.redirect(new URL('/auth/register', request.url))
  }

  // Routes auth → rediriger si déjà connecté
  if (user && (path === '/auth/login' || path === '/auth/register')) {
    return NextResponse.redirect(new URL(DASHBOARD[role] ?? DASHBOARD.candidate, request.url))
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

  // Vérification du rôle — STRICT
  if (user && isProtected) {
    // Accès /candidate → réservé aux candidats et admins
    if (path.startsWith('/candidate') && role !== 'candidate' && role !== 'admin') {
      return NextResponse.redirect(new URL(DASHBOARD[role] ?? DASHBOARD.candidate, request.url))
    }
    // Accès /recruiter → réservé aux recruteurs et admins
    if (path.startsWith('/recruiter') && role !== 'recruiter' && role !== 'admin') {
      return NextResponse.redirect(new URL(DASHBOARD[role] ?? DASHBOARD.candidate, request.url))
    }
    // Accès /admin → réservé aux admins uniquement
    if (path.startsWith('/admin') && role !== 'admin') {
      return NextResponse.redirect(new URL(DASHBOARD[role] ?? DASHBOARD.candidate, request.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
