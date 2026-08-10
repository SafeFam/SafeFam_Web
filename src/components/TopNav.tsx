import { NavLink, useNavigate } from 'react-router-dom'
import { IoLogOutOutline } from 'react-icons/io5'
import logo from '../assets/logo.png'
import { useAuth } from '../hooks/useAuth'

const TABS = [
  { to: '/home', label: '홈' },
  { to: '/history', label: '이력' },
  { to: '/chat', label: '챗봇' },
  { to: '/family', label: '가족' },
  { to: '/mypage', label: '마이페이지' },
]

export default function TopNav() {
  const { isLoggedIn, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logout()
    } catch {
      // 서버 로그아웃이 실패해도 로컬 세션은 정리된다(인터셉터가 처리).
      // 사용자를 로그인 화면에 세워두는 게 낫다.
      navigate('/login')
    }
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 h-16 bg-white/90 backdrop-blur border-b border-line">
      <div className="mx-auto flex h-full max-w-5xl items-center gap-6 px-6">
        {/* 브랜드 — 로고 + 워드마크 */}
        <NavLink to={isLoggedIn ? '/home' : '/'} className="flex shrink-0 items-center gap-2">
          <img src={logo} alt="" className="h-9 w-9 rounded-full" />
          <span className="text-title-screen text-blue">SafeFam</span>
        </NavLink>

        {isLoggedIn && (
          <>
            <ul className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
              {TABS.map((tab) => (
                <li key={tab.to} className="shrink-0">
                  <NavLink
                    to={tab.to}
                    className={({ isActive }) =>
                      [
                        'relative block rounded-chip px-4 py-2 text-body-strong transition-colors',
                        isActive
                          ? 'bg-bg text-blue'
                          : 'text-t2 hover:bg-surface hover:text-t1',
                      ].join(' ')
                    }
                  >
                    {tab.label}
                  </NavLink>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={handleLogout}
              className="flex shrink-0 items-center gap-1.5 rounded-chip px-3 py-2 text-caption text-t2 transition-colors hover:bg-surface hover:text-t1"
            >
              <IoLogOutOutline size={18} aria-hidden />
              로그아웃
            </button>
          </>
        )}

        {!isLoggedIn && (
          <div className="ml-auto shrink-0">
            <NavLink
              to="/login"
              className="rounded-chip bg-blue px-5 py-2 text-body-strong text-white transition-colors hover:bg-blue/90"
            >
              로그인
            </NavLink>
          </div>
        )}
      </div>
    </nav>
  )
}
