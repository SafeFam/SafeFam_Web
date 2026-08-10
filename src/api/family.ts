import api from './axios'
import type { AnalysisStatus, PhishingCategory, RiskLevel } from './analyses'

interface ApiResponse<T> {
  status: number
  message: string
  data: T
}

export interface FamilyMember {
  linkId: number
  wardId: number
  wardNickname: string | null
  wardPhone: string
  relationship: string
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
