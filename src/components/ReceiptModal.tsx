import { useState } from 'react'
import BucketSharePaper from './BucketSharePaper'
import { downloadPng, sharePng } from '../utils/capture'
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

export default function ReceiptModal({ state, trip, issuedAt, achieved, onClose, onReset }: Props) {
  const [saving, setSaving]   = useState(false)
  const [sharing, setSharing] = useState(false)

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
        <button onClick={async () => {
          setSaving(true)
          if (isIOS()) {
            const ok = await sharePng()
            if (!ok) alert('공유가 지원되지 않는 환경입니다.\n이미지를 저장 후 직접 공유해주세요.')
          } else {
            await downloadPng()
          }
          setSaving(false)
        }} disabled={saving} style={{
          flex:1, height:46, borderRadius:10, cursor:'pointer',
          border:'1px solid rgba(30,77,131,0.15)', background:'#fff',
          fontWeight:700, fontSize:13, color:'#1E4D83',
        }}>{saving ? '저장 중...' : '이미지 저장'}</button>
        <button onClick={async () => {
          setSharing(true)
          const ok = await sharePng()
          if (!ok) alert('공유가 지원되지 않는 환경입니다.\n이미지를 저장 후 직접 공유해주세요.')
          setSharing(false)
        }} disabled={sharing} style={{
          flex:1, height:46, borderRadius:10, cursor:'pointer',
          border:'none', background:'linear-gradient(160deg,#3A7FCC,#1E4D83)',
          fontWeight:700, fontSize:13, color:'#fff',
          boxShadow:'0 4px 14px rgba(30,77,131,0.28)',
        }}>{sharing ? '공유 중...' : '공유하기'}</button>
      </div>
    </div>
  )
}
