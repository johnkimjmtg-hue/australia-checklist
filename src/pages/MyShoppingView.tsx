import { useState, useEffect, useMemo } from 'react'
import { Icon } from '@iconify/react'
import { supabase } from '../lib/supabase'

// ── 공유 상수
interface Product {
  id: string
  category_id: number
  name: string
  brand: string
  description: string
  price_range: '$' | '$$' | '$$$'
  where_to_buy: string[]
  tags: string[]
  image_url: string | null
  is_featured: boolean
  sort_order: number
}

const PRICE_LABEL: Record<string, string> = { '$': '저렴', '$$': '보통', '$$$': '프리미엄' }
const PRICE_COLOR: Record<string, string> = { '$': '#16A34A', '$$': '#D97706', '$$$': '#7C3AED' }
const TAG_COLOR: Record<string, { bg: string; color: string }> = {
  '인기':    { bg: '#FEF3C7', color: '#D97706' },
  '강추':    { bg: '#DCFCE7', color: '#16A34A' },
  '필수템':  { bg: '#FEE2E2', color: '#DC2626' },
  '선물용':  { bg: '#EDE9FE', color: '#7C3AED' },
  '프리미엄':{ bg: '#F0F9FF', color: '#0369A1' },
  '체험':    { bg: '#FFF7ED', color: '#C2410C' },
  '기념':    { bg: '#F0FDF4', color: '#15803D' },
}

const MY_LIST_KEY    = 'my-shopping-list'
const MY_CHECKED_KEY = 'my-shopping-checked'

export function loadMyList(): string[] {
  try { return JSON.parse(localStorage.getItem(MY_LIST_KEY) ?? '[]') } catch { return [] }
}
export function saveMyList(ids: string[]) {
  try { localStorage.setItem(MY_LIST_KEY, JSON.stringify(ids)) } catch {}
}
function loadMyChecked(): Record<string, boolean> {
  try { return JSON.parse(localStorage.getItem(MY_CHECKED_KEY) ?? '{}') } catch { return {} }
}
function saveMyChecked(c: Record<string, boolean>) {
  try { localStorage.setItem(MY_CHECKED_KEY, JSON.stringify(c)) } catch {}
}

// ── Props
type Props = {
  onBack: () => void           // 쇼핑 페이지로 돌아가기
  onShopping:  () => void
  onBingo:     () => void
  onCommunity: () => void
  onServices:  () => void
  onLanding:   () => void
}

