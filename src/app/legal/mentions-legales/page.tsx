import type { Metadata } from 'next'
import { LegalDoc } from '@/components/legal/LegalDoc'

export const metadata: Metadata = {
  title: 'Mentions légales',
  description: 'Mentions légales de Kazajob, plateforme d\'emploi de La Réunion (974).',
}

export default function Page() {
  return (
    <LegalDoc title="Mentions légales" updated="11 juin 2026" sections={[
      { h: 'Éditeur du site', body: [
        'Le site kazajob.re est édité par Kazajob, entreprise individuelle (micro-entreprise) immatriculée à La Réunion.',
        'Responsable de la publication : [à compléter : nom du dirigeant].',
        'Siège : [à compléter : adresse], Saint-Denis, La Réunion (974).',
        'SIRET : [à compléter]. TVA non applicable, article 293 B du CGI.',
        'Contact : kazajob.re@gmail.com.',
      ] },
      { h: 'Hébergement', body: [
        'Application et site : Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, USA.',
        'Base de données : Neon (hébergement dans l\'Union européenne).',
      ] },
      { h: 'Propriété intellectuelle', body: [
        'L\'ensemble des éléments du site (marque Kazajob, logo, textes, interfaces, code) est protégé par le droit de la propriété intellectuelle. Toute reproduction non autorisée est interdite.',
      ] },
      { h: 'Contact', body: [
        'Pour toute question relative au site : kazajob.re@gmail.com.',
      ] },
    ]} />
  )
}
