// ─────────────────────────────────────────────
// CategoriesTab.tsx
// src/pages/admin/CategoriesTab.tsx
// ─────────────────────────────────────────────
import { useState, useRef } from 'react'
import { Icon } from '@iconify/react'
import { supabase } from '../../lib/supabase'
import { inputStyle, btnPrimary, Card, SectionTitle, Toast, EditBizMultiSearch, EditProdMultiSearch, uploadToCloudinary, type Cat, type Item } from './adminShared'

// ── 아이콘 목록
const PH_ICONS = [
  'ph:heart','ph:star','ph:check-circle','ph:map-pin','ph:calendar',
  'ph:camera','ph:gift','ph:flag','ph:crown','ph:trophy',
  'ph:sparkle','ph:shooting-star','ph:smiley','ph:sun','ph:moon',
  'ph:paw-print','ph:bird','ph:butterfly','ph:horse','ph:bug',
  'ph:fish','ph:fish-simple','ph:shrimp','ph:feather','ph:leaf',
  'ph:tree-palm','ph:island','ph:waves','ph:sun-horizon','ph:rainbow',
  'ph:mountains','ph:lighthouse','ph:anchor','ph:tent','ph:compass',
  'ph:coffee','ph:tea-bag','ph:bread','ph:cake','ph:cookie',
  'ph:egg','ph:drop','ph:drop-half','ph:orange','ph:plant','ph:flower',
  'ph:fork-knife','ph:bowl-food','ph:beer-stein','ph:wine','ph:flame',
  'ph:hamburger','ph:cheese','ph:ice-cream','ph:nut','ph:pepper',
  'ph:shopping-bag','ph:shopping-cart','ph:t-shirt','ph:diamond',
  'ph:boot','ph:wallet','ph:pill','ph:baby',
  'ph:buildings','ph:building','ph:palette','ph:music-note',
  'ph:film-slate','ph:ticket','ph:binoculars','ph:books',
  'ph:graduation-cap','ph:medal','ph:frame-corners','ph:clock','ph:bridge',
  'ph:umbrella','ph:boat','ph:sailboat','ph:airplane','ph:train',
  'ph:bus','ph:car','ph:van','ph:bicycle','ph:backpack','ph:bed',
  'ph:device-mobile','ph:identification-card','ph:certificate',
  'ph:parachute','ph:balloon','ph:guitar','ph:coin','ph:confetti',
  'ph:person-simple','ph:users','ph:house','ph:pencil-simple',
  'ph:storefront','ph:stethoscope','ph:first-aid-kit',
]

function IconPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const filtered = search ? PH_ICONS.filter(i => i.includes(search)) : PH_ICONS
  const handleOpen = () => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + 4, left: r.left })
    }
    setOpen(o => !o)
  }
  return (
    <div style={{ position: 'relative' }}>
      <button ref={btnRef} type="button" onClick={handleOpen} style={{ width: 44, height: 38, border: '1.5px solid #e0e0e0', borderRadius: 9, background: '#fafafa', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon icon={value || 'ph:star'} width={20} height={20} color="#1B6EF3" />
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 700 }} />
          <div style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999, background: '#fff', borderRadius: 12, padding: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.15)', width: 260, maxHeight: 300, overflowY: 'auto' }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="아이콘 검색..." style={{ ...inputStyle, marginBottom: 10, fontSize: 12, padding: '6px 10px' }} autoFocus />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
              {filtered.map(ic => (
                <button key={ic} type="button" onClick={() => { onChange(ic); setOpen(false); setSearch('') }} title={ic.replace('ph:', '')}
                  style={{ width: 32, height: 32, border: value === ic ? '2px solid #1B6EF3' : '1px solid #eee', borderRadius: 6, background: value === ic ? '#eef2fb' : '#fafafa', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                  <Icon icon={ic} width={16} height={16} color={value === ic ? '#1B6EF3' : '#555'} />
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ════════════════════════════════════════════
// CategoriesTab
// ════════════════════════════════════════════
export function CategoriesTab({ cats, setCats }: { cats: Cat[]; setCats: (cats: Cat[]) => void }) {
  const [newEmoji, setNewEmoji] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [toast, setToast] = useState('')
  const [saving, setSaving] = useState(false)
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 2500) }

  async function addCat() {
    if (!newLabel.trim()) return
    const emoji = newEmoji.trim() || '📌'
    const id = 'cat_' + Date.now()
    const sort_order = cats.length + 1
    setSaving(true)
    const { error } = await supabase.from('checklist_categories').insert({ id, label: newLabel.trim(), emoji, sort_order })
    if (!error) { setCats([...cats, { id, label: newLabel.trim(), emoji, sort_order }]); setNewEmoji(''); setNewLabel(''); showToast('카테고리 추가됨: ' + newLabel) }
    else showToast('오류: ' + error.message)
    setSaving(false)
  }

  async function deleteCat(id: string) {
    if (!confirm('이 카테고리와 하위 항목을 모두 삭제할까요?')) return
    await supabase.from('checklist_items').delete().eq('category_id', id)
    await supabase.from('checklist_categories').delete().eq('id', id)
    setCats(cats.filter(c => c.id !== id)); showToast('삭제됨')
  }

  async function updateCat(id: string, field: 'label' | 'emoji', val: string) {
    if (!val) return
    setCats(cats.map(c => c.id === id ? { ...c, [field]: val } : c))
    await supabase.from('checklist_categories').update({ [field]: val }).eq('id', id)
  }

  async function handleDrop(toIdx: number) {
    if (dragIdx === null || dragIdx === toIdx) { setDragIdx(null); setDragOverIdx(null); return }
    const next = [...cats]; const [moved] = next.splice(dragIdx, 1); next.splice(toIdx, 0, moved)
    const reordered = next.map((c, i) => ({ ...c, sort_order: i + 1 }))
    setCats(reordered); setDragIdx(null); setDragOverIdx(null)
    await Promise.all(reordered.map(c => supabase.from('checklist_categories').update({ sort_order: c.sort_order }).eq('id', c.id)))
    showToast('순서 저장됨')
  }

  return (
    <>
      {toast && <Toast msg={toast} />}
      <Card>
        <SectionTitle>새 카테고리 추가</SectionTitle>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input value={newEmoji} onChange={e => setNewEmoji(e.target.value)} placeholder="😀" maxLength={2} style={{ ...inputStyle, width: 52, textAlign: 'center', fontSize: 20, flexShrink: 0 }} />
          <input value={newLabel} onChange={e => setNewLabel(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCat()} placeholder="카테고리 이름" style={{ ...inputStyle, flex: 1, minWidth: 0 }} />
          <button onClick={addCat} disabled={saving} style={{ ...btnPrimary, flexShrink: 0, padding: '11px 16px', fontSize: 13 }}>추가</button>
        </div>
      </Card>
      <Card>
        <SectionTitle>카테고리 목록 ({cats.length}) — 드래그로 순서 변경</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {cats.map((cat, idx) => (
            <div key={cat.id} draggable
              onDragStart={() => setDragIdx(idx)}
              onDragOver={e => { e.preventDefault(); setDragOverIdx(idx) }}
              onDrop={() => handleDrop(idx)}
              onDragEnd={() => { setDragIdx(null); setDragOverIdx(null) }}
              style={{ border: dragOverIdx === idx ? '2px dashed #1B6EF3' : '1.5px solid #e8e8e8', borderRadius: 12, padding: '12px 14px', background: dragIdx === idx ? '#e8f0fe' : '#fafafa', display: 'flex', alignItems: 'center', gap: 10, cursor: 'grab', opacity: dragIdx === idx ? 0.5 : 1 }}>
              <span style={{ color: '#aaa', fontSize: 16, userSelect: 'none' }}>⠿</span>
              <input value={cat.emoji} maxLength={2} onChange={e => updateCat(cat.id, 'emoji', e.target.value)} onClick={e => e.stopPropagation()} style={{ width: 36, textAlign: 'center', fontSize: 20, border: 'none', background: 'transparent' }} />
              <input value={cat.label} onChange={e => updateCat(cat.id, 'label', e.target.value)} onClick={e => e.stopPropagation()} style={{ flex: 1, fontSize: 13, fontWeight: 700, border: 'none', background: 'transparent', color: '#222' }} />
              <span style={{ fontSize: 11, color: '#aaa' }}>#{cat.sort_order}</span>
              <button onClick={e => { e.stopPropagation(); deleteCat(cat.id) }} style={{ background: 'none', border: 'none', color: '#e05252', cursor: 'pointer', fontSize: 14 }}>✕</button>
            </div>
          ))}
        </div>
      </Card>
    </>
  )
}

// ════════════════════════════════════════════
// ItemsTab
// ════════════════════════════════════════════
export function ItemsTab({ cats, items, setItems }: { cats: Cat[]; items: Item[]; setItems: (items: Item[]) => void }) {
  const [selCat, setSelCat] = useState(cats[0]?.id ?? '')
  const [newLabel, setNewLabel] = useState('')
  const [newIcon, setNewIcon] = useState('ph:star')
  const [toast, setToast] = useState('')
  const [saving, setSaving] = useState(false)
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [detailEdits, setDetailEdits] = useState<Record<string, { address: string; description: string; tips: string }>>({})
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [businesses, setBusinesses] = useState<{ id: string; name: string }[]>([])
  const [products, setProducts] = useState<{ id: string; name: string }[]>([])
  const [newSuburb, setNewSuburb] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newTips, setNewTips] = useState('')
  const [newBizIds, setNewBizIds] = useState<string[]>([])
  const [newImgFile, setNewImgFile] = useState<File | null>(null)
  const [newImgPreview, setNewImgPreview] = useState<string | null>(null)
  const [bizSearch, setBizSearch] = useState('')
  const [bizFocused, setBizFocused] = useState(false)

  const getDetailEdit = (item: Item) => detailEdits[item.id] ?? { address: item.address ?? '', description: item.description ?? '', tips: item.tips ?? '' }
  const setDetailEdit = (id: string, field: string, val: string) => setDetailEdits(prev => ({ ...prev, [id]: { ...getDetailEdit(items.find(i => i.id === id)!), [field]: val } }))

  const filteredBiz = businesses.filter(b => !newBizIds.includes(b.id) && (!bizSearch || b.name.toLowerCase().includes(bizSearch.toLowerCase()))).slice(0, 8)

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 2500) }
  const catItems = items.filter(i => i.category_id === selCat)

  // 업체/상품 목록 로드 (최초 1회)
  const loadedRef = useRef(false)
  if (!loadedRef.current) {
    loadedRef.current = true
    const load = async () => {
      const PAGE = 1000; let all: { id: string; name: string }[] = []; let from = 0
      while (true) {
        const { data, error } = await supabase.from('businesses').select('id, name').eq('is_active', true).order('name').range(from, from + PAGE - 1)
        if (error || !data || data.length === 0) break
        all = [...all, ...data]
        if (data.length < PAGE) break
        from += PAGE
      }
      setBusinesses(all)
      const { data: prods } = await supabase.from('shopping_products').select('id, name').eq('is_active', true).order('name')
      if (prods) setProducts(prods)
    }
    load()
  }

  async function addItem() {
    if (!newLabel.trim()) return
    const id = 'i_' + Date.now(); const sort_order = catItems.length + 1
    setSaving(true)
    let imageUrl: string | null = null
    if (newImgFile) { try { imageUrl = await uploadToCloudinary(newImgFile, 'checklist') } catch {} }
    const insertData: any = { id, category_id: selCat, label: newLabel.trim(), icon: newIcon, sort_order, is_active: true }
    if (newSuburb.trim()) insertData.address = newSuburb.trim()
    if (newDesc.trim()) insertData.description = newDesc.trim()
    if (newTips.trim()) insertData.tips = newTips.trim()
    if (imageUrl) insertData.image_url = imageUrl
    if (newBizIds.length > 0) { insertData.related_business_id = newBizIds[0]; insertData.related_business_ids = newBizIds }
    const { error } = await supabase.from('checklist_items').insert(insertData)
    if (!error) { setItems([...items, { ...insertData }]); setNewLabel(''); setNewSuburb(''); setNewDesc(''); setNewTips(''); setNewBizIds([]); setBizSearch(''); setNewImgFile(null); setNewImgPreview(null); showToast('항목 추가됨: ' + newLabel) }
    else showToast('오류: ' + error.message)
    setSaving(false)
  }

  async function deleteItem(id: string) { await supabase.from('checklist_items').delete().eq('id', id); setItems(items.filter(i => i.id !== id)); showToast('항목 삭제됨') }
  async function saveLabel(id: string) { if (!editLabel.trim()) return; await supabase.from('checklist_items').update({ label: editLabel.trim() }).eq('id', id); setItems(items.map(i => i.id === id ? { ...i, label: editLabel.trim() } : i)); setEditId(null); showToast('저장됨') }
  async function saveDetail(id: string, field: string, val: string) { const value = val.trim() || null; await supabase.from('checklist_items').update({ [field]: value }).eq('id', id); setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i)); showToast('저장됨') }
  async function saveRelatedBiz(id: string, ids: string[]) { await supabase.from('checklist_items').update({ related_business_ids: ids }).eq('id', id); setItems(items.map(i => i.id === id ? { ...i, related_business_ids: ids } : i)); showToast('저장됨') }
  async function saveRelatedProducts(id: string, ids: string[]) { await supabase.from('checklist_items').update({ related_product_ids: ids }).eq('id', id); setItems(items.map(i => i.id === id ? { ...i, related_product_ids: ids } : i)); showToast('저장됨') }
  async function uploadItemImage(id: string, file: File) { setSaving(true); try { const url = await uploadToCloudinary(file, 'checklist'); await supabase.from('checklist_items').update({ image_url: url }).eq('id', id); setItems(items.map(i => i.id === id ? { ...i, image_url: url } : i)); showToast('이미지 저장됨') } catch { showToast('이미지 업로드 실패') } setSaving(false) }
  async function deleteItemImage(id: string) { await supabase.from('checklist_items').update({ image_url: null }).eq('id', id); setItems(items.map(i => i.id === id ? { ...i, image_url: null } : i)); showToast('이미지 삭제됨') }
  async function updateIcon(id: string, icon: string) { await supabase.from('checklist_items').update({ icon }).eq('id', id); setItems(items.map(i => i.id === id ? { ...i, icon } : i)) }
  async function toggleActive(id: string, current: boolean) { await supabase.from('checklist_items').update({ is_active: !current }).eq('id', id); setItems(items.map(i => i.id === id ? { ...i, is_active: !current } : i)) }

  async function handleDrop(toIdx: number) {
    if (dragIdx === null || dragIdx === toIdx) { setDragIdx(null); setDragOverIdx(null); return }
    const catIs = [...catItems]; const [moved] = catIs.splice(dragIdx, 1); catIs.splice(toIdx, 0, moved)
    const reordered = catIs.map((item, i) => ({ ...item, sort_order: i + 1 }))
    const otherItems = items.filter(i => i.category_id !== selCat)
    setItems([...otherItems, ...reordered]); setDragIdx(null); setDragOverIdx(null)
    await Promise.all(reordered.map(item => supabase.from('checklist_items').update({ sort_order: item.sort_order }).eq('id', item.id)))
    showToast('순서 저장됨')
  }

  return (
    <>
      {toast && <Toast msg={toast} />}
      {deleteConfirmId && (() => {
        const item = items.find(i => i.id === deleteConfirmId)
        return (
          <>
            <div onClick={() => setDeleteConfirmId(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 800 }} />
            <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#fff', borderRadius: 16, padding: '24px 20px', zIndex: 801, width: 'calc(100% - 48px)', maxWidth: 320, boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>항목을 삭제할까요?</div>
              <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6, marginBottom: 20 }}><span style={{ fontWeight: 700, color: '#1B6EF3' }}>{item?.label}</span><br />삭제하면 복구할 수 없습니다.</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setDeleteConfirmId(null)} style={{ flex: 1, height: 44, borderRadius: 10, border: '1px solid #C8C8C8', background: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: '#64748B' }}>취소</button>
                <button onClick={() => { deleteItem(deleteConfirmId); setDeleteConfirmId(null) }} style={{ flex: 1, height: 44, borderRadius: 10, border: 'none', background: '#DC2626', fontSize: 14, fontWeight: 700, cursor: 'pointer', color: '#fff' }}>삭제하기</button>
              </div>
            </div>
          </>
        )
      })()}

      {/* 카테고리 선택 */}
      <Card>
        <SectionTitle>카테고리 선택</SectionTitle>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {cats.map(c => (
            <button key={c.id} onClick={() => setSelCat(c.id)} style={{ padding: '8px 14px', borderRadius: 10, border: '1.5px solid', borderColor: selCat === c.id ? '#1B6EF3' : '#e0e0e0', background: selCat === c.id ? '#1B6EF3' : '#fff', color: selCat === c.id ? '#fff' : '#444', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              {c.emoji} {c.label} <span style={{ marginLeft: 6, opacity: 0.7, fontSize: 11 }}>({items.filter(i => i.category_id === c.id).length})</span>
            </button>
          ))}
        </div>
      </Card>

      {/* 새 항목 추가 */}
      <Card>
        <SectionTitle>새 항목 추가</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <IconPicker value={newIcon} onChange={setNewIcon} />
            <input value={newLabel} onChange={e => setNewLabel(e.target.value)} onKeyDown={e => e.key === 'Enter' && addItem()} placeholder="버킷리스트 항목 이름 *" style={{ ...inputStyle, flex: 1 }} />
          </div>
          <div>
            <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>🖼 이미지 (선택)</span>
            <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {newImgPreview && (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <img src={newImgPreview} alt="" style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid #E2E8F0' }} />
                  <button onClick={() => { setNewImgFile(null); setNewImgPreview(null) }} style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: 4, color: '#fff', fontSize: 11, cursor: 'pointer', padding: '2px 5px' }}>✕</button>
                </div>
              )}
              <label style={{ display: 'inline-block', padding: '6px 12px', borderRadius: 8, border: '1.5px dashed #CBD5E1', fontSize: 12, color: '#64748B', cursor: 'pointer', background: '#fff' }}>
                {newImgPreview ? '이미지 교체' : '+ 이미지 업로드'}
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) { setNewImgFile(f); setNewImgPreview(URL.createObjectURL(f)) } }} />
              </label>
            </div>
          </div>
          <input value={newSuburb} onChange={e => setNewSuburb(e.target.value)} placeholder="📍 주소 (선택)" style={{ ...inputStyle, fontSize: 13 }} />
          <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="📝 설명 (선택)" rows={4} style={{ ...inputStyle, fontSize: 13, resize: 'vertical' }} />
          <textarea value={newTips} onChange={e => setNewTips(e.target.value)} placeholder="💡 현지인 팁 (선택)" rows={2} style={{ ...inputStyle, fontSize: 13, resize: 'vertical' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>🏢 관련업체 (최대 3개)</span>
            {newBizIds.map(id => {
              const biz = businesses.find(b => b.id === id)
              return biz ? (
                <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(27,110,243,0.08)', borderRadius: 8, padding: '5px 10px' }}>
                  <span style={{ flex: 1, fontSize: 12, color: '#1B6EF3', fontWeight: 600 }}>🏢 {biz.name}</span>
                  <button onClick={() => setNewBizIds(newBizIds.filter(i => i !== id))} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 13 }}>✕</button>
                </div>
              ) : null
            })}
            {newBizIds.length < 3 && (
              <div style={{ position: 'relative' }}>
                <input value={bizSearch} onChange={e => setBizSearch(e.target.value)} onFocus={() => setBizFocused(true)} onBlur={() => setTimeout(() => setBizFocused(false), 150)} placeholder="업체명 검색..." style={{ ...inputStyle, fontSize: 13 }} />
                {filteredBiz.length > 0 && bizFocused && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, background: '#fff', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                    {filteredBiz.map(b => <div key={b.id} onClick={() => { setNewBizIds([...newBizIds, b.id]); setBizSearch('') }} style={{ padding: '9px 12px', fontSize: 13, cursor: 'pointer', borderBottom: '1px solid #F1F5F9' }} onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')} onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>{b.name}</div>)}
                  </div>
                )}
              </div>
            )}
          </div>
          <button onClick={addItem} disabled={saving} style={{ ...btnPrimary, padding: '11px', fontSize: 13 }}>추가</button>
        </div>
      </Card>

      {/* 항목 목록 */}
      <Card>
        <SectionTitle>항목 목록 ({catItems.length}개) — 드래그로 순서 변경</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {catItems.map((item, idx) => (
            <div key={item.id} style={{ borderRadius: 10, position: 'relative' }}>
              <div draggable
                onDragStart={() => setDragIdx(idx)}
                onDragOver={e => { e.preventDefault(); setDragOverIdx(idx) }}
                onDrop={() => handleDrop(idx)}
                onDragEnd={() => { setDragIdx(null); setDragOverIdx(null) }}
                style={{ border: dragOverIdx === idx ? '2px dashed #1B6EF3' : '1.5px solid #e8e8e8', borderRadius: expandedId === item.id ? '10px 10px 0 0' : 10, padding: '10px 12px', background: dragIdx === idx ? '#e8f0fe' : item.is_active ? '#fafafa' : '#f5f5f5', display: 'flex', alignItems: 'center', gap: 8, cursor: 'grab', opacity: dragIdx === idx ? 0.5 : item.is_active ? 1 : 0.5 }}>
                <span style={{ color: '#aaa', fontSize: 14, userSelect: 'none' }}>⠿</span>
                <IconPicker value={item.icon || 'ph:star'} onChange={icon => updateIcon(item.id, icon)} />
                {editId === item.id ? (
                  <div style={{ position: 'absolute', left: 0, right: 0, top: 0, background: '#fafafa', borderRadius: 10, border: '2px solid #1B6EF3', padding: '10px 12px', zIndex: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <input value={editLabel} onChange={e => setEditLabel(e.target.value)} onKeyDown={e => { if (e.key === 'Escape') setEditId(null) }} autoFocus style={{ ...inputStyle, fontSize: 13, padding: '6px 8px' }} />
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => saveLabel(item.id)} style={{ ...btnPrimary, padding: '6px 14px', fontSize: 12 }}>적용하기</button>
                      <button onClick={() => setEditId(null)} style={{ background: 'none', border: '1px solid #ccc', borderRadius: 6, padding: '6px 10px', fontSize: 12, cursor: 'pointer', color: '#666' }}>취소</button>
                    </div>
                  </div>
                ) : (
                  <span onClick={() => { setEditId(item.id); setEditLabel(item.label) }} style={{ flex: 1, fontSize: 13, color: '#222', cursor: 'text', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
                )}
                <button onClick={() => setExpandedId(expandedId === item.id ? null : item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, opacity: 0.7, color: expandedId === item.id ? '#1B6EF3' : '#888' }}>✏️</button>
                <button onClick={() => toggleActive(item.id, item.is_active)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, opacity: 0.7 }}>{item.is_active ? '✅' : '⬜'}</button>
                <button onClick={() => setDeleteConfirmId(item.id)} style={{ background: 'none', border: 'none', color: '#e05252', cursor: 'pointer', fontSize: 14 }}>✕</button>
              </div>
              {expandedId === item.id && (
                <div style={{ border: '1px solid #E2E8F0', borderTop: 'none', borderRadius: '0 0 10px 10px', padding: '12px 14px', background: '#F8FAFC', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600, width: 70, flexShrink: 0, paddingTop: 4 }}>🖼 이미지</span>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {item.image_url && (
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                          <img src={item.image_url} alt="" style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid #E2E8F0' }} />
                          <button onClick={() => deleteItemImage(item.id)} style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: 4, color: '#fff', fontSize: 11, cursor: 'pointer', padding: '2px 5px' }}>✕</button>
                        </div>
                      )}
                      <label style={{ display: 'inline-block', padding: '6px 12px', borderRadius: 8, border: '1.5px dashed #CBD5E1', fontSize: 12, color: '#64748B', cursor: 'pointer', background: '#fff', textAlign: 'center' }}>
                        {item.image_url ? '이미지 교체' : '+ 이미지 업로드'}
                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) uploadItemImage(item.id, f) }} />
                      </label>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600, width: 70, flexShrink: 0 }}>📍 Suburb</span>
                    <input value={getDetailEdit(item).address} onChange={e => setDetailEdit(item.id, 'address', e.target.value)} placeholder="예: Surry Hills NSW 2010" style={{ ...inputStyle, flex: 1, fontSize: 12, padding: '5px 8px' }} />
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600, width: 70, flexShrink: 0, paddingTop: 6 }}>📝 설명</span>
                    <textarea value={getDetailEdit(item).description} onChange={e => setDetailEdit(item.id, 'description', e.target.value)} rows={5} style={{ ...inputStyle, flex: 1, fontSize: 12, padding: '5px 8px', resize: 'vertical' }} />
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600, width: 70, flexShrink: 0, paddingTop: 6 }}>💡 팁</span>
                    <textarea value={getDetailEdit(item).tips} onChange={e => setDetailEdit(item.id, 'tips', e.target.value)} rows={2} style={{ ...inputStyle, flex: 1, fontSize: 12, padding: '5px 8px', resize: 'vertical' }} />
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600, width: 70, flexShrink: 0, paddingTop: 6 }}>🏢 관련업체</span>
                    <EditBizMultiSearch businesses={businesses} values={item.related_business_ids ?? (item.related_business_id ? [item.related_business_id] : [])} onChange={ids => saveRelatedBiz(item.id, ids)} />
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600, width: 70, flexShrink: 0, paddingTop: 6 }}>🛍 관련상품</span>
                    <EditProdMultiSearch products={products} values={item.related_product_ids ?? []} onChange={ids => saveRelatedProducts(item.id, ids)} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 4 }}>
                    <button onClick={async () => { const edit = getDetailEdit(item); await saveDetail(item.id, 'address', edit.address); await saveDetail(item.id, 'description', edit.description); await saveDetail(item.id, 'tips', edit.tips); showToast('✅ 상세정보 저장됨') }} style={{ ...btnPrimary, padding: '8px 20px', fontSize: 13 }}>적용하기</button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {catItems.length === 0 && <div style={{ textAlign: 'center', color: '#aaa', fontSize: 13, padding: '20px 0' }}>이 카테고리에 항목이 없어요</div>}
        </div>
      </Card>
    </>
  )
}
