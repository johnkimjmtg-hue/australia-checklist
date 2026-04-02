// ─────────────────────────────────────────────
// DaySheet.tsx
// 날짜 탭하면 나오는 바텀시트 - 버킷/할일/행사
// ─────────────────────────────────────────────
import { useState } from 'react'
import { Icon } from '@iconify/react'
import { AppState, TripInfo, getTripDays, setSchedule } from '../store/state'
import { ITEMS } from '../data/checklist'

const ff = "-apple-system, 'Apple SD Gothic Neo', 'Pretendard', sans-serif"

type Todo = { id: string; text: string; done: boolean }

type Props = {
  dayIndex: number
  trip: TripInfo
  state: AppState
  setState: (s: AppState) => void
  onClose: () => void
  onOpenBucket: () => void
  events?: any[]  // getCachedEvents() 데이터
}

const TODOS_KEY = 'hojugaja-todos'

function loadTodos(): Record<number, Todo[]> {
  try { return JSON.parse(localStorage.getItem(TODOS_KEY) ?? '{}') } catch { return {} }
}
function saveTodos(todos: Record<number, Todo[]>) {
  try { localStorage.setItem(TODOS_KEY, JSON.stringify(todos)) } catch {}
}

// 날짜 문자열 포맷 (YYYY-MM-DD)
function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

// 도시 뱃지 색상
const CITY_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  sydney:    { bg: 'rgba(41,182,208,0.12)',  color: '#29B6D0', label: '시드니' },
  melbourne: { bg: 'rgba(124,58,237,0.12)',  color: '#7C3AED', label: '멜번' },
  both:      { bg: 'rgba(245,158,11,0.12)',  color: '#F59E0B', label: '전국' },
}

const CAT_ICON: Record<string, string> = {
  festival: '🎉',
  sports:   '🏆',
  nature:   '🌿',
  culture:  '🎭',
  food:     '🍽',
}

