import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { auth } from '@/lib/auth'

// Dossiers autorisés (un par type d'asset).
const FOLDERS = ['avatars', 'cvs', 'video-pitches', 'company-logos', 'training-images']
const MAX_BYTES = 12 * 1024 * 1024 // 12 Mo

// POST /api/upload (multipart) { file, folder } → { url }
export async function POST(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const form = await req.formData().catch(() => null)
  const file = form?.get('file')
  const folder = String(form?.get('folder') ?? '')

  if (!(file instanceof File)) return NextResponse.json({ error: 'Fichier requis' }, { status: 400 })
  if (!FOLDERS.includes(folder)) return NextResponse.json({ error: 'Dossier invalide' }, { status: 400 })
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'Fichier trop volumineux' }, { status: 413 })

  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_').slice(-64)
  const pathname = `${folder}/${userId}/${safeName}`

  try {
    const blob = await put(pathname, file, {
      access: 'public',
      addRandomSuffix: true,                 // URL non devinable (confidentialité CV)
      contentType: file.type || undefined,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })
    return NextResponse.json({ url: blob.url })
  } catch (err) {
    console.error('[Upload]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Échec de l’upload' },
      { status: 500 },
    )
  }
}
