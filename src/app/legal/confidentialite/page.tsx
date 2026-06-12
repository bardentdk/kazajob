import type { Metadata } from 'next'
import { LegalDoc } from '@/components/legal/LegalDoc'

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
  description: 'Comment Kazajob collecte et protège vos données personnelles (RGPD).',
}

export default function Page() {
  return (
    <LegalDoc title="Politique de confidentialité" updated="11 juin 2026"
      intro="Kazajob accorde une grande importance à la protection de vos données personnelles, conformément au RGPD et à la loi Informatique et Libertés."
      sections={[
        { h: 'Responsable de traitement', body: ['Kazajob (micro-entreprise), La Réunion. Contact : kazajob.re@gmail.com.'] },
        { h: 'Données collectées', body: ['Données de compte (nom, e-mail, mot de passe chiffré, rôle), données de profil (CV, compétences, bio, localisation, pitch vidéo), données d\'entreprise pour les recruteurs, données d\'usage (candidatures, messages, favoris) et données de paiement traitées par Stripe (Kazajob ne stocke aucune donnée bancaire).'] },
        { h: 'Finalités et base légale', body: ['Fourniture du service et exécution du contrat (CGU/CGV) ; matching et recommandations (intérêt légitime) ; communications transactionnelles et, si activées, alertes e-mail (consentement) ; respect d\'obligations légales.'] },
        { h: 'Destinataires et sous-traitants', body: ['Vos données peuvent être traitées par nos sous-traitants : Neon (base de données, UE), Vercel (hébergement), Resend (e-mails transactionnels), Stripe (paiements), et un fournisseur d\'IA pour les fonctions KazaIA. Les recruteurs accèdent aux candidatures qui leur sont adressées.'] },
        { h: 'Durée de conservation', body: ['Les données sont conservées le temps nécessaire à la finalité, puis supprimées ou anonymisées. Un compte inactif ou supprimé entraîne la suppression des données associées, sous réserve des obligations légales de conservation.'] },
        { h: 'Transferts hors UE', body: ['Certains prestataires peuvent être situés hors UE ; les transferts sont encadrés par des garanties appropriées (clauses contractuelles types).'] },
        { h: 'Vos droits', body: ['Vous disposez des droits d\'accès, de rectification, d\'effacement, de limitation, d\'opposition et de portabilité. Pour les exercer : kazajob.re@gmail.com. Vous pouvez introduire une réclamation auprès de la CNIL (cnil.fr).'] },
        { h: 'Sécurité', body: ['Mots de passe chiffrés (bcrypt), données en transit et au repos protégées, contrôle d\'accès par rôle. Aucune revente de données.'] },
      ]} />
  )
}
