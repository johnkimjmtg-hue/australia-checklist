import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { loadState, AppState } from './store/state'
import { syncDataCache } from './lib/dataCache'
import ChecklistPage from './pages/ChecklistPage'
import AdminPage from './pages/AdminPage'

function MainApp() {
  const [state, setState] = useState<AppState>(() => loadState())

  useEffect(() => {
    syncDataCache().catch(e => console.error('syncDataCache error:', e))
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
