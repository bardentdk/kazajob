'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Mail, Lock, User, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Logo } from '@/components/layout/Logo'
import { Soleil, Palme, Vague, Sparkle } from '@/components/illustrations/Tropical'
import { useAuth } from '@/features/auth/useAuth'
import { KZ } from '@/lib/constants'

function RegisterForm() {
  const searchParams = useSearchParams()
  const initialRole = searchParams.get('role') === 'recruiter' ? 'recruiter' : 'candidate'

  const [role, setRole] = useState<'candidate' | 'recruiter'>(initialRole)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) { setError('Le mot de passe doit faire au moins 8 caracteres.'); return }
    setLoading(true)
    setError('')
    const { error: err } = await signUp(email, password, fullName, role)
    if (err) {
      if (err.includes('fetch') || err.includes('network') || err.includes('Failed')) {
        setError('Connexion impossible au serveur. Vérifie ta connexion internet et réessaie.')
      } else if (err.includes('already registered') || err.includes('already been registered')) {
        setError('Cet email est déjà utilisé. Connecte-toi ou utilise un autre email.')
      } else if (err.includes('Password')) {
        setError('Le mot de passe doit contenir au moins 8 caractères.')
      } else {
        setError('Une erreur est survenue. Vérifie tes informations et réessaie.')
      }
      setLoading(false)
    } else {
      // Email de bienvenue (fire & forget)
      fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'welcome', email, fullName, role }),
      }).catch(() => {})
      // Candidats → onboarding | Recruteurs → configuration entreprise (obligatoire)
      router.push(role === 'recruiter' ? '/recruiter/company-setup' : '/onboarding')
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:grid md:grid-cols-2" style={{ background: KZ.cream }}>
      {/* Panneau gauche */}
      <div className="hidden md:block relative overflow-hidden border-r border-[#1A1410]">
        <img
          src="/assets/img/logimage.png"
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: 'grayscale(100%) contrast(1.1) brightness(0.8)' }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(135deg, rgba(255,107,53,0.75) 0%, rgba(255,107,53,0.55) 100%)' }}
        />
        <div className="relative z-10 h-full p-8 flex flex-col">
          <Logo size={32} mono color="#FFF7EE" accentColor="#FFF1C2" href="/" />
          <div className="absolute top-12 right-8 opacity-70"><Soleil size={72} color={KZ.yellow} stroke="#FFF7EE" /></div>
          <div className="absolute top-24 left-16 opacity-80"><Sparkle size={28} color="#FFF7EE" stroke="#FFF7EE" /></div>
          <div className="absolute bottom-[260px] right-12 opacity-70"><Sparkle size={22} color="#FFF1C2" stroke="#FFF7EE" /></div>
          <div className="absolute bottom-8 left-[-20px] opacity-80"><Palme size={150} color="#19A974" stroke="#FFF7EE" /></div>
          <div className="absolute bottom-16 right-[-10px] opacity-70"><Palme size={130} color="#19A974" stroke="#FFF7EE" rotate={18} /></div>
          <div className="absolute bottom-0 left-0 right-0"><Vague width={520} height={24} color="rgba(255,247,238,0.35)" /></div>
          <div className="mt-auto pb-6">
            <p className="kz-eyebrow mb-3 text-white/90">Inscription · 3 min</p>
            <h1 className="text-3xl lg:text-[44px] font-extrabold tracking-tight leading-none mb-4 text-white">
              Bienvenue<br />sur Kazajob.
            </h1>
            <p className="text-sm text-white/75 max-w-[320px] leading-relaxed">
              Rejoins les candidats actifs et trouve ton prochain job dans le 974. C&apos;est gratuit, c&apos;est rapide.
            </p>
          </div>
        </div>
      </div>

      {/* Panneau droit */}
      <div className="flex flex-col justify-center px-5 py-10 sm:px-10 md:px-12 lg:px-16" style={{ background: KZ.cream }}>
        {/* Logo mobile */}
        <div className="flex justify-center mb-8 md:hidden">
          <Logo size={36} />
        </div>

        <h2 className="text-2xl lg:text-[28px] font-extrabold tracking-tight mb-2 text-[#1A1410]">Creer un compte</h2>
        <p className="text-sm text-[#6B5A4A] mb-6">
          Deja inscrit ?{' '}
          <Link href="/auth/login" className="font-bold" style={{ color: KZ.orange }}>Se connecter</Link>
        </p>

        {/* Choix du role */}
        <div className="flex gap-2 mb-6 p-1 rounded-xl border border-[#1A1410]" style={{ background: KZ.paper }}>
          {(['candidate', 'recruiter'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className="flex-1 py-2.5 rounded-lg text-sm font-bold transition-all border-[1.5px]"
              style={role === r
                ? { background: KZ.ink, color: KZ.cream, borderColor: KZ.ink, boxShadow: '2px 2px 0 #FF6B35' }
                : { background: 'transparent', color: KZ.text, borderColor: 'transparent' }}
            >
              {r === 'candidate' ? 'Je cherche' : 'Je recrute'}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Nom complet" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Marie Hoarau" icon={<User size={16} />} required />
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="marie@email.re" icon={<Mail size={16} />} required />
          <Input
            label="Mot de passe"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="8 caracteres minimum"
            icon={<Lock size={16} />}
            hint="Minimum 8 caracteres"
            suffix={
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-[#6B5A4A] hover:text-[#1A1410]">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
            required
          />
          <p className="text-xs text-[#6B5A4A] -mt-1">
            En creant un compte tu acceptes nos{' '}
            <span className="font-semibold" style={{ color: KZ.orange }}>CGU</span> et notre{' '}
            <span className="font-semibold" style={{ color: KZ.orange }}>politique de confidentialite</span>.
          </p>
          <Button kind="primary" size="lg" full iconRight={<ArrowRight size={16} />} loading={loading} type="submit">
            Creer mon compte — gratuit
          </Button>
        </form>

        <p className="text-center text-xs text-[#6B5A4A] mt-6">
          <Link href="/" className="hover:text-[#FF6B35] font-semibold">← Retour a l&apos;accueil</Link>
        </p>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return <Suspense><RegisterForm /></Suspense>
}
