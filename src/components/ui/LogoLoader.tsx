/**
 * LogoLoader — Animation stroke "fil de pétard" sur le logo Kazajob
 * Fichier SÉPARÉ de Logo.tsx — ne pas modifier Logo.tsx
 *
 * Le stroke se dessine de 0% à 100% puis s'efface, en boucle.
 * Effet "fil qui se consume" : le trait orange progresse sur le logo
 * puis disparaît, recommence indéfiniment jusqu'à la fin du chargement.
 */

interface LogoLoaderProps {
  size?: number
  className?: string
}

export function LogoLoader({ size = 64, className = '' }: LogoLoaderProps) {
  const gradId = 'kz-loader-grad'

  return (
    <div className={`inline-flex flex-col items-center gap-3 ${className}`}>
      <svg
        width={size}
        height={Math.round(size * 1.24)} // ratio 532/661.43 ≈ 0.805 → inverse ≈ 1.24
        viewBox="0 0 532 661.43"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Chargement…"
      >
        <defs>
          {/* Gradient orange → violet identique au logo */}
          <linearGradient id={gradId} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#eb5c24" />
            <stop offset="40%"  stopColor="#c14e24" />
            <stop offset="70%"  stopColor="#744797" />
            <stop offset="100%" stopColor="#544797" />
          </linearGradient>

          <style>{`
            @keyframes kz-draw {
              0%   { stroke-dashoffset: 1; opacity: 1; }
              45%  { stroke-dashoffset: 0; opacity: 1; }
              55%  { stroke-dashoffset: 0; opacity: 1; }
              90%  { stroke-dashoffset: -1; opacity: 0.2; }
              100% { stroke-dashoffset: -1; opacity: 0.2; }
            }
            @keyframes kz-draw-circle {
              0%   { stroke-dashoffset: 1; opacity: 0.3; }
              30%  { stroke-dashoffset: 1; opacity: 0.3; }
              75%  { stroke-dashoffset: 0; opacity: 1; }
              90%  { stroke-dashoffset: -1; opacity: 0.2; }
              100% { stroke-dashoffset: -1; opacity: 0.2; }
            }
            .kz-path-anim {
              stroke-dasharray: 1;
              stroke-dashoffset: 1;
              pathLength: 1;
              animation: kz-draw 1.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
            }
            .kz-circle-anim {
              stroke-dasharray: 1;
              stroke-dashoffset: 1;
              animation: kz-draw-circle 1.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
            }
          `}</style>
        </defs>

        {/* Fond très léger pour voir le trait sur fond clair */}
        <path
          d="M499.21,79.8L187.43,391.62c-6.22,6.22-13.15,11.32-20.54,15.25v241.54H50.43c-22.32,0-40.43-18.11-40.43-40.43V52.94c0-21.06,17.13-38.18,38.18-38.18h118.71v186.89L333.47,35.02c33.41-33.36,87.55-33.36,120.96,0l44.78,44.78Z"
          stroke="#1A1410"
          strokeWidth="20"
          strokeOpacity="0.06"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <circle
          cx="390.74" cy="520.18" r="131.26"
          stroke="#1A1410"
          strokeWidth="20"
          strokeOpacity="0.06"
          fill="none"
        />

        {/* Trait animé — le "fil qui se consume" */}
        <path
          className="kz-path-anim"
          d="M499.21,79.8L187.43,391.62c-6.22,6.22-13.15,11.32-20.54,15.25v241.54H50.43c-22.32,0-40.43-18.11-40.43-40.43V52.94c0-21.06,17.13-38.18,38.18-38.18h118.71v186.89L333.47,35.02c33.41-33.36,87.55-33.36,120.96,0l44.78,44.78Z"
          stroke={`url(#${gradId})`}
          strokeWidth="28"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          pathLength="1"
        />
        <circle
          className="kz-circle-anim"
          cx="390.74" cy="520.18" r="131.26"
          stroke={`url(#${gradId})`}
          strokeWidth="28"
          fill="none"
          pathLength="1"
        />
      </svg>
    </div>
  )
}

/** Version pleine page centrée — remplace les <PageLoader> */
export function FullPageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFF7EE]">
      <div className="flex flex-col items-center gap-4">
        <LogoLoader size={72} />
        <p className="text-sm font-bold text-[#6B5A4A] tracking-wide animate-pulse">
          Chargement…
        </p>
      </div>
    </div>
  )
}

/** Version inline — remplace les petits spinners */
export function InlineLoader({ size = 32 }: { size?: number }) {
  return <LogoLoader size={size} />
}
