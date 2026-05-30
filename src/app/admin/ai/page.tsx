'use client'

import { useEffect, useState } from 'react'
import { Sparkles, ExternalLink, Zap, MessageCircle, FileText, Brain } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { KZ } from '@/lib/constants'

interface AIStats {
  totalApplications: number
  applicationsWithCoverLetter: number
  totalConversations: number
  coverLettersEstimated: number
  interviewPrepsEstimated: number
  chatsEstimated: number
}

// Coût estimé Groq (llama-3.3-70b-versatile) au 2024
// ~$0.59 / M tokens input, ~$0.79 / M tokens output
// Estimation : cover letter ~800 tokens, interview prep ~1200 tokens, chat ~400 tokens
const COST_PER = {
  coverLetter:   0.0009,  // $ par génération
  interviewPrep: 0.0015,
  chat:          0.0005,
}

function StatBlock({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: string | number; sub: string; color: string
}) {
  return (
    <div className="kz-card p-5 bg-white flex items-start gap-4">
      <div className="w-10 h-10 rounded-xl border border-[#1A1410] flex items-center justify-center shrink-0" style={{ background: color }}>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-extrabold text-[#1A1410]">{value}</div>
        <div className="text-sm font-bold text-[#1A1410]">{label}</div>
        <div className="text-xs text-[#6B5A4A]">{sub}</div>
      </div>
    </div>
  )
}

export default function AdminAIPage() {
  const supabase = createClient()
  const [stats, setStats] = useState<AIStats>({
    totalApplications: 0,
    applicationsWithCoverLetter: 0,
    totalConversations: 0,
    coverLettersEstimated: 0,
    interviewPrepsEstimated: 0,
    chatsEstimated: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const [
        { count: totalApps },
        { count: appsWithCL },
        { count: convs },
      ] = await Promise.all([
        supabase.from('applications').select('*', { count: 'exact', head: true }),
        supabase.from('applications').select('*', { count: 'exact', head: true }).not('cover_letter', 'is', null).neq('cover_letter', ''),
        supabase.from('conversations').select('*', { count: 'exact', head: true }),
      ])

      const clCount   = appsWithCL ?? 0
      const chatCount = (convs ?? 0) * 3  // estimation moyenne 3 messages par conversation
      const ipCount   = Math.round((totalApps ?? 0) * 0.15)  // estimation 15% utilisent interview prep

      setStats({
        totalApplications:          totalApps ?? 0,
        applicationsWithCoverLetter: clCount,
        totalConversations:          convs ?? 0,
        coverLettersEstimated:       clCount,
        interviewPrepsEstimated:     ipCount,
        chatsEstimated:              chatCount,
      })
      setLoading(false)
    }
    load()
  }, [])

  const estimatedCost = (
    stats.coverLettersEstimated * COST_PER.coverLetter +
    stats.interviewPrepsEstimated * COST_PER.interviewPrep +
    stats.chatsEstimated * COST_PER.chat
  )

  const totalRequests = stats.coverLettersEstimated + stats.interviewPrepsEstimated + stats.chatsEstimated

  return (
    <div className="max-w-[900px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-[#1A1410]">KazaIA — Statistiques</h1>
        <p className="text-sm text-[#6B5A4A] mt-1">Usage de l&apos;IA et estimation des coûts Groq</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-24 rounded-2xl bg-[#FBEFE0] animate-pulse" />)}
        </div>
      ) : (
        <>
          {/* KPIs principaux */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <StatBlock
              icon={<Sparkles size={18} color={KZ.violet} />}
              label="Requêtes IA estimées"
              value={totalRequests.toLocaleString('fr-FR')}
              sub="Lettres + entretiens + chats"
              color={KZ.violetSoft}
            />
            <StatBlock
              icon={<Zap size={18} color={KZ.orange} />}
              label="Coût Groq estimé"
              value={`~$${estimatedCost.toFixed(2)}`}
              sub="Basé sur llama-3.3-70b-versatile"
              color={KZ.orangeSoft}
            />
          </div>

          {/* Détail par feature */}
          <div className="kz-card p-5 bg-white mb-5">
            <h2 className="text-sm font-bold text-[#1A1410] mb-4">Détail par fonctionnalité</h2>
            <div className="flex flex-col gap-4">
              {[
                {
                  icon: <FileText size={16} color={KZ.violet} />,
                  label: 'Lettres de motivation',
                  count: stats.coverLettersEstimated,
                  cost: stats.coverLettersEstimated * COST_PER.coverLetter,
                  desc: `${stats.applicationsWithCoverLetter} candidatures avec lettre`,
                  color: KZ.violetSoft,
                },
                {
                  icon: <Brain size={16} color={KZ.blue} />,
                  label: 'Préparations entretien',
                  count: stats.interviewPrepsEstimated,
                  cost: stats.interviewPrepsEstimated * COST_PER.interviewPrep,
                  desc: `~15% des ${stats.totalApplications} candidatures`,
                  color: KZ.blueSoft,
                },
                {
                  icon: <MessageCircle size={16} color={KZ.green} />,
                  label: 'Messages Chat Assistant',
                  count: stats.chatsEstimated,
                  cost: stats.chatsEstimated * COST_PER.chat,
                  desc: `${stats.totalConversations} conversations · ~3 msg/conv`,
                  color: KZ.greenSoft,
                },
              ].map(row => (
                <div key={row.label} className="flex items-center gap-4 p-3 rounded-xl border border-[#E8DDC9]" style={{ background: KZ.cream2 }}>
                  <div className="w-8 h-8 rounded-lg border border-[#1A1410] flex items-center justify-center shrink-0" style={{ background: row.color }}>
                    {row.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-[#1A1410]">{row.label}</div>
                    <div className="text-xs text-[#6B5A4A]">{row.desc}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-lg font-extrabold text-[#1A1410]">{row.count.toLocaleString('fr-FR')}</div>
                    <div className="text-[11px] text-[#6B5A4A]">~${row.cost.toFixed(3)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Note + liens */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="kz-card p-5 bg-white">
              <h3 className="text-sm font-bold text-[#1A1410] mb-2">📌 Note sur les estimations</h3>
              <p className="text-xs text-[#6B5A4A] leading-relaxed">
                Ces chiffres sont des <strong>estimations</strong> basées sur les données Supabase (candidatures, conversations).
                Pour un suivi exact, activez les logs IA dans les routes API ({' '}
                <code className="bg-[#FBEFE0] px-1 rounded text-[10px]">/api/kaza-ia/*</code>).
              </p>
            </div>

            <div className="kz-card p-5 bg-white">
              <h3 className="text-sm font-bold text-[#1A1410] mb-3">Tableaux de bord fournisseurs</h3>
              <div className="flex flex-col gap-2">
                {[
                  { label: 'Console Groq', url: 'https://console.groq.com', color: KZ.orangeSoft },
                  { label: 'Supabase Studio', url: 'https://supabase.com/dashboard', color: KZ.greenSoft },
                  { label: 'Resend (emails)', url: 'https://resend.com/emails', color: KZ.violetSoft },
                ].map(link => (
                  <a
                    key={link.label}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2.5 p-2.5 rounded-xl border border-[#1A1410] text-sm font-semibold text-[#1A1410] transition-all hover:shadow-[2px_2px_0_#1A1410]"
                    style={{ background: link.color }}
                  >
                    <ExternalLink size={13} className="shrink-0" />
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
