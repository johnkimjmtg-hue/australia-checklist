import { useState, useEffect, useRef } from 'react'
import { Icon } from '@iconify/react'
import { Business } from '../lib/businessService'

type Props = { business: Business; onClose: () => void }

const ff = '-apple-system,"Apple SD Gothic Neo","Noto Sans KR","Malgun Gothic",sans-serif'

export default function BusinessShareModal({ business, onClose }: Props) {
  const [saving, setSaving]   = useState(false)
  const [sharing, setSharing] = useState(false)
  const [ready, setReady]     = useState(false)
  const blobRef = useRef<Blob | null>(null)

  const { name, description, phone, website, kakao, address, city, is_featured, tags } = business
  const fullAddress = [address, city].filter(Boolean).join(', ')

  const capture = async () => {
    const el = document.getElementById('business-share-card')
    if (!el) return null
    await document.fonts.ready
    // @ts-ignore
    const h2c = (await import('html2canvas')).default
    const canvas = await h2c(el, {
      scale: 3, backgroundColor: '#E8EDF3',
      useCORS: true, allowTaint: true, logging: false,
      onclone: (clonedDoc: Document) => {
        const clonedEl = clonedDoc.getElementById('business-share-card')
        if (clonedEl) (clonedEl as HTMLElement).style.fontFamily = ff
      }
    })
    const blob: Blob = await new Promise(res => canvas.toBlob((b: Blob) => res(b!), 'image/png'))
    return blob
  }

  // 모달 열리면 미리 캡처
  useEffect(() => {
    const timer = setTimeout(async () => {
      const blob = await capture()
      blobRef.current = blob
      setReady(true)
    }, 400)
    return () => clearTimeout(timer)
  }, [])

  const handleSave = async () => {
    setSaving(true)
    const blob = blobRef.current ?? await capture()
    if (blob) {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `${name}.png`; a.click(); URL.revokeObjectURL(url)
    }
    setSaving(false)
  }

  const handleShare = async () => {
    if (!blobRef.current) return
    setSharing(true)
    try {
      const file = new File([blobRef.current], `${name}.png`, { type: 'image/png' })
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          text: `호주 여행정보 사이트 👉 https://hojugaja.com`,
        })
      } else if (navigator.share) {
        await navigator.share({ title: name, url: 'https://hojugaja.com' })
      } else {
        await handleSave()
      }
    } catch {}
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
          width:320, background:'#e8e8e8', padding:'12px',
          borderRadius:20, fontFamily:ff,
        }}>

          {/* 업체 정보 카드 */}
          <div style={{ background:'#fff', borderRadius:14, overflow:'hidden', marginBottom:8, boxShadow:'0 2px 12px rgba(0,0,0,0.08)' }}>

            {/* 업체명 + 태그 */}
            <div style={{ padding:'16px 16px 12px', borderBottom:'1px solid #F1F5F9' }}>
              <div style={{ fontSize:18, fontWeight:800, color:'#0F172A', lineHeight:1.3, marginBottom:8 }}>{name}</div>
              {tags && tags.length > 0 && (
                <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                  {tags.map(tag => (
                    <span key={tag} style={{ background:'#EFF6FF', color:'#1B6EF3', fontSize:10, fontWeight:700, borderRadius:6, padding:'3px 8px' }}>{tag}</span>
                  ))}
                </div>
              )}
            </div>

            {/* 설명 + 연락처 */}
            <div style={{ padding:'12px 16px' }}>
              {description && (
                <div style={{ fontSize:12, color:'#475569', lineHeight:1.7, marginBottom:12 }}>{description}</div>
              )}
              <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                {fullAddress && (
                  <div style={{ display:'flex', alignItems:'flex-start', gap:8 }}>
                    <Icon icon="ph:map-pin-simple" width={14} height={14} color="#94A3B8" style={{ flexShrink:0, marginTop:2 }} />
                    <span style={{ fontSize:12, color:'#475569', lineHeight:1.5 }}>{fullAddress}</span>
                  </div>
                )}
                {phone && (
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <Icon icon="ph:phone" width={14} height={14} color="#94A3B8" />
                    <span style={{ fontSize:12, color:'#1E293B', fontWeight:600 }}>{phone}</span>
                  </div>
                )}
                {kakao && (
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <Icon icon="ph:chat-circle" width={14} height={14} color="#94A3B8" />
                    <span style={{ fontSize:12, color:'#1E293B', fontWeight:600 }}>카카오톡: {kakao}</span>
                  </div>
                )}
                {website && (
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <Icon icon="ph:globe" width={14} height={14} color="#94A3B8" />
                    <span style={{ fontSize:12, color:'#1B6EF3', fontWeight:600 }}>{website}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 홍보 카드 */}
          <div style={{ background:'linear-gradient(135deg, #1B6EF3, #1565C0)', borderRadius:14, padding:'12px 18px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <div style={{ fontSize:12, fontWeight:800, color:'#fff', letterSpacing:-0.3 }}>호주가자</div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.7)', marginTop:2, display:'flex', alignItems:'center', gap:4 }}>
                호주 여행 정보 사이트 <Icon icon="mdi:kangaroo" width={13} height={13} color="#fff" />
              </div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#FFCD00' }}>www.hojugaja.com</div>
              <div style={{ fontSize:9, color:'rgba(255,255,255,0.5)', marginTop:2 }}>나만의 버킷리스트를 만들어보세요</div>
            </div>
          </div>

        </div>
      </div>

      {/* 하단 버튼 바 */}
      <div style={{
        position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)',
        width:'100%', maxWidth:390, padding:'10px 14px 26px',
        background:'rgba(232,237,243,0.97)', backdropFilter:'blur(12px)',
        borderTop:'1.5px solid #D1D9E3', boxShadow:'0 -4px 16px rgba(0,0,0,0.08)',
        display:'flex', gap:8, zIndex:2,
      }}>
        <button onClick={handleSave} disabled={saving || sharing || !ready} style={{
          flex:1, height:46, borderRadius:12, cursor: ready ? 'pointer' : 'default',
          border:'1.5px solid #D1D9E3', background:'#fff',
          fontWeight:700, fontSize:13, color:'#1B6EF3', fontFamily:ff,
          boxShadow:'0 2px 8px rgba(0,0,0,0.07)',
          opacity: ready ? 1 : 0.5,
        }}>{saving ? '저장 중...' : !ready ? '준비 중...' : '이미지 저장'}</button>
        <button onClick={handleShare} disabled={saving || sharing || !ready} style={{
          flex:1, height:46, borderRadius:12, cursor: ready ? 'pointer' : 'default',
          border:'none', background:'linear-gradient(160deg,#4B8EF5,#1B6EF3)',
          fontWeight:700, fontSize:13, color:'#fff', fontFamily:ff,
          boxShadow:'0 4px 14px rgba(27,110,243,0.35)',
          opacity: ready ? 1 : 0.5,
        }}>{sharing ? '공유 중...' : !ready ? '준비 중...' : '공유하기'}</button>
      </div>
    </div>
  )
}
