import { useEffect, useRef, useState } from 'react'
import { IoSend } from 'react-icons/io5'
import logo from '../assets/logo.png'

type Sender = 'user' | 'ai'

interface Message {
  id: string
  sender: Sender
  text: string
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

const QUICK_ANSWERS: Record<string, string> = {
  q1: '피싱 문자를 받으셨군요. 링크는 절대 클릭하지 마시고, 발신 번호를 차단한 뒤 문자 내용은 캡처해서 보관해주세요. 확인이 필요하면 해당 기관 공식 채널로 직접 연락해보세요.',
  q2: '개인정보가 유출된 것 같다면 즉시 비밀번호를 변경하고, 연결된 계좌·카드사에 도용 여부를 확인해달라고 요청하세요. 필요 시 개인정보침해신고센터(국번없이 118)로 신고할 수 있어요.',
  q3: '이미 송금하셨다면 최대한 빨리 은행 콜센터 또는 112에 연락해 지급정지를 요청하세요. 시간이 지날수록 되돌리기 어려워지니 지금 바로 연락하는 게 중요해요.',
}

function createMessage(sender: Sender, text: string): Message {
  return { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, sender, text }
}

async function getMockAiResponse(userText: string): Promise<string> {
  // TODO: API 연동 시 실제 챗봇 응답 요청으로 교체 — POST /api/v1/chat
  console.log(userText)

  await new Promise((resolve) => setTimeout(resolve, 700))

  return '아직은 목업 응답이에요. 실제 서비스에서는 상황에 맞는 대응 가이드를 안내해드릴 예정이에요. 더 궁금한 점이 있다면 계속 물어보세요!'
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMessages([createMessage('ai', GREETING)])
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const sendMessage = async (text: string, quickId?: string) => {
    const trimmed = text.trim()
    if (!trimmed || isTyping) return

    setMessages((prev) => [...prev, createMessage('user', trimmed)])
    setInput('')
    setIsTyping(true)

    const reply = quickId && QUICK_ANSWERS[quickId] ? QUICK_ANSWERS[quickId] : await getMockAiResponse(trimmed)

    setMessages((prev) => [...prev, createMessage('ai', reply)])
    setIsTyping(false)
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
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start items-end gap-2'}`}
          >
            {message.sender === 'ai' && (
              <img src={logo} alt="SafeFam" className="w-8 h-8 rounded-full shrink-0" />
            )}
            <div
              className={`max-w-[80%] px-4 py-3 text-sm whitespace-pre-line ${
                message.sender === 'user'
                  ? 'bg-blue text-white rounded-2xl rounded-br-sm'
                  : 'bg-surface border border-line text-t1 rounded-2xl rounded-bl-sm'
              }`}
            >
              {message.text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
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
            onClick={() => void sendMessage(q.label, q.id)}
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
