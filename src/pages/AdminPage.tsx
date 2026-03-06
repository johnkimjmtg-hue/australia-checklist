import { useState, useEffect } from 'react'
import { CATEGORIES } from '../data/businesses'
import {
  Business,
  getBusinesses,
  createBusiness,
  updateBusiness,
  toggleFeatured,
} from '../lib/businessService'
import { supabase } from '../lib/supabase'

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'hojugaja2024'

type View = 'list' | 'form'

const EMPTY_FORM = {
  id: '', name: '', category: 'realestate', description: '',
  phone: '', website: '', kakao: '', address: '', city: '',
  is_featured: false, is_active: true, tags: '',
}

export default function AdminPage({ onBack }: { onBack: () => void }) {
  const [authed, setAuthed]       = useState(false)
  const [pw, setPw]               = useState('')
  const [pwError, setPwError]     = useState(false)
  const [view, setView]           = useState<View>('list')
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading]     = useState(true)
  const [form, setForm]           = useState(EMPTY_FORM)
  const [editId, setEditId]       = useState<string | null>(null)
  const [saving, setSaving]       = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [toast, setToast]         = useState('')

  useEffect(() => {
    if (authed) loadBusinesses()
  }, [authed])

  async function loadBusinesses() {
    setLoading(true)
    const data = await getBusinesses()
    setBusinesses(data)
    setLoading(false)
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  function handleLogin() {
    if (pw === ADMIN_PASSWORD) { setAuthed(true); setPwError(false) }
    else { setPwError(true) }
  }

  function handleNew() {
    setForm(EMPTY_FORM); setEditId(null); setView('form')
  }

  function handleEdit(b: Business) {
    setForm({
      id: b.id, name: b.name, category: b.category,
      description: b.description || '', phone: b.phone || '',
      website: b.website || '', kakao: b.kakao || '',
      address: b.address || '', city: b.city,
      is_featured: b.is_featured, is_active: b.is_active,
      tags: b.tags?.join(', ') || '',
    })
    setEditId(b.id); setView('form')
  }

  async function handleSave() {
    if (!form.name || !form.category || !form.city) {
      showToast('업체명, 카테고리, 도시는 필수예요'); return
    }
    setSaving(true)
    const payload = {
      ...form,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      rating: 0, reviews_count: 0,
    }
    if (editId) {
      await updateBusiness(editId, payload)
      showToast('✅ 업체 수정 완료')
    } else {
      // id 자동생성 (이름 slug)
      const slug = form.name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')
      await createBusiness({ ...payload, id: slug })
      showToast('✅ 업체 등록 완료')
    }
    await loadBusinesses()
    setSaving(false); setView('list')
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('businesses').delete().eq('id', id)
    if (!error) { showToast('🗑 업체 삭제 완료'); await loadBusinesses() }
    setDeleteConfirm(null)
  }

  async function handleToggleFeatured(id: string, current: boolean) {
    await toggleFeatured(id, !current)
    showToast(current ? '추천 해제' : '⭐ 추천 업체 설정')
    await loadBusinesses()
  }

  // ── 비밀번호 화면
  if (!authed) return (
    <div style={{
      minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      background:'linear-gradient(170deg,#eef2fa,#f5f7fb)',
      fontFamily:'-apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif',
    }}>
      <div style={{
        background:'#fff', borderRadius:20, padding:'32px 24px',
        boxShadow:'0 8px 32px rgba(30,77,131,0.12)', width:'calc(100% - 48px)', maxWidth:320,
      }}>
        <div style={{ fontSize:28, textAlign:'center', marginBottom:8 }}>🔒</div>
        <div style={{ fontSize:17, fontWeight:900, color:'#0F1B2D', textAlign:'center', marginBottom:4 }}>Admin</div>
        <div style={{ fontSize:12, color:'#8AAAC8', textAlign:'center', marginBottom:24 }}>호주가자 관리자 페이지</div>
        <input
          type="password"
          placeholder="비밀번호"
          value={pw}
          onChange={e => setPw(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          style={{ ...inputStyle, marginBottom:8 }}
        />
        {pwError && <div style={{ color:'#e8420a', fontSize:12, marginBottom:8, fontWeight:700 }}>비밀번호가 틀렸어요</div>}
        <button onClick={handleLogin} style={primaryBtn}>로그인</button>
        <button onClick={onBack} style={{ ...ghostBtn, marginTop:8 }}>← 돌아가기</button>
      </div>
    </div>
  )

  // ── 등록/수정 폼
  if (view === 'form') return (
    <div style={{
      minHeight:'100vh', background:'linear-gradient(170deg,#eef2fa,#f5f7fb)',
      fontFamily:'-apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif',
      paddingBottom:40,
    }}>
      {/* 헤더 */}
      <div style={headerStyle}>
        <button onClick={() => setView('list')} style={backBtn}>←</button>
        <div style={{ fontSize:16, fontWeight:900, color:'#0F1B2D' }}>
          {editId ? '업체 수정' : '업체 등록'}
        </div>
      </div>

      <div style={{ padding:'20px 16px 0' }}>
        <FormCard>
          <Label>업체명 *</Label>
          <input placeholder="예: Palas Property" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} style={inputStyle}/>

          <Label>카테고리 *</Label>
          <select value={form.category} onChange={e => setForm(f=>({...f,category:e.target.value}))} style={inputStyle}>
            {CATEGORIES.filter(c=>c.id!=='all').map(c=>(
              <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>
            ))}
          </select>

          <Label>도시 *</Label>
          <input placeholder="예: Sydney CBD, Chatswood, Melbourne" value={form.city} onChange={e => setForm(f=>({...f,city:e.target.value}))} style={inputStyle}/>

          <Label>주소</Label>
          <input placeholder="예: 123 George Street" value={form.address} onChange={e => setForm(f=>({...f,address:e.target.value}))} style={inputStyle}/>

          <Label>업체 소개</Label>
          <textarea placeholder="업체 설명을 입력하세요" value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} rows={3} style={{...inputStyle, resize:'none'}}/>

          <Label>태그 (쉼표로 구분)</Label>
          <input placeholder="예: 부동산 구매, 투자 상담" value={form.tags} onChange={e => setForm(f=>({...f,tags:e.target.value}))} style={inputStyle}/>

          <Label>전화번호</Label>
          <input placeholder="+61 2 1234 5678" value={form.phone} onChange={e => setForm(f=>({...f,phone:e.target.value}))} style={inputStyle}/>

          <Label>웹사이트</Label>
          <input placeholder="https://..." value={form.website} onChange={e => setForm(f=>({...f,website:e.target.value}))} style={inputStyle}/>

          <Label>카카오톡 ID</Label>
          <input placeholder="카카오톡 오픈채팅 ID" value={form.kakao} onChange={e => setForm(f=>({...f,kakao:e.target.value}))} style={inputStyle}/>

          <div style={{ display:'flex', gap:16, marginTop:8 }}>
            <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, fontWeight:700, color:'#1E4D83', cursor:'pointer' }}>
              <input type="checkbox" checked={form.is_featured} onChange={e => setForm(f=>({...f,is_featured:e.target.checked}))}/>
              ⭐ 추천 업체
            </label>
            <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, fontWeight:700, color:'#1E4D83', cursor:'pointer' }}>
              <input type="checkbox" checked={form.is_active} onChange={e => setForm(f=>({...f,is_active:e.target.checked}))}/>
              ✅ 활성화
            </label>
          </div>

          <button onClick={handleSave} disabled={saving} style={{...primaryBtn, marginTop:20}}>
            {saving ? '저장 중...' : editId ? '수정 완료' : '등록하기'}
          </button>
        </FormCard>
      </div>
    </div>
  )

  // ── 업체 목록
  return (
    <div style={{
      minHeight:'100vh', background:'linear-gradient(170deg,#eef2fa,#f5f7fb)',
      fontFamily:'-apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif',
      paddingBottom:40,
    }}>
      {/* 토스트 */}
      {toast && (
        <div style={{
          position:'fixed', top:20, left:'50%', transform:'translateX(-50%)',
          background:'#1E4D83', color:'#fff', borderRadius:20, padding:'10px 20px',
          fontSize:13, fontWeight:800, zIndex:999, boxShadow:'0 4px 16px rgba(30,77,131,0.3)',
        }}>{toast}</div>
      )}

      {/* 삭제 확인 모달 */}
      {deleteConfirm && (
        <>
          <div onClick={() => setDeleteConfirm(null)} style={{ position:'fixed', inset:0, background:'rgba(10,20,40,0.45)', zIndex:600 }}/>
          <div style={{
            position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
            background:'#fff', borderRadius:20, padding:'24px 20px',
            zIndex:601, width:'calc(100% - 48px)', maxWidth:300, textAlign:'center',
            boxShadow:'0 16px 40px rgba(30,77,131,0.15)',
          }}>
            <div style={{ fontSize:13, fontWeight:800, color:'#0F1B2D', marginBottom:8 }}>정말 삭제할까요?</div>
            <div style={{ fontSize:12, color:'#5A7090', marginBottom:20 }}>삭제하면 되돌릴 수 없어요</div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => setDeleteConfirm(null)} style={ghostBtn}>취소</button>
              <button onClick={() => handleDelete(deleteConfirm)} style={{...primaryBtn, background:'#e8420a', flex:2}}>삭제</button>
            </div>
          </div>
        </>
      )}

      {/* 헤더 */}
      <div style={headerStyle}>
        <button onClick={onBack} style={backBtn}>←</button>
        <div>
          <div style={{ fontSize:16, fontWeight:900, color:'#0F1B2D' }}>Admin</div>
          <div style={{ fontSize:11, color:'#8AAAC8' }}>업체 관리</div>
        </div>
        <button onClick={handleNew} style={{
          marginLeft:'auto', background:'linear-gradient(135deg,#3A7FCC,#1E4D83)',
          color:'#fff', border:'none', borderRadius:10, padding:'8px 16px',
          fontSize:13, fontWeight:800, cursor:'pointer',
        }}>+ 업체 등록</button>
      </div>

      <div style={{ padding:'16px 16px 0' }}>
        <div style={{ fontSize:12, color:'#8AAAC8', fontWeight:700, marginBottom:12 }}>
          총 {businesses.length}개 업체
        </div>

        {loading ? (
          <div style={{ textAlign:'center', color:'#8AAAC8', padding:40 }}>불러오는 중...</div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {businesses.map(b => (
              <div key={b.id} style={{
                background:'#fff', borderRadius:14, padding:'14px 16px',
                boxShadow:'0 2px 10px rgba(30,77,131,0.07)',
                border: b.is_featured ? '1.5px solid rgba(30,77,131,0.18)' : '1px solid rgba(200,215,240,0.5)',
              }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
                  <div>
                    <span style={{ fontSize:14, fontWeight:900, color:'#0F1B2D' }}>{b.name}</span>
                    {b.is_featured && <span style={{ marginLeft:6, fontSize:10, background:'#1E4D83', color:'#fff', borderRadius:10, padding:'2px 7px', fontWeight:800 }}>추천</span>}
                    {!b.is_active && <span style={{ marginLeft:6, fontSize:10, background:'#e8420a', color:'#fff', borderRadius:10, padding:'2px 7px', fontWeight:800 }}>비활성</span>}
                  </div>
                  <span style={{ fontSize:11, color:'#8AAAC8' }}>{CATEGORIES.find(c=>c.id===b.category)?.emoji} {CATEGORIES.find(c=>c.id===b.category)?.label}</span>
                </div>
                <div style={{ fontSize:11, color:'#7a8fb5', marginBottom:10 }}>📍 {b.city} · ⭐ {b.rating} ({b.reviews_count})</div>

                <div style={{ display:'flex', gap:6 }}>
                  <button onClick={() => handleEdit(b)} style={{
                    flex:1, padding:'7px', background:'rgba(200,218,248,0.5)',
                    border:'none', borderRadius:8, color:'#1E4D83', fontWeight:800, fontSize:12, cursor:'pointer',
                  }}>✏️ 수정</button>
                  <button onClick={() => handleToggleFeatured(b.id, b.is_featured)} style={{
                    flex:1, padding:'7px',
                    background: b.is_featured ? 'rgba(255,220,50,0.2)' : 'rgba(200,218,248,0.3)',
                    border:'none', borderRadius:8, color: b.is_featured ? '#b8860b' : '#1E4D83',
                    fontWeight:800, fontSize:12, cursor:'pointer',
                  }}>{b.is_featured ? '⭐ 추천해제' : '☆ 추천설정'}</button>
                  <button onClick={() => setDeleteConfirm(b.id)} style={{
                    padding:'7px 12px', background:'rgba(232,66,10,0.08)',
                    border:'none', borderRadius:8, color:'#e8420a', fontWeight:800, fontSize:12, cursor:'pointer',
                  }}>🗑</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function FormCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background:'#fff', borderRadius:16, padding:'20px 16px',
      boxShadow:'0 2px 10px rgba(30,77,131,0.07)',
      display:'flex', flexDirection:'column', gap:10,
    }}>{children}</div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize:12, fontWeight:800, color:'#1E4D83', marginTop:4 }}>{children}</div>
}

const inputStyle: React.CSSProperties = {
  width:'100%', padding:'10px 12px',
  border:'1px solid rgba(30,77,131,0.15)', borderRadius:8,
  fontSize:13, color:'#0F1B2D', background:'#f8fafd',
  fontFamily:'-apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif',
  boxSizing:'border-box', outline:'none',
}

const primaryBtn: React.CSSProperties = {
  width:'100%', padding:'13px',
  background:'linear-gradient(135deg,#3A7FCC,#1E4D83)',
  color:'#fff', border:'none', borderRadius:12,
  fontSize:14, fontWeight:900, cursor:'pointer',
}

const ghostBtn: React.CSSProperties = {
  flex:1, padding:'11px',
  background:'#fff', border:'1px solid rgba(30,77,131,0.15)',
  borderRadius:12, color:'#5A7090', fontWeight:700, fontSize:13, cursor:'pointer',
}

const headerStyle: React.CSSProperties = {
  position:'sticky', top:0, zIndex:10,
  background:'rgba(238,242,250,0.95)', backdropFilter:'blur(10px)',
  padding:'16px 16px 14px',
  borderBottom:'1px solid rgba(200,215,240,0.4)',
  display:'flex', alignItems:'center', gap:12,
}

const backBtn: React.CSSProperties = {
  background:'none', border:'none', cursor:'pointer',
  fontSize:20, padding:0, color:'#1E4D83',
}
