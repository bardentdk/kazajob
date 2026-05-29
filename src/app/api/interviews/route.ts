import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Génère un lien Jitsi unique pour un entretien
function generateJitsiLink(interviewId: string): string {
  const roomName = `kazajob-${interviewId.replace(/-/g, '').slice(0, 16)}`
  return `https://meet.jit.si/${roomName}`
}

// POST — créer un entretien
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const body = await req.json()
    const {
      applicationId, candidateId, jobId,
      scheduledAt, durationMin = 45,
      type = 'video', visioType = 'jitsi', externalLink,
      location, notes,
    } = body

    if (!applicationId || !candidateId || !scheduledAt) {
      return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 })
    }

    // Vérifier que l'utilisateur est le recruteur du job
    const { data: app } = await supabase
      .from('applications')
      .select('job:jobs!inner(recruiter_id)')
      .eq('id', applicationId)
      .single()

    const jobRaw = app?.job as unknown
    const jobRecruiter = (jobRaw && typeof jobRaw === 'object' && 'recruiter_id' in jobRaw)
      ? (jobRaw as { recruiter_id: string }).recruiter_id
      : null
    if (jobRecruiter !== user.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    // Générer le lien visio
    let visioLink: string | null = null
    if (type === 'video') {
      visioLink = visioType === 'jitsi' ? null : externalLink ?? null
    }

    // Insérer l'entretien
    const { data: interview, error } = await supabase
      .from('interviews')
      .insert({
        application_id: applicationId,
        recruiter_id:   user.id,
        candidate_id:   candidateId,
        job_id:         jobId ?? null,
        scheduled_at:   scheduledAt,
        duration_min:   durationMin,
        type,
        visio_type:     type === 'video' ? visioType : null,
        visio_link:     visioLink,
        location:       type !== 'video' ? location : null,
        notes,
        status: 'pending',
      })
      .select()
      .single()

    if (error) throw new Error(error.message)

    // Si Jitsi → générer le lien maintenant qu'on a l'ID
    if (type === 'video' && visioType === 'jitsi' && interview) {
      const jitsiLink = generateJitsiLink(interview.id)
      await supabase.from('interviews').update({ visio_link: jitsiLink }).eq('id', interview.id)
      interview.visio_link = jitsiLink
    }

    // Mettre à jour le statut de la candidature
    await supabase.from('applications')
      .update({ status: 'interview', updated_at: new Date().toISOString() })
      .eq('id', applicationId)

    // Envoyer les emails (candidat + recruteur) via l'API email
    const baseUrl = req.nextUrl.origin
    await Promise.allSettled([
      fetch(`${baseUrl}/api/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', cookie: req.headers.get('cookie') ?? '' },
        body: JSON.stringify({ type: 'interview_invite', interviewId: interview.id, recipient: 'candidate' }),
      }),
      fetch(`${baseUrl}/api/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', cookie: req.headers.get('cookie') ?? '' },
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
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    const isRecruiter = profile?.role === 'recruiter' || profile?.role === 'admin'

    const query = supabase
      .from('interviews')
      .select(`
        *,
        candidate:profiles!candidate_id(id, full_name, email, avatar_url),
        recruiter:profiles!recruiter_id(id, full_name),
        job:jobs(title, company:companies(name))
      `)
      .order('scheduled_at', { ascending: true })

    const { data, error } = isRecruiter
      ? await query.eq('recruiter_id', user.id)
      : await query.eq('candidate_id', user.id)

    if (error) throw new Error(error.message)
    return NextResponse.json({ interviews: data ?? [] })

  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur serveur' }, { status: 500 })
  }
}

// PATCH — mettre à jour un entretien
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { id, ...updates } = await req.json()

    const { data, error } = await supabase
      .from('interviews')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return NextResponse.json({ interview: data })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur serveur' }, { status: 500 })
  }
}
