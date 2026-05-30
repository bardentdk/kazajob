'use client'

import { useEffect, useState } from 'react'
import { Database, ExternalLink, RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { KZ } from '@/lib/constants'

interface BackupResult {
  ok:          boolean
  fileId?:     string
  fileName?:   string
  webViewLink?:string
  sizeHuman?:  string
  exportedAt?: string
  summary?:    string
  error?:      string
}

interface BackupFile {
  id:          string
  name:        string
  createdTime: string
  size:        string
}

export default function AdminBackupPage() {
  const [running, setRunning]   = useState(false)
  const [result, setResult]     = useState<BackupResult | null>(null)
  const [backups, setBackups]   = useState<BackupFile[]>([])
  const [loadingList, setLoadingList] = useState(true)

  const fetchList = async () => {
    setLoadingList(true)
    try {
      const res = await fetch('/api/admin/backup')
      const data = await res.json()
      setBackups(data.backups ?? [])
    } catch {
      setBackups([])
    }
    setLoadingList(false)
  }

  useEffect(() => { fetchList() }, [])

  const handleBackup = async () => {
    setRunning(true)
    setResult(null)
    try {
      const res = await fetch('/api/admin/backup', { method: 'POST' })
      const data = await res.json()
      setResult(data)
      if (data.ok) await fetchList()
    } catch (e) {
      setResult({ ok: false, error: e instanceof Error ? e.message : 'Erreur réseau' })
    }
    setRunning(false)
  }

  return (
    <div className="max-w-[800px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-[#1A1410]">Sauvegarde Supabase</h1>
        <p className="text-sm text-[#6B5A4A] mt-1">Export JSON de toutes les tables → Google Drive</p>
      </div>

      {/* Configuration requise */}
      <div className="kz-card p-5 bg-white mb-5">
        <h2 className="text-sm font-bold text-[#1A1410] mb-3 flex items-center gap-2">
          <Database size={15} /> Configuration requise
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          {[
            { key: 'SUPABASE_SERVICE_ROLE_KEY', desc: 'Supabase → Settings → API' },
            { key: 'GOOGLE_SERVICE_ACCOUNT_EMAIL', desc: 'Google Cloud → IAM → Service Accounts' },
            { key: 'GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY', desc: 'Clé JSON → private_key' },
            { key: 'GOOGLE_DRIVE_FOLDER_ID', desc: 'ID depuis l\'URL Drive' },
            { key: 'CRON_SECRET', desc: 'Secret aléatoire pour cron Vercel' },
          ].map(v => (
            <div key={v.key} className="p-2.5 rounded-lg border border-[#E8DDC9]" style={{ background: KZ.cream2 }}>
              <code className="font-mono font-bold text-[#1A1410] text-[10px]">{v.key}</code>
              <div className="text-[10px] text-[#6B5A4A] mt-0.5">{v.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Déclencher un backup */}
      <div className="kz-card p-5 bg-white mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-sm font-bold text-[#1A1410]">Sauvegarde manuelle</h2>
            <p className="text-xs text-[#6B5A4A] mt-0.5">
              Export de toutes les tables + upload sur Google Drive.<br />
              Le cron automatique tourne chaque dimanche à 06h00 (heure Réunion).
            </p>
          </div>
          <Button
            kind="primary"
            size="md"
            icon={<Database size={15} />}
            loading={running}
            onClick={handleBackup}
          >
            Sauvegarder maintenant
          </Button>
        </div>

        {/* Résultat */}
        {result && (
          <div
            className="p-4 rounded-xl border-2 border-[#1A1410]"
            style={{ background: result.ok ? KZ.greenSoft : '#FEF2F2' }}
          >
            <div className="flex items-start gap-3">
              {result.ok
                ? <CheckCircle size={18} color={KZ.green} className="shrink-0 mt-0.5" />
                : <AlertCircle size={18} color="#EF4444" className="shrink-0 mt-0.5" />}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-[#1A1410]">
                  {result.ok ? 'Sauvegarde réussie !' : 'Erreur de sauvegarde'}
                </div>
                {result.ok ? (
                  <div className="text-xs text-[#6B5A4A] mt-1 space-y-0.5">
                    <div>Fichier : <strong>{result.fileName}</strong> ({result.sizeHuman})</div>
                    <div>Exporté : {result.exportedAt ? new Date(result.exportedAt).toLocaleString('fr-FR') : '—'}</div>
                  </div>
                ) : (
                  <div className="text-xs text-red-600 mt-1">{result.error}</div>
                )}
                {result.webViewLink && (
                  <a
                    href={result.webViewLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold mt-2"
                    style={{ color: KZ.violet }}
                  >
                    <ExternalLink size={11} /> Ouvrir dans Drive
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Historique */}
      <div className="kz-card bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E8DDC9] flex justify-between items-center" style={{ background: KZ.cream2 }}>
          <h2 className="text-sm font-bold text-[#1A1410] flex items-center gap-2">
            <Clock size={14} /> Historique des sauvegardes
          </h2>
          <button onClick={fetchList} className="text-[#6B5A4A] hover:text-[#1A1410] transition-colors">
            <RefreshCw size={14} className={loadingList ? 'animate-spin' : ''} />
          </button>
        </div>
        {loadingList ? (
          <div className="p-4 flex flex-col gap-2">
            {[1,2,3].map(i => <div key={i} className="h-10 rounded-lg bg-[#FBEFE0] animate-pulse" />)}
          </div>
        ) : backups.length === 0 ? (
          <div className="p-8 text-center">
            <Database size={28} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm text-[#6B5A4A]">
              {process.env.NODE_ENV === 'development'
                ? 'Aucun backup trouvé. Vérifiez les variables d\'env Google.'
                : 'Aucune sauvegarde pour le moment.'}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead style={{ background: KZ.cream2 }}>
              <tr>
                <th className="text-left p-3 text-xs font-bold text-[#1A1410]">Fichier</th>
                <th className="text-left p-3 text-xs font-bold text-[#1A1410] hidden sm:table-cell">Date</th>
                <th className="text-right p-3 text-xs font-bold text-[#1A1410]">Taille</th>
                <th className="p-3"/>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8DDC9]">
              {backups.map((b, i) => (
                <tr key={b.id} className="hover:bg-[#FBEFE0] transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {i === 0 && <Badge color="green" size="sm">Dernier</Badge>}
                      <span className="text-xs font-mono text-[#2A2018] truncate max-w-[200px]">{b.name}</span>
                    </div>
                  </td>
                  <td className="p-3 text-xs text-[#6B5A4A] hidden sm:table-cell">
                    {new Date(b.createdTime).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="p-3 text-xs text-right text-[#6B5A4A]">
                    {b.size ? `${Math.round(parseInt(b.size) / 1024)} KB` : '—'}
                  </td>
                  <td className="p-3 text-right">
                    <a
                      href={`https://drive.google.com/file/d/${b.id}/view`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#6B5A4A] hover:text-[#1A1410] transition-colors"
                    >
                      <ExternalLink size={13} />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
