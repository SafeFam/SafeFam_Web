import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IoTrashOutline } from 'react-icons/io5'
import {
  CATEGORY_LABEL,
  FEEDBACK_OPTIONS,
  getAnalysis,
  getAnalysisList,
  postFeedback,
  deleteAnalysis,
  displayExplanation,
  failedTrackLabels,
  presentableEvidenceCards,
  SCORE_BREAKDOWN_LABEL,
} from '../api/analyses'
import type {
  AnalysisDetail,
  AnalysisListItem,
  FeedbackType,
  PhishingCategory,
  RiskLevel,
  ScoreBreakdown,
} from '../api/analyses'

type UiRiskLevel = 'high' | 'med' | 'low'
type PeriodFilter = '7' | '30' | '90' | 'all'
type RiskFilter = 'all' | UiRiskLevel
type CategoryFilter = 'all' | PhishingCategory

const PAGE_SIZE = 20

const RISK_META: Record<UiRiskLevel, { label: string; badge: string; box: string }> = {
  high: { label: '위험', badge: 'bg-high text-white', box: 'bg-high-bg border-high-line text-high-text' },
  med: { label: '주의', badge: 'bg-med text-white', box: 'bg-med/10 border-med/30 text-med-text' },
  low: { label: '안전', badge: 'bg-low text-white', box: 'bg-low/10 border-low/30 text-t1' },
}

const INDICATOR_TYPE_LABEL: Record<string, string> = {
  AI_EVIDENCE: 'AI 분석 근거',
  MALICIOUS_URL: '악성 URL',
  SHORTENED_URL: '단축 URL',
  IMPERSONATION: '기관 사칭',
  ANALYSIS_TRACK_FAILURE: '분석 트랙 실패',
}

const RISK_LEVEL_MAP: Record<RiskLevel, UiRiskLevel> = { HIGH: 'high', MEDIUM: 'med', LOW: 'low' }
const RISK_LEVEL_TO_API: Record<UiRiskLevel, RiskLevel> = { high: 'HIGH', med: 'MEDIUM', low: 'LOW' }

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

// 유형 목록은 CATEGORY_LABEL에서 그대로 따온다. 백엔드에 유형이 늘면 여기도 같이 는다.
const CATEGORY_OPTIONS: { value: CategoryFilter; label: string }[] = [
  { value: 'all', label: '전체 유형' },
  ...(Object.keys(CATEGORY_LABEL) as PhishingCategory[]).map((value) => ({
    value,
    label: CATEGORY_LABEL[value],
  })),
]

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '날짜 없음'
  const [year, month, day] = dateStr.split('T')[0].split('-')
  return `${year}.${month}.${day}`
}

function toLocalDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function buildDateRange(period: PeriodFilter): { from?: string; to?: string } {
  if (period === 'all') return {}
  const days = Number(period)
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - days)
  return { from: toLocalDateString(from), to: toLocalDateString(to) }
}

