# Kazajob — Documentation des fonctionnalités par rôle

> Plateforme d'emploi nouvelle génération pour La Réunion 974  
> Version actuelle · Mai 2026

---

## Sommaire

- [Non identifié (visiteur public)](#-non-identifié--visiteur-public)
- [Candidat](#-candidat)
- [Recruteur](#-recruteur)
- [Administrateur (CEO)](#-administrateur--ceo)
- [Tableau comparatif](#tableau-comparatif)
- [Architecture technique](#architecture-technique)

---

## 👤 Non identifié · Visiteur public

Accès sans compte. Découverte de la plateforme et des offres disponibles.

### Landing page
- **Vue Candidat** — Page d'accueil orientée recherche d'emploi : hero "Ton kaz ton job ton pei", barre de recherche, offres vedettes, section "Comment ça marche", témoignages, FAQ, roadmap
- **Vue Entreprise** — Switch B2B via toggle "Je cherche un emploi / Je recrute" : hero recruteur, section multi-diffusion partenaires, pricing B2B avec les 4 forfaits, CTA essai gratuit
- **Toggle candidat / recruteur** — Bascule instantanée entre les deux vues sans rechargement

### Offres d'emploi (public)
- Consultation libre de toutes les offres actives sur `/candidate/jobs`
- Recherche par mot-clé et ville
- Fiche offre complète : description, compétences, salaire, localisation, type de contrat
- **Salaire Transparent 974** — Badge marché (Sous le SMIC / Sous le marché / Dans la norme / Bien payé) basé sur les données INSEE 2023
- **KazaScore recruteur** — Indicateur de réactivité du recruteur visible sur chaque offre

### Inscription
- Choix du rôle : Candidat ou Recruteur
- Formulaire : nom, email, mot de passe
- Candidat → onboarding guidé 6 étapes
- Recruteur → configuration obligatoire de l'entreprise

---

## 🎯 Candidat

Accès après inscription et onboarding. Interface gamifiée avec mode quête activable.

### Onboarding (6 étapes à l'inscription)
1. **Domaine de compétence** — Sélection multi-catégories (BTP, Tech, Tourisme, Santé…)
2. **Création d'avatar** — Personnalisation complète : teint (7 tons), coiffure (12 styles dont locs/afro/hijab/turban), couleur cheveux, yeux, bouche, tenue, accessoires — sans photo, sans discrimination
3. **Informations personnelles** — Nom, localisation, téléphone
4. **Compétences suggérées** — Pré-remplissage IA basé sur les domaines choisis
5. **Finalisation profil** — Bio personnalisée
6. **Welcome Mode Quête** — Présentation du système de niveaux et des premières missions

### Profil candidat
- **Avatar personnalisé** — Personnage cartoon généré via DiceBear Avataaars (aucune photo réelle)
- **Photo de profil** — Upload optionnel en remplacement de l'avatar
- **CV Builder visuel** — Création de CV avec sélection de template, couleurs personnalisées, téléchargement PDF (sans boîte d'impression)
- **CV Upload** — Import de CV PDF/Word
- **Pitch Vidéo** — Enregistrement 60s max via MediaRecorder, stocké sur Supabase Storage
- **Compétences** — Ajout depuis le catalogue global
- **Bio** — Présentation libre
- **KazaBoost** — Mise en avant du profil pendant 48h en échange de 100 XP

### Recherche d'emploi
- Filtres : localisation, secteur, type de contrat, remote
- **Matching Score IA** — Score de compatibilité candidat/offre avec détail des critères (compétences, localisation, contrat, disponibilité)
- **Salaire Transparent 974** — Benchmark salarial sur chaque fiche offre
- **KazaScore recruteur** — Badge réactivité visible avant de postuler
- Favoris — Sauvegarde des offres intéressantes

### Candidatures
- Postuler avec ou sans lettre de motivation
- Génération de lettre de motivation par **KazaIA** (Groq LLaMA 3.3)
- **Préparation entretien IA** — Questions personnalisées générées pour chaque poste
- Suivi des candidatures (En attente / CV consulté / Entretien / Offre / Embauché / Refusé / Retiré)
- Retrait de candidature
- Notifications push temps réel (Supabase Realtime)
- Emails automatiques à chaque changement de statut

### Messagerie
- Conversations 1:1 avec les recruteurs
- Notifications email lors de nouveaux messages

### Agenda & Entretiens
- Calendrier des entretiens planifiés
- Détail : date, heure, durée, type (visio / téléphone / présentiel)
- Lien Jitsi Meet auto-généré pour les visioconférences
- Emails de confirmation et rappel J-1

### KazaIA — Assistant intelligent
- **Chat flottant** — Bouton violet bas-droite accessible depuis toute l'interface candidat
- Conseils CV, coaching candidature, analyse d'offre, préparation entretien
- Suggestions rapides : "Comment améliorer mon CV à La Réunion ?", conseils marché local
- Historique de conversation, effacement, arrêt du stream

### Alertes emploi
- Activation/désactivation dans les paramètres
- Fréquence : Temps réel / Résumé quotidien / Résumé hebdomadaire
- Email digest des nouvelles offres (cron Vercel chaque matin 08h00 heure Réunion)

### KazaEvents — Job Dating numérique
- Liste des événements à venir (Job Dating, Webinar, Atelier)
- Inscription/désinscription en 1 clic
- Lien Jitsi visible le jour J pour les événements en ligne
- Badge "En direct" sur les événements en cours

### Parrainage communautaire
- Code de parrainage unique par candidat
- Lien de parrainage à partager (copie rapide, WhatsApp)
- Récompense : +200 XP pour le parrain ET le filleul à l'inscription
- Tableau de bord : nombre de filleuls, XP gagnés

### Mode Gamification (switchable)
- **Activation/désactivation** depuis la sidebar ou les paramètres — persisté en base de données
- **Système de niveaux** : Débutant → Candidat → Explorateur → Chasseur → Expert 974
- **Barre XP** animée (0 → 10 000+ XP)
- **9 quêtes** calculées automatiquement sur les données existantes :
  - Héros du profil (profil > 80% complet) — +50 XP
  - CV Power (CV uploadé ou builder créé) — +50 XP
  - Skill Hunter (≥ 3 compétences) — +40 XP
  - Star du Pitch (pitch vidéo enregistré) — +100 XP
  - Premier pas (1ère candidature) — +30 XP
  - Candidat sérieux (≥ 3 candidatures) — +75 XP
  - Chasseur d'offres (1 favori) — +20 XP
  - Série de feu (streak ≥ 3 jours) — +30 XP
  - KazaBoost activé — +25 XP
- **HUD sidebar** : niveau, barre XP, streak 🔥 en permanence
- **Dashboard game** : quêtes actives, accomplies, stats HUD, offres "missions"

### Paramètres
- Alertes email (on/off + fréquence)
- Mode Gamification (on/off)
- Confidentialité RGPD

---

## 🏢 Recruteur

Accès après inscription et configuration obligatoire de l'entreprise.

### Configuration entreprise (obligatoire à l'inscription)
- Recherche d'entreprise existante → demande de rejoindre l'équipe
- Création d'une nouvelle entreprise (si non existante) :
  - Logo, Nom commercial, Raison sociale
  - SIRET, Téléphone, Site web
  - Secteur, Taille, Ville, Adresse
  - Description
- **Choix du forfait** : Starter / Pro / Business / Entreprise
- Essai gratuit 14 jours sur tous les plans (sans CB)

### Gestion des offres
- Création d'offre : titre, description, compétences, salaire, localisation, type de contrat
- **Toggle Publication anonyme** — Cache le nom de l'entreprise aux candidats
- Activation / désactivation des offres
- Modification et suppression
- Badge auteur (qui dans l'équipe a publié)
- Analytics par offre : vues + nombre de candidatures
- **Multi-diffusion automatique** selon le forfait :
  - Starter → Kazajob uniquement
  - Pro → + France Travail
  - Business → + France Travail, Mission Locale, APEC
  - Entreprise → + Indeed, flux XML/RSS, accès API entrant/sortant

### Pipeline de recrutement
- Vue Kanban des candidatures : En attente / Tri / Entretien / Embauché
- Mise à jour du statut en 1 clic
- Email automatique au candidat à chaque changement de statut
- Notes recruteur sur chaque candidature

### Fiche candidat
- Profil complet : avatar, localisation, bio, compétences
- **Pitch vidéo** — Lecture directe du pitch 60s du candidat
- CV téléchargeable (PDF uploadé ou CV Builder)
- Historique des candidatures
- XP, streak, niveau gamification du candidat

### Agenda & Entretiens
- Planification d'entretiens (visio / téléphone / présentiel)
- Génération automatique de lien Jitsi Meet
- Emails envoyés automatiquement au candidat et au recruteur
- Rappel J-1 automatique
- Calendrier de tous les entretiens à venir

### Messagerie
- Conversations avec les candidats ayant postulé
- Notifications email des nouveaux messages

### Mon Entreprise
- Profil public de l'entreprise (visible par les candidats)
- Statut d'abonnement et dates d'expiration
- Compteur de sièges utilisés
- Partenaires de diffusion actifs

### Gestion d'équipe
- Voir les membres de l'organisation (rôles : Owner / Admin / Member)
- Accepter ou refuser les demandes d'adhésion
- Promouvoir un membre en admin ou le rétrograder
- Retirer un membre
- Inviter via un lien de parrainage équipe

### KazaEvents — Organisateur
- Création d'événements : Job Dating, Webinar, Atelier
- Paramétrage : titre, date/heure, durée, places max, description
- Salle Jitsi Meet auto-générée
- Suivi des inscrits en temps réel

### KazaScore Recruteur
- Indice de réactivité calculé sur 90 jours (score 0–100)
- Pondération : 50% taux de réponse + 30% rapidité + 20% taux d'entretien
- Labels : Très réactif / Réactif / Peu réactif / Inactif
- Visible par les candidats sur chaque offre publiée
- Objectif : inciter à répondre rapidement aux candidatures

### Tableau de bord
- KPIs : vues totales, candidatures reçues, offres actives, taux de conversion
- Pipeline de recrutement visuel (4 étapes)
- Candidatures récentes
- Messages non lus
- Offres actives avec compteurs
- KazaScore de l'agence

---

## 🛡️ Administrateur · CEO

Accès complet à toutes les données et fonctions de gestion de la plateforme.

### Dashboard CEO
- **7 KPIs en temps réel** : Utilisateurs, Offres, Entreprises, Candidatures, KazaEvents, Compétences, Parrainages
- Distribution des rôles (candidats / recruteurs / admins) avec barres de progression
- Offres récentes
- **8 accès rapides** vers toutes les sections admin

### Analytics & Rapports
- Graphiques CSS 8 semaines : nouveaux utilisateurs, nouvelles offres, candidatures
- Top villes (offres publiées)
- Top secteurs (offres publiées)
- **Export CSV** de toutes les données analytiques

### Gestion des utilisateurs
- Liste paginée : candidats, recruteurs, admins
- Filtres par rôle, date, statut
- Suspension / réactivation de compte
- Changement de rôle

### Modération des offres
- Toutes les offres publiées (actives, expirées, signalées)
- Dépublication / suppression d'une offre
- Vue des offres les plus populaires

### Entreprises & Vérification
- Liste de toutes les entreprises
- Attribution du badge **✅ Entreprise vérifiée**
- Vue des membres liés à chaque entreprise

### KazaEvents — Administration
- Vue globale de TOUS les événements de TOUS les recruteurs
- Publier / masquer un événement
- Suppression avec annulation automatique des inscriptions
- Lien Jitsi direct pour chaque événement

### Notifications de masse
- Envoi de notifications push ciblées :
  - Tous les utilisateurs
  - Candidats uniquement
  - Recruteurs uniquement
- Compteur de destinataires en temps réel avant envoi
- Historique des notifications envoyées (session)

### Référentiel des compétences
- CRUD complet du catalogue global des compétences
- Ajout de nouvelles compétences avec catégorie
- Suppression (avec confirmation : impact sur les profils)
- Compteur d'utilisation par compétence
- Graphique top catégories
- Top 5 compétences les plus demandées

### Abonnements & Revenus
- Vue de tous les abonnements entreprises
- **MRR estimé** en temps réel
- Compteurs : essais actifs, abonnés actifs, résiliés
- Changement de forfait par entreprise (Starter → Pro → Business → Entreprise)
- Changement de statut (Essai → Actif → Résilié → Expiré)

### KazaIA — Statistiques
- Estimation des requêtes IA : lettres de motivation, préparations entretien, chats
- Coût Groq estimé du mois (basé sur les tarifs llama-3.3-70b-versatile)
- Détail par fonctionnalité avec coût unitaire
- Liens directs : Console Groq, Supabase Studio, Resend

### Sauvegarde Supabase → Google Drive
- **Export JSON** de toutes les tables (17 tables) via service role key
- **Upload Google Drive** automatique avec nommage daté
- **Cron automatique** : chaque dimanche à 02h00 UTC (06h00 heure Réunion)
- **Déclenchement manuel** depuis le panel admin
- Historique des sauvegardes avec liens Drive
- Variables requises : `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`, `GOOGLE_DRIVE_FOLDER_ID`

---

## Tableau comparatif

| Fonctionnalité | Public | Candidat | Recruteur | Admin |
|----------------|:------:|:--------:|:---------:|:-----:|
| Voir les offres | ✅ | ✅ | ✅ | ✅ |
| Salaire Transparent 974 | ✅ | ✅ | ✅ | ✅ |
| KazaScore recruteur | ✅ | ✅ | — | ✅ |
| Postuler | ❌ | ✅ | ❌ | ❌ |
| KazaIA (lettre, entretien, chat) | ❌ | ✅ | ❌ | ❌ |
| Avatar personnalisé | ❌ | ✅ | ❌ | ❌ |
| Mode Gamification | ❌ | ✅ | ❌ | ❌ |
| CV Builder | ❌ | ✅ | ❌ | ❌ |
| Pitch Vidéo | ❌ | ✅ | ❌ | ❌ |
| KazaBoost | ❌ | ✅ | ❌ | ❌ |
| Parrainage | ❌ | ✅ | ❌ | ❌ |
| Alertes emploi | ❌ | ✅ | ❌ | ❌ |
| Publier des offres | ❌ | ❌ | ✅ | ❌ |
| Pipeline candidatures | ❌ | ❌ | ✅ | ✅ |
| Planifier des entretiens | ❌ | ❌ | ✅ | ❌ |
| Gestion d'équipe | ❌ | ❌ | ✅ | ✅ |
| Multi-diffusion partenaires | ❌ | ❌ | ✅ | ❌ |
| KazaEvents | ❌ | Inscription | Création | ✅ tout |
| Messagerie | ❌ | ✅ | ✅ | ❌ |
| Modération | ❌ | ❌ | ❌ | ✅ |
| Analytics plateforme | ❌ | ❌ | ❌ | ✅ |
| Notifications de masse | ❌ | ❌ | ❌ | ✅ |
| Gestion abonnements | ❌ | ❌ | ❌ | ✅ |
| Sauvegarde Drive | ❌ | ❌ | ❌ | ✅ |

---

## Architecture technique

| Composant | Technologie |
|-----------|-------------|
| Framework | Next.js 16.2.6 (App Router, Turbopack) |
| Base de données | Supabase (PostgreSQL) |
| Authentification | Supabase Auth |
| Storage | Supabase Storage (avatars, CV, pitchs vidéo) |
| IA | Groq API (LLaMA 3.3-70b-versatile) — prêt Claude |
| Emails | Resend (transactionnel + alertes) |
| Avatars | DiceBear Avataaars (génération SVG locale) |
| Visioconférence | Jitsi Meet (auto-généré) |
| PDF | html2canvas + jsPDF |
| Vidéo | MediaRecorder API (WebM) |
| Déploiement | Vercel (Cron jobs intégrés) |
| Design System | Tailwind CSS v4 + DA Kazajob |

### Forfaits recruteurs

| Forfait | Prix/mois | Sièges | Offres | Diffusion |
|---------|-----------|--------|--------|-----------|
| Starter | 29 € | 1 | 3 | Kazajob |
| Pro ⭐ | 89 € | 3 | 10 | + France Travail |
| Business | 179 € | 10 | ∞ | + Mission Locale, APEC |
| Entreprise | 349 € | 50 | ∞ | + Indeed, Flux XML, API |

> Essai gratuit 14 jours sur tous les plans · Sans carte bancaire · RGPD conforme · Données hébergées en France

---

*Documentation générée le 30 mai 2026 · Kazajob SAS · Saint-Denis, La Réunion 974 · kazajob.re*
