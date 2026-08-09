import { BrowserRouter, Routes, Route } from 'react-router-dom'
import TopNav from './components/TopNav'

function App() {
  return (
    <BrowserRouter>
      <TopNav />
      <div className="pt-16">
        <Routes>
          <Route path="/" element={<div>온보딩</div>} />
          <Route path="/home" element={<div>홈</div>} />
          <Route path="/history" element={<div>이력</div>} />
          <Route path="/chat" element={<div>챗봇</div>} />
          <Route path="/family" element={<div>가족</div>} />
          <Route path="/mypage" element={<div>마이페이지</div>} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App