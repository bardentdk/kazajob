'use client'

import { useState, useRef, useEffect } from 'react'
import { Sparkles, X, Send, StopCircle, Trash2, Bot, Minimize2 } from 'lucide-react'
import { useKazaChat } from '@/features/ai/useKazaIA'
import { InlineLoader } from '@/components/ui/LogoLoader'
import { KZ } from '@/lib/constants'

const QUICK_PROMPTS = [
  'Comment améliorer mon CV pour La Réunion ?',
  'Conseils pour décrocher un entretien',
  'Comment négocier mon salaire à 974 ?',
  'Quels secteurs recrutent le plus à La Réunion ?',
]

export function ChatAssistantDrawer() {
  const [open, setOpen]   = useState(false)
  const [input, setInput] = useState('')
  const { messages, streaming, sendMessage, stopStream, clearChat } = useKazaChat()
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLInputElement>(null)

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input à l'ouverture
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300)
  }, [open])

  const handleSend = () => {
    if (!input.trim() || streaming) return
    sendMessage(input.trim())
    setInput('')
  }

  const handleQuickPrompt = (prompt: string) => {
    sendMessage(prompt)
  }

  return (
    <>
      {/* ── Bouton flottant ─────────────────────────────────────── */}
      <button
        onClick={() => setOpen(true)}
        className={`fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full border-2 border-[#1A1410] flex items-center justify-center transition-all hover:scale-105 active:scale-95 ${open ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        style={{ background: KZ.violet, boxShadow: '4px 4px 0 #1A1410' }}
        title="KazaIA — Assistant carrière"
        aria-label="Ouvrir KazaIA"
      >
        <Sparkles size={22} color="white" />
        {/* Badge pulsant */}
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white animate-pulse" style={{ background: KZ.orange }} />
      </button>

      {/* ── Backdrop mobile ─────────────────────────────────────── */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Drawer ──────────────────────────────────────────────── */}
      <div
        className={`fixed z-50 flex flex-col transition-all duration-300 ease-out
          bottom-0 right-0 w-full sm:w-[420px]
          h-[88vh] sm:h-[620px] sm:bottom-6 sm:right-6
          rounded-t-2xl sm:rounded-2xl
          overflow-hidden
          border-2 border-[#1A1410] shadow-[6px_6px_0_#1A1410]
          ${open ? 'translate-y-0 opacity-100' : 'translate-y-[110%] opacity-0 pointer-events-none'}`}
        style={{ background: KZ.paper }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 px-4 py-3 shrink-0"
          style={{ background: KZ.violet }}
        >
          <div className="w-8 h-8 rounded-lg border border-white/30 flex items-center justify-center shrink-0">
            <Sparkles size={15} color="white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-white leading-tight">KazaIA Assistant</div>
            <div className="text-[11px] text-white/70 leading-tight">Coach carrière · 974</div>
          </div>
          <button
            onClick={clearChat}
            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
            title="Effacer la conversation"
          >
            <Trash2 size={14} color="white" />
          </button>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
            aria-label="Réduire"
          >
            <Minimize2 size={15} color="white" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {messages.length === 0 ? (
            /* État vide — accueil */
            <div className="flex flex-col gap-4">
              {/* Message de bienvenue */}
              <div className="flex items-start gap-3">
                <div
                  className="w-7 h-7 rounded-full border border-[#1A1410] flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: KZ.violetSoft }}
                >
                  <Bot size={13} color={KZ.violet} />
                </div>
                <div
                  className="flex-1 p-3 rounded-xl rounded-tl-none text-sm text-[#1A1410] border border-[#E8DDC9] leading-relaxed"
                  style={{ background: KZ.cream2 }}
                >
                  👋 Bonjour ! Je suis <strong>KazaIA</strong>, votre assistant emploi pour <strong>La Réunion</strong>.<br /><br />
                  Je peux vous aider avec votre CV, vos lettres de motivation, préparer vos entretiens, et vous donner des conseils personnalisés pour le marché du travail 974.
                </div>
              </div>

              {/* Suggestions rapides */}
              <div className="ml-10">
                <p className="text-xs text-[#6B5A4A] mb-2 font-semibold">Questions fréquentes :</p>
                <div className="flex flex-col gap-1.5">
                  {QUICK_PROMPTS.map(p => (
                    <button
                      key={p}
                      onClick={() => handleQuickPrompt(p)}
                      className="text-left text-xs px-3 py-2.5 rounded-xl border border-[#E8DDC9] hover:border-[#6D3BEB] hover:bg-[#E5DCFF] transition-all text-[#2A2018] font-medium"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Historique des messages */
            messages.map(msg => (
              <div
                key={msg.id}
                className={`flex items-start gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                {msg.role === 'assistant' && (
                  <div
                    className="w-7 h-7 rounded-full border border-[#1A1410] flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: KZ.violetSoft }}
                  >
                    <Bot size={13} color={KZ.violet} />
                  </div>
                )}
                <div
                  className={`max-w-[85%] p-3 rounded-xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'rounded-tr-none text-white'
                      : 'rounded-tl-none text-[#1A1410] border border-[#E8DDC9]'
                  }`}
                  style={{ background: msg.role === 'user' ? KZ.violet : KZ.cream2 }}
                >
                  {msg.loading ? (
                    <div className="flex items-center gap-2">
                      <InlineLoader size={20} />
                      <span className="text-xs text-[#6B5A4A]">En train de répondre...</span>
                    </div>
                  ) : msg.content}
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Zone de saisie */}
        <div className="px-4 pb-4 pt-3 border-t border-[#E8DDC9] shrink-0" style={{ background: KZ.cream }}>
          <div className="flex gap-2 items-center">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder="Posez votre question..."
              className="flex-1 px-4 py-2.5 rounded-xl border-2 border-[#1A1410] text-sm focus:outline-none focus:border-[#6D3BEB] transition-colors"
              style={{ background: KZ.paper }}
              disabled={streaming}
            />
            {streaming ? (
              <button
                onClick={stopStream}
                className="w-10 h-10 rounded-xl border-2 border-[#1A1410] flex items-center justify-center shrink-0 transition-colors hover:bg-[#FFE0CF]"
                style={{ background: KZ.orangeSoft }}
                title="Arrêter"
              >
                <StopCircle size={18} color={KZ.orange} />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="w-10 h-10 rounded-xl border-2 border-[#1A1410] flex items-center justify-center shrink-0 disabled:opacity-40 transition-all hover:scale-105 active:scale-95"
                style={{ background: KZ.violet }}
                title="Envoyer (Entrée)"
              >
                <Send size={16} color="white" />
              </button>
            )}
          </div>
          <p className="text-[10px] text-[#6B5A4A] mt-2 text-center">
            IA générative · Peut faire des erreurs · Basé sur Llama 3.3
          </p>
        </div>
      </div>
    </>
  )
}
