import { useState, useEffect, useRef } from 'react'
import { Icon } from '@iconify/react'

// ── 멜번 카페 25개 플레이스홀더 데이터
const MELBOURNE_CAFES = [
  { id: 1,  name: 'Proud Mary',         img: '' },
  { id: 2,  name: 'ST. ALi',            img: '' },
  { id: 3,  name: 'Dukes Coffee',       img: '' },
  { id: 4,  name: 'Axil Coffee',        img: '' },
  { id: 5,  name: 'Seven Seeds',        img: '' },
  { id: 6,  name: 'Brother Baba Budan', img: '' },
  { id: 7,  name: 'Market Lane',        img: '' },
  { id: 8,  name: 'Ona Coffee',         img: '' },
  { id: 9,  name: 'Padre Coffee',       img: '' },
  { id: 10, name: 'Code Black',         img: '' },
  { id: 11, name: 'Allpress',           img: '' },
  { id: 12, name: 'Patricia Coffee',    img: '' },
  { id: 13, name: 'Sensory Lab',        img: '' },
  { id: 14, name: 'Geppetto',           img: '' },
  { id: 15, name: 'Mecca Coffee',       img: '' },
  { id: 16, name: 'Convoy',             img: '' },
  { id: 17, name: 'Wide Open Road',     img: '' },
  { id: 18, name: 'Pellegrini\'s',      img: '' },
  { id: 19, name: 'Cibi',               img: '' },
  { id: 20, name: 'Monk Bodhi',         img: '' },
  { id: 21, name: 'Everyday Coffee',    img: '' },
  { id: 22, name: 'Industry Beans',     img: '' },
  { id: 23, name: 'Small Batch',        img: '' },
  { id: 24, name: 'Aunty Peg\'s',       img: '' },
  { id: 25, name: 'Fitzrovia',          img: '' },
]

// ── 빙고 라인 체크 (5x5)
function getBingoLines(checked: Set<number>): number[][] {
  const lines: number[][] = []
  // 가로
  for (let r = 0; r < 5; r++) {
    lines.push([r*5, r*5+1, r*5+2, r*5+3, r*5+4])
  }
  // 세로
  for (let c = 0; c < 5; c++) {
    lines.push([c, c+5, c+10, c+15, c+20])
  }
  // 대각선
  lines.push([0,6,12,18,24])
  lines.push([4,8,12,16,20])
  return lines
}

function getCompletedLines(checked: Set<number>): number[][] {
  return getBingoLines(checked).filter(line => line.every(i => checked.has(i)))
}

// ── 꽃가루
interface Petal { id: number; x: number; color: string; size: number; duration: number; delay: number; rotate: number }
function Confetti({ trigger }: { trigger: number }) {
  const [petals, setPetals] = useState<Petal[]>([])
  const prev = useRef(0)
  useEffect(() => {
    if (trigger === 0 || trigger === prev.current) return
    prev.current = trigger
    const colors = ['#FFCD00','#1B6EF3','#FF6B6B','#4ECDC4','#A8E6CF','#FFB347','#C9B1FF']
    setPetals(Array.from({ length: 50 }, (_, i) => ({
      id: Date.now()+i,
      x: Math.random()*100,
      color: colors[Math.floor(Math.random()*colors.length)],
      size: 5 + Math.random()*8,
      duration: 1.2 + Math.random()*1,
      delay: Math.random()*0.5,
      rotate: Math.random()*360,
    })))
    setTimeout(() => setPetals([]), 3500)
  }, [trigger])
  if (!petals.length) return null
  return (
    <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:9000, overflow:'hidden' }}>
      {petals.map(p => (
        <div key={p.id} style={{
          position:'absolute', top:'-10px', left:`${p.x}%`,
          width: p.size, height: p.size * 0.6,
          background: p.color, borderRadius: 2,
          transform: `rotate(${p.rotate}deg)`,
          animation: `confettiFall ${p.duration}s ease-in ${p.delay}s forwards`,
        }}/>
      ))}
    </div>
  )
}

