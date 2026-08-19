import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { IoEyeOutline, IoEyeOffOutline, IoArrowBack, IoCheckmarkCircle } from 'react-icons/io5'
import logo from '../assets/logo.png'
import {
  isValidPhoneNumber,
  passwordError,
  resetPassword,
  sendPhoneVerification,
  verifyPhoneCode,
} from '../api/auth'
import type { ApiResponse } from '../api/types'

/**
 * 진행 단계.
 *
 * 앱(`reset_password_screen.dart`)과 같이 한 화면에서 단계별로 펼친다.
 * 인증을 마치기 전에 새 비밀번호를 받아봐야 서버가 거부하므로 순서를 강제한다.
 */
type Step = 'PHONE' | 'CODE' | 'PASSWORD'

function errorMessageOf(error: unknown, fallback: string): string {
  if (!isAxiosError(error)) return fallback
  const body = error.response?.data as Partial<ApiResponse<unknown>> | undefined
  return body?.message?.trim() || fallback
}

export default function ResetPasswordPage() {
  const navigate = useNavigate()

  const [step, setStep] = useState<Step>('PHONE')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const handleSendCode = async () => {
    setError('')
    setNotice('')
    if (!isValidPhoneNumber(phone.trim())) {
      setError('010으로 시작하는 휴대폰 번호를 입력해 주세요.')
      return
    }
    setSubmitting(true)
    try {
      await sendPhoneVerification(phone.trim())
      setStep('CODE')
      setNotice('인증번호를 보냈어요. 문자를 확인해 주세요.')
    } catch (err) {
      setError(errorMessageOf(err, '인증번호를 보내지 못했어요. 잠시 후 다시 시도해 주세요.'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleVerifyCode = async () => {
    setError('')
    setNotice('')
    if (!/^\d{6}$/.test(code.trim())) {
      setError('인증번호 6자리를 입력해 주세요.')
      return
    }
    setSubmitting(true)
    try {
      await verifyPhoneCode(phone.trim(), code.trim())
      setStep('PASSWORD')
      setNotice('인증이 완료됐어요. 새 비밀번호를 정해 주세요.')
    } catch (err) {
      setError(errorMessageOf(err, '인증번호가 맞지 않아요. 다시 확인해 주세요.'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleResetPassword = async () => {
    setError('')
    setNotice('')
    const invalid = passwordError(password)
    if (invalid) {
      setError(invalid)
      return
    }
    if (password !== passwordConfirm) {
      setError('두 비밀번호가 서로 달라요.')
      return
    }
    setSubmitting(true)
    try {
      await resetPassword(phone.trim(), password)
      setDone(true)
    } catch (err) {
      setError(errorMessageOf(err, '비밀번호를 바꾸지 못했어요. 잠시 후 다시 시도해 주세요.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white px-6">
        <IoCheckmarkCircle size={56} className="text-low mb-4" />
        <h1 className="text-title-lg text-t1 mb-1">비밀번호를 바꿨어요</h1>
        <p className="text-body text-t2 mb-8 text-center">새 비밀번호로 로그인해 주세요.</p>
        <button
          onClick={() => navigate('/login')}
          className="w-full max-w-sm py-3 bg-blue text-white text-button rounded-xl"
        >
          로그인하러 가기
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white px-6 py-10">
      <img src={logo} alt="SafeFam" className="w-20 h-20 mb-4 rounded-full" />
      <h1 className="text-title-lg text-t1 mb-1">비밀번호 재설정</h1>
      <p className="text-body text-t2 mb-8 text-center">
        가입할 때 쓴 휴대폰 번호로 본인 확인을 해요.
      </p>

      <div className="w-full max-w-sm flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="phone" className="text-body-strong text-t1">휴대전화 번호</label>
          <div className="flex items-center gap-2">
            <input
              id="phone"
              type="tel"
              placeholder="010-0000-0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              // 인증을 통과한 뒤 번호가 바뀌면 서버의 인증 상태와 어긋난다.
              disabled={step !== 'PHONE'}
              className="min-w-0 flex-1 px-4 py-3 rounded-xl border border-line text-t1 placeholder-t3 focus:outline-none focus:border-blue disabled:bg-surface disabled:text-t2"
            />
            {step === 'PHONE' && (
              <button
                onClick={handleSendCode}
                disabled={submitting}
                className="shrink-0 px-4 py-3 rounded-xl bg-blue text-white text-button disabled:opacity-40"
              >
                인증
              </button>
            )}
          </div>
        </div>

        {step !== 'PHONE' && (
          <div className="flex flex-col gap-1">
            <label htmlFor="code" className="text-body-strong text-t1">인증번호</label>
            <div className="flex items-center gap-2">
              <input
                id="code"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="6자리 숫자"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                disabled={step !== 'CODE'}
                className="min-w-0 flex-1 px-4 py-3 rounded-xl border border-line text-t1 placeholder-t3 focus:outline-none focus:border-blue disabled:bg-surface disabled:text-t2"
              />
              {step === 'CODE' && (
                <button
                  onClick={handleVerifyCode}
                  disabled={submitting}
                  className="shrink-0 px-4 py-3 rounded-xl bg-blue text-white text-button disabled:opacity-40"
                >
                  확인
                </button>
              )}
            </div>
          </div>
        )}

        {step === 'PASSWORD' && (
          <>
            <div className="flex flex-col gap-1">
              <label htmlFor="new-password" className="text-body-strong text-t1">새 비밀번호</label>
              <div className="relative">
                <input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="영문·숫자 8자 이상"
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

            <div className="flex flex-col gap-1">
              <label htmlFor="new-password-confirm" className="text-body-strong text-t1">새 비밀번호 확인</label>
              <input
                id="new-password-confirm"
                type={showPassword ? 'text' : 'password'}
                placeholder="한 번 더 입력"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-line text-t1 placeholder-t3 focus:outline-none focus:border-blue"
              />
            </div>

            <button
              onClick={handleResetPassword}
              disabled={submitting}
              className="w-full py-3 bg-blue text-white text-button rounded-xl mt-2 disabled:opacity-40"
            >
              {submitting ? '바꾸는 중...' : '비밀번호 바꾸기'}
            </button>
          </>
        )}

        {notice && !error && (
          <p className="text-body text-blue" role="status">{notice}</p>
        )}
        {error && (
          <p className="text-body text-high" role="alert">{error}</p>
        )}

        <button
          onClick={() => navigate('/login')}
          className="flex items-center justify-center gap-1 text-body text-t2 mt-1 hover:text-blue"
        >
          <IoArrowBack size={16} />
          로그인으로 돌아가기
        </button>
      </div>
    </div>
  )
}
