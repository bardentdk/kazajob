import { NextResponse } from 'next/server'
import { getJob } from '@/lib/queries/jobs'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const job = await getJob(id)
  if (!job) return NextResponse.json(null, { status: 404 })
  return NextResponse.json(job)
}
