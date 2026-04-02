// ─────────────────────────────────────────────
// ShoppingSheet.tsx
// src/components/ShoppingSheet.tsx
// ─────────────────────────────────────────────
import { useState } from 'react'
import { TripInfo } from '../store/state'
import { Icon } from '@iconify/react'
import MyShoppingView from '../pages/MyShoppingView'
import Shopping from '../pages/Shopping'

type View = 'mylist' | 'shopping'

type Props = {
  onClose: () => void
  trip?: TripInfo
}

export default function ShoppingSheet({ onClose, trip }: Props) {
  const [view, setView] = useState<View>('mylist')
  const [myList, setMyList] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('my-shopping-list') ?? '[]') } catch { return [] }
  })
  const [myChecked, setMyChecked] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem('my-shopping-checked') ?? '{}') } catch { return {} }
  })

  const handleMyListChange = (next: string[]) => {
    setMyList(next)
    try { localStorage.setItem('my-shopping-list', JSON.stringify(next)) } catch {}
  }

  const handleMyCheckedChange = (next: Record<string, boolean>) => {
    setMyChecked(next)
    try { localStorage.setItem('my-shopping-checked', JSON.stringify(next)) } catch {}
  }

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', backdropFilter:'blur(8px)', zIndex:800 }} />
      <div style={{
        position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)',
        width:'100%', maxWidth:430,
        background:'#ffffff', borderRadius:'20px 20px 0 0',
        maxHeight:'85vh', overflowY:'auto', zIndex:801,
        animation:'slideUpSheet 0.25s ease', boxShadow:'0 8px 32px rgba(0,0,0,0.20)',
        display:'flex', flexDirection:'column',
      }}>
        <style>{`
          @keyframes slideUpSheet {
            from { transform: translateX(-50%) translateY(100%); }
            to   { transform: translateX(-50%) translateY(0); }
          }
        `}</style>

        {/* 헤더 */}
        <div style={{ flexShrink:0, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 12px 0' }}>
          <div />
          <button onClick={onClose} style={{ width:28, height:28, borderRadius:'50%', background:'rgba(0,0,0,0.08)', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', WebkitTapHighlightColor:'transparent' }}>
            <Icon icon="ph:x" width={16} height={16} color="#0D3349" />
          </button>
        </div>

        {/* 내용 */}
        <div style={{ flex:1, overflowY:'auto' }}>
          {view === 'mylist' ? (
            <MyShoppingView
              myList={myList}
              myChecked={myChecked}
              onMyListChange={handleMyListChange}
              onMyCheckedChange={handleMyCheckedChange}
              onBack={() => setView('shopping')}
              onLanding={onClose}
              trip={trip}
            />
          ) : (
            <Shopping
              myList={myList}
              myChecked={myChecked}
              onMyListChange={handleMyListChange}
              onMyCheckedChange={handleMyCheckedChange}
              onGoToMyList={() => setView('mylist')}
            />
          )}
        </div>
      </div>
    </>
  )
}