// ── 폭죽 (ChecklistPage에서 가져옴)
function FireworkBurst({ cx, cy, delay = 0 }: { cx: number; cy: number; delay?: number }) {
  const colors = ['#FFCD00','#1B6EF3','#FF4B4B','#4ECDC4','#FF9F43','#A29BFE','#55EFC4','#FD79A8','#fff']
  const particles = Array.from({ length: 80 }, (_, i) => {
    const angle  = (i / 80) * 360
    const dist   = 100 + Math.random() * 160
    const rad    = (angle * Math.PI) / 180
    const tx     = Math.cos(rad) * dist
    const ty     = Math.sin(rad) * dist
    const color  = colors[Math.floor(Math.random() * colors.length)]
    const dur    = 0.9 + Math.random() * 0.7
    const size   = 5 + Math.random() * 8
    const isRect = i % 3 !== 0
    return { tx, ty, color, delay: delay + Math.random()*0.3, dur, size, isRect, angle }
  })
  return (
    <>
      {particles.map((p, i) => (
        <div key={i} style={{
          position:'absolute', left:`${cx}%`, top:`${cy}%`,
          width: p.isRect ? p.size*0.5 : p.size,
          height: p.isRect ? p.size*2 : p.size,
          borderRadius: p.isRect ? 2 : '50%',
          background: p.color,
          // @ts-ignore
          '--tx': `${p.tx}px`, '--ty': `${p.ty}px`, '--r': `${p.angle}deg`,
          animation: `fwBurst ${p.dur}s ease-out ${p.delay}s both`,
          boxShadow: `0 0 ${p.size*1.5}px ${p.color}`,
        }}/>
      ))}
      {/* 중앙 플래시 */}
      <div style={{
        position:'absolute', left:`${cx}%`, top:`${cy}%`,
        transform:'translate(-50%,-50%)',
        width:80, height:80, borderRadius:'50%',
        background:'radial-gradient(circle, rgba(255,205,0,0.95) 0%, transparent 70%)',
        // @ts-ignore
        '--tx':'0px', '--ty':'0px', '--r':'0deg',
        animation: `fwBurst 0.6s ease-out ${delay}s both`,
      }}/>
    </>
  )
}

function Fireworks() {
  return (
    <div style={{ position:'fixed', inset:0, zIndex:9999, pointerEvents:'none', overflow:'hidden' }}>
      {/* 가운데 크게 */}
      <FireworkBurst cx={50} cy={45} delay={0} />
      {/* 좌우 */}
      <FireworkBurst cx={20} cy={55} delay={0.4} />
      <FireworkBurst cx={80} cy={55} delay={0.4} />
      {/* 상단 */}
      <FireworkBurst cx={35} cy={25} delay={0.7} />
      <FireworkBurst cx={65} cy={25} delay={0.9} />
      {/* 가운데 두번째 */}
      <FireworkBurst cx={50} cy={50} delay={1.2} />
    </div>
  )
}

type Props = { onBack: () => void }

