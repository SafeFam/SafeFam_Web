import api from './axios'

export type InputType = 'url' | 'email'
export type AnalysisStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH'
export type PhishingCategory =
  | 'FINANCIAL_INSTITUTION'
  | 'GOVERNMENT_AGENCY'
  | 'LOAN'
  | 'JOB'
  | 'DELIVERY'
  | 'MESSENGER'
  | 'OTHER'

interface ApiResponse<T> {
  status: number
  message: string
  data: T
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

export interface AnalysisDetail {
  analysisId: number
  status: AnalysisStatus
  riskScore: number | null
  riskLevel: RiskLevel | null
  category: PhishingCategory | null
  explanation: string | null
  failureCode: string | null
  failedTracks: string[] | null
  scoreBreakdown: Record<string, number> | null
  indicators: Indicator[] | null
  urls: string[] | null
  recommendedActions: RecommendedAction[] | null
  analyzedAt: string | null
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

export async function postFeedback(analysisId: number, feedback: string): Promise<void> {
  await api.post(`/api/v1/analyses/${analysisId}/feedback`, { feedback })
}

export async function deleteAnalysis(analysisId: number): Promise<void> {
  await api.delete(`/api/v1/analyses/${analysisId}`)
}