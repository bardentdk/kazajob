import Link from 'next/link'
import { ArrowRight, MapPin, Search, Sparkles, Users, Briefcase } from 'lucide-react'
import { NavLanding } from '@/components/layout/NavLanding'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Tag } from '@/components/ui/Tag'
import { HeroIllustrationNew } from '@/components/illustrations/HeroIllustrationNew'
import { Soleil, Palme, Hibiscus, Sparkle } from '@/components/illustrations/Tropical'
import { KZ } from '@/lib/constants'
import { createClient } from '@/lib/supabase/server'
import { formatSalary } from '@/lib/utils'
import type { Company } from '@/lib/types'

// Contenu marketing statique — ne change pas en fonction des données
const HOW_STEPS = [
  {
    n: '1', color: KZ.violetSoft, icon: <Users size={28} />,
    title: 'Cree ton profil',
    desc: "3 minutes chrono. Importe ton CV, on l'analyse, on remplit pour toi.",
  },
  {
    n: '2', color: KZ.yellowSoft, icon: <Sparkles size={28} />,
    title: 'On matche pour toi',
    desc: 'Notre IA croise tes competences avec toutes les offres locales. Top 5 chaque matin.',
  },
  {
    n: '3', color: KZ.greenSoft, icon: <ArrowRight size={28} />,
    title: 'Postule en 1 clic',
    desc: 'CV pre-rempli, message personnalise suggere. Le recruteur te repond direct.',
  },
]

const CARD_COLORS = [KZ.orangeSoft, KZ.violetSoft, KZ.greenSoft, KZ.yellowSoft, KZ.blueSoft]

// Fonction de fetch serveur
async function getLandingData() {
  const supabase = await createClient()

  const [
    { data: featuredJobs },
    { data: companies },
    { count: jobCount },
    { count: companyCount },
    { count: userCount },
  ] = await Promise.all([
    // Offres les plus récentes ou boostées
    supabase
      .from('jobs')
      .select(`
        id, title, location, job_type, salary_min, salary_max, remote, created_at, is_boosted,
        company:companies(name),
        skills:job_skills(skill:skills(name))
      `)
      .eq('is_active', true)
      .order('is_boosted', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(6),

    // Entreprises vérifiées pour le bandeau logos
    supabase
      .from('companies')
      .select('id, name')
      .eq('is_verified', true)
      .order('name')
      .limit(8),

    // Compteurs pour la bande stats
    supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('companies').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'candidate'),
  ])

  type FeaturedJob = {
    id: string; title: string; location: string; job_type: string
    salary_min: number | null; salary_max: number | null; remote: boolean
    created_at: string; is_boosted: boolean
    company: { name: string } | null
    skills: Array<{ skill: { name: string } | null }>
  }

  return {
    featuredJobs: (featuredJobs ?? []) as unknown as FeaturedJob[],
    companies: (companies ?? []) as Company[],
    stats: {
      jobs: jobCount ?? 0,
      companies: companyCount ?? 0,
      users: userCount ?? 0,
    },
  }
}

