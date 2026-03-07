import { useState } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { loadState, AppState } from './store/state'
import LandingPage from './pages/LandingPage'
import ChecklistPage from './pages/ChecklistPage'
import AdminPage from './pages/AdminPage'

// ── 메인 앱
function MainApp() {
  const [state, setState] = useState<AppState>(() => loadState())

  return (
    <div className="app-shell">
      <ChecklistPage state={state} setState={setState} />
    </div>
  )
}

// ── 랜딩 페이지
function LandingWrapper() {
  const navigate = useNavigate()
  const [state] = useState<AppState>(() => loadState())
  return (
    <LandingPage
      state={state}
      onStart={() => navigate('/app')}
      onServices={() => navigate('/app?tab=services')}
    />
  )
}

// ── Admin 래퍼
function AdminWrapper() {
  const navigate = useNavigate()
  return <AdminPage onBack={() => navigate('/')} />
}

// ── 라우터
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"         element={<LandingWrapper />} />
        <Route path="/app"      element={<MainApp />} />
        <Route path="/admin"    element={<AdminWrapper />} />
        <Route path="*"         element={<LandingWrapper />} />
      </Routes>
    </BrowserRouter>
  )
}
