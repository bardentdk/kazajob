'use client'

import { useEffect } from 'react'
import { FullPageLoader } from '@/components/ui/LogoLoader'

// Après connexion Google/LinkedIn : route l'utilisateur selon son rôle.
export default function PostOAuthPage() {
  useEffect(() => {
    const go = async () => {
      let role: string | undefined
      let companyId: string | null | undefined
      try {
        const res = await fetch('/api/me')
        if (res.ok) { const me = await res.json(); role = me?.role; companyId = me?.company_id }
      } catch { /* fallback ci-dessous */ }
      window.location.replace(
        role === 'admin'      ? '/admin/dashboard'
        : role === 'recruiter' ? (companyId ? '/recruiter/dashboard' : '/recruiter/company-setup')
        : '/candidate/dashboard',
      )
    }
    go()
  }, [])

  return <FullPageLoader />
}
