import { useState } from 'react'
import { IoCall } from 'react-icons/io5'

type RiskLevel = 'high' | 'med' | 'low'
type InputType = 'url' | 'email'

interface Evidence {
  id: string
  title: string
  description: string
}

interface AnalysisResult {
  riskLevel: RiskLevel
  summary: string
  evidences: Evidence[]
}

interface TrendItem {
  id: string
  title: string
  description: string
}

const RISK_META: Record<RiskLevel, { label: string; badge: string; box: string }> = {
  high: {
    label: '위험',
    badge: 'bg-high text-white',
    box: 'bg-high-bg border-high-line text-high-text',
  },
  med: {
    label: '주의',
    badge: 'bg-med text-white',
    box: 'bg-med/10 border-med/30 text-med-text',
  },
  low: {
    label: '안전',
    badge: 'bg-low text-white',
    box: 'bg-low/10 border-low/30 text-t1',
  },
}

const TREND_ITEMS: TrendItem[] = [
  { id: '1', title: '택배 미수령 사칭 문자', description: '가짜 배송 조회 링크로 개인정보를 요구하는 스미싱' },
  { id: '2', title: '가족 사칭 메신저 피싱', description: '자녀·지인을 사칭해 급하게 송금을 요청하는 수법' },
  { id: '3', title: '정부지원금 안내 사칭', description: '지원금 신청을 빙자한 피싱 사이트 유도' },
]

function detectInputType(value: string): InputType {
  return /^https?:\/\//i.test(value.trim()) ? 'url' : 'email'
}

async function analyzeInput(_value: string, _type: InputType): Promise<AnalysisResult> {
  await new Promise((resolve) => setTimeout(resolve, 600))
  
  const levels: RiskLevel[] = ['high', 'med', 'low']
  const riskLevel = levels[Math.floor(Math.random() * levels.length)]
  
  const summaries: Record<RiskLevel, string> = {
    high: '피싱 의심 사이트 및 개인정보 탈취 시도가 감지되었습니다.',
    med: '일부 의심 요소가 발견되었습니다. 주의가 필요합니다.',
    low: '위험 요소가 발견되지 않았습니다.',
  }

  return {
    riskLevel,
    summary: summaries[riskLevel],
    evidences: [
      { id: 'e1', title: '의심 도메인', description: '공식 도메인과 유사한 위장 주소를 사용하고 있습니다.' },
      { id: 'e2', title: '긴급성 유도 문구', description: '"즉시", "지금 바로" 등 조급함을 유발하는 표현이 포함되어 있습니다.' },
      { id: 'e3', title: '개인정보 입력 요구', description: '비밀번호·계좌번호 등 민감 정보를 요구합니다.' },
    ],
  }
}

export default function HomePage() {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)

  const inputType = detectInputType(input)

  const handleAnalyze = async () => {
    if (!input.trim() || loading) return
    setLoading(true)
    setResult(null)
    try {
      const analysis = await analyzeInput(input, inputType)
      setResult(analysis)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white px-5 py-6 flex flex-col gap-6">
      <header>
        <h1 className="text-xl font-bold text-t1">피싱 위험 분석</h1>
        <p className="text-sm text-t2 mt-1">이메일 본문이나 URL을 붙여넣으면 위험도를 분석해드려요.</p>
      </header>

      <section className="bg-surface rounded-2xl border border-line p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-t1">분석할 내용 입력</span>
          {input && (
            <span className="text-xs px-2 py-1 rounded-full bg-tint-line text-blue font-semibold">
              {inputType === 'url' ? 'URL 감지됨' : '텍스트 감지됨'}
            </span>
          )}
        </div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="이메일 본문 전체 또는 http(s):// 로 시작하는 URL을 붙여넣으세요"
          rows={6}
          className="w-full px-4 py-3 rounded-xl border border-line text-t1 placeholder-t3 resize-none focus:outline-none focus:border-blue bg-white"
        />
        <p className="text-xs text-t2 flex items-center gap-1">
          🔒 붙여넣은 내용은 이름·번호가 가려진 뒤 안전하게 분석돼요
        </p>
        <button
          onClick={handleAnalyze}
          disabled={!input.trim() || loading}
          className="w-full py-3 bg-blue text-white font-bold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? '분석 중...' : '분석하기'}
        </button>
      </section>

      <section className="flex flex-col gap-3">
        <span className="text-sm font-semibold text-t1">분석 결과</span>
        {!result && !loading && (
          <div className="bg-surface rounded-2xl border border-line p-6 text-center text-sm text-t3">
            아직 분석 결과가 없습니다.
          </div>
        )}
        {loading && (
          <div className="bg-surface rounded-2xl border border-line p-6 text-center text-sm text-t2">
            분석하고 있습니다...
          </div>
        )}
        {result && (
          <div className={`rounded-2xl border p-4 flex flex-col gap-3 ${RISK_META[result.riskLevel].box}`}>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${RISK_META[result.riskLevel].badge}`}>
                {RISK_META[result.riskLevel].label}
              </span>
              <span className="text-sm font-semibold">{result.summary}</span>
            </div>
            <div className="flex flex-col gap-2">
              {result.evidences.map((evidence) => (
                <div key={evidence.id} className="bg-white/70 rounded-xl border border-line p-3">
                  <p className="text-sm font-semibold text-t1">{evidence.title}</p>
                  <p className="text-xs text-t2 mt-1">{evidence.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="bg-surface rounded-2xl border border-line p-4 flex flex-col gap-2">
        <span className="text-sm font-semibold text-t1">긴급할 땐 바로 연락하세요</span>
        <div className="flex gap-2">
          <a href="tel:1332" className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-blue/10 text-blue font-bold">
            <IoCall size={16} className="text-black" />
            금융감독원 1332
          </a>
          <a href="tel:112" className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-high-bg text-high-text font-bold">
            <IoCall size={16} className="text-black" />
            경찰 112
          </a>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <span className="text-sm font-semibold text-t1">이번 주 피싱 트렌드 TOP 3</span>
        <div className="flex flex-col gap-2">
          {TREND_ITEMS.map((item, index) => (
            <div key={item.id} className="bg-surface rounded-2xl border border-line p-3 flex items-start gap-3">
              <span className="w-7 h-7 shrink-0 flex items-center justify-center rounded-full bg-blue text-white text-xs font-bold">
                {index + 1}
              </span>
              <div>
                <p className="text-sm font-semibold text-t1">{item.title}</p>
                <p className="text-xs text-t2 mt-1">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}