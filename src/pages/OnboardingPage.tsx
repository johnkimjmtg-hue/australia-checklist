// ─────────────────────────────────────────────
// OnboardingPage.tsx  (src/pages/OnboardingPage.tsx)
//
// 첫 실행 시 1회만 표시
// Step 1 → 로그인 / 회원가입 선택
// Step 2 → 이메일+비번 입력
// Step 3 → 여행 정보 입력 (귀국일·도시)
// 완료 → ChecklistPage로 진입
// ─────────────────────────────────────────────
import { useState } from 'react'
import { supabase } from '../lib/supabase'

// ── 디자인 토큰 (tokens.ts 적용 전 인라인 정의) ──
const C = {
  primary:     '#1B6EF3',
  primaryDark: '#1458CC',
  primaryLight:'#EEF4FF',
  bgPage:      '#F8FAFC',
  bgCard:      '#FFFFFF',
  bgInput:     '#F1F5F9',
  border:      '#E2E8F0',
  textPrimary: '#0F172A',
  textSub:     '#64748B',
  textHint:    '#94A3B8',
  danger:      '#DC2626',
  dangerLight: '#FEE2E2',
  success:     '#16A34A',
  google:      '#FFFFFF',
  googleText:  '#3C4043',
}
const ff = '"Pretendard",-apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif'

// ── 도시 목록 ──
const CITIES = [
  { value: 'Sydney',     label: '🦘 시드니' },
  { value: 'Melbourne',  label: '☕ 멜번' },
  { value: 'Brisbane',   label: '🌞 브리즈번' },
  { value: 'Perth',      label: '🌊 퍼스' },
  { value: 'Adelaide',   label: '🍷 애들레이드' },
  { value: 'Gold Coast', label: '🏄 골드코스트' },
  { value: 'Cairns',     label: '🐠 케언즈' },
  { value: 'Other',      label: '기타' },
]

type Mode = 'select' | 'login' | 'signup'
type Step = 'auth' | 'trip'

type Props = {
  onComplete: () => void
}

