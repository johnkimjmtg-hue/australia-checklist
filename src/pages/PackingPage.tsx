// ─────────────────────────────────────────────
// PackingPage.tsx
// src/pages/PackingPage.tsx
// ─────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { Icon } from '@iconify/react'
import { supabase } from '../lib/supabase'
import { getCachedBusinesses } from '../lib/dataCache'
import BusinessCard from '../components/BusinessCard'
import type { Business } from '../lib/businessService'

const ff = "-apple-system, 'Apple SD Gothic Neo', 'Pretendard', sans-serif"
const STORAGE_KEY = 'packing-checked'

type Category = { id: string; label: string; emoji: string; sort_order: number }
type PackItem = {
  id: string; category_id: string; label: string; icon: string | null
  sort_order: number; is_active: boolean; description?: string | null
  tips?: string | null; image_url?: string | null; address?: string | null
  related_business_ids?: string[] | null
}

function getRisk(tips?: string | null) {
  if (!tips) return { label: '', color: '', bg: '', border: '', desc: '' }
  const parts = tips.split('|')
  const label = parts[0]?.trim() ?? ''
  const desc  = parts[1]?.trim() ?? ''
  const isRed    = label.startsWith('🔴')
  const isYellow = label.startsWith('🟡')
  const isGreen  = label.startsWith('🟢')
  return {
    label,
    desc,
    color:  isRed ? '#DC2626' : isYellow ? '#D97706' : isGreen ? '#16A34A' : '#29B6D0',
    bg:     isRed ? '#FEF2F2' : isYellow ? '#FFFBEB' : isGreen ? '#F0FDF4' : 'rgba(41,182,208,0.08)',
    border: isRed ? 'rgba(220,38,38,0.2)' : isYellow ? 'rgba(217,119,6,0.2)' : isGreen ? 'rgba(22,163,74,0.2)' : 'rgba(0,131,143,0.15)',
  }
}

type Props = { onClose: () => void }

