import { CATEGORIES } from '../data/businesses'

type Props = {
  selected: string
  onChange: (id: string) => void
}

export default function CategoryFilter({ selected, onChange }: Props) {
  return (
    <div style={{ padding: '8px 0 4px' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 6,
      }}>
        {CATEGORIES.map(cat => {
          const isActive = selected === cat.id
          return (
            <button
              key={cat.id}
              onClick={() => onChange(cat.id)}
              style={{
                background: isActive ? 'linear-gradient(135deg,#3A7FCC,#1E4D83)' : 'rgba(200,218,248,0.4)',
                color: isActive ? '#fff' : '#3a5fa5',
                border: 'none', borderRadius: 10,
                padding: '8px 4px',
                fontSize: 11, fontWeight: 800,
                cursor: 'pointer',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 3,
                boxShadow: isActive ? '0 2px 8px rgba(30,77,131,0.20)' : 'none',
                transition: 'all 0.15s',
                lineHeight: 1.3,
              }}
            >
              <span style={{ fontSize: 18 }}>{cat.emoji}</span>
              <span style={{ fontSize: 10, textAlign: 'center', wordBreak: 'keep-all' }}>{cat.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
