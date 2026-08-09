import { NavLink } from 'react-router-dom'

export default function TopNav() {
  return (
    <nav className="fixed top-0 left-0 right-0 bg-white border-b border-line flex justify-around py-4">
      <NavLink to="/home">홈</NavLink>
      <NavLink to="/history">이력</NavLink>
      <NavLink to="/chat">챗봇</NavLink>
      <NavLink to="/family">가족</NavLink>
      <NavLink to="/mypage">마이페이지</NavLink>
    </nav>
  )
}