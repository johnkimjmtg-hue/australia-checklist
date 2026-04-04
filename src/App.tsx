import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { loadState, loadTrip, resetAll, clearTrip, AppState, TripInfo } from './store/state'
import { syncDataCache } from './lib/dataCache'
import ChecklistPage from './pages/ChecklistPage'
import AdminPage from './pages/admin/AdminPage'
import LandingPage from './pages/LandingPage'
import HomePage from './pages/HomePage'

const ff = "-apple-system, 'Apple SD Gothic Neo', 'Pretendard', sans-serif"

function MainApp() {
  const [state, setState] = useState<AppState>(() => loadState())
  const [trip, setTrip] = useState<TripInfo|null>(() => loadTrip())
  const [cacheStamp, setCacheStamp] = useState(0)
  const [activeTab, setActiveTab] = useState<string|null>(null)
  const [showChangeDateWarning, setShowChangeDateWarning] = useState(false)

  useEffect(() => {
    const sync = async () => {
      const updated = await syncDataCache()
      if (updated) setCacheStamp(s => s + 1)
    }
    sync()
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') sync()
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  const handleChangeDates = () => setShowChangeDateWarning(true)

  const handleConfirmChangeDate = () => {
    // 모든 데이터 삭제
    localStorage.clear()
    const next = resetAll()
    setState(next)
    clearTrip()
    setShowChangeDateWarning(false)
    setTrip(null)
    setActiveTab(null)
  }

  const WarningPopup = showChangeDateWarning ? (
    <>
      <div onClick={() => setShowChangeDateWarning(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', backdropFilter:'blur(8px)', zIndex:2000 }} />
      <div style={{
        position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
        background:'#ffffff', borderRadius:20, zIndex:2001,
        boxShadow:'0 20px 60px rgba(0,0,0,0.25)',
        padding:'28px 24px 20px', fontFamily:ff,
        width:'calc(100% - 48px)', maxWidth:300, textAlign:'center',
      }}>
        <div style={{ fontSize:18, fontWeight:800, color:'#0F172A', marginBottom:10, textAlign:'center' }}>일정을 변경할까요?</div>
        <div style={{ fontSize:14, color:'#64748B', marginBottom:28, textAlign:'center', lineHeight:1.7 }}>
          버킷리스트, 쇼핑, 노트, 메모 등<br/>모든 데이터가 삭제됩니다.
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={() => setShowChangeDateWarning(false)} style={{
            flex:1, height:50, borderRadius:12, border:'1px solid rgba(0,0,0,0.1)',
            background:'#F8FAFC', color:'#64748B', fontSize:15, fontWeight:700,
            cursor:'pointer', fontFamily:ff,
          }}>취소</button>
          <button onClick={handleConfirmChangeDate} style={{
            flex:1, height:50, borderRadius:12, border:'none',
            background:'#DC2626', color:'#fff', fontSize:15, fontWeight:700,
            cursor:'pointer', fontFamily:ff,
          }}>삭제하고 변경</button>
        </div>
      </div>
    </>
  ) : null

  if (!trip) {
    return (
      <div className="app-shell">
        <LandingPage onComplete={async (t) => {
          const updated = await syncDataCache()
          if (updated) setCacheStamp(s => s + 1)
          setTrip(t)
          setActiveTab(null)
        }} />
      </div>
    )
  }

  if (!activeTab) {
    return (
      <>
        {WarningPopup}
        <div className="app-shell">
          <HomePage
            trip={trip}
            state={state}
            setState={setState}
            onNavigate={(tab) => setActiveTab(tab)}
            onChangeDates={handleChangeDates}
            cacheStamp={cacheStamp}
          />
        </div>
      </>
    )
  }

  return (
    <>
      {WarningPopup}
      <div className="app-shell">
        <ChecklistPage
          key={cacheStamp}
          state={state}
          setState={setState}
          initialTab={(activeTab === 'bucketlist' ? 'bucketcheck' : activeTab) as any}
          onGoHome={() => setActiveTab(null)}
        />
      </div>
    </>
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
