const HERO_BG   = '/hero-bg.jpg'
const SUITCASE  = '/suitcase.png'

type Props = {
  onStartChecklist: () => void
  onStartServices:  () => void
}

export default function LandingPage({ onStartChecklist, onStartServices }: Props) {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#EEF2F8',
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
          from { opacity:0; transform:translateY(24px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes floatBag {
          0%,100% { transform: translateY(0px); }
          50%     { transform: translateY(-10px); }
        }
        @keyframes flyPlane {
          0%   { transform: translateX(-120px) translateY(10px); opacity:0; }
          5%   { opacity:1; }
          100% { transform: translateX(120vw) translateY(-30px); opacity:1; }
        }

        .fade-up-1 { animation: fadeUp 0.6s ease 0.1s both; }
        .fade-up-2 { animation: fadeUp 0.6s ease 0.25s both; }
        .fade-up-3 { animation: fadeUp 0.6s ease 0.4s both; }

        .bag { animation: floatBag 4s ease-in-out infinite; }

        .menu-card {
          transition: transform 0.18s, box-shadow 0.18s;
          cursor: pointer;
        }
        .menu-card:hover  { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(30,77,131,0.18) !important; }
        .menu-card:active { transform: scale(0.98); }
      `}</style>

      {/* ── 히어로 상단 ── */}
      <div style={{
        position: 'relative',
        height: 420,
        overflow: 'hidden',
        flexShrink: 0,
      }}>
        {/* 배경 이미지 */}
        <img
          src={HERO_BG}
          alt="시드니"
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: 'center top',
          }}
        />
        {/* 하단 페이드 오버레이 */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: 160,
          background: 'linear-gradient(to bottom, transparent, #EEF2F8)',
          pointerEvents: 'none',
        }} />
        {/* 상단 어둠 오버레이 (텍스트 가독성) */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(200,220,240,0.3) 0%, transparent 60%)',
          pointerEvents: 'none',
        }} />

        {/* 여행가방 */}
        <div className="bag" style={{
          position: 'absolute',
          bottom: 40, left: '50%',
          transform: 'translateX(-50%)',
          width: 220,
          zIndex: 3,
        }}>
          <img src={SUITCASE} alt="여행가방" style={{ width: '100%', height: 'auto', display: 'block', filter: 'drop-shadow(0 16px 32px rgba(30,77,131,0.25))' }} />
        </div>
      </div>

      {/* ── 하단 컨텐츠 ── */}
      <div style={{
        flex: 1,
        background: '#EEF2F8',
        padding: '0 20px 40px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>

        {/* 타이틀 */}
        <div className="fade-up-1" style={{ textAlign: 'center', marginBottom: 28, marginTop: 4 }}>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: 2,
            color: '#1E4D83', marginBottom: 8, textTransform: 'uppercase',
          }}>BUCKET LIST</div>
          <div style={{
            fontSize: 28, fontWeight: 900, color: '#0F1B2D',
            letterSpacing: -0.5, lineHeight: 1.2, marginBottom: 8,
          }}>호주 여행 버킷리스트</div>
          <div style={{ fontSize: 14, color: '#7A8FB5', fontWeight: 500 }}>
            준비 체크리스트부터 현지 한인 업체까지
          </div>
        </div>

        {/* 버킷리스트 카드 */}
        <div
          className="menu-card fade-up-2"
          onClick={onStartChecklist}
          style={{
            width: '100%',
            background: '#fff',
            borderRadius: 20,
            padding: '22px 20px',
            boxShadow: '0 4px 20px rgba(30,77,131,0.10)',
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            boxSizing: 'border-box',
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
          <div style={{ fontSize: 22, color: '#C0CCDA', flexShrink: 0, fontWeight: 300 }}>›</div>
        </div>

        {/* 업체찾기 카드 */}
        <div
          className="menu-card fade-up-3"
          onClick={onStartServices}
          style={{
            width: '100%',
            background: '#fff',
            borderRadius: 20,
            padding: '22px 20px',
            boxShadow: '0 4px 20px rgba(30,77,131,0.10)',
            marginBottom: 28,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            boxSizing: 'border-box',
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
          <div style={{ fontSize: 22, color: '#C0CCDA', flexShrink: 0, fontWeight: 300 }}>›</div>
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
