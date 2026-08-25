import api from './axios'
import type { ApiResponse } from './types'

export type InputType = 'url' | 'email'

/**
 * 분석 처리 상태.
 *
 * 종료 상태는 `COMPLETED` · `PARTIAL_SUCCESS` · `FAILED` 셋이며, 이 중
 * 점수·등급을 신뢰할 수 있는 건 앞의 둘뿐이다. `PARTIAL_SUCCESS`는 외부 AI
 * 일부가 실패했을 때의 **안전모드 정상 결과**이므로 완료와 같이 렌더한다.
 */
export type AnalysisStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'PARTIAL_SUCCESS'
  | 'FAILED'

/** 결과(점수·등급)를 신뢰할 수 있는 상태인지. */
export function hasResult(status: AnalysisStatus): boolean {
  return status === 'COMPLETED' || status === 'PARTIAL_SUCCESS'
}

/** 더 이상 폴링할 필요가 없는 상태인지. */
export function isTerminal(status: AnalysisStatus): boolean {
  return hasResult(status) || status === 'FAILED'
}

/**
 * 실패한 분석 트랙 토큰을 사용자에게 보여줄 한국어 레이어명으로 바꾼다.
 *
 * 서버가 주는 값은 `TEXT:GEMINI`·`URL:VIRUSTOTAL`처럼 **영어 + 내부 엔진명**이라
 * 그대로 노출하면 안 된다. 앞부분(레이어군)만 취해 3중 스코어 레이어로 환원하고,
 * 모르는 토큰이면 `null`을 돌려 안내에서 생략한다.
 */
export function failedTrackLabel(track: string): string | null {
  switch (track.split(':')[0]?.trim().toUpperCase()) {
    case 'TEXT':
      return '문맥 분석'
    case 'URL':
      return '링크 보안 분석'
    case 'RULES':
      return '글자 패턴 분석'
    case 'PIPELINE':
      return '전체 분석'
    default:
      return null
  }
}

/** 부분성공 안내에 쓸 한국어 레이어명 목록(중복 제거). */
export function failedTrackLabels(tracks: string[] | null): string[] {
  if (!tracks) return []
  const labels = new Set<string>()
  for (const track of tracks) {
    const label = failedTrackLabel(track)
    if (label) labels.add(label)
  }
  return [...labels]
}

/**
 * 분석 결과 피드백 유형. 백엔드 `FeedbackType` enum과 값이 일치해야 한다.
 * - `CORRECT` 판정이 정확함
 * - `FALSE_POSITIVE` 오탐(위험하다 했는데 실제로는 안전)
 * - `FALSE_NEGATIVE` 미탐(안전하다 했는데 실제로는 위험)
 */
export type FeedbackType = 'CORRECT' | 'FALSE_POSITIVE' | 'FALSE_NEGATIVE'

/** 피드백 버튼 구성. 두 페이지(홈·이력)가 공유한다. */
export const FEEDBACK_OPTIONS: { type: FeedbackType; label: string }[] = [
  { type: 'CORRECT', label: '정확해요' },
  { type: 'FALSE_POSITIVE', label: '실제로는 안전했어요' },
  { type: 'FALSE_NEGATIVE', label: '실제로는 위험했어요' },
]

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH'
export type PhishingCategory =
  | 'FINANCIAL_INSTITUTION'
  | 'GOVERNMENT_AGENCY'
  | 'LOAN'
  | 'JOB'
  | 'DELIVERY'
  | 'MESSENGER'
  | 'OTHER'

/**
 * 피싱 유형의 한국어 이름. 유형을 보여주는 화면이 여럿이라 여기 한 벌만 둔다.
 * (홈·가족·이력에 각자 복사본이 있었다.)
 */
export const CATEGORY_LABEL: Record<PhishingCategory, string> = {
  FINANCIAL_INSTITUTION: '금융기관 사칭',
  GOVERNMENT_AGENCY: '정부기관 사칭',
  LOAN: '대출 사기',
  JOB: '일자리 사기',
  DELIVERY: '택배 사칭',
  MESSENGER: '메신저 사칭',
  OTHER: '기타',
}

export interface Indicator {
  type: string
  description: string
}

export interface RecommendedAction {
  type: string
  label: string
  phoneNumber: string | null
  url: string | null
}

export interface PostAnalysisResult {
  analysisId: number
  status: AnalysisStatus
}

/** 사용자 언어로 정리한 위험 근거 카드(`evidenceCards`, 0~5개). */
export interface EvidenceCard {
  category: EvidenceCategory | string
  title: string
  description: string
}

/**
 * 근거 카드 카테고리. 정본은 AI 쪽(`app/analysis/evidence.py`)이라 값이 늘 수
 * 있으므로, 타입은 열어두고(`| string`) 모르는 값도 카드 자체는 보여준다.
 */
