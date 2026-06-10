# Audit QA Produit, UX/UI et Fonctionnel

## Kazajob

- Date de l'audit : 10 juin 2026
- URL auditée : `https://kazajob.re`
- Mode d'intervention : audit en lecture seule, sans modification du code ni des données
- Périmètre principal : production publique
- Périmètre secondaire : revue locale en lecture seule pour expliquer certains comportements observés en production

---

## 1. Résumé exécutif

Kazajob présente une identité de marque forte, une direction visuelle assumée et une ambition produit claire pour un jobboard local orienté La Réunion et Mayotte. La proposition de valeur candidat et recruteur est bien pensée sur le plan marketing, avec un discours différenciant, des promesses modernes et une expérience visuelle plus premium que la moyenne.

En revanche, l'audit met en évidence un écart important entre la promesse produit affichée et l'état réellement exploitable de la production publique. Les principales zones publiques testées pour les candidats, notamment les offres et les formations, semblent actuellement vides ou reposent sur un rendu très dépendant du JavaScript, avec des états de chargement visibles au premier rendu. Plusieurs fonctionnalités exposées publiquement paraissent disponibles alors qu'elles sont incomplètes, non branchées ou seulement partiellement implémentées.

Le site donne donc une bonne impression de marque et de conception, mais une impression plus fragile côté exécution produit réelle. Le point critique n'est pas tant la qualité esthétique que la confiance utilisateur : plusieurs parcours donnent l'impression de fonctionner sans apporter de résultat concret.

---

## 2. Méthodologie

L'audit a été mené selon quatre angles complémentaires :

1. Parcours public candidat sur la production
2. Parcours public et pré-onboarding recruteur sur la production
3. Vérification des réponses HTTP, redirections, routes publiques, endpoints et signaux techniques visibles
4. Lecture locale du projet, uniquement pour comprendre les comportements constatés en production

Contraintes respectées :

- aucune modification du code ;
- aucune création de données applicatives en production ;
- aucun contournement de sécurité ;
- aucun test intrusif sur les espaces protégés ;
- aucun commit, migration ou installation.

Limites de l'audit :

- pas de test end-to-end authentifié avec compte candidat, recruteur ou admin réel ;
- pas de validation complète des flux post-connexion ;
- pas d'audit sécurité back-end exhaustif ;
- pas d'audit de charge.

---

## 3. Ce qui fonctionne bien

### 3.1 Positionnement produit

- Le positionnement local La Réunion est clair, différenciant et cohérent.
- Le discours de marque est mémorable et moins générique qu'un jobboard classique.
- La segmentation candidat / recruteur est immédiatement compréhensible.
- La proposition de valeur recruteur est particulièrement lisible : diffusion, IA, analytics, équipe, abonnement.

### 3.2 Design et identité visuelle

- L'identité graphique est forte, originale et globalement professionnelle.
- Les couleurs, illustrations, badges, cartes et CTA ont une vraie personnalité.
- La hiérarchie visuelle est bonne sur la home.
- Les composants marketing ont un bon niveau de finition visuelle.
- L'univers visuel local fonctionne bien et évite l'effet "template générique".

### 3.3 Structure générale du produit

- Les grandes zones du produit sont bien pensées :
  - candidat ;
  - recruteur ;
  - admin ;
  - offres ;
  - formations ;
  - événements ;
  - IA ;
  - messagerie ;
  - gamification.
- Les redirections de base vers les zones protégées semblent correctement cadrées côté middleware/proxy.
- Le site dispose d'un effort SEO réel :
  - title ;
  - meta description ;
  - Open Graph ;
  - robots ;
  - sitemap ;
  - JSON-LD.

### 3.4 Performance perçue de surface

- Les pages publiques répondent relativement vite au niveau HTTP.
- Les temps de réponse observés sur les routes principales sont corrects.
- La home se charge visiblement, même si son poids HTML reste conséquent.

---

## 4. Ce qui fonctionne moins bien

### 4.1 Décalage entre marketing et réalité produit visible

Le point faible principal de Kazajob aujourd'hui n'est pas le design mais l'écart entre ce qui est annoncé et ce qui est réellement testable.

Exemples :

