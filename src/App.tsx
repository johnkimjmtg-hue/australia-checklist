import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { loadState, AppState } from './store/state'
import { syncDataCache } from './lib/dataCache'
import ChecklistPage from './pages/ChecklistPage'
import AdminPage from './pages/AdminPage'

function MainApp() {
  const [state, setState] = useState<AppState>(() => loadState())
  // 새 데이터가 다운로드됐을 때 올라가는 카운터
  // ChecklistPage에 key로 전달 → 리마운트되면서 모든 getCached*() 재호출
  const [cacheStamp, setCacheStamp] = useState(0)

  useEffect(() => {
    const sync = async () => {
      const updated = await syncDataCache()
      if (updated) setCacheStamp(s => s + 1)
    }

    // 최초 실행
    sync()

    // 모바일 백그라운드 → 포그라운드 복귀 시 재실행
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') sync()
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  return (
    <div className="app-shell">
      {/* key가 바뀌면 ChecklistPage 전체가 리마운트 → 캐시 데이터 자동 갱신 */}
      <ChecklistPage key={cacheStamp} state={state} setState={setState} />
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
