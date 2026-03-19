import { useState, useEffect, useMemo } from 'react'
import { Icon } from '@iconify/react'
import { supabase } from '../lib/supabase'
import imgShopping from '../assets/landing/shopping.png'

interface Category {
  id: number
  name: string
  emoji: string
  sort_order: number
}

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

type SortOption = 'default' | 'price_asc' | 'price_desc' | 'name'

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

const MY_LIST_KEY = 'my-shopping-list'
const MY_CHECKED_KEY = 'my-shopping-checked'

function loadMyList(): string[] {
  try { return JSON.parse(localStorage.getItem(MY_LIST_KEY) ?? '[]') } catch { return [] }
}
function saveMyList(ids: string[]) {
  try { localStorage.setItem(MY_LIST_KEY, JSON.stringify(ids)) } catch {}
}
function loadMyChecked(): Record<string, boolean> {
  try { return JSON.parse(localStorage.getItem(MY_CHECKED_KEY) ?? '{}') } catch { return {} }
}
function saveMyChecked(checked: Record<string, boolean>) {
  try { localStorage.setItem(MY_CHECKED_KEY, JSON.stringify(checked)) } catch {}
}

export default function Shopping({ onMyListChange }: { onMyListChange?: (count: number) => void }) {
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts]     = useState<Product[]>([])
  const [loading, setLoading]       = useState(true)
  const [selCat, setSelCat]         = useState<number | null>(null)
  const [sortBy, setSortBy]         = useState<SortOption>('default')
  const [search, setSearch]         = useState('')
  const [selProduct, setSelProduct] = useState<Product | null>(null)
  const [myList, setMyList]         = useState<string[]>(loadMyList)
  const [myChecked, setMyChecked]   = useState<Record<string, boolean>>(loadMyChecked)
  const [showMyList, setShowMyList] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      const [{ data: cats }, { data: prods }] = await Promise.all([
        supabase.from('shopping_categories').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('shopping_products').select('*').eq('is_active', true).order('sort_order'),
      ])
      setCategories(cats ?? [])
      setProducts(prods ?? [])
      setLoading(false)
    }
    fetch()
  }, [])

  useEffect(() => {
    onMyListChange?.(myList.length)
  }, [myList.length])

  const addToMyList = (id: string) => {
    if (myList.includes(id)) return
    const next = [...myList, id]
    setMyList(next)
    saveMyList(next)
  }

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

  const myProducts = useMemo(() =>
    myList.map(id => products.find(p => p.id === id)).filter(Boolean) as Product[]
  , [myList, products])

  const checkedCount = myList.filter(id => myChecked[id]).length

  const featured = useMemo(() => products.filter(p => p.is_featured), [products])

  const filtered = useMemo(() => {
    let list = selCat ? products.filter(p => p.category_id === selCat) : products
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q))
      )
    }
    if (sortBy === 'price_asc')  list = [...list].sort((a, b) => a.price_range.length - b.price_range.length)
    if (sortBy === 'price_desc') list = [...list].sort((a, b) => b.price_range.length - a.price_range.length)
    if (sortBy === 'name')       list = [...list].sort((a, b) => a.name.localeCompare(b.name))
    return list
  }, [products, selCat, sortBy, search])

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh' }}>
      <Icon icon="ph:circle-notch" width={28} height={28} color="#1B6EF3" style={{ animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ background:'#e8e8e8', minHeight:'100vh', fontFamily:'"Pretendard",-apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif', paddingBottom:80 }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideUp{from{transform:translateX(-50%) translateY(100%)}to{transform:translateX(-50%) translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        .prod-card:active{transform:scale(0.97)}
        .prod-card{transition:transform 0.15s ease;}
        .cat-btn{transition:all 0.15s ease;-webkit-tap-highlight-color:transparent;}
        .sort-btn{transition:all 0.15s ease;}
        .add-btn{transition:all 0.15s ease;-webkit-tap-highlight-color:transparent;}
        .add-btn:active{transform:scale(0.85);}
        .my-item{transition:all 0.2s ease;}
        .featured-scroll{overflow-x:auto;}
        .cat-scroll{overflow-x:auto;}
        @media (max-width:768px){
          .featured-scroll{scrollbar-width:none;-ms-overflow-style:none;}
          .featured-scroll::-webkit-scrollbar{display:none;}
          .cat-scroll{scrollbar-width:none;-ms-overflow-style:none;}
          .cat-scroll::-webkit-scrollbar{display:none;}
        }
      `}</style>

      {/* 히어로 배너 */}
      <div style={{ position:'relative', overflow:'hidden', height:120 }}>
        <div style={{ position:'absolute', inset:0, backgroundImage:`url(${imgShopping})`, backgroundSize:'cover', backgroundPosition:'center' }}/>
        <div style={{ position:'absolute', inset:0, padding:'12px 16px', display:'flex', flexDirection:'column', justifyContent:'flex-end' }}>
          <div style={{ fontSize:11, fontWeight:400, color:'rgba(255,255,255,0.85)', textShadow:'0 1px 3px rgba(0,0,0,0.5)' }}>
            호주에서 꼭 사야하는 아이템을 모았어요.
          </div>
        </div>
      </div>

      {/* 카테고리 탭 */}
      <div style={{ background:'#e8e8e8', borderBottom:'1px solid #D1D9E3', position:'sticky', top:0, zIndex:20 }}>
        <div className="cat-scroll" style={{ display:'flex', gap:6, padding:'10px 14px', overflowX:'auto' }}>
          <button className="cat-btn" onClick={() => setSelCat(null)} style={{
            flexShrink:0, height:34, padding:'0 14px', borderRadius:20, cursor:'pointer',
            background:'#e8e8e8', border:'none',
            color: selCat === null ? '#1B6EF3' : '#94A3B8',
            fontSize:12, fontWeight: selCat === null ? 700 : 500,
            boxShadow: selCat === null ? 'inset 3px 3px 6px #c5c5c5, inset -3px -3px 6px #ffffff' : '3px 3px 6px #c5c5c5, -3px -3px 6px #ffffff',
            WebkitTapHighlightColor:'transparent',
          }}>전체</button>
          {categories.map(cat => (
            <button key={cat.id} className="cat-btn" onClick={() => setSelCat(cat.id)} style={{
              flexShrink:0, height:34, padding:'0 14px', borderRadius:20, cursor:'pointer',
              background:'#e8e8e8', border:'none',
              color: selCat === cat.id ? '#1B6EF3' : '#94A3B8',
              fontSize:12, fontWeight: selCat === cat.id ? 700 : 500, whiteSpace:'nowrap',
              boxShadow: selCat === cat.id ? 'inset 3px 3px 6px #c5c5c5, inset -3px -3px 6px #ffffff' : '3px 3px 6px #c5c5c5, -3px -3px 6px #ffffff',
              WebkitTapHighlightColor:'transparent',
            }}>{cat.emoji} {cat.name}</button>
          ))}
        </div>
      </div>

      <div style={{ padding:'14px 14px 0' }}>

        {/* 검색창 */}
        <div style={{ display:'flex', alignItems:'center', gap:8, background:'#fff', border:'1px solid #C8C8C8', borderRadius:10, padding:'0 12px', height:40, marginBottom:14, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
          <Icon icon="ph:magnifying-glass" width={16} height={16} color="#94A3B8" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="상품명, 브랜드, 태그 검색"
            style={{ flex:1, border:'none', outline:'none', fontSize:14, color:'#1E293B', background:'transparent' }} />
          {search && (
            <button onClick={() => setSearch('')} style={{ background:'none', border:'none', cursor:'pointer', padding:0, display:'flex', alignItems:'center' }}>
              <Icon icon="ph:x" width={14} height={14} color="#94A3B8" />
            </button>
          )}
        </div>

        {/* 추천 상품 */}
        {!selCat && !search && featured.length > 0 && (
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:13, fontWeight:800, color:'#1E293B', marginBottom:10, display:'flex', alignItems:'center', gap:6 }}>
              <span>⭐ 강력 추천</span>
              <div style={{ flex:1, height:1, background:'#E2E8F0' }} />
            </div>
            <div className="featured-scroll" style={{ display:'flex', gap:10, paddingBottom:8, overflowX:'auto' }}>
              {featured.map(p => {
                const inList = myList.includes(p.id)
                return (
                  <div key={p.id} style={{ flexShrink:0, width:160, background:'#fff', borderRadius:14, overflow:'hidden', border:'1px solid #C8C8C8', position:'relative' }}>
                    <div className="prod-card" onClick={() => setSelProduct(p)} style={{ cursor:'pointer' }}>
                      <div style={{ width:'100%', height:120, background: p.image_url ? 'none' : 'linear-gradient(135deg, #e8e8e8, #e0e0e0)', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
                        {p.image_url ? <img src={p.image_url} alt={p.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <Icon icon="ph:shopping-bag" width={36} height={36} color="#93C5FD" />}
                      </div>
                      <div style={{ padding:'10px 10px 12px' }}>
                        {p.tags[0] && <span style={{ fontSize:9, fontWeight:800, padding:'2px 6px', borderRadius:4, background: TAG_COLOR[p.tags[0]]?.bg ?? '#F1F5F9', color: TAG_COLOR[p.tags[0]]?.color ?? '#475569', marginBottom:5, display:'inline-block' }}>{p.tags[0]}</span>}
                        <div style={{ fontSize:12, fontWeight:700, color:'#1E293B', lineHeight:1.4, marginBottom:4 }}>{p.name}</div>
                        <div style={{ fontSize:10, color:'#94A3B8', marginBottom:6 }}>{p.brand}</div>
                        <div style={{ fontSize:11, fontWeight:800, color: PRICE_COLOR[p.price_range] ?? '#475569' }}>{p.price_range} · {PRICE_LABEL[p.price_range]}</div>
                      </div>
                    </div>
                    <button className="add-btn" onClick={e => { e.stopPropagation(); inList ? removeFromMyList(p.id) : addToMyList(p.id) }} style={{
                      position:'absolute', top:6, right:6, width:26, height:26, borderRadius:'50%', border:'none', cursor:'pointer',
                      background: inList ? '#FFCD00' : 'rgba(0,0,0,0.35)',
                      display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 6px rgba(0,0,0,0.2)',
                    }}>
                      <Icon icon={inList ? 'ph:check-bold' : 'ph:plus-bold'} width={13} height={13} color={inList ? '#92620a' : '#fff'} />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* 정렬 + 상품 수 */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
          <div style={{ fontSize:12, color:'#94A3B8', fontWeight:600 }}>
            {selCat ? `${categories.find(c=>c.id===selCat)?.name} ` : '전체 '}
            <span style={{ color:'#1B6EF3' }}>{filtered.length}개</span>
          </div>
          <div style={{ display:'flex', gap:6 }}>
            {([{ id:'default', label:'기본' }, { id:'price_asc', label:'가격 낮은순' }, { id:'price_desc', label:'가격 높은순' }, { id:'name', label:'이름순' }] as {id:SortOption; label:string}[]).map(s => (
              <button key={s.id} className="sort-btn" onClick={() => setSortBy(s.id)} style={{
                fontSize:10, fontWeight: sortBy === s.id ? 700 : 500, padding:'4px 8px', borderRadius:6, border:'none', cursor:'pointer',
                background:'#e8e8e8', color: sortBy === s.id ? '#1B6EF3' : '#94A3B8',
                boxShadow: sortBy === s.id ? 'inset 2px 2px 4px #c5c5c5, inset -2px -2px 4px #ffffff' : '2px 2px 4px #c5c5c5, -2px -2px 4px #ffffff',
                WebkitTapHighlightColor:'transparent',
              }}>{s.label}</button>
            ))}
          </div>
        </div>

        {/* 상품 그리드 */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          {filtered.map((p, i) => {
            const inList = myList.includes(p.id)
            return (
              <div key={p.id} style={{ background:'#fff', borderRadius:14, border:'1px solid #C8C8C8', overflow:'hidden', position:'relative', animation:`fadeUp 0.25s ease ${i * 0.04}s both` }}>
                <div className="prod-card" onClick={() => setSelProduct(p)} style={{ cursor:'pointer' }}>
                  <div style={{ width:'100%', aspectRatio:'1', background: p.image_url ? 'none' : 'linear-gradient(135deg, #e8e8e8, #e0e0e0)', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
                    {p.image_url ? <img src={p.image_url} alt={p.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <Icon icon="ph:shopping-bag" width={32} height={32} color="#CBD5E1" />}
                  </div>
                  <div style={{ padding:'10px 10px 12px' }}>
                    {p.tags.length > 0 && (
                      <div style={{ display:'flex', gap:3, flexWrap:'wrap', marginBottom:5 }}>
                        {p.tags.slice(0,2).map(tag => (
                          <span key={tag} style={{ fontSize:9, fontWeight:800, padding:'2px 5px', borderRadius:4, background: TAG_COLOR[tag]?.bg ?? '#F1F5F9', color: TAG_COLOR[tag]?.color ?? '#475569' }}>{tag}</span>
                        ))}
                      </div>
                    )}
                    <div style={{ fontSize:12, fontWeight:700, color:'#1E293B', lineHeight:1.4, marginBottom:3 }}>{p.name}</div>
                    <div style={{ fontSize:10, color:'#94A3B8', marginBottom:6 }}>{p.brand}</div>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <span style={{ fontSize:11, fontWeight:800, color: PRICE_COLOR[p.price_range] ?? '#475569' }}>{p.price_range}</span>
                      {p.where_to_buy.length > 0 && <span style={{ fontSize:9, color:'#94A3B8', fontWeight:500 }}>{p.where_to_buy[0]}{p.where_to_buy.length > 1 ? ` 외 ${p.where_to_buy.length-1}` : ''}</span>}
                    </div>
                  </div>
                </div>
                {/* + / ✓ 버튼 */}
                <button className="add-btn" onClick={e => { e.stopPropagation(); inList ? removeFromMyList(p.id) : addToMyList(p.id) }} style={{
                  position:'absolute', top:6, right:6, width:28, height:28, borderRadius:'50%', border:'none', cursor:'pointer',
                  background: inList ? '#FFCD00' : 'rgba(0,0,0,0.35)',
                  display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 6px rgba(0,0,0,0.2)',
                }}>
                  <Icon icon={inList ? 'ph:check-bold' : 'ph:plus-bold'} width={14} height={14} color={inList ? '#92620a' : '#fff'} />
                </button>
              </div>
            )
          })}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign:'center', padding:'40px 0', color:'#CBD5E1' }}>
            <Icon icon="ph:shopping-cart-simple" width={40} height={40} color="#CBD5E1" />
            <div style={{ marginTop:8, fontSize:13 }}>상품이 없어요</div>
          </div>
        )}
      </div>

      {/* 내 쇼핑리스트 플로팅 버튼 */}
      {myList.length > 0 && (
        <div style={{ position:'fixed', bottom:84, left:'50%', transform:'translateX(-50%)', zIndex:30, animation:'fadeIn 0.3s ease' }}>
          <button onClick={() => setShowMyList(true)} style={{
            display:'flex', alignItems:'center', gap:8,
            background:'#FFCD00', border:'none', borderRadius:24,
            padding:'10px 20px', cursor:'pointer',
            boxShadow:'0 4px 20px rgba(255,205,0,0.55)',
            WebkitTapHighlightColor:'transparent',
          }}>
            <Icon icon="ph:shopping-cart-simple-fill" width={18} height={18} color="#92620a" />
            <span style={{ fontSize:14, fontWeight:800, color:'#92620a' }}>내 쇼핑리스트 {myList.length}개</span>
            {checkedCount > 0 && <span style={{ fontSize:11, color:'#92620a', opacity:0.7 }}>({checkedCount} 완료)</span>}
          </button>
        </div>
      )}

      {/* 상품 상세 팝업 */}
      {selProduct && (
        <>
          <div onClick={() => setSelProduct(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:500, animation:'fadeIn 0.2s ease' }} />
          <div style={{ position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)', width:'100%', maxWidth:390, background:'#e8e8e8', borderRadius:'20px 20px 0 0', zIndex:501, animation:'slideUp 0.3s ease', maxHeight:'85vh', overflowY:'auto' }}>
            <div style={{ width:40, height:4, borderRadius:2, background:'#C8C8C8', margin:'12px auto 0' }} />
            <div style={{ width:'100%', height:220, background: selProduct.image_url ? 'none' : 'linear-gradient(135deg, #e0e0e0, #d0d0d0)', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
              {selProduct.image_url ? <img src={selProduct.image_url} alt={selProduct.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <Icon icon="ph:shopping-bag" width={60} height={60} color="#94A3B8" />}
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
              {selProduct.description && <div style={{ fontSize:13, color:'#334155', lineHeight:1.7, marginBottom:16 }}>{selProduct.description}</div>}
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
              {/* 내 리스트 추가 버튼 */}
              <button onClick={() => { myList.includes(selProduct.id) ? removeFromMyList(selProduct.id) : addToMyList(selProduct.id) }} style={{
                width:'100%', height:50, borderRadius:12, border:'none', cursor:'pointer',
                background: myList.includes(selProduct.id) ? '#FEF3C7' : '#FFCD00',
                color:'#92620a', fontSize:15, fontWeight:700,
                display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                marginBottom:10,
                boxShadow: myList.includes(selProduct.id) ? 'inset 2px 2px 6px #e5d68a' : '0 4px 14px rgba(255,205,0,0.45)',
                WebkitTapHighlightColor:'transparent',
              }}>
                <Icon icon={myList.includes(selProduct.id) ? 'ph:check-circle-fill' : 'ph:shopping-cart-simple'} width={18} height={18} color="#92620a" />
                {myList.includes(selProduct.id) ? '내 리스트에 담겼어요 ✓' : '내 쇼핑리스트에 추가'}
              </button>
              <button onClick={() => setSelProduct(null)} style={{ width:'100%', height:44, borderRadius:12, border:'none', background:'#e8e8e8', color:'#94A3B8', fontSize:14, fontWeight:600, cursor:'pointer', boxShadow:'3px 3px 6px #c5c5c5, -3px -3px 6px #ffffff', WebkitTapHighlightColor:'transparent' }}>닫기</button>
            </div>
          </div>
        </>
      )}

      {/* 내 쇼핑리스트 페이지 */}
      {showMyList && (
        <>
          <div onClick={() => setShowMyList(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:600, animation:'fadeIn 0.2s ease' }} />
          <div style={{ position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)', width:'100%', maxWidth:390, background:'#e8e8e8', borderRadius:'20px 20px 0 0', zIndex:601, animation:'slideUp 0.3s ease', maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ width:40, height:4, borderRadius:2, background:'#C8C8C8', margin:'12px auto 0' }} />
            <div style={{ padding:'16px 18px 40px' }}>

              {/* 헤더 */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                <div>
                  <div style={{ fontSize:18, fontWeight:800, color:'#0F172A' }}>🛒 내 쇼핑리스트</div>
                  <div style={{ fontSize:12, color:'#64748B', marginTop:2 }}>{checkedCount}/{myList.length}개 완료</div>
                </div>
                <button onClick={() => setShowMyList(false)} style={{ background:'none', border:'none', cursor:'pointer', padding:4 }}>
                  <Icon icon="ph:x" width={20} height={20} color="#94A3B8" />
                </button>
              </div>

              {/* 진행률 바 */}
              <div style={{ background:'#E2E8F0', borderRadius:99, height:8, marginBottom:20, overflow:'hidden' }}>
                <div style={{
                  height:'100%', borderRadius:99,
                  background:'linear-gradient(90deg, #FFCD00, #F59E0B)',
                  width: myList.length > 0 ? `${(checkedCount / myList.length) * 100}%` : '0%',
                  transition:'width 0.4s ease',
                }} />
              </div>

              {/* 상품 리스트 */}
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {myProducts.map(p => {
                  const checked = !!myChecked[p.id]
                  return (
                    <div key={p.id} className="my-item" style={{
                      display:'flex', alignItems:'center', gap:12,
                      background: checked ? '#f8fdf4' : '#fff',
                      borderRadius:14, padding:'12px 14px',
                      border: `1px solid ${checked ? '#86EFAC' : '#E2E8F0'}`,
                      borderLeft: `4px solid ${checked ? '#16A34A' : '#CBD5E1'}`,
                    }}>
                      {/* 이미지 */}
                      <div onClick={() => setSelProduct(p)} style={{
                        width:54, height:54, borderRadius:10, overflow:'hidden', flexShrink:0,
                        background: p.image_url ? 'none' : '#f0f0f0',
                        display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer',
                        border:'1px solid #E2E8F0',
                      }}>
                        {p.image_url ? <img src={p.image_url} alt={p.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <Icon icon="ph:shopping-bag" width={22} height={22} color="#CBD5E1" />}
                      </div>

                      {/* 텍스트 */}
                      <div onClick={() => setSelProduct(p)} style={{ flex:1, minWidth:0, cursor:'pointer' }}>
                        <div style={{
                          fontSize:13, fontWeight:700,
                          color: checked ? '#94A3B8' : '#0F172A',
                          textDecoration: checked ? 'line-through' : 'none',
                          lineHeight:1.4, marginBottom:2,
                          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                        }}>{p.name}</div>
                        <div style={{ fontSize:11, color:'#94A3B8', marginBottom:2 }}>{p.brand}</div>
                        <div style={{ fontSize:11, fontWeight:700, color: checked ? '#CBD5E1' : PRICE_COLOR[p.price_range] ?? '#475569' }}>
                          {p.price_range} · {PRICE_LABEL[p.price_range]}
                        </div>
                      </div>

                      {/* 체크 + 삭제 */}
                      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6, flexShrink:0 }}>
                        <div onClick={() => toggleChecked(p.id)} style={{
                          width:28, height:28, borderRadius:8,
                          background: checked ? '#16A34A' : '#fff',
                          border: checked ? 'none' : '1.5px solid #C8C8C8',
                          display:'flex', alignItems:'center', justifyContent:'center',
                          cursor:'pointer', transition:'all 0.15s',
                          boxShadow: checked ? 'none' : '1px 1px 3px #d0d0d0',
                        }}>
                          {checked && <Icon icon="ph:check-bold" width={14} height={14} color="#fff" />}
                        </div>
                        <button onClick={() => removeFromMyList(p.id)} style={{ background:'none', border:'none', cursor:'pointer', padding:2, display:'flex', alignItems:'center' }}>
                          <Icon icon="ph:trash" width={14} height={14} color="#CBD5E1" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* 전체 완료 */}
              {checkedCount === myList.length && myList.length > 0 && (
                <div style={{ textAlign:'center', marginTop:24, padding:'24px', background:'#FEF9C3', borderRadius:14, border:'1px solid #FDE047' }}>
                  <div style={{ fontSize:32, marginBottom:8 }}>🎉</div>
                  <div style={{ fontSize:16, fontWeight:800, color:'#92620a' }}>쇼핑 완료!</div>
                  <div style={{ fontSize:13, color:'#A16207', marginTop:4 }}>모든 상품을 구매했어요</div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
