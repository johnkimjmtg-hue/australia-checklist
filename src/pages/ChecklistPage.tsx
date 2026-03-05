import { useState, useRef } from 'react'
import { CATEGORIES, ITEMS, CheckItem } from '../data/checklist'
import {
  AppState, TripInfo,
  toggleItem, setSchedule, setCategory, addCustom,
  issueReceipt, resetAll, saveTrip, loadTrip, clearTrip,
  fmt, getTripDays,
} from '../store/state'
import ScheduleSheet from '../components/ScheduleSheet'
import ReceiptModal from '../components/ReceiptModal'

const CAT_ROW1 = ['hospital','food','shopping','admin']
const CAT_ROW2 = ['people','parenting','places','schedule']

type Props = { state: AppState; setState: (s: AppState) => void }

type Modal = 'none' | 'noTrip' | 'noDate' | 'noSchedule' | 'confirmReset'

export default function ChecklistPage({ state, setState }: Props) {
  const [trip, setTrip]               = useState<TripInfo|null>(() => loadTrip())
  const [showTripBar, setShowTripBar] = useState(false)
  const [startDate, setStartDate]     = useState(trip?.startDate ?? '')
  const [endDate, setEndDate]         = useState(trip?.endDate ?? '')
  const [modal, setModal]             = useState<Modal>('none')
  const [sheetItem, setSheetItem]     = useState<CheckItem|null>(null)
  const [showReceipt, setShowReceipt] = useState(false)
  const [issuedAt, setIssuedAt]       = useState('')
  const [shakeBtn, setShakeBtn]       = useState(false)
  const [customLabel, setCustomLabel] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const activeCategory = state.meta.activeCategory
  const allItems = [...ITEMS, ...state.customItems.map(c => ({ ...c, emoji:'📝' }))]
  const catItems = allItems.filter(i => i.categoryId === activeCategory)
  const done  = Object.keys(state.selected).length
  const total = allItems.length

  const tripLabel = trip
    ? `${trip.startDate.slice(5).replace('-','/')}~${trip.endDate.slice(5).replace('-','/')}`
    : null

  const handleMakeTrip = () => {
    if (!startDate || !endDate) { setModal('noDate'); return }
    const t = { startDate, endDate }
    saveTrip(t); setTrip(t); setShowTripBar(false)
  }

  const handleResetTrip = () => {
    setStartDate(''); setEndDate(''); clearTrip(); setTrip(null); setShowTripBar(false)
  }

  const handleIssue = () => {
    // 1. Must have trip
    if (!trip) { setModal('noTrip'); return }
    // 2. Must have at least one item checked
    if (done === 0) { triggerShake(); return }
    // 3. All checked items must have schedules
    const checkedIds = Object.keys(state.selected)
    const unscheduled = checkedIds.filter(id => !(state.schedules[id]?.length))
    if (unscheduled.length > 0) { setModal('noSchedule'); return }
    // Issue!
    const at = fmt(new Date())
    setIssuedAt(at)
    setState(issueReceipt(state, at))
    setShowReceipt(true)
  }

  const triggerShake = () => {
    setShakeBtn(true)
    setTimeout(() => setShakeBtn(false), 600)
  }

  const handleAddCustom = () => {
    const label = customLabel.trim()
    if (!label) return
    setState(addCustom(state, label, activeCategory))
    setCustomLabel('')
  }

  const handleReset = () => setModal('confirmReset')

  const doReset = () => {
    setState(resetAll())
    setTrip(null)
    setStartDate('')
    setEndDate('')
    setShowTripBar(false)
    setShowReceipt(false)
    setModal('none')
  }

  const unscheduledCount = Object.keys(state.selected).filter(id => !(state.schedules[id]?.length)).length

  return (
    <div style={{ minHeight:'100vh', background:'#fff8f2', display:'flex', flexDirection:'column' }}>

      {/* ── Top header ── */}
      <div style={{ background:'#fff', boxShadow:'0 1px 0 #eee', position:'sticky', top:0, zIndex:30 }}>

        {/* Header — handwriting style text only */}
        <div style={{
          background:'#fff',
          padding:'8px 0 6px',
          textAlign:'center',
          borderBottom:'1px solid #f0ede8',
        }}>
          <span style={{
            fontFamily:"'Gaegu', cursive",
            fontSize:20,
            fontWeight:700,
            letterSpacing:2,
            color:'#e8420a',
            opacity:0.9,
          }}>호주가자 보딩패스</span>
        </div>

        {/* Counter + trip button */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 16px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontWeight:700, fontSize:15 }}>
              {done > 0
                ? <><span style={{ color:'#e8420a' }}>할일 {done}개</span> 선택</>
                : <span style={{ color:'#bbb' }}>할일 0개 선택</span>
              }
            </span>
            {unscheduledCount > 0 && (
              <span style={{ fontSize:11, color:'#ff9800', fontWeight:600 }}>
                ({unscheduledCount}개 미지정)
              </span>
            )}
          </div>
          <button
            onClick={() => setShowTripBar(v => !v)}
            style={{
              display:'flex', alignItems:'center', gap:6,
              padding:'7px 14px', borderRadius:20,
              border:'1.5px solid',
              borderColor: tripLabel ? '#e8420a' : '#ddd',
              background: tripLabel ? '#e8420a' : '#fff',
              color: tripLabel ? '#fff' : '#888',
              fontSize:13, fontWeight:600,
            }}
          >📅 {tripLabel ?? '여행일정'}</button>
        </div>

        {/* Trip date input */}
        {showTripBar && (
          <div style={{ padding:'0 12px 8px', borderTop:'1px solid #f5f5f5', animation:'fadeInUp 0.2s ease' }}>
            <div style={{ display:'flex', gap:4, alignItems:'center', margin:'8px 0 6px', boxSizing:'border-box' }}>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                style={{ flex:'1 1 0', minWidth:0, width:0, padding:'6px 4px', border:'1.5px solid #e0e0e0', borderRadius:10, fontSize:11, color:'#333', outline:'none', boxSizing:'border-box' }} />
              <span style={{ color:'#ccc', fontWeight:700, flexShrink:0 }}>—</span>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                style={{ flex:'1 1 0', minWidth:0, width:0, padding:'6px 4px', border:'1.5px solid #e0e0e0', borderRadius:10, fontSize:11, color:'#333', outline:'none', boxSizing:'border-box' }} />
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={handleReset}
                style={{ flex:1, padding:'6px', border:'1.5px solid #e0e0e0', borderRadius:10, background:'#fff', color:'#888', fontWeight:600, fontSize:13 }}>
                초기화
              </button>
              <button onClick={handleMakeTrip}
                style={{ flex:2, padding:'6px', border:'none', borderRadius:10, background:'#e8420a', color:'#fff', fontWeight:700, fontSize:13 }}>
                만들기
              </button>
            </div>
          </div>
        )}

        {/* Category tabs — 2 rows */}
        <div style={{ padding:'8px 12px 10px' }}>
          {[CAT_ROW1, CAT_ROW2].map((row, ri) => (
            <div key={ri} style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:5, marginBottom: ri===0 ? 5 : 0 }}>
              {row.map(catId => {
                const cat = CATEGORIES.find(c => c.id === catId)
                if (!cat) return null
                const isActive = activeCategory === catId
                const catDone  = allItems.filter(i => i.categoryId === catId && state.selected[i.id]).length
                const catUnsch = allItems.filter(i => i.categoryId === catId && state.selected[i.id] && !(state.schedules[i.id]?.length)).length
                return (
                  <button
                    key={catId}
                    onClick={() => setState(setCategory(state, catId))}
                    style={{
                      padding:'7px 2px', borderRadius:10,
                      border:'none',
                      background: isActive ? '#e8420a' : '#f4f5f8',
                      color: isActive ? '#fff' : '#666',
                      fontWeight: isActive ? 700 : 500,
                      fontSize:12.5, cursor:'pointer',
                      position:'relative', transition:'all 0.15s',
                    }}
                  >
                    {cat.label}
                    {catDone > 0 && (
                      <span style={{
                        position:'absolute', top:-5, right:-3,
                        background: catUnsch > 0 ? '#ff9800' : '#e05252',
                        color:'#fff', borderRadius:99,
                        fontSize:9, fontWeight:800,
                        minWidth:15, height:15,
                        display:'flex', alignItems:'center', justifyContent:'center',
                        padding:'0 3px',
                      }}>{catDone}</span>
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* ── List ── */}
      <div style={{ flex:1, overflowY:'auto', paddingBottom:110 }}>

        {/* Section header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 16px 6px' }}>
          <span style={{ fontSize:13, color:'#999', fontWeight:600 }}>
            {CATEGORIES.find(c => c.id === activeCategory)?.receiptLabel}
          </span>
          <span style={{ fontSize:13, color:'#e8420a', fontWeight:700 }}>
            {catItems.filter(i => state.selected[i.id]).length}/{catItems.length}
          </span>
        </div>

        {/* Custom add */}
        <div style={{ display:'flex', gap:8, padding:'0 16px 8px' }}>
          <div style={{
            flex:1, display:'flex', alignItems:'center', gap:8,
            background:'#fff', borderRadius:10, padding:'8px 12px',
            border:'1.5px solid #e8e8e8',
          }}>
            <span style={{ color:'#e8420a', fontWeight:800, fontSize:18 }}>+</span>
            <input
              ref={inputRef}
              value={customLabel}
              onChange={e => setCustomLabel(e.target.value)}
              onKeyDown={e => e.key==='Enter' && handleAddCustom()}
              placeholder="직접 추가"
              style={{ flex:1, border:'none', outline:'none', fontSize:14, color:'#333', background:'transparent' }}
            />
          </div>
          <button onClick={handleAddCustom}
            style={{ padding:'8px 16px', background:'#e8420a', color:'#fff', border:'none', borderRadius:10, fontWeight:700, fontSize:14 }}>
            추가
          </button>
        </div>

        {/* Items */}
        <div style={{ background:'#fff', borderTop:'1px solid #f0f0f0', borderBottom:'1px solid #f0f0f0' }}>
          {catItems.map(item => {
            const checked  = !!state.selected[item.id]
            const dayCount = (state.schedules[item.id] ?? []).length
            const needsSch = checked && dayCount === 0
            return (
              <div key={item.id} style={{
                display:'flex', alignItems:'center', gap:10,
                padding:'13px 16px',
                borderBottom:'1px solid #f7f7f7',
                background: needsSch ? 'rgba(255,152,0,0.04)' : checked ? 'rgba(232,66,10,0.03)' : '#fff',
                transition:'background 0.15s',
              }}>
                {/* Checkbox */}
                <button
                  onClick={() => setState(toggleItem(state, item.id))}
                  style={{
                    width:22, height:22, borderRadius:6, flexShrink:0,
                    border: checked ? '2px solid #e8420a' : '2px solid #d8d8d8',
                    background: checked ? '#e8420a' : '#fff',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    transition:'all 0.15s',
                  }}
                >
                  {checked && (
                    <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
                      <path d="M1 4L4 7L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>

                <span style={{ fontSize:16, opacity: checked ? 1 : 0.45 }}>{item.emoji}</span>

                <span
                  onClick={() => setState(toggleItem(state, item.id))}
                  style={{ flex:1, fontSize:14, color: checked ? '#e8420a' : '#555', fontWeight: checked ? 600 : 400, cursor:'pointer' }}
                >
                  {item.label}
                </span>

                {/* +일정 button — always visible, disabled when unchecked */}
                <button
                  onClick={() => {
                    if (!checked) return
                    if (!trip) { setModal('noTrip'); return }
                    setSheetItem(item as CheckItem)
                  }}
                  style={{
                    padding:'5px 11px',
                    border: !checked ? '1.5px solid #ebebeb'
                          : dayCount > 0 ? '1.5px solid #e8420a'
                          : '1.5px solid #ff9800',
                    borderRadius:20,
                    background: !checked ? '#f7f7f7'
                              : dayCount > 0 ? '#e8420a'
                              : '#fff',
                    color: !checked ? '#ccc'
                         : dayCount > 0 ? '#fff'
                         : '#ff9800',
                    fontSize:11, fontWeight:700, whiteSpace:'nowrap',
                    cursor: checked ? 'pointer' : 'default',
                    transition:'all 0.15s',
                  }}
                >
                  {dayCount > 0 ? `${dayCount}일 ✓` : '+일정'}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Bottom CTA ── */}
      <div style={{
        position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)',
        width:'100%', maxWidth:430,
        padding:'8px 16px 20px',
        background:'transparent',
        zIndex:20,
      }}>
        {unscheduledCount > 0 && done > 0 && (
          <div style={{ fontSize:11, color:'#ff9800', textAlign:'center', marginBottom:5, fontWeight:600 }}>
            ⚠️ {unscheduledCount}개 항목에 날짜를 지정해주세요
          </div>
        )}
        <button
          onClick={handleIssue}
          style={{
            width:'100%', padding:'13px',
            background:'linear-gradient(135deg,#e8420a 0%,#ff7b2c 100%)', color:'#fff',
            border:'none', borderRadius:14,
            fontSize:15, fontWeight:700,
            animation: shakeBtn ? 'shake 0.5s ease' : 'none',
            boxShadow:'0 3px 12px rgba(232,66,10,0.25)',
          }}
        >보딩패스 발행하기</button>
        <div style={{ fontSize:11, color:'#aaa', textAlign:'center', marginTop:5 }}>
          선택한 할일들로 보딩 패스를 만들어요.
        </div>
      </div>

      {/* ── Modals ── */}

      {/* Confirm reset */}
      {modal === 'confirmReset' && (
        <AlertModal
          title="시작일과 종료일을 모두 초기화할까요?"
          message="체크 내용과 여행일정이 모두 삭제됩니다."
          confirmLabel="삭제"
          confirmColor="#e05252"
          onConfirm={doReset}
          onCancel={() => setModal('none')}
        />
      )}

      {/* No trip */}
      {modal === 'noTrip' && (
        <AlertModal
          title="여행일정을 먼저 설정해주세요"
          message="상단의 '여행일정' 버튼을 눌러 여행 날짜를 입력해주세요."
          confirmLabel="날짜 입력하기"
          onConfirm={() => { setModal('none'); setShowTripBar(true) }}
          onCancel={() => setModal('none')}
        />
      )}

      {/* No date (both dates required) */}
      {modal === 'noDate' && (
        <AlertModal
          title="시작일과 종료일을 모두 입력해주세요"
          confirmLabel="확인"
          onConfirm={() => setModal('none')}
          onCancel={() => setModal('none')}
          hideCancel
        />
      )}

      {/* No schedule on some items */}
      {modal === 'noSchedule' && (
        <AlertModal
          title="일정 날짜 미지정 항목이 있어요"
          message={`체크된 모든 항목에 날짜를 지정해야 영수증을 발행할 수 있어요.\n주황색 항목의 [+일정]을 눌러 날짜를 지정해주세요.`}
          confirmLabel="확인"
          onConfirm={() => setModal('none')}
          onCancel={() => setModal('none')}
          hideCancel
        />
      )}

      {/* Schedule sheet */}
      {sheetItem && trip && (
        <ScheduleSheet
          itemLabel={sheetItem.label}
          trip={trip}
          currentDays={state.schedules[sheetItem.id] ?? []}
          onSelect={days => setState(setSchedule(state, sheetItem.id, days))}
          onClose={() => setSheetItem(null)}
        />
      )}

      {/* Receipt modal */}
      {showReceipt && trip && (
        <ReceiptModal
          state={state}
          trip={trip}
          issuedAt={issuedAt}
          onClose={() => setShowReceipt(false)}
          onReset={handleReset}
        />
      )}
    </div>
  )
}

/* ── Reusable alert modal ── */
function AlertModal({ title, message, confirmLabel, confirmColor, onConfirm, onCancel, hideCancel }:
  { title:string; message?:string; confirmLabel:string; confirmColor?:string; onConfirm:()=>void; onCancel:()=>void; hideCancel?:boolean }) {
  return (
    <>
      <div onClick={onCancel} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:600, animation:'fadeIn 0.2s ease' }} />
      <div style={{
        position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
        background:'#fff', borderRadius:18, padding:'26px 22px',
        zIndex:601, width:290, textAlign:'center',
        animation:'scaleIn 0.22s ease',
        boxShadow:'0 8px 40px rgba(0,0,0,0.18)',
      }}>
        <p style={{ fontSize:15, fontWeight:700, color:'#222', marginBottom: message ? 10 : 22, lineHeight:1.6 }}>{title}</p>
        {message && <p style={{ fontSize:13, color:'#888', marginBottom:22, lineHeight:1.7, whiteSpace:'pre-line' }}>{message}</p>}
        <div style={{ display:'flex', gap:10 }}>
          {!hideCancel && (
            <button onClick={onCancel} style={{ flex:1, padding:'12px', border:'1.5px solid #e8e8e8', borderRadius:12, background:'#fff', color:'#888', fontWeight:600, fontSize:14 }}>취소</button>
          )}
          <button onClick={onConfirm} style={{ flex:2, padding:'12px', border:'none', borderRadius:12, background: confirmColor ?? '#e8420a', color:'#fff', fontWeight:700, fontSize:14 }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </>
  )
}
