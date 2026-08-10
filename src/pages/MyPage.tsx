import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import {
  IoCameraOutline,
  IoPencilOutline,
  IoCheckmarkOutline,
  IoCloseOutline,
  IoLockClosedOutline,
  IoLogOutOutline,
  IoAddOutline,
  IoTrashOutline,
  IoCallOutline,
  IoLinkOutline,
} from 'react-icons/io5'

type ReportStatus = 'pending' | 'reviewing' | 'completed' | 'rejected'
type WhitelistType = 'phone' | 'url'

interface UserProfile {
  nickname: string
  phone: string
  joinDate: string
  profileImageUrl: string | null
}

interface ReportItem {
  id: string
  date: string
  summary: string
  status: ReportStatus
}

interface WhitelistItem {
  id: string
  type: WhitelistType
  value: string
  addedDate: string
}

const STATUS_META: Record<ReportStatus, { label: string; badge: string }> = {
  pending: { label: '접수 대기', badge: 'bg-track text-t2' },
  reviewing: { label: '검토중', badge: 'bg-med text-white' },
  completed: { label: '처리완료', badge: 'bg-low text-white' },
  rejected: { label: '반려', badge: 'bg-high text-white' },
}

// TODO: API 연동 시 실제 내 정보 요청으로 교체 — GET /api/v1/users/me
const INITIAL_PROFILE: UserProfile = {
  nickname: '사용자',
  phone: '010-1234-5678',
  joinDate: '2026-03-14',
  profileImageUrl: null,
}

// TODO: API 연동 시 실제 신고 내역 요청으로 교체 — GET /api/v1/analyses/{analysisId}/report
const REPORT_ITEMS: ReportItem[] = [
  { id: 'r1', date: '2026-08-07', summary: '택배 미수령 사칭 스미싱 문자를 신고했습니다.', status: 'completed' },
  { id: 'r2', date: '2026-08-02', summary: '가족 사칭 메신저 피싱 계정을 신고했습니다.', status: 'reviewing' },
  { id: 'r3', date: '2026-07-25', summary: '정부지원금 안내 사칭 사이트를 신고했습니다.', status: 'pending' },
  { id: 'r4', date: '2026-07-10', summary: '정상 발신 번호로 확인되어 신고가 반려되었습니다.', status: 'rejected' },
]

// TODO: API 연동 시 실제 화이트리스트 요청으로 교체 — GET /api/v1/whitelists
const INITIAL_WHITELIST: WhitelistItem[] = [
  { id: 'w1', type: 'phone', value: '010-2222-3333', addedDate: '2026-06-01' },
  { id: 'w2', type: 'url', value: 'safefam.co.kr', addedDate: '2026-06-15' },
]

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-')
  return `${year}.${month}.${day}`
}

function maskPhone(phone: string): string {
  const parts = phone.split('-')
  if (parts.length === 3) return `${parts[0]}-****-${parts[2]}`
  return phone
}

