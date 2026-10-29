const MAX_BYTES = 10 * 1024 * 1024

/** Validates and downsizes an image on-device so uploads are fast on mobile networks. */
export async function prepareImage(file: File, maxDim = 512): Promise<File> {
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image file.')
  if (file.size > MAX_BYTES) throw new Error('Image is too large (max 10 MB).')
  // Keep vector and animated formats untouched
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') return file

  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height))
    const w = Math.round(bitmap.width * scale), h = Math.round(bitmap.height * scale)
    const canvas = document.createElement('canvas')
    canvas.width = w; canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.drawImage(bitmap, 0, 0, w, h)
    bitmap.close?.()
    const type = file.type === 'image/png' ? 'image/png' : 'image/webp'
    const blob: Blob | null = await new Promise(r => canvas.toBlob(r, type, 0.88))
    if (!blob || blob.size >= file.size) return file
    const ext = type === 'image/png' ? 'png' : 'webp'
    return new File([blob], `image.${ext}`, { type })
  } catch {
    return file // e.g. undecodable format: upload the original
  }
}

export function fileExt(file: File): string {
  const fromType = file.type.split('/')[1]?.replace('+xml', '').replace('jpeg', 'jpg')
  return fromType || file.name.split('.').pop() || 'png'
}
