import { ArrowLeft, ArrowRight, Camera, Check, ChevronLeft, ImagePlus, ListTree, LoaderCircle, LogOut, Mail, Plus, Sparkles, Star, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { CatalogManager } from './CatalogManager.jsx'
import { BotanicalDivider } from './BotanicalDivider.jsx'
import { BrandMark } from './BrandMark.jsx'
import { prepareProductImage } from '../lib/images.js'
import { checkAdmin, createProduct, removeProductImages, uploadProductImages } from '../lib/store.js'
import { supabase, supabaseConfigured } from '../lib/supabase.js'

const initialForm = { title: '', category: 'Art', price: '', description: '', story: '', materials: '', dimensions: '', inventory: '1', featured: false }
const slugify = (value) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 48)

function StudioAccess({ onReady }) {
  const [email, setEmail] = useState('')
  const [state, setState] = useState({ loading: true, sent: false, error: '', denied: false })

  useEffect(() => {
    let active = true
    const inspect = async () => {
      if (!supabaseConfigured) return active && setState({ loading: false, sent: false, error: 'The shop database is not connected yet.', denied: false })
      const { data } = await supabase.auth.getSession()
      if (!data.session) return active && setState((current) => ({ ...current, loading: false }))
      if (await checkAdmin()) return active && onReady(data.session)
      return active && setState({ loading: false, sent: false, error: '', denied: true })
    }
    inspect()
    const { data: listener } = supabaseConfigured ? supabase.auth.onAuthStateChange(() => setTimeout(inspect, 0)) : { data: {} }
    return () => { active = false; listener?.subscription?.unsubscribe() }
  }, [onReady])

  const sendLink = async (event) => {
    event.preventDefault()
    setState({ loading: true, sent: false, error: '', denied: false })
    const redirect = new URL(location.href)
    redirect.searchParams.set('studio', '1')
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirect.toString() } })
    setState(error ? { loading: false, sent: false, error: error.message, denied: false } : { loading: false, sent: true, error: '', denied: false })
  }

  if (state.loading) return <div className="studio-login"><LoaderCircle className="spin" /><p>Opening the studio…</p></div>
  if (state.denied) return <div className="studio-login"><span><Mail /></span><h1>Almost ready.</h1><p>This email is signed in, but it still needs shop-owner access.</p><button className="text-link" onClick={() => supabase.auth.signOut()}>Use a different email</button></div>
  return (
    <form className="studio-login" onSubmit={sendLink}>
      <span><Mail /></span><BotanicalDivider /><h1>Welcome to the studio.</h1><p>Enter your email and we’ll send a safe, password-free sign-in link.</p>
      <label className="field"><span>Email address</span><input type="email" inputMode="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required /></label>
      {state.sent ? <p className="studio-sent"><Check /> Check your email, then tap the sign-in link.</p> : null}
      {state.error ? <p className="form-error">{state.error}</p> : null}
      <button className="button button--clay button--wide" disabled={state.loading}>{state.loading ? <LoaderCircle className="spin" /> : <Mail />} Email my sign-in link</button>
    </form>
  )
}

function PhotoStep({ photos, setPhotos, onContinue }) {
  const addPhotos = (files) => {
    if (!files?.length) return
    const incoming = [...files].slice(0, 6 - photos.length).map((file) => ({ file, preview: URL.createObjectURL(file) }))
    setPhotos((current) => [...current, ...incoming])
  }
  const remove = (index) => setPhotos((current) => current.filter((photo, photoIndex) => {
    if (photoIndex === index) URL.revokeObjectURL(photo.preview)
    return photoIndex !== index
  }))
  const move = (index, direction) => setPhotos((current) => {
    const target = index + direction
    if (target < 0 || target >= current.length) return current
    const next = [...current]
    ;[next[index], next[target]] = [next[target], next[index]]
    return next
  })
  return (
    <section className="studio-step photo-step">
      <BotanicalDivider />
      <h1>Add a new treasure</h1>
      <p>Start with a few good photos.</p>
      <label className="choose-photos"><ImagePlus /><span>Choose photos</span><input type="file" accept="image/*" multiple onChange={(event) => addPhotos(event.target.files)} /></label>
      <small className="photo-limit">Up to 6 photos · the first photo is the cover</small>
      {photos.length ? <div className="studio-photo-grid">{photos.map((photo, index) => <article key={photo.preview} className={index === 0 ? 'studio-photo studio-photo--cover' : 'studio-photo'}>
        <img src={photo.preview} alt={`Selected item photo ${index + 1}`} />
        {index === 0 ? <span className="cover-label"><Star size={12} /> Cover</span> : null}
        <button className="remove-photo" onClick={() => remove(index)} aria-label={`Remove photo ${index + 1}`}><X /></button>
        <div className="photo-order"><button onClick={() => move(index, -1)} disabled={index === 0} aria-label="Move photo earlier"><ArrowLeft /></button><button onClick={() => move(index, 1)} disabled={index === photos.length - 1} aria-label="Move photo later"><ArrowRight /></button></div>
      </article>)}</div> : <div className="photo-empty"><Camera /><strong>Your item will look best in natural light</strong><span>Try a cover photo, a close detail, and one view that shows scale.</span></div>}
      <div className="studio-sticky-actions"><button className="button button--clay button--wide" onClick={onContinue} disabled={!photos.length}>Continue <ArrowRight /></button></div>
    </section>
  )
}

