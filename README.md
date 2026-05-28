# Kazajob — Le travail pei, nouvelle generation

Plateforme d'emploi SaaS pour La Reunion (974). Matching IA, messagerie temps reel, gamification.

## Demarrage rapide

### 1. Installer les dependances

```bash
npm install
```

### 2. Configurer les variables d'environnement

```bash
cp .env.example .env.local
```

Remplir `.env.local` avec tes cles Supabase.

### 3. Configurer Supabase

1. Creer un projet sur [supabase.com](https://supabase.com)
2. Aller dans **SQL Editor**
3. Executer dans cet ordre :
   - `supabase/schema.sql` — tables + triggers
   - `supabase/policies.sql` — RLS
   - `supabase/seed.sql` — donnees de demo (optionnel)
4. Activer Realtime : **Database > Replication > Source tables** → cocher `messages` et `conversations`

### 4. Lancer le serveur de dev

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000)

---

## Scripts

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur de developpement |
| `npm run build` | Build de production |
| `npm run start` | Serveur de production |
| `npm run typecheck` | Verification TypeScript |
| `npm run lint` | ESLint |

---

## Architecture

```
src/
  app/                    # Next.js App Router
    page.tsx              # Landing page
    auth/login/           # Connexion
    auth/register/        # Inscription
    candidate/            # Espace candidat (layout protege)
      dashboard/          # Tableau de bord
      jobs/               # Recherche offres
      jobs/[id]/          # Detail offre + candidature
      applications/       # Suivi candidatures
      favorites/          # Offres sauvegardees
      messages/           # Chat temps reel
      profile/            # Profil + CV
    recruiter/            # Espace recruteur
      dashboard/          # KPIs + pipeline
      jobs/               # Gestion offres
      jobs/new/           # Creer une offre
      jobs/[id]/edit/     # Modifier une offre
      applications/       # Candidatures recues
      candidates/[id]/    # Profil candidat
      messages/           # Messagerie
    admin/                # Super admin
      dashboard/          # Stats globales
      users/              # Gestion comptes
      jobs/               # Moderation offres
      companies/          # Validation entreprises

  components/
    ui/                   # Button, Badge, Tag, Input, Modal...
    layout/               # TopBar, Sidebar, Footer, Logo
    cards/                # JobCard, ApplicationCard
    forms/                # JobForm
    feedback/             # EmptyState, LoadingSpinner
    illustrations/        # HeroIllustration, Tropical SVGs

  features/               # Hooks Supabase
    auth/useAuth.ts
    jobs/useJobs.ts
    applications/useApplications.ts
    favorites/useFavorites.ts
    messages/useMessages.ts

  lib/
    supabase/client.ts    # Browser client
    supabase/server.ts    # Server client
    types.ts              # Types TypeScript
    utils.ts              # Helpers
    constants.ts          # Couleurs, listes

supabase/
  schema.sql              # Tables + triggers
  seed.sql                # Donnees demo
  policies.sql            # RLS
```

---

## Stack technique

- **Next.js 16** App Router + Turbopack
- **TypeScript** strict
- **Tailwind CSS v4** (config CSS-only)
- **Supabase** — Auth + Realtime + Storage + RLS
- **Lucide React** — icones (jamais d'emojis)
- **Sora** — police Google Fonts (weights 300-800)
- **Zod** + **React Hook Form** — validation formulaires
- **clsx + tailwind-merge** — gestion classes CSS

---

## Design System — Kazajob

### Palette
| Token | Valeur | Usage |
|-------|--------|-------|
| Orange | `#FF6B35` | CTA principal, accents |
| Violet | `#6D3BEB` | Match IA, recruteur |
| Green | `#19A974` | Succes, remote |
| Yellow | `#FFC93C` | Gamification, alerts |
| Blue | `#1B4FB8` | Info |
| Ink | `#1A1410` | Texte, bordures |
| Cream | `#FFF7EE` | Fond principal |
| Paper | `#FFFFFF` | Cards |

### Style cartoon premium
- Bordures : `1.5px solid #1A1410`
- Ombres : `4px 4px 0 #1A1410` (cartoon)
- Radius : 8-10px
- Font : Sora 800 pour titres

---

## Roles utilisateurs

| Role | Acces |
|------|-------|
| `candidate` | Dashboard, offres, candidatures, favoris, messages, profil |
| `recruiter` | Dashboard, gestion offres, candidatures recues, messages |
| `admin` | Tout + moderation globale |

---

## Deploiement

### Vercel (recommande)

```bash
vercel deploy
```

Variables a configurer dans Vercel :
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

---

## Fait avec passion dans le 974
