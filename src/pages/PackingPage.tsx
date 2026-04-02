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
const CHECKED_KEY = 'packing-checked'
const EXCLUDED_KEY = 'packing-excluded'
const CUSTOM_KEY   = 'packing-custom'

type Category = { id: string; label: string; emoji: string; sort_order: number }
type PackItem = {
  id: string; category_id: string; label: string; icon: string | null
  sort_order: number; is_active: boolean; description?: string | null
  tips?: string | null; image_url?: string | null; address?: string | null
  related_business_ids?: string[] | null
}

type FilterTab = 'all' | 'danger' | 'excluded'

function getRisk(tips?: string | null) {
  if (!tips) return { label: '', color: '', bg: '', border: '', desc: '' }
  const parts = tips.split('|')
  const label = parts[0]?.trim() ?? ''
  const desc  = parts[1]?.trim() ?? ''
  const isRed    = label.startsWith('🔴')
  const isYellow = label.startsWith('🟡')
  const isGreen  = label.startsWith('🟢')
  return {
    label, desc,
    color:  isRed ? '#DC2626' : isYellow ? '#D97706' : isGreen ? '#16A34A' : '#29B6D0',
    bg:     isRed ? '#FEF2F2' : isYellow ? '#FFFBEB' : isGreen ? '#F0FDF4' : 'rgba(41,182,208,0.08)',
    border: isRed ? 'rgba(220,38,38,0.2)' : isYellow ? 'rgba(217,119,6,0.2)' : isGreen ? 'rgba(22,163,74,0.2)' : 'rgba(0,131,143,0.15)',
  }
}

const CAT_ORDER = ['pack_docs', 'pack_meds', 'pack_elec', 'pack_clothes']

type Props = { onClose: () => void }

