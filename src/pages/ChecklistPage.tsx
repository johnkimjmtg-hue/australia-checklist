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
    if (!trip) { setModal('noTrip'); return }
    if (done === 0) { triggerShake(); return }
    const checkedIds = Object.keys(state.selected)
    const unscheduled = checkedIds.filter(id => !(state.schedules[id]?.length))
    if (unscheduled.length > 0) { setModal('noSchedule'); return }
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
    setTrip(null); setStartDate(''); setEndDate('')
    setShowTripBar(false); setShowReceipt(false); setModal('none')
  }

  const unscheduledCount = Object.keys(state.selected).filter(id => !(state.schedules[id]?.length)).length

  return (
    <div style={{ minHeight:'100vh', background:'#F0F4FF', display:'flex', flexDirection:'column' }}>

      {/* ── Top header ── */}
      <div style={{ background:'#fff', boxShadow:'0 1px 0 rgba(48,79,180,0.08)', position:'sticky', top:0, zIndex:30 }}>

        {/* Title */}
        <div style={{ padding:'8px 0 6px', textAlign:'center', borderBottom:'1px solid rgba(48,79,180,0.08)' }}>
          <span style={{ fontFamily:"'Gaegu', cursive", fontSize:20, fontWeight:700, letterSpacing:2, color:'#304FB4', opacity:0.9 }}>
            호주가자 보딩패스
          </span>
        </div>

        {/* Counter + trip button */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 16px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontWeight:700, fontSize:15 }}>
              {done > 0
                ? <><span style={{ color:'#304FB4' }}>할일 {done}개</span> 선택</>
                : <span style={{ color:'#bbb' }}>할일 0개 선택</span>
              }
            </span>
            {unscheduledCount > 0 && (
              <span style={{ fontSize:11, color:'#F59E0B', fontWeight:600 }}>({unscheduledCount}개 미지정)</span>
            )}
          </div>
          <button
            onClick={() => setShowTripBar(v => !v)}
            style={{
              display:'flex', alignItems:'center', gap:6,
              padding:'7px 14px', borderRadius:20,
              border:'1.5px solid', cursor:'pointer',
              borderColor: tripLabel ? '#304FB4' : 'rgba(48,79,180,0.2)',
              background: tripLabel ? '#304FB4' : '#fff',
              color: tripLabel ? '#fff' : '#6B7280',
              fontSize:13, fontWeight:600,
            }}
          >📅 {tripLabel ?? '여행일정'}</button>
        </div>

        {/* Trip date input */}
        {showTripBar && (
          <div style={{ padding:'0 12px 8px', borderTop:'1px solid rgba(48,79,180,0.08)', animation:'fadeInUp 0.2s ease' }}>
            <div style={{ display:'flex', gap:4, alignItems:'center', margin:'8px 0 6px' }}>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                className="hg-inputDate" />
              <span style={{ color:'#ccc', fontWeight:700, flexShrink:0 }}>—</span>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                className="hg-inputDate" />
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={handleResetTrip}
                style={{ flex:1, padding:'6px', border:'1px solid rgba(48,79,180,0.15)', borderRadius:10, background:'#fff', color:'#6B7280', fontWeight:600, fontSize:13, cursor:'pointer' }}>
                초기화
              </button>
              <button onClick={handleMakeTrip}
                style={{ flex:2, padding:'6px', border:'none', borderRadius:10, background:'linear-gradient(180deg,#4F6BDC,#304FB4)', color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer' }}>
                만들기
              </button>
            </div>
          </div>
        )}

        {/* Category tabs */}
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
                  <button key={catId} onClick={() => setState(setCategory(state, catId))}
                    style={{
                      padding:'7px 2px', borderRadius:10, border:'none', cursor:'pointer',
                      background: isActive ? 'linear-gradient(180deg,#4F6BDC,#304FB4)' : 'rgba(255,255,255,0.85)',
                      color: isActive ? '#fff' : '#6B7280',
                      fontWeight: isActive ? 700 : 500,
                      fontSize:12.5, position:'relative', transition:'all 0.15s',
                      boxShadow: isActive ? '0 4px 10px rgba(48,79,180,0.2)' : '0 1px 3px rgba(48,79,180,0.06)',
                    }}>
                    {cat.label}
                    {catDone > 0 && (
                      <span style={{
                        position:'absolute', top:-5, right:-3,
                        background: catUnsch > 0 ? '#F59E0B' : '#304FB4',
                        color:'#fff', borderRadius:99, fontSize:9, fontWeight:800,
                        minWidth:15, height:15, display:'flex', alignItems:'center', justifyContent:'center', padding:'0 3px',
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
          <span style={{ fontSize:13, color:'#6B7280', fontWeight:600 }}>
            {CATEGORIES.find(c => c.id === activeCategory)?.receiptLabel}
          </span>
          <span style={{ fontSize:13, color:'#304FB4', fontWeight:700 }}>
            {catItems.filter(i => state.selected[i.id]).length}/{catItems.length}
          </span>
        </div>

        {/* Custom add */}
        <div style={{ display:'flex', gap:8, padding:'0 16px 8px' }}>
          <div style={{
            flex:1, display:'flex', alignItems:'center', gap:8,
            background:'#fff', borderRadius:12, padding:'8px 12px',
            border:'1px solid rgba(48,79,180,0.12)',
            boxShadow:'0 2px 8px rgba(48,79,180,0.06)',
          }}>
            <span style={{ color:'#4F6BDC', fontWeight:800, fontSize:18 }}>+</span>
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
            style={{ padding:'8px 16px', background:'linear-gradient(180deg,#4F6BDC,#304FB4)', color:'#fff', border:'none', borderRadius:12, fontWeight:700, fontSize:14, cursor:'pointer', boxShadow:'0 4px 10px rgba(48,79,180,0.2)' }}>
            추가
          </button>
        </div>

        {/* Items */}
        <div style={{ background:'#fff', borderTop:'1px solid rgba(48,79,180,0.06)', borderBottom:'1px solid rgba(48,79,180,0.06)' }}>
          {catItems.map(item => {
            const checked  = !!state.selected[item.id]
            const dayCount = (state.schedules[item.id] ?? []).length
            const needsSch = checked && dayCount === 0
            return (
              <div key={item.id} style={{
                display:'flex', alignItems:'center', gap:10,
                padding:'13px 16px',
                borderBottom:'1px solid rgba(48,79,180,0.05)',
                background: needsSch ? 'rgba(245,158,11,0.04)' : checked ? 'rgba(48,79,180,0.03)' : '#fff',
                transition:'background 0.15s',
              }}>
                {/* Checkbox */}
                <button onClick={() => setState(toggleItem(state, item.id))}
                  style={{
                    width:22, height:22, borderRadius:6, flexShrink:0,
                    border: checked ? 'none' : '2px solid rgba(48,79,180,0.2)',
                    background: checked ? 'linear-gradient(180deg,#4F6BDC,#304FB4)' : '#fff',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    transition:'all 0.15s', cursor:'pointer',
                    boxShadow: checked ? '0 3px 8px rgba(48,79,180,0.25)' : 'none',
                  }}>
                  {checked && (
                    <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
                      <path d="M1 4L4 7L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>

                <span style={{ fontSize:16, opacity: checked ? 1 : 0.45 }}>{item.emoji}</span>

                <span onClick={() => setState(toggleItem(state, item.id))}
                  style={{ flex:1, fontSize:14, color: checked ? '#304FB4' : '#555', fontWeight: checked ? 600 : 400, cursor:'pointer' }}>
                  {item.label}
                </span>

                {/* +일정 button */}
                <button
                  onClick={() => {
                    if (!checked) return
                    if (!trip) { setModal('noTrip'); return }
                    setSheetItem(item as CheckItem)
                  }}
                  style={{
                    padding:'5px 11px',
                    border: !checked ? '1px solid rgba(48,79,180,0.1)'
                          : dayCount > 0 ? 'none'
                          : '1.5px solid #F59E0B',
                    borderRadius:20,
                    background: !checked ? 'rgba(48,79,180,0.04)'
                              : dayCount > 0 ? 'linear-gradient(180deg,#4F6BDC,#304FB4)'
                              : '#fff',
                    color: !checked ? '#ccc'
                         : dayCount > 0 ? '#fff'
                         : '#F59E0B',
                    fontSize:11, fontWeight:700, whiteSpace:'nowrap',
                    cursor: checked ? 'pointer' : 'default',
                    transition:'all 0.15s',
                    boxShadow: checked && dayCount > 0 ? '0 3px 8px rgba(48,79,180,0.22)' : 'none',
                  }}>
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
        padding:'8px 16px 20px', background:'transparent', zIndex:20,
      }}>
        {unscheduledCount > 0 && done > 0 && (
          <div style={{ fontSize:11, color:'#F59E0B', textAlign:'center', marginBottom:5, fontWeight:600 }}>
            ⚠️ {unscheduledCount}개 항목에 날짜를 지정해주세요
          </div>
        )}
        <button onClick={handleIssue}
          style={{
            width:'100%', padding:'13px',
            background:'linear-gradient(135deg,#4F6BDC,#304FB4)', color:'#fff',
            border:'none', borderRadius:14, fontSize:15, fontWeight:700, cursor:'pointer',
            animation: shakeBtn ? 'shake 0.5s ease' : 'none',
            boxShadow:'0 4px 16px rgba(48,79,180,0.30)',
          }}>보딩패스 발행하기</button>
        <div style={{ fontSize:11, color:'#9CA3AF', textAlign:'center', marginTop:5 }}>
          선택한 할일들로 보딩 패스를 만들어요.
        </div>
      </div>

      {/* ── Modals ── */}
      {modal === 'confirmReset' && (
        <AlertModal title="시작일과 종료일을 모두 초기화할까요?" message="체크 내용과 여행일정이 모두 삭제됩니다."
          confirmLabel="삭제" confirmColor="#EF4444" onConfirm={doReset} onCancel={() => setModal('none')} />
      )}
      {modal === 'noTrip' && (
        <AlertModal title="여행일정을 먼저 설정해주세요" message="상단의 '여행일정' 버튼을 눌러 여행 날짜를 입력해주세요."
          confirmLabel="날짜 입력하기" onConfirm={() => { setModal('none'); setShowTripBar(true) }} onCancel={() => setModal('none')} />
      )}
      {modal === 'noDate' && (
        <AlertModal title="시작일과 종료일을 모두 입력해주세요" confirmLabel="확인"
          onConfirm={() => setModal('none')} onCancel={() => setModal('none')} hideCancel />
      )}
      {modal === 'noSchedule' && (
        <AlertModal title="일정 날짜 미지정 항목이 있어요"
          message={`체크된 모든 항목에 날짜를 지정해야 영수증을 발행할 수 있어요.\n주황색 항목의 [+일정]을 눌러 날짜를 지정해주세요.`}
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
          onClose={() => setShowReceipt(false)} onReset={handleReset} />
      )}
    </div>
  )
}

function AlertModal({ title, message, confirmLabel, confirmColor, onConfirm, onCancel, hideCancel }:
  { title:string; message?:string; confirmLabel:string; confirmColor?:string; onConfirm:()=>void; onCancel:()=>void; hideCancel?:boolean }) {
  return (
    <>
      <div onClick={onCancel} style={{ position:'fixed', inset:0, background:'rgba(17,24,39,0.45)', zIndex:600, animation:'fadeIn 0.2s ease' }} />
      <div style={{
        position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
        background:'#fff', borderRadius:20, padding:'26px 22px',
        zIndex:601, width:290, textAlign:'center',
        animation:'scaleIn 0.22s ease',
        boxShadow:'0 16px 40px rgba(48,79,180,0.16)',
        border:'1px solid rgba(48,79,180,0.08)',
      }}>
        <p style={{ fontSize:15, fontWeight:700, color:'#111827', marginBottom: message ? 10 : 22, lineHeight:1.6 }}>{title}</p>
        {message && <p style={{ fontSize:13, color:'#6B7280', marginBottom:22, lineHeight:1.7, whiteSpace:'pre-line' }}>{message}</p>}
        <div style={{ display:'flex', gap:10 }}>
          {!hideCancel && (
            <button onClick={onCancel} style={{ flex:1, padding:'12px', border:'1px solid rgba(48,79,180,0.15)', borderRadius:12, background:'#fff', color:'#6B7280', fontWeight:600, fontSize:14, cursor:'pointer' }}>취소</button>
          )}
          <button onClick={onConfirm} style={{ flex:2, padding:'12px', border:'none', borderRadius:12, background: confirmColor ?? 'linear-gradient(180deg,#4F6BDC,#304FB4)', color:'#fff', fontWeight:700, fontSize:14, cursor:'pointer' }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </>
  )
}
