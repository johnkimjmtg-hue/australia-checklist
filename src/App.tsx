import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { loadState, AppState } from './store/state'
import { supabase } from './lib/supabase'
import OnboardingPage from './pages/OnboardingPage'
import ChecklistPage from './pages/ChecklistPage'
import AdminPage from './pages/AdminPage'

// ── 메인 앱 (비로그인도 입장 가능)
function MainApp() {
  const [state, setState] = useState<AppState>(() => loadState())
  const [authChecked, setAuthChecked] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // 인증 상태 확인 (UI 블로킹 없이)
    supabase.auth.getSession().then(() => setAuthChecked(true))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') setAuthChecked(true)
      if (event === 'SIGNED_OUT') setAuthChecked(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  // 로딩 중 (짧게)
  if (!authChecked) {
    return (
      <div style={{
        minHeight: '100dvh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#F8FAFC',
        fontFamily: '"Pretendard",-apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🦘</div>
          <div style={{ fontSize: 14, color: '#94A3B8', fontWeight: 600 }}>불러오는 중...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <ChecklistPage
        state={state}
        setState={setState}
        onLanding={() => navigate('/onboarding')}
      />
    </div>
  )
}

// ── 온보딩 래퍼
function OnboardingWrapper() {
  const navigate = useNavigate()

  useEffect(() => {
    // 이미 로그인된 경우 바로 메인으로
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/app', { replace: true })
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') navigate('/app', { replace: true })
    })
    return () => subscription.unsubscribe()
  }, [])

  return (
    <div className="app-shell">
      <OnboardingPage onComplete={() => navigate('/app', { replace: true })} />
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

// ── 라우터
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"            element={<MainApp />} />
        <Route path="/app"         element={<MainApp />} />
        <Route path="/onboarding"  element={<OnboardingWrapper />} />
        <Route path="/admin"       element={<AdminWrapper />} />
        <Route path="*"            element={<MainApp />} />
      </Routes>
      <Analytics />
    </BrowserRouter>
  )
}
