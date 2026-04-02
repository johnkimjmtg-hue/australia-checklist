// ─────────────────────────────────────────────
// adminShared.ts
// src/pages/admin/adminShared.ts
// 어드민 공통 스타일, 컴포넌트, 유틸
// ─────────────────────────────────────────────
import React, { useState } from 'react'

// ── Cloudinary
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

export async function compressImage(file: File | Blob, maxPx = 800): Promise<Blob> {
  return new Promise(resolve => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      let w = img.width, h = img.height
      if (w > maxPx || h > maxPx) {
        if (w > h) { h = Math.round(h * maxPx / w); w = maxPx }
        else { w = Math.round(w * maxPx / h); h = maxPx }
      }
      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
      canvas.toBlob(blob => resolve(blob!), 'image/webp', 0.80)
      URL.revokeObjectURL(url)
    }
    img.src = url
  })
}

export async function uploadToCloudinary(file: File | Blob, folder = 'shopping'): Promise<string> {
  const compressed = await compressImage(file)
  const fd = new FormData()
  fd.append('file', compressed, 'image.webp')
  fd.append('upload_preset', UPLOAD_PRESET)
  fd.append('folder', folder)
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: fd })
  const data = await res.json()
  if (!data.secure_url) throw new Error('Cloudinary 업로드 실패')
  return data.secure_url
}

// ── 공통 스타일
export const inputStyle: React.CSSProperties = {
  width: '100%', minWidth: 0, padding: '11px 14px', border: '1.5px solid #E2E8F0', borderRadius: 10,
  fontSize: 14, color: '#1E293B', outline: 'none', boxSizing: 'border-box',
  fontFamily: 'inherit', display: 'block', background: '#fff',
}

export const btnPrimary: React.CSSProperties = {
  padding: '11px 20px', borderRadius: 10, border: 'none', background: '#1B6EF3', color: '#fff',
  fontSize: 14, fontWeight: 700, cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap',
  minHeight: 44,
}

export const btnGhost: React.CSSProperties = {
  padding: '11px 16px', borderRadius: 10, border: '1.5px solid #E2E8F0', background: '#fff', color: '#475569',
  fontSize: 14, fontWeight: 700, cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap',
  minHeight: 44,
}

export const btnSmGhost: React.CSSProperties = {
  padding: '7px 12px', borderRadius: 8, border: '1.5px solid #E2E8F0', background: '#F8FAFC', color: '#64748B',
  fontSize: 12, fontWeight: 700, cursor: 'pointer', minHeight: 36,
}

export const btnSmDanger: React.CSSProperties = {
  padding: '7px 12px', borderRadius: 8, border: 'none', background: '#FEE2E2', color: '#DC2626',
  fontSize: 12, fontWeight: 700, cursor: 'pointer', minHeight: 36,
}

export const checkLabel: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: '#1B6EF3', cursor: 'pointer',
  padding: '8px 0',
}

// ── 공통 컴포넌트
export function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: '18px 16px', marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #F1F5F9' }}>
      {children}
    </div>
  )
}

export function SectionTitle({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginBottom: 14, letterSpacing: 0.3, ...style }}>{children}</div>
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: '#1B6EF3', marginBottom: 6, letterSpacing: 0.3 }}>{label}</div>
      {children}
    </div>
  )
}

