'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Square, Trash2, Sparkles, FileText, Mic, Brain } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '@/features/auth/useAuth'
import { useKazaChat, type ChatMessage } from '@/features/ai/useKazaIA'
import { KZ } from '@/lib/constants'
import { Logo } from '@/components/layout/Logo'

const SUGGESTED_PROMPTS = [
  { icon: <FileText size={14} />, text: 'Comment optimiser mon profil Kazajob ?' },
  { icon: <Brain size={14} />,    text: 'Quels salaires pour un dev React à La Réunion ?' },
  { icon: <Mic size={14} />,      text: 'Comment me préparer à un entretien ?' },
  { icon: <Sparkles size={14} />, text: 'Quels secteurs recrutent le plus en 974 ?' },
]

function MessageBubble({ msg, userName }: { msg: ChatMessage; userName: string }) {
  const isAssistant = msg.role === 'assistant'

  return (
    <div className={`flex gap-3 ${isAssistant ? 'justify-start' : 'justify-end'}`}>
      {isAssistant && (
        <div className="shrink-0 mt-0.5">
          <div
            className="w-8 h-8 rounded-xl border border-[#1A1410] flex items-center justify-center"
            style={{ background: KZ.violet }}
          >
            <Sparkles size={14} color="white" />
          </div>
        </div>
      )}

      <div
        className={`max-w-[80%] sm:max-w-[70%] px-4 py-3 rounded-2xl border border-[#1A1410] text-sm leading-relaxed`}
        style={{
          background:  isAssistant ? KZ.paper : KZ.violet,
          color:       isAssistant ? KZ.ink   : 'white',
          boxShadow:   isAssistant ? '3px 3px 0 #E8DDC9' : '3px 3px 0 #1A1410',
          borderRadius: isAssistant ? '4px 18px 18px 18px' : '18px 4px 18px 18px',
        }}
      >
        {msg.loading ? (
          <div className="flex items-center gap-1.5">
            <span className="text-[#6B5A4A] text-xs">KazaIA réfléchit</span>
            <span className="flex gap-1">
              {[0, 1, 2].map(i => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-[#6D3BEB] animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </span>
          </div>
        ) : (
          <p className="whitespace-pre-wrap">{msg.content}</p>
        )}
      </div>

      {!isAssistant && (
        <Avatar name={userName} size={32} color={KZ.orangeSoft} className="shrink-0 mt-0.5" />
      )}
    </div>
  )
}

export default function KazaIAPage() {
  const { profile } = useAuth()
  const { messages, streaming, sendMessage, stopStream, clearChat } = useKazaChat()
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || streaming) return
    sendMessage(input.trim())
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as React.FormEvent)
    }
  }

  const handleSuggestion = (text: string) => {
    sendMessage(text)
  }

  return (
    <div className="max-w-[800px] mx-auto flex flex-col h-[calc(100vh-96px)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl border border-[#1A1410] flex items-center justify-center"
            style={{ background: KZ.violet, boxShadow: '3px 3px 0 #1A1410' }}
          >
            <Sparkles size={20} color="white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight text-[#1A1410]">KazaIA</h1>
              <Badge color="violet" size="sm">Beta</Badge>
              <span className="text-[10px] text-[#6B5A4A] font-semibold">
                propulsé par Groq · Llama 3.3
              </span>
            </div>
            <p className="text-xs text-[#6B5A4A]">Ton assistant emploi intelligent pour le 974</p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button kind="soft" size="sm" icon={<Trash2 size={14} />} onClick={clearChat}>
            Effacer
          </Button>
        )}
      </div>

      {/* Zone de chat */}
      <div
        className="flex-1 rounded-2xl border border-[#1A1410] overflow-hidden flex flex-col min-h-0"
        style={{ boxShadow: '4px 4px 0 #1A1410', background: KZ.cream2 }}
      >
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
          {messages.length === 0 ? (
            /* Écran d'accueil */
            <div className="flex flex-col items-center justify-center h-full gap-6 text-center py-8">
              <div
                className="w-20 h-20 rounded-2xl border border-[#1A1410] flex items-center justify-center animate-float"
                style={{ background: KZ.violet, boxShadow: '5px 5px 0 #1A1410' }}
              >
                <Sparkles size={36} color="white" />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-[#1A1410] mb-2">
                  Bonzour ! Moi c&apos;est KazaIA.
                </h2>
                <p className="text-sm text-[#6B5A4A] max-w-[420px] leading-relaxed">
                  Ton assistant emploi pour La Réunion. Je peux t&apos;aider à rédiger une lettre de motivation,
                  préparer un entretien, comprendre le marché de l&apos;emploi en 974 et bien plus.
                </p>
              </div>

              {/* Suggestions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-[480px]">
                {SUGGESTED_PROMPTS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestion(s.text)}
                    className="flex items-center gap-2.5 p-3 text-left text-sm font-semibold rounded-xl border border-[#1A1410] transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_#1A1410]"
                    style={{ background: KZ.paper, boxShadow: '2px 2px 0 #1A1410' }}
                  >
                    <span className="text-[#6D3BEB]">{s.icon}</span>
                    <span className="text-[#1A1410]">{s.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map(msg => (
                <MessageBubble key={msg.id} msg={msg} userName={profile?.full_name ?? 'Toi'} />
              ))}
              <div ref={bottomRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-[#E8DDC9] bg-white p-3">
          <form onSubmit={handleSubmit} className="flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pose ta question à KazaIA... (Entrée pour envoyer)"
              rows={1}
              className="flex-1 resize-none bg-[#FFF7EE] border border-[#1A1410] rounded-xl px-4 py-2.5 text-sm text-[#1A1410] placeholder:text-[#6B5A4A] outline-none focus:border-[#6D3BEB] transition-colors"
              style={{ minHeight: '44px', maxHeight: '120px' }}
              onInput={(e) => {
                const el = e.target as HTMLTextAreaElement
                el.style.height = 'auto'
                el.style.height = Math.min(el.scrollHeight, 120) + 'px'
              }}
            />
            {streaming ? (
              <Button type="button" kind="danger" size="md" icon={<Square size={15} />} onClick={stopStream}>
                Stop
              </Button>
            ) : (
              <Button
                type="submit"
                kind="violet"
                size="md"
                icon={<Send size={15} />}
                disabled={!input.trim()}
              >
                <span className="hidden sm:inline">Envoyer</span>
              </Button>
            )}
          </form>
          <p className="text-[10px] text-[#6B5A4A] text-center mt-2">
            KazaIA peut faire des erreurs. Vérifie les informations importantes.
            Propulsé par <span className="font-semibold">Groq</span> · Passera sur <span className="font-semibold">Claude</span> bientôt.
          </p>
        </div>
      </div>
    </div>
  )
}
