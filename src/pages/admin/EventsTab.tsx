// ─────────────────────────────────────────────
// EventsTab.tsx
// src/pages/admin/EventsTab.tsx
// 호주 주요 행사 관리 (달력 표시용)
// ─────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { Icon } from '@iconify/react'
import { supabase } from '../../lib/supabase'
import { inputStyle, btnPrimary, btnGhost, btnSmDanger, Card, SectionTitle, Toast, uploadToCloudinary } from './adminShared'

interface Event {
  id: string
  title: string
  city: 'sydney' | 'melbourne' | 'both'
  category: string
  start_date: string
  end_date: string
  description: string | null
  image_url: string | null
  website_url: string | null
  is_active: boolean
  sort_order: number
}

const EMPTY_FORM: Omit<Event, 'id'> = {
  title: '', city: 'sydney', category: 'festival',
  start_date: '', end_date: '',
  description: '', image_url: null, website_url: '',
  is_active: true, sort_order: 0,
}

const CATEGORIES = [
  { id: 'festival', label: '🎉 축제' },
  { id: 'sports',   label: '🏆 스포츠' },
  { id: 'nature',   label: '🌿 자연/계절' },
  { id: 'culture',  label: '🎭 문화/예술' },
  { id: 'food',     label: '🍽 음식/음료' },
]

const CITY_OPTIONS = [
  { id: 'sydney',    label: '🏙 시드니' },
  { id: 'melbourne', label: '🌆 멜번' },
  { id: 'both',      label: '🇦🇺 전국' },
]

