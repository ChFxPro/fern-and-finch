import { ChevronLeft, ChevronRight, ShoppingBag, X } from 'lucide-react'
import { useEffect, useState } from 'react'

export function ProductDialog({ item, onClose, onAdd }) {
  const [activeImage, setActiveImage] = useState(0)
  useEffect(() => setActiveImage(0), [item?.id])
  if (!item) return null
  const images = item.images?.length ? item.images : [{ url: item.image, alt_text: item.title }]
  const selectedImage = images[activeImage] || images[0]
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="product-dialog" role="dialog" aria-modal="true" aria-labelledby="product-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close item"><X /></button>
        <div className="product-gallery">
          <img src={selectedImage.url || selectedImage.image_url} alt={selectedImage.alt_text || item.title} />
          {images.length > 1 ? <>
            <button className="gallery-arrow gallery-arrow--previous" onClick={() => setActiveImage((activeImage - 1 + images.length) % images.length)} aria-label="Previous product photo"><ChevronLeft /></button>
            <button className="gallery-arrow gallery-arrow--next" onClick={() => setActiveImage((activeImage + 1) % images.length)} aria-label="Next product photo"><ChevronRight /></button>
            <div className="gallery-dots" aria-label={`Photo ${activeImage + 1} of ${images.length}`}>{images.map((image, index) => <button key={image.id || image.url || index} className={index === activeImage ? 'active' : ''} onClick={() => setActiveImage(index)} aria-label={`Show photo ${index + 1}`} />)}</div>
          </> : null}
        </div>
        <div className="product-dialog-copy">
          <p className="category-label">{item.category}</p>
          <h2 id="product-title">{item.title}</h2>
          <p className="dialog-price">${item.price.toFixed(2)}</p>
          <p className="availability">{item.inventory === 1 ? 'Only one available' : `${item.inventory} available`}</p>
          <p>{item.description}</p>
          {item.story ? <blockquote>{item.story}</blockquote> : null}
          {item.materials ? <p className="detail-row"><strong>Materials</strong><span>{item.materials}</span></p> : null}
          {item.dimensions ? <p className="detail-row"><strong>Dimensions</strong><span>{item.dimensions}</span></p> : null}
          <button className="button button--pine" onClick={() => { onAdd(item); onClose() }} disabled={item.inventory < 1}>
            <ShoppingBag size={17} /> Add to bag
          </button>
        </div>
      </section>
    </div>
  )
}
