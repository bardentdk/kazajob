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
export const PARTNERS: Record<string, { name: string; emoji: string; color: string; desc: string }> = {
  france_travail: { name: 'France Travail', emoji: '🏛️', color: '#003189', desc: 'Pôle Emploi · réseau national' },
  mission_locale: { name: 'Mission Locale', emoji: '🎯', color: '#E31E24', desc: 'Jeunes 16-25 ans · 974' },
  apec:           { name: 'APEC',           emoji: '💼', color: '#1B3B6F', desc: 'Cadres & ingénieurs' },
  indeed:         { name: 'Indeed',         emoji: '🔍', color: '#2164F3', desc: 'N°1 mondial offres d\'emploi' },
  aggregator:     { name: 'Flux XML/RSS',   emoji: '📡', color: '#19A974', desc: 'Tous agrégateurs compatibles' },
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
    partners: [], apiAccess: false, highlight: false, trialDays: 14,
    features: ['1 recruteur', '3 offres actives', 'Diffusion Kazajob uniquement', 'KazaScore recruteur', 'Messagerie candidats'],
  },
  {
    id: 'pro', name: 'Pro', priceCts: 8900, maxMembers: 3, maxJobs: 10,
    partners: ['france_travail'], apiAccess: false, highlight: true, trialDays: 14,
    features: ['3 recruteurs', '10 offres actives', 'Diffusion France Travail', 'KazaScore + Analytics', 'Gestion d\'équipe', 'Support prioritaire'],
  },
  {
    id: 'business', name: 'Business', priceCts: 17900, maxMembers: 10, maxJobs: -1,
    partners: ['france_travail', 'mission_locale', 'apec'], apiAccess: false, highlight: false, trialDays: 14,
    features: ['10 recruteurs', 'Offres illimitées', 'France Travail · Mission Locale · APEC', 'Analytics avancés', 'Rôles & permissions', 'SLA 24h'],
  },
  {
    id: 'enterprise', name: 'Entreprise', priceCts: 34900, maxMembers: 50, maxJobs: -1,
    partners: ['france_travail', 'mission_locale', 'apec', 'indeed', 'aggregator'], apiAccess: true, highlight: false, trialDays: 14,
    features: ['50 recruteurs', 'Offres illimitées', 'Toutes plateformes + flux XML', 'API entrante/sortante', 'Intégration ATS', 'CSM dédié', 'Contrat sur-mesure'],
  },
]

export const KAZA_BOOST_COST_XP = 100   // coût en XP pour booster son profil 48h
export const KAZA_BOOST_HOURS   = 48    // durée du boost en heures

export const EVENT_TYPES: Record<string, { label: string; emoji: string; color: string; bg: string }> = {
  job_dating: { label: 'Job Dating',  emoji: '🤝', color: '#6D3BEB', bg: '#E5DCFF' },
  webinar:    { label: 'Webinar',     emoji: '💻', color: '#1B4FB8', bg: '#DCE7FB' },
  atelier:    { label: 'Atelier',     emoji: '🎯', color: '#FF6B35', bg: '#FFE0CF' },
}
