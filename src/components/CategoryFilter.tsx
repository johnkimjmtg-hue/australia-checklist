import { Icon } from '@iconify/react'
import { CATEGORIES } from '../data/businesses'

type Props = { selected: string; onChange: (id: string) => void }

const CAT_ICONS: Record<string, string> = {
  all:         'ph:squares-four',
  realestate:  'ph:house-line',
  lawyer:      'ph:scales',
  accounting:  'ph:receipt',
  insurance:   'ph:shield-check',
  immigration: 'ph:globe',
  academy:     'ph:graduation-cap',
  telecom:     'ph:device-mobile',
  travel:      'ph:airplane',
  gp:          'ph:first-aid-kit',
  dental:      'ph:tooth',
  oriental:    'ph:leaf',
  pharmacy:    'ph:pill',
  restaurant:  'ph:fork-knife',
  cafe:        'ph:coffee',
  mart:        'ph:shopping-cart',
  beauty:      'ph:scissors',
  moving:      'ph:package',
  handyman:    'ph:wrench',
}

export default function CategoryFilter({ selected, onChange }: Props) {
  return (
    <div style={{ display:'flex', gap:6, overflowX:'auto', paddingBottom:2 }}>
      {CATEGORIES.map(cat => {
        const isActive = selected === cat.id
        return (
          <button key={cat.id} onClick={() => onChange(cat.id)} style={{
            display:'flex', flexDirection:'column', alignItems:'center', gap:3,
            padding:'8px 10px', borderRadius:10, flexShrink:0,
            background: isActive ? '#1B6EF3' : '#fff',
            color: isActive ? '#fff' : '#64748B',
            border: isActive ? 'none' : '1px solid #E2E8F0',
            fontSize:10, fontWeight:700, cursor:'pointer',
            boxShadow: isActive ? '0 2px 8px rgba(27,110,243,0.20)' : '0 1px 3px rgba(0,0,0,0.05)',
            transition:'all 0.15s',
          }}>
            <Icon icon={CAT_ICONS[cat.id] ?? 'ph:star'} width={18} height={18}
              color={isActive ? '#fff' : '#94A3B8'} />
            <span style={{ fontSize:10, textAlign:'center', wordBreak:'keep-all', lineHeight:1.2 }}>{cat.label}</span>
          </button>
        )
      })}
    </div>
  )
}
