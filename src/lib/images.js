const OUTPUT_WIDTH = 1440
const TARGET_ASPECT = 4 / 5
const DEFAULT_CROP = { x: 50, y: 50, zoom: 1 }

const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value))

export function getProductCropRect(width, height, crop = DEFAULT_CROP) {
  const sourceAspect = width / height
  const baseWidth = sourceAspect > TARGET_ASPECT ? height * TARGET_ASPECT : width
  const baseHeight = sourceAspect > TARGET_ASPECT ? height : width / TARGET_ASPECT
  const cropZoom = Number(crop.zoom)
  const cropX = Number(crop.x)
  const cropY = Number(crop.y)
  const zoom = clamp(Number.isFinite(cropZoom) ? cropZoom : DEFAULT_CROP.zoom, 1, 2.5)
  const cropWidth = baseWidth / zoom
  const cropHeight = baseHeight / zoom
  const x = clamp(Number.isFinite(cropX) ? cropX : DEFAULT_CROP.x, 0, 100) / 100
  const y = clamp(Number.isFinite(cropY) ? cropY : DEFAULT_CROP.y, 0, 100) / 100

  return {
    x: (width - cropWidth) * x,
    y: (height - cropHeight) * y,
    width: cropWidth,
    height: cropHeight,
  }
}

export async function prepareProductImage(file, crop = DEFAULT_CROP) {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const source = getProductCropRect(bitmap.width, bitmap.height, crop)
  const width = Math.max(1, Math.min(OUTPUT_WIDTH, Math.round(source.width)))
  const height = Math.max(1, Math.round(width / TARGET_ASPECT))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  canvas.getContext('2d', { alpha: false }).drawImage(bitmap, source.x, source.y, source.width, source.height, 0, 0, width, height)
  bitmap.close()
  const blob = await new Promise((resolve, reject) => canvas.toBlob((result) => result ? resolve(result) : reject(new Error('Could not prepare that photo.')), 'image/jpeg', 0.86))
  return new File([blob], `${file.name.replace(/\.[^.]+$/, '') || 'product'}-crop.jpg`, { type: 'image/jpeg' })
}
