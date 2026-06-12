import { PublicShell } from '@/components/layout/PublicShell'

export interface LegalSection { h: string; body: string[] }

/** Rendu d'un document légal/éditorial (titre + sections). */
export function LegalDoc({
  title, updated, intro, sections,
}: { title: string; updated?: string; intro?: string; sections: LegalSection[] }) {
  return (
    <PublicShell>
      <article className="max-w-[820px] mx-auto px-4 sm:px-8 py-12 lg:py-16">
        <h1 className="text-3xl lg:text-[40px] font-extrabold tracking-tight text-[#1A1410] mb-2">{title}</h1>
        {updated && <p className="text-xs text-[#6B5A4A] mb-8">Dernière mise à jour : {updated}</p>}
        {intro && <p className="text-base text-[#2A2018] leading-relaxed mb-8">{intro}</p>}
        <div className="flex flex-col gap-7">
          {sections.map((s, i) => (
            <section key={i}>
              <h2 className="text-lg font-bold text-[#1A1410] mb-2">{s.h}</h2>
              {s.body.map((p, j) => (
                <p key={j} className="text-sm text-[#2A2018] leading-relaxed mb-2">{p}</p>
              ))}
            </section>
          ))}
        </div>
      </article>
    </PublicShell>
  )
}
