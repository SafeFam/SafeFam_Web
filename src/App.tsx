import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom'
import TopNav from './components/TopNav'
import PrivateRoute from './components/PrivateRoute'
import LoginPage from './pages/LoginPage'
import OnboardingPage from './pages/OnboardingPage'
import HomePage from './pages/HomePage'
import HistoryPage from './pages/HistoryPage'
import ChatPage from './pages/ChatPage'
import FamilyPage from './pages/FamilyPage'
import MyPage from './pages/MyPage'
import { AuthProvider } from './contexts/AuthContext'

/** 상단 네비가 있는 화면들의 공통 껍데기. TopNav가 fixed h-16이라 그만큼 본문을 내린다. */
function NavLayout() {
  return (
    <>
      <TopNav />
      <div className="pt-16">
        <Outlet />
      </div>
    </>
  )
}

/**
 * 본문 폭 제한.
 *
 * 온보딩(랜딩)은 배경색이 화면 끝까지 닿아야 해서 이 껍데기를 쓰지 않고
 * 섹션마다 안쪽에서 직접 폭을 잡는다.
 */
function ContentLayout() {
  return (
    <div className="mx-auto max-w-3xl px-6">
      <Outlet />
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<NavLayout />}>
            <Route path="/" element={<OnboardingPage />} />

            <Route element={<ContentLayout />}>
              <Route path="/home" element={<PrivateRoute><HomePage /></PrivateRoute>} />
              <Route path="/history" element={<PrivateRoute><HistoryPage /></PrivateRoute>} />
              <Route path="/chat" element={<PrivateRoute><ChatPage /></PrivateRoute>} />
              <Route path="/family" element={<PrivateRoute><FamilyPage /></PrivateRoute>} />
              <Route path="/mypage" element={<PrivateRoute><MyPage /></PrivateRoute>} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