- la home et les metadata annoncent `12 400+ offres locales` ;
- la production publique renvoie actuellement un catalogue d'offres vide ;
- la vue entreprise affiche des volumes valorisants même quand le site public ne reflète pas ce niveau d'activité ;
- plusieurs CTA mènent vers des fonctions incomplètes ou non finalisées.

Cela fragilise la crédibilité de la plateforme.

### 4.2 Dépendance forte au rendu client

Les pages publiques `Offres` et `Formations` affichent d'abord un loader `Chargement…` dans le HTML récupéré. Cela suggère une dépendance importante au JavaScript client pour rendre le contenu utile.

Conséquences possibles :

- expérience fragile si l'hydratation échoue ;
- SEO moins robuste qu'attendu ;
- perception de lenteur ou de vide ;
- difficulté à garantir un bon rendu sur connexions faibles ou navigateurs plus contraints.

### 4.3 Fonctionnalités exposées mais non finies

Plusieurs éléments publics donnent l'impression d'être actifs alors qu'ils sont absents, non branchés ou incomplets :

- `Mot de passe oublié ?`
- boutons `Google`
- boutons `LinkedIn`
- liens footer `A propos`, `Blog`, `Contact`
- liens footer `CGU`, `Confidentialite`, `Cookies`

Ces éléments créent de la frustration et une impression de produit partiellement maquetté.

---

## 5. Bugs, anomalies et incohérences détectés

## 5.1 Catalogue d'offres vide en production

Constat :

- l'endpoint public `GET /api/jobs?limit=3` retourne `{"data":[],"count":0}` ;
- l'endpoint filtré testé retourne également `0` résultat ;
- la page publique offres n'a donc aucun contenu utile réel à afficher.

Impact :

- blocage total du coeur d'usage candidat ;
- fort risque business ;
- contradiction avec la promesse marketing.

Criticité : **P0**

## 5.2 Catalogue formations vide en production

Constat :

- `GET /api/trainings` retourne `[]`.

Impact :

- la section formations existe dans le produit mais ne propose actuellement rien ;
- cela donne un sentiment d'inachèvement.

Criticité : **P1**

## 5.3 Recherche home non raccordée au listing

Constat :

- la barre de recherche de la home pousse bien vers `/candidate/jobs?q=...` ;
- mais la page offres testée démarre avec un état local sans lecture des query params ;
- le mot-clé passé dans l'URL ne semble donc pas initialiser réellement les filtres.

Impact :

- illusion de recherche fonctionnelle ;
- perte de confiance immédiate ;
- frustration forte dès l'entrée dans le produit.

Criticité : **P0**

## 5.4 Loader public à la place du contenu utile

Constat :

- les pages `candidate/jobs` et `candidate/training` exposent un loader `Chargement…` au premier rendu HTML récupéré ;
- le contenu utile dépend du fetch client.

Impact :

- dégradation UX ;
- fragilité SEO ;
- risque de page perçue comme vide ou cassée si le JS tarde.

Criticité : **P1**

## 5.5 Fiche offre invalide pouvant répondre en 200 avec état d'erreur masqué

Constat :

- une URL de fiche offre testée en production répond en `200` mais avec un contenu qui révèle un état d'erreur React / notFound derrière un loader.

Impact :

- mauvaise gestion des URL invalides ;
- comportement ambigu pour l'utilisateur ;
- risque SEO et suivi analytics biaisé.

Criticité : **P1**

## 5.6 Faux liens dans le footer

Constat :

- `A propos`, `Blog`, `Contact`, `CGU`, `Confidentialite`, `Cookies` pointent vers `#`.

Impact :

- mauvaise image de sérieux ;
- déficit de confiance ;
- problème potentiellement juridique sur les pages légales absentes ou non reliées.

Criticité : **P1**

## 5.7 Mot de passe oublié non implémenté

Constat :

- le lien `Mot de passe oublie ?` pointe vers `#`.

Impact :

- irritant UX important ;
- blocage pour un utilisateur réel ;
- impression de produit inachevé.

Criticité : **P1**

## 5.8 Social login visible mais non fonctionnel

Constat :

- les boutons `Google` et `LinkedIn` sont visibles sur la connexion ;
- aucun comportement concret n'est relié publiquement à ces boutons dans le périmètre observé.

