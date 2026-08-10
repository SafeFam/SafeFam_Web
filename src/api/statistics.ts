import api from './axios'
import type { PhishingCategory } from './analyses'
import type { ApiResponse } from './types'

export interface PhishingTypeTrend {
  category: PhishingCategory
  count: number
  ratio: number
}

export interface TrendsData {
  month: string
  sampleSize: number
  topPhishingTypes: PhishingTypeTrend[]
}

export async function getTrends(month?: string): Promise<TrendsData> {
  const { data } = await api.get<ApiResponse<TrendsData>>('/api/v1/statistics/trends', {
    params: month ? { month } : undefined,
  })
  return data.data
}
