import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AxiosError } from 'axios'
import { IoEyeOutline, IoEyeOffOutline } from 'react-icons/io5'
import logo from '../assets/logo.png'
import { useAuth } from '../contexts/AuthContext'

interface ApiErrorResponse {
  status: number
  message: string
}

export default function LoginPage() {
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const { login } = useAuth()

  const handleLogin = async () => {
    setError('')
    try {
      await login(phone, password)
      navigate('/home')
    } catch (err) {
      const message = err instanceof AxiosError
        ? (err.response?.data as ApiErrorResponse | undefined)?.message
        : undefined
      setError(message ?? '전화번호 또는 비밀번호가 일치하지 않습니다.')
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white px-6">
      <img src={logo} alt="SafeFam" className="w-24 h-24 mb-4 rounded-full" />
      <h1 className="text-2xl font-bold text-t1 mb-1">로그인</h1>
      <p className="text-t2 text-sm mb-8">휴대폰 번호로 로그인하세요</p>

      <div className="w-full max-w-sm flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="phone" className="text-sm font-semibold text-t1">휴대전화 번호</label>
          <input
            id="phone"
            type="tel"
            placeholder="010-0000-0000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-line text-t1 placeholder-t3 focus:outline-none focus:border-blue"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="password" className="text-sm font-semibold text-t1">비밀번호</label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="비밀번호 입력"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-line text-t1 placeholder-t3 focus:outline-none focus:border-blue"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-t3"
              aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
            >
              {showPassword ? <IoEyeOutline size={18} /> : <IoEyeOffOutline size={18} />}
            </button>
          </div>
        </div>
        {error && <p className="text-high text-sm">{error}</p>}
        <button
          onClick={handleLogin}
          className="w-full py-3 bg-blue text-white font-bold rounded-xl mt-2"
        >
          로그인
        </button>
        <button
          onClick={() => {/* TODO: 비밀번호 재설정 */}}
          className="text-sm text-t2 mt-1 hover:text-blue"
        >
          비밀번호를 잊으셨나요?
        </button>
      </div>
    </div>
  )
}