import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createInterview, listInterviews, updateInterview } from '@/lib/queries/interviews'

// POST — créer un entretien
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const user = session?.user
    if (!user?.id) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const body = await req.json()
    if (!body.applicationId || !body.candidateId || !body.scheduledAt) {
      return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 })
    }

    const result = await createInterview(user.id, body)
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.error === 'Non autorisé' ? 403 : 404 })
    }
    const interview = result.interview!

    // Envoyer les emails (candidat + recruteur) via l'API email
    const baseUrl = req.nextUrl.origin
    const cookie = req.headers.get('cookie') ?? ''
    await Promise.allSettled([
      fetch(`${baseUrl}/api/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', cookie },
        body: JSON.stringify({ type: 'interview_invite', interviewId: interview.id, recipient: 'candidate' }),
      }),
      fetch(`${baseUrl}/api/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', cookie },
        body: JSON.stringify({ type: 'interview_invite', interviewId: interview.id, recipient: 'recruiter' }),
      }),
    ])

    return NextResponse.json({ interview })
  } catch (err) {
    console.error('[Interviews POST]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur serveur' }, { status: 500 })
  }
}

// GET — lister les entretiens
export async function GET() {
  try {
    const session = await auth()
    const user = session?.user
    if (!user?.id) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const isRecruiter = user.role === 'recruiter' || user.role === 'admin'
    const interviews = await listInterviews(user.id, isRecruiter)
    return NextResponse.json({ interviews })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur serveur' }, { status: 500 })
  }
}

// PATCH — mettre à jour un entretien
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    const user = session?.user
    if (!user?.id) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { id, ...updates } = await req.json()
    const result = await updateInterview(user.id, id, updates)
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.error === 'Non autorisé' ? 403 : 404 })
    }
    return NextResponse.json({ interview: result.interview })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur serveur' }, { status: 500 })
  }
}
