import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { loadState, AppState } from './store/state'
import { syncDataCache } from './lib/dataCache'
import ChecklistPage from './pages/ChecklistPage'
import AdminPage from './pages/AdminPage'
import logoImg from './assets/logo.png'

function MainApp() {
  const [state, setState] = useState<AppState>(() => loadState())
  const [ready, setReady] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // 캐시 확인 후 앱 진입
    setReady(true)
    // 백그라운드에서 캐시 동기화 (새로고침해도 캐시 있으면 DB 안 읽음)
    syncDataCache().catch(e => console.error('syncDataCache error:', e))
  }, [])

  if (!ready) {
    return (
      <div style={{
        minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#FFFFFF',
        fontFamily: '"Pretendard",-apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif',
      }}>
        <div style={{ textAlign: 'center' }}>
          <img src={logoImg} alt="호주가자" style={{ width: 80, height: 80, objectFit: 'contain', marginBottom: 16 }} />
          <div style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: 1 }}>호주가자</div>
          <div style={{ fontSize: 13, color: '#94A3B8', fontWeight: 500, marginTop: 6 }}>호주 여행 정보 앱</div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <ChecklistPage state={state} setState={setState} onLanding={() => navigate('/onboarding')} />
    </div>
  )
}

function AdminWrapper() {
  const navigate = useNavigate()
  return (
    <div className="app-shell">
      <AdminPage onBack={() => navigate('/')} />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"       element={<MainApp />} />
        <Route path="/app"    element={<MainApp />} />
        <Route path="/admin"  element={<AdminWrapper />} />
        <Route path="*"       element={<MainApp />} />
      </Routes>
      <Analytics />
    </BrowserRouter>
  )
}
