'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Logo } from '@/components/layout/Logo'
import { Soleil, Palme, Nuage, Hibiscus, Vague } from '@/components/illustrations/Tropical'
import { useAuth } from '@/features/auth/useAuth'
import { KZ } from '@/lib/constants'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, signInWithProvider } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error: err } = await signIn(email, password)
    if (err) {
      setError('Email ou mot de passe incorrect.')
      setLoading(false)
      return
    }
    // Redirection selon le rôle réel du compte
    let role: string | undefined
    let companyId: string | null | undefined
    try {
      const res = await fetch('/api/me')
      if (res.ok) { const me = await res.json(); role = me?.role; companyId = me?.company_id }
    } catch { /* fallback ci-dessous */ }
    // Recruteur sans entreprise → tunnel de configuration + paiement (jamais le dashboard).
    window.location.href =
      role === 'admin'      ? '/admin/dashboard'
      : role === 'recruiter' ? (companyId ? '/recruiter/dashboard' : '/recruiter/company-setup')
      : '/candidate/dashboard'
  }

  return (
    <div className="min-h-screen flex flex-col md:grid md:grid-cols-2" style={{ background: KZ.cream }}>
      {/* Panneau gauche — visuel (caché sur très petit mobile) */}
      <div className="hidden md:block relative overflow-hidden border-r border-[#1A1410]">
        {/* Image de fond en niveaux de gris */}
        <img
          src="/assets/img/logimage.png"
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: 'grayscale(100%) contrast(1.1) brightness(0.85)' }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(135deg, rgba(109,59,235,0.72) 0%, rgba(109,59,235,0.55) 100%)' }}
        />
        <div className="relative z-10 h-full p-8 flex flex-col">
          <Logo size={32} mono color="#FFF7EE" accentColor="#FF6B35" href="/" />
          <div className="absolute top-16 right-8 opacity-70"><Soleil size={80} color="#FFC93C" stroke="#FFF7EE" /></div>
          <div className="absolute top-[200px] left-8 opacity-50"><Nuage width={80} height={40} color="rgba(255,247,238,0.3)" stroke="#FFF7EE" /></div>
          <div className="absolute bottom-[200px] right-12 opacity-60"><Hibiscus size={56} color="#FF6B35" stroke="#FFF7EE" /></div>
          <div className="absolute bottom-8 left-[-10px] opacity-80"><Palme size={130} color="#19A974" stroke="#FFF7EE" /></div>
          <div className="absolute bottom-20 right-[-20px] opacity-70"><Palme size={110} color="#19A974" stroke="#FFF7EE" rotate={20} /></div>
          <div className="absolute bottom-0 left-0 right-0"><Vague width={520} height={24} color="rgba(255,247,238,0.4)" /></div>
          <div className="mt-auto pb-4">
            <p className="kz-eyebrow mb-3" style={{ color: KZ.orange }}>Connexion</p>
            <h1 className="text-3xl lg:text-[44px] font-extrabold tracking-tight leading-none mb-4 text-white">
              Rebonjour,<br />marmaille.
            </h1>
            <p className="text-sm text-white/75 max-w-[320px] leading-relaxed">
              Le bon, le la — retrouve toutes les opportunites sauvegardees et continue tes candidatures.
            </p>
          </div>
        </div>
      </div>

      {/* Panneau droit — formulaire */}
      <div className="flex flex-col justify-center px-5 py-10 sm:px-10 md:px-12 lg:px-16" style={{ background: KZ.cream }}>
        {/* Logo visible uniquement sur mobile */}
        <div className="flex justify-center mb-8 md:hidden">
          <Logo size={36} />
        </div>

        <h2 className="text-2xl lg:text-[28px] font-extrabold tracking-tight mb-2 text-[#1A1410]">Connecte-toi</h2>
        <p className="text-sm text-[#6B5A4A] mb-7">
          Pas encore inscrit ?{' '}
          <Link href="/auth/register" className="font-bold" style={{ color: KZ.orange }}>Creer un compte</Link>
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="marie@email.re" icon={<Mail size={16} />} required />
          <Input
            label="Mot de passe"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            icon={<Lock size={16} />}
            suffix={
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-[#6B5A4A] hover:text-[#1A1410]">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
            required
          />
          <div className="flex justify-between items-center -mt-1">
            <label className="flex items-center gap-2 text-sm text-[#2A2018] cursor-pointer">
              <div className="w-4 h-4 rounded border border-[#1A1410] bg-[#1A1410] flex items-center justify-center shrink-0">
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="#FFF7EE" strokeWidth="2"><path d="M2 6 L5 9 L10 3" /></svg>
              </div>
              Rester connecte
            </label>
            <Link href="#" className="text-sm font-semibold" style={{ color: KZ.orange }}>Mot de passe oublie ?</Link>
          </div>
          <Button kind="primary" size="lg" full iconRight={<ArrowRight size={16} />} loading={loading} type="submit">
            Se connecter
          </Button>
        </form>

        <div className="flex items-center gap-3 my-5 text-xs text-[#6B5A4A]">
          <div className="flex-1 h-px bg-[#E8DDC9]" />ou<div className="flex-1 h-px bg-[#E8DDC9]" />
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <Button kind="outline" size="md" onClick={() => signInWithProvider('google')}>Google</Button>
          <Button kind="outline" size="md" onClick={() => signInWithProvider('linkedin')}>LinkedIn</Button>
        </div>

        <p className="text-center text-xs text-[#6B5A4A] mt-6">
          <Link href="/" className="hover:text-[#FF6B35] font-semibold">← Retour a l&apos;accueil</Link>
        </p>
      </div>
    </div>
  )
}
