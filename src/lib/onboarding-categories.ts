import { KZ } from './constants'

export interface ProfessionCategory {
  id: string
  label: string
  emoji: string            // Pour l'illustration SVG inline
  color: string            // Couleur de la carte
  accentColor: string      // Couleur d'accent
  skills: string[]         // Compétences pré-remplies
  bio: string              // Bio suggérée
  jobTypes: string[]       // Types de postes typiques
}

export const PROFESSION_CATEGORIES: ProfessionCategory[] = [
  {
    id: 'tech',
    label: 'Tech & Dev',
    emoji: '💻',
    color: KZ.violetSoft,
    accentColor: KZ.violet,
    skills: ['JavaScript', 'React', 'Node.js', 'Python', 'Git', 'SQL'],
    bio: 'Développeur passionné par la création de solutions numériques innovantes.',
    jobTypes: ['CDI', 'CDD', 'Freelance', 'Remote'],
  },
  {
    id: 'design',
    label: 'Design & Créa',
    emoji: '🎨',
    color: KZ.orangeSoft,
    accentColor: KZ.orange,
    skills: ['Figma', 'Adobe XD', 'Photoshop', 'Illustrator', 'UI/UX', 'Motion'],
    bio: 'Designer créatif spécialisé dans l\'expérience utilisateur et l\'identité visuelle.',
    jobTypes: ['CDI', 'Freelance', 'Remote'],
  },
  {
    id: 'finance',
    label: 'Finance & Compta',
    emoji: '📊',
    color: KZ.greenSoft,
    accentColor: KZ.green,
    skills: ['Sage', 'Excel', 'Comptabilité', 'Fiscalité', 'Audit', 'Trésorerie'],
    bio: 'Professionnel de la finance avec une expertise en gestion comptable et fiscale.',
    jobTypes: ['CDI', 'CDD', 'Temps partiel'],
  },
  {
    id: 'sante',
    label: 'Santé & Social',
    emoji: '🏥',
    color: '#DCE7FB',
    accentColor: KZ.blue,
    skills: ['Soins infirmiers', 'Aide à la personne', 'Accompagnement', 'Urgences'],
    bio: 'Professionnel de santé engagé dans l\'accompagnement et le soin des patients.',
    jobTypes: ['CDI', 'CDD', 'Temps partiel', 'Vacation'],
  },
  {
    id: 'btp',
    label: 'BTP & Travaux',
    emoji: '🏗️',
    color: KZ.yellowSoft,
    accentColor: KZ.yellow,
    skills: ['Maçonnerie', 'Électricité', 'Plomberie', 'Menuiserie', 'Gros œuvre'],
    bio: 'Artisan du bâtiment expert dans les travaux de construction et rénovation.',
    jobTypes: ['CDI', 'CDD', 'Intérim'],
  },
  {
    id: 'commerce',
    label: 'Commerce & Vente',
    emoji: '🛍️',
    color: KZ.orangeSoft,
    accentColor: KZ.orange,
    skills: ['Vente', 'Négociation', 'CRM', 'Prospection', 'Relation client'],
    bio: 'Commercial dynamique avec une forte orientation résultats et relation client.',
    jobTypes: ['CDI', 'CDD'],
  },
  {
    id: 'tourisme',
    label: 'Tourisme & Hôtel',
    emoji: '🌴',
    color: KZ.greenSoft,
    accentColor: KZ.green,
    skills: ['Accueil', 'Anglais', 'Service', 'Réservation', 'Événementiel'],
    bio: 'Professionnel du tourisme passionné par l\'accueil et la découverte de La Réunion.',
    jobTypes: ['CDI', 'CDD', 'Saisonnier'],
  },
  {
    id: 'communication',
    label: 'Marketing & Com',
    emoji: '📢',
    color: KZ.violetSoft,
    accentColor: KZ.violet,
    skills: ['Marketing digital', 'Réseaux sociaux', 'Rédaction', 'SEO', 'Email marketing'],
    bio: 'Expert en communication digitale avec une approche créative et data-driven.',
    jobTypes: ['CDI', 'Freelance', 'Remote'],
  },
  {
    id: 'education',
    label: 'Éducation & Formation',
    emoji: '📚',
    color: '#FFF1C2',
    accentColor: '#B8860B',
    skills: ['Enseignement', 'Formation', 'Pédagogie', 'E-learning', 'Tutorat'],
    bio: 'Formateur passionné par la transmission du savoir et le développement des compétences.',
    jobTypes: ['CDI', 'CDD', 'Temps partiel', 'Vacation'],
  },
  {
    id: 'transport',
    label: 'Transport & Logistique',
    emoji: '🚚',
    color: KZ.blueSoft,
    accentColor: KZ.blue,
    skills: ['Conduite', 'Logistique', 'Supply chain', 'Gestion stock', 'CACES'],
    bio: 'Professionnel de la logistique engagé dans l\'optimisation des flux et la livraison.',
    jobTypes: ['CDI', 'CDD', 'Intérim'],
  },
  {
    id: 'agriculture',
    label: 'Agriculture & Agro',
    emoji: '🌾',
    color: KZ.greenSoft,
    accentColor: KZ.green,
    skills: ['Culture', 'Élevage', 'Agroalimentaire', 'Canne à sucre', 'Maraîchage'],
    bio: 'Professionnel agricole ancré dans les terroirs réunionnais et la production locale.',
    jobTypes: ['CDI', 'CDD', 'Saisonnier'],
  },
  {
    id: 'admin',
    label: 'Admin & Juridique',
    emoji: '⚖️',
    color: KZ.cream2,
    accentColor: KZ.mute,
    skills: ['Gestion administrative', 'Droit', 'RH', 'Secrétariat', 'Office'],
    bio: 'Administratif rigoureux avec une expertise en gestion organisationnelle et juridique.',
    jobTypes: ['CDI', 'CDD', 'Temps partiel'],
  },
]
