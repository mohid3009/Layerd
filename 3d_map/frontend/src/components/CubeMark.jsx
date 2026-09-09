// The Layerd mark — an isometric cube, same geometry as the landing page
// hero. `tint` re-colors all three faces (top full, left 55%, right 28%)
// so the mark works on both the dark landing and the espresso navbar.
export default function CubeMark({ size = 16, tint = '#E8E8E8' }) {
  const n = parseInt(tint.slice(1), 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path d="M12 2 21 7l-9 5-9-5 9-5Z" fill={tint} />
      <path d="M3 7v10l9 5V12L3 7Z" fill={`rgba(${r},${g},${b},0.55)`} />
      <path d="M21 7v10l-9 5V12l9-5Z" fill={`rgba(${r},${g},${b},0.28)`} />
    </svg>
  )
}