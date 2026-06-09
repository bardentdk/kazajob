# Sauvegardes Kazajob — guide simple

Deux choses à sauvegarder : **(1) la base de données** et **(2) le code du site**.

---

## 1. Le code du site → Git (déjà fait, à entretenir)

Le code est dans Git. Une sauvegarde = un `push` sur un dépôt distant (GitHub).

```bash
git add -A
git commit -m "Sauvegarde du jour"
git push
```

- Tant que c'est poussé sur GitHub, le site est sauvegardé et restaurable
  par `git clone`.
- Les fichiers de `/public/assets/img/...` (logos, déco) sont aussi versionnés.
- ⚠️ Le fichier `.env.local` n'est **pas** dans Git (et c'est normal :
  il contient des secrets). Gardez-en une copie sûre de votre côté
  (gestionnaire de mots de passe).

---

## 2. La base de données

### Option A — Vous restez sur Supabase
- **Le plus simple** : plan **Supabase Pro (~25 $/mois)** → plus de mise en
  pause pour inactivité + sauvegardes quotidiennes automatiques incluses
  (PITR = restauration à un instant T).
- Sauvegarde manuelle / automatisée : la fonction `/api/admin/backup` du
  projet exporte déjà la base en JSON vers Google Drive (cron hebdo dans
  `vercel.json`). Il faut configurer `SUPABASE_SERVICE_ROLE_KEY`,
  `CRON_SECRET` et les variables Google Drive.

### Option B — Vous passez sur Neon (votre piste)
Neon ne met pas la base en pause comme le free Supabase, et propose en natif :
- **Branching + PITR** (restauration à un instant T) selon le plan,
- une connexion **PostgreSQL standard** → vous pouvez faire un `pg_dump`.

Sauvegarde manuelle d'une base Neon (ou Supabase) avec `pg_dump` :

```bash
# Récupérez la "connection string" dans le dashboard Neon
pg_dump "postgresql://user:pass@host/dbname?sslmode=require" \
  -Fc -f kazajob-2026-06-09.dump
```

Restauration :

```bash
pg_restore -d "postgresql://user:pass@host/dbname?sslmode=require" \
  --clean --if-exists kazajob-2026-06-09.dump
```

> 💡 Automatisation : un cron (GitHub Actions, ou un petit serveur) qui lance
> `pg_dump` chaque nuit et dépose le `.dump` sur un stockage (Drive, S3, etc.).

---

## ⚠️ Important si vous migrez Supabase → Neon

Neon = **PostgreSQL pur**. Il ne fournit **pas** :
- l'**Auth** (comptes, login) — actuellement Supabase Auth,
- le **Storage** (avatars, logos, images de formation, CV, pitch vidéo),
- le **Realtime** et les **RLS** telles que Supabase les gère,
- les buckets et règles de stockage.

Le code du projet dépend de `@supabase/*` pour l'auth, le storage et le
realtime. Migrer **seulement la base** vers Neon casserait login, upload
d'images et messagerie temps réel.

**Recommandation :** pour seulement éviter la mise en pause, le plus rentable
est **Supabase Pro**. Passer à Neon n'a de sens que si vous acceptez de
remplacer aussi l'auth (ex: Clerk/Auth.js) et le storage (ex: S3/R2) — c'est
un chantier à part entière.
