import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { adminListBookings } from '@/lib/queries/demo'

export async function GET() {
  const session = await auth()
  if (session?.user?.role !== 'admin') return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  return NextResponse.json(await adminListBookings())
}