export default function HistoryPage() {
  const navigate = useNavigate()
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all')
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')

  const [items, setItems] = useState<AnalysisListItem[]>([])
  const [page, setPage] = useState(0)
  const [last, setLast] = useState(true)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [selectedDetail, setSelectedDetail] = useState<AnalysisDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)

  // 서버가 사용자 언어로 정리해 보낸 근거 카드. 내부 문구가 실려 오는 경우는
  // 걸러진다(presentableEvidenceCards 설명 참고).
  const detailEvidence = presentableEvidenceCards(selectedDetail?.evidenceCards)
  // 위험 신호에는 실패 통지를 섞지 않는다. ANALYSIS_TRACK_FAILURE는 '이 분석을
  // 못 돌렸다'는 알림이고 description이 영어 + 내부 엔진명이라, 그대로 그리면
  // 사용자에게 `URL:VIRUSTOTAL` 같은 문자열이 나간다(홈은 이미 걸러내고 있었다).
  const detailSignals = (selectedDetail?.indicators ?? []).filter(
    (indicator) => indicator.type !== 'ANALYSIS_TRACK_FAILURE'
  )
  // 부분성공/실패 안내. 홈에는 있었는데 이력 상세에는 없어서, 같은 분석을
  // 이력에서 열면 '일부 검사를 못 돌렸다'는 사실이 통째로 사라졌다 — 점수만
  // 보이니 낮게 나온 결과가 '안전'으로 읽힌다.
  const detailPartial = selectedDetail?.status === 'PARTIAL_SUCCESS'
  const detailFailed = selectedDetail?.status === 'FAILED'
  const detailMissingLayers = (() => {
    const fromField = failedTrackLabels(selectedDetail?.failedTracks ?? null)
    if (fromField.length > 0) return fromField
    const fromIndicators = (selectedDetail?.indicators ?? [])
      .filter((indicator) => indicator.type === 'ANALYSIS_TRACK_FAILURE')
      .map((indicator) =>
        indicator.description.replace(/^Analysis track unavailable:\s*/i, '')
      )
    return failedTrackLabels(fromIndicators)
  })()
  // 3분할 점수. 값이 없는 트랙은 0이 아니라 '—'로 둔다.
  const detailBreakdown = (
    Object.keys(SCORE_BREAKDOWN_LABEL) as (keyof ScoreBreakdown)[]
  ).map((key) => ({
    key,
    label: SCORE_BREAKDOWN_LABEL[key],
    score: selectedDetail?.scoreBreakdown?.[key] ?? null,
  }))

  const [feedback, setFeedback] = useState<FeedbackType | null>(null)
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false)
  const [feedbackError, setFeedbackError] = useState<string | null>(null)

  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    setLoadMoreError(null)
    const { from, to } = buildDateRange(periodFilter)
    getAnalysisList({
      page: 0,
      size: PAGE_SIZE,
      riskLevel: riskFilter !== 'all' ? RISK_LEVEL_TO_API[riskFilter] : undefined,
      category: categoryFilter !== 'all' ? categoryFilter : undefined,
      from,
      to,
    })
      .then((res) => {
        if (!active) return
        setItems(res.content)
        setLast(res.last)
        setPage(0)
      })
      .catch(() => { if (active) setError('이력을 불러오지 못했습니다.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [periodFilter, riskFilter, categoryFilter])

  const handleLoadMore = async () => {
    if (loadingMore || last) return
    setLoadingMore(true)
    setLoadMoreError(null)
    try {
      const nextPage = page + 1
      const { from, to } = buildDateRange(periodFilter)
      const res = await getAnalysisList({
        page: nextPage,
        size: PAGE_SIZE,
        riskLevel: riskFilter !== 'all' ? RISK_LEVEL_TO_API[riskFilter] : undefined,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        from,
        to,
      })
      setItems((prev) => [...prev, ...res.content])
      setLast(res.last)
      setPage(nextPage)
    } catch {
      setLoadMoreError('추가 이력을 불러오지 못했습니다.')
    } finally {
      setLoadingMore(false)
    }
  }

  const handleSelectItem = async (analysisId: number) => {
    setModalOpen(true)
    setSelectedDetail(null)
    setDetailError(null)
    setFeedback(null)
    setFeedbackError(null)
    setDetailLoading(true)
    try {
      const detail = await getAnalysis(analysisId)
      setSelectedDetail(detail)
    } catch {
      setDetailError('상세 정보를 불러오지 못했습니다.')
    } finally {
      setDetailLoading(false)
    }
  }

  const handleDeleteClick = (e: React.MouseEvent, analysisId: number) => {
    e.stopPropagation()
    setDeleteTarget(analysisId)
  }

  const confirmDelete = async () => {
    if (deleteTarget === null) return
    setDeleteError(null)
    try {
      await deleteAnalysis(deleteTarget)
      setItems((prev) => prev.filter((item) => item.analysisId !== deleteTarget))
    } catch {
      setDeleteError('삭제에 실패했습니다.')
    } finally {
      setDeleteTarget(null)
    }
  }

  const closeModal = () => {
    setModalOpen(false)
    setSelectedDetail(null)
    setDetailError(null)
  }

  const handleFeedback = async (type: FeedbackType) => {
    if (!selectedDetail || feedback || feedbackSubmitting) return
    setFeedbackSubmitting(true)
    setFeedbackError(null)
    try {
      await postFeedback(selectedDetail.analysisId, type)
      setFeedback(type)
    } catch {
      setFeedbackError('피드백 전송에 실패했습니다.')
    } finally {
      setFeedbackSubmitting(false)
    }
  }

  const handleAskChat = () => {
    if (!selectedDetail) return
    const analysisId = selectedDetail.analysisId
    closeModal()
    navigate('/chat', { state: { analysisId } })
  }

  return (
    <div className="min-h-screen bg-white px-5 py-6 flex flex-col gap-6">
      <header>
        <h1 className="text-title-screen text-t1">탐지 이력</h1>
        <p className="text-body text-t2 mt-1">지금까지 분석한 내역을 확인해보세요.</p>
      </header>

      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          {PERIOD_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setPeriodFilter(option.value)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-section border ${
                periodFilter === option.value ? 'bg-blue text-white border-blue' : 'bg-white text-t2 border-line'
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
              className={`shrink-0 px-3 py-1.5 rounded-full text-section border ${
                riskFilter === option.value ? 'bg-t1 text-white border-t1' : 'bg-white text-t2 border-line'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 overflow-x-auto">
          {CATEGORY_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setCategoryFilter(option.value)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-section border ${
                categoryFilter === option.value ? 'bg-t1 text-white border-t1' : 'bg-white text-t2 border-line'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        {loading && (
          <div className="bg-surface rounded-2xl border border-line p-6 flex items-center justify-center">
            <span className="w-5 h-5 border-2 border-blue border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {!loading && error && (
          <div className="bg-high-bg border border-high-line rounded-2xl p-6 text-center text-body text-high-text">
            {error}
          </div>
        )}
        {!loading && !error && items.length === 0 && (
          <div className="bg-surface rounded-2xl border border-line p-6 text-center text-body text-t3">
            조건에 맞는 이력이 없습니다.
          </div>
        )}
        {!loading && !error && items.map((item) => {
          const uiRiskLevel = item.riskLevel ? RISK_LEVEL_MAP[item.riskLevel] : null
          return (
            <div
              key={item.analysisId}
              role="button"
              tabIndex={0}
              onClick={() => handleSelectItem(item.analysisId)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleSelectItem(item.analysisId)
                }
              }}
              className="text-left bg-surface rounded-2xl border border-line p-4 flex flex-col gap-2 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="text-caption text-t3">{formatDate(item.analyzedAt ?? item.receivedAt)}</span>
                  {/* 유형으로 거를 수 있게 됐으니 목록에서도 유형이 보여야 한다. */}
                  {item.category && (
                    <span className="truncate text-section text-t2">{CATEGORY_LABEL[item.category]}</span>
                  )}
                </span>
                <div className="flex items-center gap-2">
                  {uiRiskLevel && (
                    <span className={`text-section px-3 py-1 rounded-full ${RISK_META[uiRiskLevel].badge}`}>
                      {RISK_META[uiRiskLevel].label}
                    </span>
                  )}
                  <button
                    onClick={(e) => handleDeleteClick(e, item.analysisId)}
                    className="text-t3 hover:text-high p-1"
                    aria-label="삭제"
                  >
                    <IoTrashOutline size={14} />
                  </button>
                </div>
              </div>
              <p className="text-body text-t1 line-clamp-2">
                {displayExplanation(item.explanation) || '분석 결과를 확인해보세요.'}
              </p>
            </div>
          )
        })}
        {!loading && !error && deleteError && (
          <div className="bg-high-bg border border-high-line rounded-2xl p-3 text-center text-body text-high-text">
            {deleteError}
          </div>
        )}
        {!loading && !error && !last && items.length > 0 && (
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="w-full py-3 rounded-xl border border-line text-button text-t2 disabled:opacity-40"
          >
            {loadingMore ? '불러오는 중...' : '더 보기'}
          </button>
        )}
        {!loading && !error && loadMoreError && (
          <div className="bg-high-bg border border-high-line rounded-2xl p-3 text-center text-body text-high-text">
            {loadMoreError}
          </div>
        )}
      </section>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-5" onClick={closeModal}>
          <div className="w-full max-w-sm max-h-[80vh] overflow-y-auto bg-white rounded-2xl p-5 flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <span className="text-body-strong text-t1">분석 상세</span>
              <button onClick={closeModal} className="text-t3 text-body-strong px-2" aria-label="닫기">✕</button>
            </div>

            {detailLoading && (
              <div className="flex items-center justify-center py-10">
                <span className="w-6 h-6 border-2 border-blue border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {!detailLoading && detailError && (
              <div className="bg-high-bg border border-high-line rounded-2xl p-4 text-center text-body text-high-text">
                {detailError}
              </div>
            )}

            {!detailLoading && selectedDetail && (
              <>
                <span className="text-caption text-t3">{formatDate(selectedDetail.analyzedAt)}</span>

                {detailPartial && (
                  <div className="bg-med/10 border border-med rounded-2xl p-4 flex flex-col gap-1">
                    <p className="text-body-strong text-t1">일부 분석을 마치지 못했어요</p>
                    <p className="text-body text-t2">
                      {detailMissingLayers.length > 0
                        ? `${detailMissingLayers.join(' · ')}을(를) 확인하지 못했습니다. `
                        : '일부 검사를 확인하지 못했습니다. '}
                      아래 결과는 남은 검사만으로 판단한 것이라, 실제 위험도가 더 높을 수 있어요.
                      링크·전화에 응답하기 전에 공식 번호로 한 번 더 확인하세요.
                    </p>
                  </div>
                )}

                {/* 실패는 '안전'이 아니다. 점수·등급이 통째로 비어 있어 아무것도
                    안 그리면 빈 화면이 되고, 그게 '문제 없음'으로 읽힌다. */}
                {detailFailed && (
                  <div className="bg-high-bg border border-high-line rounded-2xl p-4 flex flex-col gap-1">
                    <p className="text-body-strong text-high-text">분석하지 못했어요</p>
                    <p className="text-body text-t2">
                      이 문자는 검사를 끝내지 못했습니다. <strong>안전하다는 뜻이 아닙니다.</strong>
                      링크·전화에 응답하기 전에 공식 앱이나 대표번호로 확인하세요.
                    </p>
                  </div>
                )}

                {selectedDetail.riskLevel && (
                  <div className={`rounded-2xl border p-4 flex flex-col gap-3 ${RISK_META[RISK_LEVEL_MAP[selectedDetail.riskLevel]].box}`}>
                    <div className="flex items-center gap-2">
                      <span className={`shrink-0 text-section px-3 py-1 rounded-full ${RISK_META[RISK_LEVEL_MAP[selectedDetail.riskLevel]].badge}`}>
                        {RISK_META[RISK_LEVEL_MAP[selectedDetail.riskLevel]].label}
                      </span>
                      <span className="text-body-strong">
                        {displayExplanation(selectedDetail.explanation)}
                      </span>
                    </div>
                    {detailEvidence.length > 0 && (
                      <div className="flex flex-col gap-2">
                        {detailEvidence.map((card, i) => (
                          <div key={`ev-${i}`} className="bg-white/70 rounded-xl border border-line p-3">
                            <p className="text-body-strong text-t1">{card.title}</p>
                            <p className="text-caption text-t2 mt-1">{card.description}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {detailSignals.length > 0 && (
                      <div className="flex flex-col gap-2">
                        {detailSignals.map((indicator, i) => (
                          <div key={i} className="bg-white/70 rounded-xl border border-line p-3">
                            <p className="text-body-strong text-t1">{INDICATOR_TYPE_LABEL[indicator.type] ?? indicator.type}</p>
                            <p className="text-caption text-t2 mt-1">{indicator.description}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {detailBreakdown.some((row) => row.score !== null) && (
                  <div className="bg-surface rounded-2xl border border-line p-4 flex flex-col gap-3">
                    <p className="text-body-strong text-t1">점수는 이렇게 나왔어요</p>
                    {detailBreakdown.map((row) => (
                      <div key={row.key} className="flex flex-col gap-1">
                        <div className="flex items-baseline justify-between">
                          <span className="text-body text-t2">{row.label}</span>
                          <span className="text-body-strong text-t1">
                            {row.score === null ? '—' : row.score}
                          </span>
                        </div>
                        {/* 빈 레일은 0점 막대와 구분이 안 된다(홈과 동일). */}
                        {row.score !== null && (
                          <div className="h-2 rounded-full bg-tint-line overflow-hidden">
                            <div
                              className="h-full rounded-full bg-blue"
                              style={{ width: `${Math.min(100, Math.max(0, row.score))}%` }}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {selectedDetail.recommendedActions && selectedDetail.recommendedActions.length > 0 && (
                  <div className="bg-high-bg border border-high-line rounded-2xl p-4 flex flex-col gap-2">
                    <p className="text-body-strong text-high-text">이렇게 대응하세요</p>
                    {selectedDetail.recommendedActions.map((action, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-high mt-0.5">✓</span>
                        <p className="text-body text-t1">{action.label}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <p className="text-body-strong text-t1">이 분석이 정확했나요?</p>
                  <p className="text-caption text-t2">알려주시면 탐지 정확도를 높이는 데 써요.</p>
                  <div className="flex gap-2 flex-wrap">
                    {FEEDBACK_OPTIONS.map(({ type, label }) => (
                      <button
                        key={type}
                        onClick={() => handleFeedback(type)}
                        disabled={Boolean(feedback) || feedbackSubmitting}
                        className={`px-3 py-1.5 rounded-full text-section border disabled:cursor-not-allowed ${
                          feedback === type ? 'bg-blue text-white border-blue' : 'bg-white text-t2 border-line disabled:opacity-40'
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

                <button onClick={handleAskChat} className="w-full py-3 bg-blue text-white text-button rounded-xl">
                  대응 방법 물어보기
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {deleteTarget !== null && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-5" onClick={() => setDeleteTarget(null)}>
          <div className="w-full max-w-xs bg-white rounded-2xl p-5 flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
            <p className="text-body-strong text-t1">이 분석 이력을 삭제할까요?</p>
            <p className="text-caption text-t2">삭제하면 복구할 수 없어요.</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 rounded-xl border border-line text-t2 text-button">
                취소
              </button>
              <button onClick={confirmDelete} className="flex-1 py-2.5 rounded-xl bg-high text-white text-button">
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}