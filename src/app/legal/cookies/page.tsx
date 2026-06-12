import type { Metadata } from 'next'
import { LegalDoc } from '@/components/legal/LegalDoc'

export const metadata: Metadata = {
  title: 'Politique de cookies',
  description: 'Utilisation des cookies sur Kazajob.',
}

export default function Page() {
  return (
    <LegalDoc title="Politique de cookies" updated="11 juin 2026"
      intro="Kazajob limite l'usage des cookies au strict nécessaire au fonctionnement du service."
      sections={[
        { h: 'Qu\'est-ce qu\'un cookie ?', body: ['Un cookie est un petit fichier déposé sur votre appareil par un site web, permettant notamment de maintenir votre session.'] },
        { h: 'Cookies utilisés', body: ['Kazajob utilise uniquement des cookies essentiels : cookie de session d\'authentification (pour rester connecté) et préférences techniques. Ces cookies sont strictement nécessaires et ne requièrent pas de consentement préalable.'] },
        { h: 'Pas de traçage publicitaire', body: ['Kazajob n\'utilise pas de cookies publicitaires ni de traceurs tiers à des fins de profilage marketing.'] },
        { h: 'Gestion des cookies', body: ['Vous pouvez configurer votre navigateur pour bloquer ou supprimer les cookies. La suppression du cookie de session entraînera votre déconnexion.'] },
      ]} />
  )
}
