import { fmtCompact } from '../store/state'

async function buildCanvas() {
  const el = document.getElementById('receipt-root')
  if (!el) return null
  // @ts-ignore
  const h2c = (await import('html2canvas')).default
  const prevRadius = (el as HTMLElement).style.borderRadius;
  (el as HTMLElement).style.borderRadius = '0'
  const canvas = await h2c(el, { scale: 2, backgroundColor: '#fff', useCORS: true });
  (el as HTMLElement).style.borderRadius = prevRadius
  return canvas
}

async function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise(res => canvas.toBlob((b) => res(b!), 'image/png'))
}

export async function downloadPng() {
  const canvas = await buildCanvas()
  if (!canvas) return
  const blob = await canvasToBlob(canvas)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `receipt_${fmtCompact(new Date())}.png`
  a.click(); URL.revokeObjectURL(url)
}

export async function sharePng(): Promise<boolean> {
  if (!navigator.share) return false

  // 1단계: 캔버스 & blob 미리 생성 (비동기 작업)
  const canvas = await buildCanvas()
  if (!canvas) return false
  const blob = await canvasToBlob(canvas)
  const file = new File([blob], 'receipt.png', { type: 'image/png' })

  // 2단계: share 즉시 호출 (iOS 유저 제스처 체인 유지)
  try {
    await navigator.share({ files: [file] })
    return true
  } catch {
    return false
  }
}
