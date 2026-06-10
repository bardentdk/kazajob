/**
 * KAZAJOB — Requêtes Drizzle pour le profil et les compétences candidat.
 * Couche serveur. `updateProfile` n'autorise qu'une liste blanche de champs.
 */
import { and, eq, inArray, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { candidateSkills, profiles, skills } from '@/lib/db/schema'
import type { Profile, Skill } from '@/lib/types'
import { KAZA_BOOST_COST_XP, KAZA_BOOST_HOURS } from '@/lib/constants'
import { scoreQuiz } from '@/lib/quiz'
import { serialize } from './_serialize'

type ProfileInsert = typeof profiles.$inferInsert

// Champs modifiables par l'utilisateur : clé API (snake_case) → colonne Drizzle.
const EDITABLE: Record<string, keyof ProfileInsert> = {
  full_name:             'fullName',
  bio:                   'bio',
  location:              'location',
  phone:                 'phone',
  avatar_url:            'avatarUrl',
  cv_url:                'cvUrl',
  soft_skills:           'softSkills',
  hobbies:               'hobbies',
  avatar_config:         'avatarConfig',
  avatar_category:       'avatarCategory',
  avatar_categories:     'avatarCategories',
  gender:                'gender',
  character_domain:      'characterDomain',
  gamification_enabled:  'gamificationEnabled',
  onboarding_completed:  'onboardingCompleted',
  email_alerts_enabled:  'emailAlertsEnabled',
  email_alert_frequency: 'emailAlertFrequency',
  cv_data:               'cvData',
  cv_template:           'cvTemplate',
  cv_color:              'cvColor',
  video_pitch_url:       'videoPitchUrl',
}

/** Met à jour le profil de l'utilisateur (champs en liste blanche uniquement). */
export async function updateProfile(
  userId: string,
  patch: Record<string, unknown>,
): Promise<void> {
  const set: Record<string, unknown> = {}
  for (const [apiKey, column] of Object.entries(EDITABLE)) {
    if (apiKey in patch) set[column] = patch[apiKey]
  }
  if (Object.keys(set).length === 0) return
  set.updatedAt = new Date()
  await db.update(profiles).set(set as Partial<ProfileInsert>).where(eq(profiles.id, userId))
}

/** Compétences d'un candidat (objets Skill). */
export async function getCandidateSkills(candidateId: string): Promise<Skill[]> {
  const rows = await db.query.candidateSkills.findMany({
    where: eq(candidateSkills.candidateId, candidateId),
    with: { skill: true },
  })
  return rows.map((r) => (r as { skill: Skill }).skill).filter(Boolean)
}

export async function addCandidateSkill(candidateId: string, skillId: string): Promise<void> {
  await db.insert(candidateSkills).values({ candidateId, skillId }).onConflictDoNothing()
}

export async function removeCandidateSkill(candidateId: string, skillId: string): Promise<void> {
  await db
    .delete(candidateSkills)
    .where(and(eq(candidateSkills.candidateId, candidateId), eq(candidateSkills.skillId, skillId)))
}

/** Ajoute en masse des compétences à partir de leurs noms (idempotent). */
export async function addCandidateSkillsByNames(candidateId: string, names: string[]): Promise<void> {
  if (!names.length) return
  const found = await db.select({ id: skills.id }).from(skills).where(inArray(skills.name, names))
  if (!found.length) return
  await db
    .insert(candidateSkills)
    .values(found.map((s) => ({ candidateId, skillId: s.id })))
    .onConflictDoNothing()
}

/** Toutes les compétences (référentiel), triées par nom. */
export async function listSkills(): Promise<Skill[]> {
  return db.select().from(skills).orderBy(skills.name)
}

/** Active un KazaBoost (coûte des XP). Vérifie le solde côté serveur. */
export async function boostProfile(userId: string): Promise<{ error: string | null }> {
  const [me] = await db
    .select({ xp: profiles.xp, boostedUntil: profiles.boostedUntil })
    .from(profiles).where(eq(profiles.id, userId)).limit(1)
  if (!me) return { error: 'Profil introuvable' }
  if (me.boostedUntil && me.boostedUntil > new Date()) return { error: 'Déjà boosté' }
  if (me.xp < KAZA_BOOST_COST_XP) return { error: 'XP insuffisants' }

  const expiry = new Date()
  expiry.setHours(expiry.getHours() + KAZA_BOOST_HOURS)
  await db.update(profiles)
    .set({ boostedUntil: expiry, xp: sql`${profiles.xp} - ${KAZA_BOOST_COST_XP}` })
    .where(eq(profiles.id, userId))
  return { error: null }
}

/** Calcule (serveur, anti-triche) et enregistre le résultat du quiz candidat. */
export async function saveQuizResult(
  userId: string,
  answers: number[],
): Promise<{ error: string | null; result?: ReturnType<typeof scoreQuiz> }> {
  const result = scoreQuiz(answers)
  if (!result) return { error: 'Réponses invalides' }
  await db.update(profiles).set({ quizResult: result }).where(eq(profiles.id, userId))
  return { error: null, result }
}

/** Profil public d'un candidat (sans hash), pour la vue recruteur. */
export async function getPublicProfile(id: string): Promise<Profile | null> {
  const [row] = await db.select().from(profiles).where(eq(profiles.id, id)).limit(1)
  if (!row) return null
  const { passwordHash: _ph, ...rest } = row
  return serialize<Profile>(rest)
}
