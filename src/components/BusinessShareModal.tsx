import { useState } from 'react'
import { Icon } from '@iconify/react'
import { Business, VOTE_TAGS } from '../lib/businessService'

type Props = {
  business: Business
  counts: Record<string, number>
  onClose: () => void
}

const ff = '"Pretendard",-apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif'
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
    // @ts-ignore
    const h2c = (await import('html2canvas')).default
    const canvas = await h2c(el, { scale: 3, backgroundColor: '#fff', useCORS: true })
    const blob: Blob = await new Promise(res => canvas.toBlob((b: Blob) => res(b!), 'image/png'))
    return blob
  }

  const handleSave = async () => {
    if (isIOS()) {
      // iOS는 저장 불가 → share sheet 바로 호출
      handleShare()
      return
    }
    setSaving(true)
    const blob = await capture()
    if (blob) {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `${name}.png`
      a.click(); URL.revokeObjectURL(url)
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
    <div style={{ position:'fixed', inset:0, zIndex:400, animation:'fadeIn 0.2s ease', fontFamily:ff }}>
      <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(10,20,40,0.6)' }}/>

      <div style={{ position:'relative', zIndex:1, overflowY:'auto', height:'100%', padding:'28px 16px 120px', display:'flex', flexDirection:'column', alignItems:'center' }}>
        {/* 닫기 */}
        <button onClick={onClose} style={{
          position:'sticky', top:0, alignSelf:'flex-end',
          width:32, height:32, borderRadius:'50%',
          background:'rgba(255,255,255,0.9)', border:'none',
          fontSize:16, color:'#5A7090', marginBottom:10, cursor:'pointer',
          display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow:'0 2px 8px rgba(30,77,131,0.12)',
        }}>✕</button>

        {/* 공유 카드 */}
        <div id="business-share-card" style={{ animation:'fadeInUp 0.3s ease', width:320, background:'#fff', borderRadius:16, overflow:'hidden', boxShadow:'0 8px 32px rgba(0,53,148,0.15)' }}>

          {/* 헤더 */}
          <div style={{ background:'linear-gradient(135deg,#002870,#003594)', padding:'20px 20px 16px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
              <div style={{ fontSize:18, fontWeight:900, color:'#fff', flex:1 }}>{name}</div>
              {is_featured && (
                <div style={{ background:'#FFCD00', color:'#002870', fontSize:10, fontWeight:800, borderRadius:20, padding:'3px 10px', flexShrink:0 }}>추천</div>
              )}
            </div>
            {fullAddress && (
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.75)' }}>📍 {fullAddress}</div>
            )}
            {tags && tags.length > 0 && (
              <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginTop:8 }}>
                {tags.map(tag => (
                  <span key={tag} style={{ background:'rgba(255,255,255,0.15)', color:'#fff', fontSize:10, fontWeight:700, borderRadius:6, padding:'2px 8px' }}>{tag}</span>
                ))}
              </div>
            )}
          </div>

          {/* 연락처 */}
          <div style={{ padding:'14px 20px', borderBottom:'1px solid #F1F5F9' }}>
            {description && <div style={{ fontSize:12, color:'#64748B', lineHeight:1.6, marginBottom:10 }}>{description}</div>}
            <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
              {phone && (
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ width:24, height:24, borderRadius:6, background:'rgba(0,53,148,0.08)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <Icon icon="ph:phone" width={13} height={13} color="#003594" />
                  </div>
                  <span style={{ fontSize:12, color:'#1E293B', fontWeight:600 }}>{phone}</span>
                </div>
              )}
              {kakao && (
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ width:24, height:24, borderRadius:6, background:'#FEF9C3', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <Icon icon="ph:chat-circle" width={13} height={13} color="#854D0E" />
                  </div>
                  <span style={{ fontSize:12, color:'#1E293B', fontWeight:600 }}>카카오톡: {kakao}</span>
                </div>
              )}
              {website && (
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ width:24, height:24, borderRadius:6, background:'rgba(0,53,148,0.08)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <Icon icon="ph:globe" width={13} height={13} color="#003594" />
                  </div>
                  <span style={{ fontSize:12, color:'#003594', fontWeight:600 }}>{website}</span>
                </div>
              )}
            </div>
          </div>

          {/* 한줄평 바 차트 */}
          {topVotes.length > 0 && (
            <div style={{ padding:'14px 20px', borderBottom:'1px solid #F1F5F9' }}>
              <div style={{ fontSize:11, fontWeight:800, color:'#94A3B8', marginBottom:10, letterSpacing:0.5 }}>한줄평</div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {topVotes.map(([tag, count]) => (
                  <div key={tag}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                      <span style={{ fontSize:11, fontWeight:600, color:'#1E293B', display:'flex', alignItems:'center', gap:4 }}>
                        <Icon icon="ph:thumbs-up" width={11} height={11} color="#94A3B8" />{tag}
                      </span>
                      <span style={{ fontSize:11, fontWeight:700, color:'#94A3B8' }}>{count}</span>
                    </div>
                    <div style={{ height:6, borderRadius:3, background:'#F1F5F9' }}>
                      <div style={{ height:'100%', borderRadius:3, width:`${Math.round((count/maxCount)*100)}%`, background:'#FCA5A5' }}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 푸터 홍보 */}
          <div style={{ background:'linear-gradient(135deg,#002870,#003594)', padding:'12px 20px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <div style={{ fontSize:13, fontWeight:900, color:'#FFCD00', letterSpacing:1 }}>HOJUGAJA</div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.7)', marginTop:1 }}>무료 호주 버킷리스트</div>
            </div>
            <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.9)' }}>hojugaja.com</div>
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
