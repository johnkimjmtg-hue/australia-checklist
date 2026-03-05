import { useState, useRef } from 'react'
import { CATEGORIES, ITEMS, CheckItem } from '../data/checklist'
import {
  AppState, TripInfo,
  toggleItem, setSchedule, setCategory, addCustom,
  issueReceipt, resetAll, saveTrip, loadTrip, clearTrip,
  fmt, getTripDays, fmtMD, dow,
} from '../store/state'
import ScheduleSheet from '../components/ScheduleSheet'
import ReceiptModal from '../components/ReceiptModal'

const CAT_ROW1 = ['hospital','food','shopping','admin']
const CAT_ROW2 = ['people','parenting','places','schedule']
const CAT_ROW3 = ['custom']

type Props = { state: AppState; setState: (s: AppState) => void }
type Modal = 'none' | 'noTrip' | 'noDate' | 'noSchedule' | 'confirmReset' | 'tripPicker'
type MainTab = 'bucketlist' | 'services'

export default function ChecklistPage({ state, setState }: Props) {
  const [trip, setTrip]               = useState<TripInfo|null>(() => loadTrip())
  const [modal, setModal]             = useState<Modal>('none')
  const [sheetItem, setSheetItem]     = useState<CheckItem|null>(null)
  const [showReceipt, setShowReceipt] = useState(false)
  const [issuedAt, setIssuedAt]       = useState('')
  const [shakeBtn, setShakeBtn]       = useState(false)
  const [customLabel, setCustomLabel] = useState('')
  const [mainTab, setMainTab]         = useState<MainTab>('bucketlist')
  const [showScheduleView, setShowScheduleView] = useState(false)
  // date picker state
  const [pickerStep, setPickerStep]   = useState<'start'|'end'>('start')
  const [startDate, setStartDate]     = useState(trip?.startDate ?? '')
  const [endDate, setEndDate]         = useState(trip?.endDate ?? '')
  const inputRef = useRef<HTMLInputElement>(null)

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

  const handleDateSelect = (val: string) => {
    if (pickerStep === 'start') {
      setStartDate(val)
      setPickerStep('end')
    } else {
      setEndDate(val)
      const t = { startDate, endDate: val }
      saveTrip(t); setTrip(t)
      setModal('none')
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
    setIssuedAt(at); setState(issueReceipt(state, at)); setShowReceipt(true)
  }

  const triggerShake = () => { setShakeBtn(true); setTimeout(() => setShakeBtn(false), 600) }

  const handleAddCustom = () => {
    const label = customLabel.trim(); if (!label) return
    setState(addCustom(state, label, activeCategory)); setCustomLabel('')
  }

  const doReset = () => {
    setState(resetAll()); setTrip(null); setStartDate(''); setEndDate('')
    setShowReceipt(false); setModal('none')
  }

  return (
    <div style={{ minHeight:'100vh', background:'#F4F7FB', display:'flex', flexDirection:'column',
      fontFamily:'-apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif',
      paddingLeft:'5mm', paddingRight:'5mm', boxSizing:'border-box' }}>

      {/* ── MAIN TABS (견출지) ── */}
      <div style={{ background:'#fff', borderBottom:'1.5px solid rgba(30,77,131,0.10)', position:'sticky', top:0, zIndex:30 }}>

        {/* Title row */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px 0' }}>
          <span style={{ fontSize:11, color:'#8AAAC8', fontWeight:600, letterSpacing:1.5 }}>HOJUGAJA</span>
          <span style={{ fontSize:11, color:'#8AAAC8', fontWeight:600 }}>{done}/{total}</span>
        </div>

        {/* Tab row */}
        <div style={{ display:'flex', gap:0, padding:'0 14px' }}>
          {(['bucketlist','services'] as MainTab[]).map(tab => (
            <button key={tab} onClick={() => setMainTab(tab)} style={{
              flex:1, height:38, border:'none', background:'transparent', cursor:'pointer',
              fontSize:13, fontWeight:700, position:'relative',
              color: mainTab===tab ? '#1E4D83' : '#8AAAC8',
              transition:'color .15s',
            }}>
              {tab==='bucketlist' ? '버킷리스트' : '업체/서비스 찾기'}
              {mainTab===tab && (
                <span style={{ position:'absolute', bottom:0, left:'10%', right:'10%', height:2, background:'#1E4D83', borderRadius:'2px 2px 0 0', display:'block' }}/>
              )}
            </button>
          ))}
        </div>
      </div>

      {mainTab === 'services' ? (
        <EmptyServices />
      ) : (
        <>
          {/* ── SUB HEADER ── */}
          <div style={{ background:'#fff', borderBottom:'1px solid rgba(30,77,131,0.08)', position:'sticky', top:49, zIndex:29 }}>

            {/* Counter row */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 14px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ fontSize:13, fontWeight:700, color: done>0 ? '#1E4D83' : '#8AAAC8' }}>
                  {done>0 ? `${done}개 선택됨` : '항목을 선택하세요'}
                </span>
                {unscheduledCount>0 && (
                  <span style={{ fontSize:10, color:'#E67E00', fontWeight:700,
                    background:'rgba(230,126,0,0.10)', padding:'1px 6px', borderRadius:99 }}>
                    {unscheduledCount}개 미지정
                  </span>
                )}
              </div>
              <div style={{ display:'flex', gap:6 }}>
                {/* 여행시작하기 */}
                <button onClick={handleOpenTripPicker} style={{
                  height:30, padding:'0 10px', borderRadius:8,
                  border:'1px solid', cursor:'pointer',
                  borderColor: tripLabel ? '#1E4D83' : '#E67E00',
                  background: tripLabel ? '#1E4D83' : '#E67E00',
                  color: '#fff',
                  fontSize:11, fontWeight:700,
                  animation: tripLabel ? 'none' : 'pulse 1.4s ease-in-out infinite',
                }}>
                  {tripLabel ? `📅 ${tripLabel}` : '🗓 여행시작하기'}
                </button>
                {/* 버킷리스트 보기 */}
                <button onClick={() => setShowScheduleView(v=>!v)} style={{
                  height:30, padding:'0 10px', borderRadius:8,
                  border:'1px solid rgba(30,77,131,0.2)', cursor:'pointer',
                  background: showScheduleView ? 'rgba(30,77,131,0.08)' : '#fff',
                  color:'#1E4D83', fontSize:11, fontWeight:700,
                }}>📋 버킷리스트</button>
              </div>
            </div>

            {/* Schedule grid view */}
            {showScheduleView && trip && (
              <ScheduleGrid state={state} trip={trip} allItems={allItems} />
            )}

            {/* Category chips */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:5, padding:'6px 12px 4px' }}>
              {[...CAT_ROW1, ...CAT_ROW2].map(catId => {
                const cat = CATEGORIES.find(c => c.id === catId)
                if (!cat) return null
                const isActive = activeCategory === catId
                const catDone  = allItems.filter(i => i.categoryId===catId && state.selected[i.id]).length
                const catUnsch = allItems.filter(i => i.categoryId===catId && state.selected[i.id] && !(state.schedules[i.id]?.length)).length
                return (
                  <button key={catId} onClick={() => setState(setCategory(state, catId))} style={{
                    height:32, borderRadius:8, border:'1px solid',
                    borderColor: isActive ? '#1E4D83' : 'rgba(30,77,131,0.12)',
                    background: isActive ? '#1E4D83' : '#fff',
                    color: isActive ? '#fff' : '#5A7090',
                    fontSize:11, fontWeight:700, cursor:'pointer',
                    position:'relative', transition:'all .12s',
                    boxShadow: isActive ? '0 2px 8px rgba(30,77,131,0.2)' : 'none',
                  }}>
                    {cat.label}
                    {catDone>0 && (
                      <span style={{
                        position:'absolute', top:-4, right:-3,
                        background: catUnsch>0 ? '#E67E00' : '#1E4D83',
                        color:'#fff', borderRadius:99, fontSize:9, fontWeight:800,
                        minWidth:14, height:14, display:'flex', alignItems:'center', justifyContent:'center', padding:'0 2px',
                      }}>{catDone}</span>
                    )}
                  </button>
                )
              })}
            </div>
            {/* 직접입력 카테고리 */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:5, padding:'0 12px 8px' }}>
              {(() => {
                const cat = CATEGORIES.find(c => c.id === 'custom')!
                const isActive = activeCategory === 'custom'
                const catDone  = allItems.filter(i => i.categoryId==='custom' && state.selected[i.id]).length
                const catUnsch = allItems.filter(i => i.categoryId==='custom' && state.selected[i.id] && !(state.schedules[i.id]?.length)).length
                return (
                  <button onClick={() => setState(setCategory(state, 'custom'))} style={{
                    height:32, borderRadius:8, border:'1px solid',
                    borderColor: isActive ? '#1E4D83' : 'rgba(30,77,131,0.12)',
                    background: isActive ? '#1E4D83' : '#fff',
                    color: isActive ? '#fff' : '#5A7090',
                    fontSize:11, fontWeight:700, cursor:'pointer',
                    position:'relative', transition:'all .12s',
                    boxShadow: isActive ? '0 2px 8px rgba(30,77,131,0.2)' : 'none',
                  }}>
                    ✏️ {cat.label}
                    {catDone>0 && (
                      <span style={{
                        position:'absolute', top:-4, right:-3,
                        background: catUnsch>0 ? '#E67E00' : '#1E4D83',
                        color:'#fff', borderRadius:99, fontSize:9, fontWeight:800,
                        minWidth:14, height:14, display:'flex', alignItems:'center', justifyContent:'center', padding:'0 2px',
                      }}>{catDone}</span>
                    )}
                  </button>
                )
              })()}
            </div>
          </div>

          {/* ── LIST ── */}
          <div style={{ flex:1, overflowY:'auto', paddingBottom:90 }}>

            {/* Section label */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 14px 4px' }}>
              <span style={{ fontSize:11, color:'#8AAAC8', fontWeight:700, letterSpacing:0.5 }}>
                {CATEGORIES.find(c=>c.id===activeCategory)?.receiptLabel}
              </span>
              <span style={{ fontSize:11, color:'#1E4D83', fontWeight:800 }}>
                {catItems.filter(i=>state.selected[i.id]).length}/{catItems.length}
              </span>
            </div>

            {/* Custom add - 직접입력 카테고리일 때만 표시 */}
            {activeCategory === 'custom' && (
            <div style={{ display:'flex', gap:6, padding:'0 12px 6px', alignItems:'center' }}>
              <div style={{
                flex:1, display:'flex', alignItems:'center', gap:6,
                background:'#fff', borderRadius:8, padding:'0 10px',
                border:'1px solid rgba(30,77,131,0.12)', height:34,
                boxShadow:'0 1px 4px rgba(30,77,131,0.05)',
              }}>
                <span style={{ color:'#1E4D83', fontWeight:800, fontSize:15 }}>+</span>
                <input ref={inputRef} value={customLabel}
                  onChange={e => setCustomLabel(e.target.value)}
                  onKeyDown={e => e.key==='Enter' && handleAddCustom()}
                  placeholder="직접 추가"
                  style={{ flex:1, border:'none', outline:'none', fontSize:12, color:'#333', background:'transparent' }}
                />
              </div>
              <button onClick={handleAddCustom} style={{
                height:34, padding:'0 12px', background:'#1E4D83', color:'#fff',
                border:'none', borderRadius:8, fontWeight:700, fontSize:12, cursor:'pointer',
              }}>추가</button>
            </div>
            )}

            {/* Items list */}
            <div style={{ background:'#fff', borderTop:'1px solid rgba(30,77,131,0.07)', borderBottom:'1px solid rgba(30,77,131,0.07)' }}>
              {catItems.map(item => {
                const checked  = !!state.selected[item.id]
                const dayCount = (state.schedules[item.id] ?? []).length
                const needsSch = checked && dayCount===0
                return (
                  <div key={item.id} style={{
                    display:'flex', alignItems:'center', gap:8, padding:'9px 14px',
                    borderBottom:'1px solid rgba(30,77,131,0.05)',
                    background: needsSch ? 'rgba(230,126,0,0.03)' : checked ? 'rgba(30,77,131,0.025)' : '#fff',
                    minHeight:44,
                  }}>
                    {/* Checkbox */}
                    <button onClick={() => {
                      if (!trip) { setModal('tripPicker'); return }
                      setState(toggleItem(state, item.id))
                    }} style={{
                      width:20, height:20, borderRadius:6, flexShrink:0,
                      border: checked ? 'none' : '1.5px solid rgba(30,77,131,0.25)',
                      background: checked ? '#1E4D83' : '#fff',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      transition:'all .12s', cursor:'pointer',
                      boxShadow: checked ? '0 2px 6px rgba(30,77,131,0.25)' : 'none',
                    }}>
                      {checked && (
                        <svg width="10" height="7" viewBox="0 0 10 7" fill="none">
                          <path d="M1 3.5L3.5 6L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>

                    <span style={{ fontSize:15, opacity: checked ? 1 : 0.4, flexShrink:0 }}>{item.emoji}</span>

                    <span onClick={() => {
                      if (!trip) { setModal('tripPicker'); return }
                      setState(toggleItem(state, item.id))
                    }} style={{
                      flex:1, fontSize:13, fontWeight: checked ? 600 : 400,
                      color: checked ? '#1E4D83' : '#3A4A5C', cursor:'pointer',
                    }}>{item.label}</span>

                    {/* Schedule button */}
                    <button onClick={() => {
                      if (!checked) return
                      if (!trip) { setModal('noTrip'); return }
                      setSheetItem(item as CheckItem)
                    }} style={{
                      height:24, padding:'0 8px', borderRadius:99, fontSize:10, fontWeight:700,
                      cursor: checked ? 'pointer' : 'default', flexShrink:0,
                      border: !checked ? '1px solid rgba(30,77,131,0.10)'
                            : dayCount>0 ? 'none'
                            : '1px solid #E67E00',
                      background: !checked ? 'transparent'
                                : dayCount>0 ? '#1E4D83'
                                : '#fff',
                      color: !checked ? '#C0CCD8'
                           : dayCount>0 ? '#fff'
                           : '#E67E00',
                      boxShadow: checked && dayCount>0 ? '0 2px 6px rgba(30,77,131,0.2)' : 'none',
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
            zIndex:20,
          }}>
            {unscheduledCount>0 && done>0 && (
              <div style={{ fontSize:10, color:'#E67E00', textAlign:'center', marginBottom:4, fontWeight:700 }}>
                ⚠️ {unscheduledCount}개 항목에 날짜를 지정해주세요
              </div>
            )}
            <button onClick={handleIssue} style={{
              width:'100%', height:48,
              background:'linear-gradient(160deg,#3A7FCC,#1E4D83)', color:'#fff',
              border:'none', borderRadius:12, fontSize:14, fontWeight:800, cursor:'pointer',
              animation: shakeBtn ? 'shake 0.5s ease' : 'none',
              boxShadow:'0 4px 16px rgba(30,77,131,0.28)',
            }}>버킷리스트 발행하기</button>
            <div style={{ fontSize:10, color:'#8AAAC8', textAlign:'center', marginTop:5 }}>
              선택한 항목들로 버킷리스트를 만들어요
            </div>
          </div>
        </>
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
          confirmLabel="날짜 입력하기" onConfirm={() => { setModal('none'); setTimeout(handleOpenTripPicker, 100) }} onCancel={() => setModal('none')} />
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
          onSelect={days => setState(setSchedule(state, sheetItem.id, days))}
          onClose={() => setSheetItem(null)} />
      )}

      {showReceipt && trip && (
        <ReceiptModal state={state} trip={trip} issuedAt={issuedAt}
          onClose={() => setShowReceipt(false)} onReset={() => setModal('confirmReset')} />
      )}
    </div>
  )
}

/* ── Schedule Grid View ── */
function ScheduleGrid({ state, trip, allItems }: { state: AppState; trip: TripInfo; allItems: any[] }) {
  const days = getTripDays(trip)
  const [activeDayIdx, setActiveDayIdx] = useState(0)

  const dayItems = allItems.filter(item =>
    state.selected[item.id] && (state.schedules[item.id] ?? []).includes(activeDayIdx)
  )

  return (
    <div style={{ borderTop:'1px solid rgba(30,77,131,0.08)', padding:'8px 12px 10px', background:'#F8FAFD' }}>
      {/* Day tabs - 5 per row */}
      <div style={{ display:'flex', gap:4, overflowX:'auto', paddingBottom:4 }}>
        {days.map((d, idx) => {
          const hasDot = allItems.some(item => state.selected[item.id] && (state.schedules[item.id] ?? []).includes(idx))
          return (
            <button key={idx} onClick={() => setActiveDayIdx(idx)} style={{
              minWidth:54, height:46, borderRadius:8, flexShrink:0,
              border:'1px solid', cursor:'pointer',
              borderColor: activeDayIdx===idx ? '#1E4D83' : 'rgba(30,77,131,0.12)',
              background: activeDayIdx===idx ? '#1E4D83' : '#fff',
              color: activeDayIdx===idx ? '#fff' : '#5A7090',
              fontSize:11, fontWeight:700, position:'relative', textAlign:'center',
              lineHeight:1.3, padding:'4px 2px',
            }}>
              <div>{idx+1}일차</div>
              <div style={{ fontSize:10, opacity:0.8 }}>{fmtMD(d)}</div>
              {hasDot && (
                <span style={{
                  position:'absolute', top:3, right:3, width:5, height:5,
                  borderRadius:'50%', background: activeDayIdx===idx ? '#fff' : '#1E4D83',
                }}/>
              )}
            </button>
          )
        })}
      </div>
      {/* Items for selected day */}
      <div style={{ marginTop:6, minHeight:30 }}>
        {dayItems.length === 0 ? (
          <p style={{ fontSize:11, color:'#8AAAC8', textAlign:'center', padding:'6px 0' }}>각 항목의 "+일정" 버튼으로 추가하세요</p>
        ) : (
          <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
            {dayItems.map(item => (
              <span key={item.id} style={{
                background:'rgba(30,77,131,0.08)', borderRadius:6,
                padding:'3px 8px', fontSize:11, color:'#1E4D83', fontWeight:600,
              }}>{item.emoji} {item.label}</span>
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
              background: isSelected ? '#1E4D83' : 'transparent',
              color: isDisabled ? '#C8D4E4'
                : isSelected ? '#fff'
                : dayOfWeek === 0 ? '#E05050'
                : dayOfWeek === 6 ? '#4477CC'
                : '#2A3A4C',
              fontSize: 13, fontWeight: isSelected || isToday ? 800 : 500,
              border: isToday && !isSelected ? '1.5px solid #1E4D83' : '1.5px solid transparent',
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
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(10,20,40,0.5)', zIndex: 500, animation: 'fadeIn 0.2s ease' }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 'calc(100% - 32px)', maxWidth: 340,
        background: '#fff', borderRadius: 20, padding: '20px 16px 16px',
        zIndex: 501, boxShadow: '0 16px 40px rgba(30,77,131,0.18)',
        animation: 'scaleIn 0.2s ease',
        transformOrigin: 'center center',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        {/* 헤더 */}
        <div style={{ textAlign: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: '#8AAAC8', fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>
            {isStart ? 'STEP 1 / 2' : 'STEP 2 / 2'}
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#1E4D83' }}>
            {isStart ? '✈️ 출발일을 선택해주세요' : '🏠 도착일을 선택해주세요'}
          </div>
          {!isStart && startDate && (
            <div style={{ fontSize: 11, color: '#8AAAC8', marginTop: 3 }}>출발일: {startDate}</div>
          )}
        </div>

        {/* 월 네비게이션 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <button onClick={prevMonth} style={{
            width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(30,77,131,0.15)',
            background: '#F4F7FB', cursor: 'pointer', fontSize: 14, color: '#1E4D83', fontWeight: 800,
          }}>‹</button>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#1E4D83' }}>{year}년 {month}월</div>
          <button onClick={nextMonth} style={{
            width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(30,77,131,0.15)',
            background: '#F4F7FB', cursor: 'pointer', fontSize: 14, color: '#1E4D83', fontWeight: 800,
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
          marginTop: 12, padding: '10px 14px', borderRadius: 10,
          background: selected ? 'rgba(30,77,131,0.06)' : '#F4F7FB',
          textAlign: 'center', fontSize: 13, fontWeight: 700,
          color: selected ? '#1E4D83' : '#B0BECC',
          border: selected ? '1.5px solid rgba(30,77,131,0.15)' : '1.5px solid transparent',
        }}>
          {selected ? `📅 ${selected}` : '날짜를 선택해주세요'}
        </div>

        {/* 확인 버튼 */}
        <button onClick={() => selected && onSelect(selected)} style={{
          width: '100%', height: 46, borderRadius: 12, border: 'none', cursor: selected ? 'pointer' : 'default',
          background: selected ? 'linear-gradient(160deg,#3A7FCC,#1E4D83)' : '#E8EDF5',
          color: selected ? '#fff' : '#8AAAC8', fontSize: 14, fontWeight: 800,
          marginTop: 10, marginBottom: 4,
          boxShadow: selected ? '0 4px 14px rgba(30,77,131,0.25)' : 'none',
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
function AlertModal({ title, message, confirmLabel, confirmColor, onConfirm, onCancel, hideCancel }:
  { title:string; message?:string; confirmLabel:string; confirmColor?:string; onConfirm:()=>void; onCancel:()=>void; hideCancel?:boolean }) {
  return (
    <>
      <div onClick={onCancel} style={{ position:'fixed', inset:0, background:'rgba(10,20,40,0.45)', zIndex:600, animation:'fadeIn 0.2s ease' }}/>
      <div style={{
        position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
        background:'#fff', borderRadius:20, padding:'24px 20px',
        zIndex:601, width:'calc(100% - 48px)', maxWidth:300, textAlign:'center',
        animation:'scaleIn 0.22s ease',
        transformOrigin:'center center',
        boxShadow:'0 16px 40px rgba(30,77,131,0.15)',
        border:'1px solid rgba(30,77,131,0.08)',
      }}>
        <p style={{ fontSize:14, fontWeight:800, color:'#0F1B2D', marginBottom: message ? 8 : 20, lineHeight:1.5 }}>{title}</p>
        {message && <p style={{ fontSize:12, color:'#5A7090', marginBottom:20, lineHeight:1.6 }}>{message}</p>}
        <div style={{ display:'flex', gap:8 }}>
          {!hideCancel && (
            <button onClick={onCancel} style={{ flex:1, height:42, border:'1px solid rgba(30,77,131,0.15)', borderRadius:10, background:'#fff', color:'#5A7090', fontWeight:700, fontSize:13, cursor:'pointer' }}>취소</button>
          )}
          <button onClick={onConfirm} style={{ flex:2, height:42, border:'none', borderRadius:10, background: confirmColor ?? '#1E4D83', color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer' }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </>
  )
}