Impact :

- faux espoir ;
- baisse de confiance ;
- dette UX immédiate.

Criticité : **P1**

## 5.9 Incohérence de données marketing sur la vue entreprise

Constat :

- la vue entreprise affiche des chiffres de fallback comme `12+`, `50+`, `48h` ;
- la home candidat peut afficher d'autres volumes ;
- la réalité publique des offres visibles est actuellement nulle.

Impact :

- perception trompeuse ;
- crédibilité commerciale affaiblie ;
- risque de déception pour les recruteurs.

Criticité : **P1**

## 5.10 Incohérence sitemap / robots

Constat :

- `sitemap.xml` expose `/auth/login` et `/auth/register` ;
- `robots.txt` disallow `/auth/`.

Impact :

- stratégie SEO incohérente ;
- signaux contradictoires aux robots ;
- pilotage SEO peu propre.

Criticité : **P2**

---

## 6. Problèmes de logique métier

## 6.1 Candidature insuffisamment verrouillée côté rôle

Constat :

- l'API candidature vérifie l'authentification ;
- elle ne vérifie pas explicitement que l'utilisateur est bien `candidate`.

Impact :

- un recruteur connecté pourrait théoriquement appeler l'endpoint ;
- la règle métier n'est pas suffisamment défensive.

Criticité : **P1**

## 6.2 Candidature sans validation forte de l'offre

Constat :

- la logique de candidature ne montre pas de validation robuste sur :
  - existence réelle de l'offre ;
  - activité de l'offre ;
  - état publiable de l'offre ;
  - droit de candidater sur cette offre.

Impact :

- risques de candidatures incohérentes ;
- fausse augmentation des compteurs ;
- bruit métier.

Criticité : **P1**

## 6.3 Gestion du statut `withdrawn` incohérente

Constat :

- le retrait d'une candidature met l'objet en `withdrawn` ;
- ce statut n'est pas aligné proprement avec le type `Application` ni avec la table des statuts d'affichage ;
- l'UI masque ensuite ce statut à la main.

Impact :

- modèle métier incohérent ;
- risques de bugs futurs ;
- filtres et reporting potentiellement faux.

Criticité : **P1**

## 6.4 Cycle de vie des annonces trop simplifié

Constat :

- le modèle d'offre semble surtout reposer sur `is_active` ;
- pas de vrai cycle métier clair du type :
  - brouillon ;
  - en relecture ;
  - publiée ;
  - expirée ;
  - archivée ;
  - suspendue.

Impact :

- manque de maturité SaaS/jobboard ;
- expérience recruteur limitée ;
- modération admin moins claire ;
- reporting moins fiable.

Criticité : **P1**

## 6.5 Parcours recruteur plus "promis" que réellement prouvé

Constat :

- la proposition recruteur mentionne diffusion multi-plateformes, analytics, rôles, permissions, API, ATS ;
- une partie de ces éléments est visible dans la structure produit ;
- mais l'audit public ne permet pas de confirmer leur fonctionnement réel end-to-end.

Impact :

- risque d'écart entre promesse commerciale et réalité d'usage ;
- risque de déception à l'essai.

Criticité : **P2**

---

## 7. UX/UI et responsive

## 7.1 Forces UX/UI

- identité forte ;
- CTA généralement visibles ;
- bon niveau de cohérence esthétique ;
- segmentation candidat/recruteur intuitive ;
- cartes, badges et pricing bien présentés ;
- l'expérience marketing a du caractère.

## 7.2 Faiblesses UX

### Faux affordances

Le plus gros problème UX observé est la présence d'actions visibles qui n'aboutissent pas réellement :

- recherche home sans effet fiable ;
- mot de passe oublié inactif ;
- social login non finalisé ;
- liens légaux absents ;
- favoris publics silencieusement inertes si l'utilisateur n'est pas connecté.

### Empty states

- les empty states sont plutôt propres visuellement ;
- mais dans le contexte actuel, ils deviennent structurels plutôt qu'exceptionnels ;
- un jobboard vide perd rapidement toute crédibilité.

### Feedback utilisateur

