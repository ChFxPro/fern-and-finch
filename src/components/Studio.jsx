import { ArrowLeft, ArrowRight, Camera, Check, ChevronLeft, Crop, ImagePlus, ListTree, LoaderCircle, LockKeyhole, LogOut, Move, Plus, RotateCcw, Sparkles, Star, X, ZoomIn } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { CatalogManager } from './CatalogManager.jsx'
import { BotanicalDivider } from './BotanicalDivider.jsx'
import { BrandMark } from './BrandMark.jsx'
import { prepareProductImage } from '../lib/images.js'
import { checkAdmin, createProduct, removeProductImages, uploadProductImages } from '../lib/store.js'
import { supabase, supabaseConfigured } from '../lib/supabase.js'

const initialForm = { title: '', category: 'Art', price: '', description: '', story: '', materials: '', dimensions: '', inventory: '1', featured: false }
const initialCrop = { x: 50, y: 50, zoom: 1 }
const cropValue = (value, minimum = 0, maximum = 100) => Math.min(maximum, Math.max(minimum, value))
const slugify = (value) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 48)
const studioUrl = () => {
  const url = new URL(import.meta.env.BASE_URL, location.origin)
  url.searchParams.set('studio', '1')
  return url
}

function StudioAccess({ onReady }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [state, setState] = useState({ loading: true, error: '', denied: false })

  useEffect(() => {
    let active = true
    const inspect = async () => {
      if (!supabaseConfigured) return active && setState({ loading: false, error: 'The shop database is not connected yet.', denied: false })

      const callbackError = new URLSearchParams(location.hash.slice(1)).get('error_description') || new URL(location.href).searchParams.get('error_description')
      if (callbackError) {
        history.replaceState(null, '', studioUrl())
        return active && setState({ loading: false, error: 'That sign-in link has expired or was already used. Please sign in again.', denied: false })
      }

      const { data, error } = await supabase.auth.getSession()
      if (error) return active && setState({ loading: false, error: 'We could not open your saved sign-in. Please sign in again.', denied: false })
      if (!data.session) return active && setState((current) => ({ ...current, loading: false }))

      const { data: verified, error: verificationError } = await supabase.auth.getUser()
      if (verificationError || !verified.user) {
        await supabase.auth.signOut()
        return active && setState({ loading: false, error: 'Your sign-in has expired. Please sign in again.', denied: false })
      }
      if (await checkAdmin()) return active && onReady(data.session)
      return active && setState({ loading: false, error: '', denied: true })
    }
    inspect()
    const { data: listener } = supabaseConfigured ? supabase.auth.onAuthStateChange(() => setTimeout(inspect, 0)) : { data: {} }
    return () => { active = false; listener?.subscription?.unsubscribe() }
  }, [onReady])

  const signIn = async (event) => {
    event.preventDefault()
    setState({ loading: true, error: '', denied: false })
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })
    if (error || !data.session) {
      setState({ loading: false, error: 'That email and store password did not match. Please try again.', denied: false })
      return
    }

    const { data: verified, error: verificationError } = await supabase.auth.getUser()
    if (verificationError || !verified.user) {
      await supabase.auth.signOut()
      setState({ loading: false, error: 'We could not verify this sign-in. Please try again.', denied: false })
      return
    }
    if (await checkAdmin()) {
      onReady(data.session)
      return
    }
    await supabase.auth.signOut()
    setState({ loading: false, error: '', denied: true })
  }

  const useAnotherEmail = async () => {
    await supabase.auth.signOut()
    setEmail('')
    setPassword('')
    setState({ loading: false, error: '', denied: false })
  }

  if (state.loading) return <div className="studio-login"><LoaderCircle className="spin" /><p>Opening the studio…</p></div>
  if (state.denied) return <div className="studio-login"><span><LockKeyhole /></span><h1>Almost ready.</h1><p>This account is signed in, but it still needs shop-owner access.</p><button className="text-link" onClick={useAnotherEmail}>Use a different account</button></div>
  return (
    <form className="studio-login" onSubmit={signIn}>
      <span><LockKeyhole /></span><BotanicalDivider /><h1>Welcome to the studio.</h1><p>Sign in with your private Fern &amp; Finch store password.</p>
      <label className="field"><span>Email address</span><input type="email" inputMode="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required /></label>
      <label className="field studio-password-field"><span>Store password</span><input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
      {state.error ? <p className="form-error" role="alert">{state.error}</p> : null}
      <button className="button button--clay button--wide" disabled={state.loading}>{state.loading ? <LoaderCircle className="spin" /> : <LockKeyhole />} Sign in to the studio</button>
    </form>
  )
}

const photoBackground = (photo) => ({
  backgroundImage: `url(${JSON.stringify(photo.preview)})`,
  backgroundPosition: `${photo.crop.x}% ${photo.crop.y}%`,
  backgroundRepeat: 'no-repeat',
  backgroundSize: photo.aspect >= 4 / 5 ? `auto ${photo.crop.zoom * 100}%` : `${photo.crop.zoom * 100}% auto`,
})

function CropFrame({ photo, className = '', label }) {
  return <div className={`crop-frame ${className}`} style={photoBackground(photo)} role="img" aria-label={label} />
}

function loadPhoto(file) {
  const preview = URL.createObjectURL(file)
  return new Promise((resolve) => {
    const image = new Image()
    const finish = (aspect) => resolve({ file, preview, aspect, crop: { ...initialCrop } })
    image.onload = () => finish(image.naturalWidth / image.naturalHeight)
    image.onerror = () => finish(1)
    image.src = preview
  })
}

