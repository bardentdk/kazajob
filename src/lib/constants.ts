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
