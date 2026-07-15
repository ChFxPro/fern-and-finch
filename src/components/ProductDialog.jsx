import { ShoppingBag, X } from 'lucide-react'

export function ProductDialog({ item, onClose, onAdd }) {
  if (!item) return null
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="product-dialog" role="dialog" aria-modal="true" aria-labelledby="product-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close item"><X /></button>
        <img src={item.image} alt={item.title} />
        <div className="product-dialog-copy">
          <p className="category-label">{item.category}</p>
          <h2 id="product-title">{item.title}</h2>
          <p className="dialog-price">${item.price.toFixed(2)}</p>
          <p>{item.description}</p>
          {item.story ? <blockquote>{item.story}</blockquote> : null}
          {item.materials ? <p className="materials"><strong>Materials</strong><br />{item.materials}</p> : null}
          <button className="button button--pine" onClick={() => { onAdd(item); onClose() }} disabled={item.inventory < 1}>
            <ShoppingBag size={17} /> Add to bag
          </button>
        </div>
      </section>
    </div>
  )
}
