import { BrowserRouter, Routes, Route } from 'react-router-dom'
import TopNav from './components/TopNav'
import PrivateRoute from './components/PrivateRoute'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import HistoryPage from './pages/HistoryPage'
import ChatPage from './pages/ChatPage'
import FamilyPage from './pages/FamilyPage'
import MyPage from './pages/MyPage'
import { AuthProvider } from './contexts/AuthContext'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*" element={
            <>
              <TopNav />
              <div className="pt-14 max-w-3xl mx-auto px-6">
                <Routes>
                  <Route path="/" element={<div>온보딩</div>} />
                  <Route path="/home" element={<PrivateRoute><HomePage /></PrivateRoute>} />
                  <Route path="/history" element={<PrivateRoute><HistoryPage /></PrivateRoute>} />
                  <Route path="/chat" element={<PrivateRoute><ChatPage /></PrivateRoute>} />
                  <Route path="/family" element={<PrivateRoute><FamilyPage /></PrivateRoute>} />
                  <Route path="/mypage" element={<PrivateRoute><MyPage /></PrivateRoute>} />
                </Routes>
              </div>
            </>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App