import type { Metadata } from 'next'
import { LegalDoc } from '@/components/legal/LegalDoc'

export const metadata: Metadata = {
  title: 'Conditions Générales de Vente',
  description: 'Conditions générales de vente des abonnements recruteurs Kazajob.',
}

export default function Page() {
  return (
    <LegalDoc title="Conditions Générales de Vente" updated="11 juin 2026"
      intro="Les présentes CGV s'appliquent aux abonnements recruteurs souscrits sur Kazajob. Elles complètent les CGU."
      sections={[
        { h: '1. Objet', body: ['Les CGV régissent la vente d\'abonnements donnant accès aux fonctionnalités recruteur de Kazajob (publication d\'offres, gestion des candidatures, équipe, etc.).'] },
        { h: '2. Forfaits et prix', body: ['Les forfaits et tarifs en vigueur sont affichés sur la page Tarifs. Les prix sont indiqués en euros. TVA non applicable, article 293 B du CGI (micro-entreprise) : le tarif net = tarif à payer.'] },
        { h: '3. Essai gratuit', body: ['Chaque forfait payant inclut un essai gratuit de 30 jours. Un moyen de paiement est enregistré à la souscription (via Stripe) ; aucun débit n\'intervient pendant l\'essai. À l\'issue des 30 jours, l\'abonnement est automatiquement débité selon le forfait choisi, sauf résiliation avant la fin de l\'essai.'] },
        { h: '3 bis. Offre de lancement KazaLaunch', body: [
          'KazaLaunch est une offre promotionnelle temporaire d\'inauguration, distincte des forfaits payants. Elle permet de publier gratuitement pendant 3 mois calendaires à compter de son activation, dans la limite de 1 recruteur et 3 offres actives.',
          'KazaLaunch ne nécessite aucune carte bancaire et ne déclenche aucun prélèvement automatique, ni pendant ni à l\'issue des 3 mois. À l\'expiration, la publication et la réactivation d\'offres sont suspendues jusqu\'au choix d\'un forfait payant ; les candidatures et données déjà enregistrées restent accessibles en consultation.',
          'L\'offre est utilisable une seule fois par entreprise. Sa disponibilité pour les nouvelles inscriptions peut être suspendue ou retirée à tout discrétion de Kazajob. Les comptes ayant déjà activé KazaLaunch ne sont pas transformés automatiquement en abonnement payant : toute souscription payante nécessite une action et un consentement explicites du recruteur. Les limites de l\'offre sont affichées sur la page Tarifs.',
        ] },
        { h: '4. Commande et paiement', body: ['Le paiement est traité par notre prestataire Stripe. À l\'issue de l\'essai, l\'abonnement est facturé selon la périodicité choisie. Le recruteur garantit disposer des droits pour engager son entreprise.'] },
        { h: '5. Reconduction et résiliation', body: ['L\'abonnement est reconductible automatiquement. Il peut être résilié à tout moment depuis l\'espace de gestion (portail Stripe) ; la résiliation prend effet à la fin de la période en cours, sans remboursement du temps entamé sauf disposition légale contraire.'] },
        { h: '6. Droit de rétractation', body: ['Conformément à l\'article L221-3 du Code de la consommation, le droit de rétractation ne s\'applique pas aux professionnels lorsque l\'objet du contrat entre dans le champ de leur activité principale. L\'essai gratuit tient lieu de période d\'évaluation.'] },
        { h: '7. Responsabilité', body: ['Kazajob fournit le service en l\'état et met en œuvre les moyens raisonnables pour en assurer le bon fonctionnement. Sa responsabilité est limitée au montant de l\'abonnement sur la période concernée.'] },
        { h: '8. Litiges', body: ['Les CGV sont régies par le droit français. Tout litige fera l\'objet d\'une recherche de solution amiable avant saisine des juridictions compétentes de La Réunion. Contact : kazajob.re@gmail.com.'] },
      ]} />
  )
}
