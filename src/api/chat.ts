import api from './axios'
import type { ApiResponse } from './types'

export interface ChatMessage {
  role: 'USER' | 'ASSISTANT'
  content: string
}

/**
 * 대응 챗봇에 대화를 보내고 답변 **문자열**을 받는다.
 *
 * 응답 계약이 요청과 다르다는 점에 주의. 보낼 땐 `{role, content}` 메시지 배열이지만,
 * 받을 땐 백엔드 `ChatResponse`가 `{ message: String }`이라 봉투를 벗기면 그냥 문자열이다.
 * (예전엔 이걸 메시지 객체로 착각해 `.content`를 읽었고, 답변이 와도 빈 말풍선이 떴다.)
 *
 * `analysisId`를 실으면 그 분석을 상담 컨텍스트로 쓴다. 없으면 일반 상담.
 */
export async function postChat(analysisId: number | null, messages: ChatMessage[]): Promise<string> {
  const { data } = await api.post<ApiResponse<{ message: string }>>('/api/v1/chat', {
    analysisId,
    messages,
  })

  const reply = data.data?.message?.trim()
  // 빈 답변을 그대로 렌더하면 원인 모를 빈 말풍선이 남는다. 에러로 올려 안내 문구를 띄운다.
  if (!reply) throw new Error('빈 챗봇 응답')
  return reply
}
