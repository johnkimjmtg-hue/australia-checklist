import { useState } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { loadState, AppState } from './store/state'
import LandingPage from './pages/LandingPage'
import ChecklistPage from './pages/ChecklistPage'
import AdminPage from './pages/AdminPage'
import BingoPage from './pages/BingoPage'

// ── 메인 앱
function MainApp() {
  const navigate = useNavigate()
  const [state, setState] = useState<AppState>(() => loadState())

  return (
    <div className="app-shell">
      <ChecklistPage state={state} setState={setState} onLanding={() => navigate('/')} />
    </div>
  )
}

// ── 랜딩 페이지
function LandingWrapper() {
  const navigate = useNavigate()
  const [state] = useState<AppState>(() => loadState())
  return (
    <div className="app-shell">
      <LandingPage
        state={state}
        onStart={() => navigate('/app')}
        onServices={() => navigate('/app?tab=services')}
      />
    </div>
  )
}

// ── Admin 래퍼
function AdminWrapper() {
  const navigate = useNavigate()
  return (
    <div className="app-shell">
      <AdminPage onBack={() => navigate('/')} />
    </div>
  )
}

// ── 빙고 페이지
function BingoWrapper() {
  const navigate = useNavigate()
  return (
    <div className="app-shell">
      <BingoPage onBack={() => navigate('/')} />
    </div>
  )
}

// ── 라우터
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"         element={<LandingWrapper />} />
        <Route path="/app"      element={<MainApp />} />
        <Route path="/admin"    element={<AdminWrapper />} />
        <Route path="/bingo"    element={<BingoWrapper />} />
        <Route path="*"         element={<LandingWrapper />} />
      </Routes>
      <Analytics />
    </BrowserRouter>
  )
}
