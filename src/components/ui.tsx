// ─────────────────────────────────────────────
// 호주가자 Common Components  (src/components/ui.tsx)
// ─────────────────────────────────────────────
import { colors, font, radius, spacing, shadow, transition, T } from '../styles/tokens'

// ── AppHeader ────────────────────────────────
type AppHeaderProps = {
  title: string
  onBack?: () => void
  right?: React.ReactNode
  subtitle?: string
}
export function AppHeader({ title, onBack, right, subtitle }: AppHeaderProps) {
  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: colors.bgCard,
      borderBottom: `1px solid ${colors.border}`,
      padding: `0 ${spacing[4]}px`,
      height: 56,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], flex: 1, minWidth: 0 }}>
        {onBack && (
          <button onClick={onBack} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: spacing[1], margin: `-${spacing[1]}px`,
            display: 'flex', alignItems: 'center',
            WebkitTapHighlightColor: 'transparent',
          }}>
            <svg width={20} height={20} viewBox="0 0 20 20" fill="none">
              <path d="M12.5 15L7.5 10L12.5 5" stroke={colors.textPrimary} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
        <div style={{ minWidth: 0 }}>
          <div style={{ ...T.h4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
          {subtitle && <div style={{ ...T.xs, marginTop: 1 }}>{subtitle}</div>}
        </div>
      </div>
      {right && <div style={{ flexShrink: 0, marginLeft: spacing[2] }}>{right}</div>}
    </div>
  )
}

