/**
 * Calque décoratif d'arrière-plan (style BD/cartoon) pour une section.
 *
 * Déposez vos images dans /public/assets/img/deco/ (ex: comment.png).
 * Si le fichier n'existe pas encore, RIEN ne s'affiche (pas d'erreur) —
 * la section garde simplement son fond de couleur actuel.
 *
 * Usage : mettre la <section> en `relative overflow-hidden`, placer
 * <SectionDecor src="/assets/img/deco/xxx.png" /> juste après l'ouverture,
 * et s'assurer que le contenu a un z-index supérieur (ex: relative z-10).
 */
export function SectionDecor({
  src,
  opacity = 0.1,
  size = 'cover',
  position = 'center',
  className = '',
}: {
  src: string
  opacity?: number
  size?: string
  position?: string
  className?: string
}) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 bg-no-repeat ${className}`}
      style={{
        backgroundImage: `url(${src})`,
        backgroundSize: size,
        backgroundPosition: position,
        opacity,
      }}
    />
  )
}
