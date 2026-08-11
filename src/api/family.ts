import api from './axios'
import type { AnalysisStatus, PhishingCategory, RiskLevel } from './analyses'
import type { ApiResponse } from './types'

export interface FamilyMember {
  linkId: number
  wardId: number
  /**
   * 피보호자가 가입 때 등록한 이름(서버 `User.name`).
   *
   * ★SafeFam_BE #97에서 `wardNickname`을 대체한 필드다. 예전 이름은 V1 레거시
   * 컬럼인 `User.nickname`을 읽어 **항상 null**이었고(어떤 가입 경로도 안 채웠다),
   * 그래서 가족 목록이 늘 마스킹된 전화번호로만 보였다. 이제 실제 이름이 온다.
   */
  wardName: string | null
  wardPhone: string
  relationship: string | null
  status: string
  linkedAt: string
}

export interface FamilyInvite {
  inviteCode: string
  qrToken: string
  expiresAt: string
}

export interface FamilyLogItem {
  analysisId: number
  status: AnalysisStatus
  maskedSender: string | null
  messagePreview: string | null
  riskScore: number | null
  riskLevel: RiskLevel | null
  category: PhishingCategory | null
  analyzedAt: string | null
}

export interface FamilyLogListParams {
  page?: number
  size?: number
}

export interface FamilyLogPage {
  content: FamilyLogItem[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

export async function getFamilyMembers(): Promise<FamilyMember[]> {
  const { data } = await api.get<ApiResponse<FamilyMember[]>>('/api/v1/family/members')
  return data.data
}

export async function postFamilyInvite(): Promise<FamilyInvite> {
  const { data } = await api.post<ApiResponse<FamilyInvite>>('/api/v1/family/invite')
  return data.data
}

export async function deleteFamilyMember(linkId: number): Promise<void> {
  await api.delete(`/api/v1/family/${linkId}`)
}

export async function patchFamilyMember(linkId: number, relationship: string): Promise<void> {
  await api.patch(`/api/v1/family/${linkId}`, { relationship })
}

export async function getFamilyWardLogs(wardId: number, params: FamilyLogListParams = {}): Promise<FamilyLogPage> {
  const { data } = await api.get<ApiResponse<FamilyLogPage>>(`/api/v1/family/ward/${wardId}/logs`, { params })
  return data.data
}
