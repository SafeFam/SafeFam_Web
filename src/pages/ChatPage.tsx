import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { IoSend } from 'react-icons/io5'
import logo from '../assets/logo.png'
import { postChat } from '../api/chat'

type Role = 'USER' | 'ASSISTANT'

interface Message {
  id: string
  role: Role
  content: string
}

interface QuickQuestion {
  id: string
  label: string
}

const QUICK_QUESTIONS: QuickQuestion[] = [
  { id: 'q1', label: '피싱 문자 받았어요' },
  { id: 'q2', label: '개인정보 유출됐어요' },
  { id: 'q3', label: '송금했어요' },
]

const GREETING = '안녕하세요! SafeFam 챗봇이에요. 피싱이 의심되거나 이미 피해를 입으셨다면 무엇이든 편하게 물어보세요.'

function createMessage(role: Role, content: string): Message {
  return { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, role, content }
}

export default function ChatPage() {
  const location = useLocation()
  const analysisId = (location.state as { analysisId?: number | null } | null)?.analysisId ?? null

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMessages([createMessage('ASSISTANT', GREETING)])
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const sendMessage = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || isTyping) return

    const updatedMessages = [...messages, createMessage('USER', trimmed)]
    setMessages(updatedMessages)
    setInput('')
    setIsTyping(true)

    try {
      const reply = await postChat(
        analysisId,
        updatedMessages.map(({ role, content }) => ({ role, content }))
      )
      setMessages((prev) => [...prev, createMessage('ASSISTANT', reply.content)])
    } catch {
      setMessages((prev) => [
        ...prev,
        createMessage('ASSISTANT', '응답을 가져오는 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.'),
      ])
    } finally {
      setIsTyping(false)
    }
  }

  const handleSend = () => {
    void sendMessage(input)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      <header className="py-4 border-b border-line">
        <h1 className="text-xl font-bold text-t1">피싱 대응 챗봇</h1>
        <p className="text-sm text-t2 mt-1">궁금한 점을 물어보세요.</p>
      </header>

      <section className="flex-1 overflow-y-auto py-4 flex flex-col gap-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'USER' ? 'justify-end' : 'justify-start items-end gap-2'}`}
          >
            {message.role === 'ASSISTANT' && (
              <img src={logo} alt="SafeFam" className="w-8 h-8 rounded-full shrink-0" />
            )}
            <div
              className={`max-w-[80%] px-4 py-3 text-sm whitespace-pre-line ${
                message.role === 'USER'
                  ? 'bg-blue text-white rounded-2xl rounded-br-sm'
                  : 'bg-surface border border-line text-t1 rounded-2xl rounded-bl-sm'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start items-end gap-2">
            <img src={logo} alt="SafeFam" className="w-8 h-8 rounded-full shrink-0" />
            <div className="bg-surface border border-line text-t3 rounded-2xl rounded-bl-sm px-4 py-3 text-sm">
              입력 중...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </section>

      <section className="flex items-center gap-2 overflow-x-auto py-2">
        {QUICK_QUESTIONS.map((q) => (
          <button
            key={q.id}
            onClick={() => void sendMessage(q.label)}
            disabled={isTyping}
            className="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border border-blue text-blue bg-white disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {q.label}
          </button>
        ))}
      </section>

      <section className="flex items-end gap-2 py-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="메시지를 입력하세요"
          rows={1}
          className="flex-1 px-4 py-3 rounded-xl border border-line text-t1 placeholder-t3 resize-none focus:outline-none focus:border-blue bg-white"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isTyping}
          aria-label="전송"
          className="shrink-0 w-11 h-11 flex items-center justify-center bg-blue text-white rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <IoSend size={18} />
        </button>
      </section>
    </div>
  )
}