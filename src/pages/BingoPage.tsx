import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import { Icon } from '@iconify/react'
import { supabase } from '../lib/supabase'
import { getCachedBingo } from '../lib/dataCache'
import BusinessCard from '../components/BusinessCard'
import { colors, font, radius, spacing } from '../styles/tokens'

interface BingoCafe {
  id: string
  city: string
  sort_order: number
  name: string
  business_id: string | null
  is_active: boolean
  image_url: string | null
}



// ── 빙고 라인 체크 (5x5)
// ── 카페 방문 멘트 (sort_order 기준)
const MEL_CAFE_MSG: Record<number, string> = {
  1:  "St. Ali 다녀오셨군요! 멜번 스페셜티의 선구자, 필굿 에스프레소 마셨나요?",
  2:  "Dukes Coffee! 작은 공간에 꽉 찬 커피 실력, 싱글오리진 드셨나요?",
  3:  "Acoffee 방문 완료! 한국인 바리스타가 만든 정교한 브루잉 커피, 어떠셨나요?",
  4:  "Shortstop 다녀왔군요! 도넛과 커피의 완벽한 조합, 올드패션드 드셨나요?",
  5:  "Market Lane 완료! 멜번 파머스 마켓 단골 로스터리, 계절 블렌드 맛보셨나요?",
  6:  "Mork Chocolate! 커피와 초콜릿의 콜라보, 핫초코 라테도 꼭 드셔보세요.",
  7:  "Industry Beans 방문! 창고형 공간에서 즐기는 싱글오리진, 플랫화이트 어땠나요?",
  8:  "Maker Coffee 완료! 조용한 동네 카페의 진심, 핸드드립 커피 한 잔의 여유.",
  9:  "Patricia Coffee! 줄 서서 먹는 스탠딩 에스프레소 바, 리스트레토 드셨나요?",
  10: "Good Measure 다녀왔군요! 수치처럼 정확한 추출, 브루잉 메뉴 도전해보셨나요?",
  11: "Brother Baba Budan! 천장에 매달린 의자, 독특한 공간에서 에스프레소 한 잔.",
  12: "Seven Seeds 완료! 멜번 스페셜티 씬의 OG, 콜드브루 어떠셨나요?",
  13: "Tone Coffee 방문! 음악처럼 섬세하게 조율된 커피, 오늘의 필터 마셨나요?",
  14: "Ona Coffee 완료! 월드 바리스타 챔피언 출신의 원두, 시그니처 블렌드 드셨나요?",
  15: "Palace Coffee 다녀왔군요! 우아한 공간에서 즐기는 클래식 에스프레소.",
  16: "Regulars 방문! 동네 단골처럼 편안한 분위기, 카푸치노 한 잔의 여유.",
  17: "Campos Coffee 완료! 호주 스페셜티의 대명사, 수페리어 블렌드 맛보셨나요?",
  18: "Small Batch 다녀왔군요! 이름처럼 소량으로 정성껏 로스팅한 원두.",
  19: "Overlay 방문! 레이어처럼 쌓이는 풍미, 플랫화이트의 정석을 경험하셨나요?",
  20: "Padre Coffee 완료! 아버지의 마음처럼 든든한 커피, 오늘의 싱글오리진은요?",
  21: "Puzzle Coffee 방문! 퍼즐 조각 맞추듯 완성되는 한 잔, 브루잉 메뉴 도전!",
  22: "Brick Lane 다녀왔군요! 골목길 감성 가득한 공간에서 에스프레소 한 잔.",
  23: "Little Rogue 완료! 작지만 거친 개성, 내추럴 프로세스 원두 어떠셨나요?",
  24: "Ini Studio 방문! 스튜디오처럼 세련된 공간, 시그니처 라테 드셨나요?",
  25: "Code Black 완료! 멜번 스페셜티의 마지막 보스, 싱글오리진 에스프레소 도전!",
}
const SYD_CAFE_MSG: Record<number, string> = {
  1:  "Single O 다녀오셨군요! 시드니 스페셜티의 시작, 해링턴 블렌드 마셨나요?",
  2:  "Artificer Coffee 완료! 장인정신으로 만든 커피, 핸드드립 메뉴 도전해보셨나요?",
  3:  "Room Ten 방문! 좁지만 꽉 찬 바리스타 실력, 에스프레소 바의 진수.",
  4:  "bills Darlinghurst 완료! 전설의 리코타 팬케이크와 함께한 플랫화이트!",
  5:  "The Grounds of Alexandria! 정원 속 커피 천국, 피트 더 빌리 고트 만났나요?",
  6:  "Toby's Estate 방문! 시드니 스페셜티 1세대, 싱글오리진 드셨나요?",
  7:  "Paramount Coffee 완료! 영화관 건물 속 힙한 카페, 시그니처 라테 어땠나요?",
  8:  "Reuben Hills 다녀왔군요! 중미 커피 전문, 코스타리카 싱글오리진 마셨나요?",
  9:  "Edition Roasters 방문! 소량 정성 로스팅, 오늘의 필터 커피 드셨나요?",
  10: "AP Bakery 완료! 크루아상과 커피의 최강 조합, 맛있는 페어링이었나요?",
  11: "Skittle Lane 방문! 골목 속 숨은 보석, 핸드드립 한 잔의 여유 어땠나요?",
  12: "Pablo & Rusty's 완료! 지속가능한 커피의 선구자, 시그니처 블렌드 드셨나요?",
  13: "Mecca Coffee 다녀왔군요! 성지순례 완료! 시드니 스페셜티의 메카.",
  14: "Gumption 방문! 신세계 백화점 안 힙한 카페, 에스프레소 한 잔의 여유.",
  15: "Double Roasters 완료! 두 배의 정성으로 로스팅, 계절 블렌드 어떠셨나요?",
  16: "Campos Coffee 완료! 시드니 스페셜티의 아이콘, 수페리어 블렌드 드셨나요?",
  17: "Circa Espresso 방문! 시드니 CBD의 아늑한 쉼터, 플랫화이트 한 잔.",
  18: "Sample Coffee 완료! 샘플처럼 다양한 원두 경험, 오늘의 추천 메뉴는요?",
  19: "ONA Coffee Sydney 방문! 멜번에서 건너온 챔피언, 시그니처 드셨나요?",
  20: "Three Williams 완료! 세 친구가 만든 카페, 따뜻한 감성의 브런치 커피.",
  21: "Normcore Coffee 방문! 평범함 속의 비범함, 심플한 에스프레소의 진수.",
  22: "Devon Cafe 완료! 데번셔 크림티 영감의 브런치 카페, 커피도 일품!",
  23: "Speedos Cafe 방문! 본다이 비치 뷰와 함께한 커피, 서퍼들의 아침.",
  24: "The Fine Food Store 완료! 식재료처럼 엄선된 원두, 브루잉 메뉴 도전!",
  25: "Coffee Alchemy 완료! 연금술처럼 마법같은 한 잔, 시드니 빙고 정복!",
}
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