export default async function LandingPage() {
  const { featuredJobs, companies, stats } = await getLandingData()

  // Bande stats — vraies données si disponibles, sinon labels clairs
  const STATS_BAND = [
    { v: stats.jobs > 0 ? `${stats.jobs.toLocaleString('fr-FR')}` : '—', l: 'Offres actives' },
    { v: stats.companies > 0 ? `${stats.companies}` : '—', l: 'Entreprises locales' },
    { v: stats.users > 0 ? `${stats.users.toLocaleString('fr-FR')}` : '—', l: 'Candidats inscrits' },
    { v: '48 h', l: '1er entretien en moyenne' },
  ]

  return (
    <div className="min-h-screen flex flex-col" style={{ background: KZ.cream }}>
      <NavLanding />

      {/* HERO ──────────────────────────────────────────────── */}
      <section className="px-4 sm:px-8 lg:px-16 pt-10 lg:pt-20 pb-0 relative overflow-hidden" style={{ background: KZ.cream }}>
        <div className="absolute top-16 left-4 opacity-40 hidden lg:block"><Sparkle size={36} color={KZ.violet} /></div>
        <div className="absolute bottom-56 right-10 opacity-40 hidden lg:block"><Sparkle size={28} color={KZ.green} /></div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center max-w-[1280px] mx-auto relative z-10">
          <div>
            <Badge color="orange" size="lg" icon={<MapPin size={12} />} className="mb-5">
              974 · La Reunion
            </Badge>
            <h1 className="text-[48px] sm:text-[64px] lg:text-[80px] font-extrabold tracking-[-0.04em] leading-[0.92] text-[#1A1410] mb-5">
              Ton kaz<br />
              <span style={{ color: KZ.orange }}>ton job</span><br />
              ton pei.
            </h1>
            <p className="text-base lg:text-lg leading-relaxed text-[#2A2018] max-w-[520px] mb-6">
              La plateforme d&apos;emploi qui matche vraiment les talents reunionnais
              avec les meilleures opportunites locales. Avec un peu d&apos;IA et beaucoup de soleil.
            </p>

            {/* Barre de recherche */}
            <div
              className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center p-2 mb-4 rounded-xl border-[1.5px] border-[#1A1410]"
              style={{ background: KZ.paper, boxShadow: '5px 5px 0 #1A1410' }}
            >
              <div className="flex-1 flex items-center gap-2 px-3 py-2 sm:py-1">
                <Search size={18} className="text-[#6B5A4A] shrink-0" />
                <span className="text-sm text-[#6B5A4A]">Metier, mot-cle...</span>
              </div>
              <div className="hidden sm:block w-px h-7 bg-[#E8DDC9]" />
              <div className="hidden sm:flex flex-1 items-center gap-2 px-3 py-1">
                <MapPin size={18} className="text-[#6B5A4A] shrink-0" />
                <span className="text-sm text-[#2A2018]">Toute la Reunion</span>
              </div>
              <Link href="/candidate/jobs">
                <Button kind="primary" size="md" className="w-full sm:w-auto">Rechercher</Button>
              </Link>
            </div>

            <div className="flex gap-2 flex-wrap items-center">
              <span className="text-xs text-[#6B5A4A]">Populaire :</span>
              {['Developpeur', 'BTP', 'Tourisme', 'Comptable', 'Infirmier'].map((k) => (
                <Link key={k} href={`/candidate/jobs?q=${k}`}>
                  <Tag color="cream">{k}</Tag>
                </Link>
              ))}
            </div>
          </div>

          <div className="hidden lg:flex justify-center">
            <HeroIllustrationNew />
          </div>
        </div>
      </section>

      {/* STATS BAND — vraies données ────────────────────────── */}
      <section className="px-4 sm:px-8 lg:px-16 py-6 lg:py-8 border-y border-[#1A1410]" style={{ background: KZ.ink }}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 max-w-[1280px] mx-auto">
          {STATS_BAND.map((s) => (
            <div key={s.l}>
              <div className="text-[32px] lg:text-[44px] font-extrabold tracking-tighter leading-none" style={{ color: KZ.orange }}>{s.v}</div>
              <div className="text-sm opacity-70 mt-1" style={{ color: KZ.cream }}>{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* LOGOS ENTREPRISES — vraies entreprises ─────────────── */}
      {companies.length > 0 && (
        <section className="px-4 sm:px-8 lg:px-16 py-8 lg:py-10" style={{ background: KZ.cream }}>
          <p className="kz-eyebrow text-[#6B5A4A] text-center mb-6">Ils recrutent sur Kazajob</p>
          <div className="flex justify-center items-center gap-10 flex-wrap max-w-[1280px] mx-auto">
            {companies.map((c) => (
              <div key={c.id} className="text-2xl font-extrabold tracking-tight opacity-40 italic text-[#1A1410]">
                {c.name}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* OFFRES VEDETTES — vraies offres ───────────────────── */}
      <section className="py-12 lg:py-20 relative overflow-visible" style={{ background: KZ.cream2 }}>
        {/* Perso 1 — masqué sur mobile */}
        <div className="hidden xl:block absolute left-[-150px] top-[-20px] z-10 pointer-events-none select-none" style={{ width: '22vw' }}>
          <img src="/assets/img/homepage/perso1.png" alt="" aria-hidden className="w-full object-contain object-bottom drop-shadow-xl" />
        </div>
        {/* Perso 2 — masqué sur mobile */}
        <div className="hidden xl:block absolute right-[-180px] bottom-[-30px] z-10 pointer-events-none select-none" style={{ width: '22vw' }}>
          <img src="/assets/img/homepage/perso2.png" alt="" aria-hidden className="w-full object-contain object-bottom drop-shadow-xl" />
        </div>

        <div className="px-4 sm:px-8 lg:px-16 max-w-[1280px] mx-auto relative z-0">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-7">
            <div>
              <p className="kz-eyebrow mb-2" style={{ color: KZ.orange }}>Offres du moment</p>
              <h2 className="text-2xl lg:text-[36px] font-extrabold tracking-tight text-[#1A1410] max-w-[600px]">Des opportunites fraiches, livrees chaque matin.</h2>
            </div>
            <Link href="/candidate/jobs" className="shrink-0">
              <Button kind="outline" iconRight={<ArrowRight size={14} />}>Toutes les offres</Button>
            </Link>
          </div>

          {featuredJobs.length === 0 ? (
            <div className="text-center py-16">
              <Briefcase className="mx-auto mb-4 text-[#6B5A4A]" size={40} />
              <p className="text-lg font-bold text-[#1A1410] mb-2">Les offres arrivent bientot</p>
              <p className="text-sm text-[#6B5A4A] mb-6">Sois le premier a publier une offre ou a t&apos;inscrire.</p>
              <div className="flex gap-3 justify-center">
                <Link href="/auth/register"><Button kind="primary">Creer un compte</Button></Link>
                <Link href="/auth/register?role=recruiter"><Button kind="outline">Publier une offre</Button></Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
              {featuredJobs.map((job, i) => {
                const color = CARD_COLORS[i % CARD_COLORS.length]
                const isNew = Date.now() - new Date(job.created_at).getTime() < 86400000 * 3
                const jobSkills = job.skills?.map((s) => s.skill?.name).filter(Boolean).slice(0, 3) ?? []

                return (
                  <Link key={job.id} href={`/candidate/jobs/${job.id}`} className="block">
                    <div className="kz-card p-5 flex flex-col gap-3.5 relative bg-white hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0_#1A1410] transition-all">
                      {isNew && (
                        <div className="absolute -top-3 right-4 rotate-6">
                          <Badge color="orange" size="sm">Nouveau</Badge>
                        </div>
                      )}
                      {job.is_boosted && (
                        <div className="absolute -top-3 left-4 -rotate-6">
                          <Badge color="violet" size="sm">En avant</Badge>
                        </div>
                      )}
                      <div className="flex gap-3 items-start">
                        <div
                          className="w-12 h-12 rounded-lg border border-[#1A1410] flex items-center justify-center font-bold text-[#1A1410] shrink-0"
                          style={{ background: color }}
                        >
                          {(job.company?.name ?? 'CO').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-[#6B5A4A]">{job.company?.name}</div>
                          <div className="text-base font-bold text-[#1A1410] mt-0.5 truncate">{job.title}</div>
                        </div>
                      </div>
                      <div className="flex gap-1.5 flex-wrap">
                        <Tag color="cream">{job.job_type}</Tag>
                        {job.remote && <Tag color="green">Remote</Tag>}
                        {jobSkills.map((s) => <Tag key={s}>{s}</Tag>)}
                      </div>
                      <div className="flex justify-between items-center pt-2.5 border-t border-[#E8DDC9]">
                        <div>
                          <div className="flex items-center gap-1 text-xs text-[#2A2018]">
                            <MapPin size={11} />{job.location}
                          </div>
                          <div className="text-xs font-semibold text-[#2A2018] mt-0.5">
                            {formatSalary(job.salary_min, job.salary_max)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* COMMENT CA MARCHE — statique (contenu marketing) ──── */}
      <section className="px-4 sm:px-8 lg:px-16 py-12 lg:py-20" style={{ background: KZ.cream }}>
        <div className="max-w-[1280px] mx-auto">
          <div className="text-center mb-10 lg:mb-14">
            <p className="kz-eyebrow mb-2" style={{ color: KZ.orange }}>Comment ca marche</p>
            <h2 className="text-2xl lg:text-[36px] font-extrabold tracking-tight text-[#1A1410] max-w-[720px] mx-auto">
              Trois etapes, zero chichi, ton premier entretien en 48 h.
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {HOW_STEPS.map((step) => (
              <div key={step.n} className="kz-card p-7 relative pt-10" style={{ background: step.color }}>
                <div
                  className="absolute -top-5 left-6 w-11 h-11 rounded-full flex items-center justify-center text-lg font-extrabold border border-[#1A1410]"
                  style={{ background: KZ.ink, color: KZ.cream, boxShadow: '3px 3px 0 #FF6B35' }}
                >
                  {step.n}
                </div>
                <div className="w-14 h-14 rounded-xl border border-[#1A1410] flex items-center justify-center mb-5 text-[#1A1410]" style={{ background: KZ.paper }}>
                  {step.icon}
                </div>
                <h3 className="kz-h3 text-[#1A1410] mb-2.5">{step.title}</h3>
                <p className="text-sm leading-relaxed text-[#2A2018]">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BANNIERE RECRUTEURS ────────────────────────────────── */}
      <section className="px-4 sm:px-8 lg:px-16 py-12 lg:py-16 relative overflow-hidden" style={{ background: KZ.ink }}>
        <div className="absolute top-[-20px] right-8 lg:right-16 opacity-60 lg:opacity-100"><Soleil size={90} stroke={KZ.cream} color={KZ.orange} /></div>
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-8 lg:gap-12 items-center relative z-10">
          <div>
            <Badge color="yellow" size="lg" className="mb-4 lg:mb-5">Recruteurs</Badge>
            <h2 className="text-3xl lg:text-[44px] font-extrabold tracking-tight leading-tight mb-4 lg:mb-5" style={{ color: KZ.cream }}>
              Trouvez les meilleurs talents de l&apos;ile.<br />
              <span style={{ color: KZ.orange }}>Pas de spam. Pas de bruit.</span>
            </h2>
            <p className="text-base leading-relaxed opacity-80 mb-7 max-w-[520px]" style={{ color: KZ.cream }}>
              Annonces illimitees, IA de tri, dashboard analytics, et une vraie communaute locale de candidats actifs.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/auth/register?role=recruiter">
                <Button kind="primary" size="md">Publier une offre — gratuit</Button>
              </Link>
              <Link href="/auth/register?role=recruiter">
                <Button kind="outline" size="md" className="!text-[#FFF7EE] !border-[#FFF7EE] !bg-transparent">
                  Voir les tarifs
                </Button>
              </Link>
            </div>
          </div>
          <div className="hidden lg:flex flex-col gap-3" style={{ transform: 'rotate(2deg)' }}>
            <div className="p-4 rounded-xl border border-[#1A1410] kz-card" style={{ background: KZ.cream, color: KZ.ink, boxShadow: '4px 4px 0 #FF6B35' }}>
              <p className="kz-eyebrow text-[#6B5A4A] mb-2">Pipeline recrutement</p>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { l: 'Postu.', v: stats.jobs },
                  { l: 'Candidats', v: stats.users },
                  { l: 'Entreprises', v: stats.companies },
                  { l: 'Villes', v: 15 },
                ].map((c) => (
                  <div key={c.l} className="text-center p-2 rounded-md border border-[#1A1410]" style={{ background: KZ.paper }}>
                    <div className="text-xl font-extrabold">{c.v}</div>
                    <div className="text-[9px] font-semibold text-[#6B5A4A]">{c.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER CTA ─────────────────────────────────────────── */}
      <section className="px-4 sm:px-8 lg:px-16 py-14 lg:py-20 text-center border-t border-[#1A1410]" style={{ background: KZ.cream }}>
        <div className="flex justify-center gap-3 mb-5">
          <Hibiscus size={40} />
          <Soleil size={40} />
          <Palme size={48} />
        </div>
        <h2 className="text-[40px] sm:text-[52px] lg:text-[64px] font-extrabold tracking-[-0.04em] leading-none text-[#1A1410] mb-4">
          Anou commence ?
        </h2>
        <p className="text-base lg:text-lg text-[#2A2018] mb-7 max-w-[540px] mx-auto">
          3 minutes pour creer ton profil. 0 € pour postuler.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/auth/register">
            <Button kind="primary" size="lg" className="w-full sm:w-auto">Creer mon profil</Button>
          </Link>
          <Link href="/auth/register?role=recruiter">
            <Button kind="outline" size="lg" className="w-full sm:w-auto">Je suis recruteur</Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
