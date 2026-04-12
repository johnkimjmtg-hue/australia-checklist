// ─────────────────────────────────────────────
// NoteSheet.tsx
// src/components/NoteSheet.tsx
// ─────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { Icon } from '@iconify/react'
import { TripInfo } from '../store/state'

const ff = "-apple-system, 'Apple SD Gothic Neo', 'Pretendard', sans-serif"
const ACCENT = '#F97316'
const ACCENT_LIGHT = 'rgba(249,115,22,0.10)'
const STORAGE_KEY = 'app-notes'

type Note = {
  id: string
  title: string
  content: string
  date?: string  // 'YYYY-MM-DD'
  createdAt: number
  updatedAt: number
}

type View = 'list' | 'write' | 'detail'

type Props = { onClose: () => void; initialNoteId?: string; initialView?: 'list' | 'write'; trip?: TripInfo }

function getNotes(): Note[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') } catch { return [] }
}

function saveNotes(notes: Note[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(notes)) } catch {}
}

function fmtDate(ts: number) {
  const d = new Date(ts)
  return `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

export default function NoteSheet({ onClose, initialNoteId, initialView, trip }: Props) {
  const [view, setView] = useState<View>(initialView ?? 'list')
  const [notes, setNotes] = useState<Note[]>(getNotes)
  const [editNote, setEditNote] = useState<Note | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [noteDate, setNoteDate] = useState<string | undefined>(undefined)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [calYear, setCalYear] = useState(() => new Date().getFullYear())
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth())
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  useEffect(() => {
    if (initialNoteId) {
      const note = notes.find(n => n.id === initialNoteId)
      if (note) openWrite(note)
    }
  }, [])

  const openWrite = (note?: Note) => {
    if (note) {
      setEditNote(note)
      setTitle(note.title)
      setContent(note.content)
      setNoteDate(note.date)
      setView('detail')
    } else {
      setEditNote(null)
      setTitle('')
      setContent('')
      setNoteDate(undefined)
      setView('write')
    }
  }

  const saveNote = () => {
    if (!title.trim()) return
    if (editNote) {
      const next = notes.map(n => n.id === editNote.id
        ? { ...n, title: title.trim(), content, date: noteDate, updatedAt: Date.now() }
        : n
      )
      setNotes(next)
      saveNotes(next)
    } else {
      const newNote: Note = {
        id: `note_${Date.now()}`,
        title: title.trim(),
        content,
        date: noteDate,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      const next = [newNote, ...notes]
      setNotes(next)
      saveNotes(next)
    }
    setView('list')
  }

  const deleteNote = (id: string) => {
    const next = notes.filter(n => n.id !== id)
    setNotes(next)
    saveNotes(next)
    setDeleteConfirmId(null)
    if (view === 'detail') setView('list')
  }

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:800 }} />
      <div style={{
        position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)',
        width:'100%', maxWidth:430, background:'#ffffff',
        borderRadius:'20px 20px 0 0', height:'calc(100dvh - 20px)',
        zIndex:801, animation:'slideUpSheet 0.25s ease',
        boxShadow:'0 8px 32px rgba(0,0,0,0.20)',
        display:'flex', flexDirection:'column', fontFamily:ff,
      }}>
        <style>{`
          @keyframes slideUpSheet {
            from { transform: translateX(-50%) translateY(100%); }
            to   { transform: translateX(-50%) translateY(0); }
          }
        `}</style>

        {/* 헤더 */}
        <div style={{ flexShrink:0, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 16px 12px', borderBottom:`1px solid rgba(0,0,0,0.06)` }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            {(view === 'write' || view === 'detail') && (
              <button onClick={() => setView('list')} style={{ background:'none', border:'none', cursor:'pointer', padding:4, display:'flex', color: ACCENT }}>
                <Icon icon="ph:arrow-left" width={20} height={20} color={ACCENT} />
              </button>
            )}
            <div style={{ fontSize:16, fontWeight:800, color:'#0D3349' }}>
              {view === 'list' ? '📝 노트' : view === 'write' ? '새 노트' : editNote?.title ?? '노트'}
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            {view === 'list' && (
              <button onClick={() => openWrite()} style={{
                width:32, height:32, borderRadius:'50%',
                background: ACCENT_LIGHT, border:'none',
                display:'flex', alignItems:'center', justifyContent:'center',
                cursor:'pointer', WebkitTapHighlightColor:'transparent',
              }}>
                <Icon icon="ph:plus-bold" width={16} height={16} color={ACCENT} />
              </button>
            )}
            {(view === 'write' || view === 'detail') && (
              <button onClick={saveNote} disabled={!title.trim()} style={{
                height:32, padding:'0 14px', borderRadius:20,
                background: title.trim() ? ACCENT : 'rgba(0,0,0,0.08)',
                border:'none', color: title.trim() ? '#fff' : '#aaa',
                fontSize:13, fontWeight:700, cursor: title.trim() ? 'pointer' : 'default',
                WebkitTapHighlightColor:'transparent',
              }}>
                저장
              </button>
            )}
            {view === 'detail' && (
              <button onClick={() => setDeleteConfirmId(editNote!.id)} style={{
                width:32, height:32, borderRadius:'50%',
                background:'rgba(220,38,38,0.08)', border:'none',
                display:'flex', alignItems:'center', justifyContent:'center',
                cursor:'pointer', WebkitTapHighlightColor:'transparent',
              }}>
                <Icon icon="ph:trash" width={15} height={15} color="#DC2626" />
              </button>
            )}
            <button onClick={onClose} style={{ width:28, height:28, borderRadius:'50%', background:'rgba(0,0,0,0.08)', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', WebkitTapHighlightColor:'transparent' }}>
              <Icon icon="ph:x" width={16} height={16} color="#0D3349" />
            </button>
          </div>
        </div>

        {/* 내용 */}
        <div style={{ flex:1, overflowY:'auto' }}>

          {/* 목록 화면 */}
          {view === 'list' && (
            <div style={{ padding:'12px 16px 40px' }}>
              {notes.length === 0 ? (
                <div style={{ textAlign:'center', padding:'60px 0', color:'#94A3B8' }}>
                  <Icon icon="ph:note" width={48} height={48} color="#CBD5E1" />
                  <div style={{ fontSize:14, marginTop:12 }}>아직 노트가 없어요</div>
                  <div style={{ fontSize:12, marginTop:4, color:'#CBD5E1' }}>+ 버튼을 눌러 추가해보세요</div>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {notes.map(note => (
                    <div key={note.id} onClick={() => openWrite(note)} style={{
                      display:'flex', alignItems:'center', gap:10,
                      padding:'12px 4px', borderBottom:'1px solid rgba(0,0,0,0.06)',
                      cursor:'pointer', WebkitTapHighlightColor:'transparent',
                    }}>
                      <Icon icon="ph:note" width={16} height={16} color={ACCENT} style={{ flexShrink:0 }} />
                      <div style={{ fontSize:14, fontWeight:500, color:'#0D3349', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{note.title}</div>
                      <Icon icon="ph:caret-right" width={14} height={14} color="#CBD5E1" style={{ flexShrink:0 }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 작성/수정 화면 */}
          {(view === 'write' || view === 'detail') && (
            <div style={{ padding:'16px 16px 40px', display:'flex', flexDirection:'column', gap:12 }}>
              {view === 'write' && (
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="제목을 입력하세요"
                  autoFocus
                  style={{
                    width:'100%', height:48, borderRadius:12,
                    border:`1.5px solid ${title ? ACCENT : 'rgba(0,0,0,0.1)'}`,
                    outline:'none', padding:'0 14px',
                    fontSize:15, fontWeight:700, color:'#0D3349',
                    background:'#F8FAFC', fontFamily:ff, boxSizing:'border-box',
                    transition:'border 0.2s',
                  }}
                />
              )}
              {/* 달력에 추가 */}
              <div>
                <button onClick={() => setShowDatePicker(v => !v)} style={{
                  height:36, padding:'0 14px', borderRadius:20, border:`1.5px solid ${noteDate ? ACCENT : 'rgba(0,0,0,0.1)'}`,
                  background: noteDate ? ACCENT_LIGHT : '#F8FAFC',
                  color: noteDate ? ACCENT : '#94A3B8',
                  fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:ff,
                  display:'flex', alignItems:'center', gap:6, WebkitTapHighlightColor:'transparent',
                }}>
                  <Icon icon="ph:calendar" width={14} height={14} color={noteDate ? ACCENT : '#94A3B8'} />
                  {noteDate ? noteDate : '달력에 추가'}
                  {noteDate && (
                    <span onClick={e => { e.stopPropagation(); setNoteDate(undefined) }} style={{ marginLeft:2, color:'#DC2626', fontWeight:900 }}>×</span>
                  )}
                </button>
                {showDatePicker && (() => {
                  const today = new Date()
                  const firstDay = new Date(calYear, calMonth, 1).getDay()
                  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate()
                  const MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']
                  const chgMo = (d: number) => {
                    let ny = calYear, nm = calMonth + d
                    if (nm > 11) { nm = 0; ny++ }
                    if (nm < 0) { nm = 11; ny-- }
                    setCalYear(ny); setCalMonth(nm)
                  }
                  const cells = []
                  for (let i = 0; i < firstDay; i++) cells.push(<div key={`e${i}`} />)
                  for (let d = 1; d <= daysInMonth; d++) {
                    const dt = new Date(calYear, calMonth, d)
                    const dateStr = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
                    const isSel = noteDate === dateStr
                    const isToday = dt.toDateString() === today.toDateString()
                    cells.push(
                      <div key={d} onClick={() => { setNoteDate(isSel ? undefined : dateStr); setShowDatePicker(false) }}
                        style={{
                          aspectRatio:'1', display:'flex', alignItems:'center', justifyContent:'center',
                          borderRadius:'50%', fontSize:13, cursor:'pointer',
                          background: isSel ? ACCENT : 'transparent',
                          color: isSel ? '#fff' : isToday ? ACCENT : '#0D3349',
                          fontWeight: isSel ? 800 : isToday ? 800 : 400,
                          textDecoration: isToday && !isSel ? 'underline' : 'none',
                          textDecorationColor: '#D4703A',
                          textUnderlineOffset: '3px',
                          WebkitTapHighlightColor:'transparent',
                        }}>{d}</div>
                    )
                  }
                  return (
                    <div style={{ marginTop:10, background:'#ffffff', borderRadius:18, padding:'14px 12px', border:'1px solid rgba(0,0,0,0.08)', boxShadow:'0 4px 16px rgba(0,0,0,0.10)' }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                        <button onClick={() => chgMo(-1)} style={{ background:'none', border:'none', fontSize:18, color:'#0D4F6E', cursor:'pointer', padding:'2px 8px' }}>‹</button>
                        <div style={{ fontSize:14, fontWeight:700, color:'#0D3349' }}>
                          <span style={{ color: ACCENT }}>{calYear}년</span> · {MONTHS[calMonth]}
                        </div>
                        <button onClick={() => chgMo(1)} style={{ background:'none', border:'none', fontSize:18, color:'#0D4F6E', cursor:'pointer', padding:'2px 8px' }}>›</button>
                      </div>
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', marginBottom:4 }}>
                        {['일','월','화','수','목','금','토'].map(d => (
                          <div key={d} style={{ textAlign:'center', fontSize:11, color:'#1565A0', fontWeight:600, padding:'2px 0' }}>{d}</div>
                        ))}
                      </div>
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2 }}>
                        {cells}
                      </div>
                    </div>
                  )
                })()}
              </div>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="내용을 입력하세요..."
                style={{
                  width:'100%', minHeight: view === 'write' ? 240 : 120, borderRadius:12,
                  border:`1.5px solid rgba(0,0,0,0.06)`,
                  outline:'none', padding:'12px 14px',
                  fontSize:14, color:'#0D3349',
                  background:'#F8FAFC', fontFamily:ff,
                  resize:'none', lineHeight:1.7, boxSizing:'border-box',
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* 삭제 확인 팝업 */}
      {deleteConfirmId && (
        <>
          <div onClick={() => setDeleteConfirmId(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1200 }} />
          <div style={{
            position:'fixed', bottom:16, left:'50%', transform:'translateX(-50%)',
            width:'calc(100% - 32px)', maxWidth:398, background:'#ffffff',
            borderRadius:20, zIndex:1201, padding:'24px 20px',
            boxShadow:'0 8px 32px rgba(0,0,0,0.18)', fontFamily:ff,
          }}>
            <div style={{ fontSize:16, fontWeight:800, color:'#0F172A', marginBottom:8, textAlign:'center' }}>노트를 삭제할까요?</div>
            <div style={{ fontSize:13, color:'#64748B', marginBottom:24, textAlign:'center' }}>삭제된 노트는 복구할 수 없어요.</div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => setDeleteConfirmId(null)} style={{ flex:1, height:48, borderRadius:12, border:'1px solid rgba(0,0,0,0.1)', background:'#F8FAFC', color:'#64748B', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:ff }}>취소</button>
              <button onClick={() => deleteNote(deleteConfirmId)} style={{ flex:1, height:48, borderRadius:12, border:'none', background:'#DC2626', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:ff }}>삭제</button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