function DetailsStep({ form, setForm, photos, onBack, onSave, onPreview, status }) {
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  return (
    <form className="studio-step details-step" onSubmit={(event) => { event.preventDefault(); onPreview() }}>
      <div className="step-progress"><span className="complete"><Check /></span><i /><span className="active">2</span><i /><span>3</span></div>
      <BotanicalDivider />
      <h1>Details</h1>
      <div className="field-grid">
        <label className="field field--wide"><span>Item name</span><input value={form.title} onChange={(event) => update('title', event.target.value)} placeholder="e.g. Woodland Study No. 4" required /></label>
        <label className="field field--wide"><span>Category</span><select value={form.category} onChange={(event) => update('category', event.target.value)}><option>Art</option><option>Found</option><option>Handmade</option></select></label>
        <label className="field"><span>Price</span><div className="money-input"><b>$</b><input type="number" inputMode="decimal" min="1" step="0.01" value={form.price} onChange={(event) => update('price', event.target.value)} placeholder="0.00" required /></div></label>
        <label className="field"><span>Quantity</span><input type="number" inputMode="numeric" min="0" value={form.inventory} onChange={(event) => update('inventory', event.target.value)} required /></label>
        <label className="field field--wide"><span>Short description</span><textarea value={form.description} onChange={(event) => update('description', event.target.value)} placeholder="What is it, and what makes it special?" rows="3" /></label>
        <label className="field field--wide"><span>Its little story <small>optional</small></span><textarea value={form.story} onChange={(event) => update('story', event.target.value)} placeholder="Where did you find it? What inspired it?" rows="3" /></label>
        <label className="field field--wide"><span>Materials</span><input value={form.materials} onChange={(event) => update('materials', event.target.value)} placeholder="Watercolor on archival paper" /></label>
        <label className="field field--wide"><span>Dimensions</span><input value={form.dimensions} onChange={(event) => update('dimensions', event.target.value)} placeholder={'8” × 10” (framed)'} /></label>
      </div>
      <label className="feature-toggle"><input type="checkbox" checked={form.featured} onChange={(event) => update('featured', event.target.checked)} /><span><b>Feature on the home page</b><small>Give this piece a little more attention</small></span></label>
      {status.error ? <p className="form-error">{status.error}</p> : null}
      <div className="studio-sticky-actions studio-sticky-actions--three"><button type="button" className="button button--ghost" onClick={onBack}>Back</button><button type="button" className="button button--ghost" onClick={() => onSave(false)} disabled={status.loading || !form.title.trim() || !Number(form.price)}>Save draft</button><button className="button button--clay">Preview</button></div>
      <span className="sr-only">{photos.length} photos selected</span>
    </form>
  )
}

