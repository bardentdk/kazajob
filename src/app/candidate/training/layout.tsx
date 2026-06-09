import type { Metadata } from 'next'

const url = 'https://kazajob.re/candidate/training'
const title = 'Formations professionnelles à La Réunion (974) | Kazajob'
const description =
  "Trouve ta formation à La Réunion : titres certifiants, formations financées (CPF, France Travail), " +
  "présentiel ou distanciel. Sessions d'information collectives. 100% local sur Kazajob."

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  keywords: ['formation La Réunion', 'formation financée Réunion', 'CPF Réunion', 'formation professionnelle 974', 'titre RNCP Réunion'],
  alternates: { canonical: url },
  openGraph: { title, description, url, type: 'website', siteName: 'Kazajob', locale: 'fr_RE' },
  twitter: { card: 'summary_large_image', title, description },
}

export default function TrainingListLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
