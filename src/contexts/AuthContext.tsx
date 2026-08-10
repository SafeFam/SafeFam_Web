import { createContext, useCallback, useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ACCESS_TOKEN_KEY } from '../api/axios'
import { login as loginRequest, logout as logoutRequest } from '../api/auth'

interface AuthContextValue {
  isLoggedIn: boolean
  login: (phoneNumber: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const [isLoggedIn, setIsLoggedIn] = useState(() => Boolean(sessionStorage.getItem(ACCESS_TOKEN_KEY)))

  const login = useCallback(async (phoneNumber: string, password: string) => {
    await loginRequest(phoneNumber, password)
    setIsLoggedIn(true)
  }, [])

  const logout = useCallback(async () => {
    await logoutRequest()
    setIsLoggedIn(false)
    navigate('/login')
  }, [navigate])

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}