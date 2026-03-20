import { useState, useEffect, useRef } from 'react'
import BucketSharePaper from './BucketSharePaper'
import { captureBlob, downloadPng } from '../utils/capture'
import { AppState, TripInfo } from '../store/state'

type Props = {
  state: AppState
  trip: TripInfo
  issuedAt: string
  achieved: Record<string,boolean>
  dbItems?: any[]
  onClose: () => void
  onReset: () => void
}

const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent)

export default function ReceiptModal({ state, trip, issuedAt, achieved, dbItems, onClose, onReset }: Props) {
  const [saving, setSaving]     = useState(false)
  const [sharing, setSharing]   = useState(false)
  const [ready, setReady]       = useState(false)
  const blobRef = useRef<Blob | null>(null)

  // 모달 열리면 미리 캡처
  useEffect(() => {
    const timer = setTimeout(async () => {
      const blob = await captureBlob()
      blobRef.current = blob
      setReady(true)
    }, 400) // 렌더링 완료 후 캡처
    return () => clearTimeout(timer)
  }, [])

  return (
    <div style={{ position:'fixed', inset:0, zIndex:400, animation:'fadeIn 0.2s ease' }}>
      <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(10,20,40,0.6)' }}/>
      <div style={{ position:'relative', zIndex:1, overflowY:'auto', height:'100%', padding:'28px 16px 120px', display:'flex', flexDirection:'column', alignItems:'center' }}>
        <button onClick={onClose} style={{
          position:'sticky', top:0, alignSelf:'flex-end',
          width:32, height:32, borderRadius:'50%',
          background:'rgba(255,255,255,0.9)', border:'none',
          fontSize:16, color:'#5A7090', marginBottom:10, cursor:'pointer',
          display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow:'0 2px 8px rgba(27,110,243,0.12)',
        }}>✕</button>
        <div style={{ animation:'fadeInUp 0.3s ease' }}>
          <BucketSharePaper state={state} trip={trip} achieved={achieved} dbItems={dbItems} />
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{
        position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)',
        width:'100%', maxWidth:390, padding:'10px 14px 26px',
        background:'rgba(232,237,243,0.97)', backdropFilter:'blur(12px)',
        borderTop:'1.5px solid #D1D9E3', boxShadow:'0 -4px 16px rgba(0,0,0,0.08)',
        display:'flex', gap:8, zIndex:2,
      }}>
        <button onClick={async () => {
          setSaving(true)
          await downloadPng()
          setSaving(false)
        }} disabled={saving || !ready} style={{
          flex:1, height:46, borderRadius:12, cursor: ready ? 'pointer' : 'default',
          border:'1.5px solid #D1D9E3', background:'#fff',
          fontWeight:700, fontSize:13, color:'#1B6EF3',
          boxShadow:'0 2px 8px rgba(0,0,0,0.07)',
          opacity: ready ? 1 : 0.5,
        }}>{saving ? '저장 중...' : !ready ? '준비 중...' : '이미지 저장'}</button>

        <button onClick={async () => {
          if (!blobRef.current) return
          setSharing(true)
          try {
            // 미리 만들어둔 blob으로 즉시 공유 — 제스처 컨텍스트 유지
            if (navigator.share && navigator.canShare?.({ files: [new File([blobRef.current], 'test.png', { type:'image/png' })] })) {
              await navigator.share({ files: [new File([blobRef.current], 'korea-receipt.png', { type: 'image/png' })] })
            } else if (navigator.share) {
              // 파일 공유 미지원 시 URL로 대체
              await navigator.share({ title: '호주 버킷리스트', url: 'https://hojugaja.com' })
            } else {
              // 공유 미지원 시 이미지 저장
              await downloadPng()
            }
          } catch {}
          setSharing(false)
        }} disabled={sharing || !ready} style={{
          flex:1, height:46, borderRadius:12, cursor: ready ? 'pointer' : 'default',
          border:'none', background:'linear-gradient(160deg,#4B8EF5,#1B6EF3)',
          fontWeight:700, fontSize:13, color:'#fff',
          boxShadow:'0 4px 14px rgba(27,110,243,0.35)',
          opacity: ready ? 1 : 0.5,
        }}>{sharing ? '공유 중...' : !ready ? '준비 중...' : '공유하기'}</button>
      </div>
    </div>
  )
}
