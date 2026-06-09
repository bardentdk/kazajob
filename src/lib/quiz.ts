/**
 * KAZAJOB — Quiz de personnalité candidat (ludique).
 * Source de vérité partagée client (affichage) + serveur (scoring anti-triche).
 * Le résultat = un archétype, affiché au candidat et au recruteur (indicateur RH).
 */
export type ArchetypeKey = 'fonceur' | 'creatif' | 'analyste' | 'collaboratif' | 'strategique'

export interface Archetype {
  key:   ArchetypeKey
  label: string
  emoji: string
  color: string           // clé de couleur KZ (hex)
  tagline: string         // pour le candidat
  recruiterHint: string   // indicateur côté recruteur
}

export const ARCHETYPES: Record<ArchetypeKey, Archetype> = {
  fonceur: {
    key: 'fonceur', label: 'Le Fonceur', emoji: '🚀', color: '#FF6B35',
    tagline: 'Énergique et orienté action — tu passes vite du projet au concret.',
    recruiterHint: "Prend des initiatives, avance vite. Idéal pour des missions à fort rythme.",
  },
  creatif: {
    key: 'creatif', label: 'Le Créatif', emoji: '🎨', color: '#6D3BEB',
    tagline: 'Imaginatif — tu apportes des idées que personne n’attendait.',
    recruiterHint: "Force de proposition et originalité. Atout pour l'innovation.",
  },
  analyste: {
    key: 'analyste', label: "L'Analyste", emoji: '🧩', color: '#1B4FB8',
    tagline: 'Rigoureux — tu aimes comprendre à fond et structurer.',
    recruiterHint: "Méthodique et fiable sur les sujets complexes et techniques.",
  },
  collaboratif: {
    key: 'collaboratif', label: 'Le Collaboratif', emoji: '🤝', color: '#19A974',
    tagline: 'Esprit d’équipe — l’humain et la communication d’abord.',
    recruiterHint: "Excellent relationnel et esprit d'équipe. Renforce la cohésion.",
  },
  strategique: {
    key: 'strategique', label: 'Le Stratège', emoji: '🧭', color: '#FFC93C',
    tagline: 'Vision d’ensemble — tu planifies et gardes le cap.',
    recruiterHint: "Sait prioriser et tenir les objectifs. Bon pour piloter/organiser.",
  },
}

export interface QuizQuestion {
  q: string
  options: { label: string; archetype: ArchetypeKey }[]
}

export const QUIZ: QuizQuestion[] = [
  { q: "C'est lundi matin, ton premier réflexe au boulot ?", options: [
    { label: 'Je fonce sur la tâche la plus urgente', archetype: 'fonceur' },
    { label: 'Je liste et j’organise ma semaine', archetype: 'strategique' },
    { label: 'Je prends le pouls de l’équipe autour d’un café', archetype: 'collaboratif' },
    { label: 'Je peaufine un détail qui me chiffonne', archetype: 'analyste' },
  ]},
  { q: 'Un nouveau projet tombe. Toi tu...', options: [
    { label: 'Proposes une idée que personne n’attendait', archetype: 'creatif' },
    { label: 'Démarres direct un premier prototype', archetype: 'fonceur' },
    { label: 'Analyses les risques avant tout', archetype: 'analyste' },
    { label: 'Répartis les rôles dans l’équipe', archetype: 'strategique' },
  ]},
  { q: 'Ton environnement de travail idéal ?', options: [
    { label: 'Du mouvement et des défis, ça bouge', archetype: 'fonceur' },
    { label: 'Un espace calme pour réfléchir à fond', archetype: 'analyste' },
    { label: 'Une équipe soudée et bienveillante', archetype: 'collaboratif' },
    { label: 'La liberté de créer et de tester', archetype: 'creatif' },
  ]},
  { q: 'Face à un problème compliqué...', options: [
    { label: 'Je décortique étape par étape', archetype: 'analyste' },
    { label: 'Je cherche une solution maline et détournée', archetype: 'creatif' },
    { label: 'J’en parle autour de moi pour avancer', archetype: 'collaboratif' },
    { label: 'Je tranche vite et j’ajuste après', archetype: 'fonceur' },
  ]},
  { q: 'Ce qui te motive le plus au travail ?', options: [
    { label: 'Atteindre des objectifs ambitieux', archetype: 'strategique' },
    { label: 'Apprendre et maîtriser un sujet', archetype: 'analyste' },
    { label: 'Aider et faire grandir les autres', archetype: 'collaboratif' },
    { label: 'Inventer quelque chose de nouveau', archetype: 'creatif' },
  ]},
  { q: 'On te confie une équipe. Tu commences par...', options: [
    { label: 'Fixer un cap clair et un plan', archetype: 'strategique' },
    { label: 'Créer une bonne ambiance', archetype: 'collaboratif' },
    { label: 'Lancer un premier chantier concret', archetype: 'fonceur' },
    { label: 'Comprendre les forces de chacun', archetype: 'analyste' },
  ]},
  { q: 'Ton super-pouvoir au boulot, ce serait...', options: [
    { label: 'Une énergie inépuisable', archetype: 'fonceur' },
    { label: 'Des idées à l’infini', archetype: 'creatif' },
    { label: 'Tout anticiper', archetype: 'strategique' },
    { label: 'Lire dans les gens', archetype: 'collaboratif' },
  ]},
]

export interface QuizResult {
  archetype: ArchetypeKey
  scores: Record<ArchetypeKey, number>
  completed_at: string
}

/** Calcule l'archétype dominant à partir des index de réponses (anti-triche serveur). */
export function scoreQuiz(answers: number[]): QuizResult | null {
  if (!Array.isArray(answers) || answers.length !== QUIZ.length) return null
  const scores: Record<ArchetypeKey, number> = {
    fonceur: 0, creatif: 0, analyste: 0, collaboratif: 0, strategique: 0,
  }
  for (let i = 0; i < QUIZ.length; i++) {
    const opt = QUIZ[i].options[answers[i]]
    if (!opt) return null
    scores[opt.archetype]++
  }
  // Archétype dominant (égalité départagée par l'ordre de déclaration).
  const order = Object.keys(ARCHETYPES) as ArchetypeKey[]
  const archetype = order.reduce((best, k) => (scores[k] > scores[best] ? k : best), order[0])
  return { archetype, scores, completed_at: new Date().toISOString() }
}
