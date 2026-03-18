import { useState, useEffect, useRef } from 'react'
import { Icon } from '@iconify/react'
import { supabase } from '../lib/supabase'
import BusinessCard from '../components/BusinessCard'

interface BingoCafe {
  id: string
  city: string
  sort_order: number
  name: string
  business_id: string | null
  is_active: boolean
}



// ── 멜번 판테온 소제목 (1~25)
const PANTHEON_TITLE: string[] = [
  '빛의 여신', '어둠의 군주', '시간의 지배자', '공간의 창조자', '공허의 감시자',
  '물의 여신', '불의 거인', '대지의 신', '바람의 정령', '생명의 여신',
  '기억의 사서', '꿈의 무희', '지혜의 현자', '감정의 신', '예술의 무희',
  '언어의 여신', '조화의 원소', '투쟁의 전사', '커피의 기원', '제작의 기술자',
  '멜버른의 수호자', '게이샤의 영수', '융합의 혼합', '추출의 달인', '궁극의 창조신',
]
// ── 멜번 판테온 멘트 (1~25)
const PANTHEON_LORE: string[] = [
  '당신은 혼돈의 공허 속에 첫 번째 빛을 선언했습니다.',
  '당신은 빛을 더욱 선명하게 할 심연의 어둠을 드리웠습니다.',
  '당신은 영원히 멈춰 있던 세상에 시간의 바퀴를 돌리기 시작했습니다.',
  '당신은 만물이 거할 무한한 우주와 행성의 공간을 빚어냈습니다.',
  '당신은 존재의 경계를 획정하여 "있음"과 "없음"을 구분했습니다.',
  '당신은 메마른 대지에 생명의 근원인 물을 흘려보냈습니다.',
  '당신은 대지의 심장에 뜨거운 불과 마그마를 심어 에너지를 주었습니다.',
  '당신은 솟구친 불로 산맥을 이루고 굳건한 땅을 다졌습니다.',
  '당신은 정체된 공기에 숨결을 불어넣어 대기를 순환시켰습니다.',
  '당신은 대지에 푸른 숲을 입히고 숨 쉬는 모든 생명을 깨웠습니다.',
  '당신은 흐르는 시간 속에서 세상의 모든 "기억"을 기록으로 남겼습니다.',
  '당신은 이성적인 세상 너머에 환상과 상상의 "꿈"을 펼쳤습니다.',
  '당신은 세상의 진리를 탐구하는 지식과 지혜를 만물에 부여했습니다.',
  '당신은 삶을 다채롭게 할 희로애락의 감정을 심장에 불어넣었습니다.',
  '당신은 세상을 아름답게 수놓을 음악과 춤의 예술을 허락했습니다.',
  '당신은 생각과 마음을 소리로 전하는 "언어"를 가르쳤습니다.',
  '당신은 상반된 원소들을 조율하여 완벽한 "균형"을 이루었습니다.',
  '당신은 성장을 위한 시련과 극복의 원동력인 "투쟁"을 시험했습니다.',
  '당신은 세상의 모든 미각을 뛰어넘을 성스러운 "커피의 원두"를 점지했습니다.',
  '당신은 커피를 도구로 다루는 고귀한 "기술"을 인간에게 전수했습니다.',
  '당신은 커피의 정신이 깃든 도시, "멜버른"의 풍경을 그려냈습니다.',
  '당신은 멜버른의 카페에 신비로운 향기를 더할 "게이샤"의 숨결을 불어넣었습니다.',
  '당신은 전 세계의 커피 문화를 하나의 완벽한 "블렌드"로 융합했습니다.',
  '당신은 한 방울의 완벽한 추출을 위해 기술을 극한으로 닦았습니다.',
  '당신은 마침내 자신만의 완벽한 멜버른 판테온을 완성했습니다.',
]

// ── 멜번 판테온 이미지 (체크 시 표시)
const MEL_IMGS = Array.from({ length: 25 }, (_, i) => `/mel_coffee/${i + 1}.jpg`)