export default function PackingPage({ onClose }: Props) {
  const [categories, setCategories] = useState<Category[]>([])
  const [items, setItems]           = useState<PackItem[]>([])
  const [loading, setLoading]       = useState(true)
  const [filterTab, setFilterTab]   = useState<FilterTab>('all')
  const [checked, setChecked]       = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem(CHECKED_KEY) ?? '{}') } catch { return {} }
  })
  const [excluded, setExcluded]     = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem(EXCLUDED_KEY) ?? '{}') } catch { return {} }
  })
  const [detailItem, setDetailItem]       = useState<PackItem | null>(null)
  const [detailBizCards, setDetailBizCards] = useState<Business[]>([])
  const [showSimResult, setShowSimResult] = useState(false)
  const [customItems, setCustomItems] = useState<{id:string; label:string}[]>(() => {
    try { return JSON.parse(localStorage.getItem(CUSTOM_KEY) ?? '[]') } catch { return [] }
  })
  const [customInput, setCustomInput] = useState('')

  useEffect(() => {
    const load = async () => {
      const [{ data: cats }, { data: its }] = await Promise.all([
        supabase.from('packing_categories').select('*').order('sort_order'),
        supabase.from('packing_items').select('*').eq('is_active', true).order('sort_order'),
      ])
      if (cats?.length) setCategories(cats)
      if (its?.length) {
        setItems(its)
        // 반입금지(🔴) 항목 제외한 수 저장 (체크 대상 항목만)
        const checkableCount = its.filter((i:any) => !i.tips?.startsWith('🔴')).length
        try { localStorage.setItem('packing-total', String(checkableCount)) } catch {}
      }
      setLoading(false)
    }
    load()
  }, [])

  const toggleCheck = (id: string) => {
    const next = { ...checked, [id]: !checked[id] }
    if (!next[id]) delete next[id]
    setChecked(next)
    try { localStorage.setItem(CHECKED_KEY, JSON.stringify(next)) } catch {}
  }

  const toggleExclude = (id: string) => {
    const next = { ...excluded, [id]: !excluded[id] }
    if (!next[id]) delete next[id]
    // 제외하면 체크 해제
    if (next[id]) {
      const nextChecked = { ...checked }
      delete nextChecked[id]
      setChecked(nextChecked)
      try { localStorage.setItem(CHECKED_KEY, JSON.stringify(nextChecked)) } catch {}
    }
    setExcluded(next)
    try { localStorage.setItem(EXCLUDED_KEY, JSON.stringify(next)) } catch {}
  }

  const addCustomItem = () => {
    const label = customInput.trim()
    if (!label) return
    const id = `custom_${Date.now()}`
    const next = [...customItems, { id, label }]
    setCustomItems(next)
    try {
      localStorage.setItem(CUSTOM_KEY, JSON.stringify(next))
      localStorage.setItem('packing-custom-count', String(next.length))
    } catch {}
    setCustomInput('')
  }

  const removeCustomItem = (id: string) => {
    const next = customItems.filter(i => i.id !== id)
    setCustomItems(next)
    try {
      localStorage.setItem(CUSTOM_KEY, JSON.stringify(next))
      localStorage.setItem('packing-custom-count', String(next.length))
    } catch {}
    const nc = { ...checked }; delete nc[id]; setChecked(nc)
    try { localStorage.setItem(CHECKED_KEY, JSON.stringify(nc)) } catch {}
  }

  const openDetail = (item: PackItem) => {
    setDetailItem(item)
    if (item.related_business_ids?.length) {
      const cached = getCachedBusinesses()
      setDetailBizCards(cached?.filter((b: Business) => item.related_business_ids!.includes(b.id)) ?? [])
    } else setDetailBizCards([])
  }

  // 시뮬레이션
  const dangerItems    = items.filter(i => i.category_id === 'pack_danger')
  const redChecked     = dangerItems.filter(i => i.tips?.startsWith('🔴') && checked[i.id])
  const yellowChecked  = dangerItems.filter(i => i.tips?.startsWith('🟡') && checked[i.id])
  const simStatus      = redChecked.length > 0 ? 'danger' : yellowChecked.length > 0 ? 'warn' : 'safe'

  // 정렬된 카테고리 (pack_danger 제외)
  const mainCats = CAT_ORDER.map(id => categories.find(c => c.id === id)).filter(Boolean) as Category[]
  const excludedItems = items.filter(i => excluded[i.id])

  const renderItem = (item: PackItem, showExcludeBtn = true) => {
    const isChecked  = !!checked[item.id]
    const isExcluded = !!excluded[item.id]
    const risk = getRisk(item.tips)
    const cat = categories.find(c => c.id === item.category_id)

    return (
      <div key={item.id} style={{
        display:'flex', alignItems:'center', gap:12,
        background: isChecked ? 'rgba(41,182,208,0.06)' : '#F8FAFC',
        borderRadius:12, padding:'12px 14px',
        border: isChecked ? '1px solid rgba(41,182,208,0.25)' : '1px solid rgba(0,0,0,0.06)',
        cursor:'pointer', WebkitTapHighlightColor:'transparent', position:'relative',
      }} onClick={() => openDetail(item)}>
        {/* X 제외 버튼 - 우상단 */}
        {showExcludeBtn && (
          <button onClick={e => { e.stopPropagation(); toggleExclude(item.id) }} style={{
            position:'absolute', top:6, right:6,
            width:18, height:18, borderRadius:'50%',
            background:'rgba(0,0,0,0.08)', border:'none',
            display:'flex', alignItems:'center', justifyContent:'center',
            cursor:'pointer', padding:0, WebkitTapHighlightColor:'transparent',
          }}>
            <Icon icon="ph:x-bold" width={9} height={9} color="#94A3B8" />
          </button>
        )}
        {/* 체크 버튼 - 왼쪽 (제외 탭에서는 숨김) */}
        {filterTab !== 'excluded' && (
          <div onClick={e => e.stopPropagation()}>
            <button onClick={() => toggleCheck(item.id)} style={{
              width:26, height:26, borderRadius:8, flexShrink:0,
              border: isChecked ? 'none' : '1.5px solid #CBD5E1',
              background: isChecked ? '#29B6D0' : '#ffffff',
              display:'flex', alignItems:'center', justifyContent:'center',
              cursor:'pointer', padding:0, WebkitTapHighlightColor:'transparent',
            }}>
              {isChecked && <svg width="12" height="9" viewBox="0 0 12 9" fill="none"><path d="M1 4.5L4.5 8L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </button>
          </div>
        )}
        {/* 아이콘 */}
        <div style={{
          width:40, height:40, borderRadius:10, flexShrink:0,
          background:'#F1F5F9', border:'1px solid rgba(0,0,0,0.06)',
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          <Icon icon={item.icon ?? 'ph:check-circle'} width={22} height={22} color={risk.color || '#94A3B8'} />
        </div>

        {/* 텍스트 */}
        <div style={{ flex:1, minWidth:0 }}>
          {filterTab === 'excluded' && cat && (
            <div style={{ fontSize:10, color:'#94A3B8', marginBottom:2 }}>{cat.emoji} {cat.label}</div>
          )}
          <div style={{ fontSize:14, fontWeight:600, color: isChecked ? '#94A3B8' : '#0D3349', textDecoration: isChecked ? 'line-through' : 'none', lineHeight:1.4 }}>
            {item.label}
          </div>
          {risk.label && (
            <span style={{ display:'inline-block', marginTop:3, fontSize:10, fontWeight:700, color:risk.color, background:risk.bg, borderRadius:6, padding:'1px 6px' }}>
              {risk.label}
            </span>
          )}
        </div>

        {/* 제외 탭에서 복원 버튼 */}
        {filterTab === 'excluded' && (
          <div onClick={e => e.stopPropagation()}>
            <button onClick={() => toggleExclude(item.id)} style={{
              height:26, padding:'0 10px', borderRadius:8, flexShrink:0,
              border:'1.5px solid #CBD5E1', background:'#ffffff',
              fontSize:11, fontWeight:700, color:'#64748B',
              cursor:'pointer', fontFamily:ff, WebkitTapHighlightColor:'transparent',
            }}>복원</button>
          </div>
        )}
      </div>
    )
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:200, fontFamily:ff, color:'#7BAAB5' }}>
      로딩 중...
    </div>
  )

  return (
    <div style={{ fontFamily:ff, height:'100%', display:'flex', flexDirection:'column' }}>
      <style>{`
        @keyframes slideUpSheet { from{transform:translateX(-50%) translateY(100%)} to{transform:translateX(-50%) translateY(0)} }
        .pack-scroll::-webkit-scrollbar { width:3px; }
        .pack-scroll::-webkit-scrollbar-thumb { background:#CBD5E1; border-radius:2px; }
      `}</style>

      {/* 필터 탭 */}
      <div style={{ flexShrink:0, display:'flex', gap:6, padding:'4px 16px 12px', borderBottom:'1px solid rgba(0,0,0,0.06)' }}>
        {[
          { id:'all',      label:'📋 전체' },
          { id:'danger',   label:'🔴 반입금지' },
          { id:'excluded', label:`🗑️ 제외 ${Object.keys(excluded).length > 0 ? `(${Object.keys(excluded).length})` : ''}` },
        ].map(tab => (
          <button key={tab.id} onClick={() => setFilterTab(tab.id as FilterTab)} style={{
            height:32, padding:'0 14px', borderRadius:20,
            border: filterTab === tab.id ? 'none' : '1px solid rgba(0,0,0,0.1)',
            background: filterTab === tab.id ? '#0D3349' : '#F8FAFC',
            color: filterTab === tab.id ? '#fff' : '#64748B',
            fontSize:13, fontWeight: filterTab === tab.id ? 700 : 400,
            cursor:'pointer', fontFamily:ff, WebkitTapHighlightColor:'transparent',
          }}>{tab.label}</button>
        ))}
      </div>

      {/* 본문 */}
      <div className="pack-scroll" style={{ flex:1, overflowY:'auto', padding:'12px 16px 40px' }}>

        {/* 전체 탭 */}
        {filterTab === 'all' && (
          <>
            {/* 나만의 아이템 섹션 - 항상 맨 위 */}
            <div style={{ marginBottom:24 }}>
              <div style={{ fontSize:15, fontWeight:700, color:'#0D3349', marginBottom:10 }}>✏️ 나만의 아이템</div>
              {/* 입력창 */}
              <div style={{ display:'flex', gap:8, marginBottom: customItems.filter(i => !excluded[i.id]).length > 0 ? 10 : 0 }}>
                <input
                  value={customInput}
                  onChange={e => setCustomInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCustomItem()}
                  placeholder="짐에 추가할 아이템 입력..."
                  style={{
                    flex:1, height:44, borderRadius:12,
                    border:'1.5px solid rgba(139,92,246,0.3)',
                    padding:'0 14px', fontSize:14, fontFamily:ff,
                    outline:'none', background:'#FAFAFF', color:'#0D3349',
                  }}
                />
                <button onClick={addCustomItem} style={{
                  width:44, height:44, borderRadius:12, border:'none',
                  background:'#8B5CF6', cursor:'pointer',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  flexShrink:0, WebkitTapHighlightColor:'transparent',
                }}>
                  <Icon icon="ph:plus-bold" width={18} height={18} color="#fff" />
                </button>
              </div>
              {/* 커스텀 아이템 리스트 */}
              {customItems.filter(i => !excluded[i.id]).length > 0 && (
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {customItems.filter(i => !excluded[i.id]).map(item => {
                    const isChecked = !!checked[item.id]
                    return (
                      <div key={item.id} style={{
                        display:'flex', alignItems:'center', gap:12,
                        background: isChecked ? 'rgba(139,92,246,0.06)' : '#F8FAFC',
                        borderRadius:12, padding:'12px 14px',
                        border: isChecked ? '1px solid rgba(139,92,246,0.25)' : '1px solid rgba(0,0,0,0.06)',
                        position:'relative',
                      }}>
                        <button onClick={() => removeCustomItem(item.id)} style={{
                          position:'absolute', top:6, right:6,
                          width:18, height:18, borderRadius:'50%',
                          background:'rgba(0,0,0,0.08)', border:'none',
                          display:'flex', alignItems:'center', justifyContent:'center',
                          cursor:'pointer', padding:0, WebkitTapHighlightColor:'transparent',
                        }}>
                          <Icon icon="ph:x-bold" width={9} height={9} color="#94A3B8" />
                        </button>
                        <button onClick={() => toggleCheck(item.id)} style={{
                          width:26, height:26, borderRadius:8, flexShrink:0,
                          border: isChecked ? 'none' : '1.5px solid #CBD5E1',
                          background: isChecked ? '#8B5CF6' : '#ffffff',
                          display:'flex', alignItems:'center', justifyContent:'center',
                          cursor:'pointer', padding:0, WebkitTapHighlightColor:'transparent',
                        }}>
                          {isChecked && <svg width="12" height="9" viewBox="0 0 12 9" fill="none"><path d="M1 4.5L4.5 8L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </button>
                        <div style={{ width:40, height:40, borderRadius:10, flexShrink:0, background:'rgba(139,92,246,0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <Icon icon="ph:bag-simple" width={20} height={20} color="#8B5CF6" />
                        </div>
                        <div style={{ fontSize:14, fontWeight:600, color: isChecked ? '#94A3B8' : '#0D3349', textDecoration: isChecked ? 'line-through' : 'none', flex:1, paddingRight:16 }}>
                          {item.label}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* 기존 카테고리들 */}
            {mainCats.map(cat => {
              const catItems = items.filter(i => i.category_id === cat.id && !excluded[i.id])
              if (!catItems.length) return null
              const done = catItems.filter(i => checked[i.id]).length
              return (
                <div key={cat.id} style={{ marginBottom:24 }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                    <div style={{ fontSize:15, fontWeight:700, color:'#0D3349' }}>{cat.emoji} {cat.label}</div>
                    <div style={{ fontSize:12, color:'#64748B' }}>{done}/{catItems.length}</div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {catItems.map(item => renderItem(item))}
                  </div>
                </div>
              )
            })}
            {/* 반입주의 섹션 - 전체 탭 맨 아래 */}
            {(() => {
              const dangerCat = categories.find(c => c.id === 'pack_danger')
              const visibleDangerItems = dangerItems.filter(i => !excluded[i.id])
              const yellowItems = visibleDangerItems.filter(i => !i.tips?.startsWith('🔴'))
              if (!dangerCat || !yellowItems.length) return null
              return (
                <div style={{ marginBottom:24 }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                    <div style={{ fontSize:15, fontWeight:700, color:'#D97706' }}>🟡 신고 필요 항목</div>
                    <div style={{ fontSize:12, color:'#64748B' }}>{yellowItems.filter(i => checked[i.id]).length}/{yellowItems.length}</div>
                  </div>
                  <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:10, padding:'8px 12px', marginBottom:10, fontSize:11, color:'#B91C1C', lineHeight:1.5 }}>
                    ⚠️ 미신고 적발 시 벌금 최소 AUD 6,260 · 애매하면 무조건 신고!
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {visibleDangerItems.filter(i => !i.tips?.startsWith('🔴')).map(item => renderItem(item, true))}
                  </div>
                </div>
              )
            })()}

          </>
        )}

        {/* 반입주의 탭 */}
        {filterTab === 'danger' && (
          <>
            {/* 공항 체크 버튼 */}
            <button onClick={() => setShowSimResult(true)} style={{
              width:'100%', height:44, borderRadius:12, border:'none',
              background:'linear-gradient(135deg, #DC2626, #B91C1C)',
              color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer',
              display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              marginBottom:10, fontFamily:ff, WebkitTapHighlightColor:'transparent',
            }}>
              ✈️ 지금 출국해도 괜찮을까? 공항 체크!
            </button>
            {/* 벌금 배너 */}
            <div style={{ background:'#FEF2F2', border:'1.5px solid #FECACA', borderRadius:12, padding:'10px 14px', display:'flex', alignItems:'flex-start', gap:8, marginBottom:14 }}>
              <span style={{ fontSize:16, flexShrink:0 }}>⚠️</span>
              <div>
                <div style={{ fontSize:12, fontWeight:700, color:'#DC2626', marginBottom:2 }}>미신고 적발 시 현장 벌금 최소 AUD 6,260 (약 570만원)</div>
                <div style={{ fontSize:11, color:'#B91C1C', lineHeight:1.5 }}>비자 취소 및 향후 입국 불이익 가능 · 애매하면 무조건 신고(Declare)!</div>
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {dangerItems.filter(i => !excluded[i.id] && i.tips?.startsWith('🔴')).map(item => renderItem(item, false))}
            </div>
          </>
        )}

        {/* 제외 탭 */}
        {filterTab === 'excluded' && (
          <>
            {excludedItems.length === 0 ? (
              <div style={{ textAlign:'center', padding:'60px 0', color:'#94A3B8' }}>
                <Icon icon="ph:trash" width={48} height={48} color="#CBD5E1" />
                <div style={{ fontSize:14, marginTop:12 }}>제외한 항목이 없어요</div>
                <div style={{ fontSize:12, marginTop:4, color:'#CBD5E1' }}>항목의 X 버튼으로 제외할 수 있어요</div>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {excludedItems.map(item => renderItem(item, false))}
              </div>
            )}
          </>
        )}
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
                <><span style={{ color:'#DC2626', fontWeight:700 }}>🔴 절대 금지 {redChecked.length}개</span>가 짐에 있어요!<br/>지금 당장 꺼내세요. 미신고 적발 시 벌금 AUD 6,260~</>
              ) : simStatus === 'warn' ? (
                <><span style={{ color:'#D97706', fontWeight:700 }}>🟡 신고 필요 {yellowChecked.length}개</span>가 있어요.<br/>입국 신고서 Food 항목에 체크하면 대부분 통과돼요!</>
              ) : (
                <>반입 금지 품목이 없어요. 즐거운 호주 여행 되세요! 🦘</>
              )}
            </div>
            {simStatus === 'danger' && redChecked.length > 0 && (
              <div style={{ background:'#FEF2F2', borderRadius:10, padding:'10px 14px', marginBottom:16, textAlign:'left' }}>
                {redChecked.map(item => <div key={item.id} style={{ fontSize:12, color:'#DC2626', fontWeight:600, padding:'3px 0' }}>• {item.label}</div>)}
              </div>
            )}
            {simStatus === 'warn' && yellowChecked.length > 0 && (
              <div style={{ background:'#FFFBEB', borderRadius:10, padding:'10px 14px', marginBottom:16, textAlign:'left' }}>
                {yellowChecked.map(item => <div key={item.id} style={{ fontSize:12, color:'#D97706', fontWeight:600, padding:'3px 0' }}>• {item.label}</div>)}
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
