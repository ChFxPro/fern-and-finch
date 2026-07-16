export function BrandMark({ light = false }) {
  return (
    <span className={`brand-mark${light ? ' brand-mark--light' : ''}`} aria-hidden="true">
      <img src={`${import.meta.env.BASE_URL}assets/fern-finch-brandmark.png`} alt="" decoding="async" />
    </span>
  )
}
