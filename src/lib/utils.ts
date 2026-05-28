import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatSalary(min: number | null, max: number | null, currency = '€'): string {
  if (!min && !max) return 'Salaire non précisé'
  if (!max) return `${min?.toLocaleString('fr-FR')} ${currency}`
  if (!min) return `jusqu'à ${max?.toLocaleString('fr-FR')} ${currency}`
  if (min >= 1000 && max >= 1000) {
    return `${(min / 1000).toFixed(0)}–${(max / 1000).toFixed(0)} k${currency}`
  }
  return `${min?.toLocaleString('fr-FR')} – ${max?.toLocaleString('fr-FR')} ${currency}`
}

export function timeAgo(date: string): string {
  const now = new Date()
  const d = new Date(date)
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000)

  if (diff < 60) return "À l'instant"
  if (diff < 3600) return `${Math.floor(diff / 60)} min`
  if (diff < 86400) return `${Math.floor(diff / 3600)} h`
  if (diff < 172800) return 'Hier'
  if (diff < 604800) return `${Math.floor(diff / 86400)} j`
  if (diff < 2592000) return `${Math.floor(diff / 604800)} sem.`
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export function initials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim()
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return text.slice(0, length) + '…'
}

export function matchScore(candidateSkills: string[], jobSkills: string[]): number {
  if (!jobSkills.length) return 50
  const matched = candidateSkills.filter((s) =>
    jobSkills.some((j) => j.toLowerCase() === s.toLowerCase())
  )
  return Math.round((matched.length / jobSkills.length) * 100)
}
