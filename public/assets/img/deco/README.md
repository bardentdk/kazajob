# Décor de sections (style BD / cartoon)

Déposez ici vos images d'arrière-plan, nommées :

```
hero.png        → section héro de l'accueil candidat
comment.png     → section « Comment ça marche »
```

- Format conseillé : PNG transparent, illustration cartoon/BD.
- Tant qu'un fichier est absent, **rien ne s'affiche** (la section garde
  son fond de couleur). Aucune erreur.
- Réglages par section (opacité, position, taille) :
  composant `<SectionDecor>` dans `src/app/page.tsx`.
- Pour décorer d'autres sections, importez `SectionDecor` et ajoutez-le
  dans une `<section>` en `relative overflow-hidden`.
