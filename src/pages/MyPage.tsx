import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { getMyProfile, patchMyProfile } from '../api/userApi'
import type { UserProfile } from '../api/userApi'
import { deleteWhitelist, getWhitelists, postWhitelist } from '../api/whitelistApi'
import type { WhitelistItem } from '../api/whitelistApi'
import {
  IoPencilOutline,
  IoCheckmarkOutline,
  IoCloseOutline,
  IoLogOutOutline,
  IoAddOutline,
  IoTrashOutline,
  IoCallOutline,
} from 'react-icons/io5'

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '날짜 없음'
  const [year, month, day] = dateStr.split('T')[0].split('-')
  return `${year}.${month}.${day}`
}

export default function MyPage() {
  const { logout } = useAuth()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileError, setProfileError] = useState<string | null>(null)

  const [whitelist, setWhitelist] = useState<WhitelistItem[]>([])
  const [whitelistLoading, setWhitelistLoading] = useState(true)
  const [whitelistError, setWhitelistError] = useState<string | null>(null)

  const [isEditingName, setIsEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [nameSubmitting, setNameSubmitting] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)

  const [senderInput, setSenderInput] = useState('')
  const [labelInput, setLabelInput] = useState('')
  const [whitelistFormError, setWhitelistFormError] = useState<string | null>(null)
  const [whitelistSubmitting, setWhitelistSubmitting] = useState(false)

  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false)

  useEffect(() => {
    let active = true
    setProfileLoading(true)
    setProfileError(null)
    getMyProfile()
      .then((data) => { if (active) setProfile(data) })
      .catch(() => { if (active) setProfileError('내 정보를 불러오지 못했습니다.') })
      .finally(() => { if (active) setProfileLoading(false) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    let active = true
    setWhitelistLoading(true)
    setWhitelistError(null)
    getWhitelists()
      .then((list) => { if (active) setWhitelist(list) })
      .catch(() => { if (active) setWhitelistError('화이트리스트를 불러오지 못했습니다.') })
      .finally(() => { if (active) setWhitelistLoading(false) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsLogoutConfirmOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleStartEditName = () => {
    if (!profile) return
    setNameInput(profile.name)
    setNameError(null)
    setIsEditingName(true)
  }

  const handleCancelEditName = () => {
    setIsEditingName(false)
    setNameError(null)
  }

  const handleSaveName = async () => {
    const trimmed = nameInput.trim()
    if (!trimmed) return
    setNameSubmitting(true)
    setNameError(null)
    try {
      const updated = await patchMyProfile(trimmed)
      setProfile(updated)
      setIsEditingName(false)
    } catch {
      setNameError('이름 변경에 실패했습니다.')
    } finally {
      setNameSubmitting(false)
    }
  }

  const handleAddWhitelist = async () => {
    const trimmedSender = senderInput.trim()
    const trimmedLabel = labelInput.trim()
    if (!trimmedSender || !trimmedLabel) {
      setWhitelistFormError('발신번호와 메모를 모두 입력해주세요.')
      return
    }
    const isDuplicate = whitelist.some((item) => item.sender === trimmedSender)
    if (isDuplicate) {
      setWhitelistFormError('이미 등록된 발신번호예요.')
      return
    }

    setWhitelistSubmitting(true)
    setWhitelistFormError(null)
    try {
      const newItem = await postWhitelist(trimmedSender, trimmedLabel)
      setWhitelist((prev) => [newItem, ...prev])
      setSenderInput('')
      setLabelInput('')
    } catch {
      setWhitelistFormError('화이트리스트 등록에 실패했습니다.')
    } finally {
      setWhitelistSubmitting(false)
    }
  }

  const handleDeleteWhitelist = async (whitelistId: number) => {
    setWhitelistError(null)
    try {
      await deleteWhitelist(whitelistId)
      setWhitelist((prev) => prev.filter((item) => item.whitelistId !== whitelistId))
    } catch {
      setWhitelistError('삭제에 실패했습니다.')
    }
  }

  const handleLogout = async () => {
    await logout()
    setIsLogoutConfirmOpen(false)
  }

  return (
    <div className="min-h-screen bg-white px-5 py-6 flex flex-col gap-6">
      <header>
        <h1 className="text-xl font-bold text-t1">마이페이지</h1>
        <p className="text-sm text-t2 mt-1">내 정보와 화이트리스트를 관리하세요.</p>
      </header>

      <section className="bg-surface rounded-2xl border border-line p-4 flex flex-col gap-4">
        {profileLoading && (
          <div className="flex items-center justify-center py-6">
            <span className="w-5 h-5 border-2 border-blue border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {!profileLoading && profileError && (
          <div className="bg-high-bg border border-high-line rounded-2xl p-4 text-center text-sm text-high-text">
            {profileError}
          </div>
        )}
        {!profileLoading && !profileError && profile && (
          <div className="flex items-center gap-4">
            <span className="w-16 h-16 shrink-0 rounded-full bg-char-disc text-blue text-xl font-bold flex items-center justify-center overflow-hidden">
              {profile.name.charAt(0)}
            </span>

            <div className="min-w-0 flex-1">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    autoFocus
                    maxLength={20}
                    className="min-w-0 flex-1 text-sm font-semibold text-t1 bg-white border border-line rounded-lg px-2 py-1.5 outline-none focus:border-blue"
                  />
                  <button
                    onClick={handleSaveName}
                    disabled={nameSubmitting}
                    aria-label="이름 저장"
                    className="shrink-0 text-blue p-1 disabled:opacity-40"
                  >
                    <IoCheckmarkOutline size={18} />
                  </button>
                  <button onClick={handleCancelEditName} aria-label="이름 수정 취소" className="shrink-0 text-t3 p-1">
                    <IoCloseOutline size={18} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <p className="text-base font-bold text-t1 truncate">{profile.name}</p>
                  <button onClick={handleStartEditName} aria-label="이름 수정" className="shrink-0 text-t3 p-1">
                    <IoPencilOutline size={14} />
                  </button>
                </div>
              )}
              {nameError && <p className="text-xs text-high-text mt-1">{nameError}</p>}
              <p className="text-xs text-t2 mt-1">{profile.phoneNumber}</p>
              <p className="text-xs text-t3 mt-0.5">가입일 {formatDate(profile.createdAt)}</p>
            </div>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <span className="text-sm font-semibold text-t1">화이트리스트 관리</span>
        <p className="text-xs text-t2 -mt-1">등록한 발신번호는 위험 탐지에서 제외돼요.</p>

        <div className="bg-surface rounded-2xl border border-line p-4 flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <input
              value={senderInput}
              onChange={(e) => { setSenderInput(e.target.value); setWhitelistFormError(null) }}
              placeholder="발신번호 (예: 010-1234-5678)"
              className="text-sm text-t1 bg-white border border-line rounded-lg px-3 py-1.5 outline-none focus:border-blue"
            />
            <div className="flex items-center gap-2">
              <input
                value={labelInput}
                onChange={(e) => { setLabelInput(e.target.value); setWhitelistFormError(null) }}
                placeholder="메모 (예: 지인, 카드사)"
                className="min-w-0 flex-1 text-sm text-t1 bg-white border border-line rounded-lg px-3 py-1.5 outline-none focus:border-blue"
              />
              <button
                onClick={handleAddWhitelist}
                disabled={whitelistSubmitting}
                aria-label="화이트리스트 추가"
                className="shrink-0 w-8 h-8 rounded-lg bg-blue text-white flex items-center justify-center disabled:opacity-40"
              >
                <IoAddOutline size={18} />
              </button>
            </div>
          </div>
          {whitelistFormError && <p className="text-xs text-high-text">{whitelistFormError}</p>}

          <div className="flex flex-col gap-2">
            {whitelistLoading && (
              <div className="flex items-center justify-center py-6">
                <span className="w-5 h-5 border-2 border-blue border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {!whitelistLoading && whitelistError && (
              <div className="bg-high-bg border border-high-line rounded-2xl p-4 text-center text-sm text-high-text">
                {whitelistError}
              </div>
            )}
            {!whitelistLoading && !whitelistError && whitelist.length === 0 && (
              <p className="text-center text-sm text-t3 py-4">등록된 화이트리스트가 없습니다.</p>
            )}
            {!whitelistLoading && !whitelistError && whitelist.map((item) => (
              <div key={item.whitelistId} className="bg-white rounded-xl border border-line px-3 py-2.5 flex items-center gap-2">
                <span className="shrink-0 w-7 h-7 rounded-full bg-tint-line text-blue flex items-center justify-center">
                  <IoCallOutline size={13} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-t1 truncate">{item.sender} <span className="text-t3">· {item.label}</span></p>
                  <p className="text-xs text-t3">{formatDate(item.createdAt)} 등록</p>
                </div>
                <button
                  onClick={() => handleDeleteWhitelist(item.whitelistId)}
                  aria-label={`${item.sender} 삭제`}
                  className="shrink-0 text-t3 p-1"
                >
                  <IoTrashOutline size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <button
        onClick={() => setIsLogoutConfirmOpen(true)}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-high-line bg-high-bg text-high-text text-sm font-bold"
      >
        <IoLogOutOutline size={16} />
        로그아웃
      </button>

      {isLogoutConfirmOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-5"
          onClick={() => setIsLogoutConfirmOpen(false)}
        >
          <div
            className="w-full max-w-xs bg-white rounded-2xl p-5 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-semibold text-t1">로그아웃 하시겠어요?</p>
            <p className="text-xs text-t2">다시 로그인해야 서비스를 이용할 수 있어요.</p>
            <div className="flex gap-2">
              <button onClick={() => setIsLogoutConfirmOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-line text-t2 font-semibold text-sm">
                취소
              </button>
              <button onClick={handleLogout}
                className="flex-1 py-2.5 rounded-xl bg-high text-white font-semibold text-sm">
                로그아웃
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