// DB 저장 헬퍼
async function saveBingoDB(city: string, checked: Set<number>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from('user_bingo').upsert(
    { user_id: user.id, city, checked_indices: [...checked], updated_at: new Date().toISOString() },
    { onConflict: 'user_id,city' }
  )
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
  const [userId, setUserId] = useState<string | null>(null)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
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
  const [lastCheckedCafe, setLastCheckedCafe] = useState<{ idx: number; sort_order: number } | null>(null)
  const [selectedCafe, setSelectedCafe] = useState<{ cafe: BingoCafe; idx: number } | null>(null)

  const completedLines = getCompletedLines(checked)
  const bingoCount = completedLines.length

  useEffect(() => {
    const updateWidth = () => {
      if (pageRef.current) setFooterWidth(pageRef.current.getBoundingClientRect().width)
    }
    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  // 빙고 달성 감지 — 줄 하나 완성할 때마다 폭죽
  useEffect(() => {
    if (bingoCount > prevBingoCount) {
      setShowFireworks(true)
      setConfettiTrigger(v => v+1)
      setTimeout(() => setShowFireworks(false), 3500)
    }
    setPrevBingoCount(bingoCount)
  }, [bingoCount])

  // 로그인 감지
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) return
      setUserId(user.id)
    }
    init()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user?.id ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // 로컬스토리지 저장
  useEffect(() => {
    localStorage.setItem('bingo-melbourne', JSON.stringify([...checkedMelbourne]))
    if (userId) saveBingoDB('melbourne', checkedMelbourne)
  }, [checkedMelbourne, userId])
  useEffect(() => {
    localStorage.setItem('bingo-sydney', JSON.stringify([...checkedSydney]))
    if (userId) saveBingoDB('sydney', checkedSydney)
  }, [checkedSydney, userId])
  const handleCell = (idx: number) => {
    if (city === 'melbourne') {
      setCheckedMelbourne(prev => {
        const next = new Set(prev)
        if (next.has(idx)) {
          next.delete(idx)
          setLastCheckedCafe(null)
        } else {
          next.add(idx)
          const c = melbourneCafes[idx]
          if (c) setLastCheckedCafe({ idx, sort_order: c.sort_order })
          setStampAnim(idx)
          setTimeout(() => setStampAnim(null), 600)
          setConfettiTrigger(v => v+1)
        }
        return next
      })
    } else {
      setCheckedSydney(prev => {
        const next = new Set(prev)
        if (next.has(idx)) {
          next.delete(idx)
          setLastCheckedCafe(null)
        } else {
          next.add(idx)
          const c = sydneyCafes[idx]
          if (c) setLastCheckedCafe({ idx, sort_order: c.sort_order })
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
    const link = isMelbourne ? 'hojugaja.com/app?tab=bingo&city=melbourne' : 'hojugaja.com/app?tab=bingo&city=sydney'
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
    triggerSave: () => {
      if (!userId) { setShowLoginPrompt(true); return }
      setShowSaveConfirm(true)
    },
    triggerShare: () => handleShare(),
    triggerReset: () => setShowReset(true),
  }))

  // 빙고 라인에 포함된 셀 인덱스
  const highlightedCells = new Set(completedLines.flat())

  useEffect(() => {
    const load = async () => {
      // 캐시 우선 사용
      const cached = getCachedBingo()
      if (cached && cached.length > 0) {
        setMelbourneCafes(cached.filter((c: any) => c.city === 'melbourne'))
        setSydneyCafes(cached.filter((c: any) => c.city === 'sydney'))
        setCafesLoading(false)
        return
      }
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
            <div style={{ fontSize: font.size.sm, color: colors.textTertiary, fontWeight: font.weight.regular, lineHeight:1.6 }}>
              {lastCheckedCafe && checked.has(lastCheckedCafe.idx)
                ? (city === 'melbourne'
                    ? MEL_CAFE_MSG[lastCheckedCafe.sort_order]
                    : SYD_CAFE_MSG[lastCheckedCafe.sort_order])
                : getStatusMsg(checked.size, bingoCount, city).sub}
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
      <div style={{ flex:1, padding:`8px 12px ${embedded ? '60px' : '80px'}`, overflowY:'auto', minHeight:0 }}>
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
                    src={c.image_url ?? (city === 'melbourne' ? `/mel_coffee/mel_image/${c.sort_order}.jpg` : `/syd_coffee/syd_image/${c.sort_order}.jpg`)}
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
              {/* 핸들 */}
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
        zIndex:50, boxSizing:'border-box',
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

      {/* ── 로그인 유도 팝업 */}
      {showLoginPrompt && (
        <>
          <div onClick={() => setShowLoginPrompt(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:900 }} />
          <div style={{
            position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
            background: colors.bgCard, borderRadius: radius.lg,
            padding:`${spacing[6]}px ${spacing[5]}px`,
            zIndex:901, width:'calc(100% - 48px)', maxWidth:300,
            textAlign:'center', fontFamily: font.family,
            boxShadow:'0 8px 32px rgba(0,0,0,0.15)',
          }}>
            <div style={{ fontSize:32, marginBottom: spacing[3] }}>☕</div>
            <div style={{ fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.textPrimary, marginBottom: spacing[2] }}>로그인이 필요해요</div>
            <div style={{ fontSize: font.size.sm, color: colors.textSecondary, marginBottom: spacing[5], lineHeight:1.6 }}>
              빙고 진행 상황을 저장하려면<br/>로그인이 필요합니다.
            </div>
            <div style={{ display:'flex', gap: spacing[2] }}>
              <button onClick={() => setShowLoginPrompt(false)} style={{
                flex:1, height:44, borderRadius: radius.sm,
                border:`1px solid ${colors.border}`, background: colors.bgCard,
                color: colors.textSecondary, fontSize: font.size.md,
                fontWeight: font.weight.medium, cursor:'pointer', fontFamily: font.family,
              }}>취소</button>
              <button onClick={() => { setShowLoginPrompt(false); window.location.href = '/onboarding' }} style={{
                flex:2, height:44, borderRadius: radius.sm, border:'none',
                background: colors.primary, color:'#fff',
                fontSize: font.size.md, fontWeight: font.weight.bold,
                cursor:'pointer', fontFamily: font.family,
              }}>로그인하기</button>
            </div>
          </div>
        </>
      )}

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
              <button onClick={async () => {
                if (userId) {
                  await saveBingoDB('melbourne', checkedMelbourne)
                  await saveBingoDB('sydney', checkedSydney)
                }
                setShowSaveConfirm(false)
                onBack?.()
              }} style={{
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
