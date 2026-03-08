import { useState, useRef, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { CATEGORIES, ITEMS, CheckItem, ITEM_ICONS } from '../data/checklist'
import {
  AppState, TripInfo,
  toggleItem, setSchedule, setCategory, addCustom,
  issueReceipt, resetAll, saveTrip, loadTrip, clearTrip,
  fmt, getTripDays, fmtMD, dow,
} from '../store/state'
import ScheduleSheet from '../components/ScheduleSheet'
import ReceiptModal from '../components/ReceiptModal'
import Services from './Services'
import BucketCheckView from './BucketCheckView'

const CAT_ICON_MAP: Record<string,string> = {
  hospital:'ph:first-aid-kit',food:'ph:fork-knife',shopping:'ph:shopping-bag',
  admin:'ph:files',people:'ph:users',parenting:'ph:baby',places:'ph:map-pin',
  schedule:'ph:calendar',custom:'ph:star',
}

type Props = { state: AppState; setState: (s: AppState) => void }
type Modal = 'none' | 'noTrip' | 'noDate' | 'noSchedule' | 'confirmReset' | 'tripPicker'
type MainTab = 'bucketlist' | 'services'

export default function ChecklistPage({ state, setState }: Props) {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [trip, setTrip]               = useState<TripInfo|null>(() => loadTrip())
  const [modal, setModal]             = useState<Modal>('none')
  const [sheetItem, setSheetItem]     = useState<CheckItem|null>(null)
  const [showReceipt, setShowReceipt] = useState(false)
  const [achieved, setAchieved]       = useState<Record<string,boolean>>(() => { try { return JSON.parse(localStorage.getItem('bucket-achieved') ?? '{}') } catch { return {} } })
  const [issuedAt, setIssuedAt]       = useState('')
  const [shakeBtn, setShakeBtn]       = useState(false)
  const [customLabel, setCustomLabel] = useState('')
  const [mainTab, setMainTab]         = useState<MainTab>(
    searchParams.get('tab') === 'services' ? 'services' : 'bucketlist'
  )
  const [showScheduleView, setShowScheduleView] = useState(!!trip)
  const [scheduleSelectedItem, setScheduleSelectedItem] = useState<string|null>(null)
  const [scrollTrigger, setScrollTrigger] = useState(0)
  const [logoTapCount, setLogoTapCount] = useState(0)
  const logoTapTimer = useRef<any>(null)
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

  const activeCategory = state.meta.activeCategory
  const allItems = [...ITEMS, ...state.customItems.map(c => ({ ...c, emoji:'📝' }))]
  const catItems = allItems.filter(i => i.categoryId === activeCategory)
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
  const [toast, setToast] = useState<string|null>(null)
  const toastTimer = useRef<any>(null)

  const TOASTS = [
    '좋은 선택이에요 ✨',
    '호주에서 꼭 해봐요 🦘',
    '기대되는데요! 🎯',
    '완료! 리스트에 추가됐어요 🎉',
    '오 이거 꼭 해야해! 👍',
    '완벽한 선택 🌟',
    '호주 여행이 기대돼요 ✈️',
    '좋아요, 잊지 마세요! 📌',
    '이거 진짜 꿀이에요 🍯',
    '후회 없을 거예요 😎',
    '현지인도 추천해요 🙌',
    '이건 필수 중의 필수! 💯',
    '가면 무조건 해야 해요 🔥',
    '나중에 감사할 거예요 😄',
    '한국 가서 자랑할 수 있어요 🏆',
    '이거 빼면 서운하죠 😅',
    '추억 제대로 만들어봐요 📸',
    '역시 안목이 있으시네요 👀',
    '완벽한 호주 여행 준비 중 🌏',
    '한 발짝 더 가까워졌어요 🚀',
    '호주 고수의 선택! 🦅',
    '이 정도면 현지인이죠 😂',
    '시드니가 기다리고 있어요 🌉',
    '잊으면 진짜 후회해요 😤',
    '이건 무조건 체크! ✅',
  ]

  const showToast = () => {
    const msg = TOASTS[Math.floor(Math.random() * TOASTS.length)]
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2000)
  }

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
          onAchievedChange={setAchieved}
          onEdit={() => {
            setShowReceipt(false)
            const next = { ...state, meta: { ...state.meta, lastIssuedAt: undefined } }
            setState(next)
            try { localStorage.setItem('korea-receipt', JSON.stringify(next)) } catch {}
          }}
          onDelete={doReset}
          onShare={() => {
            const at = state.meta.lastIssuedAt ?? issuedAt
            setIssuedAt(at)
            setShowReceipt(true)
          }}
          onServices={() => setMainTab('services')}
        />
        {showReceipt && trip && (
          <ReceiptModal state={state} trip={trip} issuedAt={issuedAt}
            achieved={achieved}
            onClose={() => setShowReceipt(false)} onReset={() => { setShowReceipt(false); doReset() }} />
        )}
      </>
    )
  }

  return (
    <div style={{ minHeight:'100vh', background:'#F1F5F9',
      fontFamily:'"Pretendard",-apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif',
      boxSizing:'border-box' }}>

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
      `}</style>

      {/* ── 헤더 + 탭 ── */}
      <div style={{ background:'#fff', borderBottom:'1px solid #E2E8F0' }}>
        {/* 브랜드 + 카운터 */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px 0' }}>
          <span onClick={handleLogoTap}
            style={{ fontSize:13, color:'#003594', fontWeight:800, letterSpacing:2, cursor:'pointer', userSelect:'none' }}
          >HOJUGAJA</span>
          <span style={{ fontSize:13, color:'#64748B', fontWeight:600 }}>{done}/{total}</span>
        </div>
        {/* 탭 */}
        <div style={{ display:'flex', padding:'8px 20px 0', gap:4 }}>
          {(['bucketlist','services'] as MainTab[]).map(tab => (
            <button key={tab} className="tab-btn" onClick={() => setMainTab(tab)} style={{
              flex:1, height:38, border:'none', cursor:'pointer',
              borderRadius:'6px 6px 0 0',
              fontSize:14, fontWeight: mainTab===tab ? 700 : 500,
              color: mainTab===tab ? '#fff' : '#94A3B8',
              background: mainTab===tab ? '#003594' : 'transparent',
              borderBottom: mainTab===tab ? '2px solid #003594' : '2px solid transparent',
            }}>
              {tab==='bucketlist' ? '버킷리스트' : '업체/서비스 찾기'}
            </button>
          ))}
        </div>
      </div>

      {mainTab === 'services' ? (
        <Services onSelectBusiness={() => {}} onBack={() => setMainTab('bucketlist')} />
      ) : (
        <>
          {/* ── SUB HEADER (버튼들) — 스크롤 시 사라짐 ── */}
          <div style={{ background:'#fff', borderBottom:'1px solid #E2E8F0' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 20px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:14, fontWeight:700, color: done>0 ? '#003594' : '#94A3B8' }}>
                  {done>0 ? `${done}개 선택됨` : (trip ? '항목을 선택하세요' : '여행 일정을 설정하세요')}
                </span>
                {unscheduledCount>0 && (
                  <span style={{ fontSize:11, color:'#92620a', fontWeight:700,
                    background:'rgba(255,205,0,0.20)', padding:'2px 8px', borderRadius:4 }}>
                    {unscheduledCount}개 미지정
                  </span>
                )}
              </div>
              <div style={{ display:'flex', gap:6 }}>
                <button onClick={handleOpenTripPicker} style={{
                  height:34, padding:'0 14px', borderRadius:8, border:'none',
                  background: tripLabel ? '#16A34A' : '#fff',
                  color: tripLabel ? '#fff' : '#1E293B',
                  fontSize:13, fontWeight:800, cursor:'pointer',
                  display:'flex', alignItems:'center', gap:5,
                  boxShadow: tripLabel ? '0 2px 8px rgba(22,163,74,0.30)' : '0 2px 6px rgba(0,0,0,0.10)',
                  animation: !tripLabel ? 'pulse 1.4s ease-in-out infinite' : 'none',
                }}>
                  <Icon icon="ph:airplane-takeoff" width={15} height={15} color={tripLabel ? '#fff' : '#94A3B8'} />
                  {tripLabel ?? '여행일정 설정'}
                </button>
                <button onClick={() => setShowScheduleView(v=>!v)} style={{
                  height:34, padding:'0 14px', borderRadius:8, border:'none',
                  background: showScheduleView ? '#003594' : '#fff',
                  color: showScheduleView ? '#fff' : '#1E293B',
                  fontSize:13, fontWeight:800, cursor:'pointer',
                  display:'flex', alignItems:'center', gap:5,
                  boxShadow: showScheduleView ? '0 2px 8px rgba(0,53,148,0.25)' : '0 2px 6px rgba(0,0,0,0.10)',
                }}>
                  <Icon icon="ph:list-checks" width={15} height={15} color={showScheduleView ? '#FFCD00' : '#94A3B8'} />
                  일정보기
                </button>
              </div>
            </div>
          </div>

          {/* ── STICKY: 달력 + 카테고리 칩 ── */}
          <div style={{ background:'#fff', borderBottom:'1px solid #E2E8F0', position:'sticky', top:0, zIndex:24 }}>

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
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6, padding:'8px 16px 10px' }}>
                  {allCats.map(cat => {
                    const isActive = activeCategory === cat.id
                    const catDone  = allItems.filter(i => i.categoryId===cat.id && state.selected[i.id]).length
                    const catUnsch = allItems.filter(i => i.categoryId===cat.id && state.selected[i.id] && !(state.schedules[i.id]?.length)).length
                    const isCustom = cat.id === 'custom'
                    return (
                      <button key={cat.id} className="chip-btn" onClick={() => setState(setCategory(state, cat.id))} style={{
                        height:36, borderRadius:8, border:'none',
                        background: isActive ? '#003594' : '#fff',
                        color: isActive ? '#fff' : '#1E293B',
                        fontSize:12, fontWeight:700,
                        cursor:'pointer', position:'relative',
                        boxShadow: isActive ? '0 2px 8px rgba(0,53,148,0.25)' : '0 1px 4px rgba(0,0,0,0.08)',
                        display:'flex', alignItems:'center', justifyContent:'center', gap: isCustom ? 4 : 0,
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
              )
            })()}
          </div>



          {/* ── LIST ── */}
          <div style={{ paddingBottom:100 }}>
            {/* Section label */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 20px 8px' }}>
              <span style={{ fontSize:13, color:'#64748B', fontWeight:600 }}>
                {CATEGORIES.find(c=>c.id===activeCategory)?.receiptLabel}
              </span>
              <span style={{ fontSize:13, color:'#003594', fontWeight:700 }}>
                {catItems.filter(i=>state.selected[i.id]).length}/{catItems.length}
              </span>
            </div>

            {/* Custom add */}
            {activeCategory === 'custom' && (
              <div style={{ display:'flex', gap:6, padding:'0 16px 10px', alignItems:'center' }}>
                <div style={{
                  flex:1, display:'flex', alignItems:'center', gap:8,
                  background:'#fff', borderRadius:10, padding:'0 12px',
                  border:'1px solid #E2E8F0', height:44,
                  boxShadow:'0 2px 8px rgba(0,0,0,0.06)',
                }}>
                  <Icon icon="ph:plus-circle" width={18} height={18} color="#003594" />
                  <input ref={inputRef} value={customLabel}
                    onChange={e => setCustomLabel(e.target.value)}
                    onKeyDown={e => e.key==='Enter' && handleAddCustom()}
                    placeholder="직접 추가"
                    style={{ flex:1, border:'none', outline:'none', fontSize:15, color:'#1E293B', background:'transparent' }}
                  />
                </div>
                <button onClick={handleAddCustom} style={{
                  height:44, padding:'0 16px', background:'#003594', color:'#fff',
                  border:'none', borderRadius:10, fontWeight:700, fontSize:14, cursor:'pointer',
                  boxShadow:'0 2px 8px rgba(0,53,148,0.25)',
                }}>추가</button>
              </div>
            )}

            {/* Items list — card style */}
            <div style={{ display:'flex', flexDirection:'column', gap:8, padding:'0 16px 110px' }}>
              {catItems.map(item => {
                const checked  = !!state.selected[item.id]
                const dayCount = (state.schedules[item.id] ?? []).length
                const needsSch = checked && dayCount===0
                return (
                  <div key={item.id} style={{
                    display:'flex', alignItems:'center', gap:12,
                    padding:'12px 14px',
                    borderRadius:10,
                    background: checked && dayCount===0 ? '#fffbeb'
                              : checked ? '#fff8e4'
                              : '#fff',
                    boxShadow: checked
                      ? '0 2px 8px rgba(180,130,0,0.10)'
                      : '0 1px 4px rgba(0,0,0,0.05)',
                    minHeight:52, cursor:'pointer',
                    border: checked && dayCount===0 ? '1px solid rgba(255,205,0,0.4)' : 'none',
                    transition:'all 0.12s',
                  }}>
                    {/* Checkbox — 녹색 */}
                    <button onClick={() => {
                      if (!trip) { setModal('noTrip'); return }
                      if (!checked) showToast()
                      setState(toggleItem(state, item.id))
                    }} style={{
                      width:22, height:22, borderRadius:4, flexShrink:0,
                      border: checked ? 'none' : '1.5px solid #CBD5E1',
                      background: checked ? '#16A34A' : '#fff',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      cursor:'pointer', padding:0,
                    }}>
                      {checked && (
                        <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
                          <path d="M1 4L4 7L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>

                    {/* 단색 아이콘 */}
                    <Icon
                      icon={ITEM_ICONS[item.id] ?? CAT_ICON_MAP[(item as any).categoryId] ?? 'ph:star'}
                      width={20} height={20}
                      color={checked ? '#78716C' : '#CBD5E1'}
                    />

                    <span onClick={() => {
                      if (checked && showScheduleView) setScheduleSelectedItem(item.id)
                    }} style={{
                      flex:1, fontSize:15, fontWeight: checked ? 600 : 400,
                      color: checked ? '#1E293B' : '#64748B', cursor: checked && showScheduleView ? 'pointer' : 'default',
                      lineHeight:1.4,
                    }}>{item.label}</span>

                    {/* Schedule button */}
                    <button onClick={() => {
                      if (!checked) return
                      setSheetItem(item as CheckItem)
                    }} style={{
                      height:28, padding:'0 10px', borderRadius:6, fontSize:11, fontWeight:700,
                      cursor: checked ? 'pointer' : 'default', flexShrink:0,
                      border: 'none',
                      background: !checked        ? '#F1F5F9'
                                : dayCount>0      ? 'rgba(68,64,60,0.10)'
                                : '#FFCD00',
                      color: !checked        ? '#CBD5E1'
                           : dayCount>0      ? '#44403C'
                           : '#92620a',
                      boxShadow: checked && dayCount===0 ? '0 2px 6px rgba(255,205,0,0.4)' : 'none',
                    }}>
                      {dayCount>0 ? `${dayCount}일 ✓` : '+일정'}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Bottom CTA ── */}
          <div style={{
            position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)',
            width:'100%', maxWidth:390, padding:'8px 14px 20px',
            background:'transparent',
            zIndex:20, boxSizing:'border-box',
          }}>
            {unscheduledCount>0 && done>0 && (
              <div style={{ fontSize:11, color:'#92620a', textAlign:'center', marginBottom:6, fontWeight:700,
                background:'rgba(255,205,0,0.15)', borderRadius:6, padding:'5px 0' }}>
                ⚠️ {unscheduledCount}개 항목에 날짜를 지정해주세요
              </div>
            )}
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={handleIssue} style={{
                flex:4, height:54,
                background:'#003594', color:'#fff',
                border:'none', borderRadius:8, fontSize:15, fontWeight:700, cursor:'pointer',
                animation: shakeBtn ? 'shake 0.5s ease' : 'none',
                boxShadow:'0 10px 15px rgba(0,0,0,0.15)',
              }}>버킷리스트 발행하기</button>
              <button onClick={() => setModal('confirmReset')} style={{
                flex:2, height:54,
                background:'rgba(255,255,255,0.92)', color:'#64748B',
                border:'1px solid #E2E8F0', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer',
                backdropFilter:'blur(8px)',
              }}>↻ 초기화</button>
            </div>
            <div style={{ fontSize:11, color:'#94A3B8', textAlign:'center', marginTop:6, fontWeight:500 }}>
              선택한 항목들로 버킷리스트를 만들어요
            </div>
          </div>
        </>
      )}

      {/* ── 폭죽 ── */}
      {showFireworks && <Fireworks />}

      {/* ── 토스트 ── */}
      {toast && (
        <div style={{
          position:'fixed', top:72, left:'50%', transform:'translateX(-50%)',
          zIndex:998, pointerEvents:'none',
          background:'rgba(15,23,42,0.88)', backdropFilter:'blur(8px)',
          color:'#fff', fontSize:14, fontWeight:700,
          padding:'10px 20px', borderRadius:24,
          boxShadow:'0 4px 20px rgba(0,0,0,0.25)',
          whiteSpace:'nowrap',
          animation:'toastIn 0.25s ease both',
        }}>
          {toast}
        </div>
      )}

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
          achieved={achieved}
          onClose={() => setShowReceipt(false)} onReset={() => setModal('confirmReset')} />
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
    <div style={{ borderTop:'1px solid #E2E8F0', padding:'10px 16px 12px', background:'#F8FAFC' }}>
      <div ref={scrollRef} style={{ display:'flex', gap:6, overflowX:'auto', paddingBottom:4, scrollBehavior:'smooth' }}>
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
                border: isActive ? '2px solid #003594' : '2px solid transparent',
                cursor:'pointer',
                background: bg,
                color: isActive ? '#003594' : '#1E293B',
                fontSize:11, fontWeight:700, position:'relative', textAlign:'center',
                lineHeight:1.3, padding:'4px 2px',
                boxShadow: isActive ? '0 2px 8px rgba(0,53,148,0.20)' : '0 1px 3px rgba(0,0,0,0.06)',
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
                background:'rgba(0,53,148,0.08)', borderRadius:6,
                padding:'3px 9px', fontSize:11, color:'#003594', fontWeight:600,
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
              background: isSelected ? '#003594' : 'transparent',
              color: isDisabled ? '#C8D4E4'
                : isSelected ? '#fff'
                : dayOfWeek === 0 ? '#E05050'
                : dayOfWeek === 6 ? '#4477CC'
                : '#2A3A4C',
              fontSize: 13, fontWeight: isSelected || isToday ? 800 : 500,
              border: isToday && !isSelected ? '1.5px solid #003594' : '1.5px solid transparent',
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
        background: '#fff', borderRadius: 16, padding: '20px 20px 16px',
        zIndex: 501, boxShadow: '0 10px 15px rgba(0,0,0,0.10)',
        animation: 'scaleIn 0.2s ease',
        transformOrigin: 'center center',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        {/* 헤더 */}
        <div style={{ textAlign: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, letterSpacing: 1, marginBottom: 4 }}>
            {isStart ? 'STEP 1 / 2' : 'STEP 2 / 2'}
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#003594' }}>
            {isStart ? '✈️ 출발일을 선택해주세요' : '🏠 도착일을 선택해주세요'}
          </div>
          {!isStart && startDate && (
            <div style={{ fontSize: 11, color: '#8AAAC8', marginTop: 3 }}>출발일: {startDate}</div>
          )}
        </div>

        {/* 월 네비게이션 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <button onClick={prevMonth} style={{
            width: 32, height: 32, borderRadius: 6, border: '1px solid #E2E8F0',
            background: '#F1F5F9', cursor: 'pointer', fontSize: 14, color: '#003594', fontWeight: 800,
          }}>‹</button>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1E293B' }}>{year}년 {month}월</div>
          <button onClick={nextMonth} style={{
            width: 32, height: 32, borderRadius: 6, border: '1px solid #E2E8F0',
            background: '#F1F5F9', cursor: 'pointer', fontSize: 14, color: '#003594', fontWeight: 800,
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
          background: selected ? 'rgba(0,53,148,0.06)' : '#F1F5F9',
          textAlign: 'center', fontSize: 14, fontWeight: 600,
          color: selected ? '#003594' : '#94A3B8',
          border: selected ? '1px solid rgba(0,53,148,0.15)' : '1px solid transparent',
        }}>
          {selected ? `📅 ${selected}` : '날짜를 선택해주세요'}
        </div>

        <button onClick={() => selected && onSelect(selected)} style={{
          width: '100%', height: 54, borderRadius: 6, border: 'none', cursor: selected ? 'pointer' : 'default',
          background: selected ? '#003594' : '#E2E8F0',
          color: selected ? '#fff' : '#94A3B8', fontSize: 15, fontWeight: 700,
          marginTop: 10, marginBottom: 4,
          boxShadow: selected ? '0 10px 15px rgba(0,0,0,0.10)' : 'none',
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
        background:'#fff', borderRadius:16, padding:'24px 20px',
        zIndex:601, width:'calc(100% - 48px)', maxWidth:300, textAlign:'center',
        animation:'scaleIn 0.22s ease',
        transformOrigin:'center center',
        boxShadow:'0 10px 15px rgba(0,0,0,0.10)',
      }}>
        <p style={{ fontSize:16, fontWeight:700, color:'#1E293B', marginBottom: message ? 8 : 20, lineHeight:1.5 }}>{title}</p>
        {message && <p style={{ fontSize:14, color:'#64748B', marginBottom:20, lineHeight:1.6 }}>{message}</p>}
        <div style={{ display:'flex', gap:8 }}>
          {confirmFirst && (
            <button onClick={onConfirm} style={{ flex:2, height:48, border:'none', borderRadius:6, background: confirmColor ?? '#003594', color:'#fff', fontWeight:700, fontSize:15, cursor:'pointer' }}>
              {confirmLabel}
            </button>
          )}
          {!hideCancel && (
            <button onClick={onCancel} style={{ flex:1, height:48, border:'1px solid #E2E8F0', borderRadius:6, background:'#fff', color:'#64748B', fontWeight:600, fontSize:14, cursor:'pointer' }}>취소</button>
          )}
          {!confirmFirst && (
            <button onClick={onConfirm} style={{ flex:2, height:48, border:'none', borderRadius:6, background: confirmColor ?? '#003594', color:'#fff', fontWeight:700, fontSize:15, cursor:'pointer' }}>
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
  const colors = ['#FFCD00','#003594','#FF4B4B','#4ECDC4','#FF9F43','#A29BFE','#55EFC4','#FD79A8','#fff']
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