export default function OnboardingPage({ onComplete }: Props) {
  const [step, setStep]         = useState<Step>('auth')
  const [mode, setMode]         = useState<Mode>('select')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [name, setName]         = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  // 여행 정보
  const [returnDate, setReturnDate] = useState('')
  const [city, setCity]             = useState('')
  const [tripLoading, setTripLoading] = useState(false)

  // ── 이메일 로그인 ──
  async function handleLogin() {
    if (!email.trim() || !password.trim()) { setError('이메일과 비밀번호를 입력해주세요'); return }
    setLoading(true); setError('')
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (err) { setError('이메일 또는 비밀번호가 틀렸어요'); setLoading(false); return }
    // 여행 정보 있는지 확인
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('return_date, city').eq('id', user.id).single()
      if (profile?.return_date && profile?.city) { onComplete(); return }
    }
    setStep('trip'); setLoading(false)
  }

  // ── 이메일 회원가입 ──
  async function handleSignup() {
    if (!name.trim())          { setError('이름을 입력해주세요'); return }
    if (!email.trim())         { setError('이메일을 입력해주세요'); return }
    if (password.length < 6)   { setError('비밀번호는 6자 이상이에요'); return }
    setLoading(true); setError('')
    const { error: err } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: name.trim() } },
    })
    if (err) { setError(err.message); setLoading(false); return }
    setStep('trip'); setLoading(false)
  }

  // ── 구글 로그인 ──
  async function handleGoogle() {
    setLoading(true); setError('')
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '?onboarding=trip' },
    })
  }

  // ── 여행 정보 저장 ──
  async function handleTripSave() {
    if (!returnDate) { setError('귀국 예정일을 선택해주세요'); return }
    if (!city)       { setError('거주 도시를 선택해주세요'); return }
    setTripLoading(true); setError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('로그인 정보가 없어요'); setTripLoading(false); return }
    await supabase.from('profiles').upsert({
      id: user.id,
      return_date: returnDate,
      city,
      updated_at: new Date().toISOString(),
    })
    setTripLoading(false)
    onComplete()
  }

  // ── D-Day 미리보기 ──
  const dDay = returnDate
    ? Math.ceil((new Date(returnDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div style={{
      minHeight: '100dvh',
      background: C.bgPage,
      fontFamily: ff,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 20px',
      boxSizing: 'border-box',
    }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
        .ob-input { width:100%; height:48px; background:${C.bgInput}; border:1px solid ${C.border}; border-radius:10px; padding:0 14px; font-size:15px; color:${C.textPrimary}; font-family:${ff}; outline:none; box-sizing:border-box; transition:border 0.15s; }
        .ob-input:focus { border:1.5px solid ${C.primary}; background:#fff; }
        .ob-btn { width:100%; height:52px; border:none; border-radius:12px; font-size:16px; font-weight:700; font-family:${ff}; cursor:pointer; transition:all 0.12s; -webkit-tap-highlight-color:transparent; }
        .ob-btn:active { transform:scale(0.97); opacity:0.85; }
        .ob-btn-primary { background:${C.primary}; color:#fff; }
        .ob-btn-ghost { background:transparent; color:${C.primary}; border:1.5px solid ${C.primary}; }
        .ob-btn-google { background:${C.google}; color:${C.googleText}; border:1px solid ${C.border}; }
        .city-btn { flex:1; min-width:calc(50% - 4px); height:44px; border:1px solid ${C.border}; border-radius:10px; background:#fff; color:${C.textSub}; font-size:14px; font-family:${ff}; cursor:pointer; transition:all 0.12s; -webkit-tap-highlight-color:transparent; }
        .city-btn.active { border:1.5px solid ${C.primary}; background:${C.primaryLight}; color:${C.primary}; font-weight:700; }
        .city-btn:active { transform:scale(0.97); }
      `}</style>

      {/* 로고 */}
      <div style={{ textAlign: 'center', marginBottom: 36, animation: 'fadeUp 0.4s ease' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🦘</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.textPrimary, letterSpacing: 1 }}>호주가자</div>
        <div style={{ fontSize: 13, color: C.textHint, marginTop: 4 }}>호주 생활 정보 앱</div>
      </div>

      {/* ── STEP 1: 인증 ── */}
      {step === 'auth' && (
        <div style={{ width: '100%', maxWidth: 360, animation: 'fadeUp 0.4s ease 0.1s both' }}>

          {/* 선택 화면 */}
          {mode === 'select' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button className="ob-btn ob-btn-google" onClick={handleGoogle} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                <svg width="18" height="18" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.36-8.16 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                Google로 시작하기
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0' }}>
                <div style={{ flex: 1, height: 1, background: C.border }} />
                <span style={{ fontSize: 12, color: C.textHint }}>또는</span>
                <div style={{ flex: 1, height: 1, background: C.border }} />
              </div>
              <button className="ob-btn ob-btn-primary" onClick={() => setMode('signup')}>
                이메일로 회원가입
              </button>
              <button className="ob-btn ob-btn-ghost" onClick={() => setMode('login')}>
                이미 계정이 있어요
              </button>
              <button
                onClick={onComplete}
                style={{ background:'none', border:'none', color:C.textHint, fontSize:13, cursor:'pointer', padding:'4px 0', fontFamily:ff, textAlign:'center' as const }}>
                나중에 할게요
              </button>
            </div>
          )}

          {/* 로그인 */}
          {mode === 'login' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: C.textPrimary, marginBottom: 4 }}>로그인</div>
              <input className="ob-input" type="email" placeholder="이메일" value={email} onChange={e => setEmail(e.target.value)} />
              <input className="ob-input" type="password" placeholder="비밀번호" value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()} />
              {error && <div style={{ fontSize: 13, color: C.danger, background: C.dangerLight, borderRadius: 8, padding: '8px 12px' }}>{error}</div>}
              <button className="ob-btn ob-btn-primary" onClick={handleLogin} disabled={loading}>
                {loading ? '로그인 중...' : '로그인'}
              </button>
              <button onClick={() => { setMode('select'); setError('') }}
                style={{ background: 'none', border: 'none', color: C.textHint, fontSize: 13, cursor: 'pointer', padding: '4px 0', fontFamily: ff }}>
                ← 돌아가기
              </button>
            </div>
          )}

          {/* 회원가입 */}
          {mode === 'signup' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: C.textPrimary, marginBottom: 4 }}>회원가입</div>
              <input className="ob-input" type="text" placeholder="이름 (닉네임)" value={name} onChange={e => setName(e.target.value)} />
              <input className="ob-input" type="email" placeholder="이메일" value={email} onChange={e => setEmail(e.target.value)} />
              <input className="ob-input" type="password" placeholder="비밀번호 (6자 이상)" value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSignup()} />
              {error && <div style={{ fontSize: 13, color: C.danger, background: C.dangerLight, borderRadius: 8, padding: '8px 12px' }}>{error}</div>}
              <button className="ob-btn ob-btn-primary" onClick={handleSignup} disabled={loading}>
                {loading ? '가입 중...' : '가입하고 시작하기'}
              </button>
              <button onClick={() => { setMode('select'); setError('') }}
                style={{ background: 'none', border: 'none', color: C.textHint, fontSize: 13, cursor: 'pointer', padding: '4px 0', fontFamily: ff }}>
                ← 돌아가기
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── STEP 2: 여행 정보 ── */}
      {step === 'trip' && (
        <div style={{ width: '100%', maxWidth: 360, animation: 'fadeUp 0.4s ease' }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.textPrimary }}>여행 정보 입력</div>
            <div style={{ fontSize: 14, color: C.textSub, marginTop: 6 }}>버킷리스트 D-Day 계산에 사용돼요</div>
          </div>

          {/* 귀국 예정일 */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.textSub, marginBottom: 8 }}>귀국 예정일</div>
            <input
              className="ob-input"
              type="date"
              value={returnDate}
              onChange={e => setReturnDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              style={{ colorScheme: 'light' }}
            />
            {dDay !== null && (
              <div style={{
                marginTop: 8, padding: '8px 14px',
                background: dDay > 30 ? C.primaryLight : '#FEF3C7',
                borderRadius: 8,
                fontSize: 13, fontWeight: 700,
                color: dDay > 30 ? C.primary : '#D97706',
              }}>
                {dDay > 0 ? `귀국까지 D-${dDay}` : dDay === 0 ? '오늘 귀국이에요!' : '귀국일이 지났어요'}
              </div>
            )}
          </div>

          {/* 거주 도시 */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.textSub, marginBottom: 8 }}>거주 도시</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {CITIES.map(c => (
                <button
                  key={c.value}
                  className={`city-btn${city === c.value ? ' active' : ''}`}
                  onClick={() => setCity(c.value)}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {error && <div style={{ fontSize: 13, color: C.danger, background: C.dangerLight, borderRadius: 8, padding: '8px 12px', marginBottom: 12 }}>{error}</div>}

          <button className="ob-btn ob-btn-primary" onClick={handleTripSave} disabled={tripLoading}>
            {tripLoading ? '저장 중...' : '시작하기 →'}
          </button>

          <button
            onClick={onComplete}
            style={{ background: 'none', border: 'none', color: C.textHint, fontSize: 13, cursor: 'pointer', padding: '12px 0 0', fontFamily: ff, width: '100%', textAlign: 'center' }}>
            나중에 설정할게요
          </button>
        </div>
      )}

      {/* 하단 */}
      <div style={{ position: 'fixed', bottom: 24, fontSize: 11, color: C.textHint, textAlign: 'center' }}>
        가입하면 이용약관 및 개인정보처리방침에 동의하는 것으로 간주해요
      </div>
    </div>
  )
}
