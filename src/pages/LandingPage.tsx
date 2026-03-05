import { AppState } from '../store/state'
import { ITEMS } from '../data/checklist'

const BG_ICONS = [
  { icon:'🐨', top:'20%', left:'3%',   size:50, delay:0.4 },
  { icon:'🦘', top:'26%', right:'4%',  size:44, delay:1.2 },
  { icon:'🌏', top:'50%', left:'2%',   size:38, delay:0.6 },
  { icon:'🪃', top:'55%', right:'3%',  size:46, delay:1.8 },
  { icon:'🦘', top:'65%', left:'18%',  size:42, delay:0.4 },
  { icon:'⭐', top:'75%', right:'5%',  size:44, delay:1.4 },
]

const FLOATERS = [
  { label:'🦘 캥거루',    top:'5%',  left:'6%',    anim:'floatA', delay:0    },
  { label:'🏖 골드코스트', top:'8%',  right:'5%',   anim:'floatB', delay:0.9  },
  { label:'🐨 코알라',    top:'30%', right:'4%',   anim:'floatB', delay:1.4  },
  { label:'🌿 멜버른',    top:'28%', left:'4%',    anim:'floatA', delay:0.8  },
  { label:'🪃 부메랑',    top:'63%', right:'4%',   anim:'floatA', delay:1.1  },
  { label:'🦘 울루루',    top:'76%', left:'8%',    anim:'floatB', delay:0.5  },
  { label:'🌟 시드니',    top:'80%', right:'6%',   anim:'floatB', delay:0.6  },
]

const PREVIEW_DEFAULTS = [
  { label:'본다이비치 가기', emoji:'🌊' },
  { label:'오포르토 햄버거 먹기', emoji:'🍔' },
]

type Props = { state: AppState; onStart: () => void }

