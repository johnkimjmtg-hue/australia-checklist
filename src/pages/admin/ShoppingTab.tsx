// ─────────────────────────────────────────────
// ShoppingTab.tsx
// src/pages/admin/ShoppingTab.tsx
// ─────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { Icon } from '@iconify/react'
import { supabase } from '../../lib/supabase'
import { uploadToCloudinary } from './adminShared'

interface ShopCat  { id: number; name: string; emoji: string; sort_order: number; is_active: boolean }
interface ShopProd {
  id: string; category_id: number; name: string; brand: string
  description: string; price_range: string; where_to_buy: string[]
  tags: string[]; image_url: string | null; is_active: boolean; is_featured: boolean; sort_order: number
}

const EMPTY_PROD: Omit<ShopProd, 'id'> = {
  category_id: 0, name: '', brand: '', description: '',
  price_range: '$', where_to_buy: [], tags: [],
  image_url: null, is_active: true, is_featured: false, sort_order: 0,
}

const PRESET_PLACES = ['Coles','Woolworths','Aldi','Big W','Target','Kmart','Chemist Warehouse','Priceline','로컬 약국','건강식품점','슈퍼마켓','마켓','리커샵','기념품점','백화점','Myer','David Jones','면세점','온라인']
const PRESET_TAGS   = ['인기','강추','선물','프리미엄','가성비','필수템','안사면 후회','없어서 못삼','한국보다 저렴','호주 한정','약국 인기','마트 필수','현지인 추천','유아동','건강식품']