export default function MyPage() {
  const { logout } = useAuth()
  const [profile, setProfile] = useState<UserProfile>(INITIAL_PROFILE)
  const [reports] = useState<ReportItem[]>(REPORT_ITEMS)
  const [whitelist, setWhitelist] = useState<WhitelistItem[]>(INITIAL_WHITELIST)

  const [isEditingNickname, setIsEditingNickname] = useState(false)
  const [nicknameInput, setNicknameInput] = useState(profile.nickname)

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)

  const [whitelistType, setWhitelistType] = useState<WhitelistType>('phone')
  const [whitelistValue, setWhitelistValue] = useState('')
  const [whitelistError, setWhitelistError] = useState<string | null>(null)

  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false)

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsPasswordModalOpen(false)
        setIsLogoutConfirmOpen(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // TODO: 모달 접근성 개선 — focus trap, 초기 포커스, 포커스 복원 추후 추가

  const handleStartEditNickname = () => {
    setNicknameInput(profile.nickname)
    setIsEditingNickname(true)
  }

  const handleSaveNickname = () => {
    const trimmed = nicknameInput.trim()
    if (!trimmed) return
    // TODO: API 연동 — PATCH /api/v1/users/me
    setProfile((prev) => ({ ...prev, nickname: trimmed }))
    setIsEditingNickname(false)
  }

  const handleCancelEditNickname = () => {
    setNicknameInput(profile.nickname)
    setIsEditingNickname(false)
  }

  const handleChangePhoto = () => {
    // TODO: API 연동 시 파일 선택 및 프로필 사진 업로드 구현 — PATCH /api/v1/users/me
  }

  const openPasswordModal = () => {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setPasswordError(null)
    setIsPasswordModalOpen(true)
  }

  const handleSubmitPasswordChange = () => {
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('모든 항목을 입력해주세요.')
      return
    }
    if (!passwordRegex.test(newPassword)) {
      setPasswordError('새 비밀번호는 영문+숫자 8자리 이상이어야 해요.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('새 비밀번호가 일치하지 않아요.')
      return
    }
    // TODO: API 연동 — PATCH /api/v1/auth/password/reset
    setIsPasswordModalOpen(false)
  }

  const handleAddWhitelist = () => {
    const trimmed = whitelistValue.trim()
    if (!trimmed) return

    const isDuplicate = whitelist.some((item) => item.value === trimmed)
    if (isDuplicate) {
      setWhitelistError('이미 등록된 항목이에요.')
      return
    }

    if (whitelistType === 'phone' && !/^010-\d{4}-\d{4}$/.test(trimmed)) {
      setWhitelistError('전화번호 형식이 올바르지 않아요. (예: 010-1234-5678)')
      return
    }
    if (whitelistType === 'url' && !/^[\w.-]+\.[a-z]{2,}/.test(trimmed)) {
      setWhitelistError('URL 형식이 올바르지 않아요. (예: example.com)')
      return
    }

    // TODO: API 연동 — POST /api/v1/whitelists
    const newItem: WhitelistItem = {
      id: `w${Date.now()}`,
      type: whitelistType,
      value: trimmed,
      addedDate: new Date().toISOString().slice(0, 10),
    }
    setWhitelist((prev) => [newItem, ...prev])
    setWhitelistValue('')
    setWhitelistError(null)
  }

  const handleDeleteWhitelist = (id: string) => {
    // TODO: API 연동 — DELETE /api/v1/whitelists/{whitelistId}
    setWhitelist((prev) => prev.filter((item) => item.id !== id))
  }

  const handleLogout = async () => {
    await logout()
    setIsLogoutConfirmOpen(false)
  }

  return (
    <div className="min-h-screen bg-white px-5 py-6 flex flex-col gap-6">
      <header>
        <h1 className="text-xl font-bold text-t1">마이페이지</h1>
        <p className="text-sm text-t2 mt-1">내 정보와 신고 내역, 화이트리스트를 관리하세요.</p>
      </header>

      <section className="bg-surface rounded-2xl border border-line p-4 flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <span className="w-16 h-16 rounded-full bg-char-disc text-blue text-xl font-bold flex items-center justify-center overflow-hidden">
              {profile.profileImageUrl ? (
                <img src={profile.profileImageUrl} alt="프로필 사진" className="w-full h-full object-cover" />
              ) : (
                profile.nickname.charAt(0)
              )}
            </span>
            <button
              onClick={handleChangePhoto}
              aria-label="프로필 사진 변경"
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-blue text-white flex items-center justify-center border-2 border-white"
            >
              <IoCameraOutline size={13} />
            </button>
          </div>

          <div className="min-w-0 flex-1">
            {isEditingNickname ? (
              <div className="flex items-center gap-2">
                <input
                  value={nicknameInput}
                  onChange={(e) => setNicknameInput(e.target.value)}
                  autoFocus
                  maxLength={20}
                  className="min-w-0 flex-1 text-sm font-semibold text-t1 bg-white border border-line rounded-lg px-2 py-1.5 outline-none focus:border-blue"
                />
                <button onClick={handleSaveNickname} aria-label="닉네임 저장" className="shrink-0 text-blue p-1">
                  <IoCheckmarkOutline size={18} />
                </button>
                <button onClick={handleCancelEditNickname} aria-label="닉네임 수정 취소" className="shrink-0 text-t3 p-1">
                  <IoCloseOutline size={18} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <p className="text-base font-bold text-t1 truncate">{profile.nickname}</p>
                <button onClick={handleStartEditNickname} aria-label="닉네임 수정" className="shrink-0 text-t3 p-1">
                  <IoPencilOutline size={14} />
                </button>
              </div>
            )}
            <p className="text-xs text-t2 mt-1">{maskPhone(profile.phone)}</p>
            <p className="text-xs text-t3 mt-0.5">가입일 {formatDate(profile.joinDate)}</p>
          </div>
        </div>

        <button
          onClick={openPasswordModal}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-line text-t2 text-sm font-semibold"
        >
          <IoLockClosedOutline size={15} />
          비밀번호 변경
        </button>
      </section>

      <section className="flex flex-col gap-3">
        <span className="text-sm font-semibold text-t1">신고 내역</span>
        <div className="flex flex-col gap-2">
          {reports.length === 0 && (
            <div className="bg-surface rounded-2xl border border-line p-6 text-center text-sm text-t3">
              신고 내역이 없습니다.
            </div>
          )}
          {reports.map((report) => (
            <div key={report.id} className="bg-surface rounded-2xl border border-line p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-t3">{formatDate(report.date)}</span>
                <span className={`shrink-0 text-xs font-bold px-3 py-1 rounded-full ${STATUS_META[report.status].badge}`}>
                  {STATUS_META[report.status].label}
                </span>
              </div>
              <p className="text-sm text-t1 line-clamp-2">{report.summary}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <span className="text-sm font-semibold text-t1">화이트리스트 관리</span>
        <p className="text-xs text-t2 -mt-1">등록한 번호와 사이트는 위험 탐지에서 제외돼요.</p>

        <div className="bg-surface rounded-2xl border border-line p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="flex shrink-0 rounded-lg border border-line overflow-hidden">
              <button
                onClick={() => { setWhitelistType('phone'); setWhitelistError(null) }}
                className={`px-3 py-1.5 text-xs font-semibold ${whitelistType === 'phone' ? 'bg-blue text-white' : 'bg-white text-t2'}`}
              >
                번호
              </button>
              <button
                onClick={() => { setWhitelistType('url'); setWhitelistError(null) }}
                className={`px-3 py-1.5 text-xs font-semibold ${whitelistType === 'url' ? 'bg-blue text-white' : 'bg-white text-t2'}`}
              >
                URL
              </button>
            </div>
            <input
              value={whitelistValue}
              onChange={(e) => { setWhitelistValue(e.target.value); setWhitelistError(null) }}
              placeholder={whitelistType === 'phone' ? '010-0000-0000' : 'example.com'}
              className="min-w-0 flex-1 text-sm text-t1 bg-white border border-line rounded-lg px-3 py-1.5 outline-none focus:border-blue"
            />
            <button
              onClick={handleAddWhitelist}
              aria-label="화이트리스트 추가"
              className="shrink-0 w-8 h-8 rounded-lg bg-blue text-white flex items-center justify-center"
            >
              <IoAddOutline size={18} />
            </button>
          </div>
          {whitelistError && <p className="text-xs text-high-text">{whitelistError}</p>}

          <div className="flex flex-col gap-2">
            {whitelist.length === 0 && (
              <p className="text-center text-sm text-t3 py-4">등록된 화이트리스트가 없습니다.</p>
            )}
            {whitelist.map((item) => (
              <div key={item.id} className="bg-white rounded-xl border border-line px-3 py-2.5 flex items-center gap-2">
                <span className="shrink-0 w-7 h-7 rounded-full bg-tint-line text-blue flex items-center justify-center">
                  {item.type === 'phone' ? <IoCallOutline size={13} /> : <IoLinkOutline size={13} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-t1 truncate">{item.value}</p>
                  <p className="text-xs text-t3">{formatDate(item.addedDate)} 등록</p>
                </div>
                <button
                  onClick={() => handleDeleteWhitelist(item.id)}
                  aria-label={`${item.value} 삭제`}
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

      {isPasswordModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-5"
          onClick={() => setIsPasswordModalOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-2xl p-5 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <p className="text-base font-bold text-t1">비밀번호 변경</p>
              <button onClick={() => setIsPasswordModalOpen(false)} className="text-t3 text-sm font-bold px-2" aria-label="닫기">✕</button>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-t2">현재 비밀번호</label>
                <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                  className="text-sm text-t1 bg-white border border-line rounded-lg px-3 py-2 outline-none focus:border-blue" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-t2">새 비밀번호</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  className="text-sm text-t1 bg-white border border-line rounded-lg px-3 py-2 outline-none focus:border-blue" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-t2">새 비밀번호 확인</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  className="text-sm text-t1 bg-white border border-line rounded-lg px-3 py-2 outline-none focus:border-blue" />
              </div>
              {passwordError && <p className="text-xs text-high-text">{passwordError}</p>}
            </div>
            <button onClick={handleSubmitPasswordChange} className="w-full py-3 bg-blue text-white font-bold rounded-xl">
              변경하기
            </button>
          </div>
        </div>
      )}

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