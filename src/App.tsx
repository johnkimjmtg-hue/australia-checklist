import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { loadState, loadTrip, AppState, TripInfo } from './store/state'
import { syncDataCache } from './lib/dataCache'
import ChecklistPage from './pages/ChecklistPage'
import AdminPage from './pages/AdminPage'
import LandingPage from './pages/LandingPage'
import HomePage from './pages/HomePage'

function MainApp() {
  const [state, setState] = useState<AppState>(() => loadState())
  const [trip, setTrip] = useState<TripInfo|null>(() => loadTrip())
  const [cacheStamp, setCacheStamp] = useState(0)
  const [activeTab, setActiveTab] = useState<string|null>(null)

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

  if (!trip) {
    return (
      <div className="app-shell">
        <LandingPage onComplete={(t) => { setTrip(t); setActiveTab(null) }} />
      </div>
    )
  }

  if (!activeTab) {
    return (
      <div className="app-shell">
        <HomePage
          trip={trip}
          state={state}
          setState={setState}
          onNavigate={(tab) => setActiveTab(tab)}
          onChangeDates={() => { setTrip(null); setActiveTab(null) }}
        />
      </div>
    )
  }

  return (
    <div className="app-shell">
      <ChecklistPage
        key={cacheStamp}
        state={state}
        setState={setState}
        initialTab={(activeTab === 'bucketlist' ? 'bucketcheck' : activeTab) as any}
        onGoHome={() => setActiveTab(null)}
      />
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