export default function PackingPage({ onClose }: Props) {
  const [categories, setCategories]   = useState<Category[]>([])
  const [items, setItems]             = useState<PackItem[]>([])
  const [loading, setLoading]         = useState(true)
  const [activeCategory, setActiveCategory] = useState('')
  const [checked, setChecked]         = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') } catch { return {} }
  })
  const [detailItem, setDetailItem]   = useState<PackItem | null>(null)
  const [detailBizCards, setDetailBizCards] = useState<Business[]>([])
  const [showSimResult, setShowSimResult] = useState(false)

  useEffect(() => {
    const load = async () => {
      const [{ data: cats }, { data: its }] = await Promise.all([
        supabase.from('packing_categories').select('*').order('sort_order'),
        supabase.from('packing_items').select('*').eq('is_active', true).order('sort_order'),
      ])
      if (cats?.length) {
        setCategories(cats)
        setActiveCategory(cats[0].id)
      }
      if (its?.length) setItems(its)
      setLoading(false)
    }
    load()
  }, [])

  const toggleCheck = (id: string) => {
    const next = { ...checked, [id]: !checked[id] }
    if (!next[id]) delete next[id]
    setChecked(next)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
  }

  const catItems = items.filter(i => i.category_id === activeCategory)
  const checkedCount = catItems.filter(i => checked[i.id]).length

  // 시뮬레이션
  const dangerItems  = items.filter(i => i.category_id === 'pack_danger')
  const redChecked   = dangerItems.filter(i => i.tips?.startsWith('🔴') && checked[i.id])
  const yellowChecked = dangerItems.filter(i => i.tips?.startsWith('🟡') && checked[i.id])
  const simStatus = redChecked.length > 0 ? 'danger' : yellowChecked.length > 0 ? 'warn' : 'safe'

  const openDetail = (item: PackItem) => {
    setDetailItem(item)
    if (item.related_business_ids?.length) {
      const cached = getCachedBusinesses()
      setDetailBizCards(cached?.filter((b: Business) => item.related_business_ids!.includes(b.id)) ?? [])
    } else setDetailBizCards([])
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:200, fontFamily:ff, color:'#7BAAB5' }}>
      로딩 중...
    </div>
  )

  return (
    <div style={{ fontFamily:ff, paddingBottom:40 }}>
      <style>{`
        @keyframes slideUpSheet { from{transform:translateX(-50%) translateY(100%)} to{transform:translateX(-50%) translateY(0)} }
        .pack-cat-scroll { overflow-x:auto; scrollbar-width:thin; scrollbar-color:#CBD5E1 transparent; }
        .pack-cat-scroll::-webkit-scrollbar { height:3px; }
        .pack-cat-scroll::-webkit-scrollbar-track { background:transparent; }
        .pack-cat-scroll::-webkit-scrollbar-thumb { background:#CBD5E1; border-radius:2px; }
      `}</style>

      {/* 카테고리 탭 */}
      <div className="pack-cat-scroll" style={{ display:'flex', gap:6, padding:'12px 16px 12px' }}>
        {categories.map(cat => {
          const isActive = activeCategory === cat.id
          const catChecked = items.filter(i => i.category_id === cat.id && checked[i.id]).length
          const catTotal   = items.filter(i => i.category_id === cat.id).length
          return (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)} style={{
              flexShrink:0, height:36, padding:'0 12px', borderRadius:20,
              border: isActive ? 'none' : '1px solid rgba(0,0,0,0.1)',
              background: isActive ? '#0D3349' : '#F8FAFC',
              color: isActive ? '#fff' : '#64748B',
              fontSize:13, fontWeight: isActive ? 700 : 400,
              cursor:'pointer', fontFamily:ff, display:'flex', alignItems:'center', gap:6,
              WebkitTapHighlightColor:'transparent',
            }}>
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
              {catChecked > 0 && (
                <span style={{ fontSize:10, fontWeight:700, background: isActive ? 'rgba(255,255,255,0.25)' : '#00838F', color:'#fff', borderRadius:10, padding:'1px 6px' }}>
                  {catChecked}/{catTotal}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* 반입금지 카테고리 - 벌금 배너 + 시뮬레이션 버튼 */}
      {activeCategory === 'pack_danger' && (
        <div style={{ padding:'0 16px 12px' }}>
          <button onClick={() => setShowSimResult(true)} style={{
            width:'100%', height:44, borderRadius:12, border:'none',
            background:'linear-gradient(135deg, #DC2626, #B91C1C)',
            color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            marginBottom:10, fontFamily:ff, WebkitTapHighlightColor:'transparent',
          }}>
            ✈️ 지금 출국해도 괜찮을까? 공항 체크!
          </button>
          <div style={{
            background:'#FEF2F2', border:'1.5px solid #FECACA', borderRadius:12,
            padding:'10px 14px', display:'flex', alignItems:'flex-start', gap:8,
          }}>
            <span style={{ fontSize:16, flexShrink:0 }}>⚠️</span>
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:'#DC2626', marginBottom:2 }}>
                미신고 적발 시 현장 벌금 최소 AUD 6,260 (약 570만원)
              </div>
              <div style={{ fontSize:11, color:'#B91C1C', lineHeight:1.5 }}>
                비자 취소 및 향후 입국 불이익 가능 · 애매하면 무조건 신고(Declare)!
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 진행도 */}
      <div style={{ padding:'0 16px 10px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ fontSize:13, fontWeight:700, color:'#0D3349' }}>
          {categories.find(c => c.id === activeCategory)?.label}
        </div>
        <div style={{ fontSize:12, color:'#64748B' }}>
          {checkedCount}/{catItems.length} 완료
        </div>
      </div>
      {catItems.length > 0 && (
        <div style={{ margin:'0 16px 12px', height:4, borderRadius:2, background:'#E2E8F0' }}>
          <div style={{ height:'100%', borderRadius:2, background:'#29B6D0', width:`${(checkedCount/catItems.length)*100}%`, transition:'width 0.3s' }} />
        </div>
      )}

      {/* 아이템 리스트 */}
      <div style={{ padding:'0 16px', display:'flex', flexDirection:'column', gap:8 }}>
        {catItems.map(item => {
          const isChecked = !!checked[item.id]
          const risk = getRisk(item.tips)
          return (
            <div key={item.id} onClick={() => openDetail(item)} style={{
              display:'flex', alignItems:'center', gap:12,
              background: isChecked ? 'rgba(41,182,208,0.06)' : '#F8FAFC',
              borderRadius:12, padding:'12px 14px',
              border: isChecked ? '1px solid rgba(41,182,208,0.25)' : '1px solid rgba(0,0,0,0.06)',
              cursor:'pointer', WebkitTapHighlightColor:'transparent',
            }}>
              {/* 아이콘 */}
              <div style={{ width:44, height:44, borderRadius:10, flexShrink:0, background:'#F1F5F9', border:'1px solid rgba(0,0,0,0.06)', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>
                {item.image_url
                  ? <img src={item.image_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  : <Icon icon={item.icon ?? 'ph:check-circle'} width={24} height={24} color="#94A3B8" />
                }
              </div>

              {/* 텍스트 */}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:14, fontWeight:600, color: isChecked ? '#94A3B8' : '#0D3349', textDecoration: isChecked ? 'line-through' : 'none', lineHeight:1.4 }}>
                  {item.label}
                </div>
                {risk.label && (
                  <span style={{ display:'inline-block', marginTop:4, fontSize:10, fontWeight:700, color:risk.color, background:risk.bg, borderRadius:6, padding:'2px 7px' }}>
                    {risk.label}
                  </span>
                )}
              </div>

              {/* 체크박스 */}
              <button onClick={e => { e.stopPropagation(); toggleCheck(item.id) }} style={{
                width:26, height:26, borderRadius:8, flexShrink:0,
                border: isChecked ? 'none' : '1.5px solid #CBD5E1',
                background: isChecked ? '#29B6D0' : '#ffffff',
                display:'flex', alignItems:'center', justifyContent:'center',
                cursor:'pointer', padding:0, WebkitTapHighlightColor:'transparent',
              }}>
                {isChecked && <svg width="12" height="9" viewBox="0 0 12 9" fill="none"><path d="M1 4.5L4.5 8L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </button>
            </div>
          )
        })}
      </div>

      {/* 상세 팝업 */}
      {detailItem && (
        <>
          <div onClick={() => setDetailItem(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(6px)', zIndex:1100 }} />
          <div onClick={e => e.stopPropagation()} style={{
            position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)',
            width:'100%', maxWidth:430, background:'#ffffff',
            borderRadius:'20px 20px 0 0', maxHeight:'72vh', overflowY:'auto',
            zIndex:1101, animation:'slideUpSheet 0.25s ease', boxShadow:'0 8px 32px rgba(0,0,0,0.18)',
            fontFamily:ff, display:'flex', flexDirection:'column',
          }}>
            <div style={{ flexShrink:0, display:'flex', justifyContent:'flex-end', padding:'12px 12px 0' }}>
              <button onClick={() => setDetailItem(null)} style={{ width:28, height:28, borderRadius:'50%', background:'rgba(0,0,0,0.08)', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                <Icon icon="ph:x" width={16} height={16} color="#0D3349" />
              </button>
            </div>
            <div style={{ flex:1, overflowY:'auto', padding:'8px 16px 40px' }}>
              {detailItem.image_url && (
                <div style={{ width:'100%', height:200, overflow:'hidden', borderRadius:12, marginBottom:16 }}>
                  <img src={detailItem.image_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                </div>
              )}
              <div style={{ fontSize:18, fontWeight:700, color:'#0D3349', lineHeight:1.4, marginBottom:12 }}>{detailItem.label}</div>
              {detailItem.description && (
                <div style={{ fontSize:14, color:'#475569', lineHeight:1.7, marginBottom:16, whiteSpace:'pre-wrap' }}>{detailItem.description}</div>
              )}
              {detailItem.tips && (() => {
                const risk = getRisk(detailItem.tips)
                return (
                  <div style={{ background:risk.bg, border:`1px solid ${risk.border}`, borderRadius:12, padding:12, marginBottom:16 }}>
                    {risk.label && <div style={{ fontSize:12, fontWeight:700, color:risk.color, marginBottom: risk.desc ? 6 : 0 }}>{risk.label}</div>}
                    {risk.desc && <div style={{ fontSize:13, color:'#475569', lineHeight:1.6 }}>{risk.desc}</div>}
                  </div>
                )
              })()}
              {detailItem.address && (
                <button onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(detailItem.address!)}`, '_blank')} style={{ display:'flex', alignItems:'center', gap:8, width:'100%', background:'rgba(41,182,208,0.08)', border:'1px solid rgba(0,131,143,0.15)', borderRadius:12, padding:12, marginBottom:16, cursor:'pointer', textAlign:'left' }}>
                  <Icon icon="ph:map-pin" width={16} height={16} color="#29B6D0" />
                  <div style={{ fontSize:13, color:'#29B6D0', fontWeight:700 }}>{detailItem.address}</div>
                </button>
              )}
              {detailBizCards.length > 0 && (
                <div>
                  <div style={{ fontSize:11, fontWeight:700, color:'#1565A0', marginBottom:8 }}>🏢 관련 업체</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {detailBizCards.map((biz: Business) => <BusinessCard key={biz.id} business={biz} />)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* 공항 시뮬레이션 결과 팝업 */}
      {showSimResult && (
        <>
          <div onClick={() => setShowSimResult(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(6px)', zIndex:1200 }} />
          <div style={{
            position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
            width:'calc(100% - 48px)', maxWidth:340,
            background:'#ffffff', borderRadius:20, zIndex:1201,
            boxShadow:'0 20px 60px rgba(0,0,0,0.25)',
            padding:'28px 20px 24px', fontFamily:ff, textAlign:'center',
          }}>
            <div style={{ fontSize:48, marginBottom:12 }}>
              {simStatus === 'danger' ? '🚨' : simStatus === 'warn' ? '⚠️' : '✅'}
            </div>
            <div style={{ fontSize:18, fontWeight:800, color:'#0F172A', marginBottom:8 }}>
              {simStatus === 'danger' ? '위험! 압수 가능 품목이 있어요' :
               simStatus === 'warn'   ? '신고 필요 항목이 있어요' :
                                        '문제없어요! 입국 준비 완료'}
            </div>
            <div style={{ fontSize:13, color:'#64748B', lineHeight:1.7, marginBottom:20 }}>
              {simStatus === 'danger' ? (
                <>
                  <span style={{ color:'#DC2626', fontWeight:700 }}>🔴 절대 금지 {redChecked.length}개</span>가 짐에 있어요!<br/>
                  지금 당장 꺼내세요. 미신고 적발 시 벌금 AUD 6,260~
                </>
              ) : simStatus === 'warn' ? (
                <>
                  <span style={{ color:'#D97706', fontWeight:700 }}>🟡 신고 필요 {yellowChecked.length}개</span>가 있어요.<br/>
                  입국 신고서 Food 항목에 체크하면 대부분 통과돼요!
                </>
              ) : (
                <>반입 금지 품목이 없어요. 즐거운 호주 여행 되세요! 🦘</>
              )}
            </div>
            {simStatus === 'danger' && redChecked.length > 0 && (
              <div style={{ background:'#FEF2F2', borderRadius:10, padding:'10px 14px', marginBottom:16, textAlign:'left' }}>
                {redChecked.map(item => (
                  <div key={item.id} style={{ fontSize:12, color:'#DC2626', fontWeight:600, padding:'3px 0' }}>• {item.label}</div>
                ))}
              </div>
            )}
            {simStatus === 'warn' && yellowChecked.length > 0 && (
              <div style={{ background:'#FFFBEB', borderRadius:10, padding:'10px 14px', marginBottom:16, textAlign:'left' }}>
                {yellowChecked.map(item => (
                  <div key={item.id} style={{ fontSize:12, color:'#D97706', fontWeight:600, padding:'3px 0' }}>• {item.label}</div>
                ))}
              </div>
            )}
            <button onClick={() => setShowSimResult(false)} style={{
              width:'100%', height:48, borderRadius:12, border:'none',
              background: simStatus === 'danger' ? '#DC2626' : simStatus === 'warn' ? '#D97706' : '#29B6D0',
              color:'#fff', fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:ff,
            }}>확인</button>
          </div>
        </>
      )}
    </div>
  )
}
