import { useState, useEffect, useRef } from 'react'
import BucketSharePaper from './BucketSharePaper'
import { downloadPng } from '../utils/capture'
import { AppState, TripInfo } from '../store/state'

type Props = {
  state: AppState
  trip: TripInfo
  issuedAt: string
  achieved: Record<string,boolean>
  onClose: () => void
  onReset: () => void
}

const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent)

// 영수증 렌더 후 blob 미리 생성
async function buildBlob(): Promise<File | null> {
  const el = document.getElementById('receipt-root')
  if (!el) return null
  // @ts-ignore
  const h2c = (await import('html2canvas')).default
  const prev = (el as HTMLElement).style.borderRadius;
  (el as HTMLElement).style.borderRadius = '0'
  const canvas = await h2c(el, { scale: 2, backgroundColor: '#fff', useCORS: true });
  (el as HTMLElement).style.borderRadius = prev
  const blob: Blob = await new Promise(res => canvas.toBlob((b: Blob) => res(b), 'image/png'))
  return new File([blob], 'receipt.png', { type: 'image/png' })
}

export default function ReceiptModal({ state, trip, issuedAt, achieved, onClose, onReset }: Props) {
  const [saving, setSaving]   = useState(false)
  const [sharing, setSharing] = useState(false)
  const fileRef = useRef<File | null>(null)
  const [ready, setReady] = useState(false)

  // 영수증 렌더 후 500ms뒤 blob 미리 생성 (렌더 완료 기다림)
  useEffect(() => {
    const timer = setTimeout(async () => {
      fileRef.current = await buildBlob()
      setReady(true)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  async function handleSave() {
    if (isIOS()) {
      // iOS: 미리 만든 file로 즉시 share → share sheet에서 "이미지 저장" 가능
      if (!fileRef.current) {
        // 아직 준비 안됐으면 그때 생성 (fallback)
        setSaving(true)
        fileRef.current = await buildBlob()
        setSaving(false)
      }
      if (!fileRef.current || !navigator.share) return
      try {
        // 이 시점은 유저 클릭 직후 — iOS가 제스처 인식
        await navigator.share({ files: [fileRef.current] })
      } catch {}
    } else {
      setSaving(true)
      await downloadPng()
      setSaving(false)
    }
  }

  async function handleShare() {
    setSharing(true)
    if (!navigator.share) {
      alert('공유가 지원되지 않는 환경입니다.\n이미지를 저장 후 직접 공유해주세요.')
      setSharing(false)
      return
    }
    const file = fileRef.current ?? await buildBlob()
    if (!file) { setSharing(false); return }
    try {
      await navigator.share({ files: [file] })
    } catch {}
    setSharing(false)
  }

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
          boxShadow:'0 2px 8px rgba(30,77,131,0.12)',
        }}>✕</button>
        <div style={{ animation:'fadeInUp 0.3s ease' }}>
          <BucketSharePaper state={state} trip={trip} achieved={achieved} />
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{
        position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)',
        width:'100%', maxWidth:390, padding:'10px 14px 26px',
        background:'rgba(244,247,251,0.97)', backdropFilter:'blur(12px)',
        borderTop:'1px solid rgba(30,77,131,0.08)',
        display:'flex', gap:8, zIndex:2,
      }}>
        <button onClick={handleSave} disabled={saving} style={{
          flex:1, height:46, borderRadius:10, cursor:'pointer',
          border:'1px solid rgba(30,77,131,0.15)', background:'#fff',
          fontWeight:700, fontSize:13, color:'#1E4D83',
          opacity: saving ? 0.6 : 1,
        }}>{saving ? '준비 중...' : '이미지 저장'}</button>
        <button onClick={handleShare} disabled={sharing} style={{
          flex:1, height:46, borderRadius:10, cursor:'pointer',
          border:'none', background:'linear-gradient(160deg,#3A7FCC,#1E4D83)',
          fontWeight:700, fontSize:13, color:'#fff',
          boxShadow:'0 4px 14px rgba(30,77,131,0.28)',
          opacity: sharing ? 0.6 : 1,
        }}>{sharing ? '공유 중...' : '공유하기'}</button>
      </div>
    </div>
  )
}
