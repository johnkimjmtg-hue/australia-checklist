import { useState } from 'react'
import { Icon } from '@iconify/react'
import { AppState } from '../store/state'
import { ITEMS } from '../data/checklist'

type Props = { state: AppState; onStart: () => void; onServices: () => void }

const ff = '"Pretendard",-apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif'

const PREVIEW_ITEMS = [
  { id:'h01', icon:'ph:tooth',         label:'치과 스케일링',       done:true  },
  { id:'f06', icon:'ph:fork-knife',    label:'삼겹살 무한리필',     done:true  },
  { id:'s05', icon:'ph:sunglasses',    label:'선글라스 쇼핑',       done:false },
  { id:'g04', icon:'ph:waves',         label:'본다이 비치',         done:false },
  { id:'a01', icon:'ph:identification-card', label:'비자 서류 준비', done:true },
]

const CATS = [
  { icon:'ph:first-aid-kit', label:'병원/뷰티' },
  { icon:'ph:fork-knife',    label:'먹거리'    },
  { icon:'ph:shopping-bag',  label:'쇼핑'      },
  { icon:'ph:files',         label:'행정'      },
  { icon:'ph:users',         label:'사람'      },
  { icon:'ph:map-pin',       label:'가볼 곳'   },
  { icon:'ph:calendar',      label:'일정'      },
  { icon:'ph:baby',          label:'육아'      },
]

// ── 업체 등록 신청 폼
function RequestForm({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    business_name: '', address: '', description: '',
    hashtags: '', phone: '', kakao: '', website: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (!form.business_name.trim() || !form.address.trim() || !form.description.trim()) {
      setError('업체명, 주소, 설명은 필수입니다'); return
    }
    const tags = form.hashtags.split(/[,#\s]+/).map(t => t.trim()).filter(Boolean)
    if (tags.length < 3) { setError('해시태그를 3개 이상 입력해주세요'); return }
    setError(''); setSubmitting(true)
    try {
      const { supabase } = await import('../lib/supabase')
      const { error: err } = await supabase.from('business_requests').insert({
        business_name: form.business_name.trim(),
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
  const taStyle: React.CSSProperties = {
    ...inputStyle, height:80, padding:'10px 12px', resize:'none' as any,
  }

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
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        <div>
          <div style={{ fontSize:12, fontWeight:700, color:'#64748B', marginBottom:5 }}>업체명 *</div>
          <input value={form.business_name} onChange={e => set('business_name', e.target.value)}
            placeholder="업체명을 입력하세요" style={inputStyle} />
        </div>
        <div>
          <div style={{ fontSize:12, fontWeight:700, color:'#64748B', marginBottom:5 }}>주소 (Full Address) *</div>
          <input value={form.address} onChange={e => set('address', e.target.value)}
            placeholder="123 George St, Sydney NSW 2000" style={inputStyle} />
        </div>
        <div>
          <div style={{ fontSize:12, fontWeight:700, color:'#64748B', marginBottom:5 }}>업체 설명 *</div>
          <textarea value={form.description} onChange={e => set('description', e.target.value)}
            placeholder="업체 소개를 간단히 작성해주세요" style={taStyle as any} />
        </div>
        <div>
          <div style={{ fontSize:12, fontWeight:700, color:'#64748B', marginBottom:5 }}>
            해시태그 * <span style={{ fontWeight:500, color:'#94A3B8' }}>(3개 이상, 쉼표 또는 띄어쓰기로 구분)</span>
          </div>
          <input value={form.hashtags} onChange={e => set('hashtags', e.target.value)}
            placeholder="한식당, 시드니, 가족식사, 주차가능" style={inputStyle} />
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:'#64748B', marginBottom:5 }}>전화번호</div>
            <input value={form.phone} onChange={e => set('phone', e.target.value)}
              placeholder="+61 2 1234 5678" style={inputStyle} />
          </div>
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:'#64748B', marginBottom:5 }}>카카오 오픈채팅</div>
            <input value={form.kakao} onChange={e => set('kakao', e.target.value)}
              placeholder="오픈채팅 링크" style={inputStyle} />
          </div>
        </div>
        <div>
          <div style={{ fontSize:12, fontWeight:700, color:'#64748B', marginBottom:5 }}>웹사이트</div>
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
        cursor: submitting ? 'default' : 'pointer',
        opacity: submitting ? 0.7 : 1,
        boxShadow:'0 4px 14px rgba(0,53,148,0.25)',
      }}>{submitting ? '제출 중...' : '등록 신청하기'}</button>
    </div>
  )
}

