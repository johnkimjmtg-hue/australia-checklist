import { AppState } from '../store/state'
import { ITEMS, CATEGORIES } from '../data/checklist'

const BUCKET_IMG = '/bucket-logo.png'
const LOGO_IMG = '/logo.png'
const PLANE_IMG = '/plane.png'

const CATS_6 = ['hospital','food','shopping','admin','places','schedule']

const FIXED_PREVIEW = [
  { label:'시드니 센트럴파크에서 음악듣기', emoji:'🎵' },
  { label:'본다이비치 서핑',                emoji:'🌊' },
]

const STARS = [
  { top:'4%',  left:'8%',  size:5, delay:0,   dur:2.2 },
  { top:'7%',  left:'55%', size:3, delay:0.8, dur:3.1 },
  { top:'11%', right:'9%', size:6, delay:1.5, dur:2.6 },
  { top:'17%', left:'22%', size:4, delay:0.3, dur:2.9 },
  { top:'19%', right:'18%',size:3, delay:2.1, dur:2.4 },
  { top:'25%', left:'6%',  size:5, delay:1.1, dur:3.3 },
  { top:'33%', right:'7%', size:4, delay:0.6, dur:2.7 },
  { top:'44%', right:'12%',size:6, delay:0.4, dur:3.0 },
  { top:'15%', left:'40%', size:4, delay:0.5, dur:2.8 },
]

// SVG 구름 컴포넌트
function Cloud({ width, opacity = 1 }: { width: number; opacity?: number }) {
  return (
    <svg width={width} height={width * 0.6} viewBox="0 0 120 72" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display:'block' }}>
      <ellipse cx="60" cy="52" rx="50" ry="20" fill="rgba(235,240,250,0.95)"/>
      <circle cx="38" cy="46" r="22" fill="rgba(240,244,252,0.95)"/>
      <circle cx="62" cy="38" r="28" fill="rgba(242,246,253,0.98)"/>
      <circle cx="86" cy="44" r="20" fill="rgba(238,242,251,0.95)"/>
      <ellipse cx="60" cy="56" rx="50" ry="16" fill="rgba(236,241,251,0.90)"/>
      {/* 하이라이트 */}
      <ellipse cx="52" cy="32" rx="10" ry="6" fill="rgba(255,255,255,0.6)" style={{ filter:'blur(3px)' as any }}/>
    </svg>
  )
}

type Props = { state: AppState; onStart: () => void }

