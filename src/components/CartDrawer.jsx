import { ArrowRight, Minus, Plus, ShoppingBag, X } from 'lucide-react'

export function CartDrawer({ open, cart, onClose, updateQuantity, onCheckout, checkoutState }) {
  const total = cart.reduce((sum, line) => sum + line.item.price * line.quantity, 0)
  return (
    <>
      <div className={open ? 'drawer-scrim drawer-scrim--open' : 'drawer-scrim'} onClick={onClose} />
      <aside className={open ? 'cart-drawer cart-drawer--open' : 'cart-drawer'} aria-hidden={!open} aria-label="Shopping bag">
        <div className="drawer-header">
          <h2>Your bag</h2>
          <button className="icon-button" onClick={onClose} aria-label="Close bag"><X /></button>
        </div>
        <div className="cart-lines">
          {cart.length === 0 ? (
            <div className="empty-bag"><ShoppingBag /><p>Your bag is still light.</p><span>Find something with a little story.</span></div>
          ) : cart.map(({ item, quantity }) => (
            <article className="cart-line" key={item.id}>
              <img src={item.image} alt="" />
              <div><h3>{item.title}</h3><p>${item.price.toFixed(2)}</p>
                <div className="quantity-control">
                  <button onClick={() => updateQuantity(item.id, quantity - 1)} aria-label="Decrease quantity"><Minus size={13} /></button>
                  <span>{quantity}</span>
                  <button onClick={() => updateQuantity(item.id, quantity + 1)} aria-label="Increase quantity" disabled={quantity >= item.inventory}><Plus size={13} /></button>
                </div>
              </div>
            </article>
          ))}
        </div>
        {cart.length > 0 ? (
          <div className="cart-footer">
            <div className="total-line"><span>Subtotal</span><strong>${total.toFixed(2)}</strong></div>
            <p>Shipping and taxes are calculated securely at checkout.</p>
            {checkoutState.error ? <p className="form-error">{checkoutState.error}</p> : null}
            <button className="button button--clay button--wide" onClick={onCheckout} disabled={checkoutState.loading}>
              {checkoutState.loading ? 'Opening checkout…' : 'Checkout securely'} <ArrowRight size={17} />
            </button>
            <span className="stripe-note">Secure Stripe checkout coming next</span>
          </div>
        ) : null}
      </aside>
    </>
  )
}
