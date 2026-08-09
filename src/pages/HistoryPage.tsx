import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

type RiskLevel = 'high' | 'med' | 'low'
type InputType = 'url' | 'email'
type PeriodFilter = '7' | '30' | '90' | 'all'
type RiskFilter = 'all' | RiskLevel
type FeedbackType = 'correct' | 'safe' | 'dangerous'

interface Evidence {
  id: string
  title: string
  description: string
}

interface HistoryItem {
  id: string
  date: string
  inputType: InputType
  riskLevel: RiskLevel
  resultSummary: string
  evidences: Evidence[]
  response: string[]
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

const PERIOD_OPTIONS: { value: PeriodFilter; label: string }[] = [
  { value: '7', label: '7일' },
  { value: '30', label: '30일' },
  { value: '90', label: '90일' },
  { value: 'all', label: '전체' },
]

const RISK_OPTIONS: { value: RiskFilter; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'high', label: '위험' },
  { value: 'med', label: '주의' },
  { value: 'low', label: '안전' },
]

// TODO: API 연동 시 실제 이력 목록 요청으로 교체 — GET /api/v1/analyses
const HISTORY_ITEMS: HistoryItem[] = [
  {
    id: '1',
    date: '2026-08-08',
    inputType: 'url',
    riskLevel: 'high',
    resultSummary: '피싱 의심 사이트 및 개인정보 탈취 시도가 감지되었습니다.',
    evidences: [
      { id: 'e1', title: '의심 도메인', description: '공식 도메인과 유사한 위장 주소를 사용하고 있습니다.' },
      { id: 'e2', title: '긴급성 유도 문구', description: '"즉시", "지금 바로" 등 조급함을 유발하는 표현이 포함되어 있습니다.' },
    ],
    response: ['발신자와 안내 내용을 공식 앱에서 한 번 더 확인하세요.', '링크를 클릭하지 마세요.'],
  },
  {
    id: '2',
    date: '2026-08-05',
    inputType: 'email',
    riskLevel: 'med',
    resultSummary: '일부 의심 요소가 발견되었습니다. 주의가 필요합니다.',
    evidences: [
      { id: 'e1', title: '의심 링크', description: '본문 내 URL이 공식 사이트와 다릅니다.' },
    ],
    response: ['공식 홈페이지에서 직접 확인하세요.'],
  },
  {
    id: '3',
    date: '2026-07-30',
    inputType: 'email',
    riskLevel: 'low',
    resultSummary: '위험 요소가 발견되지 않았습니다.',
    evidences: [],
    response: [],
  },
]

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

