import { Bell } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { currentUser, openComplaints } from '../../mockData.js'

export default function Header() {
  const navigate = useNavigate()
  const alerts = openComplaints().length
  const initials = currentUser.name.split(' ').map((w) => w[0]).join('')
  return (
    <header className="sticky top-0 z-40 h-[60px] bg-navy text-white flex items-center gap-4 px-5">
      <Link to="/portal" className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-lg bg-white/10 grid place-items-center font-extrabold text-sm">L</div>
        <div className="leading-tight">
          <div className="font-bold text-[15px]">Layerd Portal</div>
          <div className="text-[11px] text-white/60">National 3D Property Records</div>
        </div>
      </Link>
      <div className="flex-1 hidden min-[900px]:block" />
      <input
        className="hidden min-[900px]:block w-72 bg-white/10 border border-white/15 rounded-[10px] px-3 py-2 text-sm placeholder-white/50 outline-none focus:border-white/40"
        placeholder="Search ULPIN, owner or address…"
      />
      <button
        className="relative w-9 h-9 grid place-items-center rounded-lg hover:bg-white/10"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {alerts > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent" />
        )}
      </button>
      <button
        className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 hover:bg-white/10"
        onClick={() => navigate('/portal/profile')}
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue to-accent grid place-items-center text-xs font-bold">
          {initials}
        </div>
        <div className="text-left leading-tight hidden min-[900px]:block">
          <div className="text-sm font-semibold">{currentUser.name}</div>
          <div className="text-[11px] text-white/60">Citizen Login</div>
        </div>
      </button>
    </header>
  )
}