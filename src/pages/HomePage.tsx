import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IoCall } from 'react-icons/io5'
import { getAnalysis, postAnalysis, postFeedback } from '../api/analyses'
import type { AnalysisDetail, PhishingCategory, RiskLevel } from '../api/analyses'
import { getTrends } from '../api/statistics'
import type { TrendsData } from '../api/statistics'

type UiRiskLevel = 'high' | 'med' | 'low'
type InputType = 'url' | 'email'
type FeedbackType = 'CORRECT' | 'SAFE' | 'DANGEROUS'

const INDICATOR_TYPE_LABEL: Record<string, string> = {
  AI_EVIDENCE: 'AI 분석 근거',
  MALICIOUS_URL: '악성 URL',
  SHORTENED_URL: '단축 URL',
  IMPERSONATION: '기관 사칭',
  ANALYSIS_TRACK_FAILURE: '분석 트랙 실패',
}

const RISK_META: Record<UiRiskLevel, { label: string; badge: string; box: string }> = {
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

const RISK_LEVEL_MAP: Record<RiskLevel, UiRiskLevel> = {
  HIGH: 'high',
  MEDIUM: 'med',
  LOW: 'low',
}

const CATEGORY_LABEL: Record<PhishingCategory, string> = {
  FINANCIAL_INSTITUTION: '금융기관 사칭',
  GOVERNMENT_AGENCY: '정부기관 사칭',
  LOAN: '대출 사기',
  JOB: '일자리 사기',
  DELIVERY: '택배 사칭',
  MESSENGER: '메신저 사칭',
  OTHER: '기타',
}

const FEEDBACK_OPTIONS: { type: FeedbackType; label: string }[] = [
  { type: 'CORRECT', label: '정확해요' },
  { type: 'SAFE', label: '실제로는 안전했어요' },
  { type: 'DANGEROUS', label: '실제로는 위험했어요' },
]

const MAX_POLL_ATTEMPTS = 20
const POLL_INTERVAL_MS = 1500

function detectInputType(value: string): InputType {
  return /^https?:\/\//i.test(value.trim()) ? 'url' : 'email'
}

export default function HomePage() {
  const navigate = useNavigate()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AnalysisDetail | null>(null)
  const [feedback, setFeedback] = useState<FeedbackType | null>(null)
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false)
  const [trends, setTrends] = useState<TrendsData | null>(null)
  const [trendsLoading, setTrendsLoading] = useState(true)

  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const inputType = detectInputType(input)

  const stopPolling = () => {
    if (pollIntervalRef.current !== null) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }
  }

  useEffect(() => stopPolling, [])

  useEffect(() => {
    let active = true
    setTrendsLoading(true)
    getTrends()
      .then((data) => { if (active) setTrends(data) })
      .catch(() => { if (active) setTrends(null) })
      .finally(() => { if (active) setTrendsLoading(false) })
    return () => { active = false }
  }, [])

  const startPolling = (analysisId: number) => {
    stopPolling()
    let attempts = 0
    pollIntervalRef.current = setInterval(async () => {
      attempts += 1
      try {
        const analysis = await getAnalysis(analysisId)
        if (analysis.status === 'COMPLETED') {
          stopPolling()
          setResult(analysis)
          setLoading(false)
        } else if (analysis.status === 'FAILED') {
          stopPolling()
          setError(analysis.explanation ?? '분석에 실패했습니다.')
          setLoading(false)
        } else if (attempts >= MAX_POLL_ATTEMPTS) {
          stopPolling()
          setError('분석이 지연되고 있습니다. 잠시 후 다시 시도해주세요.')
          setLoading(false)
        }
      } catch {
        stopPolling()
        setError('분석 결과를 불러오는 중 오류가 발생했습니다.')
        setLoading(false)
      }
    }, POLL_INTERVAL_MS)
  }

  const handleAnalyze = async () => {
    if (!input.trim() || loading) return
    stopPolling()
    setLoading(true)
    setResult(null)
    setError(null)
    setFeedback(null)
    try {
      const { analysisId } = await postAnalysis(input, inputType)
      startPolling(analysisId)
    } catch {
      setError('분석 요청 중 오류가 발생했습니다.')
      setLoading(false)
    }
  }

  const handleFeedback = async (type: FeedbackType) => {
    if (!result || feedback || feedbackSubmitting) return
    setFeedbackSubmitting(true)
    try {
      await postFeedback(result.analysisId, type)
      setFeedback(type)
    } finally {
      setFeedbackSubmitting(false)
    }
  }

  const handleChat = () => {
    navigate('/chat', { state: { analysisId: result?.analysisId ?? null } })
  }

  const uiRiskLevel = result?.riskLevel ? RISK_LEVEL_MAP[result.riskLevel] : null
  const hasTrends = Boolean(trends && trends.sampleSize > 0 && trends.topPhishingTypes.length > 0)

  return (
    <div className="min-h-screen bg-white px-5 py-6 flex flex-col gap-6">
      <header>
        <h1 className="text-xl font-bold text-t1">피싱 위험 분석</h1>
        <p className="text-sm text-t2 mt-1">이메일 본문이나 URL을 붙여넣으면 위험도를 분석해드려요.</p>
      </header>

      <section className="bg-surface rounded-2xl border border-line p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <label htmlFor="analysis-input" className="text-sm font-semibold text-t1">분석할 내용 입력</label>
          {input && (
            <span className="text-xs px-2 py-1 rounded-full bg-tint-line text-blue font-semibold">
              {inputType === 'url' ? 'URL 감지됨' : '텍스트 감지됨'}
            </span>
          )}
        </div>
        <textarea
          id="analysis-input"
          value={input}
          onChange={(e) => {
            setInput(e.target.value)
            setResult(null)
            setError(null)
          }}
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
        {!result && !loading && !error && (
          <div className="bg-surface rounded-2xl border border-line p-6 text-center text-sm text-t3">
            아직 분석 결과가 없습니다.
          </div>
        )}
        {loading && (
          <div className="bg-surface rounded-2xl border border-line p-6 text-center text-sm text-t2">
            분석하고 있습니다...
          </div>
        )}
        {!loading && error && (
          <div className="bg-high-bg border border-high-line rounded-2xl p-6 text-center text-sm text-high-text">
            {error}
          </div>
        )}
        {!loading && result && uiRiskLevel && (
          <>
            <div className={`rounded-2xl border p-4 flex flex-col gap-3 ${RISK_META[uiRiskLevel].box}`}>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${RISK_META[uiRiskLevel].badge}`}>
                  {RISK_META[uiRiskLevel].label}
                </span>
                <span className="text-sm font-semibold">{result.explanation}</span>
              </div>
              {result.indicators && result.indicators.length > 0 && (
                <div className="flex flex-col gap-2">
                  {result.indicators.map((indicator, i) => (
                    <div key={i} className="bg-white/70 rounded-xl border border-line p-3">
                      <p className="text-sm font-semibold text-t1">
                        {INDICATOR_TYPE_LABEL[indicator.type] ?? indicator.type}
                      </p>
                      <p className="text-xs text-t2 mt-1">{indicator.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {result.recommendedActions && result.recommendedActions.length > 0 && (
              <div className="bg-high-bg border border-high-line rounded-2xl p-4 flex flex-col gap-2">
                <p className="text-sm font-bold text-high-text">이렇게 대응하세요</p>
                {result.recommendedActions.map((action, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-high mt-0.5">✓</span>
                    <p className="text-sm text-t1">{action.label}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-surface rounded-2xl border border-line p-4 flex flex-col gap-2">
              <p className="text-sm font-semibold text-t1">이 분석이 정확했나요?</p>
              <div className="flex gap-2 flex-wrap">
                {FEEDBACK_OPTIONS.map(({ type, label }) => (
                  <button
                    key={type}
                    onClick={() => handleFeedback(type)}
                    disabled={Boolean(feedback) || feedbackSubmitting}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border disabled:cursor-not-allowed ${
                      feedback === type
                        ? 'bg-blue text-white border-blue'
                        : 'bg-white text-t2 border-line disabled:opacity-40'
                    }`}
                  >
                    {feedback === type ? '✓ ' : ''}{label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleChat}
              className="w-full py-3 bg-blue text-white font-bold rounded-xl"
            >
              챗봇과 대응 방법 상담하기
            </button>
          </>
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
        <span className="text-sm font-semibold text-t1">이번 달 피싱 트렌드 TOP 3</span>
        {trendsLoading && (
          <div className="bg-surface rounded-2xl border border-line p-6 flex items-center justify-center">
            <span className="w-5 h-5 border-2 border-blue border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {!trendsLoading && !hasTrends && (
          <div className="bg-surface rounded-2xl border border-line p-6 text-center text-sm text-t3">
            아직 트렌드 데이터가 없습니다.
          </div>
        )}
        {!trendsLoading && hasTrends && trends && (
          <div className="flex flex-col gap-2">
            {trends.topPhishingTypes.slice(0, 3).map((item, index) => (
              <div key={item.category} className="bg-surface rounded-2xl border border-line p-3 flex items-start gap-3">
                <span className="w-7 h-7 shrink-0 flex items-center justify-center rounded-full bg-blue text-white text-xs font-bold">
                  {index + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-t1">{CATEGORY_LABEL[item.category]}</p>
                  <p className="text-xs text-t2 mt-1">{Math.round(item.ratio * 100)}% ({item.count}건)</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}