// ── 시드니 이미지 (체크 시 표시)
const SYD_IMGS = Array.from({ length: 25 }, (_, i) => `/syd_coffee/${i + 1}.jpg`)
// ── 시드니 소제목 (1~25)
const SYDNEY_TITLE: string[] = [
  '육분의와 지도', '요람의 탐험가', '모형 배를 깎는 소년', '지도를 그리는 소년', '깃발 꽂는 소년',
  '양피지 지도', '쌍검의 청년 탐험가', '보물상자를 발견한 전사', '정글의 원시 전사', '해안을 내려다보는 제왕',
  '망원경 속의 도시', '숲속의 궁수', '나침반을 든 손', '성을 지키는 기사', '성소의 황금 열쇠',
  '천문기구를 든 손', '기마 대장', '사막의 곡도 전사', '선상 위 결투', '황금 술잔을 든 손',
  '룬이 새겨진 단검', '황금 갑옷의 국왕', '빛의 팔라딘', '성검을 쥔 손', '태양의 제왕',
]
// ── 시드니 멘트 (1~25)
const SYDNEY_LORE: string[] = [
  '미지의 바다를 향한 첫 좌표가 찍혔습니다. 전설적인 항해의 시작입니다.',
  '운명의 파도가 당신을 시드니의 해안으로 인도했습니다. 당신은 선택받은 아이입니다.',
  '당신은 거친 바다를 정복하기 위해 자신만의 전설적인 돛을 빚기 시작했습니다.',
  '아직 누구도 가보지 못한 세상을 상상하며 당신은 첫 번째 지도를 그렸습니다.',
  '첫 번째 섬에 상륙했습니다! 당신의 깃발이 시드니의 바람에 펄럭이기 시작합니다.',
  '개척의 기록이 시작되었습니다. 이제 당신의 발자국이 시드니의 지도가 됩니다.',
  '안개 뚫린 낯선 해변, 당신은 양손에 검을 쥐고 미지의 섬으로 뛰어들었습니다.',
  '숨겨진 성소에서 잠들어 있던 고대의 지혜와 보물을 손에 넣었습니다.',
  '당신은 거친 야생의 시련을 뚫고 대자연의 힘을 다스리는 법을 배웠습니다.',
  '높은 절벽 위에서 광활한 시드니의 바다를 바라보며 영토의 주권을 선포했습니다.',
  '안개 너머, 마침내 당신이 세울 위대한 도시의 실루엣이 보이기 시작합니다.',
  '보이지 않는 위협조차 꿰뚫는 날카로운 감각으로 시드니의 내륙을 정복했습니다.',
  '당신의 의지가 곧 나침반의 방향입니다. 이제 당신은 절대 길을 잃지 않습니다.',
  '당신은 스스로 시드니의 방패가 되어, 당신이 일군 문명을 지키기로 맹세했습니다.',
  '닫혀 있던 고대의 문을 열었습니다. 이제 도시의 모든 비밀이 당신 앞에 드러납니다.',
  '당신은 하늘의 별자리를 읽어 운명의 흐름을 완벽히 통제하게 되었습니다.',
  '당신을 따르는 수많은 추종자와 함께 시드니의 거친 평원을 가로지릅니다.',
  '타는 듯한 태양과 모래바람 속에서도 당신의 개척 의지는 꺾이지 않았습니다.',
  '거친 파도 위에서 위협적인 적들을 제압하고 바다의 진정한 지배자가 되었습니다.',
  '수많은 시련 끝에 얻은 승리의 만찬, 당신의 명성은 온 대륙에 울려 퍼집니다.',
  '당신은 무기에 깃든 고대의 마법을 깨워, 인간을 초월한 힘을 얻었습니다.',
  '모든 섬을 통일한 당신은 마침내 시드니를 호령하는 위대한 국왕이 되었습니다.',
  '당신의 존재 자체가 시드니의 빛이 되어 모든 어둠과 혼돈을 몰아냅니다.',
  '마지막 시련을 끝낼 전설의 검을 뽑았습니다. 대륙의 모든 전율이 멈춥니다.',
  "축하합니다! 25개의 신대륙을 모두 정복한 당신은 이제 '시드니의 제왕'입니다.",
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
export { Props as BingoProps }

export default function BingoPage({ onBack, embedded = false, initialCity, onCityChange }: Props) {
  const pageRef = useRef<HTMLDivElement>(null)
  const [footerWidth, setFooterWidth] = useState<number | undefined>(undefined)
  const [city, setCity] = useState<'melbourne'|'sydney'>(initialCity ?? 'melbourne')
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
  const [showAllDone, setShowAllDone] = useState(false)
  const [showSydAllDone, setShowSydAllDone] = useState(false)
  const [showIntro, setShowIntro] = useState(() => {
    try {
      const mel = JSON.parse(localStorage.getItem('bingo-melbourne') ?? '[]')
      return Array.isArray(mel) && mel.length === 0
    } catch { return true }
  })
  const [showSydIntro, setShowSydIntro] = useState(() => {
    try {
      const syd = JSON.parse(localStorage.getItem('bingo-sydney') ?? '[]')
      return Array.isArray(syd) && syd.length === 0
    } catch { return true }
  })
  const [orderMelbourne, setOrderMelbourne] = useState<number[]>(() => {
    try { return JSON.parse(localStorage.getItem('bingo-order-melbourne') ?? '[]') }
    catch { return [] }
  })
  const [orderSydney, setOrderSydney] = useState<number[]>(() => {
    try { return JSON.parse(localStorage.getItem('bingo-order-sydney') ?? '[]') }
    catch { return [] }
  })
  const checkOrder    = city === 'melbourne' ? orderMelbourne : orderSydney
  const setCheckOrder = (val: number[]) => {
    if (city === 'melbourne') setOrderMelbourne(val)
    else setOrderSydney(val)
  }
  const [lastCheckedIdx, setLastCheckedIdx] = useState<number|null>(null)
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

  // checkOrder 싱크 보정 — checked에 있는데 order에 없으면 뒤에 추가
  useEffect(() => {
    const missing = [...checkedMelbourne].filter(i => !orderMelbourne.includes(i))
    if (missing.length > 0) setOrderMelbourne(prev => [...prev, ...missing])
  }, [])
  useEffect(() => {
    const missing = [...checkedSydney].filter(i => !orderSydney.includes(i))
    if (missing.length > 0) setOrderSydney(prev => [...prev, ...missing])
  }, [])

  // 이미지 preload — 마운트 시 백그라운드에서 미리 다운로드
  useEffect(() => {
    MEL_IMGS.forEach(src => { const img = new Image(); img.src = src })
    SYD_IMGS.forEach(src => { const img = new Image(); img.src = src })
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
  useEffect(() => {
    localStorage.setItem('bingo-order-melbourne', JSON.stringify(orderMelbourne))
  }, [orderMelbourne])
  useEffect(() => {
    localStorage.setItem('bingo-order-sydney', JSON.stringify(orderSydney))
  }, [orderSydney])

  const handleCell = (idx: number) => {
    const isChecked = checked.has(idx)
    if (!isChecked) {
      setLastCheckedIdx(idx)
      if (city === 'melbourne') setOrderMelbourne(prev => prev.includes(idx) ? prev : [...prev, idx])
      else setOrderSydney(prev => prev.includes(idx) ? prev : [...prev, idx])
    } else {
      if (city === 'melbourne') setOrderMelbourne(prev => prev.filter(i => i !== idx))
      else setOrderSydney(prev => prev.filter(i => i !== idx))
    }
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

  const handleCloseIntro = () => {
    localStorage.setItem('bingo-mel-intro-seen', '1')
    setShowIntro(false)
  }

  const handleLogoTap = () => {
    onBack()
  }

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
      minHeight: embedded ? 'auto' : '100vh',
      background: '#e8e8e8',
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
            { id:'shopping',   icon:'ph:shopping-bag', label:'호주쇼핑리스트',   action: () => {} },
            { id:'bingo',      icon:'ph:coffee',       label:'카페도장깨기',   action: () => {} },
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
      <div style={{ position:'sticky', top:0, zIndex:30, background:'#e8e8e8', padding:'12px 16px 0' }}>
        {/* 도시 선택 */}
        <div style={{ display:'flex', gap:8, marginBottom:10 }}>
          {([
            { id:'melbourne', label:'멜번' },
            { id:'sydney',    label:'시드니' },
          ] as { id: 'melbourne'|'sydney'; label: string }[]).map(c => (
            <button key={c.id} onClick={() => { setCity(c.id); onCityChange?.(c.id) }} style={{
              flex:1, height:36, borderRadius:8, border:'none', cursor:'pointer',
              fontWeight: city===c.id ? 700 : 500,
              fontSize:13,
              color: city===c.id ? '#1B6EF3' : '#94A3B8',
              background: '#e8e8e8',
              boxShadow: city===c.id
                ? 'inset 3px 3px 6px #c5c5c5, inset -3px -3px 6px #ffffff'
                : '3px 3px 6px #c5c5c5, -3px -3px 6px #ffffff',
              transition:'all 0.2s',
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation',
            }}>
              {c.label}
            </button>
          ))}
        </div>
        <div style={{
          background:'#fff', borderRadius:12,
          border:'1px solid #C8C8C8',
          padding:'16px 18px', display:'flex', alignItems:'center', gap:16,
        }}>
          <MiniGrid count={checked.size} />
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:10, fontWeight:700, color: city === 'melbourne' ? '#6F4E37' : '#1B4F7A', letterSpacing:1, marginBottom:2 }}>
              {city === 'melbourne' ? '멜번 판테온: 창조의 연대기' : '태양의 항해: 시드니 개척 연대기'}
            </div>
            <div style={{ fontSize:15, fontWeight:800, color:'#1E293B', marginBottom:3, lineHeight:1.3 }}>
              {getStatusMsg(checked.size, bingoCount, city).title}
            </div>
            {lastCheckedIdx !== null && checkOrder.includes(lastCheckedIdx) && (
              <div style={{ fontSize:10, fontWeight:800, color: city === 'melbourne' ? '#B45309' : '#1B6EF3', letterSpacing:0.5, marginBottom:2 }}>
                {city === 'melbourne'
                  ? PANTHEON_TITLE[checkOrder.indexOf(lastCheckedIdx)]
                  : SYDNEY_TITLE[checkOrder.indexOf(lastCheckedIdx)]}
              </div>
            )}
            <div style={{ fontSize:11, color:'#64748B', fontWeight:500, marginBottom:8, lineHeight:1.5 }}>
              {lastCheckedIdx !== null && checkOrder.includes(lastCheckedIdx)
                ? (city === 'melbourne'
                    ? PANTHEON_LORE[checkOrder.indexOf(lastCheckedIdx)]
                    : SYDNEY_LORE[checkOrder.indexOf(lastCheckedIdx)])
                : getStatusMsg(checked.size, bingoCount, city).sub}
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
            const orderIdx = checkOrder.indexOf(idx)  // 체크 순서 (0-based), -1이면 미체크
            const imgNum = orderIdx >= 0 ? orderIdx + 1 : null  // 1~25
            return (
              <div
                key={c.id}
                onClick={() => setSelectedCafe({ cafe: c, idx })}
                style={{
                  position:'relative',
                  borderRadius:10,
                  overflow:'hidden',
                  cursor:'pointer',
                  border: isHighlight ? '2px solid #EF4444' : '2px solid #C8C8C8',
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
                  background: isChecked
                    ? 'linear-gradient(135deg, #6F4E37 0%, #a0522d 100%)'
                    : 'linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  transition:'background 0.3s',
                  overflow:'hidden', position:'relative',
                }}>
                  {isChecked && imgNum !== null ? (
                    <img src={city === 'melbourne' ? MEL_IMGS[imgNum - 1] : SYD_IMGS[imgNum - 1]} alt={`stamp-${imgNum}`}
                      style={{ width:'100%', height:'100%', objectFit:'cover', transition:'opacity 0.3s' }}
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  ) : (
                    <img
                      src={city === 'melbourne' ? `/mel_coffee/mel_image/${c.sort_order}.jpg` : `/syd_coffee/syd_image/${c.sort_order}.jpg`}
                      alt={c.name}
                      style={{ width:'100%', height:'100%', objectFit:'cover' }}
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
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
                      width:18, height:18,
                      border:'2px solid rgba(255,255,255,0.9)',
                      borderRadius:'50%',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      background:'rgba(255,255,255,0.15)',
                      animation: isStamping ? 'stampIn 0.5s ease both' : 'none',
                    }}>
                      <Icon icon="ph:check-bold" width={10} height={10} color="rgba(255,255,255,1)" />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>


      </div>

      {/* ── 카페 정보 팝업 */}
      {selectedCafe && (() => {
        const { cafe: c, idx } = selectedCafe
        const isChecked = checked.has(idx)
        const orderIdx  = checkOrder.indexOf(idx)
        const imgNum    = orderIdx >= 0 ? orderIdx + 1 : checkOrder.length + 1
        const stampSrc  = city === 'melbourne' ? MEL_IMGS[imgNum - 1] : SYD_IMGS[imgNum - 1]
        const lore      = city === 'melbourne' ? PANTHEON_LORE[imgNum - 1] : SYDNEY_LORE[imgNum - 1]
        const title     = city === 'melbourne' ? PANTHEON_TITLE[imgNum - 1] : SYDNEY_TITLE[imgNum - 1]

        const handleToggle = () => {
          const willCheck = !isChecked
          handleCell(idx)
          if (willCheck) {
            setTimeout(() => setSelectedCafe(null), 500)
          }
        }

        return (
          <div style={{ position:'fixed', inset:0, zIndex:800 }}>
            <div onClick={() => setSelectedCafe(null)} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.5)' }} />
            <div style={{
              position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)',
              width:'100%', maxWidth:390,
              maxHeight:'85vh', overflowY:'auto',
              borderRadius:'20px 20px 0 0',
              background:'#F0F4F8',
              padding:'12px 12px 32px',
              boxSizing:'border-box',
            }}>
              {/* 닫기 */}
              <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:8 }}>
                <button onClick={() => setSelectedCafe(null)}
                  style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', color:'#94A3B8' }}>✕</button>
              </div>

              {/* 상단: 스탬프 이미지 + 멘트 + 체크 */}
              {(() => {
                const themeColor = city === 'melbourne' ? '#6F4E37' : '#1B6EF3'
                const themeBg    = city === 'melbourne' ? 'rgba(111,78,55,0.08)' : 'rgba(27,110,243,0.08)'
                return (
                  <div style={{
                    background:'#fff', borderRadius:16, padding:'16px',
                    marginBottom:12, border:'1px solid #C8C8C8',
                  }}>
                    <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:14 }}>
                      {/* 원형 스탬프 이미지 */}
                      <div style={{
                        width:80, height:80, borderRadius:'50%', flexShrink:0,
                        overflow:'hidden', border:`3px solid ${themeColor}`,
                        background:'linear-gradient(135deg,#6F4E37,#a0522d)',
                      }}>
                        <img
                          src={stampSrc}
                          alt={`stamp-${imgNum}`}
                          style={{ width:'100%', height:'100%', objectFit:'cover' }}
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                        />
                      </div>
                      {/* 멘트 */}
                      <div style={{ flex:1 }}>
                        {title && <div style={{ fontSize:14, fontWeight:800, color:themeColor, marginBottom:6 }}>{title}</div>}
                        {lore  && <div style={{ fontSize:12, color:'#475569', lineHeight:1.7 }}>{lore}</div>}
                      </div>
                    </div>
                    {/* 체크박스 */}
                    <div
                      onClick={handleToggle}
                      style={{
                        display:'flex', alignItems:'center', gap:10,
                        background: themeBg, borderRadius:10,
                        padding:'12px 14px', cursor:'pointer',
                        border:`1.5px solid ${isChecked ? themeColor : '#C8C8C8'}`,
                      }}
                    >
                      <div style={{
                        width:22, height:22, borderRadius:6, flexShrink:0,
                        border:`2px solid ${themeColor}`,
                        background: isChecked ? themeColor : '#fff',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        transition:'all 0.2s',
                      }}>
                        {isChecked && <Icon icon="ph:check-bold" width={13} height={13} color="#fff" />}
                      </div>
                      <span style={{ fontSize:14, fontWeight:700, color: isChecked ? themeColor : '#64748B' }}>
                        {isChecked ? '이 카페를 정복하셨습니다.' : '이 카페를 정복합니다'}
                      </span>
                    </div>
                  </div>
                )
              })()}

              {/* 업체 정보 */}
              {c.business_id
                ? <CafeBusinessInfo businessId={c.business_id} />
                : <div style={{ textAlign:'center', padding:24, color:'#94A3B8', fontSize:14 }}>업체 정보가 아직 연결되지 않았어요</div>
              }
            </div>
          </div>
        )
      })()}

      {/* ── 푸터 */}
      <div style={{
        position:'fixed', bottom:0,
        left:'50%', transform:'translateX(-50%)',
        width:'min(100%, 430px)',
        padding:'12px 14px 20px',
        background:'#fff',
        zIndex:50, boxSizing:'border-box',
        display:'flex', gap:8,
        borderTop:'1px solid #E2E8F0',
      }}>
        <button onClick={() => onBack?.()} style={{
          flex:1, height:44, borderRadius:8, border:'none',
          background:'#1B6EF3', color:'#fff',
          fontSize:15, fontWeight:700, cursor:'pointer',
          boxShadow:'0 4px 12px rgba(27,110,243,0.25)',
          display:'flex', alignItems:'center', justifyContent:'center', gap:7,
        }}>
          <Icon icon="ph:check-circle" width={18} height={18} color="#fff" />
          저장하고 나가기
        </button>
        <button onClick={() => setShowMoreMenu(true)} style={{
          width:44, height:44, borderRadius:12, flexShrink:0,
          border:'1px solid #C8C8C8', background:'#fff',
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
            width:'100%', maxWidth:390,
            background:'#fff', borderRadius:'20px 20px 0 0',
            padding:'20px 16px 36px',
            boxShadow:'0 -4px 24px rgba(0,0,0,0.15)',
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

      {/* ── 인트로 팝업 */}
      {showIntro && city === 'melbourne' && (
        <>
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:800, animation:'fadeIn 0.3s ease' }}
            onClick={handleCloseIntro} />
          <div style={{
            position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
            zIndex:801, width:'calc(100% - 32px)', maxWidth:360,
            background:'#0F172A', borderRadius:20,
            overflow:'hidden',
            boxShadow:'0 24px 48px rgba(0,0,0,0.4)',
            animation:'scaleIn 0.25s ease',
          }}>
            {/* 표지 이미지 */}
            <img src="/mel_coffee/mel.jpg" alt="멜번 판테온"
              style={{ width:'100%', aspectRatio:'1', objectFit:'cover', display:'block' }} />
            {/* 텍스트 */}
            <div style={{ padding:'20px 20px 24px' }}>
              <div style={{ fontSize:13, fontWeight:800, color:'#FFB800', letterSpacing:1, marginBottom:8 }}>
                멜번 판테온: 창조의 연대기
              </div>
              <div style={{ fontSize:13, color:'#CBD5E1', lineHeight:1.7, marginBottom:16 }}>
                태초의 정적을 깨고, 멜번을 완성할 <span style={{ color:'#FFB800', fontWeight:700 }}>'카페의 신'</span>이 바로 당신입니까?
                25개의 성소(카페)에 봉인된 창조신들이 당신의 방문을 기다리고 있습니다.
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:16 }}>
                {[
                  { icon:'ph:map-pin', text:'성소를 찾으세요: 빙고맵에 표시된 25곳의 카페로 향하십시오.' },
                  { icon:'ph:lock-open', text:'봉인을 푸세요: 커피를 즐긴 후 빙고 칸을 터치해 신들을 깨우십시오.' },
                  { icon:'ph:crown', text:'세계를 완성하세요: 모든 신을 깨우는 순간, 당신은 멜번을 지배하는 궁극의 바리스타로 등극합니다.' },
                ].map((item, i) => (
                  <div key={i} style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
                    <Icon icon={item.icon} width={14} height={14} color="#FFB800" style={{ marginTop:2, flexShrink:0 }} />
                    <span style={{ fontSize:11, color:'#94A3B8', lineHeight:1.6 }}>{item.text}</span>
                  </div>
                ))}
              </div>
              <div style={{ fontSize:12, color:'#64748B', fontStyle:'italic', textAlign:'center', marginBottom:16 }}>
                "지금 첫 번째 원두의 향기를 따라 여정을 시작하십시오!"
              </div>
              <button onClick={handleCloseIntro} style={{
                width:'100%', height:50, borderRadius:12, border:'none',
                background:'linear-gradient(135deg, #FFB800, #FF8C00)',
                color:'#0F172A', fontSize:15, fontWeight:800, cursor:'pointer',
                boxShadow:'0 4px 16px rgba(255,184,0,0.4)',
              }}>
                ☕ 여정을 시작합니다
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── 시드니 인트로 팝업 */}
      {showSydIntro && city === 'sydney' && (
        <>
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:800, animation:'fadeIn 0.3s ease' }}
            onClick={() => setShowSydIntro(false)} />
          <div style={{
            position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
            zIndex:801, width:'calc(100% - 32px)', maxWidth:360,
            background:'#0A1628', borderRadius:20,
            overflow:'hidden',
            boxShadow:'0 24px 48px rgba(0,0,0,0.4)',
            animation:'scaleIn 0.25s ease', overflowY:'auto', maxHeight:'90vh',
          }}>
            <img src="/syd_coffee/syd.jpg" alt="태양의 항해"
              style={{ width:'100%', aspectRatio:'16/9', objectFit:'cover', display:'block' }} />
            <div style={{ padding:'20px 20px 24px' }}>
              <div style={{ fontSize:13, fontWeight:800, color:'#38BDF8', letterSpacing:1, marginBottom:4 }}>
                ⛵ 태양의 항해: 25개의 신대륙
              </div>
              <div style={{ fontSize:11, color:'#38BDF8', marginBottom:12, fontStyle:'italic' }}>
                "미지의 바다를 향해 전설의 돛을 올려라!"
              </div>
              <div style={{ fontSize:12, color:'#CBD5E1', lineHeight:1.8, marginBottom:10 }}>
                당신은 태양의 인도를 받는 전설적인 탐험가입니다. 당신의 눈앞에 펼쳐진 시드니는 아직 그 누구도 발을 들이지 못한, 신비로운 25개의 섬으로 이루어진 '미개척의 땅'입니다.
              </div>
              <div style={{ fontSize:12, color:'#94A3B8', lineHeight:1.8, marginBottom:10 }}>
                이 섬들은 거친 파도와 안개 속에 몸을 숨긴 채, 자신들을 정복하고 가치를 알아봐 줄 '위대한 개척자'를 기다리고 있습니다.
              </div>
              <div style={{ fontSize:12, color:'#94A3B8', lineHeight:1.8, marginBottom:10 }}>
                당신의 미션은 명확합니다. 거친 바다를 뚫고 25개의 섬(카페)에 차례로 상륙하여 당신의 표식(깃발)을 꽂는 것입니다. 첫 번째 섬에 상륙하여 커피 향기를 만끽하는 순간, 당신의 위대한 항해는 시작됩니다.
              </div>
              <div style={{ fontSize:12, color:'#94A3B8', lineHeight:1.8, marginBottom:10 }}>
                섬을 하나씩 정복할 때마다 당신의 지도 위에는 새로운 대륙이 그려지고, 당신의 이름은 시드니의 역사에 새겨질 것입니다. 25개의 모든 섬에 깃발이 펄럭이는 날, 시드니의 모든 바다와 땅은 당신의 영토가 되며 당신은 마침내 <span style={{ color:'#38BDF8', fontWeight:700 }}>'시드니의 제왕'</span>의 칭호를 얻게 될 것입니다.
              </div>
              <div style={{ fontSize:12, color:'#38BDF8', fontStyle:'italic', textAlign:'center', marginBottom:18 }}>
                "자, 이제 닻을 올리십시오. 당신만의 새로운 세계가 기다리고 있습니다!"
              </div>
              <button onClick={() => setShowSydIntro(false)} style={{
                width:'100%', height:50, borderRadius:12, border:'none',
                background:'linear-gradient(135deg, #1B6EF3, #0ea5e9)',
                color:'#fff', fontSize:15, fontWeight:800, cursor:'pointer',
                boxShadow:'0 4px 16px rgba(27,110,243,0.4)',
              }}>
                ⛵ 항해를 시작합니다
              </button>
            </div>
          </div>
        </>
      )}

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
}

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
