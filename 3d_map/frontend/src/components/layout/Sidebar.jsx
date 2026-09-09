import { NavLink } from 'react-router-dom'
import { LayoutDashboard, FileText, ShieldCheck, MessageSquareWarning, User } from 'lucide-react'
import { currentUser, ownedUnits, openComplaints } from '../../mockData.js'

const base =
  'flex items-center gap-3 px-3 py-2 mx-3 rounded-[10px] text-sm font-medium border-l-[3px] border-l-transparent'
const active = 'border-l-accent bg-neutralbg text-accent'
const idle = 'text-ink hover:bg-neutralbg'

export default function Sidebar() {
  const firstOwned = ownedUnits()[0]
  const openCount = openComplaints().length
  return (
    <aside className="hidden min-[900px]:flex w-[232px] shrink-0 flex-col bg-surface border-r border-line sticky top-[60px] h-[calc(100vh-60px)] overflow-y-auto py-4">
      <div className="text-[10px] uppercase tracking-widest text-ink-soft px-6 mb-2">Menu</div>
      <nav className="flex flex-col gap-0.5">
        <NavLink to="/portal" end className={({ isActive }) => `${base} ${isActive ? active : idle}`}>
          <LayoutDashboard size={17} /> Dashboard
        </NavLink>
        <NavLink to="/portal/records" className={({ isActive }) => `${base} ${isActive ? active : idle}`}>
          <FileText size={17} /> Property Records
        </NavLink>
        {firstOwned && (
          <NavLink
            to={`/portal/passport/${firstOwned.id}`}
            className={({ isActive }) => `${base} ${isActive ? active : idle}`}
          >
            <ShieldCheck size={17} /> My Passport
          </NavLink>
        )}
        {firstOwned && (
          <NavLink
            to={`/portal/report/${firstOwned.id}`}
            className={({ isActive }) => `${base} ${isActive ? active : idle}`}
          >
            <MessageSquareWarning size={17} /> Report Issue
            {openCount > 0 && (
              <span className="ml-auto bg-accent text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">
                {openCount}
              </span>
            )}
          </NavLink>
        )}
      </nav>

      <div className="text-[10px] uppercase tracking-widest text-ink-soft px-6 mt-6 mb-2">Account</div>
      <nav className="flex flex-col gap-0.5">
        <NavLink to="/portal/profile" className={({ isActive }) => `${base} ${isActive ? active : idle}`}>
          <User size={17} /> Profile &amp; Settings
        </NavLink>
      </nav>

      <div className="mt-auto mx-3 mt-6 rounded-[12px] bg-neutralbg border border-line p-3.5">
        <div className="text-xs font-bold text-ink">Ministry of Rural Development</div>
        <div className="text-[11px] text-ink-mid mt-0.5">
          Government of India Â· National 3D ULPIN Framework
        </div>
      </div>
    </aside>
  )
}
