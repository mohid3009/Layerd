export default function Footer() {
  return (
    <footer className="border-t border-line bg-surface px-6 py-3 flex flex-wrap gap-2 items-center justify-between text-xs text-ink-mid">
      <span>© 2026 Layerd · National 3D Property Records · Demo build</span>
      <div className="flex gap-4">
        <a className="hover:text-ink" href="#">Terms</a>
        <a className="hover:text-ink" href="#">Privacy</a>
        <a className="hover:text-ink" href="#">Contact</a>
        <a className="hover:text-ink" href="#">Ministry of Rural Development</a>
      </div>
    </footer>
  )
}