export default function LandingPage({ state, onStart }: Props) {
  const total = ITEMS.length + state.customItems.length

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(170deg, #eef2fa 0%, #f3f6fb 50%, #f5f7fb 100%)',
      position: 'relative', overflow: 'hidden',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      fontFamily: '-apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif',
    }}>

      <style>{`
        @keyframes flyPlane {
          0%   { transform: translateX(-80px) translateY(0px); opacity:0; }
          5%   { opacity:1; }
          30%  { transform: translateX(calc(20vw)) translateY(-12px); }
          60%  { transform: translateX(calc(55vw)) translateY(-6px); }
          90%  { transform: translateX(calc(90vw)) translateY(-10px); opacity:1; }
          100% { transform: translateX(calc(110vw)) translateY(-8px); opacity:0; }
        }
        @keyframes twinkle {
          0%,100% { opacity:0.1; transform:scale(0.8); }
          50%      { opacity:0.9; transform:scale(1.2); }
        }
        @keyframes shimmer {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
        @keyframes shimmerSlide {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
        @keyframes driftBucket {
          0%,100% { transform:translate(0px,0px); }
          30%     { transform:translate(4px,-10px); }
          65%     { transform:translate(-4px,-6px); }
        }
        @keyframes driftCard {
          0%,100% { transform:translate(0px,0px); }
          35%     { transform:translate(-3px,-8px); }
          70%     { transform:translate(3px,-5px); }
        }
        @keyframes cloud1 {
          0%,100% { transform:translate(0px,0px); }
          40%     { transform:translate(8px,-7px); }
          75%     { transform:translate(-5px,-4px); }
        }
        @keyframes cloud2 {
          0%,100% { transform:translate(0px,0px); }
          35%     { transform:translate(-9px,6px); }
          70%     { transform:translate(6px,3px); }
        }
        @keyframes cloud3 {
          0%,100% { transform:translate(0px,0px); }
          30%     { transform:translate(6px,8px); }
          65%     { transform:translate(-7px,4px); }
        }
      `}</style>

      {/* 별들 */}
      {STARS.map((s, i) => (
        <div key={i} style={{
          position:'absolute', top:s.top,
          left:(s as any).left, right:(s as any).right,
          width:s.size, height:s.size, borderRadius:'50%',
          background:'rgba(30,77,131,0.5)',
          boxShadow:`0 0 ${s.size*2}px ${s.size}px rgba(90,150,220,0.25)`,
          animation:`twinkle ${s.dur}s ease-in-out ${s.delay}s infinite`,
          pointerEvents:'none', zIndex:1,
        } as React.CSSProperties}/>
      ))}

      {/* SVG 구름 3개 — 크기/위치/속도 다르게, 카테고리 위쪽에만 */}
      <div style={{ position:'absolute', top:'8%', left:'-2%', animation:'cloud1 10s ease-in-out infinite', zIndex:1, pointerEvents:'none' }}>
        <Cloud width={110} />
      </div>
      <div style={{ position:'absolute', top:'22%', right:'-3%', animation:'cloud2 13s ease-in-out 1.5s infinite', zIndex:1, pointerEvents:'none' }}>
        <Cloud width={80} />
      </div>
      <div style={{ position:'absolute', top:'42%', left:'-4%', animation:'cloud3 11s ease-in-out 0.8s infinite', zIndex:1, pointerEvents:'none' }}>
        <Cloud width={64} />
      </div>

      {/* 메인 콘텐츠 */}
      <div style={{
        zIndex:2, display:'flex', flexDirection:'column', alignItems:'center',
        flex:1, justifyContent:'center',
        paddingBottom:90, width:'100%', textAlign:'center',
      }}>
        {/* 비행기 */}
        <div style={{
          position:'absolute', top:'4%', left:0,
          animation:'flyPlane 6s ease-in-out infinite',
          pointerEvents:'none', zIndex:3,
        }}>
          <img src={PLANE_IMG} alt="비행기" style={{ width:64, height:'auto' }}/>
        </div>

        {/* 호주가자 로고 shimmer */}
        <div style={{ position:'relative', marginBottom:6, overflow:'hidden', borderRadius:8 }}>
          <img src={LOGO_IMG} alt="호주가자" style={{
            width:200, height:'auto', display:'block',
            filter:'drop-shadow(0 2px 8px rgba(30,77,131,0.18))',
          }}/>
          {/* shimmer overlay */}
          <div style={{
            position:'absolute', top:0, left:0, width:'30%', height:'100%',
            background:'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.55) 50%, transparent 70%)',
            animation:'shimmerSlide 2.8s ease-in-out infinite',
            pointerEvents:'none',
          }}/>
        </div>

        <p style={{ color:'#7a8fb5', fontSize:13, fontWeight:700, marginBottom:24, lineHeight:1.7 }}>
          <span style={{ color:'#1E4D83', fontWeight:900 }}>호주 여행 버킷리스트</span>, 지금 바로 기록하자
        </p>

        {/* 버킷 이미지 */}
        <div style={{ width:'16%', maxWidth:60, marginBottom:48, marginTop:16 }}>
          <img src={BUCKET_IMG} alt="버킷" style={{
            width:'100%', height:'auto', objectFit:'contain', display:'block',
            animation:'driftBucket 7s ease-in-out infinite',
          }}/>
        </div>

        {/* 카테고리 칩 6개 */}
        <div style={{
          display:'flex', gap:5, justifyContent:'center',
          padding:'0 12px', marginBottom:16, flexWrap:'nowrap',
        }}>
          {CATEGORIES.filter(c => CATS_6.includes(c.id)).map(cat => (
            <div key={cat.id} style={{
              background:'rgba(200,218,248,0.80)',
              border:'1px solid rgba(100,150,220,0.18)',
              borderRadius:8, padding:'5px 8px',
              fontSize:10, fontWeight:700, color:'#3a5fa5',
              whiteSpace:'nowrap', backdropFilter:'blur(4px)',
            }}>{cat.label}</div>
          ))}
        </div>

        {/* 미니 카드 */}
        <div style={{
          width:'calc(100% - 48px)', maxWidth:300,
          background:'rgba(255,255,255,0.95)', borderRadius:16,
          padding:'14px 16px 12px',
          boxShadow:'0 4px 20px rgba(100,130,200,0.10)',
          textAlign:'left',
          animation:'driftCard 8s ease-in-out 1s infinite',
        }}>
          <div style={{ color:'#1E4D83', fontWeight:900, fontSize:11, letterSpacing:1.5, marginBottom:10, textAlign:'center' }}>
            호주가자 버킷리스트
          </div>
          <div style={{ borderTop:'1px dashed rgba(30,77,131,0.15)', marginBottom:8 }}/>
          {FIXED_PREVIEW.map((item, i) => (
            <div key={i} style={{
              display:'flex', justifyContent:'space-between', alignItems:'center',
              fontSize:12, color:'#3A4A5C', padding:'5px 0',
              borderBottom:'1px solid rgba(30,77,131,0.06)',
            }}>
              <span style={{ fontWeight:500 }}>{item.emoji} {item.label}</span>
              <span style={{ color:'#1E4D83', fontWeight:800, fontSize:11 }}>✓</span>
            </div>
          ))}
          {[0,1].map(i => (
            <div key={i} style={{ height:11, background:'rgba(180,205,240,0.20)', borderRadius:4, margin:'6px 0' }}/>
          ))}
          <div style={{ borderTop:'1px dashed rgba(30,77,131,0.15)', margin:'8px 0 4px' }}/>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontWeight:900, fontSize:12, color:'#0F1B2D' }}>TOTAL</span>
            <span style={{ color:'#8AAAC8', fontWeight:900, fontSize:12 }}>??/{total}건</span>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{
        position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)',
        width:'100%', maxWidth:390, padding:'10px 16px 28px',
        background:'linear-gradient(to top,#eef2fa 60%,transparent)',
        zIndex:20, boxSizing:'border-box',
      }}>
        <button onClick={onStart} style={{
          width:'100%', height:52,
          background:'linear-gradient(160deg,#3A7FCC,#1E4D83)',
          color:'#fff', border:'none', borderRadius:14,
          fontSize:15, fontWeight:900, cursor:'pointer', letterSpacing:0.3,
          boxShadow:'0 4px 16px rgba(30,77,131,0.28)',
        }}>호주 여행 시작하기</button>
        <p style={{ textAlign:'center', fontSize:11, color:'#8AAAC8', marginTop:7, fontWeight:700 }}>
          호주에서 꼭 해야 할 것들을 정리해보세요
        </p>
      </div>
    </div>
  )
}
