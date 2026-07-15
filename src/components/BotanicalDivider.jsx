export function BotanicalDivider({ light = false }) {
  return (
    <span className={`botanical-divider${light ? ' botanical-divider--light' : ''}`} aria-hidden="true">
      <i />
      <svg viewBox="0 0 94 24">
        <path d="M4 18c15-1 26-6 34-15M12 16c-1-4 0-7 3-10 2 4 1 7-1 10M20 13c0-4 2-7 5-9 1 4-1 7-3 9M28 9c1-3 3-5 6-6" />
        <path d="M47 5c2 5 2 10 0 14-2-4-2-9 0-14ZM40 12c5-2 10-2 14 0-4 2-9 2-14 0Z" />
        <path d="M90 18c-15-1-26-6-34-15M82 16c1-4 0-7-3-10-2 4-1 7 1 10M74 13c0-4-2-7-5-9-1 4 1 7 3 9M66 9c-1-3-3-5-6-6" />
      </svg>
      <i />
    </span>
  )
}
