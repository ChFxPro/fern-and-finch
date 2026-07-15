import { ArrowDown, ArrowRight, CheckCircle2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { BrandMark } from './components/BrandMark.jsx'
import { BotanicalDivider } from './components/BotanicalDivider.jsx'
import { CartDrawer } from './components/CartDrawer.jsx'
import { Header } from './components/Header.jsx'
import { ProductCard } from './components/ProductCard.jsx'
import { ProductDialog } from './components/ProductDialog.jsx'
import { Studio } from './components/Studio.jsx'
import { listProducts } from './lib/store.js'

const FILTERS = ['All', 'Art', 'Found', 'Handmade']
const CART_KEY = 'fern-finch-cart-v1'

export function App() {
  const [items, setItems] = useState([])
  const [filter, setFilter] = useState('All')
  const [selected, setSelected] = useState(null)
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem(CART_KEY) || '[]'))
  const [cartOpen, setCartOpen] = useState(false)
  const [studioOpen, setStudioOpen] = useState(() => new URLSearchParams(location.search).has('studio'))
  const [menuOpen, setMenuOpen] = useState(false)
  const [checkoutState, setCheckoutState] = useState({ loading: false, error: '' })
  const [emailState, setEmailState] = useState('idle')
  const [notice, setNotice] = useState(() => new URLSearchParams(location.search).get('order'))

  useEffect(() => { listProducts().then(setItems).catch(() => setItems([])) }, [])
  useEffect(() => localStorage.setItem(CART_KEY, JSON.stringify(cart)), [cart])

  const visibleItems = useMemo(() => filter === 'All' ? items : items.filter((item) => item.category === filter), [filter, items])
  const bagCount = cart.reduce((sum, line) => sum + line.quantity, 0)

  const addToCart = (item) => {
    setCart((current) => {
      const existing = current.find((line) => line.item.id === item.id)
      if (existing) return current.map((line) => line.item.id === item.id ? { ...line, quantity: Math.min(line.quantity + 1, item.inventory) } : line)
      return [...current, { item, quantity: 1 }]
    })
    setCartOpen(true)
  }
  const updateQuantity = (id, quantity) => setCart((current) => quantity < 1 ? current.filter((line) => line.item.id !== id) : current.map((line) => line.item.id === id ? { ...line, quantity } : line))
  const checkout = async () => {
    setCheckoutState({ loading: false, error: 'Secure checkout is the next step and will be available soon.' })
  }
  const publish = (item) => {
    if (item.active) setItems((current) => [item, ...current])
    setFilter('All')
  }
  const updateListing = (updated) => {
    setItems((current) => {
      if (updated.active === false) return current.filter((item) => item.id !== updated.id)
      const exists = current.some((item) => item.id === updated.id)
      return exists ? current.map((item) => item.id === updated.id ? updated : item) : [updated, ...current]
    })
    setCart((current) => {
      if (updated.active === false || updated.inventory < 1) return current.filter((line) => line.item.id !== updated.id)
      return current.map((line) => line.item.id === updated.id ? { item: updated, quantity: Math.min(line.quantity, updated.inventory) } : line)
    })
  }

  return (
    <div id="top">
      {notice === 'success' ? <div className="order-notice"><CheckCircle2 /> Thank you — your order is safely in. <button onClick={() => setNotice(null)}>Close</button></div> : null}
      <Header bagCount={bagCount} onBag={() => setCartOpen(true)} menuOpen={menuOpen} setMenuOpen={setMenuOpen} onStudio={() => setStudioOpen(true)} />
      <main>
        <section className="hero" aria-labelledby="hero-title">
          <img className="hero-background" src={`${import.meta.env.BASE_URL}assets/fern-finch-hero.webp`} alt="A warm, plant-filled maker's studio with botanical art and gathered objects" />
          <div className="hero-copy">
            <BotanicalDivider light />
            <h1 id="hero-title">Made, found,<br />and gathered<br /><em>with care.</em></h1>
            <p>Original art, storied finds, and small-batch pieces for a home that feels like yours.</p>
            <a className="button button--clay" href="#shop">Explore the collection <ArrowDown size={17} /></a>
          </div>
        </section>

        <section className="collection" id="shop">
          <div className="section-heading">
            <div><BotanicalDivider /><h2>Fresh from the worktable</h2></div>
            <p>Each object is made or chosen by hand. Once a one-of-a-kind piece is gone, it begins its next story.</p>
          </div>
          <div className="filter-row" role="group" aria-label="Filter products">
            {FILTERS.map((name) => <button key={name} className={filter === name ? 'active' : ''} onClick={() => setFilter(name)}>{name}</button>)}
          </div>
          <div className="product-grid">
            {visibleItems.map((item, index) => <ProductCard key={item.id} item={item} index={index} onSelect={setSelected} onAdd={addToCart} />)}
          </div>
          {visibleItems.length === 0 ? <p className="empty-filter">Nothing is resting in this corner of the shop just yet.</p> : null}
        </section>

        <section className="story" id="story">
          <div className="story-image"><img src={`${import.meta.env.BASE_URL}assets/fern-finch-story.webp`} alt="A sunlit maker's corner filled with ferns, botanical studies, and well-used tools" /></div>
          <div className="story-copy"><BotanicalDivider light /><h2>Objects with a little<br /><em>life in them.</em></h2><p>I’ve always loved things that show the hand that made them, the miles they’ve traveled, or the quiet beauty someone else nearly missed.</p><p>Fern & Finch is my gathering place for those pieces — made at my own table or found while wandering.</p><a href="mailto:hello@fernandfinch.shop">Meet the maker <ArrowRight size={17} /></a><span className="signature">— Mom</span></div>
        </section>

        <section className="seasonal" aria-label="Seasonal collection">
          <img src={`${import.meta.env.BASE_URL}assets/fern-finch-seasonal.webp`} alt="A warm seasonal still life of a fern mug, wool, old books, and gathered greenery" />
          <div className="seasonal-copy"><h2>Gathered for the season</h2><BotanicalDivider light /><a className="button button--clay" href="#shop">Shop the seasonal edit <ArrowRight size={17} /></a></div>
        </section>

        <section className="newsletter">
          <BrandMark />
          <div><h2>A small note from the woods</h2><p>New pieces, studio stories, and the occasional lovely thing worth sharing. Never too much.</p></div>
          {emailState === 'joined' ? <div className="joined"><CheckCircle2 /> You’re on the list. Welcome in.</div> : (
            <form onSubmit={(event) => { event.preventDefault(); setEmailState('joined') }}><label><span className="sr-only">Your email address</span><input type="email" placeholder="Your email" required /></label><button>Join the list <ArrowRight size={16} /></button></form>
          )}
        </section>
      </main>

      <footer>
        <div className="footer-brand"><BrandMark light /><span>Fern <i>&</i> Finch</span><p>Made, found, and gathered with care.</p></div>
          <div><h3>Wander</h3><a href="#shop">Shop all</a><a href="#story">Our story</a></div>
        <div><h3>Help</h3><a href="mailto:hello@fernandfinch.shop">Contact</a><a href="#shipping">Shipping & returns</a><button onClick={() => setStudioOpen(true)}>Maker Studio</button></div>
        <div className="footer-social"><a href="https://instagram.com" aria-label="Instagram"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4.2" /><circle cx="17.4" cy="6.7" r="1" fill="currentColor" stroke="none" /></svg></a></div>
        <p className="copyright">© {new Date().getFullYear()} Fern & Finch. All the good things, thoughtfully gathered.</p>
      </footer>

      <ProductDialog item={selected} onClose={() => setSelected(null)} onAdd={addToCart} />
      <CartDrawer open={cartOpen} cart={cart} onClose={() => setCartOpen(false)} updateQuantity={updateQuantity} onCheckout={checkout} checkoutState={checkoutState} />
      <Studio open={studioOpen} onClose={() => setStudioOpen(false)} onPublished={publish} onItemChanged={updateListing} />
    </div>
  )
}
