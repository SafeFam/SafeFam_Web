import api from './axios'

interface ApiResponse<T> {
  status: number
  message: string
  data: T
}

export interface ChatMessage {
  role: string
  content: string
}

export async function postChat(analysisId: number | null, messages: ChatMessage[]): Promise<ChatMessage> {
  const { data } = await api.post<ApiResponse<{ message: ChatMessage }>>('/api/v1/chat', {
    analysisId,
    messages,
  })
  return data.data.message
}