export default function EventsTab() {
  const [events, setEvents]     = useState<Event[]>([])
  const [loading, setLoading]   = useState(true)
  const [view, setView]         = useState<'list' | 'form'>('list')
  const [editing, setEditing]   = useState<Event | null>(null)
  const [form, setForm]         = useState<Omit<Event, 'id'>>(EMPTY_FORM)
  const [saving, setSaving]     = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [toast, setToast]       = useState('')
  const [filterCity, setFilterCity] = useState<string>('all')
  const [imgFile, setImgFile]   = useState<File | null>(null)
  const [imgPreview, setImgPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 2500) }

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('events').select('*').order('start_date')
    setEvents((data as Event[]) ?? [])
    setLoading(false)
  }

  function openNew() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setImgFile(null)
    setImgPreview(null)
    setView('form')
  }

  function openEdit(e: Event) {
    setEditing(e)
    setForm({ title: e.title, city: e.city, category: e.category, start_date: e.start_date, end_date: e.end_date, description: e.description ?? '', image_url: e.image_url, website_url: e.website_url ?? '', is_active: e.is_active, sort_order: e.sort_order })
    setImgPreview(e.image_url)
    setImgFile(null)
    setView('form')
  }

  async function handleSave() {
    if (!form.title.trim()) { showToast('행사명을 입력해주세요'); return }
    if (!form.start_date || !form.end_date) { showToast('날짜를 입력해주세요'); return }
    setSaving(true)

    let imageUrl = form.image_url
    if (imgFile) {
      try {
        setUploading(true)
        imageUrl = await uploadToCloudinary(imgFile, 'events')
        setUploading(false)
      } catch {
        showToast('이미지 업로드 실패')
        setSaving(false)
        setUploading(false)
        return
      }
    }

    const payload = { ...form, image_url: imageUrl }

    if (editing) {
      const { error } = await supabase.from('events').update(payload).eq('id', editing.id)
      if (error) { showToast('❌ 수정 실패: ' + error.message); setSaving(false); return }
      showToast('✅ 수정 완료')
    } else {
      const { error } = await supabase.from('events').insert(payload)
      if (error) { showToast('❌ 등록 실패: ' + error.message); setSaving(false); return }
      showToast('✅ 등록 완료')
    }

    await load()
    setSaving(false)
    setView('list')
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('events').delete().eq('id', id)
    if (error) { showToast('❌ 삭제 실패'); return }
    showToast('🗑 삭제 완료')
    setDeleteId(null)
    await load()
  }

  async function handleToggleActive(id: string, current: boolean) {
    await supabase.from('events').update({ is_active: !current }).eq('id', id)
    setEvents(prev => prev.map(e => e.id === id ? { ...e, is_active: !current } : e))
    showToast(!current ? '✅ 활성화' : '비활성화')
  }

  const filtered = filterCity === 'all' ? events : events.filter(e => e.city === filterCity || e.city === 'both')

  // 폼 뷰
  if (view === 'form') return (
    <div>
      {toast && <Toast msg={toast} />}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <button onClick={() => setView('list')} style={{ ...btnGhost, display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px' }}>
          <Icon icon="ph:arrow-left" width={15} height={15} /> 목록
        </button>
        <h2 style={{ fontSize: 16, fontWeight: 900, color: '#0F172A', margin: 0 }}>{editing ? '행사 수정' : '행사 등록'}</h2>
      </div>

      <Card>
        {/* 이미지 */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#1B6EF3', marginBottom: 6 }}>이미지 (선택)</div>
          <label style={{ cursor: 'pointer', display: 'block' }}>
            <div style={{ width: '100%', height: 160, borderRadius: 10, overflow: 'hidden', background: imgPreview ? 'none' : '#F1F5F9', border: '2px dashed #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {imgPreview
                ? <img src={imgPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ textAlign: 'center', color: '#94A3B8' }}><Icon icon="ph:camera-plus" width={28} height={28} color="#CBD5E1" /><div style={{ fontSize: 11, marginTop: 4 }}>이미지 업로드 (없으면 설명만 표시)</div></div>
              }
            </div>
            <input type="file" accept="image/*" style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) { setImgFile(f); setImgPreview(URL.createObjectURL(f)) } }} />
          </label>
          {imgPreview && (
            <button onClick={() => { setImgFile(null); setImgPreview(null); setForm(f => ({ ...f, image_url: null })) }}
              style={{ marginTop: 6, fontSize: 11, color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer' }}>🗑 이미지 제거</button>
          )}
        </div>

        {/* 행사명 */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#1B6EF3', marginBottom: 6 }}>행사명 *</div>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={inputStyle} placeholder="예: 비비드 시드니 (Vivid Sydney)" />
        </div>

        {/* 도시 */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#1B6EF3', marginBottom: 6 }}>도시</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {CITY_OPTIONS.map(c => (
              <button key={c.id} onClick={() => setForm(f => ({ ...f, city: c.id as any }))}
                style={{ flex: 1, height: 38, borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, background: form.city === c.id ? '#1B6EF3' : '#F1F5F9', color: form.city === c.id ? '#fff' : '#475569' }}>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* 카테고리 */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#1B6EF3', marginBottom: 6 }}>카테고리</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {CATEGORIES.map(c => (
              <button key={c.id} onClick={() => setForm(f => ({ ...f, category: c.id }))}
                style={{ padding: '7px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, background: form.category === c.id ? '#1B6EF3' : '#F1F5F9', color: form.category === c.id ? '#fff' : '#475569' }}>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* 날짜 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#1B6EF3', marginBottom: 6 }}>시작일 *</div>
            <input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} style={inputStyle} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#1B6EF3', marginBottom: 6 }}>종료일 *</div>
            <input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} style={inputStyle} />
          </div>
        </div>

        {/* 설명 */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#1B6EF3', marginBottom: 6 }}>설명</div>
          <textarea value={form.description ?? ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ ...inputStyle, resize: 'vertical' }} rows={5} placeholder="행사 설명 (달력 팝업에 표시됩니다)" />
        </div>

        {/* 웹사이트 */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#1B6EF3', marginBottom: 6 }}>공식 홈페이지 URL (선택)</div>
          <input value={form.website_url ?? ''} onChange={e => setForm(f => ({ ...f, website_url: e.target.value }))} style={inputStyle} placeholder="https://..." />
        </div>

        {/* 정렬 순서 */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#1B6EF3', marginBottom: 6 }}>정렬 순서</div>
          <input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))} style={{ ...inputStyle, width: 100 }} />
        </div>

        {/* 활성화 */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: '#1B6EF3', cursor: 'pointer', padding: '8px 0', marginBottom: 16 }}>
          <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} /> ✅ 활성화 (달력에 표시)
        </label>

        <button onClick={handleSave} disabled={saving}
          style={{ ...btnPrimary, width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon icon={saving ? 'ph:spinner' : 'ph:check'} width={16} height={16} />
          {uploading ? '이미지 업로드 중...' : saving ? '저장 중...' : editing ? '수정 완료' : '등록하기'}
        </button>
      </Card>
    </div>
  )

  // 목록 뷰
  return (
    <div>
      {toast && <Toast msg={toast} />}
      {deleteId && (
        <>
          <div onClick={() => setDeleteId(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 900 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#fff', borderRadius: 14, padding: '24px 20px', zIndex: 901, width: 'calc(100% - 48px)', maxWidth: 300, textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🗑️</div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>행사를 삭제할까요?</div>
            <div style={{ fontSize: 12, color: '#64748B', marginBottom: 20 }}>삭제된 행사는 복구되지 않아요.</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setDeleteId(null)} style={{ flex: 1, height: 44, border: '1px solid #E2E8F0', borderRadius: 8, background: '#fff', color: '#64748B', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>취소</button>
              <button onClick={() => handleDelete(deleteId)} style={{ flex: 2, height: 44, border: 'none', borderRadius: 8, background: '#DC2626', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>삭제하기</button>
            </div>
          </div>
        </>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 13, color: '#64748B', fontWeight: 700 }}>총 {events.length}개 행사</span>
        <button onClick={openNew} style={{ ...btnPrimary, padding: '9px 16px', fontSize: 13 }}>+ 등록</button>
      </div>

      {/* 도시 필터 */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {[{ id: 'all', label: '전체' }, ...CITY_OPTIONS].map(c => (
          <button key={c.id} onClick={() => setFilterCity(c.id)}
            style={{ padding: '6px 12px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, background: filterCity === c.id ? '#1B6EF3' : '#F1F5F9', color: filterCity === c.id ? '#fff' : '#475569' }}>
            {c.label}
          </button>
        ))}
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: 40, color: '#aaa' }}>불러오는 중...</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(event => {
            const catInfo = CATEGORIES.find(c => c.id === event.category)
            const cityInfo = CITY_OPTIONS.find(c => c.id === event.city)
            return (
              <div key={event.id} style={{ background: '#fff', borderRadius: 12, padding: '12px 14px', border: '1px solid #E2E8F0', display: 'flex', gap: 12, alignItems: 'center' }}>
                {/* 썸네일 */}
                <div style={{ width: 52, height: 52, borderRadius: 8, flexShrink: 0, overflow: 'hidden', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {event.image_url
                    ? <img src={event.image_url} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <Icon icon="ph:calendar-check" width={22} height={22} color="#CBD5E1" />
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>{event.title}</span>
                    {!event.is_active && <span style={{ fontSize: 9, background: '#F1F5F9', color: '#94A3B8', padding: '1px 5px', borderRadius: 4, fontWeight: 700 }}>비활성</span>}
                  </div>
                  <div style={{ fontSize: 11, color: '#94A3B8' }}>
                    {cityInfo?.label} · {catInfo?.label} · {event.start_date} ~ {event.end_date}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button onClick={() => handleToggleActive(event.id, event.is_active)}
                    style={{ background: event.is_active ? '#DCFCE7' : '#F1F5F9', border: 'none', borderRadius: 7, padding: '6px 8px', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: event.is_active ? '#16A34A' : '#94A3B8' }}>
                    {event.is_active ? '✅' : '⬜'}
                  </button>
                  <button onClick={() => openEdit(event)}
                    style={{ background: '#F1F5F9', border: 'none', borderRadius: 7, padding: '6px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#475569' }}>수정</button>
                  <button onClick={() => setDeleteId(event.id)} style={{ ...btnSmDanger, minHeight: 'auto', padding: '6px 10px' }}>삭제</button>
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && <div style={{ textAlign: 'center', padding: '40px', color: '#94A3B8', fontSize: 13 }}>행사가 없어요</div>}
        </div>
      )}
    </div>
  )
}
