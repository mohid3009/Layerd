import React, { Suspense, lazy, useEffect } from 'react'
import { Navigate, Route, Routes, useNavigate, useSearchParams } from 'react-router-dom'
import { DEMO_USERS, SESSION_KEY } from './constants.js'
import Landing from './components/Landing.jsx'
import Login from './components/Login.jsx'
const Dashboard = lazy(() => import('./components/Dashboard.jsx'))
const Building3DView = lazy(() => import('./pages/Building3DView.jsx'))
import Topbar from './components/layout/Topbar.jsx'
import PropertyPassport from './pages/PropertyPassport.jsx'
import ComplaintForm from './pages/ComplaintForm.jsx'
import PropertyRecords from './pages/PropertyRecords.jsx'
import UnifiedPropertyCard from './pages/UnifiedPropertyCard.jsx'
import Profile from './pages/Profile.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

// Heavy libs (maplibre ~800 KB, three + drei ~1 MB) load only on the
// pages / views that actually need them.
const UlpinView = lazy(() => import('./components/UlpinView.jsx'))

const PageFallback = () => <div className="loading muted">loading…</div>

// ── session helpers ───────────────────────────────────────────────────────────

function loadSession() {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)) || null } catch { return null }
}
function saveSession(s) {
  if (s) sessionStorage.setItem(SESSION_KEY, JSON.stringify(s))
  else   sessionStorage.removeItem(SESSION_KEY)
}

// ── page wrapper (shared chrome for portal pages) ─────────────────────────────

/**
 * Wraps a page component with the app topbar and a centred content column.
 * `maxW` controls the max-width of the content area.
 */
function PageShell({ session, onLogout, onSwitchRole, maxW = '1100px', children }) {
  return (
    <div className="app min-h-screen citizen-dash" style={{ background: '#F5F6F8', color: '#1C2530', overflowY: 'auto' }}>
      <Topbar session={session} onLogout={onLogout} onSwitchRole={onSwitchRole} />
      <main className="flex-1 p-5 w-full mx-auto" style={{ maxWidth: maxW }}>
        {children}
      </main>
    </div>
  )
}

// ── root component ────────────────────────────────────────────────────────────

import { useState } from 'react'

export default function App() {
  const [session, setSession] = useState(loadSession)

  // Linear-style cursor spotlight: track the pointer over glass cards and
  // expose its position as CSS vars consumed by the card ::after glow.
  useEffect(() => {
    const onMove = (e) => {
      const el = e.target?.closest?.('.panel-section, .stat-card, .prop-card')
      if (!el) return
      const r = el.getBoundingClientRect()
      el.style.setProperty('--mx', `${e.clientX - r.left}px`)
      el.style.setProperty('--my', `${e.clientY - r.top}px`)
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  const updateSession = (s) => { setSession(s); saveSession(s) }

  const switchRole = (newRole) => {
    updateSession(DEMO_USERS[newRole] ?? DEMO_USERS.citizen)
  }

  const sharedProps = {
    onLogout:     () => updateSession(null),
    onSwitchRole: switchRole,
  }

  return (
    <Suspense fallback={<PageFallback />}>
    <Routes>
      {/* Landing / login */}
      <Route path="/"        element={<Home setSession={updateSession} />} />
      {/* /landing kept for backwards-compat deep links */}
      <Route path="/landing" element={<Home setSession={updateSession} />} />
      <Route path="/login"   element={<LoginRoute session={session} setSession={updateSession} />} />

      {/* Main dashboard */}
      <Route path="/dashboard" element={<Dashboard session={session} {...sharedProps} />} />

      {/* Property passport — accessible via two URL shapes */}
      <Route path="/passport/:id"        element={<PageShell session={session} {...sharedProps} maxW="1100px"><PropertyPassport /></PageShell>} />
      <Route path="/portal/passport/:id" element={<PageShell session={session} {...sharedProps} maxW="1100px"><PropertyPassport /></PageShell>} />

      <Route path="/portal/building/:id/3d" element={<PageShell session={session} {...sharedProps}><Building3DView /></PageShell>} />
      {/* Portal pages */}
      <Route path="/portal/records"      element={<PageShell session={session} {...sharedProps} maxW="1100px"><PropertyRecords /></PageShell>} />
      <Route path="/portal/upc/:id"      element={<PageShell session={session} {...sharedProps} maxW="800px"><UnifiedPropertyCard /></PageShell>} />
      <Route path="/portal/report/:unitId" element={<PageShell session={session} {...sharedProps} maxW="800px"><ComplaintForm /></PageShell>} />
      <Route path="/portal/profile"      element={<PageShell session={session} {...sharedProps} maxW="800px"><Profile onLogout={() => updateSession(null)} /></PageShell>} />

      {/* 3D ULPIN view — lazy-loaded, wrapped in ErrorBoundary */}
      <Route
        path="/ulpin"
        element={
          <div className="app">
            <Topbar session={session} onLogout={() => updateSession(null)} onSwitchRole={switchRole} />
            <ErrorBoundary>
              <Suspense fallback={<PageFallback />}>
                <UlpinView session={session} />
              </Suspense>
            </ErrorBoundary>
          </div>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
    </Suspense>
  )
}

// ── route-level components ────────────────────────────────────────────────────

function Home({ setSession }) {
  const navigate = useNavigate()
  return (
    <Landing
      onLogin={(s) => { setSession(s); navigate('/dashboard') }}
    />
  )
}

function LoginRoute({ session, setSession }) {
  const navigate  = useNavigate()
  const [params]  = useSearchParams()
  const reqRole   = params.get('role')

  useEffect(() => {
    if (reqRole && DEMO_USERS[reqRole]) {
      setSession(DEMO_USERS[reqRole])
      navigate('/dashboard')
    }
  }, [reqRole, setSession, navigate])

  return (
    <Login
      initialRole={reqRole || session?.role || 'citizen'}
      onLogin={(s) => { setSession(s); navigate('/dashboard') }}
      onBack={() => navigate('/')}
    />
  )
}
