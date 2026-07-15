import { Menu, Search, ShoppingBag, X } from 'lucide-react'
import { BrandMark } from './BrandMark.jsx'

export function Header({ bagCount, onBag, menuOpen, setMenuOpen, onStudio }) {
  return (
    <header className="site-header">
      <a className="brand" href="#top" aria-label="Fern and Finch home">
        <BrandMark />
        <span>Fern <i>&</i> Finch</span>
      </a>
      <button className="icon-button mobile-menu" onClick={() => setMenuOpen((open) => !open)} aria-label="Toggle menu">
        {menuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
      <nav className={menuOpen ? 'primary-nav primary-nav--open' : 'primary-nav'} aria-label="Primary navigation">
        <a href="#shop" onClick={() => setMenuOpen(false)}>Shop</a>
        <a href="#story" onClick={() => setMenuOpen(false)}>Our Story</a>
        <a href="#journal" onClick={() => setMenuOpen(false)}>Journal</a>
        <button className="nav-studio" onClick={onStudio}>Maker Studio</button>
      </nav>
      <div className="header-tools">
        <button className="text-tool" aria-label="Search products"><Search size={17} /> <span>Search</span></button>
        <button className="text-tool bag-tool" onClick={onBag}><ShoppingBag size={17} /> <span>Bag ({bagCount})</span></button>
      </div>
    </header>
  )
}
