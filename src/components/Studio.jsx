import { Camera, Check, ChevronLeft, ImagePlus, ListTree, LoaderCircle, LogOut, Mail, Plus, Sparkles, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { CatalogManager } from './CatalogManager.jsx'
import { prepareProductImage } from '../lib/images.js'
import { checkAdmin, createProduct, uploadProductImage } from '../lib/store.js'
import { supabase, supabaseConfigured } from '../lib/supabase.js'

const initialForm = { title: '', category: 'Art', price: '', description: '', story: '', materials: '', inventory: '1', featured: false }
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
      <span><Mail /></span><p className="eyebrow">Private maker access</p><h1>Welcome to the studio.</h1><p>Enter your email and we’ll send a safe, password-free sign-in link.</p>
      <label className="field"><span>Email address</span><input type="email" inputMode="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required /></label>
      {state.sent ? <p className="studio-sent"><Check /> Check your email, then tap the sign-in link.</p> : null}
      {state.error ? <p className="form-error">{state.error}</p> : null}
      <button className="button button--pine button--wide" disabled={state.loading}>{state.loading ? <LoaderCircle className="spin" /> : <Mail />} Email my sign-in link</button>
    </form>
  )
}

export function Studio({ open, onClose, onPublished, onItemChanged }) {
  const [session, setSession] = useState(null)
  const [mode, setMode] = useState('add')
  const [form, setForm] = useState(initialForm)
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState('')
  const [status, setStatus] = useState({ loading: false, error: '', success: false })

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])
  if (!open) return null
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  const chooseImage = (file) => { if (file) { setImage(file); setPreview(URL.createObjectURL(file)) } }
  const publish = async (event) => {
    event.preventDefault()
    setStatus({ loading: true, error: '', success: false })
    try {
      const prepared = await prepareProductImage(image)
      const imageUrl = await uploadProductImage(prepared)
      const result = await createProduct({
        id: `${slugify(form.title) || 'piece'}-${crypto.randomUUID().slice(0, 8)}`,
        title: form.title.trim(), category: form.category, price: Number(form.price), description: form.description.trim(),
        story: form.story.trim(), materials: form.materials.trim(), inventory: Number(form.inventory), featured: form.featured,
        active: true, image: imageUrl,
      })
      onPublished(result)
      setStatus({ loading: false, error: '', success: true })
      setForm(initialForm); setImage(null); setPreview('')
    } catch (error) { setStatus({ loading: false, error: error.message, success: false }) }
  }

  return (
    <div className="studio-shell">
      <header className="studio-header">
        <button className="studio-back" onClick={onClose}><ChevronLeft size={20} /> Store</button>
        <span><Sparkles size={16} /> Maker Studio</span>
        {session ? <button className="icon-button" onClick={() => supabase.auth.signOut().then(() => setSession(null))} aria-label="Sign out"><LogOut /></button> : <button className="icon-button" onClick={onClose} aria-label="Close studio"><X /></button>}
      </header>
      {!session ? <main className="studio-main"><StudioAccess onReady={setSession} /></main> : <>
        <nav className="studio-mode-tabs" aria-label="Maker Studio sections"><button className={mode === 'add' ? 'active' : ''} onClick={() => setMode('add')}><Plus size={16} /> Add item</button><button className={mode === 'manage' ? 'active' : ''} onClick={() => setMode('manage')}><ListTree size={16} /> Manage shop</button></nav>
        <main className="studio-main">
          {mode === 'manage' ? <CatalogManager onItemChanged={onItemChanged} /> : status.success ? (
            <section className="publish-success"><span><Check /></span><h1>It’s in the shop.</h1><p>Your new piece is live and matches the rest of the collection.</p><button className="button button--pine" onClick={() => setStatus((current) => ({ ...current, success: false }))}>Add another piece</button><button className="text-link" onClick={onClose}>See it in the store</button></section>
          ) : (
            <form className="studio-form" onSubmit={publish}>
              <div className="studio-intro"><span>New item</span><h1>Add something beautiful.</h1><p>A good iPhone photo and a few details are all you need.</p></div>
              <label className={preview ? 'photo-drop photo-drop--filled' : 'photo-drop'}>{preview ? <img src={preview} alt="New item preview" /> : <><span><Camera /></span><strong>Take or choose a photo</strong><small>Portrait photos work especially well</small></>}<input type="file" accept="image/*" capture="environment" onChange={(event) => chooseImage(event.target.files[0])} required />{preview ? <em><ImagePlus size={16} /> Change photo</em> : null}</label>
              <div className="field-grid">
                <label className="field field--wide"><span>Item name</span><input value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="e.g. Little Wren Bowl" required /></label>
                <label className="field"><span>Kind of piece</span><select value={form.category} onChange={(e) => update('category', e.target.value)}><option>Art</option><option>Found</option><option>Handmade</option></select></label>
                <label className="field"><span>Price</span><div className="money-input"><b>$</b><input type="number" inputMode="decimal" min="1" step="0.01" value={form.price} onChange={(e) => update('price', e.target.value)} placeholder="0.00" required /></div></label>
                <label className="field field--wide"><span>Short description</span><textarea value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="What is it, and what makes it special?" rows="3" /></label>
                <label className="field field--wide"><span>Its little story <small>optional</small></span><textarea value={form.story} onChange={(e) => update('story', e.target.value)} placeholder="Where did you find it? What inspired it?" rows="3" /></label>
                <label className="field field--wide"><span>Materials & details</span><input value={form.materials} onChange={(e) => update('materials', e.target.value)} placeholder="Stoneware, vintage brass, 8 × 10 in…" /></label>
                <label className="field"><span>How many?</span><input type="number" inputMode="numeric" min="1" value={form.inventory} onChange={(e) => update('inventory', e.target.value)} /></label>
              </div>
              <label className="feature-toggle"><input type="checkbox" checked={form.featured} onChange={(e) => update('featured', e.target.checked)} /><span><b>Feature on the home page</b><small>Give this piece a little more attention</small></span></label>
              {status.error ? <p className="form-error">{status.error}</p> : null}
              <button className="button button--clay button--wide publish-button" disabled={status.loading}>{status.loading ? <LoaderCircle className="spin" /> : <Sparkles size={17} />} {status.loading ? 'Preparing & publishing…' : 'Publish to the shop'}</button>
            </form>
          )}
        </main>
      </>}
    </div>
  )
}