// ── Card ─────────────────────────────────────
type CardProps = {
  children: React.ReactNode
  onClick?: () => void
  padding?: number
  style?: React.CSSProperties
}
export function Card({ children, onClick, padding = spacing[4], style }: CardProps) {
  return (
    <div
      onClick={onClick}
      style={{
        ...T.card,
        padding,
        cursor: onClick ? 'pointer' : 'default',
        transition: onClick ? transition.fast : undefined,
        WebkitTapHighlightColor: 'transparent',
        ...style,
      }}
      onTouchStart={onClick ? e => { (e.currentTarget as HTMLDivElement).style.transform = 'scale(0.98)'; (e.currentTarget as HTMLDivElement).style.opacity = '0.85' } : undefined}
      onTouchEnd={onClick ? e => { (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)'; (e.currentTarget as HTMLDivElement).style.opacity = '1' } : undefined}
    >
      {children}
    </div>
  )
}

// ── Button ────────────────────────────────────
type ButtonVariant = 'primary' | 'ghost' | 'danger' | 'light'
type ButtonProps = {
  children: React.ReactNode
  onClick?: () => void
  variant?: ButtonVariant
  disabled?: boolean
  fullWidth?: boolean
  size?: 'sm' | 'md' | 'lg'
  icon?: React.ReactNode
}
const BTN_STYLES: Record<ButtonVariant, React.CSSProperties> = {
  primary: { background: colors.primary,      color: colors.textInverse,   border: 'none' },
  ghost:   { background: 'transparent',        color: colors.primary,       border: `1.5px solid ${colors.primary}` },
  danger:  { background: colors.dangerLight,   color: colors.danger,        border: 'none' },
  light:   { background: colors.gray100,       color: colors.textPrimary,   border: 'none' },
}
const BTN_SIZE: Record<'sm'|'md'|'lg', React.CSSProperties> = {
  sm: { height: 32, padding: `0 ${spacing[3]}px`, fontSize: font.size.sm, borderRadius: radius.sm },
  md: { height: 44, padding: `0 ${spacing[4]}px`, fontSize: font.size.md, borderRadius: radius.md },
  lg: { height: 52, padding: `0 ${spacing[5]}px`, fontSize: font.size.lg, borderRadius: radius.md },
}
export function Button({ children, onClick, variant = 'primary', disabled, fullWidth, size = 'md', icon }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...BTN_STYLES[variant],
        ...BTN_SIZE[size],
        width: fullWidth ? '100%' : undefined,
        fontWeight: font.weight.bold,
        fontFamily: 'inherit',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: spacing[2],
        transition: transition.fast,
        WebkitTapHighlightColor: 'transparent',
        userSelect: 'none',
      }}
      onTouchStart={e => { if (!disabled) { (e.currentTarget as HTMLButtonElement).style.opacity = '0.75'; (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.97)' }}}
      onTouchEnd={e => { (e.currentTarget as HTMLButtonElement).style.opacity = disabled ? '0.5' : '1'; (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)' }}
    >
      {icon && <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>}
      {children}
    </button>
  )
}

// ── Chip / FilterButton ───────────────────────
type ChipProps = {
  label: string
  active?: boolean
  onClick?: () => void
  count?: number
}
export function Chip({ label, active, onClick, count }: ChipProps) {
  return (
    <button
      onClick={onClick}
      style={{
        height: 34,
        padding: `0 ${spacing[3]}px`,
        borderRadius: radius.full,
        border: active ? `1.5px solid ${colors.primary}` : `1px solid ${colors.border}`,
        background: active ? colors.primaryLight : colors.bgCard,
        color: active ? colors.primary : colors.textSecondary,
        fontSize: font.size.sm,
        fontWeight: active ? font.weight.bold : font.weight.regular,
        cursor: 'pointer',
        whiteSpace: 'nowrap' as const,
        display: 'flex', alignItems: 'center', gap: spacing[1],
        transition: transition.fast,
        WebkitTapHighlightColor: 'transparent',
        fontFamily: 'inherit',
      }}
    >
      {label}
      {count !== undefined && (
        <span style={{
          background: active ? colors.primary : colors.gray200,
          color: active ? colors.textInverse : colors.textSecondary,
          borderRadius: radius.full,
          padding: '1px 6px',
          fontSize: font.size.xs,
          fontWeight: font.weight.bold,
          minWidth: 18,
          textAlign: 'center',
        }}>{count}</span>
      )}
    </button>
  )
}

// ── Badge / Tag ───────────────────────────────
type BadgeVariant = 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray'
const BADGE_COLORS: Record<BadgeVariant, { bg: string; color: string }> = {
  blue:   { bg: colors.primaryLight,  color: colors.primary },
  green:  { bg: colors.successLight,  color: colors.success },
  yellow: { bg: colors.warningLight,  color: colors.warning },
  red:    { bg: colors.dangerLight,   color: colors.danger  },
  purple: { bg: '#EDE9FE',            color: '#7C3AED'      },
  gray:   { bg: colors.gray100,       color: colors.gray600 },
}
export function Badge({ label, variant = 'blue' }: { label: string; variant?: BadgeVariant }) {
  const c = BADGE_COLORS[variant]
  return (
    <span style={{
      background: c.bg, color: c.color,
      fontSize: font.size.xs, fontWeight: font.weight.bold,
      borderRadius: radius.full,
      padding: `2px ${spacing[2]}px`,
      whiteSpace: 'nowrap' as const,
    }}>{label}</span>
  )
}

// ── Input ─────────────────────────────────────
type InputProps = {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  prefix?: React.ReactNode
}
export function Input({ value, onChange, placeholder, type = 'text', prefix }: InputProps) {
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {prefix && (
        <div style={{
          position: 'absolute', left: spacing[3], top: '50%', transform: 'translateY(-50%)',
          color: colors.textTertiary, display: 'flex', alignItems: 'center',
        }}>{prefix}</div>
      )}
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          ...T.input,
          paddingLeft: prefix ? spacing[8] + spacing[2] : spacing[3],
        }}
        onFocus={e => { e.currentTarget.style.border = `1.5px solid ${colors.borderFocus}`; e.currentTarget.style.background = colors.bgCard }}
        onBlur={e => { e.currentTarget.style.border = `1px solid ${colors.border}`; e.currentTarget.style.background = colors.bgInput }}
      />
    </div>
  )
}

// ── Divider ───────────────────────────────────
export function Divider({ margin = spacing[2] }: { margin?: number }) {
  return <div style={{ height: 1, background: colors.border, margin: `${margin}px 0` }} />
}

// ── BottomSheet ───────────────────────────────
type BottomSheetProps = {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
}
export function BottomSheet({ open, onClose, children, title }: BottomSheetProps) {
  if (!open) return null
  return (
    <>
      {/* 딤 */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          zIndex: 200, animation: 'fadeIn 0.2s ease',
        }}
      />
      {/* 시트 */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 480,
        background: colors.bgCard,
        borderRadius: `${radius.xl}px ${radius.xl}px 0 0`,
        zIndex: 201,
        animation: 'slideUpSheet 0.25s cubic-bezier(0.32,0.72,0,1)',
        maxHeight: '85vh', overflowY: 'auto',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        {/* 핸들 */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: `${spacing[3]}px 0 ${spacing[1]}px` }}>
          <div style={{ width: 36, height: 4, borderRadius: radius.full, background: colors.gray200 }} />
        </div>
        {title && (
          <div style={{ padding: `${spacing[2]}px ${spacing[4]}px ${spacing[3]}px`, ...T.h3 }}>{title}</div>
        )}
        <div style={{ padding: `0 ${spacing[4]}px ${spacing[6]}px` }}>
          {children}
        </div>
      </div>
    </>
  )
}

