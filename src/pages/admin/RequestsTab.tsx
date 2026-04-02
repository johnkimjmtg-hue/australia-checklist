// ─────────────────────────────────────────────
// RequestsTab.tsx
// src/pages/admin/RequestsTab.tsx
// ─────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { Icon } from '@iconify/react'
import { supabase } from '../../lib/supabase'
import { CATEGORIES } from '../../data/businesses'
import { inputStyle, btnPrimary, btnGhost, btnSmGhost, btnSmDanger, Card, Field, Grid2, Toast } from './adminShared'

type RequestStatus = 'pending' | 'approved' | 'rejected'
type BusinessRequest = {
  id: string; business_name: string; category?: string; address: string; city?: string
  description: string; hashtags: string[]; phone: string | null; kakao: string | null
  website: string | null; status: RequestStatus; created_at: string
}
type EditableRequest = {
  business_name: string; category: string; address: string; city: string
  description: string; tags: string; phone: string; kakao: string; website: string
}

function Row({ label, value, link }: { label: string; value: string; link?: boolean }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr', gap: 8, alignItems: 'start' }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', paddingTop: 1 }}>{label}</span>
      {link
        ? <a href={value} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#1E4D83', fontWeight: 600, wordBreak: 'break-all' }}>{value}</a>
        : <span style={{ fontSize: 12, color: '#1E293B', fontWeight: 500, lineHeight: 1.5, wordBreak: 'break-all' }}>{value}</span>}
    </div>
  )
}

