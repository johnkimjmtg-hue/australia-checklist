// ─────────────────────────────────────────────
// OnboardingPage.tsx  (src/pages/OnboardingPage.tsx)
//
// 첫 실행 시 1회만 표시
// Step 1 → 로그인 / 회원가입 선택
// Step 2 → 이메일+비번 입력
// Step 3 → 여행 정보 입력 (귀국일·도시)
// 완료 → ChecklistPage로 진입
// ─────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { colors, font, radius, spacing, T } from '../styles/tokens'
import { Button, Input } from '../components/ui'
import TermsPage from './TermsPage'

type Mode = 'select' | 'login' | 'signup'
type Step = 'auth'
type TermsTab = 'terms' | 'privacy'

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
  const [termsTab, setTermsTab] = useState<TermsTab | null>(null)

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
    onComplete()
    setLoading(false)
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
    onComplete()
    setLoading(false)
  }

  // ── 구글 로그인 ──
  async function handleGoogle() {
    setLoading(true); setError('')
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
  }

  // ── 소셜 로그인 콜백 감지 ──
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const url = new URL(window.location.href)
        url.searchParams.delete('onboarding')
        window.history.replaceState({}, '', url.toString())
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  return (
    <div style={{
      minHeight: '100dvh',
      background: colors.bgPage,
      fontFamily: font.family,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: `${spacing[6]}px ${spacing[5]}px`,
      boxSizing: 'border-box',
    }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
      `}</style>

      {/* 로고 */}
      <div style={{ textAlign: 'center', marginBottom: spacing[8], animation: 'fadeUp 0.4s ease' }}>
        <div style={{ fontSize: 32, marginBottom: spacing[2] }}>🦘</div>
        <div style={{ ...T.h1, letterSpacing: 1 }}>호주가자</div>
        <div style={{ ...T.xs, marginTop: spacing[1] }}>호주 생활 정보 앱</div>
      </div>

      {/* ── STEP: 인증 ── */}
      {step === 'auth' && (
        <div style={{ width: '100%', maxWidth: 360, animation: 'fadeUp 0.4s ease 0.1s both' }}>

          {/* 선택 화면 */}
          {mode === 'select' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
              {/* 구글 로그인 버튼 */}
              <button
                onClick={handleGoogle}
                style={{
                  width: '100%',
                  height: 52,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: spacing[2],
                  background: colors.bgCard,
                  border: `1px solid ${colors.border}`,
                  borderRadius: radius.md,
                  fontSize: font.size.md,
                  fontWeight: font.weight.bold,
                  fontFamily: font.family,
                  color: '#3C4043',
                  cursor: 'pointer',
                  transition: 'all 0.12s',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.36-8.16 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                Google로 시작하기
              </button>

              {/* 구분선 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3], margin: `${spacing[1]}px 0` }}>
                <div style={{ flex: 1, height: 1, background: colors.border }} />
                <span style={{ ...T.xs }}>또는</span>
                <div style={{ flex: 1, height: 1, background: colors.border }} />
              </div>

              <Button variant="primary" size="lg" fullWidth onClick={() => setMode('signup')}>
                이메일로 회원가입
              </Button>
              <Button variant="ghost" size="lg" fullWidth onClick={() => setMode('login')}>
                이미 계정이 있어요
              </Button>
              <button
                onClick={onComplete}
                style={{
                  background: 'none', border: 'none',
                  color: colors.textTertiary,
                  fontSize: font.size.sm,
                  cursor: 'pointer',
                  padding: `${spacing[1]}px 0`,
                  fontFamily: font.family,
                  textAlign: 'center' as const,
                }}>
                나중에 할게요
              </button>
            </div>
          )}

          {/* 로그인 */}
          {mode === 'login' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
              <div style={{ ...T.h2, marginBottom: spacing[1] }}>로그인</div>
              <Input
                type="email"
                placeholder="이메일"
                value={email}
                onChange={setEmail}
              />
              <Input
                type="password"
                placeholder="비밀번호"
                value={password}
                onChange={setPassword}
              />
              {error && (
                <div style={{
                  ...T.sm,
                  color: colors.danger,
                  background: colors.dangerLight,
                  borderRadius: radius.sm,
                  padding: `${spacing[2]}px ${spacing[3]}px`,
                }}>{error}</div>
              )}
              <Button variant="primary" size="lg" fullWidth onClick={handleLogin} disabled={loading}>
                {loading ? '로그인 중...' : '로그인'}
              </Button>
              <button
                onClick={() => { setMode('select'); setError('') }}
                style={{
                  background: 'none', border: 'none',
                  color: colors.textTertiary,
                  fontSize: font.size.sm,
                  cursor: 'pointer',
                  padding: `${spacing[1]}px 0`,
                  fontFamily: font.family,
                }}>
                ← 돌아가기
              </button>
            </div>
          )}

          {/* 회원가입 */}
          {mode === 'signup' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
              <div style={{ ...T.h2, marginBottom: spacing[1] }}>회원가입</div>
              <Input
                type="text"
                placeholder="이름 (닉네임)"
                value={name}
                onChange={setName}
              />
              <Input
                type="email"
                placeholder="이메일"
                value={email}
                onChange={setEmail}
              />
              <Input
                type="password"
                placeholder="비밀번호 (6자 이상)"
                value={password}
                onChange={setPassword}
              />
              {error && (
                <div style={{
                  ...T.sm,
                  color: colors.danger,
                  background: colors.dangerLight,
                  borderRadius: radius.sm,
                  padding: `${spacing[2]}px ${spacing[3]}px`,
                }}>{error}</div>
              )}
              <Button variant="primary" size="lg" fullWidth onClick={handleSignup} disabled={loading}>
                {loading ? '가입 중...' : '가입하고 시작하기'}
              </Button>
              <button
                onClick={() => { setMode('select'); setError('') }}
                style={{
                  background: 'none', border: 'none',
                  color: colors.textTertiary,
                  fontSize: font.size.sm,
                  cursor: 'pointer',
                  padding: `${spacing[1]}px 0`,
                  fontFamily: font.family,
                }}>
                ← 돌아가기
              </button>
            </div>
          )}
        </div>
      )}

      {/* 하단 약관 안내 */}
      <div style={{
        position: 'fixed', bottom: spacing[6],
        left: 0, right: 0,
        textAlign: 'center',
        padding: `0 ${spacing[5]}px`,
        pointerEvents: 'none',
      }}>
        <div style={{
          ...T.xs,
          color: colors.textTertiary,
          lineHeight: 1.7,
          pointerEvents: 'auto',
        }}>
          계속 진행하면{' '}
          <button
            onClick={() => setTermsTab('terms')}
            style={{
              background: 'none', border: 'none', padding: 0,
              color: colors.primary, fontSize: font.size.xs,
              fontWeight: font.weight.bold, cursor: 'pointer',
              fontFamily: font.family, textDecoration: 'underline',
              textUnderlineOffset: 2,
            }}
          >이용약관</button>
          {' '}및{' '}
          <button
            onClick={() => setTermsTab('privacy')}
            style={{
              background: 'none', border: 'none', padding: 0,
              color: colors.primary, fontSize: font.size.xs,
              fontWeight: font.weight.bold, cursor: 'pointer',
              fontFamily: font.family, textDecoration: 'underline',
              textUnderlineOffset: 2,
            }}
          >개인정보처리방침</button>
          에 동의하게 됩니다.
        </div>
      </div>

      {/* 약관 페이지 */}
      {termsTab && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: colors.bgPage,
        }}>
          <TermsPage
            initialTab={termsTab}
            onBack={() => setTermsTab(null)}
          />
        </div>
      )}
    </div>
  )
}
