import { fmtCompact } from '../store/state'

export async function captureBlob(): Promise<Blob | null> {
  const el = document.getElementById('receipt-root')
  if (!el) return null
  // @ts-ignore
  const h2c = (await import('html2canvas')).default
  const prevRadius = (el as HTMLElement).style.borderRadius;
  (el as HTMLElement).style.borderRadius = '0'
  const canvas = await h2c(el, { scale: 2, backgroundColor: '#fff', useCORS: true });
  (el as HTMLElement).style.borderRadius = prevRadius
  return new Promise(res => canvas.toBlob((b: Blob) => res(b), 'image/png'))
}

export async function downloadPng() {
  const el = document.getElementById('receipt-root')
  if (!el) return
  // @ts-ignore
  const h2c = (await import('html2canvas')).default
  const canvas = await h2c(el, { scale: 2, backgroundColor: '#fff', useCORS: true })
  const blob: Blob = await new Promise(res => canvas.toBlob((b: Blob) => res(b), 'image/png'))
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `korea-receipt_${fmtCompact(new Date())}.png`
  a.click(); URL.revokeObjectURL(url)
}

export async function sharePng(): Promise<boolean> {
  const el = document.getElementById('receipt-root')
  if (!el || !navigator.share) return false
  // @ts-ignore
  const h2c = (await import('html2canvas')).default
  const prevRadius = (el as HTMLElement).style.borderRadius;
  (el as HTMLElement).style.borderRadius = '0'
  const canvas = await h2c(el, { scale: 2, backgroundColor: '#fff', useCORS: true });
  (el as HTMLElement).style.borderRadius = prevRadius
  const blob: Blob = await new Promise(res => canvas.toBlob((b: Blob) => res(b), 'image/png'))
  try {
    await navigator.share({ files: [new File([blob], 'korea-receipt.png', { type: 'image/png' })] })
    return true
  } catch { return false }
}

export async function shareBlobDirect(blob: Blob): Promise<boolean> {
  if (!navigator.share) return false
  try {
    await navigator.share({ files: [new File([blob], 'korea-receipt.png', { type: 'image/png' })] })
    return true
  } catch { return false }
}