export default function MyShoppingView({ onBack, onShopping, onBingo, onCommunity, onServices, onLanding }: Props) {
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [myList, setMyList]           = useState<string[]>(loadMyList)
  const [myChecked, setMyChecked]     = useState<Record<string, boolean>>(loadMyChecked)
  const [selProduct, setSelProduct]   = useState<Product | null>(null)
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    supabase.from('shopping_products').select('*').eq('is_active', true).order('sort_order')
      .then(({ data }) => { setAllProducts(data ?? []); setLoading(false) })
  }, [])

  const myProducts = useMemo(() =>
    myList.map(id => allProducts.find(p => p.id === id)).filter(Boolean) as Product[]
  , [myList, allProducts])

  const checkedCount = myList.filter(id => myChecked[id]).length
  const total        = myList.length
  const pct          = total > 0 ? Math.round((checkedCount / total) * 100) : 0

  const removeFromMyList = (id: string) => {
    const next = myList.filter(i => i !== id)
    setMyList(next)
    saveMyList(next)
    const nextChecked = { ...myChecked }
    delete nextChecked[id]
    setMyChecked(nextChecked)
    saveMyChecked(nextChecked)
  }

  const toggleChecked = (id: string) => {
    const next = { ...myChecked, [id]: !myChecked[id] }
    if (!next[id]) delete next[id]
    setMyChecked(next)
    saveMyChecked(next)
  }

  const addToMyList = (id: string) => {
    if (myList.includes(id)) return
    const next = [...myList, id]
    setMyList(next)
    saveMyList(next)
  }

  return (
    <div style={{
      minHeight:'100vh', background:'#e8e8e8',
      fontFamily:'"Pretendard",-apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif',
      maxWidth:480, margin:'0 auto', position:'relative',
    }}>
      <style>{`
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
        @keyframes slideUp { from{transform:translateX(-50%) translateY(100%)} to{transform:translateX(-50%) translateY(0)} }
        @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes coinPop {
          0%   { transform:translateY(8px) scale(0.8); opacity:0; }
          60%  { transform:translateY(-3px) scale(1.1); opacity:1; }
          100% { transform:translateY(0) scale(1); opacity:1; }
        }
        .my-item { transition: all 0.2s ease; }
        .my-item:active { transform: scale(0.98); }
        .neu-tab {
          background:#e8e8e8; border:none; cursor:pointer;
          display:flex; flex-direction:column; align-items:center; justify-content:center;
          gap:3px; transition:all 0.15s ease; -webkit-tap-highlight-color:transparent;
          touch-action:manipulation;
          box-shadow:3px 3px 6px #c5c5c5, -3px -3px 6px #ffffff;
          border-radius:10px;
        }
        .neu-tab.active { box-shadow:inset 3px 3px 6px #c5c5c5, inset -3px -3px 6px #ffffff; }
      `}</style>

      {/* ── 헤더 + 탭 */}
      <div style={{ background:'#e8e8e8', paddingBottom:8 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px 12px' }}>
          <span style={{ fontSize:13, color:'#1B6EF3', fontWeight:800, letterSpacing:2 }}>HOJUGAJA</span>
          <span style={{ fontSize:13, color:'#64748B', fontWeight:600 }}>{checkedCount}/{total}</span>
        </div>
        {/* 탭 — 내쇼핑리스트 페이지에 있으므로 쇼핑 탭은 파란색+평평 */}
        <div style={{ display:'flex', padding:'0 10px', gap:8, overflowX:'auto', scrollbarWidth:'none' }}>
          {([
            { id:'bucketlist', icon:'ph:check-circle',  label:'버킷리스트',   action: onLanding },
            { id:'shopping',   icon:'ph:shopping-bag',  label:'쇼핑리스트',   action: onBack },
            { id:'bingo',      icon:'ph:coffee',        label:'카페빙고게임',  action: onBingo },
            { id:'community',  icon:'ph:chats-circle',  label:'채팅방',        action: onCommunity },
            { id:'services',   icon:'ph:buildings',     label:'업체리스트',    action: onServices },
          ]).map(tab => {
            // 내쇼핑리스트 페이지에서 쇼핑 탭은 파란색+평평(눌리지 않음)
            const isShoppingTab = tab.id === 'shopping'
            const color = isShoppingTab ? '#1B6EF3' : '#94A3B8'
            return (
              <button key={tab.id} onClick={tab.action}
                className="neu-tab"
                style={{ flex:1, minWidth:0, height:52 }}>
                <Icon icon={tab.icon} width={16} height={16} color={color} />
                <span style={{ fontSize:9, fontWeight: isShoppingTab ? 700 : 500, color, whiteSpace:'nowrap' }}>
                  {tab.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── 진행 카드 */}
      <div style={{ position:'sticky', top:0, zIndex:30, background:'#e8e8e8', padding:'16px 16px 0' }}>
        <div style={{
          background:'#c8d4b8', borderRadius:12,
          boxShadow:'inset 3px 3px 8px #a8b498, inset -2px -2px 6px #e8f4d8',
          padding:'20px', display:'flex', alignItems:'center', gap:20,
        }}>
          {/* 원형 진행률 */}
          <div style={{ position:'relative', width:100, height:100, flexShrink:0 }}>
            <svg width={100} height={100} viewBox="0 0 100 100" style={{ transform:'rotate(-90deg)' }}>
              <circle cx={50} cy={50} r={44} fill="none" stroke="#a8b498" strokeWidth={10}/>
              <circle cx={50} cy={50} r={44} fill="none" stroke="#39d353" strokeWidth={10}
                strokeDasharray={2 * Math.PI * 44}
                strokeDashoffset={2 * Math.PI * 44 * (1 - pct / 100)}
                strokeLinecap="round"
                style={{ transition:'stroke-dashoffset 0.6s cubic-bezier(.4,0,.2,1)' }}
              />
            </svg>
            <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span style={{ fontSize:15, fontWeight:800, color:'#2d3e1f' }}>{pct}%</span>
            </div>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:20, fontWeight:800, color:'#2d3e1f', marginBottom:4, lineHeight:1.2 }}>내 쇼핑리스트</div>
            <div style={{ display:'flex', alignItems:'baseline', gap:4, marginBottom:4 }}>
              <span style={{ fontSize:28, fontWeight:800, color:'#2d3e1f', lineHeight:1 }}>{checkedCount}</span>
              <span style={{ fontSize:17, fontWeight:600, color:'#4a5e32' }}>/{total}개 완료</span>
            </div>
            <div style={{ fontSize:13, color:'#4a5e32', lineHeight:1.5 }}>찜한 상품을 체크하며 쇼핑하세요!</div>
          </div>
        </div>
      </div>

      {/* ── 필터 */}
      <div style={{ padding:'14px 16px 0', display:'flex', alignItems:'center', gap:8 }}>
        <span style={{ fontSize:12, color:'#94A3B8', fontWeight:600, flexShrink:0 }}>
          {total > 0 ? `${total}개 찜` : '아직 찜한 상품이 없어요'}
        </span>
      </div>

      {/* ── 리스트 */}
      <div style={{ padding:'12px 16px 130px', display:'flex', flexDirection:'column', gap:10 }}>
        {loading ? (
          <div style={{ textAlign:'center', padding:'40px 0', color:'#94A3B8', fontSize:14 }}>불러오는 중...</div>
        ) : total === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 20px' }}>
            <Icon icon="ph:shopping-cart-simple" width={48} height={48} color="#C8C8C8" />
            <div style={{ marginTop:12, fontSize:15, fontWeight:700, color:'#94A3B8' }}>찜한 상품이 없어요</div>
            <div style={{ marginTop:6, fontSize:13, color:'#C8C8C8' }}>쇼핑리스트에서 상품을 찜해보세요!</div>
            <button onClick={onBack} style={{
              marginTop:20, height:44, padding:'0 24px', borderRadius:10, border:'none',
              background:'#39d353', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer',
              boxShadow:'0 4px 12px rgba(57,211,83,0.35)',
            }}>쇼핑리스트 보러가기</button>
          </div>
        ) : (
          myProducts.map(p => {
            const checked = !!myChecked[p.id]
            return (
              <div key={p.id} className="my-item" style={{
                display:'flex', alignItems:'stretch', gap:10,
                padding:'12px 12px 12px 14px',
                borderRadius:12,
                background: checked ? '#fff8e4' : '#fff',
                border:'1px solid #C8C8C8',
                borderLeft: checked ? '4px solid #39d353' : '4px solid #CBD5E1',
                transition:'all 0.3s',
              }}>
                {/* 이미지 */}
                <div onClick={() => setSelProduct(p)} style={{
                  width:60, height:60, borderRadius:'50%', flexShrink:0,
                  background: p.image_url ? 'none' : '#f0f0f0',
                  border:'1px solid #E2E8F0',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  overflow:'hidden', cursor:'pointer', alignSelf:'center',
                }}>
                  {p.image_url
                    ? <img src={p.image_url} alt={p.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    : <Icon icon="ph:shopping-bag" width={24} height={24} color="#CBD5E1" />
                  }
                </div>

                {/* 텍스트 */}
                <div onClick={() => setSelProduct(p)} style={{ flex:1, minWidth:0, justifyContent:'center', display:'flex', flexDirection:'column', gap:2, cursor:'pointer' }}>
                  <span style={{
                    fontSize:14, fontWeight: checked ? 700 : 500,
                    color: checked ? '#94A3B8' : '#0F172A',
                    textDecoration: checked ? 'line-through' : 'none',
                    lineHeight:1.4,
                    overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                  }}>{p.name}</span>
                  <span style={{ fontSize:11, color:'#94A3B8' }}>{p.brand}</span>
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:2 }}>
                    <span style={{ fontSize:11, fontWeight:800, color: checked ? '#CBD5E1' : PRICE_COLOR[p.price_range] ?? '#475569' }}>
                      {p.price_range} · {PRICE_LABEL[p.price_range]}
                    </span>
                    {p.tags[0] && (
                      <span style={{
                        fontSize:9, fontWeight:800, padding:'2px 5px', borderRadius:4,
                        background: TAG_COLOR[p.tags[0]]?.bg ?? '#F1F5F9',
                        color: TAG_COLOR[p.tags[0]]?.color ?? '#475569',
                      }}>{p.tags[0]}</span>
                    )}
                  </div>
                </div>

                {/* 오른쪽 - 체크박스 + 삭제 */}
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'space-between', flexShrink:0, gap:6, paddingTop:2, paddingBottom:2 }}>
                  {/* 체크박스 */}
                  <div onClick={() => toggleChecked(p.id)} style={{
                    width:26, height:26, borderRadius:6, flexShrink:0,
                    border: checked ? 'none' : '1.5px solid #C8C8C8',
                    background: checked ? '#39d353' : '#fff',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    cursor:'pointer', transition:'all 0.15s',
                    boxShadow: checked ? 'none' : '1px 1px 3px #d0d0d0, -1px -1px 3px #ffffff',
                  }}>
                    {checked && (
                      <svg width="12" height="9" viewBox="0 0 11 8" fill="none">
                        <path d="M1 4L4 7L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  {/* 삭제 */}
                  <button onClick={() => removeFromMyList(p.id)} style={{
                    background:'none', border:'none', cursor:'pointer', padding:2,
                    display:'flex', alignItems:'center',
                  }}>
                    <Icon icon="ph:trash" width={14} height={14} color="#CBD5E1" />
                  </button>
                </div>
              </div>
            )
          })
        )}

        {/* 전체 완료 축하 */}
        {checkedCount === total && total > 0 && (
          <div style={{
            textAlign:'center', padding:'24px', marginTop:8,
            background:'#f0fdf4', borderRadius:16, border:'1px solid #86EFAC',
          }}>
            <div style={{ fontSize:36, marginBottom:8 }}>🎉</div>
            <div style={{ fontSize:17, fontWeight:800, color:'#16A34A' }}>쇼핑 완료!</div>
            <div style={{ fontSize:13, color:'#4ADE80', marginTop:4 }}>모든 상품을 구매했어요</div>
          </div>
        )}
      </div>

      {/* ── 하단 버튼 */}
      <div style={{
        position:'fixed', bottom:0,
        left:'50%', transform:'translateX(-50%)',
        width:'100%', maxWidth:480,
        padding:'12px 14px 20px',
        background:'#e8e8e8', zIndex:20, boxSizing:'border-box',
        display:'flex', gap:8, borderTop:'1px solid #C8C8C8',
      }}>
        <button onClick={onBack} style={{
          flex:1, height:44, borderRadius:8, border:'none',
          background:'#e8e8e8', color:'#1B6EF3',
          fontSize:15, fontWeight:700, cursor:'pointer',
          boxShadow:'3px 3px 6px #c5c5c5, -3px -3px 6px #ffffff',
          display:'flex', alignItems:'center', justifyContent:'center', gap:7,
          WebkitTapHighlightColor:'transparent',
        }}>
          <Icon icon="ph:shopping-bag" width={18} height={18} color="#1B6EF3" />
          쇼핑리스트 보기
        </button>
      </div>

      {/* ── 상품 상세 팝업 */}
      {selProduct && (
        <>
          <div onClick={() => setSelProduct(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:600, animation:'fadeIn 0.2s ease' }} />
          <div style={{
            position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)',
            width:'100%', maxWidth:390, background:'#e8e8e8',
            borderRadius:'20px 20px 0 0', zIndex:601,
            animation:'slideUp 0.3s ease', maxHeight:'85vh', overflowY:'auto',
          }}>
            <div style={{ width:40, height:4, borderRadius:2, background:'#C8C8C8', margin:'12px auto 0' }} />
            <div style={{
              width:'100%', height:220,
              background: selProduct.image_url ? 'none' : 'linear-gradient(135deg, #e0e0e0, #d0d0d0)',
              display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden',
            }}>
              {selProduct.image_url
                ? <img src={selProduct.image_url} alt={selProduct.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                : <Icon icon="ph:shopping-bag" width={60} height={60} color="#94A3B8" />
              }
            </div>
            <div style={{ padding:'16px 18px 40px' }}>
              <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:10, alignItems:'center' }}>
                {selProduct.tags.map(tag => (
                  <span key={tag} style={{ fontSize:10, fontWeight:800, padding:'3px 8px', borderRadius:6, background: TAG_COLOR[tag]?.bg ?? '#e8e8e8', color: TAG_COLOR[tag]?.color ?? '#475569' }}>{tag}</span>
                ))}
                <span style={{ fontSize:10, fontWeight:800, padding:'3px 8px', borderRadius:6, background:'#e8e8e8', color: PRICE_COLOR[selProduct.price_range] ?? '#475569', border:`1px solid ${PRICE_COLOR[selProduct.price_range] ?? '#C8C8C8'}`, marginLeft:'auto' }}>
                  {selProduct.price_range} · {PRICE_LABEL[selProduct.price_range]}
                </span>
              </div>
              <div style={{ fontSize:18, fontWeight:800, color:'#0F172A', marginBottom:4 }}>{selProduct.name}</div>
              <div style={{ fontSize:13, color:'#64748B', marginBottom:12 }}>{selProduct.brand}</div>
              {selProduct.description && (
                <div style={{ fontSize:13, color:'#334155', lineHeight:1.7, marginBottom:16 }}>{selProduct.description}</div>
              )}
              {selProduct.where_to_buy.length > 0 && (
                <div style={{ marginBottom:16 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'#94A3B8', marginBottom:8 }}>어디서 살 수 있어요?</div>
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                    {selProduct.where_to_buy.map(store => (
                      <span key={store} style={{ fontSize:11, fontWeight:600, padding:'5px 10px', borderRadius:8, background:'#e8e8e8', color:'#475569', border:'1px solid #C8C8C8' }}>🏪 {store}</span>
                    ))}
                  </div>
                </div>
              )}
              {/* 찜 취소 / 추가 버튼 */}
              <button onClick={() => {
                myList.includes(selProduct.id) ? removeFromMyList(selProduct.id) : addToMyList(selProduct.id)
              }} style={{
                width:'100%', height:50, borderRadius:12, border:'none', cursor:'pointer',
                background: myList.includes(selProduct.id) ? '#f0fdf4' : '#39d353',
                color: myList.includes(selProduct.id) ? '#16A34A' : '#fff',
                fontSize:15, fontWeight:700,
                display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                marginBottom:10,
                boxShadow: myList.includes(selProduct.id) ? 'inset 2px 2px 4px #d1fae5' : '0 4px 12px rgba(57,211,83,0.35)',
                WebkitTapHighlightColor:'transparent',
              }}>
                <Icon icon={myList.includes(selProduct.id) ? 'ph:check-circle-fill' : 'ph:heart'} width={18} height={18} color={myList.includes(selProduct.id) ? '#16A34A' : '#fff'} />
                {myList.includes(selProduct.id) ? '찜 취소하기' : '내 쇼핑리스트에 찜하기'}
              </button>
              <button onClick={() => setSelProduct(null)} style={{
                width:'100%', height:44, borderRadius:12, border:'none',
                background:'#e8e8e8', color:'#94A3B8', fontSize:14, fontWeight:600, cursor:'pointer',
                boxShadow:'3px 3px 6px #c5c5c5, -3px -3px 6px #ffffff',
                WebkitTapHighlightColor:'transparent',
              }}>닫기</button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
