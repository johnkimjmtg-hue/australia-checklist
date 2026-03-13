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

// ── 시드니 카페 25개 플레이스홀더 데이터
const SYDNEY_CAFES = [
  { id: 1,  name: 'Single O',              img: '' },
  { id: 2,  name: 'Artificer Coffee',      img: '' },
  { id: 3,  name: 'Room Ten',              img: '' },
  { id: 4,  name: 'bills Darlinghurst',    img: '' },
  { id: 5,  name: 'The Grounds',           img: '' },
  { id: 6,  name: "Toby's Estate",        img: '' },
  { id: 7,  name: 'Paramount Coffee',      img: '' },
  { id: 8,  name: 'Reuben Hills',          img: '' },
  { id: 9,  name: 'Edition Roasters',      img: '' },
  { id: 10, name: 'AP Bakery',             img: '' },
  { id: 11, name: 'Skittle Lane',          img: '' },
  { id: 12, name: "Pablo & Rusty's",      img: '' },
  { id: 13, name: 'Mecca Coffee',          img: '' },
  { id: 14, name: 'Gumption',              img: '' },
  { id: 15, name: 'Reformatory',           img: '' },
  { id: 16, name: 'Campos Coffee',         img: '' },
  { id: 17, name: 'Circa Espresso',        img: '' },
  { id: 18, name: 'Sample Coffee',         img: '' },
  { id: 19, name: 'Hive Espresso',         img: '' },
  { id: 20, name: 'Three Williams',        img: '' },
  { id: 21, name: 'Bourke Street Bakery',  img: '' },
  { id: 22, name: 'Devon Cafe',            img: '' },
  { id: 23, name: 'The Cornerstone',       img: '' },
  { id: 24, name: 'Cuckoo Callay',         img: '' },
  { id: 25, name: 'Penny Lane',            img: '' },
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

// ── 25칸 미니 빙고판 진행바
function MiniGrid({ count }: { count: number }) {
  return (
    <div style={{ position:'relative', width:100, height:100, flexShrink:0 }}>
      {/* 5x5 미니칸 */}
      <div style={{
        display:'grid', gridTemplateColumns:'repeat(5,1fr)',
        gap:2, width:100, height:100,
        borderRadius:8, overflow:'hidden',
      }}>
        {Array.from({ length: 25 }, (_, i) => (
          <div key={i} style={{
            borderRadius:2,
            background: i < count ? '#FFCD00' : '#F1F5F9',
            transition: `background 0.3s ease ${i * 0.04}s`,
            boxShadow: i < count ? 'inset 0 1px 2px rgba(180,130,0,0.3)' : 'none',
          }}/>
        ))}
      </div>
      {/* 가운데 커피 아이콘 */}
      <div style={{
        position:'absolute', inset:0,
        display:'flex', alignItems:'center', justifyContent:'center',
        pointerEvents:'none',
      }}>
        <div style={{
          width:36, height:36, borderRadius:'50%',
          background: count > 0 ? 'rgba(255,205,0,0.92)' : 'rgba(241,245,249,0.92)',
          display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow: count > 0 ? '0 2px 8px rgba(180,130,0,0.35)' : '0 1px 4px rgba(0,0,0,0.08)',
          transition:'background 0.4s ease, box-shadow 0.4s ease',
        }}>
          <Icon icon="ph:coffee" width={18} height={18}
            color={count > 0 ? '#92620a' : '#CBD5E1'} />
        </div>
      </div>
    </div>
  )
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
function Fireworks() {
  const colors = ['#FFCD00','#1B6EF3','#FF4B4B','#4ECDC4','#FF9F43','#A29BFE','#55EFC4','#FD79A8','#fff']
  const cx = 50; const cy = 50
  const mk = (count: number, distMin: number, distMax: number, delayBase: number, sizeMin: number, sizeMax: number) =>
    Array.from({ length: count }, (_, i) => {
      const angle  = (i / count) * 360
      const dist   = distMin + Math.random() * (distMax - distMin)
      const rad    = (angle * Math.PI) / 180
      return {
        tx: Math.cos(rad) * dist, ty: Math.sin(rad) * dist,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: delayBase + Math.random() * 0.3,
        dur: 0.9 + Math.random() * 0.7,
        size: sizeMin + Math.random() * (sizeMax - sizeMin),
        isRect: i % 3 !== 0, angle,
      }
    })
  const wave1 = mk(90, 120, 220, 0,    5, 10)
  const wave2 = mk(60, 80,  180, 0.4,  4, 8)
  const wave3 = mk(40, 60,  140, 0.8,  3, 7)
  const all = [...wave1, ...wave2, ...wave3]
  return (
    <div style={{ position:'fixed', inset:0, zIndex:9999, pointerEvents:'none', overflow:'hidden' }}>
      {/* 큰 플래시 */}
      <div style={{
        position:'absolute', left:'50%', top:'50%',
        transform:'translate(-50%,-50%)',
        width:120, height:120, borderRadius:'50%',
        background:'radial-gradient(circle, rgba(255,205,0,0.9) 0%, transparent 70%)',
        animation:'flashOut 0.6s ease-out both',
      }}/>
      {all.map((p, i) => (
        <div key={i} style={{
          position:'absolute', left:`${cx}%`, top:`${cy}%`,
          width: p.isRect ? p.size*0.5 : p.size,
          height: p.isRect ? p.size*2.5 : p.size,
          borderRadius: p.isRect ? 2 : '50%',
          background: p.color,
          // @ts-ignore
          '--tx': `${p.tx}px`, '--ty': `${p.ty}px`, '--r': `${p.angle}deg`,
          animation: `fwBurst ${p.dur}s ease-out ${p.delay}s both`,
          boxShadow: `0 0 ${p.size*2}px ${p.color}`,
        }}/>
      ))}
    </div>
  )
}


// ── 상황 메시지
function getStatusMsg(checked: number, bingo: number): { title: string; sub: string } {
  if (checked === 0)  return { title: '카페 도장깨기 시작!', sub: '카페를 방문하면 해당 칸을 눌러보세요 ☕' }
  if (checked === 25) return { title: '🏆 완전정복! 대단해요!', sub: '카페 25곳을 모두 정복했어요!' }
  if (bingo >= 5)     return { title: `🎉 ${bingo}빙고 달성!`, sub: `${checked}개 카페를 방문했어요. 거의 다 왔어요!` }
  if (bingo >= 3)     return { title: `✨ ${bingo}빙고 달성!`, sub: `${checked}개 카페 완료! 계속 도전해봐요` }
  if (bingo >= 1)     return { title: `🎯 ${bingo}빙고 달성!`, sub: `와우! ${checked}개 카페를 깨셨어요` }
  if (checked >= 15)  return { title: `${checked}개 카페 방문 완료!`, sub: '빙고까지 얼마 안 남았어요 💪' }
  if (checked >= 10)  return { title: `${checked}개 카페 방문!`, sub: '반 이상 왔어요! 계속 달려봐요 🔥' }
  if (checked >= 5)   return { title: `${checked}개 카페 방문!`, sub: '좋은 출발이에요. 더 많이 도전해봐요!' }
  return { title: `${checked}개 카페 방문!`, sub: '멜번 카페 투어가 시작됐어요 ☕' }
}

type Props = { onBack?: () => void; embedded?: boolean; initialCity?: 'melbourne' | 'sydney'; onCityChange?: (city: 'melbourne'|'sydney') => void }
export { Props as BingoProps }

export default function BingoPage({ onBack, embedded = false, initialCity, onCityChange }: Props) {
  const [city, setCity] = useState<'melbourne'|'sydney'>(initialCity ?? 'melbourne')
  const [checkedMelbourne, setCheckedMelbourne] = useState<Set<number>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('bingo-melbourne') ?? '[]')) }
    catch { return new Set() }
  })
  const [checkedSydney, setCheckedSydney] = useState<Set<number>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('bingo-sydney') ?? '[]')) }
    catch { return new Set() }
  })
  const checked = city === 'melbourne' ? checkedMelbourne : checkedSydney
  const setChecked = (val: Set<number> | ((prev: Set<number>) => Set<number>)) => {
    if (city === 'melbourne') setCheckedMelbourne(val as any)
    else setCheckedSydney(val as any)
  }
  const [confettiTrigger, setConfettiTrigger] = useState(0)
  const [showFireworks, setShowFireworks] = useState(false)
  const [prevBingoCount, setPrevBingoCount] = useState(0)
  const [stampAnim, setStampAnim] = useState<number|null>(null)
  const [showReset, setShowReset] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)

  const completedLines = getCompletedLines(checked)
  const bingoCount = completedLines.length
  const isAllDone = checked.size === 25

  // 빙고 달성 감지 — 줄 하나 완성할 때마다 폭죽
  useEffect(() => {
    if (bingoCount > prevBingoCount) {
      setShowFireworks(true)
      setConfettiTrigger(v => v+1)
      setTimeout(() => setShowFireworks(false), 3500)
    }
    setPrevBingoCount(bingoCount)
  }, [bingoCount])

  // 로컬스토리지 저장
  useEffect(() => {
    localStorage.setItem('bingo-melbourne', JSON.stringify([...checkedMelbourne]))
  }, [checkedMelbourne])
  useEffect(() => {
    localStorage.setItem('bingo-sydney', JSON.stringify([...checkedSydney]))
  }, [checkedSydney])

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

  const handleShare = async () => {
    setShowMoreMenu(false)
    const isMelbourne = city === 'melbourne'
    const cityName    = isMelbourne ? '멜번' : '시드니'
    const link        = isMelbourne ? 'hojugaja.com/bingo/melbourne' : 'hojugaja.com/bingo/sydney'
    const title       = `${cityName} 카페 도장깨기 빙고게임`
    const lines: string[] = [
      `☕ ${cityName} 카페 도장깨기 빙고게임, 지금 바로 시작하세요!`,
      `${cityName}의 스페셜티 카페 25곳을 방문하고, 빙고를 완성하세요.`,
    ]
    if (checked.size > 0) lines.push(`나는 현재 ${checked.size}/25개 카페를 방문했어요!${bingoCount > 0 ? ` 🟢 ${bingoCount}빙고 달성!` : ''}`)
    lines.push('', `👉 ${link}`)
    const text = lines.join('\n')
    if (navigator.share) {
      try { await navigator.share({ title, text }) } catch {}
    } else {
      await navigator.clipboard.writeText(text)
      alert('클립보드에 복사됐어요!')
    }
  }

  const handleLogoTap = () => {
    onBack()
  }

  // 빙고 라인에 포함된 셀 인덱스
  const highlightedCells = new Set(completedLines.flat())

  const cafe = city === 'melbourne' ? MELBOURNE_CAFES : SYDNEY_CAFES

  return (
    <div style={{
      minHeight: embedded ? 'auto' : '100vh',
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
        @keyframes slideUp { from{transform:translateY(100%)} to{transform:translateY(0)} }
        @keyframes scaleIn { from{opacity:0;transform:translate(-50%,-50%) scale(0.92)} to{opacity:1;transform:translate(-50%,-50%) scale(1)} }
        @keyframes flashOut { 0%{transform:translate(-50%,-50%) scale(0);opacity:1} 100%{transform:translate(-50%,-50%) scale(3);opacity:0} }
        @keyframes fwBurst {
          0%   { transform: translate(-50%,-50%) scale(0) rotate(var(--r)); opacity:1; }
          80%  { opacity:0.8; }
          100% { transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(1) rotate(var(--r)); opacity:0; }
        }
      `}</style>

      {/* ── 헤더 */}
      {!embedded && <div style={{ background:'#fff', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px 0' }}>
          <span onClick={handleLogoTap}
            style={{ fontSize:13, color:'#1B6EF3', fontWeight:800, letterSpacing:2, cursor:'pointer', userSelect:'none' }}>
            HOJUGAJA
          </span>
          <span style={{ fontSize:13, color:'#64748B', fontWeight:600 }}>
            {city === 'melbourne' ? '멜번' : '시드니'}
          </span>
        </div>
        <div style={{ display:'flex', padding:'8px 8px 0', gap:2, overflowX:'auto', scrollbarWidth:'none' }}>
          {([
            { id:'bucketlist', icon:'ph:check-circle', label:'버킷리스트', action: onBack },
            { id:'services',   icon:'ph:buildings',    label:'업체/서비스', action: () => {} },
            { id:'shopping',   icon:'ph:shopping-bag', label:'필수쇼핑',   action: () => {} },
            { id:'bingo',      icon:'ph:coffee',       label:'도장깨기',   action: () => {} },
            { id:'community',  icon:'ph:chats-circle', label:'커뮤니티',   action: () => {} },
          ]).map(tab => {
            const active = tab.id === 'bingo'
            return (
              <button key={tab.id} onClick={tab.action} style={{
                flex:1, minWidth:0, height:48, border:'none', cursor:'pointer',
                borderRadius:'6px 6px 0 0',
                display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:2,
                background: active ? '#1B6EF3' : 'transparent',
                borderBottom: active ? '2px solid #1B6EF3' : '2px solid transparent',
              }}>
                <Icon icon={tab.icon} width={16} height={16} color={active ? '#fff' : '#475569'} />
                <span style={{ fontSize:10, fontWeight: active ? 700 : 500, color: active ? '#fff' : '#475569', whiteSpace:'nowrap' }}>
                  {tab.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>}

      {/* ── 상황판 */}
      <div style={{ position:'sticky', top:0, zIndex:30, background:'#F0F4F8', padding:'12px 16px 0' }}>
        {/* 도시 선택 */}
        <div style={{ display:'flex', gap:8, marginBottom:10 }}>
          {([
            { id:'melbourne', label:'🇦🇺 멜번' },
            { id:'sydney',    label:'🌉 시드니' },
          ] as { id: 'melbourne'|'sydney'; label: string }[]).map(c => (
            <button key={c.id} onClick={() => setCity(c.id)} style={{
              flex:1, height:36, borderRadius:8, border:'none', cursor:'pointer',
              fontWeight: city===c.id ? 700 : 500,
              fontSize:13,
              color: city===c.id ? '#fff' : '#64748B',
              background: city===c.id ? '#1B6EF3' : '#fff',
              boxShadow: city===c.id ? '0 2px 8px rgba(27,110,243,0.25)' : '0 1px 4px rgba(0,0,0,0.06)',
              transition:'all 0.2s',
            }}>
              {c.label}
            </button>
          ))}
        </div>
        <div style={{
          background:'#fff', borderRadius:12,
          boxShadow:'0 4px 20px rgba(27,110,243,0.10), 0 1px 4px rgba(0,0,0,0.06)',
          padding:'16px 18px', display:'flex', alignItems:'center', gap:16,
        }}>
          <MiniGrid count={checked.size} />
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:16, fontWeight:800, color:'#1E293B', marginBottom:3, lineHeight:1.3 }}>
              {getStatusMsg(checked.size, bingoCount).title}
            </div>
            <div style={{ fontSize:12, color:'#94A3B8', fontWeight:500, marginBottom:8, lineHeight:1.5 }}>
              {getStatusMsg(checked.size, bingoCount).sub}
            </div>
            {/* 빙고 뱃지 */}
            <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
              {bingoCount > 0
                ? Array.from({ length: bingoCount }).map((_, i) => (
                    <span key={i} style={{
                      fontSize:10, fontWeight:800, color:'#fff',
                      background:'#16A34A', borderRadius:5, padding:'2px 8px',
                      animation:'bingoFlash 1.5s ease infinite',
                    }}>BINGO {i+1}</span>
                  ))
                : <span style={{ fontSize:11, color:'#CBD5E1', fontWeight:500 }}>빙고 도전 중...</span>
              }
            </div>
          </div>
          {/* 카운터 */}
          <div style={{ textAlign:'center', flexShrink:0 }}>
            <div style={{ fontSize:52, fontWeight:800, color:'#FFB800', lineHeight:1 }}>{checked.size}</div>
            <div style={{ fontSize:22, color:'#94A3B8', fontWeight:600, marginTop:2 }}>/25 카페</div>
          </div>
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
        <button onClick={() => setShowMoreMenu(true)} style={{
          width:54, height:54, borderRadius:12, flexShrink:0,
          border:'1px solid #E2E8F0', background:'#fff',
          cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow:'0 2px 8px rgba(0,0,0,0.06)',
        }}>
          <Icon icon="ph:dots-three-vertical" width={20} height={20} color="#64748B" />
        </button>
      </div>

      {/* ── 더보기 바텀시트 */}
      {showMoreMenu && (
        <div style={{
          position:'fixed', inset:0, zIndex:600,
          background:'rgba(0,0,0,0.45)', backdropFilter:'blur(2px)',
          display:'flex', alignItems:'flex-end', justifyContent:'center',
        }} onClick={() => setShowMoreMenu(false)}>
          <div style={{
            width:'100%', maxWidth:430,
            background:'#fff', borderRadius:'20px 20px 0 0',
            padding:'20px 16px 36px',
            boxShadow:'0 -4px 24px rgba(0,0,0,0.15)',
            animation:'slideUp 0.25s ease',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ width:40, height:4, borderRadius:2, background:'#E2E8F0', margin:'0 auto 20px' }}/>
            <div style={{ fontSize:13, fontWeight:800, color:'#94A3B8', marginBottom:14, letterSpacing:0.5 }}>더보기</div>
            <button onClick={handleShare} style={{
              width:'100%', height:52, borderRadius:12, border:'none',
              background:'#1B6EF3', color:'#fff',
              fontSize:15, fontWeight:700, cursor:'pointer',
              display:'flex', alignItems:'center', gap:10, padding:'0 18px', marginBottom:10,
            }}>
              <Icon icon="ph:share-network" width={18} height={18} color="#fff" />공유하기
            </button>
            <button onClick={() => { setShowMoreMenu(false); setShowReset(true) }} style={{
              width:'100%', height:52, borderRadius:12,
              border:'1.5px solid #FECDD3', background:'#FFF5F5', color:'#DC2626',
              fontSize:15, fontWeight:700, cursor:'pointer',
              display:'flex', alignItems:'center', gap:10, padding:'0 18px',
            }}>
              <Icon icon="ph:arrow-counter-clockwise" width={18} height={18} color="#DC2626" />리셋하기
            </button>
          </div>
        </div>
      )}

      {/* ── 리셋 모달 */}
      {showReset && (
        <>
          <div onClick={() => setShowReset(false)}
            style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.60)', zIndex:600, animation:'fadeIn 0.2s ease' }}/>
          <div style={{
            position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
            background:'#fff', borderRadius:16, padding:'24px 20px',
            zIndex:601, width:'calc(100% - 48px)', maxWidth:300, textAlign:'center',
            boxShadow:'0 10px 15px rgba(0,0,0,0.10)',
            animation:'scaleIn 0.22s ease',
          }}>
            <div style={{ fontSize:32, marginBottom:8 }}>☕</div>
            <p style={{ fontSize:16, fontWeight:700, color:'#0F172A', marginBottom:8, lineHeight:1.5 }}>도장깨기를 리셋하시겠습니까?</p>
            <p style={{ fontSize:13, color:'#64748B', marginBottom:20, lineHeight:1.6 }}>지금까지의 방문 기록이 모두 삭제됩니다.</p>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => setShowReset(false)} style={{
                flex:1, height:48, border:'1px solid #E2E8F0', borderRadius:6,
                background:'#fff', color:'#64748B', fontWeight:600, fontSize:14, cursor:'pointer',
              }}>아니요</button>
              <button onClick={() => { setChecked(new Set()); setShowReset(false) }} style={{
                flex:2, height:48, border:'none', borderRadius:6,
                background:'#DC2626', color:'#fff', fontWeight:700, fontSize:15, cursor:'pointer',
              }}>리셋하기</button>
            </div>
          </div>
        </>
      )}

      {/* ── 효과 */}
      <Confetti trigger={confettiTrigger} />
      {showFireworks && <Fireworks />}
    </div>
  )
}
