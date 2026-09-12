import { useNavigate, useOutletContext } from 'react-router-dom'
import { Globe, Bell, Shield, HelpCircle, ChevronRight, LogOut } from 'lucide-react'
import Breadcrumb from '../components/ui/Breadcrumb.jsx'
import { currentUser } from '../mockData.js'

export default function Profile({ onLogout: propLogout }) {
  const navigate = useNavigate()
  const outlet = useOutletContext()
  const onLogout = propLogout || outlet?.onLogout || (() => {})
  const initials = currentUser.name.split(' ').map((w) => w[0]).join('')

  const settings = [
    { icon: <Globe size={16} />, label: 'Language', value: 'English' },
    { icon: <Bell size={16} />, label: 'Notifications', value: 'On' },
    { icon: <Shield size={16} />, label: 'Privacy & Data' },
    { icon: <HelpCircle size={16} />, label: 'Help & Support' },
  ]

  return (
    <div className="max-w-[640px]">
      <Breadcrumb current="Profile & Settings" />

      <div className="bg-surface border border-line rounded-[14px] p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue to-accent grid place-items-center text-white text-lg font-extrabold">
          {initials}
        </div>
        <div>
          <div className="text-lg font-extrabold text-ink">{currentUser.name}</div>
          <div className="text-xs text-ink-mid font-id">{currentUser.citizenId}</div>
        </div>
      </div>

      <div className="bg-surface border border-line rounded-[14px] p-4 mt-4">
        <h3 className="text-sm font-bold text-ink mb-3">Linked identity</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-wide text-ink-mid mb-0.5">Aadhaar</div>
            <div className="text-sm font-bold text-ink font-id">{currentUser.aadhaarMasked}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wide text-ink-mid mb-0.5">Mobile</div>
            <div className="text-sm font-bold text-ink font-id">{currentUser.mobileMasked}</div>
          </div>
        </div>
        <p className="text-[11px] text-ink-soft mt-3">
          Mocked demonstration data — this build is not linked to Aadhaar or DigiLocker.
        </p>
      </div>

      <div className="bg-surface border border-line rounded-[14px] p-2 mt-4">
        {settings.map((s, i) => (
          <button
            key={s.label}
            className={`w-full flex items-center gap-3 px-3 py-3 text-left hover:bg-neutralbg rounded-[10px] ${
              i === settings.length - 1 ? '' : 'border-b border-dashed border-line'
            }`}
          >
            <span className="text-ink-mid">{s.icon}</span>
            <span className="text-sm font-medium text-ink">{s.label}</span>
            {s.value && <span className="ml-auto text-xs text-ink-mid">{s.value}</span>}
            <span className={`${s.value ? '' : 'ml-auto'} text-ink-soft`}>
              <ChevronRight size={15} />
            </span>
          </button>
        ))}
      </div>

      <button
        onClick={() => {
          onLogout()
          navigate('/login')
        }}
        className="mt-4 w-full bg-surface border border-line text-accent text-sm font-semibold rounded-[10px] px-4 py-2.5 hover:bg-[#FBE9E8] inline-flex items-center justify-center gap-2"
      >
        <LogOut size={15} /> Log Out
      </button>
    </div>
  )
}