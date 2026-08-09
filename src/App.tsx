import { BrowserRouter, Routes, Route } from 'react-router-dom'
import TopNav from './components/TopNav'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import HistoryPage from './pages/HistoryPage'

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
                <Route path="/chat" element={<div>챗봇</div>} />
                <Route path="/family" element={<div>가족</div>} />
                <Route path="/mypage" element={<div>마이페이지</div>} />
              </Routes>
            </div>
          </>
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App