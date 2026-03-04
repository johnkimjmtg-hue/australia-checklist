import { fmtCompact } from '../store/state'
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
  const canvas = await h2c(el, { scale: 2, backgroundColor: '#fff', useCORS: true })
  const blob: Blob = await new Promise(res => canvas.toBlob((b: Blob) => res(b), 'image/png'))
  try {
    await navigator.share({ files: [new File([blob], 'korea-receipt.png', { type: 'image/png' })], title: '한국 여행 영수증' })
    return true
  } catch { return false }
}
