/**
 * KAZAJOB — Préqualification candidat.
 * Questions définies par le recruteur à la publication d'une offre,
 * réponses fournies par le candidat à la candidature.
 */
export type PrequalType = 'oui_non' | 'choix' | 'texte'

export interface PrequalQuestion {
  id: string
  label: string
  type: PrequalType
  options?: string[]   // pour le type 'choix'
  required?: boolean
}

export interface PrequalAnswer {
  questionId: string
  label: string
  value: string
}

export const PREQUAL_TYPES: { id: PrequalType; label: string }[] = [
  { id: 'oui_non', label: 'Oui / Non' },
  { id: 'choix',   label: 'Choix multiple' },
  { id: 'texte',   label: 'Réponse libre' },
]

export const PREQUAL_SUGGESTIONS = [
  'Permis B',
  'Disponible immédiatement',
  'Mobile sur toute l\'île',
  'Niveau d\'expérience',
  'Diplôme requis',
]

export const MAX_PREQUAL_QUESTIONS = 6
