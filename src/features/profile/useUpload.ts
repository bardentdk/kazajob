'use client'

import { useState, useCallback } from 'react'

type UploadResult = { url: string | null; error: string | null }

/** Upload générique vers Vercel Blob (via /api/upload). Renvoie l'URL publique. */
export async function uploadFile(file: File, folder: string): Promise<UploadResult> {
  try {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('folder', folder)
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      return { url: null, error: body.error ?? 'Échec de l’upload' }
    }
    const { url } = await res.json()
    return { url, error: null }
  } catch {
    return { url: null, error: 'Échec de l’upload' }
  }
}

async function patchProfile(patch: Record<string, unknown>) {
  await fetch('/api/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  })
}

export function useAvatarUpload(userId: string | undefined) {
  const [uploading, setUploading] = useState(false)

  const upload = useCallback(async (file: File): Promise<UploadResult> => {
    if (!userId) return { url: null, error: 'Non authentifié' }
    setUploading(true)
    const { url, error } = await uploadFile(file, 'avatars')
    if (url) await patchProfile({ avatar_url: url })
    setUploading(false)
    return { url, error }
  }, [userId])

  return { upload, uploading }
}

export function useCvUpload(userId: string | undefined) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const upload = useCallback(async (file: File): Promise<UploadResult> => {
    if (!userId) return { url: null, error: 'Non authentifié' }
    setUploading(true)
    setProgress(20)
    const { url, error } = await uploadFile(file, 'cvs')
    setProgress(80)
    if (url) await patchProfile({ cv_url: url })
    setProgress(100)
    setUploading(false)
    return { url, error }
  }, [userId])

  // URL publique Vercel Blob : permanente → on renvoie le chemin tel quel.
  const getSignedUrl = useCallback(async (storedUrl: string): Promise<string | null> => {
    return storedUrl || null
  }, [])

  return { upload, uploading, progress, getSignedUrl }
}
