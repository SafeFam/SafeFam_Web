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

/**
 * 휴대폰 인증번호(6자리) 발송. 회원가입·비밀번호 재설정·계정 잠금 해제가 같은 API를 쓴다.
 */
export async function sendPhoneVerification(phoneNumber: string): Promise<void> {
  await api.post('/api/v1/auth/phone-verifications/send', { phoneNumber })
}

/**
 * 인증번호 검증.
 *
 * ★성공하면 **서버가 그 번호를 '인증됨' 상태로 기억한다.** 뒤따르는 재설정 요청은
 * 코드를 다시 싣지 않고 이 상태를 소비하는 방식이라, 재설정 전에 반드시 통과해야 한다.
 */
export async function verifyPhoneCode(phoneNumber: string, code: string): Promise<void> {
  await api.post('/api/v1/auth/phone-verifications/verify', { phoneNumber, code })
}

/**
 * 비밀번호 재설정.
 *
 * 요청 바디에 인증 코드가 **없다**. 위 `verifyPhoneCode`로 만들어둔 서버측 인증 상태를
 * 소비하므로, 인증을 건너뛰고 부르면 실패한다.
 */
export async function resetPassword(phoneNumber: string, newPassword: string): Promise<void> {
  await api.post('/api/v1/auth/password/reset', { phoneNumber, newPassword })
}

/**
 * 비밀번호 정책 검사. 통과하면 `undefined`, 아니면 사용자에게 보여줄 사유를 돌려준다.
 *
 * 백엔드 `PasswordResetRequest`의 `^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,64}$`와 같은 규칙이다.
 * 서버가 어차피 막지만, 무엇이 틀렸는지는 여기서 짚어줘야 사용자가 고칠 수 있다.
 */
export function passwordError(password: string): string | undefined {
  if (password.length < 8 || password.length > 64) return '비밀번호는 8자 이상 64자 이하여야 해요.'
  if (!/^[A-Za-z\d]+$/.test(password)) return '비밀번호는 영문과 숫자만 사용할 수 있어요.'
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return '비밀번호는 영문과 숫자를 모두 포함해야 해요.'
  return undefined
}

/** 백엔드가 받는 번호 형태(`^010-?\d{4}-?\d{4}$`)인지 검사한다. */
export function isValidPhoneNumber(phoneNumber: string): boolean {
  return /^010-?\d{4}-?\d{4}$/.test(phoneNumber)
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
