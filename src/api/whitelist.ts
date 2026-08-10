import api from './axios'
import type { ApiResponse } from './types'

export interface WhitelistItem {
  whitelistId: number
  sender: string
  label: string
  createdAt: string
}

export async function getWhitelists(): Promise<WhitelistItem[]> {
  const { data } = await api.get<ApiResponse<WhitelistItem[]>>('/api/v1/whitelists')
  return data.data
}

export async function postWhitelist(sender: string, label: string): Promise<WhitelistItem> {
  const { data } = await api.post<ApiResponse<WhitelistItem>>('/api/v1/whitelists', { sender, label })
  return data.data
}

export async function deleteWhitelist(whitelistId: number): Promise<void> {
  await api.delete(`/api/v1/whitelists/${whitelistId}`)
}
