import type { Metadata } from 'next'
import { LegalDoc } from '@/components/legal/LegalDoc'

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation",
  description: "Conditions générales d'utilisation de la plateforme Kazajob (974).",
}

export default function Page() {
  return (
    <LegalDoc title="Conditions Générales d'Utilisation" updated="11 juin 2026"
      intro="Les présentes CGU régissent l'accès et l'utilisation de la plateforme Kazajob (kazajob.re). En créant un compte, vous les acceptez sans réserve."
      sections={[
        { h: '1. Objet', body: ['Kazajob est une plateforme de mise en relation entre candidats et recruteurs à La Réunion (974), proposant notamment la diffusion d\'offres, des candidatures, une messagerie et des outils d\'aide à la recherche d\'emploi.'] },
        { h: '2. Accès au service', body: ['L\'accès candidat est gratuit. L\'accès recruteur peut nécessiter un abonnement (voir CGV). Kazajob s\'efforce d\'assurer la disponibilité du service mais ne garantit pas une absence totale d\'interruption.'] },
        { h: '3. Compte utilisateur', body: ['L\'utilisateur s\'engage à fournir des informations exactes et à maintenir la confidentialité de ses identifiants. Il est responsable des activités réalisées depuis son compte. Tout compte peut être suspendu en cas de manquement aux présentes CGU.'] },
        { h: '4. Obligations des utilisateurs', body: ['Les candidats s\'engagent à publier des informations véridiques. Les recruteurs s\'engagent à publier des offres réelles, non discriminatoires et conformes au droit du travail (notamment la mention (H/F)). Sont interdits : contenus illicites, frauduleux, diffamatoires ou portant atteinte aux droits de tiers.'] },
        { h: '5. Contenus & propriété intellectuelle', body: ['L\'utilisateur conserve ses droits sur les contenus qu\'il publie et accorde à Kazajob une licence d\'usage limitée à l\'exploitation du service. La marque, le logo et les éléments du site restent la propriété de Kazajob.'] },
        { h: '6. Responsabilité', body: ['Kazajob est un intermédiaire technique et n\'est pas partie aux relations contractuelles entre candidats et recruteurs. Kazajob ne saurait être tenu responsable du contenu publié par les utilisateurs ni de l\'issue d\'un recrutement.'] },
        { h: '7. Données personnelles', body: ['Le traitement des données est décrit dans la Politique de confidentialité.'] },
        { h: '8. Modification & droit applicable', body: ['Kazajob peut modifier les présentes CGU ; la version applicable est celle en ligne. Les CGU sont régies par le droit français. Tout litige relève des juridictions compétentes de La Réunion, après tentative de résolution amiable.'] },
      ]} />
  )
}
