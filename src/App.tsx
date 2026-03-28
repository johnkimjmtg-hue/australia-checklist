import { useState, useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { loadState, AppState } from './store/state'
import { syncDataCache } from './lib/dataCache'
import ChecklistPage from './pages/ChecklistPage'
import AdminPage from './pages/AdminPage'

const RECHECK_INTERVAL = 5 * 60 * 1000 // 5분

function MainApp() {
  const [state, setState] = useState<AppState>(() => loadState())
  const lastCheckedAt = useRef<number>(0)

  async function checkAndSync() {
    const now = Date.now()
    if (now - lastCheckedAt.current < RECHECK_INTERVAL) return
    lastCheckedAt.current = now
    try {
      await syncDataCache()
    } catch (e) {
      console.error('syncDataCache error:', e)
    }
  }

  useEffect(() => {
    // 최초 마운트 시 즉시 실행
    checkAndSync()

    // 모바일 포그라운드 복귀 시 체크
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        checkAndSync()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return (
    <div className="app-shell">
      <ChecklistPage state={state} setState={setState} />
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
