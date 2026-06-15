export const KZ = {
  orange:      '#FF6B35',
  orangeDeep:  '#E54E1A',
  orangeSoft:  '#FFE0CF',
  violet:      '#6D3BEB',
  violetSoft:  '#E5DCFF',
  blue:        '#1B4FB8',
  blueSoft:    '#DCE7FB',
  green:       '#19A974',
  greenSoft:   '#D6F0E0',
  yellow:      '#FFC93C',
  yellowSoft:  '#FFF1C2',
  cream:       '#FFF7EE',
  cream2:      '#FBEFE0',
  beige:       '#F2E4D0',
  ink:         '#1A1410',
  paper:       '#FFFFFF',
  text:        '#2A2018',
  mute:        '#6B5A4A',
  line:        '#E8DDC9',
} as const

export const REUNION_CITIES = [
  'Saint-Denis',
  'Saint-Paul',
  'Saint-Pierre',
  'Le Tampon',
  'Saint-Louis',
  'Saint-André',
  'Saint-Leu',
  'Saint-Benoît',
  'Sainte-Marie',
  'Sainte-Suzanne',
  'Saint-Joseph',
  'Cilaos',
  'Saint-Gilles',
  'Bras-Panon',
  'Salazie',
] as const

export const JOB_TYPES = [
  'CDI',
  'CDD',
  'Stage',
  'Alternance',
  'Freelance',
  'Intérim',
  'Temps partiel',
] as const

export const JOB_SECTORS = [
  'Informatique & Tech',
  'Commerce & Vente',
  'BTP & Construction',
  'Tourisme & Hôtellerie',
  'Santé & Social',
  'Éducation & Formation',
  'Finance & Comptabilité',
  'Marketing & Communication',
  'Agriculture & Agroalimentaire',
  'Transport & Logistique',
  'Administration & Juridique',
  'Artisanat & Métiers',
] as const

export const APPLICATION_STATUSES = {
  pending:     { label: 'En attente',         color: 'cream'  },
  viewed:      { label: 'CV consulté',         color: 'yellow' },
  interview:   { label: 'Entretien planifié',  color: 'green'  },
  offer:       { label: 'Offre reçue',         color: 'violet' },
  hired:       { label: 'Embauché',            color: 'green'  },
  rejected:    { label: 'Refusé',              color: 'orange' },
  withdrawn:   { label: 'Retirée',             color: 'cream'  },
} as const

export const ROLES = {
  candidate:  'candidate',
  recruiter:  'recruiter',
  admin:      'admin',
} as const

export const SITE_NAME = 'Kazajob'
export const SITE_TAGLINE = 'Le travail péi, nouvelle génération !'
export const SITE_URL = 'https://kazajob.re'

// ── Benchmark salaires La Réunion 974 (brut mensuel, source INSEE 2023) ──
export const SALARY_BENCHMARKS_974 = [
  { maxMonthly: 1400,    label: 'Sous le SMIC',       color: '#6B5A4A', bg: '#FBEFE0' },
  { maxMonthly: 1900,    label: 'Sous le marché 974',  color: '#FF6B35', bg: '#FFE0CF' },
  { maxMonthly: 3200,    label: 'Dans la norme 974',   color: '#FFC93C', bg: '#FFF1C2' },
  { maxMonthly: Infinity, label: 'Bien payé 974',      color: '#19A974', bg: '#D6F0E0' },
] as const

/** Retourne le label de benchmarking salarial pour La Réunion */
export function getSalaryLabel(min?: number | null, max?: number | null) {
  const ref = min ?? max
  if (!ref) return null
  // Détecte brut annuel (>15 000) ou mensuel
  const monthly = ref > 15_000 ? Math.round(ref / 12) : ref
  return SALARY_BENCHMARKS_974.find(b => monthly < b.maxMonthly) ?? SALARY_BENCHMARKS_974[3]
}

