import { AppState } from '../store/state'
import { ITEMS } from '../data/checklist'

type Props = { state: AppState; onStart: () => void }

export default function LandingPage({ state, onStart }: Props) {
  const total = ITEMS.length + state.customItems.length

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #F4F7FB 0%, #EBF0F8 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      position: 'relative', overflow: 'hidden',
      fontFamily: '-apple-system, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif',
    }}>

      {/* Subtle grid pattern */}
      <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:0.04, pointerEvents:'none' }}>
        <defs>
          <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#1E4D83" strokeWidth="0.8"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)"/>
      </svg>

      {/* Top spacing */}
      <div style={{ height: '8vh' }} />

      {/* ── LOGO ── */}
      <div style={{ animation: 'fadeInUp 0.6s ease both', marginBottom: 8 }}>
        <svg width="200" height="52" viewBox="0 0 200 52" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* 호 */}
          <text x="2" y="42" fontFamily="-apple-system, Arial Black, sans-serif" fontSize="38" fontWeight="900" fill="#1E4D83" letterSpacing="-2">호주가자</text>
          {/* Underline accent */}
          <rect x="2" y="47" width="196" height="3" rx="1.5" fill="#1E4D83" opacity="0.25"/>
          {/* Dot accent */}
          <circle cx="192" cy="14" r="5" fill="#3A7FCC" opacity="0.7"/>
        </svg>
      </div>

      {/* Subtitle */}
      <p style={{
        fontSize: 13, color: '#5A7090', fontWeight: 500,
        letterSpacing: 0.5, marginBottom: 36,
        animation: 'fadeInUp 0.6s ease 0.1s both',
      }}>여행 버킷리스트</p>

      {/* ── BUCKET ILLUSTRATION ── */}
      <div style={{ animation: 'fadeInUp 0.7s ease 0.15s both' }}>
        <svg width="220" height="260" viewBox="0 0 220 260" fill="none" xmlns="http://www.w3.org/2000/svg">

          {/* Shadow under bucket */}
          <ellipse cx="110" cy="248" rx="55" ry="8" fill="rgba(30,77,131,0.08)"/>

          {/* ── Bucket body ── */}
          {/* Main body trapezoid */}
          <path d="M62 100 L158 100 L148 230 L72 230 Z" fill="url(#bucketGrad)" />
          {/* Bucket rim */}
          <rect x="56" y="92" width="108" height="16" rx="8" fill="url(#rimGrad)"/>
          {/* Bucket shine */}
          <path d="M72 110 L80 222" stroke="rgba(255,255,255,0.3)" strokeWidth="6" strokeLinecap="round"/>
          {/* Bucket rivets */}
          <circle cx="72" cy="100" r="4" fill="#1E4D83" opacity="0.4"/>
          <circle cx="148" cy="100" r="4" fill="#1E4D83" opacity="0.4"/>
          {/* Bucket handle */}
          <path d="M76 92 Q110 60 144 92" stroke="#2E6BB0" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.6"/>
          <circle cx="76" cy="92" r="5" fill="#2E6BB0" opacity="0.5"/>
          <circle cx="144" cy="92" r="5" fill="#2E6BB0" opacity="0.5"/>

          {/* ── Notes/tickets sticking out ── */}
          {/* Left note - tilted left */}
          <g transform="rotate(-18, 82, 80)">
            <rect x="68" y="30" width="28" height="74" rx="3" fill="#FFF8E7" stroke="#E8D5A3" strokeWidth="1"/>
            <rect x="68" y="30" width="28" height="8" rx="3" fill="#E8D5A3" opacity="0.6"/>
            <line x1="74" y1="48" x2="90" y2="48" stroke="#C4A882" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="74" y1="55" x2="90" y2="55" stroke="#C4A882" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="74" y1="62" x2="86" y2="62" stroke="#C4A882" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="74" y1="69" x2="88" y2="69" stroke="#C4A882" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="74" y1="76" x2="84" y2="76" stroke="#C4A882" strokeWidth="1.5" strokeLinecap="round"/>
          </g>

          {/* Center note - straight up */}
          <g transform="rotate(3, 110, 78)">
            <rect x="96" y="18" width="28" height="84" rx="3" fill="#F0F7FF" stroke="#BDD4EE" strokeWidth="1"/>
            <rect x="96" y="18" width="28" height="8" rx="3" fill="#BDD4EE" opacity="0.7"/>
            <line x1="102" y1="36" x2="118" y2="36" stroke="#7AAAD4" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="102" y1="43" x2="118" y2="43" stroke="#7AAAD4" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="102" y1="50" x2="114" y2="50" stroke="#7AAAD4" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="102" y1="57" x2="116" y2="57" stroke="#7AAAD4" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="102" y1="64" x2="112" y2="64" stroke="#7AAAD4" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="102" y1="71" x2="116" y2="71" stroke="#7AAAD4" strokeWidth="1.5" strokeLinecap="round"/>
            {/* Checkmark on one line */}
            <path d="M102 79 L105 82 L112 75" stroke="#1E4D83" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </g>

          {/* Right note - tilted right */}
          <g transform="rotate(15, 138, 76)">
            <rect x="124" y="26" width="28" height="78" rx="3" fill="#FFF0F0" stroke="#F0C4C4" strokeWidth="1"/>
            <rect x="124" y="26" width="28" height="8" rx="3" fill="#F0C4C4" opacity="0.6"/>
            <line x1="130" y1="44" x2="146" y2="44" stroke="#D4A0A0" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="130" y1="51" x2="146" y2="51" stroke="#D4A0A0" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="130" y1="58" x2="142" y2="58" stroke="#D4A0A0" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="130" y1="65" x2="144" y2="65" stroke="#D4A0A0" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="130" y1="72" x2="140" y2="72" stroke="#D4A0A0" strokeWidth="1.5" strokeLinecap="round"/>
          </g>

          {/* ── BUCKET LIST label on bucket ── */}
          <text x="110" y="168" textAnchor="middle" fontFamily="-apple-system, Arial Black, sans-serif" fontSize="11" fontWeight="900" fill="rgba(255,255,255,0.85)" letterSpacing="2">BUCKET</text>
          <text x="110" y="183" textAnchor="middle" fontFamily="-apple-system, Arial Black, sans-serif" fontSize="11" fontWeight="900" fill="rgba(255,255,255,0.85)" letterSpacing="2">LIST</text>

          {/* Small decorative stars */}
          <text x="30" y="80" fontSize="14" opacity="0.5">✦</text>
          <text x="182" y="60" fontSize="10" opacity="0.4">✦</text>
          <text x="20" y="150" fontSize="8" opacity="0.3">✦</text>
          <text x="192" y="140" fontSize="12" opacity="0.35">✦</text>

          {/* Gradients */}
          <defs>
            <linearGradient id="bucketGrad" x1="62" y1="100" x2="158" y2="230" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#2E6BB0"/>
              <stop offset="100%" stopColor="#1E4D83"/>
            </linearGradient>
            <linearGradient id="rimGrad" x1="56" y1="92" x2="164" y2="92" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#3A7FCC"/>
              <stop offset="100%" stopColor="#1E4D83"/>
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Stats chip */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'rgba(30,77,131,0.07)',
        border: '1px solid rgba(30,77,131,0.12)',
        borderRadius: 999, padding: '7px 16px',
        marginTop: 8, marginBottom: 32,
        animation: 'fadeInUp 0.7s ease 0.25s both',
      }}>
        <span style={{ fontSize: 18 }}>🦘</span>
        <span style={{ fontSize: 12, color: '#1E4D83', fontWeight: 700 }}>
          호주 여행 버킷리스트 {total}가지
        </span>
      </div>

      {/* CTA Button */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 390,
        padding: '10px 16px 28px',
        background: 'linear-gradient(to top, #F4F7FB 60%, transparent)',
        zIndex: 20,
        animation: 'fadeInUp 0.7s ease 0.3s both',
      }}>
        <button
          onClick={onStart}
          className="hg-btn hg-btn--primary hg-btn--full"
          style={{ fontSize: 15, fontWeight: 800, letterSpacing: 0.3, borderRadius: 14, height: 52 }}
        >
          출발하기 →
        </button>
        <p style={{ textAlign: 'center', fontSize: 11, color: '#8AAAC8', marginTop: 8, fontWeight: 500 }}>
          호주에서 꼭 해야 할 것들을 정리해보세요
        </p>
      </div>
    </div>
  )
}
