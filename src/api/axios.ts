import axios from 'axios'
import type { AxiosError, InternalAxiosRequestConfig } from 'axios'

export const ACCESS_TOKEN_KEY = 'accessToken'
export const REFRESH_TOKEN_KEY = 'refreshToken'

interface ReissueResponse {
  status: number
  message: string
  data: {
    tokenType: string
    accessToken: string
    refreshToken: string
    expiresIn: number
  }
}

interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

export function clearAuthStorage() {
  sessionStorage.removeItem(ACCESS_TOKEN_KEY)
  sessionStorage.removeItem(REFRESH_TOKEN_KEY)
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 15000,
})

api.interceptors.request.use((config) => {
  const accessToken = sessionStorage.getItem(ACCESS_TOKEN_KEY)
  if (accessToken) {
    config.headers.set('Authorization', `Bearer ${accessToken}`)
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined

    if (error.response?.status !== 401 || !originalRequest || originalRequest._retry) {
      return Promise.reject(error)
    }

    const refreshToken = sessionStorage.getItem(REFRESH_TOKEN_KEY)
    if (!refreshToken) {
      clearAuthStorage()
      window.location.href = '/login'
      return Promise.reject(error)
    }

    originalRequest._retry = true

    try {
      // 인터셉터 재귀를 피하기 위해 커스텀 인스턴스가 아닌 axios를 직접 사용한다
      const { data } = await axios.post<ReissueResponse>(
        `${import.meta.env.VITE_API_URL}/api/v1/auth/reissue`,
        { refreshToken }
      )

      sessionStorage.setItem(ACCESS_TOKEN_KEY, data.data.accessToken)
      sessionStorage.setItem(REFRESH_TOKEN_KEY, data.data.refreshToken)

      originalRequest.headers.set('Authorization', `Bearer ${data.data.accessToken}`)
      return api(originalRequest)
    } catch (refreshError) {
      clearAuthStorage()
      window.location.href = '/login'
      return Promise.reject(refreshError)
    }
  }
)

export default api
