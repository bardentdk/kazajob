'use client'

import { useState, useEffect } from 'react'
import { MessageCircle, Send } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/feedback/EmptyState'
import { useConversations, useMessages } from '@/features/messages/useMessages'
import { useAuth } from '@/features/auth/useAuth'
import { timeAgo } from '@/lib/utils'
import { KZ } from '@/lib/constants'

export default function RecruiterMessagesPage() {
  const { profile } = useAuth()
  const { conversations, loading } = useConversations(profile?.id)
  const [activeConvId, setActiveConvId] = useState<string | null>(null)
  const { messages, sendMessage, bottomRef } = useMessages(activeConvId ?? undefined, profile?.id)
  const [input, setInput] = useState('')

  // Deep-link : ?c=<conversationId> ouvre directement la conversation.
  useEffect(() => {
    const c = new URLSearchParams(window.location.search).get('c')
    if (c) setActiveConvId(c)
  }, [])

  const activeConv = conversations.find((c) => c.id === activeConvId)

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    await sendMessage(input)
    setInput('')
  }

  const otherUser = (conv: typeof conversations[0]) =>
    conv.recruiter_id === profile?.id ? conv.candidate : conv.recruiter

  return (
    <div className="max-w-[1000px] mx-auto h-[calc(100vh-160px)] flex flex-col">
      <h1 className="kz-h2 text-[#1A1410] mb-5">Messages</h1>
      <div className="flex-1 flex rounded-xl border border-[#1A1410] overflow-hidden" style={{ boxShadow: '4px 4px 0 #1A1410' }}>
        <div className="w-64 border-r border-[#1A1410] bg-white overflow-y-auto shrink-0">
          {loading ? <div className="p-4 text-sm text-[#6B5A4A]">Chargement...</div> :
            conversations.length === 0 ? <EmptyState title="Aucune conversation" icon={<MessageCircle size={24} />} /> :
              conversations.map((conv) => {
                const other = otherUser(conv)
                return (
                  <button
                    key={conv.id}
                    onClick={() => setActiveConvId(conv.id)}
                    className="w-full flex items-center gap-3 p-3.5 border-b border-[#E8DDC9] text-left"
                    style={{ background: conv.id === activeConvId ? KZ.cream2 : 'white' }}
                  >
                    <Avatar name={other?.full_name ?? 'KZ'} size={38} color={KZ.violetSoft} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-[#1A1410] truncate">{other?.full_name}</div>
                      {conv.job && <div className="text-xs text-[#6B5A4A] truncate">{conv.job.title}</div>}
                    </div>
                  </button>
                )
              })}
        </div>

        <div className="flex-1 flex flex-col bg-[#FFF7EE]">
          {!activeConvId ? (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState title="Selectionne une conversation" icon={<MessageCircle size={28} />} />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 p-4 border-b border-[#E8DDC9] bg-white">
                {activeConv && (
                  <>
                    <Avatar name={otherUser(activeConv)?.full_name ?? 'KZ'} size={36} color={KZ.violetSoft} />
                    <div className="text-sm font-bold text-[#1A1410]">{otherUser(activeConv)?.full_name}</div>
                  </>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                {messages.map((msg) => {
                  const isMe = msg.sender_id === profile?.id
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className="max-w-[70%] px-4 py-2.5 rounded-xl border border-[#1A1410] text-sm"
                        style={{ background: isMe ? KZ.violet : KZ.paper, color: isMe ? '#fff' : KZ.ink, boxShadow: '2px 2px 0 #1A1410' }}
                      >
                        <p>{msg.content}</p>
                        <p className="text-[10px] mt-1 opacity-60">{timeAgo(msg.created_at)}</p>
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>
              <form onSubmit={handleSend} className="flex gap-2 p-4 border-t border-[#E8DDC9] bg-white">
                <input value={input} onChange={(e) => setInput(e.target.value)} className="flex-1 h-11 px-4 bg-[#FFF7EE] border border-[#1A1410] rounded-lg text-sm outline-none" placeholder="Ecrire un message..." />
                <Button type="submit" kind="violet" size="md" icon={<Send size={16} />}>Envoyer</Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
