import { useState, useRef, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { CheckItem } from '../data/checklist'
import { supabase } from '../lib/supabase'

type Category = { id: string; label: string; emoji: string; sort_order: number }
type DBItem = { id: string; category_id: string; label: string; icon: string | null; sort_order: number; address?: string | null; description?: string | null; related_business_id?: string | null; related_business_ids?: string[] | null; image_url?: string | null; tips?: string | null; related_product_ids?: string[] | null }
import {
  AppState, TripInfo,
  toggleItem, setSchedule, setCategory, addCustom,
  issueReceipt, resetAll, saveTrip, loadTrip, clearTrip,
  fmt, getTripDays, fmtMD, dow,
} from '../store/state'
import ScheduleSheet from '../components/ScheduleSheet'
import ReceiptModal from '../components/ReceiptModal'
import Services from './Services'
import BingoPage from './BingoPage'
import BucketCheckView from './BucketCheckView'
import Community from './Community'
import Shopping from './Shopping'
import MyShoppingView from './MyShoppingView'
import BusinessCard from '../components/BusinessCard'
import type { Business } from '../lib/businessService'

const CAT_ICON_MAP: Record<string,string> = {
  hospital:'ph:first-aid-kit',food:'ph:fork-knife',shopping:'ph:shopping-bag',
  admin:'ph:files',people:'ph:users',parenting:'ph:baby',places:'ph:map-pin',
  schedule:'ph:calendar',custom:'ph:star',
}

const TAG_COLOR: Record<string, { bg: string; color: string }> = {
  '인기':      { bg:'#FEF3C7', color:'#B45309' },
  '강추':      { bg:'#DCFCE7', color:'#15803D' },
  '선물':      { bg:'#FCE7F3', color:'#BE185D' },
  '프리미엄':  { bg:'#EDE9FE', color:'#7C3AED' },
  '가성비':    { bg:'#DBEAFE', color:'#1D4ED8' },
  '필수템':    { bg:'#FEE2E2', color:'#DC2626' },
}
const PRICE_COLOR: Record<string, string> = { '$': '#16A34A', '$$': '#D97706', '$$$': '#7C3AED' }
const PRICE_LABEL: Record<string, string> = { '$': '저렴', '$$': '보통', '$$$': '고급' }

type Props = { state: AppState; setState: (s: AppState) => void }
type Modal = 'none' | 'noTrip' | 'noDate' | 'noSchedule' | 'confirmReset' | 'tripPicker'
type MainTab = 'bucketlist' | 'services' | 'shopping' | 'myshoppinglist' | 'bingo' | 'community'

export default function ChecklistPage({ state, setState, onLanding }: Props & { onLanding?: () => void }) {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [trip, setTrip]               = useState<TripInfo|null>(() => loadTrip())
  const [categories, setCategories]   = useState<Category[]>([])
  const [dbItems, setDbItems]         = useState<DBItem[]>([])
  const [dbLoading, setDbLoading]     = useState(true)
  const [modal, setModal]             = useState<Modal>('none')
  const [sheetItem, setSheetItem]     = useState<CheckItem|null>(null)
  const [showReceipt, setShowReceipt] = useState(false)
  const [achieved, setAchieved]       = useState<Record<string,boolean>>(() => { try { return JSON.parse(localStorage.getItem('bucket-achieved') ?? '{}') } catch { return {} } })
  const [issuedAt, setIssuedAt]       = useState('')
  const [shakeBtn, setShakeBtn]       = useState(false)
  const [customLabel, setCustomLabel] = useState('')
  const [bingoCity, setBingoCity]     = useState<'melbourne'|'sydney'>('melbourne')
  const [mainTab, setMainTab]         = useState<MainTab>(() => {
    const tab = searchParams.get('tab')
    if (tab === 'services' || tab === 'shopping' || tab === 'myshoppinglist' || tab === 'bingo' || tab === 'community') return tab as MainTab
    return 'bucketlist'
  })
  const [showScheduleView, setShowScheduleView] = useState(!!trip)
  const [scheduleSelectedItem, setScheduleSelectedItem] = useState<string|null>(null)
  const [scrollTrigger, setScrollTrigger] = useState(0)
  const [logoTapCount, setLogoTapCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const logoTapTimer = useRef<any>(null)

  const [bizCount, setBizCount] = useState(0)
  const [shopCount, setShopCount] = useState(0)
  const [myList, setMyList] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('my-shopping-list') ?? '[]') } catch { return [] }
  })
  const [myChecked, setMyChecked] = useState<Record<string,boolean>>(() => {
    try { return JSON.parse(localStorage.getItem('my-shopping-checked') ?? '{}') } catch { return {} }
  })

  const myListCount = myList.length
  const myCheckedCount = myList.filter(id => myChecked[id]).length

  const handleMyListChange = (next: string[]) => {
    setMyList(next)
    try { localStorage.setItem('my-shopping-list', JSON.stringify(next)) } catch {}
  }
  const handleMyCheckedChange = (next: Record<string,boolean>) => {
    setMyChecked(next)
    try { localStorage.setItem('my-shopping-checked', JSON.stringify(next)) } catch {}
  }
  const [detailBizId, setDetailBizId] = useState<string|null>(null)
  const [detailBiz, setDetailBiz] = useState<Business|null>(null)
  const [detailItem, setDetailItem] = useState<DBItem|null>(null)
  const [detailBizCards, setDetailBizCards] = useState<Business[]>([])
  const [selProduct, setSelProduct] = useState<any|null>(null)

  useEffect(() => {
    async function fetchBizCount() {
      try {
        const { supabase } = await import('../lib/supabase')
        const { count } = await supabase
          .from('businesses')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true)
        if (count !== null) setBizCount(count)
      } catch {}
    }
    fetchBizCount()
  }, [])

  useEffect(() => {
    async function fetchShopCount() {
      try {
        const { supabase } = await import('../lib/supabase')
        const { count } = await supabase
          .from('shopping_products')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true)
        if (count !== null) setShopCount(count)
      } catch {}
    }
    fetchShopCount()
  }, [])

  useEffect(() => {
    const fetchChecklist = async () => {
      const [{ data: cats }, { data: items }] = await Promise.all([
        supabase.from('checklist_categories').select('*').order('sort_order'),
        supabase.from('checklist_items').select('*').eq('is_active', true).order('sort_order'),
      ])
      if (cats) setCategories(cats)
      if (items) setDbItems(items)
      setDbLoading(false)
    }
    fetchChecklist()
  }, [])

  const [highlightItem, setHighlightItem] = useState<string | null>(null)

  // URL ?cat=food&item=f36 처리 — 랜딩에서 추천 버킷리스트 클릭 시
  useEffect(() => {
    const cat  = searchParams.get('cat')
    const item = searchParams.get('item')
    if (cat) {
      setState(setCategory(state, cat))
      if (item) {
        setHighlightItem(item)
        setTimeout(() => {
          const el = document.getElementById(`item-${item}`)
          if (el) el.scrollIntoView({ behavior:'smooth', block:'center' })
        }, 600)
        // 3초 후 하이라이트 제거
        setTimeout(() => setHighlightItem(null), 3500)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  // date picker state
  const [pickerStep, setPickerStep]   = useState<'start'|'end'>('start')
  const [startDate, setStartDate]     = useState(trip?.startDate ?? '')
  const [endDate, setEndDate]         = useState(trip?.endDate ?? '')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleLogoTap = () => {
    const next = logoTapCount + 1
    setLogoTapCount(next)
    if (logoTapTimer.current) clearTimeout(logoTapTimer.current)
    if (next >= 5) { navigate('/admin'); setLogoTapCount(0); return }
    logoTapTimer.current = setTimeout(() => {
      if (next < 5) navigate('/')
      setLogoTapCount(0)
    }, 400)
  }

  const CATEGORIES = categories
  const ITEMS: CheckItem[] = dbItems.map(i => ({
    id: i.id,
    categoryId: i.category_id,
    label: i.label,
    emoji: '📌',
  }))

  const activeCategory = (state.meta.activeCategory && CATEGORIES.some(c => c.id === state.meta.activeCategory))
    ? state.meta.activeCategory
    : (CATEGORIES[0]?.id ?? 'cafe')
  const allItems = [...ITEMS, ...state.customItems.map(c => ({ ...c, emoji:'📝' }))]
  const catItems = allItems.filter(i => i.categoryId === activeCategory)

  // 검색 필터링 — 검색어 있으면 전체 항목에서 제목/설명/주소 검색
  const searchResults = searchQuery.trim()
    ? allItems.filter(i => {
        const q = searchQuery.trim().toLowerCase()
        const db = dbItems.find(d => d.id === i.id)
        return (
          i.label.toLowerCase().includes(q) ||
          (db?.description ?? '').toLowerCase().includes(q) ||
          (db?.address ?? '').toLowerCase().includes(q) ||
          (db?.tips ?? '').toLowerCase().includes(q)
        )
      })
    : null
  const done  = Object.keys(state.selected).length
  const total = allItems.length
  const unscheduledCount = Object.keys(state.selected).filter(id => !(state.schedules[id]?.length)).length

  const tripLabel = trip
    ? `${trip.startDate.slice(5).replace('-','/')}~${trip.endDate.slice(5).replace('-','/')}`
    : null

  const handleOpenTripPicker = () => {
    setPickerStep('start')
    setStartDate(trip?.startDate ?? '')
    setEndDate(trip?.endDate ?? '')
    setModal('tripPicker')
  }

  const [showFireworks, setShowFireworks] = useState(false)

  const playFireworksSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()

      const boom = (time: number, freq: number, vol: number) => {
        // 터지는 쿵 소리
        const buf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate)
        const data = buf.getChannelData(0)
        for (let i = 0; i < data.length; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.08))
        }
        const src = ctx.createBufferSource()
        src.buffer = buf
        const gain = ctx.createGain()
        const filter = ctx.createBiquadFilter()
        filter.type = 'lowpass'
        filter.frequency.setValueAtTime(freq, time)
        filter.frequency.exponentialRampToValueAtTime(80, time + 0.4)
        gain.gain.setValueAtTime(vol, time)
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.5)
        src.connect(filter); filter.connect(gain); gain.connect(ctx.destination)
        src.start(time)
      }

      const sparkle = (time: number, freq: number, delay: number) => {
        // 반짝이는 고음
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, time + delay)
        osc.frequency.exponentialRampToValueAtTime(freq * 0.5, time + delay + 0.3)
        gain.gain.setValueAtTime(0.15, time + delay)
        gain.gain.exponentialRampToValueAtTime(0.001, time + delay + 0.3)
        osc.connect(gain); gain.connect(ctx.destination)
        osc.start(time + delay); osc.stop(time + delay + 0.3)
      }

      const now = ctx.currentTime
      // 1차 폭발
      boom(now, 300, 0.8)
      // 2차 폭발
      boom(now + 0.35, 200, 0.6)
      // 3차 작은 폭발
      boom(now + 0.65, 150, 0.4)
      // 반짝임 소리들
      const freqs = [1200, 1500, 1800, 2100, 900, 1350, 1650]
      freqs.forEach((f, i) => sparkle(now, f, 0.1 + i * 0.08))
      freqs.forEach((f, i) => sparkle(now, f * 0.75, 0.5 + i * 0.06))
    } catch {}
  }

  const handleDateSelect = (val: string) => {
    if (pickerStep === 'start') {
      setStartDate(val)
      setPickerStep('end')
    } else {
      setEndDate(val)
      const t = { startDate, endDate: val }
      saveTrip(t); setTrip(t)
      setModal('none')
      setShowScheduleView(true)  // 일정 입력 시 일정보기 자동 활성화
      playFireworksSound()
      setShowFireworks(true)
      setTimeout(() => setShowFireworks(false), 2800)
    }
  }

  const handleResetTrip = () => {
    setStartDate(''); setEndDate(''); clearTrip(); setTrip(null); setModal('none')
  }

  const handleIssue = () => {
    if (!trip) { setModal('noTrip'); return }
    if (done === 0) { triggerShake(); return }
    const checkedIds = Object.keys(state.selected)
    const unscheduled = checkedIds.filter(id => !(state.schedules[id]?.length))
    if (unscheduled.length > 0) { setModal('noSchedule'); return }
    const at = fmt(new Date())
    setIssuedAt(at); setState(issueReceipt(state, at))
    // ReceiptModal 안 띄움 — BucketCheckView로 자동 전환
  }

  const triggerShake = () => { setShakeBtn(true); setTimeout(() => setShakeBtn(false), 600) }

  const handleAddCustom = () => {
    const label = customLabel.trim(); if (!label) return
    setState(addCustom(state, label, activeCategory)); setCustomLabel('')
  }

  const doReset = () => {
    setState(resetAll()); setTrip(null); setStartDate(''); setEndDate('')
    setShowReceipt(false); setModal('none')
    try { localStorage.removeItem('bucket-achieved') } catch {}
  }

  // ── 발행된 버킷리스트 → 체크 화면 분기 ──
  const isIssued = !!state.meta.lastIssuedAt
  if (mainTab === 'bucketlist' && isIssued && trip) {
    return (
      <>
        <BucketCheckView
          state={state}
          trip={trip}
          setState={setState}
          items={ITEMS}
          dbItems={dbItems}
          onAchievedChange={setAchieved}
          onEdit={() => {
            setShowReceipt(false)
            const next = { ...state, meta: { ...state.meta, lastIssuedAt: undefined } }
            setState(next)
            try { localStorage.setItem('korea-receipt', JSON.stringify(next)) } catch {}
            // 버킷체크뷰 달성 기록도 초기화 (수정 모드로 돌아가면 진행률 리셋)
            try { localStorage.removeItem('bucket-achieved') } catch {}
            setAchieved({})
          }}
          onDelete={doReset}
          onShare={() => {
            const at = state.meta.lastIssuedAt ?? issuedAt
            setIssuedAt(at)
            setShowReceipt(true)
          }}
          onServices={() => setMainTab('services')}
          onShopping={() => setMainTab(myListCount > 0 ? 'myshoppinglist' : 'shopping')}
          onBingo={() => setMainTab('bingo')}
          onCommunity={() => setMainTab('community')}
          onLanding={() => onLanding?.()}
        />
        {showReceipt && trip && (
          <ReceiptModal state={state} trip={trip} issuedAt={issuedAt}
            achieved={achieved} dbItems={dbItems}
            onClose={() => setShowReceipt(false)} onReset={() => { setShowReceipt(false); doReset() }} />
        )}
      </>
    )
  }

  return (
    <div style={{ minHeight:'100vh', background:'#e8e8e8',
      fontFamily:'"Pretendard",-apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif',
      boxSizing:'border-box', maxWidth:480, margin:'0 auto', position:'relative' }}>

      <style>{`
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
        @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
        @keyframes scaleIn  { from{opacity:0;transform:translate(-50%,-50%) scale(.94)} to{opacity:1;transform:translate(-50%,-50%) scale(1)} }
        @keyframes shake    { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-5px)} 40%{transform:translateX(5px)} 60%{transform:translateX(-3px)} 80%{transform:translateX(3px)} }
        @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:0.6} }
        @keyframes toastIn  { from{opacity:0;transform:translateX(-50%) translateY(-8px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
        @keyframes fwShoot  { 0%{transform:translate(-50%,-50%) scale(0);opacity:1} 100%{transform:translate(var(--tx),var(--ty)) scale(1);opacity:0} }
        @keyframes fwBurst  { 0%{transform:translate(-50%,-50%) scale(0) rotate(var(--r));opacity:1} 80%{opacity:0.8} 100%{transform:translate(var(--tx),var(--ty)) scale(1) rotate(var(--r));opacity:0} }
        .tab-btn { transition: color .15s; }
        .chip-btn { transition: all .12s; -webkit-tap-highlight-color: transparent; }
        .list-item { transition: background .1s; }
        .list-item:active { background: #F1F5F9 !important; }
        .neu-tab {
          background: #e8e8e8;
          border: none;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          transition: all 0.15s ease;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
          box-shadow: 3px 3px 6px #c5c5c5, -3px -3px 6px #ffffff;
          border-radius: 10px;
        }
        .neu-tab.active {
          box-shadow: inset 3px 3px 6px #c5c5c5, inset -3px -3px 6px #ffffff;
        }
        .neu-tab:active {
          box-shadow: inset 3px 3px 6px #c5c5c5, inset -3px -3px 6px #ffffff;
        }
        .cat-scroll { overflow-x:auto; }
        .day-scroll { overflow-x:auto; scrollbar-width:thin; scrollbar-color:#C8C8C8 #e8e8e8; }
        .day-scroll::-webkit-scrollbar { height:4px; }
        .day-scroll::-webkit-scrollbar-track { background:#e8e8e8; border-radius:2px; }
        .day-scroll::-webkit-scrollbar-thumb { background:#C8C8C8; border-radius:2px; }
        @media (max-width:768px) {
          .cat-scroll { scrollbar-width:thin; scrollbar-color:#C8C8C8 #e8e8e8; }
          .cat-scroll::-webkit-scrollbar { height:4px; }
          .cat-scroll::-webkit-scrollbar-track { background:#e8e8e8; border-radius:2px; }
          .cat-scroll::-webkit-scrollbar-thumb { background:#C8C8C8; border-radius:2px; }
        }
        @media (min-width:769px) {
          .cat-scroll::-webkit-scrollbar { height:4px; }
          .cat-scroll::-webkit-scrollbar-track { background:#e8e8e8; border-radius:2px; }
          .cat-scroll::-webkit-scrollbar-thumb { background:#C8C8C8; border-radius:2px; }
        }
      `}</style>

      {/* ── 헤더 + 탭 ── */}
      <div style={{ background:'#e8e8e8', paddingBottom: 8 }}>
        {/* 브랜드 + 카운터 */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px 12px' }}>
          <span onClick={handleLogoTap}
            style={{ fontSize:13, color:'#1B6EF3', fontWeight:800, letterSpacing:2, cursor:'pointer', userSelect:'none' }}
          >HOJUGAJA</span>
          <span style={{ fontSize:13, color:'#64748B', fontWeight:600 }}>
            {mainTab === 'services' ? `${bizCount}개 업체` : mainTab === 'bucketlist' ? `${total}개 버킷리스트` : mainTab === 'bingo' ? (bingoCity === 'melbourne' ? '멜번' : '시드니') : mainTab === 'shopping' ? `${shopCount}개 상품` : mainTab === 'myshoppinglist' ? `${myCheckedCount}/${myListCount}` : ''}
          </span>
        </div>
        {/* 탭 */}
        <div style={{ display:'flex', padding:'0 10px', gap:8, overflowX:'auto', scrollbarWidth:'none' }}>
          {([
            { id:'bucketlist', icon:'ph:check-circle',  label:'버킷리스트' },
            { id:'shopping',   icon:'ph:shopping-bag',  label:'쇼핑리스트' },
            { id:'bingo',      icon:'ph:coffee',        label:'카페빙고게임' },
            { id:'community',  icon:'ph:chats-circle',  label:'채팅방' },
            { id:'services',   icon:'ph:buildings',     label:'업체리스트' },
          ] as { id: MainTab; icon: string; label: string }[]).map(tab => {
            const isShopping = tab.id === 'shopping'
            const hasMyList  = isShopping && myListCount > 0

            // 내쇼핑리스트 페이지에 있을 때 → 쇼핑 탭은 파란색+평평
            const isMyShoppingPage = mainTab === 'myshoppinglist'

            // 탭 클릭 동작
            const handleClick = () => {
              if (isShopping) {
                if (hasMyList && mainTab === 'shopping') {
                  // 쇼핑페이지 → 내쇼핑리스트 페이지
                  setMainTab('myshoppinglist')
                } else if (mainTab === 'myshoppinglist') {
                  // 내쇼핑리스트 → 쇼핑 페이지
                  setMainTab('shopping')
                } else if (hasMyList) {
                  // 다른 페이지에서 → 내쇼핑리스트 바로
                  setMainTab('myshoppinglist')
                } else {
                  setMainTab('shopping')
                }
              } else {
                setMainTab(tab.id as MainTab)
              }
            }

            // 아이콘/라벨/색상 결정
            let tabIcon  = tab.icon
            let tabLabel = tab.label
            let tabColor = '#94A3B8'
            let isActive = false

            if (isShopping) {
              if (isMyShoppingPage) {
                // 내쇼핑리스트 페이지에서 → 쇼핑백+파란색+평평
                tabIcon  = 'ph:shopping-bag'
                tabLabel = '쇼핑리스트'
                tabColor = '#1B6EF3'
                isActive = false
              } else if (hasMyList) {
                // 쇼핑페이지 or 다른페이지에서 리스트 있음 → 카트+녹색+평평
                tabIcon  = 'ph:shopping-cart-simple'
                tabLabel = `내쇼핑리스트 ${myListCount}`
                tabColor = mainTab === 'shopping' ? '#FF6B9D' : '#94A3B8'
                isActive = false
              } else {
                // 기본 상태
                tabColor = mainTab === 'shopping' ? '#1B6EF3' : '#94A3B8'
                isActive = mainTab === 'shopping'
              }
            } else {
              isActive = mainTab === tab.id
              tabColor = isActive ? '#1B6EF3' : '#94A3B8'
            }

            return (
              <button key={tab.id} onClick={handleClick}
                className={`neu-tab${isActive ? ' active' : ''}`}
                style={{ flex:1, minWidth:0, height:52 }}>
                <Icon icon={tabIcon} width={16} height={16} color={tabColor} />
                <span style={{ fontSize:9, fontWeight: isActive || (isShopping && hasMyList) ? 700 : 500, color: tabColor, whiteSpace:'nowrap' }}>
                  {tabLabel}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {mainTab === 'services' ? (
        <Services onSelectBusiness={() => {}} onBack={() => setMainTab('bucketlist')} />
      ) : mainTab === 'shopping' ? (
        <Shopping
          myList={myList}
          myChecked={myChecked}
          onMyListChange={handleMyListChange}
          onMyCheckedChange={handleMyCheckedChange}
          onGoToMyList={() => setMainTab('myshoppinglist')}
        />
      ) : mainTab === 'myshoppinglist' ? (
        <MyShoppingView
          myList={myList}
          myChecked={myChecked}
          onMyListChange={handleMyListChange}
          onMyCheckedChange={handleMyCheckedChange}
          onBack={() => setMainTab('shopping')}
          onLanding={() => navigate('/')}
        />
      ) : mainTab === 'bingo' ? (
        <BingoPage embedded={true} onCityChange={setBingoCity} onBack={() => window.location.href = '/'} />
      ) : mainTab === 'community' ? (
        <Community />
      ) : (
        <>
          {/* ── SUB HEADER (버튼들) — 스크롤 시 사라짐 ── */}
          <div style={{ background:'#e8e8e8' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 20px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:14, fontWeight:700, color: done>0 ? '#1B6EF3' : '#94A3B8' }}>
                  {done>0 ? `${done}개 선택됨` : (trip ? '항목을 선택하세요' : '여행 일정을 설정하세요')}
                </span>
                {unscheduledCount>0 && (
                  <span style={{ fontSize:11, color:'#92620a', fontWeight:700,
                    background:'rgba(255,205,0,0.20)', padding:'2px 8px', borderRadius:4 }}>
                    {unscheduledCount}개 미지정
                  </span>
                )}
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={handleOpenTripPicker} style={{
                  height:34, padding:'0 14px', borderRadius:8, border:'none',
                  background: '#e8e8e8',
                  color: tripLabel ? '#16A34A' : '#94A3B8',
                  fontSize:13, fontWeight:700, cursor:'pointer',
                  display:'flex', alignItems:'center', gap:5,
                  boxShadow: tripLabel
                    ? 'inset 3px 3px 6px #c5c5c5, inset -3px -3px 6px #ffffff'
                    : '3px 3px 6px #c5c5c5, -3px -3px 6px #ffffff',
                  animation: !tripLabel ? 'pulse 1.4s ease-in-out infinite' : 'none',
                  WebkitTapHighlightColor:'transparent',
                }}>
                  <Icon icon="ph:airplane-takeoff" width={15} height={15} color={tripLabel ? '#16A34A' : '#94A3B8'} />
                  {tripLabel ?? '여행일정 설정'}
                </button>
                <button onClick={() => setShowScheduleView(v=>!v)} style={{
                  height:34, padding:'0 14px', borderRadius:8, border:'none',
                  background: '#e8e8e8',
                  color: showScheduleView ? '#1B6EF3' : '#94A3B8',
                  fontSize:13, fontWeight:700, cursor:'pointer',
                  display:'flex', alignItems:'center', gap:5,
                  boxShadow: showScheduleView
                    ? 'inset 3px 3px 6px #c5c5c5, inset -3px -3px 6px #ffffff'
                    : '3px 3px 6px #c5c5c5, -3px -3px 6px #ffffff',
                  WebkitTapHighlightColor:'transparent',
                }}>
                  <Icon icon="ph:list-checks" width={15} height={15} color={showScheduleView ? '#1B6EF3' : '#94A3B8'} />
                  일정보기
                </button>
              </div>
            </div>
          </div>

          {/* ── STICKY: 달력 + 카테고리 칩 ── */}
          <div style={{ background:'#e8e8e8', position:'sticky', top:0, zIndex:24 }}>

            {/* Schedule grid view */}
            {showScheduleView && trip && (
              <ScheduleGrid
                state={state} trip={trip} allItems={allItems}
                selectedItemId={scheduleSelectedItem}
                scrollTrigger={scrollTrigger}
              />
            )}

            {/* Category chips — custom 포함 4열 그리드, custom 항상 마지막 */}
            {(() => {
              const nonCustomCats = CATEGORIES.filter(c => c.id !== 'custom')
              const customCat = CATEGORIES.find(c => c.id === 'custom')
              const allCats = customCat ? [...nonCustomCats, customCat] : nonCustomCats
              return (
                <div>

                  <div style={{ display:'flex', alignItems:'center' }}>
                    {/* 카테고리 스크롤 (검색 버튼 포함) */}
                    <div className="cat-scroll" style={{ display:'flex', gap:6, padding:'8px 16px 10px', overflowX:'auto', flex:1, alignItems:'center' }}>
                      {/* 검색 버튼 */}
                      <button className="chip-btn" onClick={() => { setShowSearch(v => !v); if (showSearch) setSearchQuery('') }} style={{
                        height:36, padding:'0 12px', borderRadius:8, border:'none',
                        background: showSearch ? '#e8e8e8' : '#FFCD00',
                        cursor:'pointer',
                        color: showSearch ? '#FFCD00' : '#fff',
                        fontSize:12, fontWeight:700,
                        display:'flex', alignItems:'center', gap:5, flexShrink:0,
                        boxShadow: showSearch
                          ? 'inset 3px 3px 6px #c5c5c5, inset -3px -3px 6px #ffffff'
                          : '3px 3px 6px #c5c5c5, -3px -3px 6px #ffffff',
                        WebkitTapHighlightColor:'transparent',
                      }}>
                        <Icon icon="ph:magnifying-glass" width={14} height={14} color={showSearch ? '#FFCD00' : '#fff'} />
                        검색
                      </button>
                      {/* 검색창 - 인라인으로 카테고리 밀기 */}
                      {showSearch && (
                        <div style={{
                          display:'flex', alignItems:'center', gap:6,
                          background:'#fff', borderRadius:8, padding:'0 10px',
                          height:36, flexShrink:0, width:320,
                          border:'1px solid #C8C8C8',
                          boxShadow:'inset 1px 1px 3px #d0d0d0',
                        }}>
                          <input
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="검색"
                            style={{ flex:1, border:'none', outline:'none', fontSize:13, color:'#1E293B', background:'transparent', minWidth:0 }}
                          />
                          {searchQuery && (
                            <button onClick={() => setSearchQuery('')} style={{ background:'none', border:'none', cursor:'pointer', padding:0, display:'flex', alignItems:'center', flexShrink:0 }}>
                              <Icon icon="ph:x" width={13} height={13} color="#94A3B8" />
                            </button>
                          )}
                        </div>
                      )}
                  {allCats.map(cat => {
                    const isActive = activeCategory === cat.id
                    const catDone  = allItems.filter(i => i.categoryId===cat.id && state.selected[i.id]).length
                    const catUnsch = allItems.filter(i => i.categoryId===cat.id && state.selected[i.id] && !(state.schedules[i.id]?.length)).length
                    const isCustom = cat.id === 'custom'
                    return (
                      <button key={cat.id} className="chip-btn" onClick={() => setState(setCategory(state, cat.id))} style={{
                        height:36, borderRadius:8, border:'none',
                        background: '#e8e8e8',
                        color: isActive ? '#1B6EF3' : '#64748B',
                        fontSize:12, fontWeight: isActive ? 700 : 500,
                        cursor:'pointer', position:'relative',
                        flexShrink:0, padding:'0 14px',
                        boxShadow: isActive
                          ? 'inset 3px 3px 6px #c5c5c5, inset -3px -3px 6px #ffffff'
                          : '3px 3px 6px #c5c5c5, -3px -3px 6px #ffffff',
                        display:'flex', alignItems:'center', justifyContent:'center', gap: isCustom ? 4 : 0,
                        WebkitTapHighlightColor:'transparent',
                      }}>
                        {isCustom && <Icon icon="ph:pencil-simple" width={11} height={11} color={isActive ? '#FFCD00' : '#94A3B8'} />}
                        {cat.label}
                        {catDone>0 && (
                          <span style={{
                            position:'absolute', top:-5, right:-4,
                            background: catUnsch>0 ? '#FFCD00' : '#16A34A',
                            color: catUnsch>0 ? '#92620a' : '#fff',
                            borderRadius:99, fontSize:9, fontWeight:800,
                            minWidth:15, height:15, display:'flex', alignItems:'center', justifyContent:'center', padding:'0 2px',
                          }}>{catDone}</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
              )
            })()}
          </div>

          {/* ── LIST ── */}
          <div style={{ paddingBottom:100, background:'#e8e8e8' }}>
            {/* Section label */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 20px 8px' }}>
              <span style={{ fontSize:13, color:'#64748B', fontWeight:600 }}>
                {CATEGORIES.find(c=>c.id===activeCategory)?.label}
              </span>
              <span style={{ fontSize:13, color:'#1B6EF3', fontWeight:700 }}>
                {catItems.filter(i=>state.selected[i.id]).length}/{catItems.length}
              </span>
            </div>

            {/* Custom add */}
            {activeCategory === 'custom' && (
              <div style={{ display:'flex', gap:6, padding:'0 16px 10px', alignItems:'center' }}>
                <div style={{
                  flex:1, display:'flex', alignItems:'center', gap:8,
                  background:'#fff', borderRadius:10, padding:'0 12px',
                  border:'1px solid #C8C8C8', height:44,
                  boxShadow:'0 2px 8px rgba(0,0,0,0.06)',
                }}>
                  <Icon icon="ph:plus-circle" width={18} height={18} color="#1B6EF3" />
                  <input ref={inputRef} value={customLabel}
                    onChange={e => setCustomLabel(e.target.value)}
                    onKeyDown={e => e.key==='Enter' && handleAddCustom()}
                    placeholder="직접 추가"
                    style={{ flex:1, border:'none', outline:'none', fontSize:15, color:'#0F172A', background:'transparent' }}
                  />
                </div>
                <button onClick={handleAddCustom} style={{
                  height:44, padding:'0 16px', background:'#1B6EF3', color:'#fff',
                  border:'none', borderRadius:10, fontWeight:700, fontSize:14, cursor:'pointer',
                  boxShadow:'0 2px 8px rgba(27,110,243,0.25)',
                }}>추가</button>
              </div>
            )}

            {/* Items list — card style */}
            <div style={{ display:'flex', flexDirection:'column', gap:8, padding:'0 16px 106px' }}>
              {searchResults !== null && searchResults.length === 0 && (
                <div style={{ textAlign:'center', padding:'40px 0', color:'#94A3B8', fontSize:14 }}>
                  검색 결과가 없어요
                </div>
              )}
              {(searchResults ?? catItems).map(item => {
                const checked  = !!state.selected[item.id]
                const dayCount = (state.schedules[item.id] ?? []).length
                const needsSch = checked && dayCount===0
                const isHighlight = highlightItem === item.id
                return (
                  <div key={item.id} id={`item-${item.id}`} style={{
                    display:'flex', alignItems:'stretch',
                    borderRadius:12,
                    background: isHighlight ? '#EFF6FF'
                              : checked && dayCount===0 ? '#fffbeb'
                              : checked ? '#fff8e4'
                              : '#fff',
                    border:'1px solid #C8C8C8',
                    borderLeft: isHighlight ? '4px solid #1B6EF3'
                              : checked ? '4px solid #16A34A'
                              : '4px solid #CBD5E1',
                    transition:'all 0.3s', overflow:'hidden',
                  }}>
                    {/* 왼쪽 - 이미지 꽉 채우기 */}
                    {(() => {
                      const db = dbItems.find(d => d.id === item.id)
                      return (
                        <div onClick={async e => {
                          e.stopPropagation()
                          if (!db) return
                          if ((db.related_product_ids?.length ?? 0) > 0) {
                            const { data } = await supabase.from('shopping_products').select('*').eq('id', db.related_product_ids![0]).single()
                            if (data) setSelProduct(data)
                            return
                          }
                          setDetailItem(db)
                          if ((db.related_business_ids?.length ?? 0) > 0) {
                            const { data } = await supabase.from('businesses').select('*').in('id', db.related_business_ids!)
                            setDetailBizCards(data ?? [])
                          } else setDetailBizCards([])
                        }} style={{
                          width:80, flexShrink:0, cursor: db ? 'pointer' : 'default',
                          background:'#f0f0f0', overflow:'hidden',
                          display:'flex', alignItems:'center', justifyContent:'center',
                        }}>
                          {db?.image_url
                            ? <img src={db.image_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                            : <Icon icon={db?.icon ?? CAT_ICON_MAP[(item as any).categoryId] ?? 'ph:star'} width={28} height={28} color={checked ? '#78716C' : '#CBD5E1'} />
                          }
                        </div>
                      )
                    })()}

                    {/* 가운데 - 제목 + 설명 + 뱃지 */}
                    <div style={{ flex:1, display:'flex', flexDirection:'column', gap:3, minWidth:0, justifyContent:'center', padding:'10px 8px 10px 12px' }}>
                      <span style={{
                        fontSize:14, fontWeight: checked ? 700 : 500,
                        color: checked ? '#0F172A' : '#475569',
                        lineHeight:1.4,
                        display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden',
                      }}>{item.label}</span>
                      {(() => {
                        const db = dbItems.find(d => d.id === item.id)
                        const stateMap: Record<string, {label:string; color:string; bg:string; icon:string}> = {
                          'NSW': { label:'시드니',    color:'#fff', bg:'#B8860B', icon:'ph:house-line' },
                          'VIC': { label:'멜번',      color:'#fff', bg:'#1a237e', icon:'ph:tram' },
                          'QLD': { label:'브리즈번',  color:'#fff', bg:'#E65100', icon:'ph:sun' },
                          'WA':  { label:'퍼스',      color:'#fff', bg:'#0891B2', icon:'ph:waves' },
                          'SA':  { label:'애들레이드', color:'#fff', bg:'#BE185D', icon:'ph:wine' },
                          'TAS': { label:'태즈매니아', color:'#fff', bg:'#065F46', icon:'ph:tree' },
                          'ACT': { label:'캔버라',    color:'#fff', bg:'#374151', icon:'ph:flag' },
                          'NT':  { label:'다윈',      color:'#fff', bg:'#92400E', icon:'ph:compass' },
                        }
                        const regionKey = db?.address ? Object.keys(stateMap).find(k => db.address!.toUpperCase().includes(k)) : null
                        const region = regionKey ? stateMap[regionKey] : null
                        const hasDetail = !!(db?.description || db?.address || (db?.related_business_ids?.length ?? 0) > 0 || db?.tips)
                        return (
                          <>
                            {db?.description && (
                              <span style={{
                                fontSize:11, color:'#94A3B8', fontWeight:400, lineHeight:1.5,
                                overflow:'hidden', textOverflow:'ellipsis',
                                display:'-webkit-box', WebkitLineClamp:1, WebkitBoxOrient:'vertical',
                              }}>{db.description}</span>
                            )}
                            {hasDetail && (
                              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:4 }}>
                                <button
                                  onClick={async e => {
                                    e.stopPropagation()
                                    if (!db) return
                                    // 관련 상품이 있으면 첫 번째 상품 팝업으로
                                    if ((db.related_product_ids?.length ?? 0) > 0) {
                                      const { data } = await supabase.from('shopping_products').select('*').eq('id', db.related_product_ids![0]).single()
                                      if (data) setSelProduct(data)
                                      return
                                    }
                                    // 없으면 일반 상세 팝업
                                    setDetailItem(db)
                                    if ((db.related_business_ids?.length ?? 0) > 0) {
                                      const { data } = await supabase.from('businesses').select('*').in('id', db.related_business_ids!)
                                      setDetailBizCards(data ?? [])
                                    } else setDetailBizCards([])
                                  }}
                                  style={{
                                    fontSize:11, fontWeight:600, color:'#1B6EF3',
                                    background:'#fff', border:'1px solid #C8C8C8',
                                    borderRadius:20, cursor:'pointer', padding:'3px 10px',
                                    flexShrink:0,
                                  }}>
                                  자세히 알아보기›
                                </button>
                                {region ? (
                                  <span style={{
                                    fontSize:11, fontWeight:600, color:'#64748B',
                                    display:'flex', alignItems:'center', gap:3,
                                  }}>
                                    <Icon icon="ph:map-pin-fill" width={11} height={11} color="#EF4444" />
                                    {region.label}
                                  </span>
                                ) : <span />}
                              </div>
                            )}
                          </>
                        )
                      })()}
                    </div>

                    {/* 오른쪽 - 체크박스 위, 일정 아래 */}
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'space-between', flexShrink:0, gap:6, padding:'10px 12px 10px 0' }}>
                      <button onClick={e => {
                        e.stopPropagation()
                        if (!trip) { setModal('noTrip'); return }
                        setState(toggleItem(state, item.id))
                      }} style={{
                        width:26, height:26, borderRadius:6, flexShrink:0,
                        border: checked ? 'none' : '1.5px solid #C8C8C8',
                        background: checked ? '#16A34A' : '#fff',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        cursor:'pointer', padding:0,
                        boxShadow: checked ? 'none' : '1px 1px 3px #d0d0d0, -1px -1px 3px #ffffff',
                      }}>
                        {checked && (
                          <svg width="12" height="9" viewBox="0 0 11 8" fill="none">
                            <path d="M1 4L4 7L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </button>
                      <button onClick={e => {
                        e.stopPropagation()
                        if (!checked) return
                        if (!trip) { setModal('noTrip'); return }
                        setSheetItem(item as CheckItem)
                      }} style={{
                        height:26, padding:'0 8px', borderRadius:6, fontSize:10, fontWeight:700,
                        cursor: checked ? 'pointer' : 'default', flexShrink:0,
                        border:'none',
                        background: !checked   ? '#F1F5F9'
                                  : dayCount>0 ? 'rgba(68,64,60,0.10)'
                                  : '#FFCD00',
                        color: !checked   ? '#CBD5E1'
                             : dayCount>0 ? '#44403C'
                             : '#92620a',
                        boxShadow: checked && dayCount===0 ? '0 2px 6px rgba(255,205,0,0.4)' : 'none',
                        whiteSpace:'nowrap',
                      }}>
                        {dayCount>0 ? `${dayCount}일 ✓` : '+일정'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Bottom CTA ── */}
          <div style={{
            position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)',
            width:'100%', maxWidth:430,
            background:'#e8e8e8',
            zIndex:20, boxSizing:'border-box',
            padding:'12px 14px 20px',
            borderTop:'1px solid #C8C8C8',
          }}>
            {unscheduledCount>0 && done>0 && (
              <div style={{ fontSize:11, color:'#92620a', textAlign:'center', marginBottom:8, fontWeight:700,
                background:'rgba(255,205,0,0.15)', borderRadius:6, padding:'5px 0' }}>
                ⚠️ {unscheduledCount}개 항목에 날짜를 지정해주세요
              </div>
            )}
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={handleIssue} style={{
                flex:4, height:44,
                background:'#e8e8e8', color:'#1B6EF3',
                border:'none', borderRadius:8, fontSize:15, fontWeight:700, cursor:'pointer',
                animation: shakeBtn ? 'shake 0.5s ease' : 'none',
                boxShadow:'3px 3px 6px #c5c5c5, -3px -3px 6px #ffffff',
                WebkitTapHighlightColor:'transparent',
                display:'flex', alignItems:'center', justifyContent:'center', gap:6,
              }}>버킷리스트 발행하기</button>
              <button onClick={() => setModal('confirmReset')} style={{
                flex:2, height:44,
                background:'#e8e8e8', color:'#94A3B8',
                border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer',
                boxShadow:'3px 3px 6px #c5c5c5, -3px -3px 6px #ffffff',
                WebkitTapHighlightColor:'transparent',
              }}>↻ 초기화</button>
            </div>
          </div>
        </>
      )}

      {/* ── 폭죽 ── */}
      {showFireworks && <Fireworks />}



      {/* ── 토스트 ── */}

      {/* ── Trip date picker modal ── */}
      {modal==='tripPicker' && (
        <TripPickerModal
          step={pickerStep}
          startDate={startDate}
          onSelect={handleDateSelect}
          onReset={handleResetTrip}
          onClose={() => setModal('none')}
        />
      )}

      {/* ── Alert modals ── */}
      {modal==='confirmReset' && (
        <AlertModal title="전체 초기화할까요?" message="체크 내용과 여행일정이 모두 삭제됩니다."
          confirmLabel="삭제" confirmColor="#D93025" onConfirm={doReset} onCancel={() => setModal('none')} />
      )}
      {modal==='noTrip' && (
        <AlertModal title="여행일정을 먼저 설정해주세요"
          confirmLabel="날짜 입력하기" confirmFirst onConfirm={() => { setModal('none'); setTimeout(handleOpenTripPicker, 100) }} onCancel={() => setModal('none')} />
      )}
      {modal==='noDate' && (
        <AlertModal title="출발일과 도착일을 모두 선택해주세요"
          confirmLabel="확인" onConfirm={() => setModal('none')} onCancel={() => setModal('none')} hideCancel />
      )}
      {modal==='noSchedule' && (
        <AlertModal title="날짜 미지정 항목이 있어요"
          message="체크된 모든 항목에 날짜를 지정해야 발행할 수 있어요."
          confirmLabel="확인" onConfirm={() => setModal('none')} onCancel={() => setModal('none')} hideCancel />
      )}

      {sheetItem && trip && (
        <ScheduleSheet itemLabel={sheetItem.label} trip={trip}
          currentDays={state.schedules[sheetItem.id] ?? []}
          onSelect={days => {
            setState(setSchedule(state, sheetItem.id, days))
            setScheduleSelectedItem(sheetItem.id)
            setScrollTrigger(v => v + 1)
          }}
          onClose={() => setSheetItem(null)} />
      )}

      {showReceipt && trip && (
        <ReceiptModal state={state} trip={trip} issuedAt={issuedAt}
          achieved={achieved} dbItems={dbItems}
          onClose={() => setShowReceipt(false)} onReset={() => setModal('confirmReset')} />
      )}

      {/* 쇼핑 상품 팝업 */}
      {selProduct && (
        <>
          <div onClick={() => setSelProduct(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:600 }} />
          <div style={{
            position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)',
            width:'100%', maxWidth:390, background:'#e8e8e8',
            borderRadius:'20px 20px 0 0', zIndex:601,
            animation:'slideUpSheet 0.25s ease', maxHeight:'85vh', overflowY:'auto',
          }}>
            <div style={{ width:40, height:4, borderRadius:2, background:'#C8C8C8', margin:'12px auto 0' }} />
            <div style={{
              width:'100%', height:220,
              background: selProduct.image_url ? 'none' : 'linear-gradient(135deg, #e0e0e0, #d0d0d0)',
              display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden',
            }}>
              {selProduct.image_url
                ? <img src={selProduct.image_url} alt={selProduct.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                : <Icon icon="ph:shopping-bag" width={60} height={60} color="#94A3B8" />
              }
            </div>
            <div style={{ padding:'16px 18px 40px' }}>
              <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:10, alignItems:'center' }}>
                {(selProduct.tags ?? []).map((tag: string) => (
                  <span key={tag} style={{
                    fontSize:10, fontWeight:800, padding:'3px 8px', borderRadius:6,
                    background: TAG_COLOR[tag]?.bg ?? '#e8e8e8',
                    color: TAG_COLOR[tag]?.color ?? '#475569',
                  }}>{tag}</span>
                ))}
                {selProduct.price_range && (
                  <span style={{
                    fontSize:10, fontWeight:800, padding:'3px 8px', borderRadius:6,
                    background:'#e8e8e8', color: PRICE_COLOR[selProduct.price_range] ?? '#475569',
                    border:`1px solid ${PRICE_COLOR[selProduct.price_range] ?? '#C8C8C8'}`,
                    marginLeft:'auto',
                  }}>{selProduct.price_range} · {PRICE_LABEL[selProduct.price_range]}</span>
                )}
              </div>
              <div style={{ fontSize:18, fontWeight:800, color:'#0F172A', marginBottom:4 }}>{selProduct.name}</div>
              {selProduct.brand && <div style={{ fontSize:13, color:'#64748B', marginBottom:12 }}>{selProduct.brand}</div>}
              {selProduct.description && (
                <div style={{ fontSize:13, color:'#334155', lineHeight:1.7, marginBottom:16 }}>{selProduct.description}</div>
              )}
              {(selProduct.where_to_buy ?? []).length > 0 && (
                <div style={{ marginBottom:16 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'#94A3B8', marginBottom:8 }}>어디서 살 수 있어요?</div>
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                    {selProduct.where_to_buy.map((store: string) => (
                      <span key={store} style={{
                        fontSize:11, fontWeight:600, padding:'5px 10px', borderRadius:8,
                        background:'#e8e8e8', color:'#475569', border:'1px solid #C8C8C8',
                      }}>🏪 {store}</span>
                    ))}
                  </div>
                </div>
              )}
              <button onClick={() => setSelProduct(null)} style={{
                width:'100%', height:50, borderRadius:12, border:'none',
                background:'#e8e8e8', color:'#1B6EF3', fontSize:15, fontWeight:700, cursor:'pointer',
                boxShadow:'3px 3px 6px #c5c5c5, -3px -3px 6px #ffffff',
              }}>확인</button>
            </div>
          </div>
        </>
      )}

      {/* 버킷리스트 상세 팝업 */}
      {detailItem && (
        <div onClick={() => setDetailItem(null)} style={{
          position:'fixed', inset:0, zIndex:600,
          background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)',
          fontFamily:"'Pretendard','Noto Sans KR',sans-serif",
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)',
            width:'100%', maxWidth:390,
            background:'#e8e8e8', borderRadius:'20px 20px 0 0',
            maxHeight:'88vh', overflowY:'auto',
            animation:'slideUpSheet 0.25s ease',
          }}>
            {/* 핸들 */}
            <div style={{ width:40, height:4, borderRadius:2, background:'#C8C8C8', margin:'12px auto 0' }} />

            {/* 이미지 (있을 때만) */}
            {detailItem.image_url && (
              <div style={{ width:'100%', height:220, overflow:'hidden', marginTop:8 }}>
                <img src={detailItem.image_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              </div>
            )}

            <div style={{ padding:'16px 18px 40px' }}>
              {/* 제목 */}
              <div style={{ fontSize:18, fontWeight:800, color:'#0F172A', lineHeight:1.4, marginBottom:12 }}>
                {detailItem.label}
              </div>
              {/* 설명 */}
              {detailItem.description && (
                <div style={{ fontSize:14, color:'#475569', lineHeight:1.7, marginBottom:16, whiteSpace:'pre-wrap' }}>
                  {detailItem.description}
                </div>
              )}
              {/* 팁 */}
              {detailItem.tips && (
                <div style={{
                  background:'#fff', border:'1px solid #C8C8C8', borderRadius:12,
                  padding:'12px 14px', marginBottom:16,
                }}>
                  <div style={{ fontSize:12, fontWeight:700, color:'#F59E0B', marginBottom:6 }}>💡 현지인 팁</div>
                  <div style={{ fontSize:13, color:'#475569', lineHeight:1.6 }}>{detailItem.tips}</div>
                </div>
              )}
              {/* 주소 */}
              {detailItem.address && (
                <button
                  onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(detailItem.address!)}`, '_blank')}
                  style={{
                    display:'flex', alignItems:'center', gap:8, width:'100%',
                    background:'#fff', border:'1px solid #C8C8C8', borderRadius:12,
                    padding:'12px 14px', marginBottom:16, cursor:'pointer', textAlign:'left',
                  }}>
                  <Icon icon="ph:map-pin" width={18} height={18} color="#1B6EF3" />
                  <div>
                    <div style={{ fontSize:11, color:'#94A3B8', fontWeight:500 }}>여기서 할 수 있어요</div>
                    <div style={{ fontSize:13, color:'#1B6EF3', fontWeight:600, textDecoration:'underline' }}>{detailItem.address}</div>
                  </div>
                  <Icon icon="ph:arrow-square-out" width={14} height={14} color="#94A3B8" style={{ marginLeft:'auto' }} />
                </button>
              )}
              {/* 관련 업체 카드 */}
              {detailBizCards.length > 0 && (
                <div style={{ marginBottom:16 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:'#64748B', marginBottom:8 }}>🏢 관련 업체</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {detailBizCards.map(biz => (
                      <BusinessCard key={biz.id} business={biz} />
                    ))}
                  </div>
                </div>
              )}
              {/* 닫기 버튼 */}
              <button onClick={() => setDetailItem(null)} style={{
                width:'100%', height:48, borderRadius:12, border:'none',
                background:'#e8e8e8', color:'#64748B', fontSize:14, fontWeight:700,
                cursor:'pointer', boxShadow:'3px 3px 6px #c5c5c5, -3px -3px 6px #ffffff',
              }}>닫기</button>
            </div>
          </div>
        </div>
      )}

      {/* 관련업체 팝업 */}
      {detailBizId && (
        <div style={{ position:'fixed', inset:0, zIndex:800 }}>
          <div onClick={() => setDetailBizId(null)}
            style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.5)' }} onClick={() => { setDetailBizId(null); setDetailBiz(null) }} />
          <div style={{
            position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)',
            width:'100%', maxWidth:390,
            maxHeight:'85vh', overflowY:'auto',
            borderRadius:'20px 20px 0 0',
            background:'#e8e8e8',
            padding:'12px 12px 32px',
            boxSizing:'border-box',
          }}>
            <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:8 }}>
              <button onClick={() => { setDetailBizId(null); setDetailBiz(null) }}
                style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', color:'#94A3B8' }}>✕</button>
            </div>
            {detailBiz
              ? <BusinessCard business={detailBiz} />
              : <div style={{ textAlign:'center', padding:24, color:'#94A3B8', fontSize:14 }}>불러오는 중...</div>
            }
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Schedule Grid View ── */
function ScheduleGrid({ state, trip, allItems, selectedItemId, scrollTrigger }: {
  state: AppState; trip: TripInfo; allItems: any[]; selectedItemId: string | null; scrollTrigger?: number
}) {
  const days = getTripDays(trip)
  const scrollRef = useRef<HTMLDivElement>(null)

  // selectedItemId 또는 schedules 가 바뀌면 첫 번째 할당 날짜로 스크롤
  useEffect(() => {
    if (!selectedItemId || !scrollRef.current) return
    const assignedDays = state.schedules[selectedItemId] ?? []
    if (assignedDays.length === 0) return
    const firstDay = Math.min(...assignedDays)
    const el = scrollRef.current.querySelector(`[data-dayidx="${firstDay}"]`) as HTMLElement | null
    if (!el) return
    const container = scrollRef.current
    const containerWidth = container.offsetWidth
    const elLeft = el.offsetLeft
    const elWidth = el.offsetWidth
    const targetScrollLeft = elLeft - containerWidth / 2 + elWidth / 2
    container.scrollTo({ left: targetScrollLeft, behavior: 'smooth' })
  }, [selectedItemId, state.schedules, scrollTrigger])

  // 각 날짜별 할당 수 (선택된 아이템 기준)
  const assignedDays = selectedItemId ? (state.schedules[selectedItemId] ?? []) : []

  // 날짜별 총 할당 아이템 수 (빨간 강도용)
  const dayCount = days.map((_, idx) =>
    allItems.filter(item => state.selected[item.id] && (state.schedules[item.id] ?? []).includes(idx)).length
  )
  const maxCount = Math.max(1, ...dayCount)

  // 색상 4단계: 0=흰색, 1=연두, 2=노랑, 3=주황, 4+=빨강
  function dayColor(count: number): string {
    if (count <= 0) return '#ffffff'
    if (count === 1) return '#D1FAE5'
    if (count === 2) return '#FEF08A'
    if (count === 3) return '#FED7AA'
    return '#FCA5A5'
  }

  // 선택된 아이템이 있는 날짜의 하단 아이템 목록 — activeDayIdx 없이 selectedItem 기준
  const [activeDayIdx, setActiveDayIdx] = useState<number|null>(null)

  const dayItems = activeDayIdx !== null
    ? allItems.filter(item => state.selected[item.id] && (state.schedules[item.id] ?? []).includes(activeDayIdx))
    : []

  return (
    <div style={{ borderTop:'1px solid #C8C8C8', padding:'10px 16px 12px', background:'#e8e8e8' }}>
      <div ref={scrollRef} className="day-scroll" style={{ display:'flex', gap:6, overflowX:'auto', paddingBottom:4, scrollBehavior:'smooth' }}>
        {days.map((d, idx) => {
          const isActive   = activeDayIdx === idx
          const bg = dayColor(dayCount[idx])

          return (
            <button
              key={idx}
              data-dayidx={idx}
              onClick={() => setActiveDayIdx(isActive ? null : idx)}
              style={{
                minWidth:54, height:46, borderRadius:8, flexShrink:0,
                border: isActive ? '1px solid #1B6EF3' : '1px solid #C8C8C8',
                cursor:'pointer',
                background: isActive && dayCount[idx] === 0 ? '#EFF6FF' : bg,
                color: isActive ? '#1B6EF3' : '#64748B',
                fontSize:11, fontWeight: isActive ? 700 : 500, position:'relative', textAlign:'center',
                lineHeight:1.3, padding:'4px 2px',
                WebkitTapHighlightColor:'transparent',
              }}>
              <div>{idx+1}일차</div>
              <div style={{ fontSize:10, opacity:0.8 }}>{fmtMD(d)}</div>
              {dayCount[idx] > 0 && (
                <span style={{
                  position:'absolute', top:2, right:3,
                  fontSize:8, fontWeight:900,
                  color: '#44403C',
                }}>{dayCount[idx]}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* 선택된 날짜의 아이템 목록 */}
      <div style={{ marginTop:8, minHeight:30 }}>
        {activeDayIdx === null ? (
          <p style={{ fontSize:11, color:'#94A3B8', textAlign:'center', padding:'6px 0' }}>
            날짜를 눌러 할당된 항목을 확인하세요
          </p>
        ) : dayItems.length === 0 ? (
          <p style={{ fontSize:11, color:'#94A3B8', textAlign:'center', padding:'6px 0' }}>항목의 "+일정" 버튼으로 추가하세요</p>
        ) : (
          <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
            {dayItems.map(item => (
              <span key={item.id} style={{
                background:'rgba(27,110,243,0.08)', borderRadius:6,
                padding:'3px 9px', fontSize:11, color:'#1B6EF3', fontWeight:600,
              }}>{item.label}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Mini Calendar ── */
function MiniCalendar({ year, month, selected, minDate, onSelect }: {
  year: number; month: number; selected: string; minDate?: string;
  onSelect: (d: string) => void
}) {
  const pad = (n: number) => String(n).padStart(2, '0')
  const firstDay = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let i = 1; i <= daysInMonth; i++) cells.push(i)
  while (cells.length % 7 !== 0) cells.push(null)

  const DAYS = ['일', '월', '화', '수', '목', '금', '토']

  return (
    <div style={{ width: '100%' }}>
      {/* 요일 헤더 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', marginBottom: 4 }}>
        {DAYS.map((d, i) => (
          <div key={d} style={{
            textAlign: 'center', fontSize: 11, fontWeight: 700, padding: '4px 0',
            color: i === 0 ? '#E05050' : i === 6 ? '#4477CC' : '#8AAAC8',
          }}>{d}</div>
        ))}
      </div>
      {/* 날짜 그리드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '3px 0' }}>
        {cells.map((day, idx) => {
          if (!day) return <div key={idx} />
          const dateStr = `${year}-${pad(month)}-${pad(day)}`
          const isSelected = dateStr === selected
          const isDisabled = !!minDate && dateStr < minDate
          const dayOfWeek = (firstDay + day - 1) % 7
          const isToday = dateStr === new Date().toISOString().slice(0, 10)
          return (
            <div key={idx} onClick={() => !isDisabled && onSelect(dateStr)} style={{
              textAlign: 'center', padding: '6px 0', borderRadius: 8, cursor: isDisabled ? 'default' : 'pointer',
              background: isSelected ? '#1B6EF3' : 'transparent',
              color: isDisabled ? '#C8D4E4'
                : isSelected ? '#fff'
                : dayOfWeek === 0 ? '#E05050'
                : dayOfWeek === 6 ? '#4477CC'
                : '#2A3A4C',
              fontSize: 13, fontWeight: isSelected || isToday ? 800 : 500,
              border: isToday && !isSelected ? '1.5px solid #1B6EF3' : '1.5px solid transparent',
              boxSizing: 'border-box',
            }}>{day}</div>
          )
        })}
      </div>
    </div>
  )
}

/* ── Trip Picker Modal ── */
function TripPickerModal({ step, startDate, onSelect, onReset, onClose }:
  { step: 'start' | 'end'; startDate: string; onSelect: (v: string) => void; onReset: () => void; onClose: () => void }) {

  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [selected, setSelected] = useState('')
  const isStart = step === 'start'
  const minDate = !isStart && startDate ? startDate : undefined

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.60)', zIndex: 500, animation: 'fadeIn 0.2s ease' }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 'calc(100% - 32px)', maxWidth: 340,
        background: '#e8e8e8', borderRadius: 16, padding: '20px 20px 16px',
        zIndex: 501,
        animation: 'scaleIn 0.2s ease',
        transformOrigin: 'center center',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        {/* 헤더 */}
        <div style={{ textAlign: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, letterSpacing: 1, marginBottom: 4 }}>
            {isStart ? 'STEP 1 / 2' : 'STEP 2 / 2'}
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#1B6EF3' }}>
            {isStart ? '✈️ 출발일을 선택해주세요' : '🏠 도착일을 선택해주세요'}
          </div>
          {!isStart && startDate && (
            <div style={{ fontSize: 11, color: '#8AAAC8', marginTop: 3 }}>출발일: {startDate}</div>
          )}
        </div>

        {/* 월 네비게이션 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <button onClick={prevMonth} style={{
            width: 32, height: 32, borderRadius: 6, border: '1px solid #C8C8C8',
            background: '#e8e8e8', cursor: 'pointer', fontSize: 14, color: '#1B6EF3', fontWeight: 800,
          }}>‹</button>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{year}년 {month}월</div>
          <button onClick={nextMonth} style={{
            width: 32, height: 32, borderRadius: 6, border: '1px solid #C8C8C8',
            background: '#e8e8e8', cursor: 'pointer', fontSize: 14, color: '#1B6EF3', fontWeight: 800,
          }}>›</button>
        </div>

        {/* 캘린더 */}
        <MiniCalendar
          year={year} month={month} selected={selected}
          minDate={minDate}
          onSelect={d => setSelected(d)}
        />

        {/* 선택된 날짜 표시 */}
        <div style={{
          marginTop: 12, padding: '10px 14px', borderRadius: 8,
          background: selected ? 'rgba(27,110,243,0.06)' : '#e8e8e8',
          textAlign: 'center', fontSize: 14, fontWeight: 600,
          color: selected ? '#1B6EF3' : '#94A3B8',
          border: selected ? '1px solid #C8C8C8' : '1px solid #C8C8C8',
        }}>
          {selected ? `📅 ${selected}` : '날짜를 선택해주세요'}
        </div>

        <button onClick={() => selected && onSelect(selected)} style={{
          width: '100%', height: 54, borderRadius: 6, border: 'none', cursor: selected ? 'pointer' : 'default',
          background: '#e8e8e8',
          color: selected ? '#1B6EF3' : '#94A3B8', fontSize: 15, fontWeight: 700,
          marginTop: 10, marginBottom: 4,
          boxShadow: '3px 3px 6px #c5c5c5, -3px -3px 6px #ffffff',
          WebkitTapHighlightColor: 'transparent',
        }}>
          {isStart ? '다음 →' : '완료'}
        </button>
      </div>
    </>
  )
}

/* ── Empty Services tab ── */
function EmptyServices() {
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:40, gap:12 }}>
      <div style={{ fontSize:48, opacity:0.3 }}>🔍</div>
      <p style={{ fontSize:14, color:'#8AAAC8', fontWeight:600, textAlign:'center', lineHeight:1.6 }}>
        업체/서비스 찾기<br/>
        <span style={{ fontSize:12, fontWeight:500 }}>준비 중입니다</span>
      </p>
    </div>
  )
}

/* ── Alert Modal ── */
function AlertModal({ title, message, confirmLabel, confirmColor, onConfirm, onCancel, hideCancel, confirmFirst }:
  { title:string; message?:string; confirmLabel:string; confirmColor?:string; onConfirm:()=>void; onCancel:()=>void; hideCancel?:boolean; confirmFirst?:boolean }) {
  return (
    <>
      <div onClick={onCancel} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.60)', zIndex:600, animation:'fadeIn 0.2s ease' }}/>
      <div style={{
        position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
        background:'#e8e8e8', borderRadius:16, padding:'24px 20px',
        zIndex:601, width:'calc(100% - 48px)', maxWidth:300, textAlign:'center',
        animation:'scaleIn 0.22s ease',
        transformOrigin:'center center',
      }}>
        <p style={{ fontSize:16, fontWeight:700, color:'#0F172A', marginBottom: message ? 8 : 20, lineHeight:1.5 }}>{title}</p>
        {message && <p style={{ fontSize:14, color:'#64748B', marginBottom:20, lineHeight:1.6 }}>{message}</p>}
        <div style={{ display:'flex', gap:8 }}>
          {confirmFirst && (
            <button onClick={onConfirm} style={{ flex:2, height:48, border:'none', borderRadius:6, background:'#e8e8e8', color: confirmColor ?? '#1B6EF3', fontWeight:700, fontSize:15, cursor:'pointer', boxShadow:'3px 3px 6px #c5c5c5, -3px -3px 6px #ffffff' }}>
              {confirmLabel}
            </button>
          )}
          {!hideCancel && (
            <button onClick={onCancel} style={{ flex:1, height:48, border:'none', borderRadius:6, background:'#e8e8e8', color:'#64748B', fontWeight:600, fontSize:14, cursor:'pointer', boxShadow:'3px 3px 6px #c5c5c5, -3px -3px 6px #ffffff' }}>취소</button>
          )}
          {!confirmFirst && (
            <button onClick={onConfirm} style={{ flex:2, height:48, border:'none', borderRadius:6, background:'#e8e8e8', color: confirmColor ?? '#1B6EF3', fontWeight:700, fontSize:15, cursor:'pointer', boxShadow:'3px 3px 6px #c5c5c5, -3px -3px 6px #ffffff' }}>
              {confirmLabel}
            </button>
          )}
        </div>
      </div>
    </>
  )
}

/* ── 폭죽 컴포넌트 ── */
function Fireworks() {
  const colors = ['#FFCD00','#1B6EF3','#FF4B4B','#4ECDC4','#FF9F43','#A29BFE','#55EFC4','#FD79A8','#fff']
  const cx = 50   // 화면 중앙 %
  const cy = 50

  // 파티클: 사방으로 퍼지는 선 + 별 조각
  const particles = Array.from({ length: 72 }, (_, i) => {
    const angle   = (i / 72) * 360
    const dist    = 80 + Math.random() * 120   // px
    const rad     = (angle * Math.PI) / 180
    const tx      = Math.cos(rad) * dist
    const ty      = Math.sin(rad) * dist
    const color   = colors[Math.floor(Math.random() * colors.length)]
    const delay   = Math.random() * 0.3
    const dur     = 0.8 + Math.random() * 0.6
    const size    = 4 + Math.random() * 6
    const isRect  = i % 3 !== 0
    return { tx, ty, color, delay, dur, size, isRect, angle }
  })

  // 2차 폭발 (약간 지연)
  const burst2 = Array.from({ length: 48 }, (_, i) => {
    const angle   = (i / 48) * 360 + 15
    const dist    = 50 + Math.random() * 90
    const rad     = (angle * Math.PI) / 180
    const tx      = Math.cos(rad) * dist
    const ty      = Math.sin(rad) * dist
    const color   = colors[Math.floor(Math.random() * colors.length)]
    const delay   = 0.35 + Math.random() * 0.25
    const dur     = 0.7 + Math.random() * 0.5
    const size    = 3 + Math.random() * 5
    return { tx, ty, color, delay, dur, size }
  })

  return (
    <div style={{ position:'fixed', inset:0, zIndex:999, pointerEvents:'none', overflow:'hidden' }}>
      {/* 1차 폭발 */}
      {particles.map((p, i) => (
        <div key={i} style={{
          position:'absolute',
          left:`${cx}%`, top:`${cy}%`,
          width: p.isRect ? p.size * 0.5 : p.size,
          height: p.isRect ? p.size * 2 : p.size,
          borderRadius: p.isRect ? 2 : '50%',
          background: p.color,
          // @ts-ignore
          '--tx': `${p.tx}px`,
          '--ty': `${p.ty}px`,
          '--r': `${p.angle}deg`,
          animation: `fwBurst ${p.dur}s ease-out ${p.delay}s both`,
          boxShadow: `0 0 ${p.size}px ${p.color}`,
        }} />
      ))}
      {/* 2차 폭발 */}
      {burst2.map((p, i) => (
        <div key={`b${i}`} style={{
          position:'absolute',
          left:`${cx}%`, top:`${cy}%`,
          width: p.size, height: p.size,
          borderRadius:'50%',
          background: p.color,
          // @ts-ignore
          '--tx': `${p.tx}px`,
          '--ty': `${p.ty}px`,
          '--r': '0deg',
          animation: `fwBurst ${p.dur}s ease-out ${p.delay}s both`,
        }} />
      ))}
      {/* 중앙 플래시 */}
      <div style={{
        position:'absolute', left:`${cx}%`, top:`${cy}%`,
        transform:'translate(-50%,-50%)',
        width:60, height:60, borderRadius:'50%',
        background:'radial-gradient(circle, rgba(255,205,0,0.9) 0%, transparent 70%)',
        animation:'fwBurst 0.5s ease-out 0s both',
        // @ts-ignore
        '--tx':'0px', '--ty':'0px', '--r':'0deg',
      }} />
    </div>
  )
}
