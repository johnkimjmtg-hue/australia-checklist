// ─────────────────────────────────────────────
// BingoTab.tsx
// src/pages/admin/BingoTab.tsx
// ─────────────────────────────────────────────
import { useState, useEffect, useRef } from 'react'
import { Icon } from '@iconify/react'
import { supabase } from '../../lib/supabase'
import { uploadToCloudinary } from './adminShared'

type BingoCafe = { id: string; city: string; sort_order: number; name: string; business_id: string | null; is_active: boolean; image_url: string | null }
type Business  = { id: string; name: string }

export default function BingoTab() {
  const [cafes, setCafes]           = useState<BingoCafe[]>([])
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading]       = useState(true)
  const [city, setCity]             = useState<'melbourne' | 'sydney'>('melbourne')
  const [saving, setSaving]         = useState<string | null>(null)
  const [editName, setEditName]     = useState<Record<string, string>>({})
  const [bizSearch, setBizSearch]   = useState<Record<string, string>>({})
  const [uploadingImg, setUploadingImg] = useState<string | null>(null)
  const imgInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  useEffect(() => {
    const load = async () => {
      const PAGE = 1000; let allBiz: { id: string; name: string }[] = []; let from = 0
      while (true) {
        const { data, error } = await supabase.from('businesses').select('id, name').eq('is_active', true).order('name').range(from, from + PAGE - 1)
        if (error || !data || data.length === 0) break
        allBiz = [...allBiz, ...data]
        if (data.length < PAGE) break
        from += PAGE
      }
      const { data: cafeData } = await supabase.from('bingo_cafes').select('*').order('city').order('sort_order')
      if (cafeData) setCafes(cafeData)
      setBusinesses(allBiz); setLoading(false)
    }
    load()
  }, [])

  const handleBusinessLink = async (cafeId: string, businessId: string) => {
    setSaving(cafeId)
    const val = businessId === '' ? null : businessId
    await supabase.from('bingo_cafes').update({ business_id: val }).eq('id', cafeId)
    setCafes(prev => prev.map(c => c.id === cafeId ? { ...c, business_id: val } : c))
    setSaving(null)
  }

  const handleNameSave = async (cafeId: string) => {
    const newName = editName[cafeId]?.trim(); if (!newName) return
    setSaving(cafeId)
    await supabase.from('bingo_cafes').update({ name: newName }).eq('id', cafeId)
    setCafes(prev => prev.map(c => c.id === cafeId ? { ...c, name: newName } : c))
    setEditName(prev => { const n = { ...prev }; delete n[cafeId]; return n })
    setSaving(null)
  }

  const handleImageUpload = async (cafeId: string, file: File) => {
    setUploadingImg(cafeId)
    try {
      const url = await uploadToCloudinary(file, 'bingo')
      await supabase.from('bingo_cafes').update({ image_url: url }).eq('id', cafeId)
      setCafes(prev => prev.map(c => c.id === cafeId ? { ...c, image_url: url } : c))
    } catch { alert('이미지 업로드 실패') }
    setUploadingImg(null)
  }

  const filtered = cafes.filter(c => c.city === city)

  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: '#94A3B8' }}>불러오는 중...</div>

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['melbourne', 'sydney'] as const).map(c => (
          <button key={c} onClick={() => setCity(c)} style={{ height: 34, padding: '0 16px', borderRadius: 20, border: 'none', cursor: 'pointer', background: city === c ? '#1B6EF3' : '#F1F5F9', color: city === c ? '#fff' : '#475569', fontSize: 13, fontWeight: 700 }}>
            {c === 'melbourne' ? '멜번' : '시드니'}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map(cafe => (
          <div key={cafe.id} style={{ background: '#fff', borderRadius: 12, padding: '12px 14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #F1F5F9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div onClick={() => imgInputRefs.current[cafe.id]?.click()} style={{ width: 48, height: 48, borderRadius: 8, flexShrink: 0, background: '#F1F5F9', border: '1px solid #E2E8F0', overflow: 'hidden', cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {cafe.image_url ? <img src={cafe.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Icon icon="ph:camera-plus" width={18} height={18} color="#94A3B8" />}
                {uploadingImg === cafe.id && <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon icon="ph:circle-notch" width={16} height={16} color="#1B6EF3" style={{ animation: 'spin 0.8s linear infinite' }} /></div>}
                <input ref={el => { imgInputRefs.current[cafe.id] = el }} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(cafe.id, f); e.target.value = '' }} />
              </div>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#1B6EF3', flexShrink: 0 }}>{cafe.sort_order}</div>
              <input value={editName[cafe.id] ?? cafe.name} onChange={e => setEditName(prev => ({ ...prev, [cafe.id]: e.target.value }))} style={{ flex: 1, height: 32, border: '1px solid #E2E8F0', borderRadius: 8, padding: '0 10px', fontSize: 13, fontWeight: 700, color: '#0F172A', background: '#F8FAFC' }} />
              {editName[cafe.id] !== undefined && editName[cafe.id] !== cafe.name && (
                <button onClick={() => handleNameSave(cafe.id)} disabled={saving === cafe.id} style={{ height: 32, padding: '0 10px', borderRadius: 8, border: 'none', background: '#1B6EF3', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>{saving === cafe.id ? '...' : '저장'}</button>
              )}
            </div>
            <div>
              {cafe.business_id ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, padding: '6px 10px', background: '#DCFCE7', borderRadius: 8 }}>
                  <div style={{ fontSize: 12, color: '#16A34A', fontWeight: 700 }}>✓ {businesses.find(b => b.id === cafe.business_id)?.name ?? '연결됨'}</div>
                  <button onClick={() => { handleBusinessLink(cafe.id, ''); setBizSearch(prev => ({ ...prev, [cafe.id]: '' })) }} disabled={saving === cafe.id} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', fontSize: 11, fontWeight: 700 }}>연결 해제</button>
                </div>
              ) : <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 6 }}>업체 미연결</div>}
              <input value={bizSearch[cafe.id] ?? ''} onChange={e => setBizSearch(prev => ({ ...prev, [cafe.id]: e.target.value }))} placeholder="업체 검색..." style={{ width: '100%', height: 34, borderRadius: 8, border: '1px solid #E2E8F0', padding: '0 10px', fontSize: 12, color: '#1E293B', background: '#F8FAFC', boxSizing: 'border-box' }} />
              {bizSearch[cafe.id]?.trim() && (
                <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, marginTop: 4, maxHeight: 160, overflowY: 'auto', background: '#fff' }}>
                  {businesses.filter(b => b.name.toLowerCase().includes((bizSearch[cafe.id] ?? '').toLowerCase())).map(b => (
                    <div key={b.id} onClick={() => { handleBusinessLink(cafe.id, b.id); setBizSearch(prev => ({ ...prev, [cafe.id]: '' })) }} style={{ padding: '8px 12px', fontSize: 12, color: '#1E293B', cursor: 'pointer', borderBottom: '1px solid #F1F5F9', background: cafe.business_id === b.id ? '#EFF6FF' : '#fff' }} onMouseEnter={e => (e.currentTarget.style.background = '#F1F5F9')} onMouseLeave={e => (e.currentTarget.style.background = cafe.business_id === b.id ? '#EFF6FF' : '#fff')}>{b.name}</div>
                  ))}
                  {businesses.filter(b => b.name.toLowerCase().includes((bizSearch[cafe.id] ?? '').toLowerCase())).length === 0 && <div style={{ padding: '10px 12px', fontSize: 12, color: '#94A3B8' }}>검색 결과 없음</div>}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
