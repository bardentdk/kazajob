'use client'

import { useEffect, useState } from 'react'
import { Search, Shield, Users } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Avatar } from '@/components/ui/Avatar'
import { PageLoader } from '@/components/feedback/LoadingSpinner'
import type { Profile } from '@/lib/types'
import { KZ } from '@/lib/constants'
import { timeAgo } from '@/lib/utils'
import type { BadgeColor } from '@/lib/types'

const ROLE_COLOR: Record<string, BadgeColor> = {
  candidate: 'green',
  recruiter: 'violet',
  admin: 'orange',
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(`/api/admin/users${search ? `?search=${encodeURIComponent(search)}` : ''}`)
        if (res.ok) setUsers((await res.json()) as Profile[])
      } catch { /* noop */ }
      setLoading(false)
    }
    fetchUsers()
  }, [search])

  const updateRole = async (userId: string, role: Profile['role']) => {
    await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    })
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role } : u))
  }

  return (
    <div className="max-w-[900px] mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="kz-h2 text-[#1A1410] mb-1">Utilisateurs</h1>
          <p className="text-sm text-[#6B5A4A]">{users.length} compte(s)</p>
        </div>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un utilisateur..."
          icon={<Search size={16} />}
          className="w-72"
        />
      </div>

      {loading ? <PageLoader /> : (
        <div className="kz-card bg-white overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E8DDC9]" style={{ background: KZ.cream2 }}>
                {['Utilisateur', 'Email', 'Role', 'Inscription', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-[#6B5A4A] uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((user, i) => (
                <tr key={user.id} className="border-b border-[#E8DDC9] last:border-0 hover:bg-[#FBEFE0] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={user.full_name} src={user.avatar_url} size={32} color={KZ.orangeSoft} />
                      <span className="text-sm font-semibold text-[#1A1410]">{user.full_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#6B5A4A]">{user.email}</td>
                  <td className="px-4 py-3">
                    <Badge color={ROLE_COLOR[user.role] ?? 'cream'} size="sm">{user.role}</Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#6B5A4A]">{timeAgo(user.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      {user.role !== 'admin' && (
                        <Button kind="soft" size="sm" icon={<Shield size={12} />} onClick={() => updateRole(user.id, 'admin')}>
                          Admin
                        </Button>
                      )}
                      {user.role !== 'candidate' && (
                        <Button kind="soft" size="sm" onClick={() => updateRole(user.id, 'candidate')}>
                          Candidat
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
