import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import { Icon } from '@iconify/react'
import { supabase } from '../lib/supabase'
import BusinessCard from '../components/BusinessCard'
import { colors, font, radius, spacing } from '../styles/tokens'

interface BingoCafe {
  id: string
  city: string
  sort_order: number
  name: string
  business_id: string | null
  is_active: boolean
}



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
function getStatusMsg(checked: number, bingo: number, city: 'melbourne'|'sydney'): { title: string; sub: string } {
  const isMel = city === 'melbourne'
  if (checked === 0)  return { title: '카페 도장깨기 시작!', sub: '카페를 방문하면 해당 칸을 눌러보세요 ☕' }
  if (checked === 25) return { title: '🏆 판테온 완전정복!', sub: isMel ? '당신은 멜번을 지배하는 궁극의 카페의 신입니다!' : '당신은 시드니를 지배하는 궁극의 카페의 신입니다!' }
  if (bingo >= 5)     return { title: `🎉 ${bingo}빙고 달성!`, sub: `${checked}개 카페를 방문했어요. 거의 다 왔어요!` }
  if (bingo >= 3)     return { title: `✨ ${bingo}빙고 달성!`, sub: `${checked}개 카페 완료! 계속 도전해봐요` }
  if (bingo >= 1)     return { title: `🎯 ${bingo}빙고 달성!`, sub: `와우! ${checked}개 카페를 깨셨어요` }
  if (checked >= 15)  return { title: `${checked}개 카페 방문 완료!`, sub: '빙고까지 얼마 안 남았어요 💪' }
  if (checked >= 10)  return { title: `${checked}개 카페 방문!`, sub: '반 이상 왔어요! 계속 달려봐요 🔥' }
  if (checked >= 5)   return { title: `${checked}개 카페 방문!`, sub: '좋은 출발이에요. 더 많이 도전해봐요!' }
  return { title: `${checked}개 카페 방문!`, sub: isMel ? '멜번 카페 투어가 시작됐어요 ☕' : '시드니 카페 투어가 시작됐어요 ☕' }
}

type Props = { onBack?: () => void; embedded?: boolean; initialCity?: 'melbourne' | 'sydney'; onCityChange?: (city: 'melbourne'|'sydney') => void }
export type BingoRef = { triggerSave: () => void; triggerShare: () => void; triggerReset: () => void }
export { Props as BingoProps }