- plusieurs cas semblent renvoyer des erreurs techniques ou peu éditorialisées ;
- par exemple le non-connecté sur certaines actions peut retomber sur un message peu produit-friendly.

### Responsive

Sur la base des structures observées :

- le site semble globalement pensé mobile-first sur les sections marketing ;
- les grilles et CTA ont l'air correctement adaptatifs ;
- en revanche, sans tests interactifs complets avec navigateur visuel sur toute la prod authentifiée, la robustesse responsive globale ne peut pas être validée à 100 %.

### Accessibilité basique

Points positifs :

- présence de labels sur plusieurs champs ;
- structure de navigation relativement claire ;
- CTA visibles.

Points de vigilance :

- contrastes à vérifier plus finement sur certains fonds colorés ;
- éléments cliquables sans réelle fonctionnalité ;
- social buttons non explicites ;
- usage intensif d'effets visuels qui peuvent masquer l'état réel de certains parcours.

---

## 8. Technique visible, performance et SEO

## 8.1 Performance

Temps observés en lecture HTTP :

- home : réponse correcte, mais payload HTML important ;
- pages offres et formations : réponses rapides, mais contenu utile partiellement remplacé par loader ;
- API jobs : réponse correcte mais vide.

Lecture :

- la rapidité brute n'est pas le problème principal ;
- le problème principal est la valeur réellement délivrée après chargement.

## 8.2 SEO

Forces :

- metadata riches ;
- Open Graph ;
- Twitter Card ;
- canonical ;
- sitemap ;
- robots ;
- JSON-LD.

Faiblesses :

- les metadata globales promettent `12 400+ offres` non cohérentes avec la prod visible ;
- routes auth présentes dans sitemap malgré disallow robots ;
- pages publiques très dépendantes du rendu client pour l'utilité métier ;
- fiche offre invalide pouvant ne pas se comporter comme une 404 propre.

## 8.3 Sécurité front / app visible

Points rassurants :

- redirections basiques sur espaces protégés ;
- séparation des zones candidate / recruiter / admin.

Points à risque :

- pas de rate limiting visible sur auth/inscription ;
- pas de captcha visible ;
- pas de vérification email visible ;
- durcissement métier incomplet sur certains endpoints.

---

## 9. Réponses aux 8 questions initiales

## 9.1 Qu'est-ce qui fonctionne bien ?

- branding très fort ;
- proposition de valeur claire ;
- design globalement qualitatif ;
- structure produit ambitieuse ;
- landing recruteur convaincante visuellement ;
- architecture de rôles déjà pensée ;
- effort SEO supérieur à la moyenne d'un produit jeune.

## 9.2 Qu'est-ce qui fonctionne moins bien ?

- le coeur du produit public candidat manque de substance exploitable en prod ;
- plusieurs fonctions visibles ne sont pas réellement terminées ;
- trop grande dépendance au rendu client ;
- décalage entre narration marketing et état réel observable.

## 9.3 Quels bugs ou incohérences ont été détectés ?

- catalogue offres vide ;
- catalogue formations vide ;
- recherche home non branchée proprement aux filtres listing ;
- pages publiques à loader initial ;
- route fiche offre invalide au comportement ambigu ;
- faux liens footer ;
- mot de passe oublié inactif ;
- social login visible mais non fonctionnel ;
- sitemap et robots contradictoires ;
- statuts candidature incohérents.

## 9.4 Quels problèmes de logique métier existent ?

- contrôle de rôle insuffisant sur la candidature ;
- validation métier de l'offre insuffisamment visible avant candidature ;
- modèle de statut candidature imparfait ;
- absence de vrai cycle de vie riche pour les annonces ;
- promesse recruteur plus large que ce qui est réellement prouvé publiquement.

## 9.5 Quels problèmes UX/UI ou responsive existent ?

- nombreuses fausses affordances ;
- confiance utilisateur fragilisée ;
- vide produit visible malgré un habillage premium ;
- parcours publics qui semblent plus démonstratifs qu'opérationnels ;
- responsive probablement correct sur marketing, mais non validé exhaustivement sur zones protégées.

## 9.6 Quels risques techniques, sécurité ou performance vois-tu ?

