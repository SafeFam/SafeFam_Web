import api from './axios'
import type { ApiResponse } from './types'

export interface UserProfile {
  userId: number
  phoneNumber: string
  name: string
  role: string
  createdAt: string
}

export async function getMyProfile(): Promise<UserProfile> {
  const { data } = await api.get<ApiResponse<UserProfile>>('/api/v1/users/me')
  return data.data
}

export async function patchMyProfile(name: string): Promise<UserProfile> {
  const { data } = await api.patch<ApiResponse<UserProfile>>('/api/v1/users/me', { name })
  return data.data
}
