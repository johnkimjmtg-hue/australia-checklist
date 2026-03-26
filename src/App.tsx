import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { loadState, saveTrip, AppState } from './store/state'
import { supabase } from './lib/supabase'
import OnboardingPage from './pages/OnboardingPage'
import ChecklistPage from './pages/ChecklistPage'
import AdminPage from './pages/AdminPage'

// ── 로그인 시 모든 유저 데이터를 한 번에 로드해서 로컬에 캐시
async function loadAllUserData(userId: string) {
  const [bucketRes, shoppingRes, bingoRes, profileRes] = await Promise.all([
    supabase.from('user_bucketlists').select('state_json, trip_json, achieved_json').eq('user_id', userId).maybeSingle(),
    supabase.from('user_shopping').select('my_list, my_checked').eq('user_id', userId).maybeSingle(),
    supabase.from('user_bingo').select('city, checked_indices').eq('user_id', userId),
    supabase.from('profiles').select('nickname, community_icon, bookmarks').eq('id', userId).maybeSingle(),
  ])

  // 버킷리스트
  if (bucketRes.data) {
    const { state_json, trip_json, achieved_json } = bucketRes.data
    if (state_json) try { localStorage.setItem('korea-receipt', JSON.stringify(state_json)) } catch {}
    if (trip_json)  saveTrip(trip_json as any)
    if (achieved_json) try { localStorage.setItem('bucket-achieved', JSON.stringify(achieved_json)) } catch {}
  }

  // 쇼핑
  if (shoppingRes.data) {
    const { my_list, my_checked } = shoppingRes.data
    if (my_list)    try { localStorage.setItem('my-shopping-list', JSON.stringify(my_list)) } catch {}
    if (my_checked) try { localStorage.setItem('my-shopping-checked', JSON.stringify(my_checked)) } catch {}
  }

  // 빙고
  if (bingoRes.data) {
    bingoRes.data.forEach((row: any) => {
      if (row.city === 'melbourne') try { localStorage.setItem('bingo-melbourne', JSON.stringify(row.checked_indices ?? [])) } catch {}
      if (row.city === 'sydney')    try { localStorage.setItem('bingo-sydney',    JSON.stringify(row.checked_indices ?? [])) } catch {}
    })
  }

  // 커뮤니티 프로필 + 북마크
  if (profileRes.data) {
    const { nickname, community_icon, bookmarks } = profileRes.data
    if (nickname)       try { localStorage.setItem('community-my-name', nickname) } catch {}
    if (community_icon) try { localStorage.setItem('community-my-icon', community_icon) } catch {}
    if (bookmarks)      try { localStorage.setItem('biz-bookmarks', JSON.stringify(bookmarks)) } catch {}
  }
}

// ── 메인 앱 (비로그인도 입장 가능)
function MainApp() {
  const [state, setState] = useState<AppState>(() => loadState())
  const [authChecked, setAuthChecked] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        await loadAllUserData(session.user.id)
        // 로컬에 캐시 후 state 다시 로드
        setState(loadState())
      }
      setAuthChecked(true)
    }
    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await loadAllUserData(session.user.id)
        setState(loadState())
      }
      setAuthChecked(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  // 로딩 중
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
