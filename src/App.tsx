import { useState } from 'react'
import { loadState, AppState } from './store/state'
import LandingPage from './pages/LandingPage'
import ChecklistPage from './pages/ChecklistPage'

type Page = 'landing' | 'checklist'

function FloatingBubble() {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ position: 'fixed', bottom: 124, right: 16, zIndex: 999 }}>
      {/* Popup */}
      {open && (
        <div style={{
          position: 'absolute', bottom: 52, right: 0,
          background: '#fff', borderRadius: 16, padding: '14px 16px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.13)',
          width: 230, fontSize: 13, lineHeight: 1.7, color: '#333',
          animation: 'fadeInUp 0.2s ease',
        }}>
          <button
            onClick={() => setOpen(false)}
            style={{ position: 'absolute', top: 8, right: 10, background: 'none', border: 'none', fontSize: 15, color: '#bbb', cursor: 'pointer' }}
          >✕</button>
          <p style={{ fontWeight: 700, marginBottom: 6, color: '#e8420a' }}>안녕하세요 호주가자 운영자입니다.</p>
          <p style={{ color: '#555' }}>
            좋은 의견이나 요청 사항 있으시면{' '}
            <a
              href="https://www.threads.net/@palaslouise"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#e8420a', fontWeight: 700, textDecoration: 'none' }}
            >@palaslouise</a>
            로 알려주세요!
          </p>
          {/* Little tail */}
          <div style={{
            position: 'absolute', bottom: -7, right: 18,
            width: 14, height: 14, background: '#fff',
            transform: 'rotate(45deg)',
            boxShadow: '2px 2px 4px rgba(0,0,0,0.06)',
          }} />
        </div>
      )}
      {/* Button */}
        <button
          onClick={() => setOpen(v => !v)}
          style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'linear-gradient(135deg,#e8420a 0%,#ff7b2c 100%)', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 3px 14px rgba(232,66,10,0.4)',
            cursor: 'pointer', fontSize: 20,
          }}
        >💬</button>
    </div>
  )
}

export default function App() {
  const [page, setPage]   = useState<Page>('landing')
  const [state, setState] = useState<AppState>(() => loadState())

  return (
    <div className="app-shell">
      {page === 'landing'
        ? <LandingPage state={state} onStart={() => setPage('checklist')} />
        : <ChecklistPage state={state} setState={setState} />
      }
      <FloatingBubble />
    </div>
  )
}
