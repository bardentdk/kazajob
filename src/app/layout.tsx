import type { Metadata } from 'next'
import { Sora } from 'next/font/google'
import './globals.css'

const sora = Sora({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-sora',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Kazajob — Le travail pei, nouvelle generation',
    template: '%s | Kazajob',
  },
  description:
    "La plateforme d'emploi nouvelle generation pour La Reunion. 12 400 offres locales. Matching IA. Premier entretien en 48h.",
  keywords: ['emploi', 'reunion', '974', 'job', 'recrutement', 'kazajob'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={sora.variable}>
      <body className="bg-[#FFF7EE] text-[#1A1410] antialiased min-h-screen">
        {children}
      </body>
    </html>
  )
}