// ── EmptyState ────────────────────────────────
export function EmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description?: string }) {
  return (
    <div style={{ textAlign: 'center', padding: `${spacing[10]}px ${spacing[4]}px`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: spacing[2] }}>
      <div style={{ color: colors.gray300, marginBottom: spacing[1] }}>{icon}</div>
      <div style={{ ...T.h4 }}>{title}</div>
      {description && <div style={{ ...T.sm, maxWidth: 240 }}>{description}</div>}
    </div>
  )
}

// ── Toast ─────────────────────────────────────
export function Toast({ msg }: { msg: string }) {
  return (
    <div style={{
      position: 'fixed', top: spacing[5], left: '50%', transform: 'translateX(-50%)',
      zIndex: 999, background: colors.gray900, color: colors.textInverse,
      borderRadius: radius.full,
      padding: `${spacing[2]}px ${spacing[4]}px`,
      fontSize: font.size.sm, fontWeight: font.weight.medium,
      whiteSpace: 'nowrap',
      boxShadow: shadow.modal,
      animation: 'toastIn 0.2s ease',
      pointerEvents: 'none',
    }}>{msg}</div>
  )
}

// ── ListItem ──────────────────────────────────
type ListItemProps = {
  leading?: React.ReactNode
  title: string
  subtitle?: string
  trailing?: React.ReactNode
  onClick?: () => void
}
export function ListItem({ leading, title, subtitle, trailing, onClick }: ListItemProps) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: spacing[3],
        padding: `${spacing[3]}px ${spacing[4]}px`,
        background: colors.bgCard,
        cursor: onClick ? 'pointer' : 'default',
        WebkitTapHighlightColor: 'transparent',
        transition: transition.fast,
        borderBottom: `1px solid ${colors.border}`,
      }}
      onTouchStart={onClick ? e => { (e.currentTarget as HTMLDivElement).style.background = colors.gray50 } : undefined}
      onTouchEnd={onClick ? e => { (e.currentTarget as HTMLDivElement).style.background = colors.bgCard } : undefined}
    >
      {leading && <div style={{ flexShrink: 0 }}>{leading}</div>}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ ...T.body, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
        {subtitle && <div style={{ ...T.sm, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{subtitle}</div>}
      </div>
      {trailing && <div style={{ flexShrink: 0 }}>{trailing}</div>}
    </div>
  )
}
