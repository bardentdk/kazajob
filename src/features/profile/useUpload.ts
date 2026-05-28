'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

type UploadResult = { url: string | null; error: string | null }

export function useAvatarUpload(userId: string | undefined) {
  const [uploading, setUploading] = useState(false)
  const supabase = createClient()

  const upload = useCallback(async (file: File): Promise<UploadResult> => {
    if (!userId) return { url: null, error: 'Non authentifie' }

    const ext = file.name.split('.').pop()
    const path = `${userId}/avatar.${ext}`

    setUploading(true)

    // Upload dans Storage
    const { error: storageError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true, contentType: file.type })

    if (storageError) {
      setUploading(false)
      return { url: null, error: storageError.message }
    }

    // Récupérer l'URL publique
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(path)

    // Mettre à jour le profil
    await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
      .eq('id', userId)

    setUploading(false)
    return { url: publicUrl, error: null }
  }, [userId, supabase])

  return { upload, uploading }
}

export function useCvUpload(userId: string | undefined) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const supabase = createClient()

  const upload = useCallback(async (file: File): Promise<UploadResult> => {
    if (!userId) return { url: null, error: 'Non authentifie' }

    const ext = file.name.split('.').pop()
    const path = `${userId}/cv.${ext}`

    setUploading(true)
    setProgress(10)

    // Upload dans Storage
    const { error: storageError } = await supabase.storage
      .from('cvs')
      .upload(path, file, { upsert: true, contentType: file.type })

    if (storageError) {
      setUploading(false)
      setProgress(0)
      return { url: null, error: storageError.message }
    }

    setProgress(80)

    // Créer une URL signée (CV privé, valide 1 an)
    const { data: signedData } = await supabase.storage
      .from('cvs')
      .createSignedUrl(path, 60 * 60 * 24 * 365)

    const cvUrl = signedData?.signedUrl ?? null

    // Stocker le chemin dans le profil (pas l'URL signée qui expire)
    await supabase
      .from('profiles')
      .update({
        cv_url: `cvs/${path}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    setProgress(100)
    setUploading(false)
    return { url: cvUrl, error: null }
  }, [userId, supabase])

  const getSignedUrl = useCallback(async (storagePath: string): Promise<string | null> => {
    // storagePath format: "cvs/userId/cv.pdf"
    const path = storagePath.replace('cvs/', '')
    const { data } = await supabase.storage
      .from('cvs')
      .createSignedUrl(path, 3600) // 1h
    return data?.signedUrl ?? null
  }, [supabase])

  return { upload, uploading, progress, getSignedUrl }
}