export function Grid2({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>{children}</div>
}

export function Toast({ msg }: { msg: string }) {
  return (
    <div style={{ position: 'fixed', bottom: 86, left: '50%', transform: 'translateX(-50%)', background: '#1E293B', color: '#fff', padding: '11px 22px', borderRadius: 12, fontSize: 13, fontWeight: 700, zIndex: 999, boxShadow: '0 4px 16px rgba(0,0,0,0.2)', whiteSpace: 'nowrap' }}>
      {msg}
    </div>
  )
}

export function Confirm({ msg, onOk, onCancel, danger }: { msg: string; onOk: () => void; onCancel: () => void; danger?: boolean }) {
  return (
    <>
      <div onClick={onCancel} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 600 }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#fff', borderRadius: 16, padding: '24px 20px', zIndex: 601, width: 'calc(100% - 48px)', maxWidth: 300, textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
        <p style={{ fontSize: 14, fontWeight: 800, marginBottom: 20 }}>{msg}</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onCancel} style={{ ...btnGhost, flex: 1 }}>취소</button>
          <button onClick={onOk} style={{ flex: 2, padding: '11px', border: 'none', borderRadius: 10, background: danger ? '#e8420a' : '#1E4D83', color: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>삭제</button>
        </div>
      </div>
    </>
  )
}

export function EditBizMultiSearch({ businesses, values, onChange }: {
  businesses: { id: string; name: string }[]
  values: string[]
  onChange: (ids: string[]) => void
}) {
  const [search, setSearch] = useState('')
  const [focused, setFocused] = useState(false)
  const filtered = focused
    ? businesses.filter(b => !values.includes(b.id) && (!search || b.name.toLowerCase().includes(search.toLowerCase()))).slice(0, 8)
    : []
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
      {values.map(id => {
        const biz = businesses.find(b => b.id === id)
        return biz ? (
          <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(27,110,243,0.08)', borderRadius: 6, padding: '4px 8px' }}>
            <span style={{ flex: 1, fontSize: 12, color: '#1B6EF3', fontWeight: 600 }}>{biz.name}</span>
            <button onMouseDown={() => onChange(values.filter(i => i !== id))}
              style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 12 }}>✕</button>
          </div>
        ) : null
      })}
      {values.length < 3 && (
        <div style={{ position: 'relative' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            placeholder="업체명 검색... (최대 3개)"
            style={{ ...inputStyle, fontSize: 12, padding: '5px 8px' }}
          />
          {filtered.length > 0 && focused && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 9999, background: '#fff', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
              {filtered.map(b => (
                <div key={b.id}
                  onMouseDown={() => { onChange([...values, b.id]); setSearch('') }}
                  style={{ padding: '8px 12px', fontSize: 12, cursor: 'pointer', borderBottom: '1px solid #F1F5F9' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                >{b.name}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function EditProdMultiSearch({ products, values, onChange }: {
  products: { id: string; name: string }[]
  values: string[]
  onChange: (ids: string[]) => void
}) {
  const [search, setSearch] = useState('')
  const [focused, setFocused] = useState(false)
  const filtered = focused
    ? products.filter(p => !values.includes(p.id) && (!search || p.name.toLowerCase().includes(search.toLowerCase()))).slice(0, 8)
    : []
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
      {values.map(id => {
        const prod = products.find(p => p.id === id)
        return prod ? (
          <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(234,88,12,0.08)', borderRadius: 6, padding: '4px 8px' }}>
            <span style={{ flex: 1, fontSize: 12, color: '#EA580C', fontWeight: 600 }}>🛍 {prod.name}</span>
            <button onMouseDown={() => onChange(values.filter(i => i !== id))}
              style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 12 }}>✕</button>
          </div>
        ) : null
      })}
      {values.length < 5 && (
        <div style={{ position: 'relative' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            placeholder="상품명 검색... (최대 5개)"
            style={{ ...inputStyle, fontSize: 12, padding: '5px 8px' }}
          />
          {filtered.length > 0 && focused && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 9999, background: '#fff', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
              {filtered.map(p => (
                <div key={p.id}
                  onMouseDown={() => { onChange([...values, p.id]); setSearch('') }}
                  style={{ padding: '8px 12px', fontSize: 12, cursor: 'pointer', borderBottom: '1px solid #F1F5F9' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                >{p.name}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── 공통 타입
export type Cat  = { id: string; label: string; emoji: string; sort_order: number }
export type Item = {
  id: string; category_id: string; label: string; icon: string | null
  sort_order: number; is_active: boolean; address?: string | null
  description?: string | null; tips?: string | null; image_url?: string | null
  related_business_id?: string | null; related_business_ids?: string[] | null
  related_product_ids?: string[] | null
}