// ── Partenaires de diffusion ──────────────────────────────────────
export const PARTNERS: Record<string, { name: string; color: string; desc: string; icon: string }> = {
  france_travail: { name: 'France Travail', color: '#003189', desc: 'Pôle Emploi · réseau national',    icon: 'Landmark' },
  mission_locale: { name: 'Mission Locale', color: '#E31E24', desc: 'Jeunes 16-25 ans · 974',           icon: 'Target'   },
  apec:           { name: 'APEC',           color: '#1B3B6F', desc: 'Cadres & ingénieurs',              icon: 'Briefcase'},
  indeed:         { name: 'Indeed',         color: '#2164F3', desc: 'N°1 mondial offres d\'emploi',     icon: 'Search'   },
  aggregator:     { name: 'Flux XML/RSS',   color: '#19A974', desc: 'Tous agrégateurs compatibles',     icon: 'Rss'      },
}

// ── Plans tarifaires ──────────────────────────────────────────────
export interface SubscriptionPlan {
  id:         string
  name:       string
  priceCts:   number       // centimes/mois
  maxMembers: number
  maxJobs:    number        // -1 = illimité
  partners:   string[]
  apiAccess:  boolean
  highlight:  boolean
  trialDays:  number
  features:   string[]
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'starter', name: 'Starter', priceCts: 2900, maxMembers: 1, maxJobs: 3,
    partners: [], apiAccess: false, highlight: false, trialDays: 30,
    features: ['1 recruteur', '3 offres actives', 'Diffusion Kazajob uniquement', 'KazaScore recruteur', 'Messagerie candidats'],
  },
  {
    id: 'pro', name: 'Pro', priceCts: 8900, maxMembers: 3, maxJobs: 10,
    partners: ['france_travail'], apiAccess: false, highlight: true, trialDays: 30,
    features: ['3 recruteurs', '10 offres actives', 'Diffusion France Travail', 'KazaScore + Analytics', 'Gestion d\'équipe', 'Support prioritaire'],
  },
  {
    id: 'business', name: 'Business', priceCts: 17900, maxMembers: 10, maxJobs: -1,
    partners: ['france_travail', 'mission_locale', 'apec'], apiAccess: false, highlight: false, trialDays: 30,
    features: ['10 recruteurs', 'Offres illimitées', 'France Travail · Mission Locale · APEC', 'Analytics avancés', 'Rôles & permissions', 'SLA 24h'],
  },
  {
    id: 'enterprise', name: 'Entreprise', priceCts: 34900, maxMembers: 50, maxJobs: -1,
    partners: ['france_travail', 'mission_locale', 'apec', 'indeed', 'aggregator'], apiAccess: true, highlight: false, trialDays: 30,
    features: ['50 recruteurs', 'Offres illimitées', 'Toutes plateformes + flux XML', 'API entrante/sortante', 'Intégration ATS', 'CSM dédié', 'Contrat sur-mesure'],
  },
]

// ── Multidiffusion (désactivée visuellement — réactivation = passer à true) ──
// Le code de diffusion (lib/partners/*) reste en place ; seul l'affichage est masqué.
export const MULTIDIFFUSION_ENABLED = false

const DIFFUSION_FEATURE_RE = /diffusion|france travail|mission locale|apec|indeed|plateforme|flux xml/i

/** Features d'un forfait, en masquant les lignes de multidiffusion tant qu'elle est OFF. */
export function planFeatures(plan: SubscriptionPlan): string[] {
  return MULTIDIFFUSION_ENABLED ? plan.features : plan.features.filter((f) => !DIFFUSION_FEATURE_RE.test(f))
}

export const KAZA_BOOST_COST_XP = 100   // coût en XP pour booster son profil 48h
export const KAZA_BOOST_HOURS   = 48    // durée du boost en heures

// ── Boost payant d'une offre (recruteur) ──────────────────────────
export interface JobBoostOption { days: number; priceCts: number; label: string; tag?: string }
export const JOB_BOOST_OPTIONS: JobBoostOption[] = [
  { days: 7,  priceCts: 1900, label: '7 jours'  },
  { days: 15, priceCts: 2900, label: '15 jours', tag: 'Populaire' },
  { days: 30, priceCts: 4900, label: '30 jours', tag: 'Meilleur prix' },
]

