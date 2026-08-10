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
