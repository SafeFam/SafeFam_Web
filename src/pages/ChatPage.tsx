import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { IoSend } from 'react-icons/io5'
import logo from '../assets/logo.png'
import { postChat } from '../api/chat'
import { apiErrorMessage } from '../api/types'

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

  // 인사말은 서버와 무관한 고정 문구라 첫 렌더부터 들고 시작한다.
  // (예전엔 effect에서 setState로 넣어 렌더가 한 번 더 돌았다.)
  const [messages, setMessages] = useState<Message[]>(() => [createMessage('ASSISTANT', GREETING)])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const sendMessage = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || isTyping) return

    const updatedMessages = [...messages, createMessage('USER', trimmed)]
    setMessages(updatedMessages)
    setInput('')
    setErrorMessage(null)
    setIsTyping(true)

    try {
      const reply = await postChat(
        analysisId,
        updatedMessages.map(({ role, content }) => ({ role, content }))
      )
      setMessages((prev) => [...prev, createMessage('ASSISTANT', reply)])
    } catch (error) {
      // 챗봇 실패는 서버(AI 연결·타임아웃)와 클라이언트 어느 쪽이든 날 수 있다.
      // 서버가 이유를 한국어로 실어 보내면 그걸 그대로 보여줘야 원인을 짚을 수 있다.
      setErrorMessage(apiErrorMessage(error) ?? '응답을 가져오는 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.')
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
        <h1 className="text-title-screen text-t1">피싱 대응 챗봇</h1>
        <p className="text-body text-t2 mt-1">궁금한 점을 물어보세요.</p>
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
              className={`max-w-[80%] px-4 py-3 text-body whitespace-pre-line ${
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
            <div className="bg-surface border border-line text-t3 rounded-2xl rounded-bl-sm px-4 py-3 text-body">
              입력 중...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </section>

      {errorMessage && (
        <section className="bg-high-bg border border-high-line rounded-2xl px-4 py-3 text-body text-high-text">
          {errorMessage}
        </section>
      )}

      <section className="flex items-center gap-2 overflow-x-auto py-2">
        {QUICK_QUESTIONS.map((q) => (
          <button
            key={q.id}
            onClick={() => void sendMessage(q.label)}
            disabled={isTyping}
            className="shrink-0 px-3 py-1.5 rounded-full text-section border border-blue text-blue bg-white disabled:opacity-40 disabled:cursor-not-allowed"
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