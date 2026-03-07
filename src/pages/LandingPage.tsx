type Props = {
  onStartChecklist: () => void
  onStartServices:  () => void
}

export default function LandingPage({ onStartChecklist, onStartServices }: Props) {
  const LETTERS = ['호', '주', '버', '킷', '리', '스', '트']

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0A0A0A',
      fontFamily: '"Pretendard",-apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      maxWidth: 430,
      margin: '0 auto',
      padding: '60px 24px 48px',
      boxSizing: 'border-box',
    }}>
      <style>{`
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
        @import url('https://fonts.googleapis.com/css2?family=Nanum+Myeongjo:wght@800&display=swap');

        @keyframes fadeUp {
          from { opacity:0; transform:translateY(16px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes blink {
          0%,100% { opacity:1; }
          50%      { opacity:0; }
        }

        .f1 { animation: fadeUp 0.6s ease 0.1s both; }
        .f2 { animation: fadeUp 0.6s ease 0.3s both; }
        .f3 { animation: fadeUp 0.6s ease 0.5s both; }
        .f4 { animation: fadeUp 0.6s ease 0.7s both; }
        .f5 { animation: fadeUp 0.6s ease 0.9s both; }

        .cursor { animation: blink 1s step-end infinite; }

        .btn-outline {
          transition: background 0.2s, color 0.2s;
        }
        .btn-outline:hover {
          background: rgba(255,255,255,0.08) !important;
        }
        .btn-outline:active {
          transform: scale(0.98);
        }
        .btn-fill {
          transition: opacity 0.2s;
        }
        .btn-fill:hover { opacity: 0.85; }
        .btn-fill:active { transform: scale(0.98); }
      `}</style>

      {/* ── 상단: 국기 + 타이틀 ── */}
      <div className="f1" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap: 24 }}>

        {/* 호주 국기 SVG */}
        <svg width="90" height="90" viewBox="0 0 90 90" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* 배경 원 */}
          <circle cx="45" cy="45" r="44" stroke="rgba(255,255,255,0.15)" strokeWidth="1" fill="none"/>

          {/* 유니언 잭 (왼쪽 상단 1/4) */}
          {/* 파란 배경 */}
          <rect x="1" y="1" width="88" height="88" rx="44" fill="none"/>

          {/* 유니언 잭 - 간략화된 형태 */}
          {/* 가로 흰선 */}
          <line x1="1" y1="45" x2="89" y2="45" stroke="white" strokeWidth="2.5" opacity="0.9"/>
          {/* 세로 흰선 */}
          <line x1="45" y1="1" x2="45" y2="89" stroke="white" strokeWidth="2.5" opacity="0.9"/>
          {/* 대각선 흰선 */}
          <line x1="8" y1="8" x2="82" y2="82" stroke="white" strokeWidth="1.5" opacity="0.6"/>
          <line x1="82" y1="8" x2="8" y2="82" stroke="white" strokeWidth="1.5" opacity="0.6"/>

          {/* 남십자성 - 오른쪽 */}
          {/* 큰 별 (중앙 오른쪽) */}
          <polygon points="68,32 69.5,37 74.5,37 70.5,40 72,45 68,42 64,45 65.5,40 61.5,37 66.5,37" fill="white" opacity="0.95"/>
          {/* 작은 별들 */}
          <polygon points="75,55 76,58 79,58 76.5,60 77.5,63 75,61 72.5,63 73.5,60 71,58 74,58" fill="white" opacity="0.85"/>
          <polygon points="60,62 61,65 64,65 61.5,67 62.5,70 60,68 57.5,70 58.5,67 56,65 59,65" fill="white" opacity="0.85"/>
          <polygon points="78,42 78.8,44.5 81.5,44.5 79.3,46 80.1,48.5 78,47 75.9,48.5 76.7,46 74.5,44.5 77.2,44.5" fill="white" opacity="0.75"/>
          <polygon points="65,48 65.6,50 67.5,50 66,51.2 66.6,53.2 65,52 63.4,53.2 64,51.2 62.5,50 64.4,50" fill="white" opacity="0.75"/>

          {/* 연방성 (왼쪽 하단) */}
          <polygon points="22,58 23.8,63.5 29.5,63.5 24.8,67 26.6,72.5 22,69 17.4,72.5 19.2,67 14.5,63.5 20.2,63.5" fill="white" opacity="0.95"/>
        </svg>

        {/* 타이틀 */}
        <div style={{ textAlign:'center' }}>
          <div style={{ lineHeight: 1.1 }}>
            <span style={{
              fontSize: 42,
              fontWeight: 900,
              color: '#FFFFFF',
              fontFamily: '"Pretendard",-apple-system,sans-serif',
              letterSpacing: -1,
            }}>호주</span>
            <span style={{
              fontSize: 42,
              fontWeight: 800,
              color: '#FFFFFF',
              fontFamily: '"Nanum Myeongjo", serif',
              letterSpacing: 2,
              marginLeft: 6,
            }}>가자</span>
          </div>
          <div style={{
            fontSize: 13,
            color: 'rgba(255,255,255,0.45)',
            fontWeight: 500,
            marginTop: 10,
            letterSpacing: 0.3,
          }}>여행준비 체크리스트부터 현지 업체까지</div>
        </div>
      </div>

      {/* ── 중앙: 코드 박스 ── */}
      <div className="f3" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap: 20 }}>
        <div style={{ display:'flex', gap: 10 }}>
          {LETTERS.map((letter, i) => (
            <div key={i} style={{
              width: 40,
              height: 50,
              borderRadius: 10,
              border: '1.5px solid rgba(255,255,255,0.25)',
              background: 'rgba(255,255,255,0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 17,
              fontWeight: 700,
              color: '#FFFFFF',
              position: 'relative',
            }}>
              {letter}
              {/* 마지막 글자 뒤 커서 */}
              {i === LETTERS.length - 1 && (
                <span className="cursor" style={{
                  position: 'absolute',
                  bottom: 8,
                  right: 6,
                  width: 2,
                  height: 16,
                  background: '#FFFFFF',
                  borderRadius: 1,
                  display: 'block',
                }}/>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── 하단: 버튼 2개 ── */}
      <div className="f5" style={{ display:'flex', flexDirection:'column', gap: 12, width:'100%' }}>

        {/* 버킷리스트 버튼 - 흰색 채우기 */}
        <button
          className="btn-fill"
          onClick={onStartChecklist}
          style={{
            width: '100%',
            height: 54,
            background: '#FFFFFF',
            color: '#0A0A0A',
            border: 'none',
            borderRadius: 14,
            fontSize: 15,
            fontWeight: 800,
            cursor: 'pointer',
            letterSpacing: 0.2,
            fontFamily: 'inherit',
          }}
        >
          호주 여행 버킷리스트
        </button>

        {/* 업체 버튼 - 아웃라인 */}
        <button
          className="btn-outline"
          onClick={onStartServices}
          style={{
            width: '100%',
            height: 54,
            background: 'transparent',
            color: '#FFFFFF',
            border: '1.5px solid rgba(255,255,255,0.35)',
            borderRadius: 14,
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
            letterSpacing: 0.2,
            fontFamily: 'inherit',
          }}
        >
          업체 · 서비스 찾기
        </button>

      </div>
    </div>
  )
}
