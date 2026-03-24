import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { loadState, AppState } from './store/state'
import { supabase } from './lib/supabase'
import OnboardingPage from './pages/OnboardingPage'
import ChecklistPage from './pages/ChecklistPage'
import AdminPage from './pages/AdminPage'
import BingoPage from './pages/BingoPage'

// ── 메인 앱 (로그인 체크 포함)
function MainApp() {
  const [state, setState] = useState<AppState>(() => loadState())
  const [authChecked, setAuthChecked] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      // 로그인 안 됨 → 온보딩
      if (!session) {
        setShowOnboarding(true)
        setAuthChecked(true)
        return
      }

      // 로그인 됨 → 바로 메인
      setAuthChecked(true)
    }

    checkAuth()

    // 소셜 로그인 콜백 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setShowOnboarding(false)
        setAuthChecked(true)
      }
      if (event === 'SIGNED_OUT') {
        setShowOnboarding(true)
        setAuthChecked(true)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // 로딩 중
  if (!authChecked) {
    return (
      <div style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
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

  // 온보딩
  if (showOnboarding) {
    return (
      <div className="app-shell">
        <OnboardingPage onComplete={() => setShowOnboarding(false)} />
      </div>
    )
  }

  // 메인
  return (
    <div className="app-shell">
      <ChecklistPage
        state={state}
        setState={setState}
        onLanding={() => setShowOnboarding(true)}
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
function BingoWrapper({ city }: { city?: 'melbourne' | 'sydney' }) {
  const navigate = useNavigate()
  return (
    <div className="app-shell">
      <BingoPage onBack={() => navigate('/')} initialCity={city} />
    </div>
  )
}

// ── 라우터
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"                  element={<MainApp />} />
        <Route path="/app"               element={<MainApp />} />
        <Route path="/admin"             element={<AdminWrapper />} />
        <Route path="/bingo"             element={<BingoWrapper />} />
        <Route path="/bingo/melbourne"   element={<BingoWrapper city="melbourne" />} />
        <Route path="/bingo/sydney"      element={<BingoWrapper city="sydney" />} />
        <Route path="*"                  element={<MainApp />} />
      </Routes>
      <Analytics />
    </BrowserRouter>
  )
}
