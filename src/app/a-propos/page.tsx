import type { Metadata } from 'next'
import { LegalDoc } from '@/components/legal/LegalDoc'

export const metadata: Metadata = {
  title: 'À propos',
  description: 'Kazajob, la plateforme d\'emploi nouvelle génération pour La Réunion (974).',
}

export default function Page() {
  return (
    <LegalDoc title="À propos de Kazajob"
      intro="Ton kaz, ton job, ton péi. Kazajob est la plateforme d'emploi nouvelle génération pensée pour La Réunion."
      sections={[
        { h: 'Notre mission', body: ['Connecter les talents réunionnais aux meilleures opportunités locales, avec des outils modernes : matching IA, CV Builder, assistant KazaIA, et une expérience pensée mobile-first.'] },
        { h: 'Pour les candidats', body: ['Un espace 100% gratuit, pour toujours : offres locales, candidature en 1 clic, préparation d\'entretien, suivi des candidatures et gamification.'] },
        { h: 'Pour les recruteurs', body: ['Une solution simple pour publier des offres, gérer les candidatures en équipe, suivre vos performances et recruter plus vite, avec un essai gratuit de 30 jours.'] },
        { h: 'Ancré dans le 974', body: ['Kazajob est une initiative locale, conçue à Saint-Denis, au service du marché de l\'emploi de La Réunion. Une question, une idée ? Écris-nous : kazajob.re@gmail.com.'] },
      ]} />
  )
}
