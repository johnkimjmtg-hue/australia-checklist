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
      fontFamily:'-apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif' }}>

      {/* ── MAIN TABS (견출지) ── */}
      <div style={{ background:'#fff', borderBottom:'1.5px solid rgba(30,77,131,0.10)', position:'sticky', top:0, zIndex:30 }}>

        {/* Title row */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px 0' }}>
          <span style={{ fontSize:11, color:'#8AAAC8', fontWeight:600, letterSpacing:1.5 }}>HOOJUGAJA</span>
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
                  borderColor: tripLabel ? '#1E4D83' : 'rgba(30,77,131,0.2)',
                  background: tripLabel ? '#1E4D83' : '#fff',
                  color: tripLabel ? '#fff' : '#5A7090',
                  fontSize:11, fontWeight:700,
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
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:5, padding:'6px 12px 8px' }}>
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

            {/* Custom add */}
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
                    <button onClick={() => setState(toggleItem(state, item.id))} style={{
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

                    <span onClick={() => setState(toggleItem(state, item.id))} style={{
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
            background:'rgba(244,247,251,0.95)', backdropFilter:'blur(10px)',
            borderTop:'1px solid rgba(30,77,131,0.08)', zIndex:20,
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

/* ── Trip Picker Modal ── */
function TripPickerModal({ step, startDate, onSelect, onReset, onClose }:
  { step:'start'|'end'; startDate:string; onSelect:(v:string)=>void; onReset:()=>void; onClose:()=>void }) {
  const [y, setY] = useState('')
  const [m, setM] = useState('')
  const [d, setD] = useState('')
  const [err, setErr] = useState('')

  const isStart = step === 'start'

  const handleConfirm = () => {
    const yNum = parseInt(y), mNum = parseInt(m), dNum = parseInt(d)
    if (!y || !m || !d || isNaN(yNum) || isNaN(mNum) || isNaN(dNum)) {
      setErr('날짜를 모두 입력해주세요'); return
    }
    if (mNum < 1 || mNum > 12) { setErr('월은 1~12 사이로 입력해주세요'); return }
    if (dNum < 1 || dNum > 31) { setErr('일은 1~31 사이로 입력해주세요'); return }
    const pad = (n: number) => String(n).padStart(2,'0')
    const dateStr = `${yNum}-${pad(mNum)}-${pad(dNum)}`
    if (!isStart && startDate && dateStr < startDate) {
      setErr('도착일은 출발일 이후여야 해요'); return
    }
    setErr('')
    onSelect(dateStr)
  }

  const isValid = y.length>=4 && m.length>=1 && d.length>=1

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(10,20,40,0.5)', zIndex:500, animation:'fadeIn 0.2s ease' }}/>
      <div style={{
        position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
        width:'calc(100% - 40px)', maxWidth:320,
        background:'#fff', borderRadius:20, padding:'24px 20px 20px',
        zIndex:501, boxShadow:'0 16px 40px rgba(30,77,131,0.16)',
        animation:'scaleIn 0.2s ease',
      }}>
        <div style={{ textAlign:'center', marginBottom:20 }}>
          <div style={{ fontSize:11, color:'#8AAAC8', fontWeight:700, letterSpacing:1, marginBottom:6 }}>
            {isStart ? 'STEP 1 / 2' : 'STEP 2 / 2'}
          </div>
          <div style={{ fontSize:16, fontWeight:800, color:'#1E4D83' }}>
            {isStart ? '출발일을 입력해주세요' : '도착일을 입력해주세요'}
          </div>
          {!isStart && startDate && (
            <div style={{ fontSize:11, color:'#8AAAC8', marginTop:4 }}>출발일: {startDate}</div>
          )}
        </div>

        {/* 년 / 월 / 일 입력 */}
        <div style={{ display:'flex', gap:8, marginBottom:8 }}>
          <div style={{ flex:2 }}>
            <div style={{ fontSize:10, color:'#8AAAC8', fontWeight:700, marginBottom:4, textAlign:'center' }}>년</div>
            <input
              type="number" placeholder="2026"
              value={y} onChange={e => { setY(e.target.value); setErr('') }}
              style={{
                width:'100%', height:48, textAlign:'center', borderRadius:10,
                border:'1.5px solid rgba(30,77,131,0.2)', background:'#F4F7FB',
                fontSize:16, color:'#1E4D83', fontWeight:700, outline:'none',
                boxSizing:'border-box',
              }}
            />
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:10, color:'#8AAAC8', fontWeight:700, marginBottom:4, textAlign:'center' }}>월</div>
            <input
              type="number" placeholder="3"
              value={m} onChange={e => { setM(e.target.value); setErr('') }}
              style={{
                width:'100%', height:48, textAlign:'center', borderRadius:10,
                border:'1.5px solid rgba(30,77,131,0.2)', background:'#F4F7FB',
                fontSize:16, color:'#1E4D83', fontWeight:700, outline:'none',
                boxSizing:'border-box',
              }}
            />
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:10, color:'#8AAAC8', fontWeight:700, marginBottom:4, textAlign:'center' }}>일</div>
            <input
              type="number" placeholder="5"
              value={d} onChange={e => { setD(e.target.value); setErr('') }}
              style={{
                width:'100%', height:48, textAlign:'center', borderRadius:10,
                border:'1.5px solid rgba(30,77,131,0.2)', background:'#F4F7FB',
                fontSize:16, color:'#1E4D83', fontWeight:700, outline:'none',
                boxSizing:'border-box',
              }}
            />
          </div>
        </div>

        {/* 에러 메시지 */}
        {err && (
          <div style={{ fontSize:11, color:'#D93025', textAlign:'center', marginBottom:8, fontWeight:600 }}>
            ⚠️ {err}
          </div>
        )}

        <button onClick={handleConfirm} style={{
          width:'100%', height:46, borderRadius:12, border:'none', cursor:'pointer',
          background: isValid ? 'linear-gradient(160deg,#3A7FCC,#1E4D83)' : '#E8EDF5',
          color: isValid ? '#fff' : '#8AAAC8', fontSize:14, fontWeight:800, marginBottom:4,
          boxShadow: isValid ? '0 4px 14px rgba(30,77,131,0.25)' : 'none',
        }}>
          {isStart ? '다음 →' : '완료'}
        </button>
        <button onClick={onReset} style={{
          width:'100%', height:36, border:'none', background:'transparent',
          color:'#8AAAC8', fontSize:12, cursor:'pointer',
        }}>일정 초기화</button>
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