- dépendance trop forte au client-side rendering ;
- SEO affaibli par le contenu utile non livré immédiatement ;
- endpoints métier pas assez défensifs ;
- absence visible de protections anti-abus sur auth ;
- risque business de crédibilité plus grave que la pure performance technique.

## 9.7 Quels axes d'amélioration recommandes-tu ?

### Priorité P0

- remettre un vrai catalogue public d'offres exploitable ;
- corriger la recherche home vers le listing ;
- aligner marketing, metadata et réalité de prod.

### Priorité P1

- finaliser ou masquer les fonctions incomplètes ;
- fiabiliser le rendu public sans dépendre autant du loader ;
- durcir les règles métier de candidature ;
- normaliser les statuts candidature ;
- introduire un vrai cycle de vie des offres.

### Priorité P2

- consolider SEO ;
- compléter les pages légales ;
- améliorer les messages d'erreur et de redirection ;
- renforcer la preuve sociale réelle.

## 9.8 Quelles futures pistes d'évolution seraient pertinentes ?

- matching transparent et réellement actionnable ;
- job alerts géolocalisées Réunion / Mayotte ;
- dashboard recruteur piloté par conversion réelle ;
- modération admin plus avancée ;
- funnel de paiement / essai recruteur plus crédible ;
- API et intégrations ATS une fois le socle stabilisé ;
- analytics et benchmark local utiles au marché réunionnais.

---

## 10. Plan de priorisation recommandé

## P0 - indispensable avant accélération acquisition

- rétablir un catalogue offres public vivant ;
- rendre la recherche réellement fonctionnelle ;
- corriger la cohérence entre home, SEO et données réelles ;
- fiabiliser les pages détail d'offres ;
- enlever tout ce qui n'est pas prêt en surface publique.

## P1 - nécessaire pour crédibilité et conversion

- finaliser reset password ;
- finaliser ou retirer social login ;
- publier vraies pages légales ;
- verrouiller les règles métier de candidature ;
- normaliser statuts et reporting ;
- mieux gérer les cas d'erreur utilisateur.

## P2 - optimisation et montée en gamme

- améliorer SSR / SEO utile ;
- renforcer accessibilité ;
- ajouter protections anti-abus ;
- fiabiliser la narration de volume, preuve sociale, chiffres réels ;
- enrichir les workflows recruteur et admin.

---

## 11. Note finale

### Note globale du site

**6,1 / 10**

Kazajob est au-dessus de la moyenne en identité, intention produit et qualité perçue de surface. En revanche, l'expérience réellement testable en production reste trop incomplète pour soutenir pleinement la promesse affichée. Aujourd'hui, le site ressemble davantage à un produit très bien brandé mais encore insuffisamment consolidé sur son coeur métier public.

### Détail par axe

- Design visuel : **8,5 / 10**
- UX globale : **6 / 10**
- Fonctionnalités publiques testables : **4,5 / 10**
- Logique fonctionnelle / métier observable : **5,5 / 10**
- Clarté recruteur / proposition B2B : **7,5 / 10**
- Crédibilité produit en production : **4,5 / 10**
- Rapidité perçue : **7 / 10**
- SEO de base / structure : **7 / 10**
- Robustesse technique visible : **6 / 10**

### Lecture synthétique de la note

- **Très bon potentiel**
- **Très bonne direction design / branding**
- **Socle public candidat actuellement insuffisant**
- **Crédibilité fonctionnelle à renforcer en priorité**

---

## 12. Conclusion

Kazajob a clairement le potentiel pour devenir une très bonne plateforme locale d'emploi, surtout grâce à son identité forte, sa vision produit ambitieuse et son orientation marché local bien marquée. Mais pour l'instant, le produit public donne plus l'image d'une plateforme en pré-maturité avancée que d'une plateforme totalement stabilisée et prête à convertir à grande échelle.

La priorité n'est pas de refaire le design. La priorité est de rendre irréprochable le coeur d'usage public :

- voir de vraies offres ;
- chercher efficacement ;
- comprendre ce qui marche ;
- ne jamais cliquer sur une fausse fonctionnalité ;
- ressentir immédiatement que le produit tient ses promesses.

Quand ce socle sera consolidé, Kazajob pourra capitaliser pleinement sur son identité de marque, qui est déjà un vrai atout.