function ReviewStep({ form, photos, onBack, onPublish, status }) {
  return (
    <section className="studio-step review-step">
      <div className="step-progress"><span className="complete"><Check /></span><i /><span className="complete"><Check /></span><i /><span className="active">3</span></div>
      <BotanicalDivider /><h1>Ready for the shop?</h1><p>Take one last look before you publish.</p>
      <div className="listing-preview"><img src={photos[0]?.preview} alt="Listing cover preview" /><div><span>{form.category}</span><h2>{form.title}</h2><strong>${Number(form.price || 0).toFixed(2)}</strong><p>{form.description}</p><small>{Number(form.inventory) === 1 ? 'Only one available' : `${form.inventory} available`}</small></div></div>
      {status.error ? <p className="form-error">{status.error}</p> : null}
      <div className="studio-sticky-actions"><button className="button button--ghost" onClick={onBack}>Edit details</button><button className="button button--clay" onClick={() => onPublish(true)} disabled={status.loading}>{status.loading ? <LoaderCircle className="spin" /> : <Sparkles />} {status.loading ? 'Publishing…' : 'Publish item'}</button></div>
    </section>
  )
}

export function Studio({ open, onClose, onPublished, onItemChanged }) {
  const [session, setSession] = useState(null)
  const [mode, setMode] = useState('add')
  const [step, setStep] = useState('photos')
  const [form, setForm] = useState(initialForm)
  const [photos, setPhotos] = useState([])
  const [status, setStatus] = useState({ loading: false, error: '', success: false, draft: false })

  if (!open) return null
  const reset = () => {
    photos.forEach((photo) => URL.revokeObjectURL(photo.preview))
    setPhotos([]); setForm(initialForm); setStep('photos'); setStatus({ loading: false, error: '', success: false, draft: false })
  }
  const save = async (active) => {
    setStatus({ loading: true, error: '', success: false, draft: !active })
    let images = []
    try {
      const prepared = await Promise.all(photos.map((photo) => prepareProductImage(photo.file)))
      images = await uploadProductImages(prepared)
      const result = await createProduct({
        id: `${slugify(form.title) || 'piece'}-${crypto.randomUUID().slice(0, 8)}`,
        title: form.title.trim(), category: form.category, price: Number(form.price), description: form.description.trim(),
        story: form.story.trim(), materials: form.materials.trim(), dimensions: form.dimensions.trim(), inventory: Number(form.inventory),
        featured: form.featured, active, image: images[0].url, images,
      })
      onPublished(result)
      setStatus({ loading: false, error: '', success: true, draft: !active })
    } catch (error) {
      if (images.length) await removeProductImages(images.map((image) => image.path))
      setStatus({ loading: false, error: error.message, success: false, draft: !active })
    }
  }

  return (
    <div className="studio-shell">
      <header className="studio-header">
        <button className="studio-back" onClick={onClose}><ChevronLeft /> Store</button>
        <span><BrandMark light /> Maker Studio</span>
        {session ? <button className="icon-button" onClick={() => supabase.auth.signOut().then(() => setSession(null))} aria-label="Sign out"><LogOut /></button> : <button className="icon-button" onClick={onClose} aria-label="Close studio"><X /></button>}
      </header>
      {!session ? <main className="studio-main"><StudioAccess onReady={setSession} /></main> : <>
        <nav className="studio-mode-tabs" aria-label="Maker Studio sections"><button className={mode === 'add' ? 'active' : ''} onClick={() => setMode('add')}><Plus /> Add item</button><button className={mode === 'manage' ? 'active' : ''} onClick={() => setMode('manage')}><ListTree /> Catalog</button></nav>
        <main className="studio-main">
          {mode === 'manage' ? <CatalogManager onItemChanged={onItemChanged} /> : status.success ? <section className="publish-success"><span><Check /></span><h1>{status.draft ? 'Draft saved.' : 'It’s in the shop.'}</h1><p>{status.draft ? 'You can finish it whenever you’re ready.' : 'Your new piece is live and ready to find its next home.'}</p><button className="button button--clay" onClick={reset}>Add another item</button><button className="text-link" onClick={() => setMode('manage')}>Open the catalog</button></section> : step === 'photos' ? <PhotoStep photos={photos} setPhotos={setPhotos} onContinue={() => setStep('details')} /> : step === 'details' ? <DetailsStep form={form} setForm={setForm} photos={photos} onBack={() => setStep('photos')} onSave={save} onPreview={() => setStep('review')} status={status} /> : <ReviewStep form={form} photos={photos} onBack={() => setStep('details')} onPublish={save} status={status} />}
        </main>
      </>}
    </div>
  )
}
