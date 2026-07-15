export function BrandMark({ light = false }) {
  return (
    <span className={`brand-mark${light ? ' brand-mark--light' : ''}`} aria-hidden="true">
      <svg viewBox="0 0 48 48" role="img">
        <path d="M9 31c6-2 10-7 13-16 2 8 1 15-3 20" />
        <path d="M15 27c-3-4-5-8-5-12 5 2 8 5 10 9" />
        <path d="M25 27c1-8 6-13 14-14-1 9-6 15-15 18" />
        <path d="M29 20c4 0 7 2 9 5" />
        <path d="M26 34c5-1 9-3 12-7" />
        <circle cx="36" cy="18" r="1.2" fill="currentColor" stroke="none" />
      </svg>
    </span>
  )
}
