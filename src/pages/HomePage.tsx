import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IoCall } from 'react-icons/io5'
import {
  CATEGORY_LABEL,
  FEEDBACK_OPTIONS,
  failedTrackLabels,
  getAnalysis,
  hasResult,
  postAnalysis,
  postFeedback,
} from '../api/analyses'
import type {
  AnalysisDetail,
  FeedbackType,
  RiskLevel,
} from '../api/analyses'
import { getTrends } from '../api/statistics'
import type { TrendsData } from '../api/statistics'

type UiRiskLevel = 'high' | 'med' | 'low'
type InputType = 'url' | 'email'

// 백엔드 IndicatorType 전체. 빠진 종류가 있으면 `FINANCIAL_ACTION` 같은 영어
// enum 이름이 그대로 사용자에게 노출된다.
// ANALYSIS_TRACK_FAILURE는 위험 신호가 아니라 실패 통지라 여기에 두지 않고
// 부분성공 배너로 따로 안내한다.
const INDICATOR_TYPE_LABEL: Record<string, string> = {
  IMPERSONATION: '기관 사칭',
  FINANCIAL_ACTION: '금전 요구',
  SENSITIVE_INFORMATION: '개인정보 요구',
  URGENCY: '긴급성 압박',
  SHORTENED_URL: '단축 URL',
  MALICIOUS_URL: '악성 URL',
  AI_EVIDENCE: 'AI 분석 근거',
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
  const [feedbackError, setFeedbackError] = useState<string | null>(null)
  const [trends, setTrends] = useState<TrendsData | null>(null)
  const [trendsLoading, setTrendsLoading] = useState(true)

  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pollStoppedRef = useRef(false)

  const inputType = detectInputType(input)

  const stopPolling = () => {
    pollStoppedRef.current = true
    if (pollTimeoutRef.current !== null) {
      clearTimeout(pollTimeoutRef.current)
      pollTimeoutRef.current = null
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
    pollStoppedRef.current = false
    let attempts = 0

    const poll = async () => {
      if (pollStoppedRef.current) return
      attempts += 1
      try {
        const analysis = await getAnalysis(analysisId)
        if (pollStoppedRef.current) return
        // 부분성공도 결과가 있는 종료 상태다. 완료와 똑같이 렌더하고,
        // 어떤 분석이 빠졌는지는 아래 배너로 따로 알린다.
        if (hasResult(analysis.status)) {
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
        } else {
          pollTimeoutRef.current = setTimeout(poll, POLL_INTERVAL_MS)
        }
      } catch {
        if (pollStoppedRef.current) return
        stopPolling()
        setError('분석 결과를 불러오는 중 오류가 발생했습니다.')
        setLoading(false)
      }
    }

    pollTimeoutRef.current = setTimeout(poll, POLL_INTERVAL_MS)
  }

  const handleAnalyze = async () => {
    if (!input.trim() || loading) return
    stopPolling()
    setLoading(true)
    setResult(null)
    setError(null)
    setFeedback(null)
    setFeedbackError(null)
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
    setFeedbackError(null)
    try {
      await postFeedback(result.analysisId, type)
      setFeedback(type)
    } catch {
      setFeedbackError('피드백 전송에 실패했습니다.')
    } finally {
      setFeedbackSubmitting(false)
    }
  }

  const handleChat = () => {
    navigate('/chat', { state: { analysisId: result?.analysisId ?? null } })
  }

  const uiRiskLevel = result?.riskLevel ? RISK_LEVEL_MAP[result.riskLevel] : null
  const hasTrends = Boolean(trends && trends.sampleSize > 0 && trends.topPhishingTypes.length > 0)

  // 위험 근거 카드에는 실패 통지를 섞지 않는다. ANALYSIS_TRACK_FAILURE는 위험 신호가
  // 아니라 '이 분석을 못 돌렸다'는 알림이고, description이 영어 + 내부 엔진명이다.
  const riskSignals = (result?.indicators ?? []).filter(
    (indicator) => indicator.type !== 'ANALYSIS_TRACK_FAILURE'
  )
  // 빠진 분석 레이어. 전용 필드를 먼저 쓰고, 비어 있으면 지표에서 뽑는다
  // (서버가 지표 문자열을 파싱해 필드를 만들기 때문에 한쪽만 비는 경우가 있다).
  const missingLayers = (() => {
    const fromField = failedTrackLabels(result?.failedTracks ?? null)
    if (fromField.length > 0) return fromField
    const fromIndicators = (result?.indicators ?? [])
      .filter((indicator) => indicator.type === 'ANALYSIS_TRACK_FAILURE')
      .map((indicator) =>
        indicator.description.replace(/^Analysis track unavailable:\s*/i, '')
      )
    return failedTrackLabels(fromIndicators)
  })()
  const isPartial = result?.status === 'PARTIAL_SUCCESS'

  return (
    <div className="min-h-screen bg-white px-5 py-6 flex flex-col gap-6">
      <header>
        <h1 className="text-title-screen text-t1">피싱 위험 분석</h1>
        <p className="text-body text-t2 mt-1">이메일 본문이나 URL을 붙여넣으면 위험도를 분석해드려요.</p>
      </header>

      <section className="bg-surface rounded-2xl border border-line p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <label htmlFor="analysis-input" className="text-body-strong text-t1">분석할 내용 입력</label>
          {input && (
            <span className="text-section px-2 py-1 rounded-full bg-tint-line text-blue">
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
        <p className="text-caption text-t2 flex items-center gap-1">
          🔒 붙여넣은 내용은 이름·번호가 가려진 뒤 안전하게 분석돼요
        </p>
        <button
          onClick={handleAnalyze}
          disabled={!input.trim() || loading}
          className="w-full py-3 bg-blue text-white text-button rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? '분석 중...' : '분석하기'}
        </button>
      </section>

      <section className="flex flex-col gap-3">
        <span className="text-body-strong text-t1">분석 결과</span>
        {!result && !loading && !error && (
          <div className="bg-surface rounded-2xl border border-line p-6 text-center text-body text-t3">
            아직 분석 결과가 없습니다.
          </div>
        )}
        {loading && (
          <div className="bg-surface rounded-2xl border border-line p-6 text-center text-body text-t2">
            분석하고 있습니다...
          </div>
        )}
        {!loading && error && (
          <div className="bg-high-bg border border-high-line rounded-2xl p-6 text-center text-body text-high-text">
            {error}
          </div>
        )}
        {!loading && result && !uiRiskLevel && (
          <div className="bg-surface rounded-2xl border border-line p-6 text-center text-body text-t3">
            분석 결과를 표시할 수 없습니다.
          </div>
        )}
        {!loading && result && uiRiskLevel && (
          <>
            {isPartial && (
              <div className="bg-med/10 border border-med rounded-2xl p-4 flex flex-col gap-1">
                <p className="text-body-strong text-t1">일부 분석을 마치지 못했어요</p>
                {/* 결과 신뢰도가 낮다는 안전 안내라 보조 문구로 줄이지 않고 본문 크기로 둔다. */}
                <p className="text-body text-t2">
                  {missingLayers.length > 0
                    ? `${missingLayers.join(' · ')}을(를) 확인하지 못했습니다. `
                    : '일부 검사를 확인하지 못했습니다. '}
                  아래 결과는 남은 검사만으로 판단한 것이라, 실제 위험도가 더 높을 수 있어요.
                  링크·전화에 응답하기 전에 공식 번호로 한 번 더 확인하세요.
                </p>
              </div>
            )}
            <div className={`rounded-2xl border p-4 flex flex-col gap-3 ${RISK_META[uiRiskLevel].box}`}>
              <div className="flex items-center gap-2">
                <span className={`text-section px-3 py-1 rounded-full ${RISK_META[uiRiskLevel].badge}`}>
                  {RISK_META[uiRiskLevel].label}
                </span>
                <span className="text-body-strong">{result.explanation}</span>
              </div>
              {riskSignals.length > 0 && (
                <div className="flex flex-col gap-2">
                  {riskSignals.map((indicator, i) => (
                    <div key={i} className="bg-white/70 rounded-xl border border-line p-3">
                      <p className="text-body-strong text-t1">
                        {INDICATOR_TYPE_LABEL[indicator.type] ?? indicator.type}
                      </p>
                      <p className="text-caption text-t2 mt-1">{indicator.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {result.recommendedActions && result.recommendedActions.length > 0 && (
              <div className="bg-high-bg border border-high-line rounded-2xl p-4 flex flex-col gap-2">
                <p className="text-body-strong text-high-text">이렇게 대응하세요</p>
                {result.recommendedActions.map((action, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-high mt-0.5">✓</span>
                    <p className="text-body text-t1">{action.label}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-surface rounded-2xl border border-line p-4 flex flex-col gap-2">
              <p className="text-body-strong text-t1">이 분석이 정확했나요?</p>
              <div className="flex gap-2 flex-wrap">
                {FEEDBACK_OPTIONS.map(({ type, label }) => (
                  <button
                    key={type}
                    onClick={() => handleFeedback(type)}
                    disabled={Boolean(feedback) || feedbackSubmitting}
                    className={`px-3 py-1.5 rounded-full text-section border disabled:cursor-not-allowed ${
                      feedback === type
                        ? 'bg-blue text-white border-blue'
                        : 'bg-white text-t2 border-line disabled:opacity-40'
                    }`}
                  >
                    {feedback === type ? '✓ ' : ''}{label}
                  </button>
                ))}
              </div>
              {feedbackError && (
                <p className="text-caption text-high-text">{feedbackError}</p>
              )}
            </div>

            <button
              onClick={handleChat}
              className="w-full py-3 bg-blue text-white text-button rounded-xl"
            >
              챗봇과 대응 방법 상담하기
            </button>
          </>
        )}
      </section>

      <section className="bg-surface rounded-2xl border border-line p-4 flex flex-col gap-2">
        <span className="text-body-strong text-t1">긴급할 땐 바로 연락하세요</span>
        <div className="flex gap-2">
          <a href="tel:1332" className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-blue/10 text-blue text-button">
            <IoCall size={16} className="text-black" />
            금융감독원 1332
          </a>
          <a href="tel:112" className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-high-bg text-high-text text-button">
            <IoCall size={16} className="text-black" />
            경찰 112
          </a>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <span className="text-body-strong text-t1">이번 달 피싱 트렌드 TOP 3</span>
        {trendsLoading && (
          <div className="bg-surface rounded-2xl border border-line p-6 flex items-center justify-center">
            <span className="w-5 h-5 border-2 border-blue border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {!trendsLoading && !hasTrends && (
          <div className="bg-surface rounded-2xl border border-line p-6 text-center text-body text-t3">
            아직 트렌드 데이터가 없습니다.
          </div>
        )}
        {!trendsLoading && hasTrends && trends && (
          <div className="flex flex-col gap-2">
            {trends.topPhishingTypes.slice(0, 3).map((item, index) => (
              <div key={item.category} className="bg-surface rounded-2xl border border-line p-3 flex items-start gap-3">
                <span className="w-7 h-7 shrink-0 flex items-center justify-center rounded-full bg-blue text-white text-section">
                  {index + 1}
                </span>
                <div>
                  <p className="text-body-strong text-t1">{CATEGORY_LABEL[item.category]}</p>
                  <p className="text-caption text-t2 mt-1">{Math.round(item.ratio * 100)}% ({item.count}건)</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}