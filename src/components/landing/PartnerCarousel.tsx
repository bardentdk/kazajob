'use client'

import { useState } from 'react'
import { KZ } from '@/lib/constants'

/**
 * Carrousel de logos partenaires (multi-diffusion).
 * - Défilement automatique infini
 * - Au survol du carrousel : l'animation se met en pause
 * - Au survol d'un logo : il passe en couleur (les autres restent en gris)
 *
 * Les cadres sont VIDES par défaut : déposez vos images dans
 *   /public/assets/img/partners/partner-1.png ... partner-8.png
 * Pour ajouter/retirer des cadres, modifiez simplement SLOTS ci-dessous.
 */

const SLOTS = [1, 2, 3, 4, 5, 6, 7, 8]
const ASSET = (n: number) => `/assets/img/partners/partner-${n}.png`

function LogoFrame({ n }: { n: number }) {
  const [loaded, setLoaded] = useState(true)
  return (
    <div
      className="partner-frame shrink-0 w-[180px] h-[88px] rounded-2xl xs:border xs:border-[#E8DDC9] xs:bg-white flex items-center justify-center overflow-hidden"
      style={{ boxShadow: '0px 0px 0 #E8DDC9' /* 2px 2px 0 #E8DDC9 */}}
    >
      {loaded ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={ASSET(n)}
          alt=""
          onError={() => setLoaded(false)}
          className="partner-img max-h-[56px] max-w-[140px] object-contain"
        />
      ) : (
        // Cadre vide — à remplir par vos soins
        <span className="text-[11px] font-bold text-[#C9BBA6] tracking-wide select-none">
          LOGO {n}
        </span>
      )}
    </div>
  )
}

export function PartnerCarousel() {
  // On duplique la liste pour un défilement sans couture
  const items = [...SLOTS, ...SLOTS]
  return (
    <div className="partner-carousel relative overflow-hidden">
      {/* Dégradés latéraux pour un fondu propre */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 z-10"
        style={{ background: `linear-gradient(to right, ${KZ.cream2}, transparent)` }} />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 z-10"
        style={{ background: `linear-gradient(to left, ${KZ.cream2}, transparent)` }} />

      <div className="partner-track flex gap-5 w-max">
        {items.map((n, i) => <LogoFrame key={`${n}-${i}`} n={n} />)}
      </div>

      <style>{`
        .partner-track {
          animation: partner-scroll 32s linear infinite;
        }
        .partner-carousel:hover .partner-track {
          animation-play-state: paused;
        }
        .partner-img {
          filter: grayscale(100%);
          opacity: 0.55;
          transition: filter .25s ease, opacity .25s ease, transform .25s ease;
        }
        .partner-frame:hover .partner-img {
          filter: grayscale(0%);
          opacity: 1;
          transform: scale(1.04);
        }
        @keyframes partner-scroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .partner-track { animation: none; }
        }
      `}</style>
    </div>
  )
}
