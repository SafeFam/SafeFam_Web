import { BrowserRouter, Routes, Route } from 'react-router-dom'
import TopNav from './components/TopNav'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import HistoryPage from './pages/HistoryPage'
import ChatPage from './pages/ChatPage'
import FamilyPage from './pages/FamilyPage'
import MyPage from './pages/MyPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/*" element={
          <>
            <TopNav />
            <div className="pt-14 max-w-3xl mx-auto px-6">
              <Routes>
                <Route path="/" element={<div>온보딩</div>} />
                <Route path="/home" element={<HomePage />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/family" element={<FamilyPage />} />
                <Route path="/mypage" element={<MyPage />} />
              </Routes>
            </div>
          </>
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App