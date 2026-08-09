import api, { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, clearAuthStorage } from './axios'

interface AuthResponse {
  status: number
  message: string
  data: {
    tokenType: string
    accessToken: string
    refreshToken: string
    expiresIn: number
  }
}

export async function login(phoneNumber: string, password: string): Promise<void> {
  const { data } = await api.post<AuthResponse>('/api/v1/auth/login', {
    phoneNumber,
    password,
  })

  sessionStorage.setItem(ACCESS_TOKEN_KEY, data.data.accessToken)
  sessionStorage.setItem(REFRESH_TOKEN_KEY, data.data.refreshToken)
}

export async function logout(): Promise<void> {
  const refreshToken = sessionStorage.getItem(REFRESH_TOKEN_KEY)

  try {
    await api.post('/api/v1/auth/logout', { refreshToken })
  } catch {
    // 서버 로그아웃 요청이 실패해도 클라이언트 세션은 정리한다
  } finally {
    clearAuthStorage()
  }
}
