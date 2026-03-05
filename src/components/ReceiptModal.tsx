import { useState } from 'react'
import ReceiptPaper from './ReceiptPaper'
import { downloadPng, sharePng } from '../utils/capture'
import { AppState, TripInfo } from '../store/state'

type Props = { state: AppState; trip: TripInfo; issuedAt: string; onClose: () => void; onReset: () => void }

export default function ReceiptModal({ state, trip, issuedAt, onClose, onReset }: Props) {
  const [saving, setSaving]   = useState(false)
  const [sharing, setSharing] = useState(false)

  return (
    <div style={{ position:'fixed', inset:0, zIndex:400, animation:'fadeIn 0.2s ease' }}>
      {/* backdrop */}
      <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(17,24,39,0.55)' }} />

      {/* scroll area */}
      <div style={{ position:'relative', zIndex:1, overflowY:'auto', height:'100%', padding:'32px 20px 130px', display:'flex', flexDirection:'column', alignItems:'center' }}>
        <button onClick={onClose}
          style={{
            position:'sticky', top:0, alignSelf:'flex-end',
            width:36, height:36, borderRadius:'50%',
            background:'rgba(255,255,255,0.92)', border:'none',
            fontSize:18, color:'#555', marginBottom:12, cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:'0 2px 8px rgba(48,79,180,0.12)',
          }}>✕</button>

        <div style={{ animation:'scaleIn 0.3s ease' }}>
          <ReceiptPaper state={state} trip={trip} issuedAt={issuedAt} />
        </div>
      </div>

      {/* Bottom action bar */}
      <div style={{
        position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)',
        width:'100%', maxWidth:430,
        padding:'12px 16px 28px',
        background:'rgba(240,244,255,0.97)',
        backdropFilter:'blur(10px)',
        boxShadow:'0 -2px 20px rgba(48,79,180,0.08)',
        borderTop:'1px solid rgba(48,79,180,0.08)',
        display:'flex', gap:10, zIndex:2,
      }}>
        <button onClick={onReset} title="초기화"
          style={{
            width:52, height:52, borderRadius:12, cursor:'pointer',
            border:'1px solid rgba(48,79,180,0.15)', background:'#fff',
            fontSize:20, display:'flex', alignItems:'center', justifyContent:'center',
            flexShrink:0, color:'#6B7280',
            boxShadow:'0 2px 8px rgba(48,79,180,0.06)',
          }}>↻</button>

        <button
          onClick={async () => { setSaving(true); await downloadPng(); setSaving(false) }}
          disabled={saving}
          style={{
            flex:1, height:52, borderRadius:12, cursor:'pointer',
            border:'1px solid rgba(48,79,180,0.15)', background:'#fff',
            fontWeight:600, fontSize:15, color:'#304FB4',
            boxShadow:'0 2px 8px rgba(48,79,180,0.06)',
          }}>{saving ? '저장 중...' : '이미지 저장'}</button>

        <button
          onClick={async () => {
            setSharing(true)
            const ok = await sharePng()
            if (!ok) alert('공유가 지원되지 않는 환경입니다.\n이미지를 저장 후 직접 공유해주세요.')
            setSharing(false)
          }}
          disabled={sharing}
          style={{
            flex:1, height:52, borderRadius:12, cursor:'pointer',
            border:'none', background:'linear-gradient(180deg,#4F6BDC,#304FB4)',
            fontWeight:700, fontSize:15, color:'#fff',
            boxShadow:'0 4px 14px rgba(48,79,180,0.30)',
          }}>{sharing ? '공유 중...' : '공유하기'}</button>
      </div>
    </div>
  )
}
