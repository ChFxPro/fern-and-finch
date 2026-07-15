const MAX_EDGE = 1800

export async function prepareProductImage(file) {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  canvas.getContext('2d', { alpha: false }).drawImage(bitmap, 0, 0, width, height)
  bitmap.close()
  const blob = await new Promise((resolve, reject) => canvas.toBlob((result) => result ? resolve(result) : reject(new Error('Could not prepare that photo.')), 'image/jpeg', 0.86))
  return new File([blob], `${file.name.replace(/\.[^.]+$/, '') || 'product'}.jpg`, { type: 'image/jpeg' })
}
