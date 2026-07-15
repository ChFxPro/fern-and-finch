export function BrandMark({ light = false }) {
  return (
    <span className={`brand-mark${light ? ' brand-mark--light' : ''}`} aria-hidden="true">
      <svg viewBox="0 0 64 64" role="img">
        <path d="M8 51c12-2 22-7 30-17" />
        <path d="M12 48c-1-6 1-11 5-15 2 6 1 11-2 15M20 44c0-6 3-11 8-14 1 6-1 11-5 14M29 39c1-5 5-9 10-11" />
        <path d="M22 33c-3-8 1-17 10-20 7-2 13 1 16 7 3 8-1 16-10 18-6 2-12 0-16-5Z" />
        <path d="M26 31c5-1 9-5 11-11 2 6 1 11-2 16M47 20l8 3-8 3" />
        <circle cx="43" cy="18" r="1.4" fill="currentColor" stroke="none" />
        <path d="M28 13c-1-4 1-7 5-9M34 11c1-4 4-6 8-6" />
      </svg>
    </span>
  )
}
