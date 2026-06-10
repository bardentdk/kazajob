import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { deleteRecruiterJob, getRecruiterJob, updateJob } from '@/lib/queries/jobs'
import { canPublishJob } from '@/lib/queries/companies'

async function requireUser() {
  const session = await auth()
  return session?.user?.id ?? null
}
const statusFor = (e: string) => (e === 'Non autorisé' ? 403 : 404)

// GET /api/recruiter/jobs/[id] — offre brute (édition)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUser()
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  const { id } = await params
  const job = await getRecruiterJob(userId, id)
  if (!job) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })
  return NextResponse.json(job)
}

// PATCH /api/recruiter/jobs/[id]  { ...champs } (maj ou toggle is_active)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUser()
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  const { id } = await params
  const body = await req.json().catch(() => ({}))

  // Réactivation d'une offre : revérifier le plafond du forfait.
  if (body.is_active === true) {
    const job = await getRecruiterJob(userId, id)
    if (job && !job.is_active && job.company_id) {
      const quota = await canPublishJob(job.company_id)
      if (!quota.ok) {
        return NextResponse.json(
          { error: `Limite de ${quota.max} offre(s) active(s) atteinte (forfait ${quota.planName}). Désactivez une autre offre d'abord.` },
          { status: 403 },
        )
      }
    }
  }

  const result = await updateJob(userId, id, body)
  if (result.error) return NextResponse.json({ error: result.error }, { status: statusFor(result.error) })
  return NextResponse.json({ ok: true })
}

// DELETE /api/recruiter/jobs/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUser()
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  const { id } = await params
  const result = await deleteRecruiterJob(userId, id)
  if (result.error) return NextResponse.json({ error: result.error }, { status: statusFor(result.error) })
  return NextResponse.json({ ok: true })
}
