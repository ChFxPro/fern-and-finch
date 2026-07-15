import { Check, Eye, EyeOff, LoaderCircle, PackageOpen, Pencil, RefreshCw, Save } from 'lucide-react'
import { useEffect, useState } from 'react'
import { listProducts, updateProduct } from '../lib/store.js'

function CatalogItemEditor({ item, onSaved }) {
  const [draft, setDraft] = useState(() => ({
    title: item.title, category: item.category, price: String(item.price), inventory: String(item.inventory),
    description: item.description || '', story: item.story || '', materials: item.materials || '', featured: Boolean(item.featured),
  }))
  const [status, setStatus] = useState({ loading: false, error: '', saved: false })
  const update = (key, value) => setDraft((current) => ({ ...current, [key]: value }))

  const save = async (changes) => {
    setStatus({ loading: true, error: '', saved: false })
    try {
      const result = await updateProduct(item.id, changes)
      onSaved(result)
      setStatus({ loading: false, error: '', saved: true })
    } catch (error) {
      setStatus({ loading: false, error: error.message, saved: false })
    }
  }

  const saveDetails = (event) => {
    event.preventDefault()
    save({ ...draft, price: Number(draft.price), inventory: Number(draft.inventory) })
  }
  const statusLabel = item.active === false ? 'Hidden' : item.inventory < 1 ? 'Sold out' : 'Live'

  return (
    <article className="catalog-item">
      <div className="catalog-item-summary">
        <img src={item.image} alt="" />
        <div className="catalog-item-name"><span>{item.category}</span><h3>{item.title}</h3><p>${item.price.toFixed(2)} · {item.inventory} available</p></div>
        <span className={`listing-status listing-status--${statusLabel.toLowerCase().replace(' ', '-')}`}>{statusLabel}</span>
      </div>
      <div className="catalog-quick-actions">
        <button type="button" onClick={() => save({ active: item.active === false })} disabled={status.loading}>{item.active === false ? <Eye size={16} /> : <EyeOff size={16} />}{item.active === false ? 'Put back in shop' : 'Hide from shop'}</button>
        <button type="button" onClick={() => save({ featured: !item.featured })} disabled={status.loading}>{item.featured ? <Check size={16} /> : <PackageOpen size={16} />}{item.featured ? 'Featured' : 'Feature item'}</button>
      </div>
      <details className="catalog-details">
        <summary><Pencil size={15} /> Edit listing details</summary>
        <form onSubmit={saveDetails}>
          <div className="field-grid">
            <label className="field field--wide"><span>Item name</span><input value={draft.title} onChange={(event) => update('title', event.target.value)} required /></label>
            <label className="field"><span>Kind of piece</span><select value={draft.category} onChange={(event) => update('category', event.target.value)}><option>Art</option><option>Found</option><option>Handmade</option></select></label>
            <label className="field"><span>Price</span><div className="money-input"><b>$</b><input type="number" inputMode="decimal" min="1" step="0.01" value={draft.price} onChange={(event) => update('price', event.target.value)} required /></div></label>
            <label className="field"><span>Quantity</span><input type="number" inputMode="numeric" min="0" step="1" value={draft.inventory} onChange={(event) => update('inventory', event.target.value)} required /></label>
            <label className="field field--wide"><span>Short description</span><textarea rows="3" value={draft.description} onChange={(event) => update('description', event.target.value)} /></label>
            <label className="field field--wide"><span>Its little story</span><textarea rows="3" value={draft.story} onChange={(event) => update('story', event.target.value)} /></label>
            <label className="field field--wide"><span>Materials & details</span><input value={draft.materials} onChange={(event) => update('materials', event.target.value)} /></label>
          </div>
          <label className="feature-toggle"><input type="checkbox" checked={draft.featured} onChange={(event) => update('featured', event.target.checked)} /><span><b>Feature on the home page</b><small>Give this piece a little more attention</small></span></label>
          {status.error ? <p className="form-error">{status.error}</p> : null}
          <button className="button button--pine button--wide" disabled={status.loading}>{status.loading ? <LoaderCircle className="spin" /> : status.saved ? <Check /> : <Save />}{status.loading ? 'Saving…' : status.saved ? 'Saved' : 'Save changes'}</button>
        </form>
      </details>
    </article>
  )
}

export function CatalogManager({ onItemChanged }) {
  const [items, setItems] = useState([])
  const [status, setStatus] = useState({ loading: true, error: '' })
  const loadCatalog = async () => {
    setStatus({ loading: true, error: '' })
    try { setItems(await listProducts({ includeHidden: true })); setStatus({ loading: false, error: '' }) }
    catch (error) { setStatus({ loading: false, error: error.message }) }
  }
  useEffect(() => { loadCatalog() }, [])
  const saveItem = (updated) => { setItems((current) => current.map((item) => item.id === updated.id ? updated : item)); onItemChanged(updated) }
  return (
    <section className="catalog-manager">
      <div className="studio-intro catalog-intro"><span>Your collection</span><h1>Tend the shop.</h1><p>Update a price or quantity, feature a favorite, or tuck a sold piece away.</p></div>
      {status.error ? <p className="form-error catalog-access-error">{status.error}</p> : null}
      {!status.loading && !status.error ? <div className="catalog-list"><div className="catalog-list-heading"><span>{items.length} pieces</span><button onClick={loadCatalog}><RefreshCw size={14} /> Refresh</button></div>{items.map((item) => <CatalogItemEditor key={item.id} item={item} onSaved={saveItem} />)}</div> : null}
      {status.loading ? <div className="studio-loading"><LoaderCircle className="spin" /> Opening your collection…</div> : null}
    </section>
  )
}