export default function RequestsTab() {
  const [requests, setRequests] = useState<BusinessRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<EditableRequest | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [filter, setFilter] = useState<RequestStatus | 'all'>('pending')

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 2500) }

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('business_requests').select('*').order('created_at', { ascending: false })
    setRequests((data as BusinessRequest[]) ?? [])
    setLoading(false)
  }

  async function updateStatus(id: string, status: RequestStatus) {
    await supabase.from('business_requests').update({ status }).eq('id', id)
    setRequests(rs => rs.map(r => r.id === id ? { ...r, status } : r))
    showToast(status === 'approved' ? '✅ 승인됨' : '❌ 거절됨')
  }

  async function handleSaveEdit(id: string) {
    if (!editForm) return
    setSaving(true)
    const tags = editForm.tags.split(',').map(t => t.trim()).filter(Boolean)
    await supabase.from('business_requests').update({
      business_name: editForm.business_name, category: editForm.category,
      address: editForm.address, city: editForm.city, description: editForm.description,
      hashtags: tags, phone: editForm.phone || null, kakao: editForm.kakao || null, website: editForm.website || null,
    }).eq('id', id)
    await load()
    setEditingId(null); setEditForm(null)
    showToast('✅ 수정 완료')
    setSaving(false)
  }

  async function handleApproveAndCreate(req: BusinessRequest) {
    if (!confirm(`"${req.business_name}"을 업체로 등록할까요?`)) return
    const id = 'biz-' + Date.now()
    await supabase.from('businesses').insert({
      id, name: req.business_name, category: req.category || 'etc',
      description: req.description, phone: req.phone, kakao: req.kakao,
      website: req.website, address: req.address, city: req.city || '',
      tags: req.hashtags || [], rating: 0, reviews_count: 0,
      is_featured: false, is_active: true,
    })
    await updateStatus(req.id, 'approved')
    showToast('✅ 업체 등록 완료!')
  }

  async function handleDelete(id: string) {
    if (!confirm('이 신청을 삭제할까요?')) return
    await supabase.from('business_requests').delete().eq('id', id)
    setRequests(rs => rs.filter(r => r.id !== id))
    showToast('🗑 삭제됨')
  }

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter)
  const counts = { pending: requests.filter(r => r.status === 'pending').length, approved: requests.filter(r => r.status === 'approved').length, rejected: requests.filter(r => r.status === 'rejected').length }

  return (
    <div>
      {toast && <Toast msg={toast} />}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#0F172A' }}>업체 등록 신청</div>
          <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>검토 후 업체를 등록해주세요</div>
        </div>
        <button onClick={load} style={{ ...btnSmGhost, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Icon icon="ph:arrow-clockwise" width={13} height={13} /> 새로고침
        </button>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {([['all', '전체', '#64748B'], ['pending', `대기 ${counts.pending}`, '#D97706'], ['approved', `승인 ${counts.approved}`, '#16A34A'], ['rejected', `거절 ${counts.rejected}`, '#DC2626']] as const).map(([val, label, color]) => (
          <button key={val} onClick={() => setFilter(val as any)} style={{ padding: '6px 12px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, background: filter === val ? color : '#F1F5F9', color: filter === val ? '#fff' : '#64748B' }}>{label}</button>
        ))}
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: '40px', color: '#94A3B8', fontSize: 13 }}>불러오는 중...</div>
        : filtered.length === 0 ? <div style={{ textAlign: 'center', padding: '40px', color: '#94A3B8', fontSize: 13 }}>신청 내역이 없어요</div>
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(req => (
              <Card key={req.id}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 900, color: '#0F172A', marginBottom: 4 }}>{req.business_name}</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, background: req.status === 'pending' ? '#FEF3C7' : req.status === 'approved' ? '#DCFCE7' : '#FEE2E2', color: req.status === 'pending' ? '#D97706' : req.status === 'approved' ? '#16A34A' : '#DC2626', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
                        {req.status === 'pending' ? '⏳ 대기' : req.status === 'approved' ? '✅ 승인' : '❌ 거절'}
                      </span>
                      <span style={{ fontSize: 11, color: '#94A3B8' }}>{new Date(req.created_at).toLocaleDateString('ko-KR')}</span>
                    </div>
                  </div>
                  <button onClick={() => setExpandedId(expandedId === req.id ? null : req.id)} style={{ ...btnSmGhost }}>
                    {expandedId === req.id ? '접기' : '상세'}
                  </button>
                </div>

                {expandedId === req.id && (
                  editingId === req.id && editForm ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 12, borderTop: '1px solid #F1F5F9' }}>
                      <Grid2>
                        <Field label="업체명"><input value={editForm.business_name} onChange={e => setEditForm(f => f ? { ...f, business_name: e.target.value } : f)} style={inputStyle} /></Field>
                        <Field label="카테고리">
                          <select value={editForm.category} onChange={e => setEditForm(f => f ? { ...f, category: e.target.value } : f)} style={inputStyle}>
                            {CATEGORIES.filter(c => c.id !== 'all').map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
                          </select>
                        </Field>
                      </Grid2>
                      <Field label="주소"><input value={editForm.address} onChange={e => setEditForm(f => f ? { ...f, address: e.target.value } : f)} style={inputStyle} /></Field>
                      <Field label="Suburb"><input value={editForm.city} onChange={e => setEditForm(f => f ? { ...f, city: e.target.value } : f)} style={inputStyle} /></Field>
                      <Field label="소개"><textarea value={editForm.description} onChange={e => setEditForm(f => f ? { ...f, description: e.target.value } : f)} style={{ ...inputStyle, resize: 'none' }} rows={3} /></Field>
                      <Field label="태그 (쉼표)"><input value={editForm.tags} onChange={e => setEditForm(f => f ? { ...f, tags: e.target.value } : f)} style={inputStyle} /></Field>
                      <Grid2>
                        <Field label="전화"><input value={editForm.phone} onChange={e => setEditForm(f => f ? { ...f, phone: e.target.value } : f)} style={inputStyle} /></Field>
                        <Field label="카카오"><input value={editForm.kakao} onChange={e => setEditForm(f => f ? { ...f, kakao: e.target.value } : f)} style={inputStyle} /></Field>
                      </Grid2>
                      <Field label="웹사이트"><input value={editForm.website} onChange={e => setEditForm(f => f ? { ...f, website: e.target.value } : f)} style={inputStyle} /></Field>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => { setEditingId(null); setEditForm(null) }} style={{ ...btnGhost, flex: 1 }}>취소</button>
                        <button onClick={() => handleSaveEdit(req.id)} disabled={saving} style={{ ...btnPrimary, flex: 2 }}>{saving ? '저장 중...' : '저장하기'}</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ paddingTop: 12, borderTop: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {req.address && <Row label="주소" value={req.address} />}
                      {req.city && <Row label="Suburb" value={req.city} />}
                      {req.description && <Row label="소개" value={req.description} />}
                      {req.phone && <Row label="전화" value={req.phone} />}
                      {req.kakao && <Row label="카카오" value={req.kakao} />}
                      {req.website && <Row label="웹사이트" value={req.website} link />}
                      {req.hashtags?.length > 0 && <Row label="태그" value={req.hashtags.join(', ')} />}
                      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <button onClick={() => { setEditingId(req.id); setEditForm({ business_name: req.business_name, category: req.category || 'etc', address: req.address, city: req.city || '', description: req.description, tags: req.hashtags?.join(', ') || '', phone: req.phone || '', kakao: req.kakao || '', website: req.website || '' }) }} style={{ ...btnSmGhost, flex: 1 }}>✏️ 수정</button>
                        {req.status === 'pending' && (
                          <>
                            <button onClick={() => handleApproveAndCreate(req)} style={{ flex: 2, padding: '7px 12px', border: 'none', borderRadius: 8, background: '#16A34A', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>✅ 승인+등록</button>
                            <button onClick={() => updateStatus(req.id, 'rejected')} style={{ flex: 1, padding: '7px 12px', border: 'none', borderRadius: 8, background: '#FEE2E2', color: '#DC2626', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>❌ 거절</button>
                          </>
                        )}
                        <button onClick={() => handleDelete(req.id)} style={{ ...btnSmDanger }}>🗑</button>
                      </div>
                    </div>
                  )
                )}
              </Card>
            ))}
          </div>
        )}
    </div>
  )
}