// ── Boost payant d'un profil candidat (en plus du KazaBoost XP gratuit 48h) ──
export const PROFILE_BOOST_OPTIONS: JobBoostOption[] = [
  { days: 7,  priceCts: 900,  label: '7 jours'  },
  { days: 15, priceCts: 1500, label: '15 jours', tag: 'Populaire' },
  { days: 30, priceCts: 2500, label: '30 jours', tag: 'Meilleur prix' },
]

export const EVENT_TYPES: Record<string, { label: string; color: string; bg: string }> = {
  job_dating:      { label: 'Job Dating',          color: '#6D3BEB', bg: '#E5DCFF' },
  webinar:         { label: 'Webinar',              color: '#1B4FB8', bg: '#DCE7FB' },
  atelier:         { label: 'Atelier',              color: '#FF6B35', bg: '#FFE0CF' },
  info_collective: { label: 'Info Collective',      color: '#19A974', bg: '#D6F0E0' },
}

// ── Formations ───────────────────────────────────────────────────
export const CERTIFICATION_LEVELS = [
  { id: 'non_certifiante', label: 'Non certifiante'           },
  { id: '1',               label: 'Niveau 1 (BEP/CAP)'       },
  { id: '2',               label: 'Niveau 2 (Bac)'           },
  { id: '3',               label: 'Niveau 3 (Bac+2 / BTS)'   },
  { id: '4',               label: 'Niveau 4 (Bac+3 / Licence)'},
  { id: '5',               label: 'Niveau 5 (Bac+5 / Master)' },
  { id: '6',               label: 'Niveau 6 (Bac+6)'          },
  { id: '7',               label: 'Niveau 7 (Doctorat)'       },
  { id: '8',               label: 'Niveau 8 (HDR)'            },
]

export const FINANCING_OPTIONS = [
  'CPF',
  'OPCO',
  'France Travail',
  'Région Réunion',
  'AIF (Aide Individuelle)',
  'Autofinancement',
]

export const DURATION_UNITS = [
  { id: 'heures',   label: 'heures'   },
  { id: 'jours',    label: 'jours'    },
  { id: 'semaines', label: 'semaines' },
  { id: 'mois',     label: 'mois'     },
]

export const TRAINING_STATUS: Record<string, { label: string; color: string }> = {
  pending:   { label: 'En attente',  color: 'yellow' },
  viewed:    { label: 'Dossier vu',  color: 'blue'   },
  accepted:  { label: 'Accepté',     color: 'green'  },
  rejected:  { label: 'Refusé',      color: 'orange' },
  withdrawn: { label: 'Retiré',      color: 'cream'  },
}

/** Vérifie que le titre contient la mention (H/F) ou (F/H) */
export function hasMentionHF(title: string): boolean {
  return /\(H\/F\)|\(F\/H\)/i.test(title)
}

// ── Soft skills (savoir-être) — catalogue candidat ────────────────
export const SOFT_SKILLS = [
  'Travail en équipe', 'Communication', 'Autonomie', 'Rigueur', 'Adaptabilité',
  'Sens de l\'organisation', 'Créativité', 'Esprit d\'initiative', 'Gestion du stress',
  'Écoute active', 'Leadership', 'Résolution de problèmes', 'Esprit critique',
  'Empathie', 'Ponctualité', 'Curiosité', 'Persévérance', 'Sens du service client',
  'Esprit d\'analyse', 'Gestion du temps', 'Négociation', 'Polyvalence',
]

// ── Loisirs / centres d'intérêt — catalogue candidat ──────────────
export const HOBBIES = [
  'Sport', 'Randonnée', 'Musique', 'Lecture', 'Cuisine', 'Voyage', 'Photographie',
  'Jeux vidéo', 'Cinéma', 'Bénévolat', 'Jardinage', 'Danse', 'Plongée', 'Surf',
  'Pêche', 'Bricolage', 'Dessin', 'Yoga', 'Course à pied', 'Football', 'Musculation',
  'Chant', 'Théâtre', 'Astronomie',
]

