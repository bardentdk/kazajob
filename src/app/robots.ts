import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/candidate/jobs', '/candidate/jobs/'],
        disallow: [
          '/candidate/dashboard',
          '/candidate/applications',
          '/candidate/messages',
          '/candidate/profile',
          '/candidate/settings',
          '/candidate/agenda',
          '/candidate/ia',
          '/recruiter/',
          '/admin/',
          '/onboarding/',
          '/api/',
          '/auth/',
        ],
      },
      // Autorise Googlebot à indexer les offres d'emploi publiques
      {
        userAgent: 'Googlebot',
        allow: ['/', '/candidate/jobs', '/candidate/jobs/'],
      },
    ],
    sitemap: 'https://kazajob.re/sitemap.xml',
    host: 'https://kazajob.re',
  }
}