export default function BingoPage({ onBack }: Props) {
  const [checked, setChecked] = useState<Set<number>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('bingo-melbourne') ?? '[]')) }
    catch { return new Set() }
  })
  const [confettiTrigger, setConfettiTrigger] = useState(0)
  const [showFireworks, setShowFireworks] = useState(false)
  const [prevBingoCount, setPrevBingoCount] = useState(0)
  const [stampAnim, setStampAnim] = useState<number|null>(null)
  const [logoTapCount, setLogoTapCount] = useState(0)
  const logoTapTimer = useRef<any>(null)

  const completedLines = getCompletedLines(checked)
  const bingoCount = completedLines.length
  const isAllDone = checked.size === 25

  // 빙고 달성 감지
  useEffect(() => {
    if (bingoCount > prevBingoCount) {
      if (bingoCount >= 5) {
        // 5빙고 이상 — 폭죽 + 꽃가루
        setShowFireworks(true)
        setConfettiTrigger(v => v+1)
        setTimeout(() => setShowFireworks(false), 4500)
      } else {
        // 1~4빙고 — 꽃가루만
        setConfettiTrigger(v => v+1)
      }
    }
    setPrevBingoCount(bingoCount)
  }, [bingoCount])

  // 로컬스토리지 저장
  useEffect(() => {
    localStorage.setItem('bingo-melbourne', JSON.stringify([...checked]))
  }, [checked])

  const handleCell = (idx: number) => {
    const next = new Set(checked)
    if (next.has(idx)) {
      next.delete(idx)
    } else {
      next.add(idx)
      setStampAnim(idx)
      setTimeout(() => setStampAnim(null), 600)
      setConfettiTrigger(v => v+1)
    }
    setChecked(next)
  }

  const handleLogoTap = () => {
    const next = logoTapCount + 1
    setLogoTapCount(next)
    if (logoTapTimer.current) clearTimeout(logoTapTimer.current)
    if (next >= 5) { onBack(); setLogoTapCount(0); return }
    logoTapTimer.current = setTimeout(() => setLogoTapCount(0), 400)
  }

  // 빙고 라인에 포함된 셀 인덱스
  const highlightedCells = new Set(completedLines.flat())

  const cafe = MELBOURNE_CAFES

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F0F4F8',
      fontFamily: '"Pretendard",-apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif',
      display: 'flex', flexDirection: 'column',
    }}>
      <style>{`
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
        @keyframes confettiFall {
          0%   { transform: translateY(0) rotate(0deg); opacity:1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity:0; }
        }
        @keyframes fwBurst {
          0%   { transform: translate(-50%,-50%) scale(0) rotate(var(--r)); opacity:1; }
          80%  { opacity:0.8; }
          100% { transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(1) rotate(var(--r)); opacity:0; }
        }
        @keyframes stampIn {
          0%   { transform: scale(2) rotate(-15deg); opacity:0; }
          50%  { transform: scale(0.9) rotate(3deg); opacity:1; }
          100% { transform: scale(1) rotate(0deg); opacity:1; }
        }
        @keyframes bingoFlash {
          0%,100% { opacity:1; }
          50%     { opacity:0.6; }
        }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes fwBurst {
          0%   { transform: translate(-50%,-50%) scale(0) rotate(var(--r)); opacity:1; }
          80%  { opacity:0.8; }
          100% { transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(1) rotate(var(--r)); opacity:0; }
        }
      `}</style>

      {/* ── 헤더 */}
      <div style={{ background:'#fff', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px 0' }}>
          <span onClick={handleLogoTap}
            style={{ fontSize:13, color:'#1B6EF3', fontWeight:800, letterSpacing:2, cursor:'pointer', userSelect:'none' }}>
            HOJUGAJA
          </span>
          <span style={{ fontSize:13, color:'#64748B', fontWeight:600 }}>{checked.size}/25</span>
        </div>
        <div style={{ display:'flex', padding:'8px 20px 0', gap:4 }}>
          <div style={{
            flex:1, height:38, borderRadius:'6px 6px 0 0',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:14, fontWeight:700, color:'#fff',
            background:'#1B6EF3', borderBottom:'2px solid #1B6EF3', userSelect:'none',
          }}>☕ 멜번 카페 도장깨기</div>
          <div style={{
            flex:1, height:38, borderRadius:'6px 6px 0 0',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:14, fontWeight:500, color:'#94A3B8',
            background:'transparent', borderBottom:'2px solid transparent', userSelect:'none',
          }}>시드니 (준비중)</div>
        </div>
      </div>

      {/* ── 빙고 카운터 */}
      <div style={{ background:'#F0F4F8', padding:'12px 16px 8px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ display:'flex', gap:6, flex:1, flexWrap:'wrap' }}>
            {Array.from({ length: Math.max(bingoCount, 1) }).map((_, i) => (
              <span key={i} style={{
                fontSize:12, fontWeight:800,
                color: i < bingoCount ? '#fff' : '#CBD5E1',
                background: i < bingoCount ? '#1B6EF3' : '#E2E8F0',
                borderRadius:6, padding:'3px 10px',
                animation: i < bingoCount ? 'bingoFlash 1s ease infinite' : 'none',
              }}>BINGO {i+1}</span>
            ))}
            {bingoCount === 0 && (
              <span style={{ fontSize:12, color:'#94A3B8', fontWeight:500 }}>카페를 방문하면 눌러보세요!</span>
            )}
          </div>
          {isAllDone && (
            <span style={{ fontSize:11, fontWeight:800, color:'#FFB800',
              background:'rgba(255,184,0,0.12)', borderRadius:6, padding:'3px 10px' }}>
              🏆 완정정복!
            </span>
          )}
        </div>
      </div>

      {/* ── 5x5 빙고판 */}
      <div style={{ flex:1, padding:'8px 12px 120px', overflowY:'auto' }}>
        <div style={{
          display:'grid', gridTemplateColumns:'repeat(5, 1fr)',
          gap:6,
        }}>
          {cafe.map((c, idx) => {
            const isChecked = checked.has(idx)
            const isHighlight = highlightedCells.has(idx)
            const isStamping = stampAnim === idx
            return (
              <div
                key={c.id}
                onClick={() => handleCell(idx)}
                style={{
                  position:'relative',
                  borderRadius:10,
                  overflow:'hidden',
                  cursor:'pointer',
                  border: isHighlight ? '2px solid #1B6EF3' : '2px solid #E2E8F0',
                  background: '#fff',
                  boxShadow: isHighlight
                    ? '0 2px 10px rgba(27,110,243,0.20)'
                    : '0 1px 4px rgba(0,0,0,0.06)',
                  transition:'all 0.2s',
                  aspectRatio:'1',
                  display:'flex',
                  flexDirection:'column',
                  alignItems:'center',
                  justifyContent:'center',
                }}
              >
                {/* 이미지 or 플레이스홀더 */}
                <div style={{
                  width:'100%', flex:1,
                  background: isChecked
                    ? 'linear-gradient(135deg, #1B6EF3 0%, #0ea5e9 100%)'
                    : 'linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  transition:'background 0.3s',
                }}>
                  {c.img ? (
                    <img src={c.img} alt={c.name}
                      style={{ width:'100%', height:'100%', objectFit:'cover',
                        filter: isChecked ? 'brightness(0.7)' : 'none', transition:'filter 0.3s' }}
                    />
                  ) : (
                    <Icon
                      icon="ph:coffee"
                      width={22} height={22}
                      color={isChecked ? 'rgba(255,255,255,0.5)' : '#CBD5E1'}
                    />
                  )}
                </div>

                {/* 상호명 */}
                <div style={{
                  width:'100%', padding:'3px 4px',
                  fontSize:9, fontWeight:700, textAlign:'center',
                  color: isChecked ? '#1B6EF3' : '#64748B',
                  lineHeight:1.2,
                  background:'#fff',
                  whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
                }}>{c.name}</div>

                {/* 도장 오버레이 */}
                {isChecked && (
                  <div style={{
                    position:'absolute', inset:0,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    pointerEvents:'none',
                  }}>
                    <div style={{
                      width:36, height:36,
                      border:'3px solid rgba(27,110,243,0.7)',
                      borderRadius:'50%',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      background:'rgba(27,110,243,0.12)',
                      animation: isStamping ? 'stampIn 0.5s ease both' : 'none',
                    }}>
                      <Icon icon="ph:check-bold" width={18} height={18} color="rgba(27,110,243,0.9)" />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* 전체 완료 메시지 */}
        {isAllDone && (
          <div style={{
            marginTop:16, padding:'16px', borderRadius:12,
            background:'linear-gradient(135deg, #1B6EF3, #0ea5e9)',
            textAlign:'center', animation:'fadeIn 0.5s ease',
          }}>
            <div style={{ fontSize:24, marginBottom:4 }}>🏆</div>
            <div style={{ fontSize:15, fontWeight:800, color:'#fff' }}>멜번 카페 완전정복!</div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.8)', marginTop:4 }}>25개 카페를 모두 방문했어요!</div>
          </div>
        )}
      </div>

      {/* ── 푸터 */}
      <div style={{
        position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)',
        width:'100%', maxWidth:430,
        padding:'18px 14px 28px',
        background:'#fff',
        zIndex:20, boxSizing:'border-box',
        display:'flex', gap:8,
        borderTop:'1px solid #E2E8F0',
      }}>
        <button onClick={onBack} style={{
          flex:1, height:54, borderRadius:8, border:'none',
          background:'#1B6EF3', color:'#fff',
          fontSize:15, fontWeight:700, cursor:'pointer',
          boxShadow:'0 4px 12px rgba(27,110,243,0.25)',
          display:'flex', alignItems:'center', justifyContent:'center', gap:7,
        }}>
          <Icon icon="ph:check-circle" width={18} height={18} color="#fff" />
          저장하고 나가기
        </button>
        <button onClick={() => {
          if (confirm('도장을 모두 초기화할까요?')) {
            setChecked(new Set())
          }
        }} style={{
          width:54, height:54, borderRadius:12, flexShrink:0,
          border:'1px solid #E2E8F0', background:'#fff',
          cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow:'0 2px 8px rgba(0,0,0,0.06)',
        }}>
          <Icon icon="ph:arrow-counter-clockwise" width={20} height={20} color="#64748B" />
        </button>
      </div>

      {/* ── 효과 */}
      <Confetti trigger={confettiTrigger} />
      {showFireworks && <Fireworks />}
    </div>
  )
}
