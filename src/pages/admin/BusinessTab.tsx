// ─────────────────────────────────────────────
// BusinessTab.tsx
// src/pages/admin/BusinessTab.tsx
// ─────────────────────────────────────────────
import { useState, useEffect, useRef } from 'react'
import { Icon } from '@iconify/react'
import { CATEGORIES } from '../../data/businesses'
import { Business, getBusinesses, createBusiness, updateBusiness, toggleFeatured } from '../../lib/businessService'
import { supabase } from '../../lib/supabase'
import { inputStyle, btnPrimary, btnGhost, btnSmDanger, Card, SectionTitle, Field, Grid2, Toast, Confirm } from './adminShared'

const EMPTY_FORM = {
  id: '', name: '', category: 'realestate', description: '',
  phone: '', website: '', kakao: '', address: '', city: '',
  is_featured: false, is_active: true, tags: '', google_place_id: '',
}

const GOOGLE_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY
let _mapsPromise: Promise<void> | null = null
function loadGoogleMaps(): Promise<void> {
  if (_mapsPromise) return _mapsPromise
  _mapsPromise = new Promise((resolve, reject) => {
    if ((window as any).google?.maps?.places) { resolve(); return }
    const existing = document.querySelector('script[src*="maps.googleapis.com"]')
    if (existing) {
      const check = setInterval(() => {
        if ((window as any).google?.maps?.places) { clearInterval(check); resolve() }
      }, 100)
      return
    }
    const s = document.createElement('script')
    s.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_KEY}&libraries=places&v=weekly`
    s.onload = () => setTimeout(() => resolve(), 300)
    s.onerror = () => reject(new Error('Google Maps 로드 실패'))
    document.head.appendChild(s)
  })
  return _mapsPromise
}

function AddressAutocomplete({ address, city, onSelect }: {
  address: string; city: string; onSelect: (address: string, city: string) => void
}) {
  const [query, setQuery] = useState(address || '')
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [manual, setManual] = useState(false)
  const [manualCity, setManualCity] = useState(city || '')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { setQuery(address || ''); setManualCity(city || '') }, [address, city])

  async function handleInput(val: string) {
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!val.trim() || val.length < 3) { setSuggestions([]); return }
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        await loadGoogleMaps()
        const places = (window as any).google.maps.places
        const AutocompleteSuggestion = places.AutocompleteSuggestion || places.autocomplete?.AutocompleteSuggestion
        if (!AutocompleteSuggestion) throw new Error('AutocompleteSuggestion not available')
        const { suggestions: results } = await AutocompleteSuggestion.fetchAutocompleteSuggestions({ input: val, includedRegionCodes: ['au'] })
        setSuggestions(results || [])
      } catch { setSuggestions([]) } finally { setLoading(false) }
    }, 400)
  }

  async function handleSelect(suggestion: any) {
    setSuggestions([])
    try {
      const place = suggestion.placePrediction.toPlace()
      await place.fetchFields({ fields: ['addressComponents', 'formattedAddress'] })
      const components = place.addressComponents || []
      const addr = components.find((c: any) => c.types.includes('locality') || c.types.includes('sublocality_level_1'))?.longText || ''
      const state = components.find((c: any) => c.types.includes('administrative_area_level_1'))?.shortText || ''
      const post  = components.find((c: any) => c.types.includes('postal_code'))?.longText || ''
      const streetNum = components.find((c: any) => c.types.includes('street_number'))?.longText || ''
      const route = components.find((c: any) => c.types.includes('route'))?.longText || ''
      const streetAddress = [streetNum, route, addr, state, post].filter(Boolean).join(', ')
      setQuery(streetAddress); setManualCity(addr); onSelect(streetAddress, addr)
    } catch (e) { console.error('Place detail error:', e) }
  }

  if (manual) return (
    <div>
      <input value={query} onChange={e => { setQuery(e.target.value); onSelect(e.target.value, manualCity) }} style={inputStyle} placeholder="예: 123 George Street, Chatswood NSW 2067" />
      <input value={manualCity} onChange={e => { setManualCity(e.target.value); onSelect(query, e.target.value) }} style={{ ...inputStyle, marginTop: 6 }} placeholder="Suburb 예: Chatswood" />
      <button onClick={() => setManual(false)} style={{ fontSize: 11, color: '#1E4D83', background: 'none', border: 'none', cursor: 'pointer', marginTop: 4, fontWeight: 700 }}>🔍 자동검색으로 전환</button>
    </div>
  )

  return (
    <div style={{ position: 'relative' }}>
      <input value={query} onChange={e => handleInput(e.target.value)} style={inputStyle} placeholder="주소 입력 (예: 123 George St Chatswood)" />
      {loading && <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>🔍 검색 중...</div>}
      {suggestions.length > 0 && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, background: '#fff', borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.12)', border: '1px solid #e0e0e0', overflow: 'hidden', marginTop: 4 }}>
          {suggestions.map((s: any, i: number) => (
            <div key={i} onClick={() => handleSelect(s)}
              style={{ padding: '10px 14px', fontSize: 13, cursor: 'pointer', borderBottom: '1px solid #f3f3f3', color: '#333' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f0f4ff')}
              onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
              📍 {s.placePrediction?.text?.text || ''}
            </div>
          ))}
        </div>
      )}
      {city && <div style={{ marginTop: 6, fontSize: 12, color: '#1E4D83', fontWeight: 700 }}>📌 Suburb: {city}</div>}
      <button onClick={() => setManual(true)} style={{ fontSize: 11, color: '#aaa', background: 'none', border: 'none', cursor: 'pointer', marginTop: 4, fontWeight: 700 }}>✏️ 직접 입력</button>
    </div>
  )
}

function ReviewManager({ businessId, onRefresh, showToast }: { businessId: string; onRefresh: () => void; showToast: (msg: string) => void }) {
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => { loadReviews() }, [businessId])

  async function loadReviews() {
    setLoading(true)
    const { data } = await supabase.from('reviews').select('*').eq('business_id', businessId).order('created_at', { ascending: false })
    setReviews(data || [])
    setLoading(false)
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('reviews').delete().eq('id', id)
    if (!error) { showToast('🗑 리뷰 삭제 완료'); setReviews(prev => prev.filter(r => r.id !== id)); await onRefresh() }
    else showToast('❌ 삭제 실패')
    setDeleteId(null)
  }

  return (
    <>
      {deleteId && <Confirm msg="이 리뷰를 삭제할까요?" onOk={() => handleDelete(deleteId)} onCancel={() => setDeleteId(null)} danger />}
      <Card>
        <SectionTitle>⭐ 리뷰 관리 ({reviews.length})</SectionTitle>
        {loading ? <div style={{ color: '#aaa', fontSize: 13, textAlign: 'center', padding: '12px 0' }}>불러오는 중...</div>
          : reviews.length === 0 ? <div style={{ color: '#ccc', fontSize: 13, textAlign: 'center', padding: '12px 0' }}>리뷰가 없어요</div>
          : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {reviews.map(r => (
                <div key={r.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', background: '#f8fafd', borderRadius: 10, border: '1px solid #eee' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#0F1B2D' }}>{r.author_name}</span>
                      <span style={{ fontSize: 12, color: '#f5a623' }}>{'⭐'.repeat(r.rating)}</span>
                      <span style={{ fontSize: 11, color: '#bbb' }}>{r.created_at ? new Date(r.created_at).toLocaleDateString('ko-KR') : ''}</span>
                    </div>
                    <p style={{ fontSize: 12, color: '#555', margin: 0, lineHeight: 1.6 }}>{r.content}</p>
                  </div>
                  <button onClick={() => setDeleteId(r.id)} style={{ ...btnSmDanger, flexShrink: 0 }}>🗑</button>
                </div>
              ))}
            </div>
          )}
      </Card>
    </>
  )
}

export default function BusinessTab() {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [editTarget, setEditTarget] = useState<Business | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [toast, setToast] = useState('')
  const [bizSearch, setBizSearch] = useState('')
  const [bizCat, setBizCat] = useState('all')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const PAGE = 1000; let all: Business[] = []; let from = 0
    while (true) {
      const { data, error } = await supabase.from('businesses').select('*').order('name').range(from, from + PAGE - 1)
      if (error || !data || data.length === 0) break
      all = [...all, ...data]
      if (data.length < PAGE) break
      from += PAGE
    }
    setBusinesses(all); setLoading(false)
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 2500) }
  function openNew() { setForm(EMPTY_FORM); setEditTarget(null); setShowForm(true) }
  function openEdit(b: Business) {
    setForm({ id: b.id, name: b.name, category: b.category, description: b.description || '', phone: b.phone || '', website: b.website || '', kakao: b.kakao || '', address: b.address || '', city: b.city, is_featured: b.is_featured, is_active: b.is_active, tags: b.tags?.join(', ') || '', google_place_id: b.google_place_id || '' })
    setEditTarget(b); setShowForm(true)
  }

  async function save() {
    if (!form.name) { showToast('업체명은 필수예요'); return }
    setSaving(true)
    const cityVal = form.city || form.address.split(',').find(p => /[A-Z]{2,3}/.test(p.trim()) === false && p.trim().length > 2)?.trim() || ''
    const payload = { ...form, city: cityVal, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean), rating: 0, reviews_count: 0 }
    if (editTarget) {
      const result = await updateBusiness(editTarget.id, payload)
      if (result) showToast('✅ 수정 완료')
      else { showToast('❌ 수정 실패'); setSaving(false); return }
    } else {
      const id = 'biz-' + Date.now()
      const result = await createBusiness({ ...payload, id })
      if (result) showToast('✅ 등록 완료')
      else { showToast('❌ 등록 실패'); setSaving(false); return }
    }
    await load(); setSaving(false); setShowForm(false)
  }

  async function handleDelete(id: string) {
    await supabase.from('businesses').delete().eq('id', id)
    showToast('🗑 삭제 완료'); setDeleteId(null); await load()
  }
  async function handleToggle(id: string, cur: boolean) {
    await toggleFeatured(id, !cur); showToast(cur ? '추천 해제' : '⭐ 추천 설정'); await load()
  }
  async function handleKoreanToggle(id: string, cur: boolean) {
    await supabase.from('businesses').update({ is_korean: !cur }).eq('id', id)
    showToast(!cur ? '🇰🇷 한인업체 설정' : '한인업체 해제'); await load()
  }

  return (
    <>
      {toast && <Toast msg={toast} />}
      {deleteId && <Confirm msg="정말 삭제할까요?" onOk={() => handleDelete(deleteId)} onCancel={() => setDeleteId(null)} danger />}

      {showForm ? (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <button onClick={() => setShowForm(false)} style={{ ...btnGhost, display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px' }}>
              <Icon icon="ph:arrow-left" width={15} height={15} /> 목록
            </button>
            <h2 style={{ fontSize: 16, fontWeight: 900, color: '#0F172A', margin: 0 }}>{editTarget ? '업체 수정' : '업체 등록'}</h2>
          </div>
          <Card>
            <Grid2>
              <Field label="업체명 *"><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} placeholder="예: Palas Property" /></Field>
              <Field label="카테고리">
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={inputStyle}>
                  {CATEGORIES.filter(c => c.id !== 'all').map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
                </select>
              </Field>
            </Grid2>
            <Field label="주소 검색">
              <AddressAutocomplete address={form.address} city={form.city} onSelect={(address, city) => setForm(f => ({ ...f, address, city }))} />
            </Field>
            <Field label="업체 소개"><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ ...inputStyle, resize: 'none' }} rows={3} /></Field>
            <Field label="태그 (쉼표 구분)"><input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} style={inputStyle} placeholder="예: 부동산 구매, 투자 상담" /></Field>
            <Grid2>
              <Field label="전화번호"><input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} style={inputStyle} placeholder="+61 2 1234 5678" /></Field>
              <Field label="카카오 ID"><input value={form.kakao} onChange={e => setForm(f => ({ ...f, kakao: e.target.value }))} style={inputStyle} /></Field>
            </Grid2>
            <Field label="웹사이트"><input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} style={inputStyle} placeholder="https://..." /></Field>
            <Field label="Google Place ID">
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={form.google_place_id} onChange={e => setForm(f => ({ ...f, google_place_id: e.target.value }))} style={{ ...inputStyle, flex: 1, margin: 0 }} placeholder="ChIJ..." />
                {editTarget && (
                  <button onClick={async () => { await supabase.from('businesses').update({ google_rating: null, google_review_count: null }).eq('id', editTarget.id); showToast('별점 초기화 완료') }}
                    style={{ height: 40, padding: '0 12px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#FFF7ED', color: '#D97706', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>⭐ 별점 초기화</button>
                )}
                {editTarget && (
                  <button onClick={async () => { await supabase.from('businesses').update({ latitude: null, longitude: null }).eq('id', editTarget.id); showToast('좌표 초기화 완료') }}
                    style={{ height: 40, padding: '0 12px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#F0FDF4', color: '#16A34A', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>📍 좌표 초기화</button>
                )}
              </div>
            </Field>
            <div style={{ display: 'flex', gap: 20, marginTop: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: '#1B6EF3', cursor: 'pointer', padding: '8px 0' }}>
                <input type="checkbox" checked={form.is_featured} onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))} /> ⭐ 추천 업체
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: '#1B6EF3', cursor: 'pointer', padding: '8px 0' }}>
                <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} /> ✅ 활성화
              </label>
            </div>
            <button onClick={save} disabled={saving} style={{ ...btnPrimary, marginTop: 16, width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon icon={saving ? 'ph:spinner' : 'ph:check'} width={16} height={16} />
              {saving ? '저장 중...' : editTarget ? '수정 완료' : '등록하기'}
            </button>
          </Card>
          {editTarget && <ReviewManager businessId={editTarget.id} onRefresh={load} showToast={showToast} />}
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 13, color: '#64748B', fontWeight: 700 }}>총 {businesses.length}개 업체</span>
            <button onClick={openNew} style={{ ...btnPrimary, padding: '9px 16px', fontSize: 13 }}>+ 등록</button>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input value={bizSearch} onChange={e => setBizSearch(e.target.value)} placeholder="업체명 검색..." style={{ ...inputStyle, flex: 1, margin: 0 }} />
            <select value={bizCat} onChange={e => setBizCat(e.target.value)} style={{ ...inputStyle, width: 130, margin: 0, flexShrink: 0 }}>
              <option value="all">전체 카테고리</option>
              {CATEGORIES.filter(c => c.id !== 'all').map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
            </select>
          </div>
          {loading ? <div style={{ textAlign: 'center', padding: 40, color: '#aaa' }}>불러오는 중...</div> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {businesses.filter(b => (bizCat === 'all' || b.category === bizCat) && (!bizSearch || b.name.toLowerCase().includes(bizSearch.toLowerCase()))).map(b => (
                <Card key={b.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div>
                      <span style={{ fontSize: 15, fontWeight: 900, color: '#0F172A' }}>{b.name}</span>
                      {b.is_featured && <span style={{ marginLeft: 6, fontSize: 10, background: '#1E4D83', color: '#fff', borderRadius: 10, padding: '2px 8px', fontWeight: 800 }}>추천</span>}
                      {b.is_korean && <span style={{ marginLeft: 6, fontSize: 10, background: '#FFF7ED', color: '#EA580C', borderRadius: 10, padding: '2px 8px', fontWeight: 800, border: '1px solid #FED7AA' }}>🇰🇷 한인</span>}
                      {!b.is_active && <span style={{ marginLeft: 6, fontSize: 10, background: '#e8420a', color: '#fff', borderRadius: 10, padding: '2px 8px', fontWeight: 800 }}>비활성</span>}
                    </div>
                    <span style={{ fontSize: 11, color: '#8AAAC8' }}>{CATEGORIES.find(c => c.id === b.category)?.emoji} {CATEGORIES.find(c => c.id === b.category)?.label}</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#7a8fb5', marginBottom: 12 }}>📍 {b.city} · ⭐ {b.rating} ({b.reviews_count})</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => openEdit(b)} style={{ ...btnGhost, flex: 1, padding: '7px' }}>✏️ 수정</button>
                    <button onClick={() => handleKoreanToggle(b.id, !!b.is_korean)} style={{ flex: 1, padding: '7px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 800, fontSize: 12, background: b.is_korean ? 'rgba(234,88,12,0.1)' : 'rgba(200,218,248,0.3)', color: b.is_korean ? '#EA580C' : '#64748B' }}>{b.is_korean ? '🇰🇷 한인해제' : '🇰🇷 한인설정'}</button>
                    <button onClick={() => handleToggle(b.id, b.is_featured)} style={{ flex: 1, padding: '7px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 800, fontSize: 12, background: b.is_featured ? 'rgba(255,220,50,0.2)' : 'rgba(200,218,248,0.3)', color: b.is_featured ? '#b8860b' : '#1E4D83' }}>{b.is_featured ? '⭐ 추천해제' : '☆ 추천설정'}</button>
                    <button onClick={() => setDeleteId(b.id)} style={{ padding: '7px 12px', background: 'rgba(232,66,10,0.08)', border: 'none', borderRadius: 8, color: '#e8420a', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>🗑</button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </>
  )
}
