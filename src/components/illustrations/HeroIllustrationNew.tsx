import { KZ } from '@/lib/constants'
import { Soleil, Palme, Montagne, Vague, Nuage, Hibiscus, Sparkle } from './Tropical'
import { Briefcase, Sparkles } from 'lucide-react'
import { Logo } from '../layout/Logo'

export function HeroIllustrationNew() {
  return (
    <div
      className="relative w-[520px] h-[50vh] rounded-2xl border-[1.5px] border-[#1A1410] overflow-hidden animate-float"
      style={{ boxShadow: '6px 6px 0 #1A1410', background: KZ.violetSoft }}
    >
      {/* Ciel dégradé */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg, ${KZ.blueSoft} 0%, ${KZ.violetSoft} 100%)`,
          height: 240,
        }}
      >
        <img
            src="/assets/img/homepage/hero.png"
            alt="Illustration Kazajob La Reunion"
            className="w-full object-contain object-bottom"
            style={{ maxHeight: '100vh', maxWidth: 'auto'}}
          />
      </div>

      {/* Éléments décoratifs */}
      {/* <div className="absolute top-10 right-16"><Soleil size={120} /></div>
      <div className="absolute top-9 left-12"><Nuage width={100} height={48} /></div>
      <div className="absolute top-22 left-[220px]"><Nuage width={70} height={36} /></div> */}

      {/* Montagnes */}
      {/* <div className="absolute top-[200px] left-0 right-0">
        <Montagne width={520} height={140} color={KZ.violet} />
      </div>
      <div className="absolute top-[240px] left-0 right-0">
        <Montagne width={520} height={120} color={KZ.blue} />
      </div> */}

      {/* Sol */}
      {/* <div
        className="absolute bottom-0 left-0 right-0 border-t border-[#1A1410]"
        style={{ height: 130, background: KZ.greenSoft }}
      /> */}

      {/* Vagues */}
      {/* <div className="absolute bottom-[100px] left-0 right-0">
        <Vague width={520} height={28} />
      </div> */}

      {/* Palmes */}
      {/* <div className="absolute bottom-20 left-5"><Palme size={140} /></div>
      <div className="absolute bottom-16 right-8"><Palme size={110} rotate={20} /></div>
      <div className="absolute bottom-8 left-[200px]"><Hibiscus size={56} /></div> */}
      <div className='absolute top-25 right-75 z-50 h-auto'>
        <Logo size={30} />
      </div>
      {/* Card flottante : offre */}
      <div
        className="absolute top-10 right-70 w-[220px] p-3.5 rounded-[10px] border-[1.5px] border-[#1A1410]"
        style={{ background: KZ.paper, boxShadow: '4px 4px 0 #1A1410', transform: 'rotate(-4deg)' }}
      >
        <div className="flex items-center gap-2.5 mb-2">
          <div
            className="w-9 h-9 rounded-md border border-[#1A1410] flex items-center justify-center"
            style={{ background: KZ.orange }}
          >
            <Briefcase size={16} color={KZ.ink} />
          </div>
          <div>
            <div className="text-sm font-bold text-[#1A1410]">Run Tech</div>
            <div className="text-[10px] text-[#6B5A4A]">Saint-Pierre · 974</div>
          </div>
        </div>
        <div className="text-sm font-bold text-[#1A1410] mb-1.5">Dev Full-Stack</div>
        <div className="flex gap-1">
          <span className="text-xs font-semibold px-2 py-0.5 border border-[#1A1410] rounded-md" style={{ background: KZ.violetSoft }}>React</span>
          <span className="text-xs font-semibold px-2 py-0.5 border border-[#1A1410] rounded-md" style={{ background: KZ.greenSoft }}>Remote</span>
        </div>
      </div>

      {/* Card flottante : matching */}
      <div
        className="absolute top-[200px] right-8 w-[200px] p-3 rounded-[10px] border-[1.5px] border-[#1A1410]"
        style={{ background: KZ.paper, boxShadow: '4px 4px 0 #1A1410', transform: 'rotate(5deg)' }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={14} color={KZ.violet} />
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#1A1410]">Matching IA</span>
        </div>
        <div className="flex items-baseline gap-1 mb-1.5">
          <span className="text-[32px] font-extrabold leading-none" style={{ color: KZ.violet }}>94</span>
          <span className="text-sm font-bold" style={{ color: KZ.violet }}>%</span>
        </div>
        <div className="h-3 bg-[#FBEFE0] border border-[#1A1410] rounded-full overflow-hidden">
          <div className="h-full w-[94%] border-r border-[#1A1410]" style={{ background: KZ.violet }} />
        </div>
      </div>
      {/* Bulle BD
      <div
        className="absolute bottom-3 left-2 px-3.5 py-2.5 rounded-2xl border-[1.5px] border-[#1A1410] text-sm font-bold text-[#1A1410]"
        style={{ background: KZ.yellow, boxShadow: '3px 3px 0 #1A1410', transform: 'rotate(-3deg)' }}
      >
        Le la !
      </div> */}


      {/* Sparkles décoratifs */}
      <div className="absolute top-36 left-4"><Sparkle size={20} color={KZ.yellow} /></div>
      <div className="absolute top-16 right-8"><Sparkle size={16} color={KZ.green} /></div>
    </div>
  )
}
