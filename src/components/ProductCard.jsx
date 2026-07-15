import { ArrowUpRight, Plus } from 'lucide-react'

export function ProductCard({ item, index, onSelect, onAdd }) {
  return (
    <article className={`product-card product-card--${index % 4}`}>
      <button className="product-image-wrap" onClick={() => onSelect(item)} aria-label={`View ${item.title}`}>
        <img src={item.image} alt={item.title} loading={index > 3 ? 'lazy' : 'eager'} />
        <span className="view-cue">View piece <ArrowUpRight size={15} /></span>
      </button>
      <div className="product-meta">
        <div>
          <p>{item.category}</p>
          <h3>{item.title}</h3>
          <span>${item.price.toFixed(2)}</span>
        </div>
        <button className="add-circle" onClick={() => onAdd(item)} aria-label={`Add ${item.title} to bag`} disabled={item.inventory < 1}>
          <Plus size={18} />
        </button>
      </div>
    </article>
  )
}
