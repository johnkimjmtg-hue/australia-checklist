const HERO_BG = '/hero-bg.jpg'

type Props = {
  onStartChecklist: () => void
  onStartServices:  () => void
}

export default function LandingPage({ onStartChecklist, onStartServices }: Props) {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#EBF0F8',
      fontFamily: '"Pretendard",-apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif',
      display: 'flex',
      flexDirection: 'column',
      maxWidth: 430,
      margin: '0 auto',
      overflow: 'hidden',
    }}>
      <style>{`
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');

        @keyframes fadeUp {
          from { opacity:0; transform:translateY(20px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .fade1 { animation: fadeUp 0.5s ease 0.1s both; }
        .fade2 { animation: fadeUp 0.5s ease 0.25s both; }
        .fade3 { animation: fadeUp 0.5s ease 0.4s both; }

        .menu-card {
          transition: transform 0.18s, box-shadow 0.18s;
          cursor: pointer;
        }
        .menu-card:hover  { transform: translateY(-3px); box-shadow: 0 14px 36px rgba(30,77,131,0.16) !important; }
        .menu-card:active { transform: scale(0.98); }
      `}</style>

      {/* ── 히어로 이미지 영역 ── */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '62vh',
        maxHeight: 480,
        flexShrink: 0,
        overflow: 'hidden',
      }}>
        {/* 배경 이미지 */}
        <img
          src={HERO_BG}
          alt="호주"
          style={{
            width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: 'center top',
            display: 'block',
          }}
        />

        {/* 하단 페이드 */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: 120,
          background: 'linear-gradient(to bottom, transparent, #EBF0F8)',
          pointerEvents: 'none',
        }} />

        {/* 호주가자 텍스트 - 비행기 아래 */}
        <div style={{
          position: 'absolute',
          top: '18%',
          left: 0, right: 0,
          textAlign: 'center',
          pointerEvents: 'none',
        }}>
          <div style={{
            fontSize: 32,
            fontWeight: 900,
            color: '#1E3A5F',
            letterSpacing: -0.5,
            textShadow: '0 2px 12px rgba(255,255,255,0.9), 0 1px 4px rgba(255,255,255,0.8)',
          }}>호주 가자! 🦘</div>
        </div>
      </div>

      {/* ── 하단 카드 영역 ── */}
      <div style={{
        flex: 1,
        background: '#EBF0F8',
        padding: '4px 20px 40px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>

        {/* 서브타이틀 */}
        <div className="fade1" style={{
          fontSize: 13, color: '#7A8FB5', fontWeight: 600,
          textAlign: 'center', marginBottom: 20, letterSpacing: 0.2,
        }}>
          준비 체크리스트부터 현지 한인 업체까지
        </div>

        {/* 버킷리스트 카드 */}
        <div
          className="menu-card fade2"
          onClick={onStartChecklist}
          style={{
            width: '100%', boxSizing: 'border-box',
            background: '#fff',
            borderRadius: 20,
            padding: '20px 20px',
            boxShadow: '0 4px 20px rgba(30,77,131,0.10)',
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div style={{
            width: 52, height: 52, borderRadius: 14, flexShrink: 0,
            background: 'linear-gradient(135deg, #3A7FCC, #1E4D83)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24,
          }}>✅</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#0F1B2D', marginBottom: 3 }}>
              호주 준비 체크리스트
            </div>
            <div style={{ fontSize: 12, color: '#8A97A8', fontWeight: 500, lineHeight: 1.5 }}>
              이민·여행 준비 항목을 단계별로 체크해요
            </div>
          </div>
          <div style={{ fontSize: 22, color: '#C0CCDA', flexShrink: 0 }}>›</div>
        </div>

        {/* 업체찾기 카드 */}
        <div
          className="menu-card fade3"
          onClick={onStartServices}
          style={{
            width: '100%', boxSizing: 'border-box',
            background: '#fff',
            borderRadius: 20,
            padding: '20px 20px',
            boxShadow: '0 4px 20px rgba(30,77,131,0.10)',
            marginBottom: 28,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div style={{
            width: 52, height: 52, borderRadius: 14, flexShrink: 0,
            background: 'linear-gradient(135deg, #FF7043, #FF5A1F)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24,
          }}>🏢</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#0F1B2D', marginBottom: 3 }}>
              한인 업체·서비스 찾기
            </div>
            <div style={{ fontSize: 12, color: '#8A97A8', fontWeight: 500, lineHeight: 1.5 }}>
              부동산, 병원, 식당 등 시드니 한인 업체
            </div>
          </div>
          <div style={{ fontSize: 22, color: '#C0CCDA', flexShrink: 0 }}>›</div>
        </div>

        {/* 하단 */}
        <div style={{ fontSize: 12, color: '#B0BAC5', fontWeight: 500, textAlign: 'center', lineHeight: 1.8 }}>
          완전 무료 · 로그인 불필요<br/>
          문의:{' '}
          <a
            href="https://www.threads.net/@palaslouise"
            target="_blank" rel="noopener noreferrer"
            style={{ color: '#1E4D83', fontWeight: 700, textDecoration: 'none' }}
          >@palaslouise</a>
        </div>
      </div>
    </div>
  )
}
