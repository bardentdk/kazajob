# Migration Supabase → Neon — suivi

## 🔒 Audit complet (FAIT — bugs + sécurité)
- **`next build` prod : OK** (82 pages, 0 erreur/warning).
- **Bug systémique corrigé** : `/api/me` renvoyait du camelCase → `profile.*` undefined partout
  (crash navigation). Fix = `serialize()` + passthrough jsonb (`cv_data`/`avatar_config` non altérés).
- **CV builder** : erreur oklab → migré `html2canvas` → `html2canvas-pro` (support Tailwind v4).
- **Failles d'accès corrigées + retestées (403 OK)** :
  1. `/api/conversations/[id]/messages` (GET/POST) : ajout `isParticipant` (IDOR lecture/écriture msgs).
  2. `/api/companies/[id]` + `/team` : ajout `isCompanyMember` (fuite abonnement/membres/emails).
  3. `/api/profiles/[id]` : réservé rôle recruteur/admin (fuite email/tel + candidatures d'autrui).
  4. `/api/recruiter/{jobs,trainings,events}` POST : gate rôle recruteur (anti-pollution).
  5. `/api/email` welcome : destinataire restreint à l'email de session (anti-spam).
- **Vérifié OK** : proxy (redirections rôle candidat/recruteur/admin + login), pas d'escalade via
  PATCH `/api/profile` (whitelist sans role/xp/company_id/referral_code/boosted_until),
  password_hash jamais exposé, parcours candidat+recruteur+messagerie testés contre Neon.
- **Résiduel mineur (acceptable lancement)** : `/api/email` (autres types) = vecteur de spam limité
  si replay d'ids ; `getJob/getTraining` incrémentent les vues à chaque GET. À durcir post-lancement.

## Stack cible (validée)
- **DB** : Neon PostgreSQL + **Drizzle ORM** (driver `@neondatabase/serverless` HTTP)
- **Auth** : **Auth.js (NextAuth)** — Credentials (email + mot de passe), sessions JWT,
  `profiles` = table utilisateur (colonne `password_hash`)
- **Storage** : **Vercel Blob** (avatars, CV, images formation, logos, pitch vidéo)
- **Realtime** : **Polling** (messagerie + notifications)

## ✅ Phase 1 — Fondation DB (FAIT)
- `DATABASE_URL` dans `.env.local`
- Deps : `drizzle-orm`, `@neondatabase/serverless`, `drizzle-kit`, `dotenv`
- `src/lib/db/schema.ts` (21 tables), `src/lib/db/index.ts`, `drizzle.config.ts`
- **`drizzle-kit push` exécuté → 21 tables créées dans neondb**

## ✅ Phase 2 — Auth.js (FAIT)
- Deps : `next-auth@5.0.0-beta.31`, `bcryptjs`, `@types/bcryptjs` ✓
- `src/lib/auth.ts` : config NextAuth (Credentials bcrypt, JWT, callbacks id/role) + `getCurrentUser()` ✓
- `src/app/api/auth/[...nextauth]/route.ts` (handlers) ✓
- `src/app/api/auth/register/route.ts` (hash bcrypt + insert profiles) ✓
- `src/app/api/me/route.ts` (profil complet, sans password_hash) ✓
- `src/features/auth/useAuth.ts` réécrit sur `useSession` + `/api/me` — **même contrat** (40 consommateurs intacts) ✓
- `src/app/providers.tsx` (`SessionProvider`) + wrap dans `layout.tsx` ✓
- `src/proxy.ts` → `export default auth(...)`, rôle lu depuis le JWT (plus de requête DB en proxy) ✓
- `src/app/auth/login/page.tsx` : Supabase retiré, redirection rôle via `/api/me` ✓
- `src/types/next-auth.d.ts` (augmentation session.user.id/role) ✓
- `AUTH_SECRET` généré dans `.env.local` ✓
- `tsc --noEmit` : OK ✓

**Non fait (volontairement, phase 3)** : register page laissée telle quelle (contrat `signUp` préservé) ;
`src/lib/supabase/*` toujours présents (encore utilisés ailleurs).

## ✅ Phase 3 — Couche données (FAIT)
Tous les `supabase.from(...)` de données migrés vers Drizzle (~53 fichiers).
**Reste 7 fichiers Supabase, tous intentionnels** : storage (phase 4 : `useUpload`,
`candidate/profile`, `company-setup`, `TrainingForm`), `lib/backup/supabase-export` (legacy),
`lib/supabase/{client,server}.ts` (gardés pour rollback — décision user).
Vérif : `grep "supabase\.(from|auth|storage|rpc|channel)"` → plus aucune requête données hors storage/backup.

### Architecture (validée)
`hook client (fetch) → route /api/* (serveur) → src/lib/queries/*.ts (Drizzle)`
- Le navigateur ne touche plus la DB (`DATABASE_URL` secret, pas de RLS).
- Les hooks **gardent leur contrat de retour** → pages & composants UI inchangés.
- `src/lib/queries/_serialize.ts` : mappe camelCase→snake_case + Date→ISO (réutilisable tous lots).
- Relations Drizzle ajoutées **incrémentalement** dans `schema.ts` (par lot).

### Lots
- ✅ **Lot 1 — Jobs** (patron de référence) : `queries/jobs.ts` (`listJobs`/`getJob`),
  `/api/jobs`, `/api/jobs/[id]`, `useJobs.ts` réécrit, relations jobs/jobSkills.
  tsc OK + **smoke-test runtime OK** (`/api/jobs` 200, `/api/jobs/[id]` 404 ⇒ relational query Neon validée).
- ✅ **Lot 2 — Applications + Favorites** : `queries/applications.ts` (list candidat/recruteur,
  `applyToJob`, `updateApplicationStatus` avec check propriété), `queries/favorites.ts`
  (`listFavorites`, `toggleFavorite`), routes `/api/applications(+/[id])`, `/api/favorites`,
  hooks réécrits (emails fire&forget conservés), relations applications/favorites.
  **Écritures sécurisées par la session serveur** (plus d'id client usurpable).
  tsc OK + smoke-test 401 (auth) OK. Chemin authentifié = même patron relationnel (runtime à confirmer après seed).
- ⏳ Lot 3 — Profil / settings / onboarding
- ✅ **Lot 3 — Profil / settings / onboarding** : `queries/profiles.ts`
  (`updateProfile` liste blanche, `getCandidateSkills`, `add/removeCandidateSkill`,
  `addCandidateSkillsByNames`, `listSkills`), routes `/api/profile` (PATCH),
  `/api/skills` (GET), `/api/candidate-skills` (GET/POST/DELETE), relation candidate_skills.
  Pages migrées : `candidate/profile`, `candidate/settings`, `onboarding`, `onboarding/cv-builder`.
  ⚠️ **Storage laissé en Supabase** (video pitch + `useUpload` = phase 4) → `createClient` encore
  importé dans `candidate/profile/page.tsx` (état intermédiaire assumé).
  tsc OK + smoke-test (`/api/skills` 200, routes protégées 401) OK.
- ✅ **Lot 4 — Messages + Notifications** (DB + **polling**, recoupe phase 5) :
  `queries/messages.ts` (listConversations, listMessages, markConversationRead, sendMessage,
  startConversation), `queries/notifications.ts` (list/markRead/markAllRead, alias `read`←`is_read`),
  routes `/api/conversations(+/[id]/messages)`, `/api/notifications(+/[id], /all)`,
  relations conversations(candidate/recruiter/job) + messages(sender).
  Hooks réécrits avec **polling** (5s messages / 10s notifs) — `.channel()` supprimé.
  ⇒ **Phase 5 quasi faite** pour ces 2 domaines. tsc OK + smoke-test 401 OK.
- ✅ **Lot 5 — Recruteur : company / team / candidates** : `queries/companies.ts`
  (search, overview, create, requestToJoin, setSubscription, getTeam, respondJoinRequest,
  removeMember, changeMemberRole — **autorisations owner/admin enforce serveur**),
  `getPublicProfile` ajouté à `queries/profiles.ts`. 8 routes (`/api/companies*`,
  `/api/company-requests/[id]`, `/api/company-members/[id]`, `/api/profiles/[id]`),
  relations companyMembers/companyJoinRequests→profile.
  Pages migrées : `recruiter/layout`, `recruiter/company`, `company/team`, `company-setup`, `candidates/[id]`.
  ⚠️ upload **logo** laissé en Supabase storage (phase 4) dans `company-setup`. tsc OK + smoke-test 401 OK.
- ✅ **Lot 6 — Admin (10 pages)** : `queries/admin.ts` (users/role, companies/verified,
  jobs/active+delete, skills usage+CRUD, subscriptions list+update, broadcast notifs,
  countUsers, dashboard stats, analytics 8 semaines, ai-stats, events list+publish+delete),
  garde `src/lib/admin-guard.ts` (`requireAdmin` via JWT role), relations
  companySubscriptions→company + events→organizer. ~18 routes `/api/admin/*`.
  Pages migrées : dashboard, users, companies, jobs, skills, subscriptions, notifications,
  events, ai, analytics. tsc OK + smoke-test **403** (garde admin) OK. Pas de régression (/api/jobs, /api/skills 200).
- ⏳ **Lot 7 — long tail (~28 fichiers)**, à re-découper en sous-lots :
  - ✅ **7a Routes serveur API** : `queries/interviews.ts` (+ relation interviews), `queries/kaza-score.ts`,
    `getJobAIContext` (jobs). Migrés vers `auth()` + Drizzle : `api/interviews` (GET/POST/PATCH),
    `api/email` (8 types, relations interviews/applications/conversations/join_requests),
    `api/kaza-ia/*` (×3, réutilise getCurrentUser/getCandidateSkills/getJobAIContext),
    `api/cron/job-alerts` (Drizzle), `api/admin/backup` (check admin → `requireAdmin`,
    **export Supabase laissé volontairement** = legacy/rollback). + `useGamification` migré.
    tsc OK + smoke-test (401/403/cron-401) OK.
  - ✅ **7b Pages recruteur** : `queries/jobs.ts` étendu (listRecruiterJobs, getRecruiterJob,
    createJob, updateJob, deleteRecruiterJob + relation publisher), `queries/events.ts`
    (organisateur + candidat), routes `/api/recruiter/jobs(+/[id])`, `/api/recruiter/events(+/[id])`.
    Pages : recruiter/jobs, jobs/[id]/edit, JobForm, applications (réutilise /api/applications?scope=recruiter),
    dashboard (réutilise recruiter/jobs + applications + conversations), events. tsc OK + 401 OK.
  - ✅ **7c Pages candidat** : `queries/events.ts`, `queries/referrals.ts`, `queries/trainings.ts`,
    `withdrawApplication` (applications). Routes `/api/events(+/[id]/register)`, `/api/referral`,
    `/api/trainings(+/[id], /[id]/apply)`, `/api/recruiter/trainings(+/[id])`,
    `/api/applications/[id]/withdraw`. Relation trainingOffers→company/info_session.
    Pages : candidate/applications (withdraw), referral, events, training (browse + détail),
    recruiter/training, TrainingForm (storage image gardé en Supabase). dashboard = déjà propre
    (les "2" du grep = `Array.from`). tsc OK + smoke-test 200/404/401 OK.
  - ✅ **7d Divers** : `queries/landing.ts` (getLandingData + getSitemapJobs, appelés direct
    dans les server components), `queries/kaza-score.ts` (réplique fidèle du RPC `compute_kaza_score`
    — formule réactivité 50%/rapidité 30%/progression 20%, source `supabase/video-pitch-kazascore.sql`),
    `boostProfile` (profiles). Routes `/api/kaza-score/[recruiterId]` (public), `/api/profile/boost`.
    Migrés : `app/page.tsx` (landing), `sitemap.ts`, `KazaScoreBadge`, `KazaBoostButton`.
    `TestimonialsSection` = faux positif (`Array.from`). tsc OK + smoke-test (landing 200, sitemap 200,
    kaza-score 200, boost 401) OK.
- ⏳ Fin — **NE PAS supprimer `src/lib/supabase/*`** (décision user : rollback Supabase possible).
  Juste retirer les usages restants ; garder les fichiers + deps `@supabase/*`.

## ⏳ Phase 4 — Storage (Vercel Blob) (À FAIRE)
- Deps : `@vercel/blob`
- Remplacer `supabase.storage.from(...).upload/getPublicUrl/createSignedUrl`
- Hooks : `useAvatarUpload`, `useCvUpload`, upload images formation, logos, pitch
- Route `/api/upload` (put Blob) + variable `BLOB_READ_WRITE_TOKEN`

## ⏳ Phase 5 — Realtime → Polling (À FAIRE)
- Messagerie : remplacer `.channel(...).on('postgres_changes')` par un polling (ex: refetch toutes les 5 s)
- Notifications : idem

## ⏳ Phase 6 — Seed + nettoyage (À FAIRE)
- Seed `subscription_plans` (depuis `SUBSCRIPTION_PLANS`) et `skills`
- Créer le compte admin
- Retirer deps Supabase, nettoyer `.env`
- Build + tests

## ⚠️ Important
Pendant les phases 2-3, l'app est **en état intermédiaire** (du code Supabase
coexiste avec Neon) → ne pas déployer avant la fin de la phase 3.
Idéalement : **une session de travail par phase** (contexte frais = meilleure
qualité + moins de tokens gaspillés).