function PhotoCropEditor({ photo, onChange, onDone }) {
  const drag = useRef(null)
  const update = (changes) => onChange({ ...photo.crop, ...changes })
  const startDrag = (event) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = { pointerId: event.pointerId, clientX: event.clientX, clientY: event.clientY, crop: photo.crop }
  }
  const moveCrop = (event) => {
    if (drag.current?.pointerId !== event.pointerId) return
    const bounds = event.currentTarget.getBoundingClientRect()
    update({
      x: cropValue(drag.current.crop.x - ((event.clientX - drag.current.clientX) / bounds.width) * 100),
      y: cropValue(drag.current.crop.y - ((event.clientY - drag.current.clientY) / bounds.height) * 100),
    })
  }
  const stopDrag = (event) => {
    if (drag.current?.pointerId === event.pointerId) drag.current = null
  }

  return (
    <div className="crop-editor-backdrop" role="presentation">
      <section className="crop-editor" role="dialog" aria-modal="true" aria-labelledby="crop-editor-title">
        <header><div><span>Photo framing</span><h2 id="crop-editor-title">Adjust the crop</h2></div><button type="button" className="icon-button" onClick={onDone} aria-label="Close crop editor"><X /></button></header>
        <div className="crop-stage" style={photoBackground(photo)} onPointerDown={startDrag} onPointerMove={moveCrop} onPointerUp={stopDrag} onPointerCancel={stopDrag} role="img" aria-label="Current cropped photo preview" />
        <p className="crop-hint"><Move /> Drag the photo until it feels right inside the shop frame.</p>
        <div className="crop-controls">
          <label><span>Left ↔ right</span><input type="range" min="0" max="100" value={photo.crop.x} onChange={(event) => update({ x: Number(event.target.value) })} /></label>
          <label><span>Up ↕ down</span><input type="range" min="0" max="100" value={photo.crop.y} onChange={(event) => update({ y: Number(event.target.value) })} /></label>
          <label><span><ZoomIn /> Zoom</span><input type="range" min="1" max="2.5" step="0.05" value={photo.crop.zoom} onChange={(event) => update({ zoom: Number(event.target.value) })} /></label>
        </div>
        <div className="crop-editor-actions"><button type="button" className="button button--ghost" onClick={() => onChange({ ...initialCrop })}><RotateCcw /> Reset</button><button type="button" className="button button--clay" onClick={onDone}><Check /> Use this crop</button></div>
      </section>
    </div>
  )
}

function PhotoStep({ photos, setPhotos, onContinue }) {
  const [cropIndex, setCropIndex] = useState(null)
  const addPhotos = async (files) => {
    if (!files?.length) return
    const incoming = await Promise.all([...files].slice(0, 6 - photos.length).map(loadPhoto))
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
  const updateCrop = (index, crop) => setPhotos((current) => current.map((photo, photoIndex) => photoIndex === index ? { ...photo, crop } : photo))
  const editingPhoto = cropIndex === null ? null : photos[cropIndex]
  return (
    <section className="studio-step photo-step">
      <BotanicalDivider />
      <h1>Add a new treasure</h1>
      <p>Start with a few good photos.</p>
      <label className="choose-photos"><ImagePlus /><span>Choose photos</span><input type="file" accept="image/*" multiple onChange={(event) => { addPhotos(event.target.files); event.target.value = '' }} /></label>
      <small className="photo-limit">Up to 6 photos · the first photo is the cover</small>
      {photos.length ? <div className="studio-photo-grid">{photos.map((photo, index) => <article key={photo.preview} className={index === 0 ? 'studio-photo studio-photo--cover' : 'studio-photo'}>
        <CropFrame photo={photo} label={`Selected item photo ${index + 1}`} />
        {index === 0 ? <span className="cover-label"><Star size={12} /> Cover</span> : null}
        <button type="button" className="remove-photo" onClick={() => remove(index)} aria-label={`Remove photo ${index + 1}`}><X /></button>
        <button type="button" className="crop-photo" onClick={() => setCropIndex(index)} aria-label={`Adjust crop for photo ${index + 1}`}><Crop /> Crop</button>
        <div className="photo-order"><button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Move photo earlier"><ArrowLeft /></button><button type="button" onClick={() => move(index, 1)} disabled={index === photos.length - 1} aria-label="Move photo later"><ArrowRight /></button></div>
      </article>)}</div> : <div className="photo-empty"><Camera /><strong>Your item will look best in natural light</strong><span>Try a cover photo, a close detail, and one view that shows scale.</span></div>}
      <div className="studio-sticky-actions"><button className="button button--clay button--wide" onClick={onContinue} disabled={!photos.length}>Continue <ArrowRight /></button></div>
      {editingPhoto ? <PhotoCropEditor photo={editingPhoto} onChange={(crop) => updateCrop(cropIndex, crop)} onDone={() => setCropIndex(null)} /> : null}
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
      <div className="listing-preview"><CropFrame photo={photos[0]} className="listing-preview-image" label="Listing cover preview" /><div><span>{form.category}</span><h2>{form.title}</h2><strong>${Number(form.price || 0).toFixed(2)}</strong><p>{form.description}</p><small>{Number(form.inventory) === 1 ? 'Only one available' : `${form.inventory} available`}</small></div></div>
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
      const prepared = await Promise.all(photos.map((photo) => prepareProductImage(photo.file, photo.crop)))
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