export default function ShoppingTab() {
  const [cats, setCats]       = useState<ShopCat[]>([])
  const [prods, setProds]     = useState<ShopProd[]>([])
  const [loading, setLoading] = useState(true)
  const [selCat, setSelCat]   = useState<number | null>(null)
  const [view, setView]       = useState<'list' | 'form'>('list')
  const [editing, setEditing] = useState<ShopProd | null>(null)
  const [form, setForm]       = useState<Omit<ShopProd, 'id'>>(EMPTY_PROD)
  const [imgFile, setImgFile] = useState<File | null>(null)
  const [imgPreview, setImgPreview] = useState<string | null>(null)
  const [saving, setSaving]   = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const fetchAll = async () => {
    setLoading(true)
    const [{ data: c }, { data: p }] = await Promise.all([
      supabase.from('shopping_categories').select('*').order('sort_order'),
      supabase.from('shopping_products').select('*').order('sort_order'),
    ])
    setCats(c ?? []); setProds(p ?? []); setLoading(false)
  }
  useEffect(() => { fetchAll() }, [])

  const filtered = selCat ? prods.filter(p => p.category_id === selCat) : prods
  const inputStyle = { width: '100%', padding: '9px 10px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 13, color: '#1E293B', fontFamily: 'inherit', boxSizing: 'border-box' as const, outline: 'none' }
  const labelStyle = { fontSize: 11, fontWeight: 700, color: '#64748B', display: 'block' as const, marginBottom: 4 }

  const openNew = () => { setEditing(null); setForm({ ...EMPTY_PROD, category_id: selCat ?? cats[0]?.id ?? 0 }); setImgFile(null); setImgPreview(null); setView('form') }
  const openEdit = (p: ShopProd) => { setEditing(p); setForm({ category_id: p.category_id, name: p.name, brand: p.brand, description: p.description, price_range: p.price_range, where_to_buy: p.where_to_buy, tags: p.tags, image_url: p.image_url, is_active: p.is_active, is_featured: p.is_featured, sort_order: p.sort_order }); setImgPreview(p.image_url); setImgFile(null); setView('form') }

  const handleSave = async () => {
    if (!form.name.trim()) return
    if (form.tags.length === 0) { alert('태그를 최소 1개 이상 선택해주세요.'); return }
    setSaving(true)
    let imageUrl = form.image_url
    if (imgFile) { try { imageUrl = await uploadToCloudinary(imgFile, 'shopping') } catch { alert('이미지 업로드 실패'); setSaving(false); return } }
    const payload = { ...form, image_url: imageUrl }
    if (editing) await supabase.from('shopping_products').update(payload).eq('id', editing.id)
    else await supabase.from('shopping_products').insert(payload)
    setSaving(false); setView('list'); await fetchAll()
  }

  const handleDelete = async (id: string) => { await supabase.from('shopping_products').delete().eq('id', id); setDeleteId(null); await fetchAll() }

  if (loading) return <div style={{ padding: 32, textAlign: 'center', color: '#aaa' }}>불러오는 중...</div>

  if (view === 'form') return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <button onClick={() => setView('list')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <Icon icon="ph:arrow-left" width={20} height={20} color="#475569" />
        </button>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#1E293B' }}>{editing ? '상품 수정' : '새 상품 추가'}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <span style={labelStyle}>상품 이미지</span>
          <label style={{ cursor: 'pointer', display: 'block' }}>
            <div style={{ width: '100%', height: 160, borderRadius: 10, overflow: 'hidden', background: imgPreview ? 'none' : '#F1F5F9', border: '2px dashed #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {imgPreview ? <img src={imgPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ textAlign: 'center', color: '#94A3B8' }}><Icon icon="ph:camera-plus" width={28} height={28} color="#CBD5E1" /><div style={{ fontSize: 11, marginTop: 4 }}>이미지 업로드</div></div>}
            </div>
            <input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) { setImgFile(f); setImgPreview(URL.createObjectURL(f)) } }} style={{ display: 'none' }} />
          </label>
        </div>
        <div><span style={labelStyle}>카테고리</span><select value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: Number(e.target.value) }))} style={inputStyle}>{cats.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}</select></div>
        <div><span style={labelStyle}>상품명 *</span><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} placeholder="상품명 입력" /></div>
        <div><span style={labelStyle}>브랜드</span><input value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} style={inputStyle} placeholder="브랜드명" /></div>
        <div><span style={labelStyle}>설명</span><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ ...inputStyle, height: 200, resize: 'vertical' }} placeholder="상품 설명" /></div>
        <div>
          <span style={labelStyle}>가격대</span>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['$', '$$', '$$$'] as const).map(p => <button key={p} onClick={() => setForm(f => ({ ...f, price_range: p }))} style={{ flex: 1, height: 38, borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, background: form.price_range === p ? '#1B6EF3' : '#F1F5F9', color: form.price_range === p ? '#fff' : '#475569' }}>{p}</button>)}
          </div>
        </div>
        <div>
          <span style={labelStyle}>구매처</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
            {PRESET_PLACES.map(place => {
              const selected = form.where_to_buy.includes(place)
              return <label key={place} style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 12, fontWeight: selected ? 700 : 500, color: selected ? '#1B6EF3' : '#64748B', background: selected ? '#EFF6FF' : '#fff', border: selected ? '1.5px solid #1B6EF3' : '1.5px solid #D1D9E3', borderRadius: 20, padding: '5px 12px' }}>
                <input type="checkbox" checked={selected} onChange={e => { if (e.target.checked) setForm(f => ({ ...f, where_to_buy: [...f.where_to_buy, place] })); else setForm(f => ({ ...f, where_to_buy: f.where_to_buy.filter(w => w !== place) })) }} style={{ display: 'none' }} />
                {selected ? '✓ ' : ''}{place}
              </label>
            })}
          </div>
        </div>
        <div>
          <span style={labelStyle}>태그 <span style={{ color: '#EF4444' }}>*</span></span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
            {PRESET_TAGS.map(tag => {
              const selected = form.tags.includes(tag)
              return <label key={tag} style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 12, fontWeight: selected ? 700 : 500, color: selected ? '#1B6EF3' : '#64748B', background: selected ? '#EFF6FF' : '#fff', border: selected ? '1.5px solid #1B6EF3' : '1.5px solid #D1D9E3', borderRadius: 20, padding: '5px 12px' }}>
                <input type="checkbox" checked={selected} onChange={e => { if (e.target.checked) setForm(f => ({ ...f, tags: [...f.tags, tag] })); else setForm(f => ({ ...f, tags: f.tags.filter(t => t !== tag) })) }} style={{ display: 'none' }} />
                {selected ? '✓ ' : ''}{tag}
              </label>
            })}
          </div>
          {form.tags.length === 0 && <div style={{ fontSize: 11, color: '#EF4444', marginTop: 6 }}>태그를 최소 1개 이상 선택해주세요.</div>}
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, color: '#475569' }}><input type="checkbox" checked={form.is_featured} onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))} /> ⭐ 추천 상품</label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, color: '#475569' }}><input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} /> 노출</label>
        </div>
        <button onClick={handleSave} disabled={saving} style={{ width: '100%', height: 50, borderRadius: 12, border: 'none', background: saving ? '#94A3B8' : '#1B6EF3', color: '#fff', fontSize: 15, fontWeight: 700, cursor: saving ? 'default' : 'pointer' }}>{saving ? '저장 중...' : '저장하기'}</button>
      </div>
    </div>
  )

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 12, paddingBottom: 2 }}>
        <button onClick={() => setSelCat(null)} style={{ flexShrink: 0, height: 30, padding: '0 12px', borderRadius: 15, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, background: selCat === null ? '#1B6EF3' : '#F1F5F9', color: selCat === null ? '#fff' : '#475569' }}>전체</button>
        {cats.map(c => <button key={c.id} onClick={() => setSelCat(c.id)} style={{ flexShrink: 0, height: 30, padding: '0 12px', borderRadius: 15, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', background: selCat === c.id ? '#1B6EF3' : '#F1F5F9', color: selCat === c.id ? '#fff' : '#475569' }}>{c.emoji} {c.name}</button>)}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>상품 <span style={{ color: '#94A3B8', fontWeight: 500 }}>({filtered.length}개)</span></div>
        <button onClick={openNew} style={{ display: 'flex', alignItems: 'center', gap: 4, height: 34, padding: '0 12px', borderRadius: 8, background: '#1B6EF3', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 12, fontWeight: 700 }}>
          <Icon icon="ph:plus" width={14} height={14} color="#fff" />새 상품
        </button>
      </div>
      {filtered.map(p => (
        <div key={p.id} style={{ background: '#fff', borderRadius: 12, padding: '12px 14px', border: '1px solid #E2E8F0', marginBottom: 8, display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ width: 52, height: 52, borderRadius: 8, flexShrink: 0, overflow: 'hidden', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {p.image_url ? <img src={p.image_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Icon icon="ph:shopping-bag" width={20} height={20} color="#CBD5E1" />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>{p.name}</span>
              {p.is_featured && <span style={{ fontSize: 9, background: '#FEF3C7', color: '#D97706', padding: '1px 5px', borderRadius: 4, fontWeight: 700 }}>추천</span>}
              {!p.is_active && <span style={{ fontSize: 9, background: '#F1F5F9', color: '#94A3B8', padding: '1px 5px', borderRadius: 4, fontWeight: 700 }}>비노출</span>}
            </div>
            <div style={{ fontSize: 11, color: '#94A3B8' }}>{p.brand} · {p.price_range} · {cats.find(c => c.id === p.category_id)?.name}</div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <button onClick={() => openEdit(p)} style={{ background: '#F1F5F9', border: 'none', borderRadius: 7, padding: '6px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#475569' }}>수정</button>
            <button onClick={() => setDeleteId(p.id)} style={{ background: '#FFF5F5', border: '1px solid #FECDD3', borderRadius: 7, padding: '6px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#DC2626' }}>삭제</button>
          </div>
        </div>
      ))}
      {deleteId && (
        <>
          <div onClick={() => setDeleteId(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 900 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#fff', borderRadius: 14, padding: '24px 20px', zIndex: 901, width: 'calc(100% - 48px)', maxWidth: 300, textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🗑️</div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>상품을 삭제할까요?</div>
            <div style={{ fontSize: 12, color: '#64748B', marginBottom: 20 }}>삭제된 상품은 복구되지 않아요.</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setDeleteId(null)} style={{ flex: 1, height: 44, border: '1px solid #E2E8F0', borderRadius: 8, background: '#fff', color: '#64748B', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>취소</button>
              <button onClick={() => handleDelete(deleteId)} style={{ flex: 2, height: 44, border: 'none', borderRadius: 8, background: '#DC2626', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>삭제하기</button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
