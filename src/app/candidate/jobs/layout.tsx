import type { Metadata } from 'next'

const url = 'https://kazajob.re/candidate/jobs'
const title = "Offres d'emploi à La Réunion (974) — CDI, CDD, alternance | Kazajob"
const description =
  "Toutes les offres d'emploi à La Réunion : CDI, CDD, alternance, stage, freelance. " +
  "Matching IA, candidature en 1 clic, 100% gratuit pour les candidats. Trouve ton job péi sur Kazajob."

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  keywords: ['offres emploi La Réunion', 'job 974', 'recrutement Réunion', 'CDI Réunion', 'emploi Saint-Denis', 'emploi Saint-Pierre'],
  alternates: { canonical: url },
  openGraph: { title, description, url, type: 'website', siteName: 'Kazajob', locale: 'fr_RE' },
  twitter: { card: 'summary_large_image', title, description },
}

export default function JobsListLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
