# Logos partenaires (carrousel multi-diffusion)

Déposez ici vos logos, nommés **exactement** :

```
partner-1.png
partner-2.png
...
partner-8.png
```

- Format conseillé : PNG transparent, ~280×120 px, fond transparent.
- Tant qu'un fichier est absent, le cadre affiche « LOGO N » (vide) — aucune erreur.
- Pour changer le nombre de cadres : éditez `SLOTS` dans
  `src/components/landing/PartnerCarousel.tsx`.

Comportement : défilement auto, pause au survol du carrousel,
le logo survolé passe en couleur (les autres restent en gris).