export type EvidenceCategory =
  | 'INSTITUTION_IMPERSONATION'
  | 'PERSONAL_INFO_REQUEST'
  | 'DANGEROUS_URL'
  | 'URGENCY_PRESSURE'
  | 'AI_JUDGMENT'

/**
 * 분석 출처별 원점수(0~100). 셋 다 없을 수 있다 — 분석이 끝나기 전이면 통째로
 * 없고, 부분성공이면 못 돌린 트랙만 null이다. **없는 값을 0으로 읽으면 안 된다**
 * (막대가 조용히 0으로 그려진다 — 앱에서 실제로 났던 버그, SafeFam_FE #116).
 */
export interface ScoreBreakdown {
  textScore: number | null
  urlScore: number | null
  rulesScore: number | null
}

export interface AnalysisDetail {
  analysisId: number
  status: AnalysisStatus
  riskScore: number | null
  riskLevel: RiskLevel | null
  category: PhishingCategory | null
  explanation: string | null
  failureCode: string | null
  failedTracks: string[] | null
  scoreBreakdown: ScoreBreakdown | null
  evidenceCards: EvidenceCard[] | null
  indicators: Indicator[] | null
  urls: string[] | null
  recommendedActions: RecommendedAction[] | null
  analyzedAt: string | null
}

/** 3분할 점수 막대에 쓸 사용자 라벨. 내부 엔진명은 절대 노출하지 않는다. */
export const SCORE_BREAKDOWN_LABEL: Record<keyof ScoreBreakdown, string> = {
  textScore: '문자 문맥 분석',
  urlScore: 'URL 분석',
  rulesScore: '금융 규칙 분석',
}

/**
 * 사용자에게 내보내도 되는 근거 카드만 남긴다.
 *
 * ★`AI_JUDGMENT` 카드의 설명은 AI 텍스트 분석의 `reason`을 **그대로** 옮긴
 * 값이라, 분석기가 내부 상태를 적어 보낼 때가 있다 — "The confident stacking
 * model decision was used." 같은 영어 문구가 실제로 온다(SafeFam_AI
 * `hybrid_analyzer.py`, 미수정). 정작 이 기능의 이슈(AI #64)가 "내부 기술·모델
 * 이름을 노출하지 않는다"를 제약으로 못박고 있으므로 걸러서 내보낸다.
 *
 * 판별은 **한글이 한 글자라도 있는지**로 한다. 카드 문구는 전부 한국어라,
 * 영어 문구 목록을 쫓아다니는 것보다 이쪽이 덜 깨진다(AI가 내부 문구를 새로
 * 추가해도 자동으로 걸린다).
 */
export function presentableEvidenceCards(
  cards: EvidenceCard[] | null | undefined
): EvidenceCard[] {
  return (cards ?? []).filter(
    (card) =>
      card?.title?.trim() &&
      card?.description?.trim() &&
      /[가-힣]/.test(card.description)
  )
}

export interface AnalysisListItem {
  analysisId: number
  status: AnalysisStatus
  riskScore: number | null
  riskLevel: RiskLevel | null
  category: PhishingCategory | null
  explanation: string | null
  analyzedAt: string | null
  receivedAt: string
}

export interface AnalysisListParams {
  page?: number
  size?: number
  riskLevel?: RiskLevel
  category?: PhishingCategory
  from?: string
  to?: string
}

export interface AnalysisListPage {
  content: AnalysisListItem[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

export async function postAnalysis(content: string, _inputType: InputType): Promise<PostAnalysisResult> {
  const { data } = await api.post<ApiResponse<PostAnalysisResult>>('/api/v1/analyses', {
    clientMessageId: crypto.randomUUID(),
    sender: '',
    content,
    receivedAt: new Date().toISOString(),
    source: 'MANUAL',
  })
  return data.data
}

export async function getAnalysis(analysisId: number): Promise<AnalysisDetail> {
  const { data } = await api.get<ApiResponse<AnalysisDetail>>(`/api/v1/analyses/${analysisId}`)
  return data.data
}

export async function getAnalysisList(params: AnalysisListParams): Promise<AnalysisListPage> {
  const { data } = await api.get<ApiResponse<AnalysisListPage>>('/api/v1/analyses', { params })
  return data.data
}

export async function postFeedback(
  analysisId: number,
  type: FeedbackType,
  comment?: string
): Promise<void> {
  await api.post(`/api/v1/analyses/${analysisId}/feedback`, { type, comment })
}

export async function deleteAnalysis(analysisId: number): Promise<void> {
  await api.delete(`/api/v1/analyses/${analysisId}`)
}