const BingoPage = forwardRef<BingoRef, Props>(function BingoPage({ onBack, embedded = false, initialCity, onCityChange }, ref) {
  const pageRef = useRef<HTMLDivElement>(null)
  const [footerWidth, setFooterWidth] = useState<number | undefined>(undefined)
  const [city, setCity] = useState<'melbourne'|'sydney'>(initialCity ?? 'sydney')
  const [melbourneCafes, setMelbourneCafes] = useState<BingoCafe[]>([])
  const [sydneyCafes, setSydneyCafes] = useState<BingoCafe[]>([])
  const [cafesLoading, setCafesLoading] = useState(true)
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
  const [showSaveConfirm, setShowSaveConfirm] = useState(false)
  const [showAllDone, setShowAllDone] = useState(false)
  const [showSydAllDone, setShowSydAllDone] = useState(false)
  const [selectedCafe, setSelectedCafe] = useState<{ cafe: BingoCafe; idx: number } | null>(null)

  const completedLines = getCompletedLines(checked)
  const bingoCount = completedLines.length
  const isAllDone = checked.size === 25

  useEffect(() => {
    const updateWidth = () => {
      if (pageRef.current) setFooterWidth(pageRef.current.getBoundingClientRect().width)
    }
    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  // 전체 완료 감지
  useEffect(() => {
    if (isAllDone) {
      if (city === 'melbourne') setShowAllDone(true)
      else setShowSydAllDone(true)
    }
  }, [isAllDone])

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
    if (city === 'melbourne') {
      setCheckedMelbourne(prev => {
        const next = new Set(prev)
        if (next.has(idx)) { next.delete(idx) }
        else {
          next.add(idx)
          setStampAnim(idx)
          setTimeout(() => setStampAnim(null), 600)
          setConfettiTrigger(v => v+1)
        }
        return next
      })
    } else {
      setCheckedSydney(prev => {
        const next = new Set(prev)
        if (next.has(idx)) { next.delete(idx) }
        else {
          next.add(idx)
          setStampAnim(idx)
          setTimeout(() => setStampAnim(null), 600)
          setConfettiTrigger(v => v+1)
        }
        return next
      })
    }
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

  useImperativeHandle(ref, () => ({
    triggerSave: () => setShowSaveConfirm(true),
    triggerShare: () => handleShare(),
    triggerReset: () => setShowReset(true),
  }))

  // 빙고 라인에 포함된 셀 인덱스
  const highlightedCells = new Set(completedLines.flat())

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('bingo_cafes')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')
      if (data) {
        setMelbourneCafes(data.filter(c => c.city === 'melbourne'))
        setSydneyCafes(data.filter(c => c.city === 'sydney'))
      }
      setCafesLoading(false)
    }
    load()
  }, [])

  const cafe = (city === 'melbourne' ? melbourneCafes : sydneyCafes)

  return (
    <div ref={pageRef} style={{
      height: embedded ? 'auto' : '100vh',
      background: colors.bgPage,
      fontFamily: font.family,
      display: 'flex', flexDirection: 'column',
      overflow: embedded ? 'visible' : 'hidden',
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
        .neu-tab {
          background: #e8e8e8; border: none; cursor: pointer;
          display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px;
          transition: all 0.15s ease; -webkit-tap-highlight-color: transparent; touch-action: manipulation;
          box-shadow: 3px 3px 6px #c5c5c5, -3px -3px 6px #ffffff; border-radius: 10px;
        }
        .neu-tab.active { box-shadow: inset 3px 3px 6px #c5c5c5, inset -3px -3px 6px #ffffff; }
        .neu-tab:active { box-shadow: inset 3px 3px 6px #c5c5c5, inset -3px -3px 6px #ffffff; }
      `}</style>

      {/* ── 헤더 */}
      {!embedded && <div style={{ background: colors.bgPage, paddingBottom:8, flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px 12px' }}>
          <span onClick={() => onBack?.()}
            style={{ fontSize:13, color:'#1B6EF3', fontWeight:800, letterSpacing:2, cursor:'pointer', userSelect:'none' }}>
            HOJUGAJA
          </span>
          <span style={{ fontSize:13, color:'#64748B', fontWeight:600 }}>
            {city === 'melbourne' ? '멜번' : '시드니'}
          </span>
        </div>
        <div style={{ display:'flex', padding:'0 10px', gap:8, overflowX:'auto', scrollbarWidth:'none' }}>
          {([
            { id:'bucketlist', icon:'ph:check-circle', label:'버킷리스트',  action: onBack },
            { id:'shopping',   icon:'ph:shopping-bag', label:'쇼핑리스트',  action: () => {} },
            { id:'bingo',      icon:'ph:coffee',       label:'카페빙고게임', action: () => {} },
            { id:'community',  icon:'ph:chats-circle', label:'채팅방',      action: () => {} },
            { id:'services',   icon:'ph:buildings',    label:'업체리스트',  action: () => {} },
          ]).map(tab => {
            const active = tab.id === 'bingo'
            return (
              <button key={tab.id} onClick={tab.action}
                className={`neu-tab${active ? ' active' : ''}`}
                style={{ flex:1, minWidth:0, height:52 }}>
                <Icon icon={tab.icon} width={16} height={16} color={active ? '#1B6EF3' : '#94A3B8'} />
                <span style={{ fontSize:9, fontWeight: active ? 700 : 500, color: active ? '#1B6EF3' : '#94A3B8', whiteSpace:'nowrap' }}>
                  {tab.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>}

      {/* ── 도시 탭 (헤더 역할) */}
      <div style={{
        position:'sticky', top:0, zIndex:30,
        background: colors.bgCard, borderBottom:`1.5px solid ${colors.border}`,
      }}>
        <div style={{ display:'flex' }}>
          {([
            { id:'sydney',    label:'시드니' },
            { id:'melbourne', label:'멜번' },
          ] as { id: 'melbourne'|'sydney'; label: string }[]).map(c => (
            <button key={c.id} onClick={() => { setCity(c.id); onCityChange?.(c.id) }} style={{
              flex:1, height:44, border:'none', cursor:'pointer',
              fontWeight: city===c.id ? font.weight.bold : font.weight.regular,
              fontSize: font.size.md,
              color: city===c.id ? colors.primary : colors.textTertiary,
              background: 'none',
              borderBottom: city===c.id ? `2px solid ${colors.primary}` : '2px solid transparent',
              transition:'all 0.15s',
              WebkitTapHighlightColor: 'transparent',
              fontFamily: font.family,
            }}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── 상황판 */}
      <div style={{ background: colors.bgPage, padding:`${spacing[3]}px ${spacing[3]}px 0` }}>
        <div style={{
          background: colors.bgCard,
          borderRadius: radius.lg,
          border: `1.5px solid ${colors.gray300}`,
          padding: `${spacing[4]}px`, display:'flex', alignItems:'center', gap: spacing[4],
        }}>
          <MiniGrid count={checked.size} />
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.textPrimary, marginBottom: spacing[1], lineHeight:1.3 }}>
              {getStatusMsg(checked.size, bingoCount, city).title}
            </div>
            <div style={{ fontSize: font.size.sm, color: colors.textTertiary, fontWeight: font.weight.regular, lineHeight:1.5 }}>
              {getStatusMsg(checked.size, bingoCount, city).sub}
            </div>
          </div>
          {/* 카운터 */}
          <div style={{ textAlign:'center', flexShrink:0 }}>
            <div style={{ fontSize: font.size['3xl'], fontWeight: font.weight.bold, color: colors.textPrimary, lineHeight:1 }}>{checked.size}</div>
            <div style={{ fontSize: font.size.lg, color: colors.textSecondary, fontWeight: font.weight.medium, marginTop:2 }}>/25 카페</div>
          </div>
        </div>
      </div>

      {/* ── 5x5 빙고판 */}
      <div style={{ flex:1, padding:`8px 12px ${embedded ? '60px' : '62px'}`, overflowY:'auto', minHeight:0 }}>
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
                onClick={() => setSelectedCafe({ cafe: c, idx })}
                style={{
                  position:'relative',
                  borderRadius:10,
                  overflow:'hidden',
                  cursor:'pointer',
                  border: isHighlight ? '2px solid #EF4444' : '1px solid #C8C8C8',
                  background: '#fff',
                  boxShadow: isHighlight
                    ? '0 2px 10px rgba(239,68,68,0.20)'
                    : '0 1px 4px rgba(0,0,0,0.06)',
                  transition:'all 0.2s',
                  aspectRatio:'1',
                  display:'flex',
                  flexDirection:'column',
                  alignItems:'center',
                  justifyContent:'center',
                }}
              >
                {/* 이미지 */}
                <div style={{
                  width:'100%', flex:1,
                  background: colors.gray100,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  overflow:'hidden', position:'relative',
                }}>
                  <img
                    src={city === 'melbourne' ? `/mel_coffee/mel_image/${c.sort_order}.jpg` : `/syd_coffee/syd_image/${c.sort_order}.jpg`}
                    alt={c.name}
                    style={{ width:'100%', height:'100%', objectFit:'cover' }}
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                  {/* 체크 오버레이 */}
                  {isChecked && (
                    <div style={{
                      position:'absolute', inset:0,
                      background:'rgba(27,110,243,0.55)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      animation: isStamping ? 'stampIn 0.5s ease both' : 'none',
                    }}>
                      <Icon icon="ph:check-bold" width={28} height={28} color="#fff" />
                    </div>
                  )}
                </div>

                {/* 상호명 */}
                <div style={{
                  width:'100%', padding:'3px 4px',
                  fontSize:9, fontWeight:700, textAlign:'center',
                  color: isChecked ? colors.primary : colors.textSecondary,
                  lineHeight:1.2, background: colors.bgCard,
                  whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
                }}>{c.name}</div>
              </div>
            )
          })}
        </div>


      </div>

      {/* ── 카페 정보 팝업 */}
      {selectedCafe && (() => {
        const { cafe: c, idx } = selectedCafe
        const isChecked = checked.has(idx)

        const handleToggle = () => {
          handleCell(idx)
          if (!isChecked) setTimeout(() => setSelectedCafe(null), 400)
        }

        return (
          <div style={{ position:'fixed', inset:0, zIndex:800 }}>
            <div onClick={() => setSelectedCafe(null)} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.5)' }} />
            <div style={{
              position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)',
              width:'100%', maxWidth:390,
              maxHeight:'85vh', overflowY:'auto',
              borderRadius:`${radius.xl}px ${radius.xl}px 0 0`,
              background: colors.bgPage,
              padding:`${spacing[3]}px ${spacing[3]}px ${spacing[8]}px`,
              boxSizing:'border-box',
            }}>
              {/* 핸들 + 닫기 */}
              <div style={{ width:36, height:4, borderRadius:radius.full, background:colors.gray200, margin:`0 auto ${spacing[3]}px` }} />

              {/* 카페 카드 */}
              <div style={{ marginBottom: spacing[3] }}>
                {c.business_id
                  ? <CafeBusinessInfo businessId={c.business_id} />
                  : (
                    <div style={{
                      background: colors.bgCard, borderRadius: radius.md,
                      border:`1px solid ${colors.border}`, padding:`${spacing[4]}px`,
                      textAlign:'center',
                    }}>
                      <div style={{ fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.textPrimary, marginBottom: spacing[1] }}>{c.name}</div>
                      <div style={{ fontSize: font.size.sm, color: colors.textTertiary }}>업체 정보가 아직 연결되지 않았어요</div>
                    </div>
                  )
                }
              </div>

              {/* 방문 완료 버튼 */}
              <button onClick={handleToggle} style={{
                width:'100%', height:50, borderRadius: radius.md, border:'none', cursor:'pointer',
                background: isChecked ? colors.dangerLight : colors.primary,
                color: isChecked ? colors.danger : '#fff',
                fontSize: font.size.md, fontWeight: font.weight.bold,
                display:'flex', alignItems:'center', justifyContent:'center', gap: spacing[2],
                fontFamily: font.family,
                transition:'all 0.15s',
              }}>
                <Icon icon={isChecked ? 'ph:x-circle' : 'ph:check-circle'} width={20} height={20} color={isChecked ? colors.danger : '#fff'} />
                {isChecked ? '방문 취소하기' : '방문 완료!'}
              </button>
            </div>
          </div>
        )
      })()}

      {/* ── 푸터 */}
      {!embedded && <div style={{
        position:'fixed', bottom: 0,
        left:'50%', transform:'translateX(-50%)',
        width:'min(100%, 430px)',
        padding:`${spacing[2]}px ${spacing[3]}px`,
        background: colors.bgCard,
        zIndex:39, boxSizing:'border-box',
        display:'flex', gap: spacing[2],
        borderTop:`1.5px solid ${colors.border}`,
      }}>
        <button onClick={() => setShowSaveConfirm(true)} style={{
          flex:2, height:44, borderRadius: radius.sm, border:'none',
          background: colors.primary, color: '#fff',
          fontSize: font.size.md, fontWeight: font.weight.bold, cursor:'pointer',
          display:'flex', alignItems:'center', justifyContent:'center', gap:6,
          WebkitTapHighlightColor:'transparent', fontFamily: font.family,
        }}>
          <Icon icon="ph:floppy-disk" width={16} height={16} color="#fff" />
          저장하기
        </button>
        <button onClick={handleShare} style={{
          flex:1, height:44, borderRadius: radius.sm,
          border:`1px solid ${colors.border}`, background: colors.bgCard,
          color: colors.primary, fontSize: font.size.md, fontWeight: font.weight.bold,
          cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:4,
          WebkitTapHighlightColor:'transparent', fontFamily: font.family,
        }}>
          <Icon icon="ph:share-network" width={15} height={15} color={colors.primary} />
          공유
        </button>
        <button onClick={() => setShowReset(true)} style={{
          flex:1, height:44, borderRadius: radius.sm,
          border:`1px solid ${colors.dangerLight}`, background: colors.dangerLight,
          color: colors.danger, fontSize: font.size.md, fontWeight: font.weight.bold,
          cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:4,
          WebkitTapHighlightColor:'transparent', fontFamily: font.family,
        }}>
          <Icon icon="ph:arrow-counter-clockwise" width={15} height={15} color={colors.danger} />
          리셋
        </button>
      </div>}

      {/* ── 저장 확인 팝업 */}
      {showSaveConfirm && (
        <>
          <div onClick={() => setShowSaveConfirm(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:700 }} />
          <div style={{
            position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
            background: colors.bgCard, borderRadius: radius.lg, padding:`${spacing[6]}px ${spacing[5]}px`,
            zIndex:701, width:'calc(100% - 48px)', maxWidth:300, textAlign:'center',
            boxShadow:'0 8px 32px rgba(0,0,0,0.15)', fontFamily: font.family,
          }}>
            <div style={{ fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.textPrimary, marginBottom: spacing[2] }}>저장하기</div>
            <div style={{ fontSize: font.size.sm, color: colors.textSecondary, marginBottom: spacing[5], lineHeight:1.6 }}>
              현재 빙고 진행 상황을 저장할까요?<br/>나중에 언제든지 다시 저장할 수 있어요.
            </div>
            <div style={{ display:'flex', gap: spacing[2] }}>
              <button onClick={() => setShowSaveConfirm(false)} style={{
                flex:1, height:48, borderRadius: radius.sm, border:`1px solid ${colors.border}`,
                background: colors.bgCard, color: colors.textSecondary,
                fontSize: font.size.md, fontWeight: font.weight.medium, cursor:'pointer', fontFamily: font.family,
              }}>취소</button>
              <button onClick={() => { setShowSaveConfirm(false); onBack?.() }} style={{
                flex:2, height:48, borderRadius: radius.sm, border:'none',
                background: colors.primary, color:'#fff',
                fontSize: font.size.md, fontWeight: font.weight.bold, cursor:'pointer', fontFamily: font.family,
              }}>저장하기</button>
            </div>
          </div>
        </>
      )}

      {/* ── 더보기 바텀시트 (미사용, 유지) */}

      {/* ── 전체 완료 모달 */}
      {showAllDone && (
        <>
          <div onClick={() => setShowAllDone(false)}
            style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:700, animation:'fadeIn 0.2s ease' }}/>
          <div style={{
            position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
            background:'#0F172A', borderRadius:20, padding:'28px 20px 24px',
            zIndex:701, width:'calc(100% - 32px)', maxWidth:360,
            boxShadow:'0 20px 60px rgba(0,0,0,0.5)',
            animation:'scaleIn 0.22s ease', overflowY:'auto', maxHeight:'90vh',
          }}>
            <img src="/mel_coffee/mel_final.jpg" alt="멜번 판테온 완성"
              style={{ width:'100%', borderRadius:12, display:'block', marginBottom:16, objectFit:'cover' }} />
            <div style={{ fontSize:15, fontWeight:800, color:'#FFB800', letterSpacing:1, marginBottom:12, textAlign:'center' }}>
              🏆 멜번 판테온 완전정복!
            </div>
            <div style={{ fontSize:12, color:'#CBD5E1', lineHeight:1.8, marginBottom:14, textAlign:'left' }}>
              마침내 25개의 성소를 모두 정복하고, 흩어져 있던 모든 신의 권능을 하나로 모았습니다. 차갑던 멜번의 거리는 당신이 뿜어내는 황금빛 커피 향기로 가득 찼으며, 잊혀진 판테온은 비로소 완전해졌습니다.
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:14 }}>
              {([
                { icon:'ph:seal-check', text:'증명된 자: 당신은 단순한 방문자를 넘어, 멜번의 서사를 완성한 유일한 창조자입니다.' },
                { icon:'ph:scroll',     text:'불멸의 기록: 이제 당신의 이름은 멜번 커피 연대기에 영원히 기록될 것입니다.' },
                { icon:'ph:crown',      text:"신의 권능: 모든 창조신이 당신 앞에 무릎을 꿇고, 당신을 최고의 '카페의 신(The Cafe God)'으로 추대합니다." },
              ] as {icon:string; text:string}[]).map((item, i) => (
                <div key={i} style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
                  <Icon icon={item.icon} width={13} height={13} color="#FFB800" style={{ marginTop:2, flexShrink:0 }} />
                  <span style={{ fontSize:11, color:'#94A3B8', lineHeight:1.6, textAlign:'left' }}>{item.text}</span>
                </div>
              ))}
            </div>
            <div style={{ fontSize:11, color:'#475569', fontStyle:'italic', textAlign:'center', marginBottom:18 }}>
              "당신이 창조한 이 세계는 영원히 당신의 전설을 노래할 것입니다!"
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => setShowAllDone(false)} style={{
                flex:1, height:48, border:'1px solid #475569', borderRadius:10,
                background:'transparent', color:'#94A3B8', fontWeight:600, fontSize:13, cursor:'pointer',
              }}>취소</button>
              <button onClick={() => { setChecked(new Set()); setCheckOrder([]); setShowAllDone(false) }} style={{
                flex:2, height:48, border:'none', borderRadius:10,
                background:'#DC2626', color:'#fff', fontWeight:700, fontSize:14, cursor:'pointer',
              }}>리셋하기</button>
            </div>
          </div>
        </>
      )}

      {/* ── 시드니 완료 모달 */}
      {showSydAllDone && (
        <>
          <div onClick={() => setShowSydAllDone(false)}
            style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:700, animation:'fadeIn 0.2s ease' }}/>
          <div style={{
            position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
            background:'#0A1628', borderRadius:20, padding:'0 0 24px',
            zIndex:701, width:'calc(100% - 32px)', maxWidth:360,
            boxShadow:'0 20px 60px rgba(0,0,0,0.5)',
            animation:'scaleIn 0.22s ease', overflowY:'auto', maxHeight:'90vh',
          }}>
            <img src="/syd_coffee/syd_final.jpg" alt="시드니 완전정복"
              style={{ width:'100%', borderRadius:'20px 20px 0 0', display:'block', objectFit:'cover' }} />
            <div style={{ padding:'20px 20px 0' }}>
              <div style={{ fontSize:15, fontWeight:800, color:'#38BDF8', letterSpacing:1, marginBottom:12, textAlign:'center' }}>
                🎉 시드니 25개 섬 완전정복!
              </div>
              <div style={{ fontSize:12, color:'#CBD5E1', lineHeight:1.8, marginBottom:8, textAlign:'left' }}>
                위대한 항해의 마침표가 찍혔습니다!
              </div>
              <div style={{ fontSize:12, color:'#94A3B8', lineHeight:1.8, marginBottom:8, textAlign:'left' }}>
                당신은 거친 파도와 보이지 않는 안개를 뚫고, 시드니라는 거대한 지도를 당신의 이름으로 가득 채웠습니다.
              </div>
              <div style={{ fontSize:12, color:'#94A3B8', lineHeight:1.8, marginBottom:8, textAlign:'left' }}>
                25개의 모든 섬에 펄럭이는 당신의 깃발은 영원히 지지 않는 태양처럼 시드니를 비출 것입니다.
              </div>
              <div style={{ fontSize:12, color:'#94A3B8', lineHeight:1.8, marginBottom:16, textAlign:'left' }}>
                모든 개척자가 당신의 발자취를 우러러보며, 당신을 이 땅의 진정한 주인인 <span style={{ color:'#38BDF8', fontWeight:700 }}>'시드니의 제왕'</span>으로 선포합니다!
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={() => setShowSydAllDone(false)} style={{
                  flex:1, height:48, border:'1px solid #1E3A5F', borderRadius:10,
                  background:'transparent', color:'#94A3B8', fontWeight:600, fontSize:13, cursor:'pointer',
                }}>취소</button>
                <button onClick={() => { setChecked(new Set()); setCheckOrder([]); setShowSydAllDone(false) }} style={{
                  flex:2, height:48, border:'none', borderRadius:10,
                  background:'#DC2626', color:'#fff', fontWeight:700, fontSize:14, cursor:'pointer',
                }}>리셋하기</button>
              </div>
            </div>
          </div>
        </>
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
                flex:1, height:48, border:'1px solid #C8C8C8', borderRadius:6,
                background:'#fff', color:'#64748B', fontWeight:600, fontSize:14, cursor:'pointer',
              }}>아니요</button>
              <button onClick={() => { setChecked(new Set()); setCheckOrder([]); setShowReset(false) }} style={{
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
})

export default BingoPage

// ── 업체 정보 컴포넌트
function CafeBusinessInfo({ businessId }: { businessId: string }) {
  const [biz, setBiz] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', businessId)
        .single()
      setBiz(data)
      setLoading(false)
    }
    load()
  }, [businessId])

  if (loading) return (
    <div style={{ textAlign:'center', padding:'24px 0', color:'#94A3B8', fontSize:14 }}>불러오는 중...</div>
  )
  if (!biz) return (
    <div style={{ textAlign:'center', padding:'24px 0', color:'#94A3B8', fontSize:14 }}>업체 정보를 찾을 수 없어요</div>
  )

  return <BusinessCard business={biz} />
}
