import { useState } from 'react'
import { Icon } from '@iconify/react'
import { Business, VOTE_TAGS } from '../lib/businessService'

type Props = { business: Business; counts: Record<string, number>; onClose: () => void }

const ff = '-apple-system,"Apple SD Gothic Neo","Noto Sans KR","Malgun Gothic",sans-serif'
const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent)

export default function BusinessShareModal({ business, counts, onClose }: Props) {
  const [saving, setSaving]   = useState(false)
  const [sharing, setSharing] = useState(false)

  const { name, description, phone, website, kakao, address, city, is_featured, tags } = business
  const fullAddress = [address, city].filter(Boolean).join(', ')
  const maxCount    = Math.max(...VOTE_TAGS.map(t => counts[t] ?? 0), 1)
  const topVotes    = VOTE_TAGS
    .map(t => [t, counts[t] ?? 0] as [string, number])
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])

  const capture = async () => {
    const el = document.getElementById('business-share-card')
    if (!el) return null
    await document.fonts.ready
    // @ts-ignore
    const h2c = (await import('html2canvas')).default
    const canvas = await h2c(el, {
      scale: 3, backgroundColor: '#F1F5F9',
      useCORS: true, allowTaint: true, logging: false,
      onclone: (clonedDoc: Document) => {
        const clonedEl = clonedDoc.getElementById('business-share-card')
        if (clonedEl) (clonedEl as HTMLElement).style.fontFamily = ff
      }
    })
    const blob: Blob = await new Promise(res => canvas.toBlob((b: Blob) => res(b!), 'image/png'))
    return blob
  }

  const handleSave = async () => {
    if (isIOS()) { handleShare(); return }
    setSaving(true)
    const blob = await capture()
    if (blob) {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `${name}.png`; a.click(); URL.revokeObjectURL(url)
    }
    setSaving(false)
  }

  const handleShare = async () => {
    setSharing(true)
    const blob = await capture()
    if (blob) {
      try {
        await navigator.share({ files: [new File([blob], `${name}.png`, { type: 'image/png' })] })
      } catch {
        alert('공유가 지원되지 않는 환경입니다.\n이미지를 저장 후 직접 공유해주세요.')
      }
    }
    setSharing(false)
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:400, fontFamily:ff }}>
      <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(10,20,40,0.6)' }}/>
      <div style={{ position:'relative', zIndex:1, overflowY:'auto', height:'100%', padding:'28px 16px 120px', display:'flex', flexDirection:'column', alignItems:'center' }}>

        {/* 닫기 */}
        <button onClick={onClose} style={{
          position:'sticky', top:0, alignSelf:'flex-end',
          width:32, height:32, borderRadius:'50%',
          background:'rgba(255,255,255,0.9)', border:'none',
          fontSize:16, color:'#5A7090', marginBottom:10, cursor:'pointer',
          display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow:'0 2px 8px rgba(0,0,0,0.15)',
        }}>✕</button>

        {/* ── 공유 카드 ── */}
        <div id="business-share-card" style={{
          width:320, background:'#F1F5F9', padding:'12px',
          borderRadius:20, fontFamily:ff,
        }}>

          {/* 업체 정보 카드 */}
          <div style={{ background:'#fff', borderRadius:14, overflow:'hidden', marginBottom:8, boxShadow:'0 2px 8px rgba(0,53,148,0.07)' }}>

            {/* 업체명 헤더 */}
            <div style={{ padding:'18px 18px 14px', borderBottom:'1px solid #F1F5F9' }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom: fullAddress ? 6 : 0 }}>
                <div style={{ fontSize:20, fontWeight:900, color:'#0F172A', flex:1, lineHeight:1.2 }}>{name}</div>
                {is_featured && (
                  <div style={{ background:'#003594', color:'#FFCD00', fontSize:10, fontWeight:800, borderRadius:20, padding:'4px 10px', flexShrink:0, marginLeft:8, marginTop:2 }}>추천</div>
                )}
              </div>
              {fullAddress && (
                <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom: tags?.length ? 10 : 0 }}>
                  <Icon icon="ph:map-pin-simple" width={13} height={13} color="#94A3B8" />
                  <span style={{ fontSize:12, color:'#64748B', fontWeight:500 }}>{fullAddress}</span>
                </div>
              )}
              {tags && tags.length > 0 && (
                <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                  {tags.map(tag => (
                    <span key={tag} style={{ background:'#EFF6FF', color:'#003594', fontSize:10, fontWeight:700, borderRadius:6, padding:'3px 8px' }}>{tag}</span>
                  ))}
                </div>
              )}
            </div>

            {/* 설명 + 연락처 */}
            <div style={{ padding:'14px 18px' }}>
              {description && (
                <div style={{ fontSize:12, color:'#475569', lineHeight:1.7, marginBottom:12 }}>{description}</div>
              )}
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {phone && (
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:26, height:26, borderRadius:7, background:'#F1F5F9', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <Icon icon="ph:phone" width={13} height={13} color="#64748B" />
                    </div>
                    <span style={{ fontSize:13, color:'#1E293B', fontWeight:600 }}>{phone}</span>
                  </div>
                )}
                {kakao && (
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:26, height:26, borderRadius:7, background:'#F1F5F9', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <Icon icon="ph:chat-circle" width={13} height={13} color="#64748B" />
                    </div>
                    <span style={{ fontSize:13, color:'#1E293B', fontWeight:600 }}>카카오톡: {kakao}</span>
                  </div>
                )}
                {website && (
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:26, height:26, borderRadius:7, background:'#F1F5F9', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <Icon icon="ph:globe" width={13} height={13} color="#64748B" />
                    </div>
                    <span style={{ fontSize:13, color:'#003594', fontWeight:600 }}>{website}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 한줄평 카드 */}
          {topVotes.length > 0 && (
            <div style={{ background:'#fff', borderRadius:14, padding:'14px 18px', marginBottom:8, boxShadow:'0 2px 8px rgba(0,53,148,0.07)' }}>
              <div style={{ fontSize:11, fontWeight:800, color:'#94A3B8', marginBottom:10, letterSpacing:0.5 }}>한줄평</div>
              <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
                {topVotes.map(([tag, count]) => (
                  <div key={tag}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                      <span style={{ fontSize:12, fontWeight:600, color:'#334155', display:'flex', alignItems:'center', gap:5 }}>
                        <Icon icon="ph:thumbs-up" width={12} height={12} color="#94A3B8" />{tag}
                      </span>
                      <span style={{ fontSize:11, fontWeight:700, color:'#94A3B8' }}>{count}</span>
                    </div>
                    <div style={{ height:7, borderRadius:4, background:'#F1F5F9' }}>
                      <div style={{ height:'100%', borderRadius:4, width:`${Math.round((count/maxCount)*100)}%`, background:'#FCA5A5' }}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 홍보 카드 */}
          <div style={{ background:'#003594', borderRadius:14, padding:'12px 18px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <div style={{ fontSize:15, fontWeight:900, color:'#FFCD00', letterSpacing:0.5 }}>호주가자</div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.7)', marginTop:2 }}>무료 호주 버킷리스트</div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:12, fontWeight:700, color:'#fff' }}>hojugaja.com</div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.6)', marginTop:2 }}>나만의 버킷리스트를 만들어보세요</div>
            </div>
          </div>

        </div>
      </div>

      {/* 하단 버튼 바 */}
      <div style={{
        position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)',
        width:'100%', maxWidth:390, padding:'10px 14px 26px',
        background:'rgba(244,247,251,0.97)', backdropFilter:'blur(12px)',
        borderTop:'1px solid rgba(30,77,131,0.08)',
        display:'flex', gap:8, zIndex:2,
      }}>
        <button onClick={handleSave} disabled={saving || sharing} style={{
          flex:1, height:46, borderRadius:10, cursor:'pointer',
          border:'1px solid rgba(30,77,131,0.15)', background:'#fff',
          fontWeight:700, fontSize:13, color:'#1E4D83', fontFamily:ff,
        }}>{saving ? '저장 중...' : '이미지 저장'}</button>
        <button onClick={handleShare} disabled={saving || sharing} style={{
          flex:1, height:46, borderRadius:10, cursor:'pointer',
          border:'none', background:'linear-gradient(160deg,#3A7FCC,#1E4D83)',
          fontWeight:700, fontSize:13, color:'#fff', fontFamily:ff,
          boxShadow:'0 4px 14px rgba(30,77,131,0.28)',
        }}>{sharing ? '공유 중...' : '공유하기'}</button>
      </div>
    </div>
  )
}
