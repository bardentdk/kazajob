'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { Video, Square, RotateCcw, Upload, Play, Pause, Check, AlertCircle, Trash2 } from 'lucide-react'
import { Button } from './Button'
import { KZ } from '@/lib/constants'

const MAX_SECONDS = 60

interface VideoPitchRecorderProps {
  currentUrl?: string | null
  onUpload: (blob: Blob, mimeType: string) => Promise<{ url: string | null; error: string | null }>
  onDelete?: () => Promise<void>
  uploading?: boolean
}

type State = 'idle' | 'permission' | 'ready' | 'recording' | 'preview' | 'uploading' | 'done' | 'error'

export function VideoPitchRecorder({ currentUrl, onUpload, onDelete, uploading }: VideoPitchRecorderProps) {
  const videoRef      = useRef<HTMLVideoElement>(null)
  const previewRef    = useRef<HTMLVideoElement>(null)
  const recorderRef   = useRef<MediaRecorder | null>(null)
  const streamRef     = useRef<MediaStream | null>(null)
  const chunksRef     = useRef<Blob[]>([])
  const timerRef      = useRef<ReturnType<typeof setInterval> | null>(null)

  const [state, setState] = useState<State>(currentUrl ? 'done' : 'idle')
  const [elapsed, setElapsed] = useState(0)
  const [blob, setBlob]       = useState<Blob | null>(null)
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [error, setError]     = useState<string | null>(null)
  const [playing, setPlaying] = useState(false)

  // Nettoyer les ressources
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop())
      if (blobUrl) URL.revokeObjectURL(blobUrl)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [blobUrl])

  const requestCamera = useCallback(async () => {
    setState('permission')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      setState('ready')
    } catch {
      setError('Accès caméra refusé. Autorise la caméra dans les paramètres de ton navigateur.')
      setState('error')
    }
  }, [])

  const startRecording = useCallback(() => {
    if (!streamRef.current) return
    chunksRef.current = []
    setElapsed(0)

    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm'

    const recorder = new MediaRecorder(streamRef.current, { mimeType })
    recorderRef.current = recorder

    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
    recorder.onstop = () => {
      const videoBlob = new Blob(chunksRef.current, { type: 'video/webm' })
      const url = URL.createObjectURL(videoBlob)
      setBlob(videoBlob)
      setBlobUrl(url)
      streamRef.current?.getTracks().forEach(t => t.stop())
      setState('preview')
    }

    recorder.start(100)
    setState('recording')

    // Timer
    timerRef.current = setInterval(() => {
      setElapsed(prev => {
        if (prev >= MAX_SECONDS - 1) {
          stopRecording()
          return MAX_SECONDS
        }
        return prev + 1
      })
    }, 1000)
  }, [])

  const stopRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    recorderRef.current?.stop()
  }, [])

  const handleUpload = useCallback(async () => {
    if (!blob) return
    setState('uploading')
    const { url, error: err } = await onUpload(blob, 'video/webm')
    if (err) { setError(err); setState('error') }
    else { setState('done') }
  }, [blob, onUpload])

  const reset = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    if (blobUrl) URL.revokeObjectURL(blobUrl)
    setBlob(null); setBlobUrl(null); setElapsed(0); setError(null)
    setState('idle')
  }, [blobUrl])

  const handleDelete = useCallback(async () => {
    if (!confirm('Supprimer ton pitch vidéo ?')) return
    await onDelete?.()
    setState('idle')
  }, [onDelete])

  const togglePlay = () => {
    if (!previewRef.current) return
    if (playing) { previewRef.current.pause(); setPlaying(false) }
    else { previewRef.current.play(); setPlaying(true) }
  }

  const remaining = MAX_SECONDS - elapsed
  const pct = (elapsed / MAX_SECONDS) * 100

  // ── Rendu selon état ──────────────────────────────────────────

  if (state === 'done' && currentUrl) {
    return (
      <div className="flex flex-col gap-3">
        <div className="relative rounded-xl overflow-hidden border border-[#1A1410]" style={{ background: KZ.ink }}>
          <video
            src={currentUrl}
            controls
            className="w-full max-h-48 object-cover"
            style={{ display: 'block' }}
          />
        </div>
        <div className="flex gap-2">
          <Button kind="outline" size="sm" icon={<RotateCcw size={13} />} onClick={reset}>
            Ré-enregistrer
          </Button>
          {onDelete && (
            <Button kind="danger" size="sm" icon={<Trash2 size={13} />} onClick={handleDelete}>
              Supprimer
            </Button>
          )}
        </div>
      </div>
    )
  }

  if (state === 'idle') {
    return (
      <div
        className="flex flex-col items-center gap-4 p-6 rounded-xl border-[1.5px] border-dashed border-[#1A1410] cursor-pointer hover:border-[#FF6B35] hover:bg-[#FFF7EE] transition-all"
        style={{ background: KZ.cream2 }}
        onClick={requestCamera}
      >
        <div className="w-14 h-14 rounded-full border-[1.5px] border-[#1A1410] flex items-center justify-center" style={{ background: KZ.orangeSoft }}>
          <Video size={24} color={KZ.ink} />
        </div>
        <div className="text-center">
          <div className="text-sm font-bold text-[#1A1410] mb-1">Enregistrer mon pitch vidéo</div>
          <div className="text-xs text-[#6B5A4A]">60 secondes max · Caméra + micro requis</div>
          <div className="text-xs text-[#6B5A4A] mt-1 opacity-70">Visible par les recruteurs sur ton profil</div>
        </div>
        <Button kind="primary" size="sm" icon={<Video size={14} />}>
          Activer la caméra
        </Button>
      </div>
    )
  }

  if (state === 'permission') {
    return (
      <div className="flex items-center justify-center p-8 rounded-xl border border-[#E8DDC9]" style={{ background: KZ.cream2 }}>
        <p className="text-sm text-[#6B5A4A]">Autorisation caméra en cours...</p>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="flex flex-col gap-3 p-4 rounded-xl border border-red-200 bg-red-50">
        <div className="flex items-center gap-2 text-red-700">
          <AlertCircle size={16} />
          <span className="text-sm font-semibold">{error}</span>
        </div>
        <Button kind="outline" size="sm" onClick={() => setState('idle')}>Réessayer</Button>
      </div>
    )
  }

  if (state === 'ready' || state === 'recording') {
    return (
      <div className="flex flex-col gap-3">
        {/* Viewfinder */}
        <div className="relative rounded-xl overflow-hidden border border-[#1A1410] bg-black" style={{ aspectRatio: '4/3' }}>
          <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />

          {/* Barre de progression */}
          {state === 'recording' && (
            <>
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-white/20">
                <div className="h-full bg-[#FF6B35] transition-all" style={{ width: `${pct}%` }} />
              </div>
              <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-600 text-white">
                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span className="text-xs font-bold">{remaining}s</span>
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-center gap-3">
          {state === 'ready' && (
            <>
              <Button kind="outline" size="sm" onClick={reset}>Annuler</Button>
              <Button kind="danger" size="md" icon={<Video size={16} />} onClick={startRecording}>
                Commencer l&apos;enregistrement
              </Button>
            </>
          )}
          {state === 'recording' && (
            <Button kind="dark" size="md" icon={<Square size={16} />} onClick={stopRecording}>
              Arrêter ({remaining}s restantes)
            </Button>
          )}
        </div>
      </div>
    )
  }

  if (state === 'preview') {
    return (
      <div className="flex flex-col gap-3">
        {/* Preview */}
        <div className="relative rounded-xl overflow-hidden border border-[#1A1410]" style={{ background: KZ.ink, aspectRatio: '4/3' }}>
          <video
            ref={previewRef}
            src={blobUrl ?? undefined}
            className="w-full h-full object-cover"
            onEnded={() => setPlaying(false)}
          />
          <button
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/20 transition-colors"
          >
            <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center">
              {playing ? <Pause size={24} color={KZ.ink} /> : <Play size={24} color={KZ.ink} />}
            </div>
          </button>
          <div className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold text-white bg-black/60">
            {elapsed}s
          </div>
        </div>

        <div className="p-3 rounded-xl border border-[#E8DDC9] text-xs text-[#6B5A4A]" style={{ background: KZ.yellowSoft }}>
          Regarde ta vidéo avant de la publier. Elle sera visible par les recruteurs qui consultent ton profil.
        </div>

        <div className="flex gap-2">
          <Button kind="outline" size="md" icon={<RotateCcw size={14} />} onClick={reset}>
            Ré-enregistrer
          </Button>
          <Button kind="primary" size="md" full icon={<Upload size={14} />} onClick={handleUpload}>
            Publier mon pitch
          </Button>
        </div>
      </div>
    )
  }

  if (state === 'uploading') {
    return (
      <div className="flex flex-col items-center gap-3 p-8 rounded-xl border border-[#E8DDC9]" style={{ background: KZ.cream2 }}>
        <div className="w-10 h-10 border-2 border-[#1A1410] border-t-[#FF6B35] rounded-full animate-spin" />
        <p className="text-sm font-semibold text-[#1A1410]">Publication en cours...</p>
      </div>
    )
  }

  return null
}
