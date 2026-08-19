import { isAxiosError } from 'axios'

/**
 * 백엔드 공통 응답 포맷.
 *
 * `global/response/ApiResponse.java` 기준으로 `status`는 **문자열**이다.
 * 숫자 HTTP 상태 코드가 아니므로 분기할 때 주의한다.
 */
export interface ApiResponse<T> {
  status: 'SUCCESS' | 'ERROR'
  message: string
  data: T
}

/**
 * 실패한 요청에서 서버가 보낸 안내 문구를 꺼낸다.
 *
 * 서버 메시지가 사용자가 읽을 만한 한국어라 그대로 보여주는 편이 낫다.
 * 네트워크 단절처럼 응답 자체가 없는 경우엔 `undefined`를 돌려주니
 * 호출부에서 화면에 맞는 기본 문구로 받아야 한다.
 */
export function apiErrorMessage(error: unknown): string | undefined {
  if (!isAxiosError(error)) return undefined
  const body = error.response?.data as Partial<ApiResponse<unknown>> | undefined
  const message = body?.message?.trim()
  return message ? message : undefined
}
