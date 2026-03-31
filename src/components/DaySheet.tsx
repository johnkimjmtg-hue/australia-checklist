// ─────────────────────────────────────────────
// DaySheet.tsx
// 날짜 탭하면 나오는 바텀시트 - 버킷/쇼핑/할일
// ─────────────────────────────────────────────
import { useState } from 'react'
import { AppState, TripInfo, getTripDays, toggleItem, setSchedule } from '../store/state'
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
}

const TODOS_KEY = 'hojugaja-todos'

function loadTodos(): Record<number, Todo[]> {
  try { return JSON.parse(localStorage.getItem(TODOS_KEY) ?? '{}') } catch { return {} }
}
function saveTodos(todos: Record<number, Todo[]>) {
  try { localStorage.setItem(TODOS_KEY, JSON.stringify(todos)) } catch {}
}

export default function DaySheet({ dayIndex, trip, state, setState, onClose, onOpenBucket }: Props) {
  const tripDays = getTripDays(trip)
  const day = tripDays[dayIndex]
  const [tab, setTab] = useState<'bucket' | 'todo'>('bucket')
  const [todos, setTodos] = useState<Record<number, Todo[]>>(() => loadTodos())
  const [newTodo, setNewTodo] = useState('')

  const fmtMD = (d: Date) => `${d.getMonth()+1}월 ${d.getDate()}일`
  const dow = (d: Date) => ['일','월','화','수','목','금','토'][d.getDay()]

  // 이날 버킷 항목
  const bucketItems = [
    ...ITEMS.filter(item => state.selected[item.id] && (state.schedules[item.id] ?? []).includes(dayIndex)),
    ...state.customItems.filter(item => state.selected[item.id] && (state.schedules[item.id] ?? []).includes(dayIndex))
      .map(c => ({ ...c, emoji: '✏️' })),
  ]

  // 이날 할일
  const dayTodos = todos[dayIndex] ?? []

  const handleRemoveBucket = (itemId: string) => {
    const current = state.schedules[itemId] ?? []
    const next = current.filter(d => d !== dayIndex)
    setState(setSchedule(state, itemId, next))
  }

  const handleAddTodo = () => {
    if (!newTodo.trim()) return
    const todo: Todo = { id: `t_${Date.now()}`, text: newTodo.trim(), done: false }
    const updated = { ...todos, [dayIndex]: [...dayTodos, todo] }
    setTodos(updated)
    saveTodos(updated)
    setNewTodo('')
  }

  const handleToggleTodo = (todoId: string) => {
    const updated = {
      ...todos,
      [dayIndex]: dayTodos.map(t => t.id === todoId ? { ...t, done: !t.done } : t)
    }
    setTodos(updated)
    saveTodos(updated)
  }

  const handleDeleteTodo = (todoId: string) => {
    const updated = { ...todos, [dayIndex]: dayTodos.filter(t => t.id !== todoId) }
    setTodos(updated)
    saveTodos(updated)
  }

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:800 }} />
      <div style={{
        position:'fixed', bottom:16, left:'50%', transform:'translateX(-50%)',
        width:'calc(100% - 32px)', maxWidth:398,
        background:'#EFFCFC', borderRadius:20,
        maxHeight:'80vh', display:'flex', flexDirection:'column',
        zIndex:801, animation:'slideUpSheet 0.25s ease',
        boxShadow:'0 8px 32px rgba(0,0,0,0.20)',
      }}>
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
            <span style={{ fontSize:14, color:'#0D3349' }}>✕</span>
          </button>
        </div>

        {/* 탭 */}
        <div style={{ display:'flex', padding:'10px 20px 0', gap:8, flexShrink:0 }}>
          {[
            { id:'bucket', label:'🗺️ 버킷리스트', count: bucketItems.length },
            { id:'todo', label:'✅ 할일', count: dayTodos.length },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)} style={{
              padding:'6px 14px', borderRadius:20, border:'none', cursor:'pointer', fontFamily:ff,
              background: tab === t.id ? '#00838F' : '#fff',
              color: tab === t.id ? '#fff' : '#1565A0',
              fontSize:13, fontWeight:600, WebkitTapHighlightColor:'transparent',
            }}>
              {t.label} {t.count > 0 && <span style={{ opacity:0.8 }}>({t.count})</span>}
            </button>
          ))}
        </div>

        {/* 내용 */}
        <div style={{ flex:1, overflowY:'auto', padding:'12px 20px 28px' }}>
          {tab === 'bucket' && (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {bucketItems.length === 0 ? (
                <div style={{ textAlign:'center', padding:'24px 0' }}>
                  <div style={{ fontSize:32, marginBottom:8 }}>🗺️</div>
                  <div style={{ fontSize:14, color:'#1565A0', marginBottom:12 }}>이날 버킷리스트가 없어요</div>
                  <button onClick={onOpenBucket} style={{
                    background:'#00838F', border:'none', borderRadius:20,
                    padding:'8px 20px', fontSize:13, fontWeight:600, color:'#fff',
                    cursor:'pointer', fontFamily:ff,
                  }}>버킷리스트에서 추가하기</button>
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

          {tab === 'todo' && (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {/* 입력 */}
              <div style={{ display:'flex', gap:8, marginBottom:4 }}>
                <input
                  value={newTodo}
                  onChange={e => setNewTodo(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddTodo()}
                  placeholder="할일 입력..."
                  style={{
                    flex:1, padding:'10px 14px', borderRadius:14, border:'1.5px solid rgba(0,131,143,0.2)',
                    fontSize:14, color:'#0D3349', background:'#fff', fontFamily:ff, outline:'none',
                  }}
                />
                <button onClick={handleAddTodo} style={{
                  background:'#00838F', border:'none', borderRadius:14,
                  padding:'10px 16px', fontSize:14, fontWeight:700, color:'#fff',
                  cursor:'pointer', fontFamily:ff, WebkitTapHighlightColor:'transparent',
                }}>+</button>
              </div>

              {dayTodos.length === 0 ? (
                <div style={{ textAlign:'center', padding:'20px 0', color:'#1565A0', fontSize:14 }}>
                  할일을 추가해보세요!
                </div>
              ) : dayTodos.map(todo => (
                <div key={todo.id} style={{ background:'#fff', borderRadius:14, padding:'12px 14px', display:'flex', alignItems:'center', gap:10, boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
                  <button onClick={() => handleToggleTodo(todo.id)} style={{
                    width:22, height:22, borderRadius:'50%', flexShrink:0,
                    border:`2px solid ${todo.done ? '#00838F' : '#ccc'}`,
                    background: todo.done ? '#00838F' : 'transparent',
                    cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
                    WebkitTapHighlightColor:'transparent',
                  }}>
                    {todo.done && <span style={{ fontSize:11, color:'#fff' }}>✓</span>}
                  </button>
                  <span style={{ flex:1, fontSize:14, color: todo.done ? '#aaa' : '#0D3349', textDecoration: todo.done ? 'line-through' : 'none' }}>{todo.text}</span>
                  <button onClick={() => handleDeleteTodo(todo.id)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:16, color:'#bbb', padding:4, WebkitTapHighlightColor:'transparent' }}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