export default function LandingPage({ state, onStart }: Props) {
  const total = ITEMS.length + state.customItems.length
  const previewItems = PREVIEW_DEFAULTS

  return (
    <div style={{
      minHeight:'100vh',
      background:'linear-gradient(160deg, #EEF2FF 0%, #F0F4FF 50%, #F5F8FF 100%)',
      position:'relative', overflow:'hidden',
      display:'flex', flexDirection:'column', alignItems:'center',
    }}>
      {/* Glow top right */}
      <div style={{ position:'absolute', top:-80, right:-80, width:280, height:280, borderRadius:'50%', background:'radial-gradient(circle, rgba(79,107,220,0.12) 0%, transparent 70%)', pointerEvents:'none' }}/>
      {/* Glow bottom left */}
      <div style={{ position:'absolute', bottom:100, left:-60, width:220, height:220, borderRadius:'50%', background:'radial-gradient(circle, rgba(48,79,180,0.08) 0%, transparent 70%)', pointerEvents:'none' }}/>

      {/* Background icons */}
      {BG_ICONS.map((b, i) => (
        <div key={i} style={{
          position:'absolute', top:b.top,
          left:(b as any).left, right:(b as any).right,
          fontSize:b.size, opacity:0.07,
          filter:'grayscale(30%) brightness(0.5)',
          animation:`${i%2===0?'floatA':'floatB'} ${3.5+i*0.4}s ease-in-out ${b.delay}s infinite`,
          userSelect:'none', pointerEvents:'none', zIndex:0,
        } as React.CSSProperties}>{b.icon}</div>
      ))}

      {/* Floating pills */}
      {FLOATERS.map((f, i) => (
        <div key={i} style={{
          position:'absolute', top:f.top,
          left:(f as any).left, right:(f as any).right,
          background:'rgba(255,255,255,0.75)',
          backdropFilter:'blur(8px)',
          borderRadius:40, padding:'6px 14px',
          fontSize:12.5, fontWeight:700, color:'#304FB4',
          whiteSpace:'nowrap',
          border:'1px solid rgba(48,79,180,0.12)',
          boxShadow:'0 2px 10px rgba(48,79,180,0.08)',
          animation:`${f.anim} ${2.8+i*0.3}s ease-in-out ${f.delay}s infinite`,
          zIndex:1,
        } as React.CSSProperties}>{f.label}</div>
      ))}

      {/* Hero */}
      <div style={{
        marginTop:'22%',
        display:'flex', flexDirection:'column', alignItems:'center',
        zIndex:2, animation:'fadeInUp 0.7s ease both',
      }}>
        {/* 알약 */}
        <div style={{
          background:'rgba(255,255,255,0.85)',
          backdropFilter:'blur(8px)',
          borderRadius:40, padding:'8px 20px',
          fontSize:13, fontWeight:700, color:'#304FB4',
          marginBottom:24,
          border:'1px solid rgba(48,79,180,0.14)',
          boxShadow:'0 2px 12px rgba(48,79,180,0.10)',
          animation:'floatB 3.2s ease-in-out 0.4s infinite',
        }}>✈️ 호주 여행 체크리스트</div>

        {/* 타이틀 */}
        <h1 style={{
          fontSize:35, fontWeight:900, letterSpacing:-1.5,
          background:'linear-gradient(135deg, #304FB4 0%, #4F6BDC 50%, #304FB4 100%)',
          backgroundSize:'200% auto',
          WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
          animation:'shimmer 4s linear infinite',
          marginBottom:10, lineHeight:1.1,
        }}>호주가자</h1>

        <p style={{ color:'#6B7280', fontSize:14, fontWeight:500, marginBottom:28, letterSpacing:0.2 }}>
          호주 가기 전에 꼭 체크하자!
        </p>
      </div>

      {/* Boarding pass card */}
      <div style={{
        width:'calc(100% - 48px)', maxWidth:310,
        borderRadius:20, overflow:'hidden',
        boxShadow:'0 10px 36px rgba(48,79,180,0.16)',
        zIndex:2, animation:'fadeInUp 0.8s ease 0.15s both',
        marginBottom:100,
        border:'1px solid rgba(48,79,180,0.10)',
      }}>
        {/* Header band */}
        <div style={{
          background:'linear-gradient(135deg, #4F6BDC 0%, #304FB4 100%)',
          padding:'14px 18px 12px', position:'relative', overflow:'hidden',
        }}>
          <div style={{ position:'absolute', top:-20, right:-20, width:80, height:80, borderRadius:'50%', background:'rgba(255,255,255,0.08)' }}/>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div>
              <div style={{ color:'rgba(255,255,255,0.6)', fontSize:8, letterSpacing:3, fontWeight:700, marginBottom:3 }}>BOARDING PASS</div>
              <div style={{ color:'#fff', fontSize:17, fontWeight:900, letterSpacing:0.5 }}>호주가자 🦘</div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ color:'rgba(255,255,255,0.6)', fontSize:8, letterSpacing:2, marginBottom:3 }}>DESTINATION</div>
              <div style={{ color:'#fff', fontSize:20, fontWeight:900, letterSpacing:1 }}>AUS</div>
            </div>
          </div>
          <div style={{ display:'flex', gap:14, marginTop:10, paddingTop:8, borderTop:'1px solid rgba(255,255,255,0.2)' }}>
            <div>
              <div style={{ color:'rgba(255,255,255,0.6)', fontSize:7.5, letterSpacing:1.5 }}>ROUTE</div>
              <div style={{ color:'#fff', fontSize:11, fontWeight:700 }}>KOR ✈ AUS</div>
            </div>
            <div>
              <div style={{ color:'rgba(255,255,255,0.6)', fontSize:7.5, letterSpacing:1.5 }}>CHECKED</div>
              <div style={{ color:'#fff', fontSize:11, fontWeight:700 }}>12/{total}</div>
            </div>
          </div>
        </div>

        {/* Perforation */}
        <div style={{ display:'flex', alignItems:'center', background:'#F0F4FF', padding:'0 12px', height:18 }}>
          <div style={{ flex:1, borderTop:'2px dashed rgba(48,79,180,0.2)' }}/>
          <div style={{ width:18, height:18, borderRadius:'50%', background:'#EEF2FF', border:'1px solid rgba(48,79,180,0.15)', margin:'0 6px', flexShrink:0 }}/>
          <div style={{ flex:1, borderTop:'2px dashed rgba(48,79,180,0.2)' }}/>
        </div>

        {/* Items */}
        <div style={{ background:'#fff', padding:'12px 18px 14px' }}>
          <div style={{ fontSize:8, color:'#aaa', letterSpacing:2.5, fontWeight:700, marginBottom:10 }}>RECEIPT TO DO [AU]</div>
          {previewItems.map((item, i) => (
            <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:13, color:'#555', padding:'4px 0', borderBottom:'1px solid #EEF2FF' }}>
              <span>{item.emoji} {item.label}</span>
              <span style={{ color:'#304FB4', fontWeight:700 }}>✓</span>
            </div>
          ))}
          {[1,2].map(i => (
            <div key={i} style={{ height:11, background:'#EEF2FF', borderRadius:4, margin:'6px 0' }}/>
          ))}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:10, paddingTop:8, borderTop:'1px dashed rgba(48,79,180,0.15)' }}>
            <span style={{ fontWeight:800, fontSize:13 }}>TOTAL</span>
            <span style={{ color:'#304FB4', fontWeight:800, fontSize:13 }}>12/{total}건</span>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{
        position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)',
        width:'100%', maxWidth:430,
        padding:'8px 16px 20px', background:'transparent', zIndex:20,
      }}>
        <button onClick={onStart} className="hg-btn hg-btn--primary hg-btn--full" style={{ borderRadius:16, fontSize:15 }}>
          보딩패스 발급하기
        </button>
        <div style={{ fontSize:11, color:'#9CA3AF', textAlign:'center', marginTop:5 }}>
          호주에서 꼭 해야 할 것들을 기록하세요
        </div>
      </div>
    </div>
  )
}