export default function LandingPage({ state, onStart, onServices }: Props) {
  const total = ITEMS.length + state.customItems.length
  const [showForm, setShowForm] = useState(false)
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
    <div style={{ minHeight:'100vh', background:'#F1F5F9', fontFamily:ff, overflowX:'hidden' }}>
      <style>{`
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
        @keyframes fadeInUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes float    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes shimmer  { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }
      `}</style>

      {/* ── 헤더 ── */}
      <div style={{
        position:'sticky', top:0, zIndex:50,
        background:'rgba(241,245,249,0.95)', backdropFilter:'blur(10px)',
        borderBottom:'1px solid #E2E8F0',
        padding:'14px 20px',
        display:'flex', alignItems:'center', justifyContent:'space-between',
      }}>
        <span onClick={handleLogoTap} style={{ fontSize:13, fontWeight:800, color:'#003594', letterSpacing:2, cursor:'pointer', userSelect:'none' }}>HOJUGAJA</span>
        <button onClick={() => setShowForm(true)} style={{
          height:32, padding:'0 14px', borderRadius:8, border:'none',
          background:'#003594', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer',
          display:'flex', alignItems:'center', gap:5,
        }}>
          <Icon icon="ph:storefront" width={13} height={13} color="#FFCD00" />
          업체 등록 신청
        </button>
      </div>

      {/* ── 히어로 섹션 ── */}
      <div style={{
        background:'linear-gradient(160deg, #001f5c 0%, #003594 60%, #0052cc 100%)',
        padding:'48px 24px 56px',
        textAlign:'center', position:'relative', overflow:'hidden',
      }}>
        {/* 배경 원 */}
        <div style={{ position:'absolute', top:-60, right:-60, width:200, height:200, borderRadius:'50%', background:'rgba(255,205,0,0.06)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', bottom:-40, left:-40, width:150, height:150, borderRadius:'50%', background:'rgba(255,255,255,0.04)', pointerEvents:'none' }}/>

        <div style={{ animation:'fadeInUp 0.6s ease both' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(255,205,0,0.15)', borderRadius:20, padding:'5px 14px', marginBottom:20 }}>
            <Icon icon="ph:airplane-takeoff" width={14} height={14} color="#FFCD00" />
            <span style={{ fontSize:11, fontWeight:700, color:'#FFCD00', letterSpacing:1 }}>호주 이민·여행자를 위한</span>
          </div>
        </div>

        <div style={{ animation:'fadeInUp 0.6s ease 0.1s both' }}>
          <div style={{ fontSize:32, fontWeight:900, color:'#fff', lineHeight:1.2, marginBottom:12, letterSpacing:-0.5 }}>
            호주에서 꼭 해야 할<br/>
            <span style={{ color:'#FFCD00' }}>모든 것</span>을 담았어요
          </div>
        </div>

        <div style={{ animation:'fadeInUp 0.6s ease 0.2s both' }}>
          <div style={{ fontSize:14, color:'rgba(255,255,255,0.7)', lineHeight:1.7, marginBottom:32 }}>
            {total}개 항목 · 9개 카테고리<br/>나만의 호주 버킷리스트를 만들어보세요
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
      <div style={{ padding:'32px 20px 24px' }}>
        <div style={{ fontSize:18, fontWeight:800, color:'#1E293B', marginBottom:6 }}>9개 카테고리, {total}개 항목</div>
        <div style={{ fontSize:13, color:'#64748B', marginBottom:20 }}>호주 생활에 꼭 필요한 항목들을 담았어요</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
          {CATS.map(cat => (
            <div key={cat.label} style={{
              background:'#fff', borderRadius:12, padding:'14px 8px',
              display:'flex', flexDirection:'column', alignItems:'center', gap:8,
              boxShadow:'0 2px 8px rgba(0,0,0,0.06)',
            }}>
              <div style={{ width:36, height:36, borderRadius:10, background:'rgba(0,53,148,0.07)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Icon icon={cat.icon} width={20} height={20} color="#003594" />
              </div>
              <span style={{ fontSize:11, fontWeight:700, color:'#1E293B', textAlign:'center' }}>{cat.label}</span>
            </div>
          ))}
          <div style={{
            background:'#fff', borderRadius:12, padding:'14px 8px',
            display:'flex', flexDirection:'column', alignItems:'center', gap:8,
            boxShadow:'0 2px 8px rgba(0,0,0,0.06)',
          }}>
            <div style={{ width:36, height:36, borderRadius:10, background:'rgba(0,53,148,0.07)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Icon icon="ph:pencil-simple" width={20} height={20} color="#003594" />
            </div>
            <span style={{ fontSize:11, fontWeight:700, color:'#1E293B', textAlign:'center' }}>직접입력</span>
          </div>
        </div>
      </div>

      {/* ── 업체 등록 신청 섹션 ── */}
      <div style={{ padding:'8px 20px 24px' }}>
        <div style={{
          background:'linear-gradient(135deg, #002870, #003594)',
          borderRadius:16, padding:'24px 20px',
          position:'relative', overflow:'hidden',
        }}>
          <div style={{ position:'absolute', top:-20, right:-20, width:100, height:100, borderRadius:'50%', background:'rgba(255,205,0,0.08)', pointerEvents:'none' }}/>
          <div style={{ display:'flex', alignItems:'flex-start', gap:14, marginBottom:16 }}>
            <div style={{ width:44, height:44, borderRadius:12, background:'rgba(255,205,0,0.15)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Icon icon="ph:storefront" width={24} height={24} color="#FFCD00" />
            </div>
            <div>
              <div style={{ fontSize:16, fontWeight:800, color:'#fff', marginBottom:4 }}>업체 등록 신청</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.65)', lineHeight:1.6 }}>
                호주가자에 업체를 등록하고<br/>한인 커뮤니티에 홍보하세요
              </div>
            </div>
          </div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:16 }}>
            {['무료 등록','한인 타겟','직접 관리'].map(tag => (
              <span key={tag} style={{ background:'rgba(255,255,255,0.12)', color:'rgba(255,255,255,0.85)', fontSize:11, fontWeight:700, borderRadius:20, padding:'4px 10px' }}>{tag}</span>
            ))}
          </div>
          <button onClick={() => setShowForm(true)} style={{
            width:'100%', height:46, background:'#FFCD00', color:'#002870',
            border:'none', borderRadius:10, fontSize:14, fontWeight:800,
            cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6,
          }}>
            <Icon icon="ph:plus-circle" width={16} height={16} color="#002870" />
            지금 신청하기
          </button>
        </div>
      </div>

      {/* ── 하단 CTA ── */}
      <div style={{ padding:'8px 20px 48px', display:'flex', flexDirection:'column', gap:10 }}>
        <button onClick={onStart} style={{
          width:'100%', height:54, background:'#003594', color:'#fff',
          border:'none', borderRadius:12, fontSize:16, fontWeight:800,
          cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
          boxShadow:'0 4px 20px rgba(0,53,148,0.30)',
        }}>
          <Icon icon="ph:list-checks" width={20} height={20} color="#FFCD00" />
          버킷리스트 만들기
        </button>
        <button onClick={onServices} style={{
          width:'100%', height:54, background:'#fff', color:'#003594',
          border:'none', borderRadius:12, fontSize:16, fontWeight:800,
          cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
          boxShadow:'0 2px 10px rgba(0,0,0,0.08)',
        }}>
          <Icon icon="ph:buildings" width={20} height={20} color="#003594" />
          업체/서비스 찾기
        </button>
        <div style={{ textAlign:'center', marginTop:8 }}>
          <span style={{ fontSize:11, color:'#94A3B8' }}>www.hojugaja.com</span>
        </div>
      </div>

      {/* ── 업체 등록 신청 모달 ── */}
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
    </div>
  )
}