export default function HistoryPage() {
  const navigate = useNavigate()
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all')
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('all')
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null)
  const [feedback, setFeedback] = useState<FeedbackType | null>(null)

  const filteredItems = useMemo(() => {
    const now = new Date()
    return HISTORY_ITEMS.filter((item) => {
      if (riskFilter !== 'all' && item.riskLevel !== riskFilter) return false
      if (periodFilter !== 'all') {
        const days = Number(periodFilter)
        const diffMs = now.getTime() - new Date(item.date).getTime()
        const diffDays = diffMs / (1000 * 60 * 60 * 24)
        if (diffDays > days) return false
      }
      return true
    })
  }, [periodFilter, riskFilter])

  const handleFeedback = (type: FeedbackType) => {
    setFeedback(type)
    // TODO: API 연동 — POST /api/v1/analyses/{analysisId}/feedback
  }

  return (
    <div className="min-h-screen bg-white px-5 py-6 flex flex-col gap-6">
      <header>
        <h1 className="text-xl font-bold text-t1">탐지 이력</h1>
        <p className="text-sm text-t2 mt-1">지금까지 분석한 내역을 확인해보세요.</p>
      </header>

      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          {PERIOD_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setPeriodFilter(option.value)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                periodFilter === option.value
                  ? 'bg-blue text-white border-blue'
                  : 'bg-white text-t2 border-line'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 overflow-x-auto">
          {RISK_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setRiskFilter(option.value)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                riskFilter === option.value
                  ? 'bg-t1 text-white border-t1'
                  : 'bg-white text-t2 border-line'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        {filteredItems.length === 0 && (
          <div className="bg-surface rounded-2xl border border-line p-6 text-center text-sm text-t3">
            조건에 맞는 이력이 없습니다.
          </div>
        )}
        {filteredItems.map((item) => (
          <button
            key={item.id}
            onClick={() => { setSelectedItem(item); setFeedback(null) }}
            className="text-left bg-surface rounded-2xl border border-line p-4 flex flex-col gap-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-t3">{formatDate(item.date)}</span>
                <span className="text-xs text-t3">·</span>
                <span className="text-xs text-t3">{item.inputType === 'url' ? 'URL' : '텍스트'}</span>
              </div>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${RISK_META[item.riskLevel].badge}`}>
                {RISK_META[item.riskLevel].label}
              </span>
            </div>
            <p className="text-sm text-t1 line-clamp-2">{item.resultSummary}</p>
          </button>
        ))}
      </section>

      {selectedItem && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-5"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="w-full max-w-sm max-h-[80vh] overflow-y-auto bg-white rounded-2xl p-5 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-t3">{formatDate(selectedItem.date)}</span>
                <span className="text-xs text-t3">·</span>
                <span className="text-xs text-t3">{selectedItem.inputType === 'url' ? 'URL' : '텍스트'}</span>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-t3 text-sm font-bold px-2"
                aria-label="닫기"
              >
                ✕
              </button>
            </div>

            <div className={`rounded-2xl border p-4 flex flex-col gap-3 ${RISK_META[selectedItem.riskLevel].box}`}>
              <div className="flex items-center gap-2">
                <span className={`shrink-0 text-xs font-bold px-3 py-1 rounded-full ${RISK_META[selectedItem.riskLevel].badge}`}>
                  {RISK_META[selectedItem.riskLevel].label}
                </span>
                <span className="text-sm font-semibold">{selectedItem.resultSummary}</span>
              </div>
              {selectedItem.evidences.length > 0 && (
                <div className="flex flex-col gap-2">
                  {selectedItem.evidences.map((evidence) => (
                    <div key={evidence.id} className="bg-white/70 rounded-xl border border-line p-3">
                      <p className="text-sm font-semibold text-t1">{evidence.title}</p>
                      <p className="text-xs text-t2 mt-1">{evidence.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedItem.response.length > 0 && (
              <div className="bg-high-bg border border-high-line rounded-2xl p-4 flex flex-col gap-2">
                <p className="text-sm font-bold text-high-text">이렇게 대응하세요</p>
                {selectedItem.response.map((r, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-high mt-0.5">✓</span>
                    <p className="text-sm text-t1">{r}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <p className="text-sm font-semibold text-t1">이 분석이 정확했나요?</p>
              <p className="text-xs text-t2">알려주시면 탐지 정확도를 높이는 데 써요.</p>
              <div className="flex gap-2 flex-wrap">
                {([
                  { type: 'correct' as FeedbackType, label: '정확해요' },
                  { type: 'safe' as FeedbackType, label: '실제로는 안전했어요' },
                  { type: 'dangerous' as FeedbackType, label: '실제로는 위험했어요' },
                ]).map(({ type, label }) => (
                  <button
                    key={type}
                    onClick={() => handleFeedback(type)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
                      feedback === type
                        ? 'bg-blue text-white border-blue'
                        : 'bg-white text-t2 border-line'
                    }`}
                  >
                    {feedback === type ? '✓ ' : ''}{label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => { setSelectedItem(null); navigate('/chat') }}
              className="w-full py-3 bg-blue text-white font-bold rounded-xl flex items-center justify-center gap-2"
            >
              대응 방법 물어보기
            </button>
          </div>
        </div>
      )}
    </div>
  )
}