export default function DaySheet({ dayIndex, trip, state, setState, onClose, onOpenBucket, events = [] }: Props) {
  const tripDays = getTripDays(trip)
  const day = tripDays[dayIndex]
  const [tab, setTab] = useState<'bucket' | 'todo' | 'events'>('bucket')
  const [todos, setTodos] = useState<Record<number, Todo[]>>(() => loadTodos())
  const [newTodo, setNewTodo] = useState('')
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null)

  const fmtMD = (d: Date) => `${d.getMonth()+1}월 ${d.getDate()}일`
  const dow = (d: Date) => ['일','월','화','수','목','금','토'][d.getDay()]

  // 이날 버킷 항목
  const bucketItems = [
    ...ITEMS.filter(item => state.selected[item.id] && (state.schedules[item.id] ?? []).includes(dayIndex)),
    ...state.customItems.filter(item => state.selected[item.id] && (state.schedules[item.id] ?? []).includes(dayIndex)).map(c => ({ ...c, emoji: '✏️' })),
  ]

  // 이날 할일
  const dayTodos = todos[dayIndex] ?? []

  // 이날 행사 (start_date <= 오늘 <= end_date)
  const dateStr = day ? toDateStr(day) : ''
  const dayEvents = events.filter(ev => ev.is_active && ev.start_date <= dateStr && ev.end_date >= dateStr)

  const handleRemoveBucket = (itemId: string) => {
    const current = state.schedules[itemId] ?? []
    const next = current.filter(d => d !== dayIndex)
    setState(setSchedule(state, itemId, next))
  }

  const handleAddTodo = () => {
    if (!newTodo.trim()) return
    const todo: Todo = { id: `t_${Date.now()}`, text: newTodo.trim(), done: false }
    const updated = { ...todos, [dayIndex]: [...dayTodos, todo] }
    setTodos(updated); saveTodos(updated); setNewTodo('')
  }

  const handleToggleTodo = (todoId: string) => {
    const updated = { ...todos, [dayIndex]: dayTodos.map(t => t.id === todoId ? { ...t, done: !t.done } : t) }
    setTodos(updated); saveTodos(updated)
  }

  const handleDeleteTodo = (todoId: string) => {
    const updated = { ...todos, [dayIndex]: dayTodos.filter(t => t.id !== todoId) }
    setTodos(updated); saveTodos(updated)
  }

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', backdropFilter:'blur(8px)', zIndex:800 }} />
      <div style={{
        position:'fixed', bottom:16, left:'50%', transform:'translateX(-50%)',
        width:'calc(100% - 32px)', maxWidth:398,
        background:'#EFFCFC', borderRadius:20,
        maxHeight:'80vh', display:'flex', flexDirection:'column',
        zIndex:801, animation:'slideUpSheet 0.25s ease',
        boxShadow:'0 8px 32px rgba(0,0,0,0.20)',
        fontFamily: ff,
      }}>
        <style>{`
          @keyframes slideUpSheet {
            from { transform: translateX(-50%) translateY(100%); }
            to   { transform: translateX(-50%) translateY(0); }
          }
        `}</style>

        {/* 핸들 */}
        <div style={{ width:36, height:4, borderRadius:999, background:'rgba(0,0,0,0.15)', margin:'12px auto 0', flexShrink:0 }} />

        {/* 헤더 */}
        <div style={{ padding:'12px 20px 0', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div>
            <div style={{ fontSize:17, fontWeight:800, color:'#0D3349' }}>
              {day ? fmtMD(day) : ''} <span style={{ fontSize:13, fontWeight:500, color:'#1565A0' }}>({day ? dow(day) : ''})</span>
            </div>
            <div style={{ fontSize:12, color:'#1565A0', marginTop:2 }}>Day {dayIndex + 1}</div>
          </div>
          <button onClick={onClose} style={{ width:28, height:28, borderRadius:'50%', background:'rgba(0,0,0,0.08)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', WebkitTapHighlightColor:'transparent' }}>
            <Icon icon="ph:x" width={16} height={16} color="#0D3349" />
          </button>
        </div>

        {/* 탭 */}
        <div style={{ display:'flex', padding:'10px 20px 0', gap:8, flexShrink:0 }}>
          {[
            { id:'bucket', label:'🗺️ 버킷리스트', count: bucketItems.length },
            { id:'todo',   label:'✅ 할일',       count: dayTodos.length },
            { id:'events', label:'📅 행사',        count: dayEvents.length },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)} style={{
              padding:'6px 14px', borderRadius:20, border:'none', cursor:'pointer', fontFamily:ff,
              background: tab === t.id ? '#00838F' : '#fff',
              color: tab === t.id ? '#fff' : '#1565A0',
              fontSize:13, fontWeight:600, WebkitTapHighlightColor:'transparent',
              position:'relative',
            }}>
              {t.label}
              {t.count > 0 && <span style={{ opacity:0.8 }}> ({t.count})</span>}
            </button>
          ))}
        </div>

        {/* 내용 */}
        <div style={{ flex:1, overflowY:'auto', padding:'12px 20px 28px' }}>

          {/* 버킷리스트 탭 */}
          {tab === 'bucket' && (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {bucketItems.length === 0 ? (
                <div style={{ textAlign:'center', padding:'24px 0' }}>
                  <div style={{ fontSize:32, marginBottom:8 }}>🗺️</div>
                  <div style={{ fontSize:14, color:'#1565A0', marginBottom:12 }}>이날 버킷리스트가 없어요</div>
                  <button onClick={onOpenBucket} style={{ background:'#00838F', border:'none', borderRadius:20, padding:'8px 20px', fontSize:13, fontWeight:600, color:'#fff', cursor:'pointer', fontFamily:ff }}>버킷리스트에서 추가하기</button>
                </div>
              ) : bucketItems.map(item => (
                <div key={item.id} style={{ background:'#fff', borderRadius:14, padding:'12px 14px', display:'flex', alignItems:'center', gap:10, boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
                  <span style={{ fontSize:18 }}>{item.emoji}</span>
                  <span style={{ flex:1, fontSize:14, color:'#0D3349', fontWeight:500 }}>{item.label}</span>
                  <button onClick={() => handleRemoveBucket(item.id)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:16, color:'#bbb', padding:4, WebkitTapHighlightColor:'transparent' }}>✕</button>
                </div>
              ))}
            </div>
          )}

          {/* 할일 탭 */}
          {tab === 'todo' && (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              <div style={{ display:'flex', gap:8, marginBottom:4 }}>
                <input
                  value={newTodo}
                  onChange={e => setNewTodo(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddTodo()}
                  placeholder="할일 입력..."
                  style={{ flex:1, padding:'10px 14px', borderRadius:14, border:'1.5px solid rgba(0,131,143,0.2)', fontSize:14, color:'#0D3349', background:'#fff', fontFamily:ff, outline:'none' }}
                />
                <button onClick={handleAddTodo} style={{ background:'#00838F', border:'none', borderRadius:14, padding:'10px 16px', fontSize:14, fontWeight:700, color:'#fff', cursor:'pointer', fontFamily:ff, WebkitTapHighlightColor:'transparent' }}>+</button>
              </div>
              {dayTodos.length === 0 ? (
                <div style={{ textAlign:'center', padding:'20px 0', color:'#1565A0', fontSize:14 }}>할일을 추가해보세요!</div>
              ) : dayTodos.map(todo => (
                <div key={todo.id} style={{ background:'#fff', borderRadius:14, padding:'12px 14px', display:'flex', alignItems:'center', gap:10, boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
                  <button onClick={() => handleToggleTodo(todo.id)} style={{ width:22, height:22, borderRadius:'50%', flexShrink:0, border:`2px solid ${todo.done ? '#00838F' : '#ccc'}`, background: todo.done ? '#00838F' : 'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', WebkitTapHighlightColor:'transparent' }}>
                    {todo.done && <span style={{ fontSize:11, color:'#fff' }}>✓</span>}
                  </button>
                  <span style={{ flex:1, fontSize:14, color: todo.done ? '#aaa' : '#0D3349', textDecoration: todo.done ? 'line-through' : 'none' }}>{todo.text}</span>
                  <button onClick={() => handleDeleteTodo(todo.id)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:16, color:'#bbb', padding:4, WebkitTapHighlightColor:'transparent' }}>✕</button>
                </div>
              ))}
            </div>
          )}

          {/* 행사 탭 */}
          {tab === 'events' && (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {dayEvents.length === 0 ? (
                <div style={{ textAlign:'center', padding:'24px 0' }}>
                  <div style={{ fontSize:32, marginBottom:8 }}>📅</div>
                  <div style={{ fontSize:14, color:'#1565A0' }}>이날 등록된 행사가 없어요</div>
                </div>
              ) : dayEvents.map(ev => {
                const cityStyle = CITY_STYLE[ev.city] ?? CITY_STYLE.both
                return (
                  <div key={ev.id}
                    onClick={() => setSelectedEvent(ev)}
                    style={{ background:'#fff', borderRadius:14, padding:'14px', display:'flex', gap:12, alignItems:'flex-start', boxShadow:'0 2px 8px rgba(0,0,0,0.06)', cursor:'pointer', WebkitTapHighlightColor:'transparent' }}>
                    {/* 이미지 or 이모지 */}
                    <div style={{ width:52, height:52, borderRadius:10, overflow:'hidden', flexShrink:0, background: cityStyle.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      {ev.image_url
                        ? <img src={ev.image_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                        : <span style={{ fontSize:24 }}>{CAT_ICON[ev.category] ?? '📅'}</span>
                      }
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:14, fontWeight:700, color:'#0D3349', marginBottom:4, lineHeight:1.3 }}>{ev.title}</div>
                      <div style={{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
                        <span style={{ fontSize:11, fontWeight:700, color: cityStyle.color, background: cityStyle.bg, padding:'2px 8px', borderRadius:20 }}>{cityStyle.label}</span>
                        <span style={{ fontSize:11, color:'#7BAAB5' }}>
                          {ev.start_date === ev.end_date
                            ? ev.start_date.slice(5).replace('-','/')
                            : `${ev.start_date.slice(5).replace('-','/')} ~ ${ev.end_date.slice(5).replace('-','/')}`}
                        </span>
                      </div>
                    </div>
                    <Icon icon="ph:caret-right" width={16} height={16} color="#7BAAB5" style={{ flexShrink:0, marginTop:2 }} />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* 행사 상세 팝업 */}
      {selectedEvent && (
        <>
          <div onClick={() => setSelectedEvent(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1100 }} />
          <div onClick={e => e.stopPropagation()} style={{
            position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)',
            width:'100%', maxWidth:430, background:'#ffffff',
            borderRadius:'20px 20px 0 0', maxHeight:'75vh', overflowY:'auto',
            zIndex:1101, animation:'slideUpSheet 0.25s ease',
            boxShadow:'0 8px 32px rgba(0,0,0,0.20)',
            fontFamily: ff, display:'flex', flexDirection:'column',
          }}>
            {/* 헤더 */}
            <div style={{ flexShrink:0, display:'flex', justifyContent:'flex-end', padding:'12px 12px 0' }}>
              <button onClick={() => setSelectedEvent(null)} style={{ width:28, height:28, borderRadius:'50%', background:'rgba(0,0,0,0.08)', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', WebkitTapHighlightColor:'transparent' }}>
                <Icon icon="ph:x" width={16} height={16} color="#0D3349" />
              </button>
            </div>

            {/* 이미지 */}
            {selectedEvent.image_url && (
              <div style={{ width:'100%', height:200, overflow:'hidden', flexShrink:0 }}>
                <img src={selectedEvent.image_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              </div>
            )}

            {/* 내용 */}
            <div style={{ flex:1, overflowY:'auto', padding:'16px 20px 40px' }}>
              {/* 도시/카테고리 뱃지 */}
              <div style={{ display:'flex', gap:6, marginBottom:10, flexWrap:'wrap' }}>
                {(() => {
                  const cs = CITY_STYLE[selectedEvent.city] ?? CITY_STYLE.both
                  return <span style={{ fontSize:12, fontWeight:700, color: cs.color, background: cs.bg, padding:'3px 10px', borderRadius:20 }}>{cs.label}</span>
                })()}
                <span style={{ fontSize:12, fontWeight:700, color:'#7BAAB5', background:'rgba(0,0,0,0.05)', padding:'3px 10px', borderRadius:20 }}>
                  {CAT_ICON[selectedEvent.category] ?? '📅'} {selectedEvent.category}
                </span>
              </div>

              {/* 제목 */}
              <div style={{ fontSize:20, fontWeight:800, color:'#0D3349', lineHeight:1.3, marginBottom:8 }}>{selectedEvent.title}</div>

              {/* 날짜 */}
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16, padding:'10px 14px', background:'rgba(0,131,143,0.08)', borderRadius:12 }}>
                <Icon icon="ph:calendar" width={16} height={16} color="#00838F" />
                <span style={{ fontSize:14, fontWeight:600, color:'#00838F' }}>
                  {selectedEvent.start_date === selectedEvent.end_date
                    ? selectedEvent.start_date.replace(/-/g,'/')
                    : `${selectedEvent.start_date.replace(/-/g,'/')} ~ ${selectedEvent.end_date.replace(/-/g,'/')}`}
                </span>
              </div>

              {/* 설명 */}
              {selectedEvent.description && (
                <div style={{ fontSize:14, color:'#475569', lineHeight:1.8, marginBottom:20, whiteSpace:'pre-wrap' }}>
                  {selectedEvent.description}
                </div>
              )}

              {/* 공식 홈페이지 버튼 */}
              {selectedEvent.website_url && (
                <button
                  onClick={() => window.open(selectedEvent.website_url, '_blank')}
                  style={{ display:'flex', alignItems:'center', gap:8, width:'100%', background:'#00838F', border:'none', borderRadius:14, padding:'14px 16px', cursor:'pointer', fontFamily:ff }}>
                  <Icon icon="ph:globe" width={18} height={18} color="#fff" />
                  <span style={{ fontSize:14, fontWeight:700, color:'#fff' }}>공식 홈페이지 보기</span>
                  <Icon icon="ph:arrow-square-out" width={14} height={14} color="rgba(255,255,255,0.7)" style={{ marginLeft:'auto' }} />
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}
