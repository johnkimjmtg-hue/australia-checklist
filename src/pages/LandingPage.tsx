import { useState, useRef } from 'react'
import { Icon } from '@iconify/react'
import { AppState } from '../store/state'
import { ITEMS, CATEGORIES } from '../data/checklist'
import { CATEGORIES as BCATS } from '../data/businesses'

type Props = { state: AppState; onStart: () => void; onServices: () => void }

const ff = '"Pretendard",-apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif'
const GOOGLE_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY

let _mapsPromise: Promise<void> | null = null
function loadGoogleMaps(): Promise<void> {
  if (_mapsPromise) return _mapsPromise
  _mapsPromise = new Promise((resolve, reject) => {
    if ((window as any).google?.maps?.places) { resolve(); return }
    const s = document.createElement('script')
    s.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_KEY}&libraries=places&v=weekly`
    s.onload = () => setTimeout(() => resolve(), 100)
    s.onerror = () => reject(new Error('Google Maps load failed'))
    document.head.appendChild(s)
  })
  return _mapsPromise
}

function AddressAutocomplete({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [loading, setLoading]         = useState(false)
  const debounceRef = useRef<any>(null)

  async function handleInput(val: string) {
    onChange(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!val.trim() || val.length < 3) { setSuggestions([]); return }
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        await loadGoogleMaps()
        const places = (window as any).google.maps.places
        const AutocompleteSuggestion = places.AutocompleteSuggestion || places.autocomplete?.AutocompleteSuggestion
        if (!AutocompleteSuggestion) throw new Error('not available')
        const { suggestions: results } = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: val, includedRegionCodes: ['au'],
        })
        setSuggestions(results || [])
      } catch { setSuggestions([]) }
      finally { setLoading(false) }
    }, 400)
  }

  async function handleSelect(suggestion: any) {
    setSuggestions([])
    try {
      const place = suggestion.placePrediction.toPlace()
      await place.fetchFields({ fields: ['addressComponents', 'formattedAddress'] })
      const c = place.addressComponents || []
      const streetNum = c.find((x: any) => x.types.includes('street_number'))?.longText || ''
      const route     = c.find((x: any) => x.types.includes('route'))?.longText || ''
      const suburb    = c.find((x: any) => x.types.includes('locality') || x.types.includes('sublocality_level_1'))?.longText || ''
      const state_    = c.find((x: any) => x.types.includes('administrative_area_level_1'))?.shortText || ''
      const post      = c.find((x: any) => x.types.includes('postal_code'))?.longText || ''
      onChange([streetNum, route, suburb, state_, post].filter(Boolean).join(', '))
    } catch {}
  }

  const inputStyle: React.CSSProperties = {
    width:'100%', height:44, border:'1px solid #E2E8F0', borderRadius:10,
    padding:'0 12px', fontSize:14, color:'#1E293B', background:'#fff',
    boxSizing:'border-box', fontFamily:ff, outline:'none',
  }

  return (
    <div style={{ position:'relative' }}>
      <input value={value} onChange={e => handleInput(e.target.value)}
        placeholder="123 George St, Sydney NSW 2000" style={inputStyle} />
      {loading && <div style={{ fontSize:11, color:'#94A3B8', marginTop:4 }}>검색 중...</div>}
      {suggestions.length > 0 && (
        <div style={{
          position:'absolute', top:'100%', left:0, right:0, zIndex:200,
          background:'#fff', borderRadius:10, boxShadow:'0 4px 20px rgba(0,0,0,0.12)',
          border:'1px solid #E2E8F0', overflow:'hidden', marginTop:4,
        }}>
          {suggestions.map((s: any, i: number) => (
            <div key={i} onClick={() => handleSelect(s)} style={{
              padding:'10px 14px', fontSize:13, cursor:'pointer',
              borderBottom:'1px solid #F1F5F9', color:'#1E293B',
              display:'flex', alignItems:'center', gap:8,
            }}
              onMouseEnter={e => (e.currentTarget.style.background='#F0F4FF')}
              onMouseLeave={e => (e.currentTarget.style.background='#fff')}
            >
              <Icon icon="ph:map-pin-simple" width={14} height={14} color="#003594" />
              {s.placePrediction?.text?.text || ''}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const PREVIEW_ITEMS = [
  { id:'h01', icon:'ph:tooth',         label:'치과 스케일링',       done:true  },
  { id:'f06', icon:'ph:fork-knife',    label:'삼겹살 무한리필',     done:true  },
  { id:'s05', icon:'ph:sunglasses',    label:'선글라스 쇼핑',       done:false },
  { id:'g04', icon:'ph:waves',         label:'본다이 비치',         done:false },
  { id:'a01', icon:'ph:identification-card', label:'비자 서류 준비', done:true },
]

const CAT_ICON_MAP: Record<string, string> = {
  hospital:'ph:first-aid-kit', food:'ph:fork-knife',    shopping:'ph:shopping-bag',
  admin:'ph:files',            people:'ph:users',        parenting:'ph:baby',
  places:'ph:map-pin',         schedule:'ph:calendar',   custom:'ph:pencil-simple',
}

function RequestForm({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    business_name: '', category: '', address: '', description: '',
    hashtags: '', phone: '', kakao: '', website: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (!form.business_name.trim()) { setError('업체명을 입력해주세요'); return }
    if (!form.category)             { setError('카테고리를 선택해주세요'); return }
    if (!form.address.trim())       { setError('주소를 입력해주세요'); return }
    if (!form.description.trim())   { setError('업체 설명을 입력해주세요'); return }
    const tags = form.hashtags.split(/[,#\s]+/).map(t => t.trim()).filter(Boolean)
    if (tags.length < 3) { setError('해시태그를 3개 이상 입력해주세요'); return }
    setError(''); setSubmitting(true)
    try {
      const { supabase } = await import('../lib/supabase')
      const { error: err } = await supabase.from('business_requests').insert({
        business_name: form.business_name.trim(),
        category:      form.category,
        address:       form.address.trim(),
        description:   form.description.trim(),
        hashtags:      tags,
        phone:         form.phone.trim() || null,
        kakao:         form.kakao.trim() || null,
        website:       form.website.trim() || null,
      })
      if (err) throw err
      setDone(true)
    } catch { setError('제출 중 오류가 발생했습니다. 다시 시도해주세요.') }
    setSubmitting(false)
  }

  const inputStyle: React.CSSProperties = {
    width:'100%', height:44, border:'1px solid #E2E8F0', borderRadius:10,
    padding:'0 12px', fontSize:14, color:'#1E293B', background:'#fff',
    boxSizing:'border-box', fontFamily:ff, outline:'none',
  }
  const taStyle: React.CSSProperties = { ...inputStyle, height:80, padding:'10px 12px', resize:'none' as any }
  const label = (txt: string, sub?: string) => (
    <div style={{ fontSize:12, fontWeight:700, color:'#64748B', marginBottom:5 }}>
      {txt} {sub && <span style={{ fontWeight:500, color:'#94A3B8' }}>{sub}</span>}
    </div>
  )

  const businessCats = BCATS.filter(c => c.id !== 'all')

  if (done) return (
    <div style={{ textAlign:'center', padding:'32px 0' }}>
      <div style={{ width:56, height:56, borderRadius:'50%', background:'rgba(22,163,74,0.1)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
        <Icon icon="ph:check-circle" width={32} height={32} color="#16A34A" />
      </div>
      <div style={{ fontSize:18, fontWeight:800, color:'#1E293B', marginBottom:8 }}>신청이 완료됐어요!</div>
      <div style={{ fontSize:13, color:'#64748B', lineHeight:1.6, marginBottom:24 }}>검토 후 등록해드릴게요.<br/>감사합니다 🙏</div>
      <button onClick={onClose} style={{
        width:'100%', height:48, background:'#003594', color:'#fff',
        border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer',
      }}>확인</button>
    </div>
  )

  return (
    <div>
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <div>
          {label('업체명 *')}
          <input value={form.business_name} onChange={e => set('business_name', e.target.value)}
            placeholder="업체명을 입력하세요" style={inputStyle} />
        </div>
        <div>
          {label('카테고리 *')}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6 }}>
            {businessCats.map(cat => (
              <button key={cat.id} onClick={() => set('category', cat.id)} style={{
                height:36, borderRadius:8, border:'none', cursor:'pointer',
                background: form.category === cat.id ? '#003594' : '#fff',
                color: form.category === cat.id ? '#fff' : '#1E293B',
                fontSize:12, fontWeight:700,
                boxShadow: form.category === cat.id ? '0 2px 8px rgba(0,53,148,0.25)' : '0 1px 4px rgba(0,0,0,0.08)',
              }}>{cat.label}</button>
            ))}
          </div>
        </div>
        <div>
          {label('주소 (Full Address) *')}
          <AddressAutocomplete value={form.address} onChange={v => set('address', v)} />
        </div>
        <div>
          {label('업체 설명 *')}
          <textarea value={form.description} onChange={e => set('description', e.target.value)}
            placeholder="업체 소개를 간단히 작성해주세요" style={taStyle as any} />
        </div>
        <div>
          {label('해시태그 *', '(3개 이상, 쉼표 또는 띄어쓰기로 구분)')}
          <input value={form.hashtags} onChange={e => set('hashtags', e.target.value)}
            placeholder="한식당, 시드니, 가족식사, 주차가능" style={inputStyle} />
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <div>
            {label('전화번호')}
            <input value={form.phone} onChange={e => set('phone', e.target.value)}
              placeholder="+61 2 1234 5678" style={inputStyle} />
          </div>
          <div>
            {label('카카오 오픈채팅')}
            <input value={form.kakao} onChange={e => set('kakao', e.target.value)}
              placeholder="오픈채팅 링크" style={inputStyle} />
          </div>
        </div>
        <div>
          {label('웹사이트')}
          <input value={form.website} onChange={e => set('website', e.target.value)}
            placeholder="https://www.example.com" style={inputStyle} />
        </div>
      </div>

      {error && (
        <div style={{ marginTop:10, padding:'8px 12px', background:'rgba(239,68,68,0.08)', borderRadius:8, fontSize:12, color:'#DC2626', fontWeight:600 }}>
          {error}
        </div>
      )}

      <button onClick={handleSubmit} disabled={submitting} style={{
        width:'100%', marginTop:16, height:50,
        background:'#003594', color:'#fff',
        border:'none', borderRadius:10, fontSize:15, fontWeight:800,
        cursor: submitting ? 'default' : 'pointer', opacity: submitting ? 0.7 : 1,
        boxShadow:'0 4px 14px rgba(0,53,148,0.25)',
      }}>{submitting ? '제출 중...' : '등록 신청하기'}</button>
    </div>
  )
}

// ── 버킷리스트 추천 폼
function SuggestionForm({ onClose }: { onClose: () => void }) {
  const [suggestion, setSuggestion] = useState('')
  const [email, setEmail]           = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone]             = useState(false)
  const [error, setError]           = useState('')

  const inputStyle: React.CSSProperties = {
    width:'100%', height:44, border:'1px solid #E2E8F0', borderRadius:10,
    padding:'0 12px', fontSize:14, color:'#1E293B', background:'#fff',
    boxSizing:'border-box', fontFamily:ff, outline:'none',
  }
  const taStyle: React.CSSProperties = {
    ...inputStyle, height:110, padding:'12px', resize:'none' as any, lineHeight:1.6,
  }

  const handleSubmit = async () => {
    if (!suggestion.trim()) { setError('추천 내용을 입력해주세요'); return }
    setError(''); setSubmitting(true)
    try {
      const { supabase } = await import('../lib/supabase')
      const { error: err } = await supabase.from('item_suggestions').insert({
        suggestion: suggestion.trim(),
        email:      email.trim() || null,
      })
      if (err) throw err
      setDone(true)
    } catch { setError('제출 중 오류가 발생했어요. 다시 시도해주세요.') }
    setSubmitting(false)
  }

  if (done) return (
    <div style={{ textAlign:'center', padding:'32px 0' }}>
      <div style={{ fontSize:48, marginBottom:16 }}>🙏</div>
      <div style={{ fontSize:18, fontWeight:800, color:'#1E293B', marginBottom:8 }}>공유해 주셔서 감사합니다!</div>
      <div style={{ fontSize:13, color:'#64748B', lineHeight:1.7, marginBottom:24 }}>
        소중한 경험을 나눠주셨어요.<br/>
        채택되면 이메일로 알려드릴게요 😊
      </div>
      <button onClick={onClose} style={{
        width:'100%', height:48, background:'#003594', color:'#fff',
        border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer',
      }}>확인</button>
    </div>
  )

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <div style={{ background:'rgba(0,53,148,0.05)', borderRadius:10, padding:'12px 14px' }}>
        <div style={{ fontSize:13, color:'#003594', fontWeight:700, marginBottom:4 }}>💡 이런 것들을 추천해주세요</div>
        <div style={{ fontSize:12, color:'#64748B', lineHeight:1.6 }}>
          호주에서 꼭 해봐야 할 것, 먹어봐야 할 것,<br/>가봐야 할 곳, 해결해야 할 것 등 뭐든 좋아요!
        </div>
      </div>

      <div>
        <div style={{ fontSize:12, fontWeight:700, color:'#64748B', marginBottom:5 }}>추천 내용 *</div>
        <textarea
          value={suggestion}
          onChange={e => setSuggestion(e.target.value)}
          placeholder="예) 본다이 비치에서 서핑 레슨 받기, 시드니 새해 불꽃놀이 보기..."
          style={taStyle as any}
        />
      </div>

      <div>
        <div style={{ fontSize:12, fontWeight:700, color:'#64748B', marginBottom:5 }}>
          이메일 <span style={{ fontWeight:500, color:'#94A3B8' }}>(선택 · 채택 시 알림)</span>
        </div>
        <input
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="example@email.com"
          type="email"
          style={inputStyle}
        />
      </div>

      {error && (
        <div style={{ padding:'8px 12px', background:'rgba(239,68,68,0.08)', borderRadius:8, fontSize:12, color:'#DC2626', fontWeight:600 }}>
          {error}
        </div>
      )}

      <button onClick={handleSubmit} disabled={submitting} style={{
        width:'100%', height:50, background:'#003594', color:'#fff',
        border:'none', borderRadius:10, fontSize:15, fontWeight:800,
        cursor: submitting ? 'default' : 'pointer', opacity: submitting ? 0.7 : 1,
        boxShadow:'0 4px 14px rgba(0,53,148,0.25)',
        display:'flex', alignItems:'center', justifyContent:'center', gap:6,
        marginTop:4,
      }}>
        <Icon icon="ph:paper-plane-tilt" width={16} height={16} color="#FFCD00" />
        {submitting ? '제출 중...' : '추천 제출하기'}
      </button>
    </div>
  )
}

export default function LandingPage({ state, onStart, onServices }: Props) {
  const total = ITEMS.length + state.customItems.length
  const [showForm, setShowForm] = useState(false)
  const [showSuggestion, setShowSuggestion] = useState(false)
  const [logoTap, setLogoTap] = useState(0)
  const logoTimer = { current: null as any }

  const handleLogoTap = () => {
    const next = logoTap + 1
    setLogoTap(next)
    if (logoTimer.current) clearTimeout(logoTimer.current)
    if (next >= 5) { window.location.href = '/admin'; setLogoTap(0); return }
    logoTimer.current = setTimeout(() => setLogoTap(0), 2000)
  }

  return (
    <div style={{ minHeight:'100vh', background:'#F5F8FF', fontFamily:ff, overflowX:'hidden' }}>
      <style>{`
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
        @keyframes fadeInUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes float    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes shimmer  { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }
        @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:0.6} }
      `}</style>

      {/* ── 헤더 ── */}
      <div style={{
        position:'sticky', top:0, zIndex:50,
        background:'rgba(255,255,255,0.96)', backdropFilter:'blur(12px)',
        borderBottom:'1px solid #F0F4FF',
        padding:'12px 20px',
        display:'flex', alignItems:'center', justifyContent:'space-between',
      }}>
        <div onClick={handleLogoTap} style={{ cursor:'pointer', userSelect:'none' as any, display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:28, height:28, borderRadius:8, background:'#003594', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span style={{ fontSize:14 }}>🦘</span>
          </div>
          <span style={{ fontSize:15, fontWeight:900, color:'#003594', letterSpacing:0.5 }}>호주가자</span>
        </div>
        <button onClick={onStart} style={{
          height:34, padding:'0 16px', borderRadius:20, border:'none',
          background:'#003594', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer',
          display:'flex', alignItems:'center', gap:5,
          boxShadow:'0 2px 8px rgba(0,53,148,0.25)',
        }}>
          <Icon icon="ph:list-checks" width={13} height={13} color="#FFCD00" />
          버킷리스트
        </button>
      </div>

      {/* ── 히어로 섹션 ── */}
      <div style={{
        background:'linear-gradient(160deg, #001f5c 0%, #003594 55%, #1a5fb5 100%)',
        padding:'44px 24px 52px',
        textAlign:'center', position:'relative', overflow:'hidden',
      }}>
        {/* 배경 장식 */}
        <div style={{ position:'absolute', top:-60, right:-60, width:200, height:200, borderRadius:'50%', background:'rgba(255,205,0,0.07)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', bottom:-40, left:-40, width:150, height:150, borderRadius:'50%', background:'rgba(255,255,255,0.04)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', top:16, left:16, fontSize:44, opacity:0.07, pointerEvents:'none', transform:'rotate(-15deg)' }}>🦘</div>
        <div style={{ position:'absolute', bottom:24, right:16, fontSize:34, opacity:0.07, pointerEvents:'none', transform:'rotate(10deg)' }}>🌏</div>

        <div style={{ animation:'fadeInUp 0.6s ease both' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(255,205,0,0.18)', borderRadius:20, padding:'6px 16px', marginBottom:20, border:'1px solid rgba(255,205,0,0.25)' }}>
            <span style={{ fontSize:12 }}>✈️</span>
            <span style={{ fontSize:11, fontWeight:700, color:'#FFCD00', letterSpacing:0.5 }}>호주 이민·여행자를 위한</span>
          </div>
        </div>

        <div style={{ animation:'fadeInUp 0.6s ease 0.1s both' }}>
          <div style={{ fontSize:30, fontWeight:900, color:'#fff', lineHeight:1.25, marginBottom:10, letterSpacing:-0.5 }}>
            호주에서 꼭 해야 할<br/>
            <span style={{ color:'#FFCD00' }}>모든 것</span>을 담았어요 🎉
          </div>
        </div>

        <div style={{ animation:'fadeInUp 0.6s ease 0.2s both' }}>
          <div style={{ fontSize:14, color:'rgba(255,255,255,0.75)', lineHeight:1.8, marginBottom:14 }}>
            {total}개 항목 · {CATEGORIES.length}개 카테고리<br/>나만의 호주 버킷리스트를 만들어보세요
          </div>
          <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(255,255,255,0.12)', borderRadius:20, padding:'7px 16px', marginBottom:28, border:'1px solid rgba(255,255,255,0.15)' }}>
            <span style={{ fontSize:12 }}>📱</span>
            <span style={{ fontSize:12, color:'rgba(255,255,255,0.90)', fontWeight:600 }}>앱 설치 없이 폰으로 바로 체크해요</span>
          </div>

          {/* ── 히어로 CTA 버튼 ── */}
          <div style={{ display:'flex', gap:10, marginBottom:28 }}>
            <button onClick={onStart} style={{
              flex:1, height:52, background:'#FFCD00', color:'#002870',
              border:'none', borderRadius:14, fontSize:14, fontWeight:800,
              cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6,
              boxShadow:'0 6px 20px rgba(255,205,0,0.40)',
            }}>
              <Icon icon="ph:list-checks" width={18} height={18} color="#002870" />
              나의 버킷리스트
            </button>
            <button onClick={onServices} style={{
              flex:1, height:52, background:'rgba(255,255,255,0.14)', color:'#fff',
              border:'1.5px solid rgba(255,255,255,0.28)', borderRadius:14, fontSize:14, fontWeight:700,
              cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6,
              backdropFilter:'blur(4px)',
            }}>
              <Icon icon="ph:buildings" width={18} height={18} color="#fff" />
              업체/서비스
            </button>
          </div>
        </div>

        {/* 앱 미리보기 카드 */}
        <div style={{
          background:'#fff', borderRadius:16, padding:'16px',
          maxWidth:300, margin:'0 auto',
          boxShadow:'0 20px 60px rgba(0,0,0,0.3)',
          animation:'fadeInUp 0.6s ease 0.3s both, float 4s ease-in-out 1s infinite',
          position:'relative', overflow:'hidden',
        }}>
          {/* shimmer */}
          <div style={{
            position:'absolute', top:0, left:0, width:'40%', height:'100%',
            background:'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.4) 50%, transparent 70%)',
            animation:'shimmer 3s ease-in-out 1s infinite',
            pointerEvents:'none',
          }}/>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
            <span style={{ fontSize:12, fontWeight:800, color:'#003594', letterSpacing:1 }}>호주 버킷리스트</span>
            <span style={{ fontSize:11, color:'#94A3B8' }}>3/5 완료</span>
          </div>
          <div style={{ width:'100%', height:4, background:'#F1F5F9', borderRadius:4, marginBottom:12, overflow:'hidden' }}>
            <div style={{ width:'60%', height:'100%', background:'linear-gradient(90deg,#003594,#0052cc)', borderRadius:4 }}/>
          </div>
          {PREVIEW_ITEMS.map(item => (
            <div key={item.id} style={{
              display:'flex', alignItems:'center', gap:10, padding:'7px 0',
              borderBottom:'1px solid #F1F5F9',
            }}>
              <div style={{
                width:18, height:18, borderRadius:4, flexShrink:0,
                background: item.done ? '#16A34A' : '#fff',
                border: item.done ? 'none' : '1.5px solid #CBD5E1',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                {item.done && <svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </div>
              <Icon icon={item.icon} width={14} height={14} color={item.done ? '#94A3B8' : '#CBD5E1'} />
              <span style={{ fontSize:12, color: item.done ? '#94A3B8' : '#1E293B', fontWeight: item.done ? 400 : 500, textDecoration: item.done ? 'line-through' : 'none' }}>{item.label}</span>
              {item.done && <span style={{ marginLeft:'auto', fontSize:10, color:'#16A34A', fontWeight:700, flexShrink:0 }}>완료</span>}
            </div>
          ))}
        </div>
      </div>

      {/* ── 카테고리 섹션 ── */}
      <div style={{ padding:'28px 20px 24px', background:'#F5F8FF' }}>
        <div style={{ fontSize:18, fontWeight:900, color:'#1E293B', marginBottom:4 }}>
          {CATEGORIES.length}개 카테고리, {total}개 항목 🗂️
        </div>
        <div style={{ fontSize:13, color:'#64748B', marginBottom:20, lineHeight:1.6 }}>호주 생활에 꼭 필요한 항목들을 담았어요</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
          {CATEGORIES.map(cat => (
            <div key={cat.id} onClick={onStart} style={{
              background:'#fff', borderRadius:14, padding:'14px 8px',
              display:'flex', flexDirection:'column', alignItems:'center', gap:8,
              boxShadow:'0 2px 10px rgba(0,0,0,0.06)',
              cursor:'pointer', transition:'transform 0.15s',
            }}
              onMouseEnter={e => (e.currentTarget.style.transform='translateY(-2px)')}
              onMouseLeave={e => (e.currentTarget.style.transform='translateY(0)')}
            >
              <div style={{ width:38, height:38, borderRadius:10, background:'#EEF3FF', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Icon icon={CAT_ICON_MAP[cat.id] ?? 'ph:star'} width={20} height={20} color="#003594" />
              </div>
              <span style={{ fontSize:10, fontWeight:700, color:'#334155', textAlign:'center', lineHeight:1.3 }}>{cat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── 버킷리스트 추천 섹션 ── */}
      <div style={{ padding:'0 20px 24px' }}>
        <div style={{
          background:'#fff', borderRadius:20, padding:'24px 20px',
          boxShadow:'0 2px 12px rgba(0,0,0,0.06)',
          position:'relative', overflow:'hidden',
          border:'1px solid #F0F4FF',
        }}>
          <div style={{ position:'absolute', top:-16, right:-16, width:80, height:80, borderRadius:'50%', background:'rgba(255,205,0,0.10)', pointerEvents:'none' }}/>
          <div style={{ display:'flex', alignItems:'flex-start', gap:14, marginBottom:16 }}>
            <div style={{ width:46, height:46, borderRadius:14, background:'#FFF9E6', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:22 }}>
              💡
            </div>
            <div>
              <div style={{ fontSize:16, fontWeight:800, color:'#1E293B', marginBottom:4 }}>버킷리스트 추천</div>
              <div style={{ fontSize:12, color:'#64748B', lineHeight:1.7 }}>
                호주에서 꼭 해봐야 할 것들,<br/>여러분의 경험을 쉐어해 주세요 🦘
              </div>
            </div>
          </div>
          <button onClick={() => setShowSuggestion(true)} style={{
            width:'100%', height:48, background:'#003594', color:'#fff',
            border:'none', borderRadius:12, fontSize:14, fontWeight:800,
            cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6,
            boxShadow:'0 4px 14px rgba(0,53,148,0.20)',
          }}>
            <Icon icon="ph:paper-plane-tilt" width={16} height={16} color="#FFCD00" />
            추천하기
          </button>
        </div>
      </div>

      {/* ── 업체 등록 신청 섹션 ── */}
      <div style={{ padding:'8px 20px 24px' }}>
        <div style={{
          background:'linear-gradient(135deg, #002870, #003594)',
          borderRadius:20, padding:'24px 20px',
          position:'relative', overflow:'hidden',
        }}>
          <div style={{ position:'absolute', top:-20, right:-20, width:100, height:100, borderRadius:'50%', background:'rgba(255,205,0,0.08)', pointerEvents:'none' }}/>
          <div style={{ position:'absolute', bottom:-10, left:-10, fontSize:60, opacity:0.06, pointerEvents:'none' }}>🏪</div>
          <div style={{ display:'flex', alignItems:'flex-start', gap:14, marginBottom:16 }}>
            <div style={{ width:46, height:46, borderRadius:14, background:'rgba(255,205,0,0.18)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:22 }}>
              🏪
            </div>
            <div>
              <div style={{ fontSize:16, fontWeight:800, color:'#fff', marginBottom:4 }}>업체 등록 신청</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.7)', lineHeight:1.7 }}>
                호주가자에 업체를 등록하고<br/>한인 커뮤니티에 홍보하세요
              </div>
            </div>
          </div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:16 }}>
            {['✅ 무료 등록','🎯 한인 타겟','🛠 직접 관리'].map(tag => (
              <span key={tag} style={{ background:'rgba(255,255,255,0.13)', color:'rgba(255,255,255,0.9)', fontSize:11, fontWeight:700, borderRadius:20, padding:'4px 12px', border:'1px solid rgba(255,255,255,0.15)' }}>{tag}</span>
            ))}
          </div>
          <button onClick={() => setShowForm(true)} style={{
            width:'100%', height:48, background:'#FFCD00', color:'#002870',
            border:'none', borderRadius:12, fontSize:14, fontWeight:800,
            cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6,
          }}>
            <Icon icon="ph:plus-circle" width={16} height={16} color="#002870" />
            지금 신청하기
          </button>
        </div>
      </div>

      {/* ── 푸터 ── */}
      <div style={{ textAlign:'center', padding:'16px 20px 44px', background:'#F8FAFF' }}>
        <div style={{ fontSize:13, fontWeight:800, color:'#003594', marginBottom:4 }}>🦘 호주가자</div>
        <div style={{ fontSize:11, color:'#94A3B8' }}>www.hojugaja.com · 무료 호주 버킷리스트</div>
      </div>

      {/* ── 버킷리스트 추천 모달 ── */}
      {showSuggestion && (
        <div style={{ position:'fixed', inset:0, zIndex:500 }}>
          <div onClick={() => setShowSuggestion(false)} style={{ position:'absolute', inset:0, background:'rgba(10,20,40,0.6)' }}/>
          <div style={{
            position:'absolute', bottom:0, left:'50%', transform:'translateX(-50%)',
            width:'100%', maxWidth:480,
            background:'#F1F5F9', borderRadius:'20px 20px 0 0',
            padding:'20px 20px 40px',
            maxHeight:'90vh', overflowY:'auto',
          }}>
            <div style={{ width:36, height:4, background:'#CBD5E1', borderRadius:2, margin:'0 auto 20px' }}/>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
              <div>
                <div style={{ fontSize:18, fontWeight:800, color:'#1E293B' }}>버킷리스트 추천</div>
                <div style={{ fontSize:12, color:'#64748B', marginTop:2 }}>채택되면 이메일로 알려드려요 😊</div>
              </div>
              <button onClick={() => setShowSuggestion(false)} style={{ background:'none', border:'none', cursor:'pointer', padding:4 }}>
                <Icon icon="ph:x" width={20} height={20} color="#94A3B8" />
              </button>
            </div>
            <SuggestionForm onClose={() => setShowSuggestion(false)} />
          </div>
        </div>
      )}
      {showForm && (
        <div style={{ position:'fixed', inset:0, zIndex:500 }}>
          <div onClick={() => setShowForm(false)} style={{ position:'absolute', inset:0, background:'rgba(10,20,40,0.6)' }}/>
          <div style={{
            position:'absolute', bottom:0, left:'50%', transform:'translateX(-50%)',
            width:'100%', maxWidth:480,
            background:'#F1F5F9', borderRadius:'20px 20px 0 0',
            padding:'20px 20px 40px',
            maxHeight:'90vh', overflowY:'auto',
          }}>
            {/* 핸들 */}
            <div style={{ width:36, height:4, background:'#CBD5E1', borderRadius:2, margin:'0 auto 20px' }}/>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
              <div>
                <div style={{ fontSize:18, fontWeight:800, color:'#1E293B' }}>업체 등록 신청</div>
                <div style={{ fontSize:12, color:'#64748B', marginTop:2 }}>검토 후 등록해드려요</div>
              </div>
              <button onClick={() => setShowForm(false)} style={{ background:'none', border:'none', cursor:'pointer', padding:4 }}>
                <Icon icon="ph:x" width={20} height={20} color="#94A3B8" />
              </button>
            </div>
            <RequestForm onClose={() => setShowForm(false)} />
          </div>
        </div>
      )}

      {/* ── 말풍선 ── */}
      <ChatBubble />

    </div>
  )
}

function ChatBubble() {
  const [open, setOpen] = useState(true)
  return (
    <div style={{ position:"fixed", bottom:"10%", right:20, zIndex:300, display:"flex", flexDirection:"column", alignItems:"flex-end", gap:8 }}>
      {open && (
        <div style={{
          background:"#fff", borderRadius:14, padding:"14px 16px",
          boxShadow:"0 4px 20px rgba(0,53,148,0.15)",
          maxWidth:240, position:"relative",
          animation:"fadeInUp 0.25s ease",
          border:"1px solid rgba(0,53,148,0.08)",
        }}>
          {/* 닫기 버튼 */}
          <button onClick={() => setOpen(false)} style={{
            position:"absolute", top:8, right:8,
            background:"none", border:"none", cursor:"pointer",
            color:"#94A3B8", fontSize:14, lineHeight:1, padding:2,
          }}>✕</button>
          <div style={{ fontSize:12, fontWeight:800, color:"#003594", marginBottom:6 }}>
            호주가자 운영자입니다.
          </div>
          <div style={{ fontSize:12, color:"#475569", lineHeight:1.6 }}>
            본 서비스는 무료로 제공되는 서비스입니다. 문의 사항이나 의견 있으시면{" "}
            <a href="https://www.threads.net/@palaslouise" target="_blank" rel="noreferrer"
              style={{ color:"#003594", fontWeight:700, textDecoration:"none" }}>
              @palaslouise
            </a>
            로 연락주세요.
          </div>
          {/* 말풍선 꼬리 */}
          <div style={{
            position:"absolute", bottom:-8, right:18,
            width:0, height:0,
            borderLeft:"8px solid transparent",
            borderRight:"8px solid transparent",
            borderTop:"8px solid #fff",
            filter:"drop-shadow(0 2px 2px rgba(0,53,148,0.08))",
          }}/>
        </div>
      )}
      {/* 채팅 버튼 */}
      <button onClick={() => setOpen(v => !v)} style={{
        width:44, height:44, borderRadius:"50%",
        background:"#E8EDF5",
        border:"none",
        cursor:"pointer",
        display:"flex", alignItems:"center", justifyContent:"center",
        boxShadow:"0 2px 8px rgba(0,0,0,0.12)",
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#003594">
          <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.96 9.96 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
        </svg>
      </button>
    </div>
  )
}
