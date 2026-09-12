import React, { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, NavLink, Route, Routes, useNavigate, useSearchParams } from 'react-router-dom'
import { getSavedBuildings, getSessions, deleteSession, updateBuilding, confirmBuildingEdit, deleteBuilding as deleteBuildingApi, getRegion, allUnits, demoBaseUlpin, digipin, citizenOwns, getPendingUnitEdits, confirmUnitCorrection, rejectUnitCorrection } from './api.js'
import Landing from './components/Landing.jsx'
import CitizenDashboard from './components/CitizenDashboard.jsx'
import CubeMark from './components/CubeMark.jsx'
import Login from './components/Login.jsx'
import BuildingsMap from './components/BuildingsMap.jsx'
import PropertyPassport from './pages/PropertyPassport.jsx'
import ComplaintForm from './pages/ComplaintForm.jsx'
import PropertyRecords from './pages/PropertyRecords.jsx'
import UnifiedPropertyCard from './pages/UnifiedPropertyCard.jsx'
import Profile from './pages/Profile.jsx'
import { Building2, ShieldCheck, FileText, Layers, LogOut } from 'lucide-react'

// heavy libs (maplibre ~800 KB, three + drei ~1 MB) load only on the pages /
// views that actually need them
const UlpinView = lazy(() => import('./components/UlpinView.jsx'))

const PageFallback = () => <div className="loading muted">loading…</div>

const ROLE_LABELS = { citizen: 'Citizen', surveyor: 'Surveyor', registrar: 'Registrar' }
const SESSION_KEY = 'layerd-session'

function loadSession() {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY)) || null
  } catch {
    return null
  }
}

function saveSession(s) {
  if (s) sessionStorage.setItem(SESSION_KEY, JSON.stringify(s))
  else sessionStorage.removeItem(SESSION_KEY)
}

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

  const updateSession = (s) => {
    setSession(s)
    saveSession(s)
  }

  const switchRole = (newRole) => {
    const demoUsers = {
      citizen: { username: 'citizen1', name: 'Citizen 1', role: 'citizen' },
      surveyor: { username: 'surveyor1', name: 'Surveyor 1', role: 'surveyor' },
      registrar: { username: 'registrar1', name: 'Registrar 1', role: 'registrar' },
    }
    const user = demoUsers[newRole] || demoUsers.citizen
    updateSession(user)
  }

  return (
    <Routes>
      <Route path="/" element={<Home session={session} setSession={updateSession} />} />
      <Route path="/landing" element={<Home session={session} setSession={updateSession} />} />
      <Route path="/login" element={<LoginRoute session={session} setSession={updateSession} />} />
      <Route
        path="/dashboard"
        element={<Dashboard session={session} onLogout={() => updateSession(null)} onSwitchRole={switchRole} />}
      />
      <Route
        path="/passport/:id"
        element={<PropertyPassportPage session={session} onLogout={() => updateSession(null)} onSwitchRole={switchRole} />}
      />
      <Route
        path="/portal/passport/:id"
        element={<PropertyPassportPage session={session} onLogout={() => updateSession(null)} onSwitchRole={switchRole} />}
      />
      <Route
        path="/portal/records"
        element={<PropertyRecordsPage session={session} onLogout={() => updateSession(null)} onSwitchRole={switchRole} />}
      />
      <Route
        path="/portal/upc/:id"
        element={<UnifiedPropertyCardPage session={session} onLogout={() => updateSession(null)} onSwitchRole={switchRole} />}
      />
      <Route
        path="/portal/report/:unitId"
        element={<ComplaintFormPage session={session} onLogout={() => updateSession(null)} onSwitchRole={switchRole} />}
      />
      <Route
        path="/portal/profile"
        element={<ProfilePage session={session} onLogout={() => updateSession(null)} onSwitchRole={switchRole} />}
      />
      <Route
        path="/ulpin"
        element={<UlpinPage session={session} onLogout={() => updateSession(null)} onSwitchRole={switchRole} />}
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

function Home({ session, setSession }) {
  const navigate = useNavigate()
  return (
    <Landing
      onLogin={(s) => {
        setSession(s)
        navigate('/dashboard')
      }}
    />
  )
}

function LoginRoute({ session, setSession }) {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const reqRole = params.get('role')

  useEffect(() => {
    if (reqRole) {
      const demoUsers = {
        citizen: { username: 'citizen1', name: 'Citizen 1', role: 'citizen' },
        surveyor: { username: 'surveyor1', name: 'Surveyor 1', role: 'surveyor' },
        registrar: { username: 'registrar1', name: 'Registrar 1', role: 'registrar' },
      }
      if (demoUsers[reqRole]) {
        setSession(demoUsers[reqRole])
        navigate('/dashboard')
      }
    }
  }, [reqRole, setSession, navigate])

  return (
    <Login
      initialRole={reqRole || session?.role || 'citizen'}
      onLogin={(s) => {
        setSession(s)
        navigate('/dashboard')
      }}
      onBack={() => navigate('/')}
    />
  )
}

function PropertyPassportPage({ session, onLogout, onSwitchRole }) {
  return (
    <div className="app min-h-screen citizen-dash" style={{ background: '#F5F6F8', color: '#1C2530', overflowY: 'auto' }}>
      <Topbar session={session} onLogout={onLogout} onSwitchRole={onSwitchRole} />
      <main className="flex-1 p-5 max-w-[1100px] w-full mx-auto">
        <PropertyPassport />
      </main>
    </div>
  )
}

function ComplaintFormPage({ session, onLogout, onSwitchRole }) {
  return (
    <div className="app min-h-screen citizen-dash" style={{ background: '#F5F6F8', color: '#1C2530', overflowY: 'auto' }}>
      <Topbar session={session} onLogout={onLogout} onSwitchRole={onSwitchRole} />
      <main className="flex-1 p-5 max-w-[800px] w-full mx-auto">
        <ComplaintForm />
      </main>
    </div>
  )
}

function PropertyRecordsPage({ session, onLogout, onSwitchRole }) {
  return (
    <div className="app min-h-screen citizen-dash" style={{ background: '#F5F6F8', color: '#1C2530', overflowY: 'auto' }}>
      <Topbar session={session} onLogout={onLogout} onSwitchRole={onSwitchRole} />
      <main className="flex-1 p-5 max-w-[1100px] w-full mx-auto">
        <PropertyRecords />
      </main>
    </div>
  )
}

function UnifiedPropertyCardPage({ session, onLogout, onSwitchRole }) {
  return (
    <div className="app min-h-screen citizen-dash" style={{ background: '#F5F6F8', color: '#1C2530', overflowY: 'auto' }}>
      <Topbar session={session} onLogout={onLogout} onSwitchRole={onSwitchRole} />
      <main className="flex-1 p-5 max-w-[800px] w-full mx-auto">
        <UnifiedPropertyCard />
      </main>
    </div>
  )
}

function ProfilePage({ session, onLogout, onSwitchRole }) {
  return (
    <div className="app min-h-screen citizen-dash" style={{ background: '#F5F6F8', color: '#1C2530', overflowY: 'auto' }}>
      <Topbar session={session} onLogout={onLogout} onSwitchRole={onSwitchRole} />
      <main className="flex-1 p-5 max-w-[800px] w-full mx-auto">
        <Profile onLogout={onLogout} />
      </main>
    </div>
  )
}

function Topbar({ session, onLogout, onSwitchRole, children }) {
  const isCitizen = session?.role === 'citizen'
  const isRegistrar = session?.role === 'registrar'
  const isSurveyor = session?.role === 'surveyor'
  const [q, setQ] = useState('')
  const navigate = useNavigate()

  const handleSearch = (e) => {
    e.preventDefault()
    if (q.trim()) {
      navigate(`/passport/${encodeURIComponent(q.trim())}`)
    }
  }

  const roleName = ROLE_LABELS[session?.role || 'citizen'] || 'Citizen'
  const displayName = session?.name || (isRegistrar ? 'Registrar 1' : isSurveyor ? 'Surveyor 1' : 'Citizen 1')
  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <header className="topbar">
      <div className="brand" onClick={() => navigate('/dashboard')} title="Layerd Cadastre Home">
        <div className="brand-mark" aria-label="Layerd logo">
          <CubeMark size={22} tint={isCitizen ? '#4C5BD4' : isRegistrar ? '#C9A45C' : '#8B93E8'} />
        </div>
        <div className="brand-text">
          <h1>Layerd</h1>
          <span className="brand-tag">National 3D Cadastre</span>
        </div>
      </div>

      <nav className="mode-switch">
        {isCitizen ? (
          <>
            <NavLink
              to="/dashboard"
              end
              className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}
              title="Overview & My Properties"
            >
              <Building2 size={14} /> My Properties
            </NavLink>
            <NavLink
              to="/passport/unit-2"
              className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}
              title="Digital Property Passport"
            >
              <ShieldCheck size={14} /> Digital Passport
            </NavLink>
            <NavLink
              to="/portal/records"
              className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}
              title="Browse City Cadastre Records"
            >
              <FileText size={14} /> Records
            </NavLink>
            <NavLink
              to="/ulpin"
              className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}
              title="3D unit tree — floors, ULPINs, owners per building"
            >
              <Layers size={14} /> 3D Unit Tree
            </NavLink>
          </>
        ) : (
          <>
            <NavLink
              to="/dashboard"
              end
              className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}
              title={isRegistrar ? 'Registrar GIS Dashboard & Pending Confirmations' : 'Surveyor Dashboard'}
            >
              <Building2 size={14} /> {isRegistrar ? 'Registrar Dashboard' : 'Dashboard'}
            </NavLink>
            <NavLink
              to="/ulpin"
              className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}
              title="3D unit tree — floors, ULPINs, owners per building"
            >
              <Layers size={14} /> 3D Unit Tree
            </NavLink>
            <NavLink
              to="/portal/records"
              className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}
              title="Browse City Cadastre Records"
            >
              <FileText size={14} /> Records
            </NavLink>
          </>
        )}
      </nav>

      {/* Registrar search or citizen quick-search */}
      {children}
      {isCitizen && !children && (
        <form onSubmit={handleSearch} className="top-search citizen-top-search" style={{ margin: '0 8px' }}>
          <input
            className="search"
            placeholder="Search ULPIN / property ID…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ width: '210px', height: '32px', fontSize: '12px' }}
          />
        </form>
      )}

      {/* Interactive Role Switcher */}
      <div className="role-switcher-wrap" aria-label="Demo Role Switcher">
        <span className="role-label-text">Role:</span>
        <div className="role-pill-group">
          <button
            type="button"
            className={`role-pill-btn role-pill-citizen ${session?.role === 'citizen' ? 'active' : ''}`}
            onClick={() => onSwitchRole?.('citizen')}
            title="Switch to Citizen View"
          >
            👤 Citizen
          </button>
          <button
            type="button"
            className={`role-pill-btn role-pill-registrar ${session?.role === 'registrar' ? 'active' : ''}`}
            onClick={() => onSwitchRole?.('registrar')}
            title="Switch to Registrar View"
          >
            🏛️ Registrar
          </button>
          <button
            type="button"
            className={`role-pill-btn role-pill-surveyor ${session?.role === 'surveyor' ? 'active' : ''}`}
            onClick={() => onSwitchRole?.('surveyor')}
            title="Switch to Surveyor View"
          >
            📐 Surveyor
          </button>
        </div>
      </div>

      {/* User Session profile badge */}
      <div className="session-box">
        <div className="session-user-badge">
          <div className="user-avatar">{initials}</div>
          <div className="session-meta">
            <span className="session-name">{displayName}</span>
            <span className={`session-role role-${session?.role || 'citizen'}`}>{roleName}</span>
          </div>
        </div>
        <button className="btn-logout" onClick={() => { onLogout?.(); navigate('/'); }} title="Log out of session">
          <LogOut size={13} />
          <span>Log out</span>
        </button>
      </div>
    </header>
  )
}

// geographic bbox of one footprint — used for unit DIGIPIN lookups in search
function bboxOfFeature(feature) {
  const ring = feature?.geometry?.type === 'Polygon' ? feature.geometry.coordinates[0] : null
  if (!ring?.length) return null
  const lats = ring.map((c) => c[1])
  const lons = ring.map((c) => c[0])
  return {
    latMin: Math.min(...lats),
    lonMin: Math.min(...lons),
    spanLat: Math.max(...lats) - Math.min(...lats),
    spanLon: Math.max(...lons) - Math.min(...lons),
  }
}

function Dashboard({ session, onLogout, onSwitchRole }) {
  if (!session) return <Navigate to="/" replace />
  const [state, setState] = useState('loading') // loading | ready | empty | unavailable
  const [features, setFeatures] = useState([])
  const [sessions, setSessions] = useState([])
  const [focusSid, setFocusSid] = useState(null) // focused session inside a region
  const [regionData, setRegionData] = useState({}) // cluster key -> { country, region }
  const [selCountry, setSelCountry] = useState(null)
  const [selRegion, setSelRegion] = useState(null) // "country||region" key
  const [selectedId, setSelectedId] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [editingBld, setEditingBld] = useState(false) // inline dashboard edit
  const [editDraft, setEditDraft] = useState(null)
  const [panelTab, setPanelTab] = useState('sessions') // registrar sidebar tab
  const [toast, setToast] = useState(null) // { kind: 'success' | 'info', text }
  const [resolvingIds, setResolvingIds] = useState(() => new Set()) // rows animating out
  const [unavailableErr, setUnavailableErr] = useState(null) // why the DB is unreachable
  const toastTimerRef = useRef(null)
  // first-run orientation: dismissible, remembered for the browser session
  const [guideOpen, setGuideOpen] = useState(() => !sessionStorage.getItem('layerd-guide-seen'))
  const dismissGuide = () => {
    setGuideOpen(false)
    sessionStorage.setItem('layerd-guide-seen', '1')
  }

  useEffect(() => {
    let cancelled = false
    setState('loading')
    Promise.all([getSavedBuildings(), getSessions()])
      .then(([fc, ss]) => {
        if (cancelled) return
        setFeatures(fc.features || [])
        setSessions(ss)
        setSelCountry(null)
        setSelRegion(null)
        setFocusSid(null)
        setState(fc.features?.length ? 'ready' : 'empty')
      })
      .catch((e) => {
        if (cancelled) return
        setFeatures([])
        setSessions([])
        setUnavailableErr(e?.message || 'unknown error')
        setState('unavailable')
      })
    return () => { cancelled = true }
  }, [reloadKey])

  // if PostgreSQL wasn't reachable (e.g. the desktop app launched before the
  // database finished starting), keep retrying every 5 seconds
  useEffect(() => {
    if (state !== 'unavailable') return
    const t = setTimeout(() => setReloadKey((k) => k + 1), 5000)
    return () => { clearTimeout(t) }
  }, [state, reloadKey])

  // proximity clusters of sessions — the bottom level of the country/region
  // tree (nearby scans of the same area stay together under their region)
  const clusters = useMemo(() => {
    const meta = new Map() // session_id -> { count, lon, lat }
    for (const f of features) {
      const sid = f.properties.session_id
      const g = f.geometry
      if (!sid || !g) continue
      const coords = g.type === 'Polygon' ? g.coordinates[0] : (g.coordinates || []).flat()
      if (!coords?.length) continue
      let lon = 0
      let lat = 0
      for (const [x, y] of coords) {
        lon += x
        lat += y
      }
      lon /= coords.length
      lat /= coords.length
      const m = meta.get(sid) || { count: 0, lon: 0, lat: 0 }
      m.count += 1
      m.lon += lon
      m.lat += lat
      meta.set(sid, m)
    }
    const TH = 0.5 // degrees (~55 km) — scans this close share a cluster
    const raw = []
    for (const [sid, m] of meta) {
      const s = { sid, count: m.count, lon: m.lon / m.count, lat: m.lat / m.count }
      let grp = raw.find((g) => Math.abs(g.lat - s.lat) < TH && Math.abs(g.lon - s.lon) < TH)
      if (!grp) {
        grp = { sids: [], lonSum: 0, latSum: 0, buildings: 0 }
        raw.push(grp)
      }
      grp.sids.push(sid)
      grp.lonSum += s.lon
      grp.latSum += s.lat
      grp.buildings += s.count
    }
    const labelOf = (sid) => sessions.find((x) => x.session_id === sid)?.label || sid
    return raw.map((g) => ({
      key: `${(g.latSum / g.sids.length).toFixed(2)},${(g.lonSum / g.sids.length).toFixed(2)}`,
      lat: g.latSum / g.sids.length,
      lon: g.lonSum / g.sids.length,
      sids: g.sids,
      buildings: g.buildings,
      objs: g.sids.map((sid) => ({ sid, label: labelOf(sid), count: meta.get(sid).count })),
    }))
  }, [features, sessions])

  // resolve each cluster's country/region (cached server-side via Nominatim)
  useEffect(() => {
    const missing = clusters.filter((g) => !regionData[g.key])
    if (!missing.length) return
    let cancelled = false
    ;(async () => {
      for (const g of missing) {
        try {
          const v = await getRegion(g.lat, g.lon)
          if (cancelled) return
          setRegionData((prev) => ({ ...prev, [g.key]: v }))
        } catch {
          if (cancelled) return
          setRegionData((prev) => ({ ...prev, [g.key]: { country: null, region: null } }))
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [clusters, regionData])

  const regionKeyOf = (g) => {
    const info = regionData[g.key]
    if (!info) return { country: '⏳ locating…', region: '…', pending: true }
    if (!info.country)
      return { country: 'Unknown area', region: `near ${g.lat.toFixed(2)}, ${g.lon.toFixed(2)}`, pending: false }
    return { country: info.country, region: info.region || '—', pending: false }
  }

  // country → region → scans hierarchy
  const countryTree = useMemo(() => {
    const countries = new Map()
    for (const g of clusters) {
      const { country, region } = regionKeyOf(g)
      if (!countries.has(country))
        countries.set(country, { name: country, regions: new Map(), sids: [], buildings: 0 })
      const c = countries.get(country)
      const rk = `${country}||${region}`
      if (!c.regions.has(rk))
        c.regions.set(rk, { key: rk, name: region, sids: [], buildings: 0, scans: [] })
      const r = c.regions.get(rk)
      for (const sid of g.sids) c.sids.push(sid)
      c.buildings += g.buildings
      for (const sid of g.sids) r.sids.push(sid)
      r.buildings += g.buildings
      r.scans.push(...g.objs)
    }
    return [...countries.values()].map((c) => ({ ...c, regions: [...c.regions.values()] }))
  }, [clusters, regionData])

  // sids visible under the current country/region selection (null = everything)
  const visibleSids = useMemo(() => {
    if (!selCountry) return null
    const c = countryTree.find((x) => x.name === selCountry)
    if (!c) return null
    if (!selRegion) return new Set(c.sids)
    const r = c.regions.find((x) => x.key === selRegion)
    return r ? new Set(r.sids) : null
  }, [countryTree, selCountry, selRegion])

  // buildings for the current view: focused scan → country/region → everything
  const visibleFeatures = useMemo(() => {
    if (focusSid) return features.filter((f) => f.properties.session_id === focusSid)
    if (visibleSids) return features.filter((f) => visibleSids.has(f.properties.session_id))
    return features
  }, [features, focusSid, visibleSids])

  const focusSession = (sid) => setFocusSid((cur) => (cur === sid ? null : sid))

  const removeSession = (sid) => {
    deleteSession(sid)
      .then(() => setReloadKey((k) => k + 1))
      .catch((e) => console.error('session delete failed:', e))
  }

  const canEdit = session?.role === 'surveyor' // surveyor manages scan sessions
  const isRegistrar = session?.role === 'registrar'
  const isCitizen = session?.role === 'citizen'
  const canEditBuildings = session?.role !== 'citizen' // surveyor or registrar
  const navigate = useNavigate()
  // citizens land on their portfolio dashboard; the map is one click away
  const [citizenMapView, setCitizenMapView] = useState(false)

  // buildings the signed-in citizen owns (drives the map's owned highlights)
  const ownedIds = useMemo(
    () =>
      isCitizen
        ? features
            .filter((f) => citizenOwns(f.properties.building_id))
            .map((f) => f.properties.building_id)
        : null,
    [features, isCitizen],
  )

  // citizen map view: show ONLY the selected property; with nothing selected,
  // fall back to the full owned portfolio (never the whole city)
  const citizenMapFeatures = useMemo(() => {
    if (!isCitizen) return null
    if (selectedId) {
      const f = features.find((x) => x.properties.building_id === selectedId)
      if (f) return [f]
    }
    return features.filter((f) => citizenOwns(f.properties.building_id))
  }, [isCitizen, features, selectedId])

  // ── registrar search: buildings by name/id, base ULPIN, unit ULPIN,
  // owner name or DIGIPIN ──────────────────────────────────────────────────
  const [searchQ, setSearchQ] = useState('')
  const [searchFocus, setSearchFocus] = useState(false)
  const [unitsVersion, setUnitsVersion] = useState(0)
  useEffect(() => {
    const bump = () => setUnitsVersion((v) => v + 1)
    window.addEventListener('demo-units-changed', bump)
    return () => window.removeEventListener('demo-units-changed', bump)
  }, [])

  // Pending unit corrections (reactive — refreshed on any edit)
  const [pendingUnitEdits, setPendingUnitEdits] = useState(() => getPendingUnitEdits())
  useEffect(() => {
    const refresh = () => setPendingUnitEdits(getPendingUnitEdits())
    window.addEventListener('demo-pending-unit-edits-changed', refresh)
    window.addEventListener('demo-units-changed', refresh)
    return () => {
      window.removeEventListener('demo-pending-unit-edits-changed', refresh)
      window.removeEventListener('demo-units-changed', refresh)
    }
  }, [])

  const [rejectUnitId, setRejectUnitId] = useState(null)
  const [rejectUnitReason, setRejectUnitReason] = useState('')

  const handleApproveUnitEdit = async (editId) => {
    try {
      await confirmUnitCorrection(editId, session)
      showToast('success', '✓ Unit correction approved')
    } catch (e) {
      showToast('info', `Error: ${e.message}`)
    }
  }

  const handleRejectUnitEdit = async () => {
    if (!rejectUnitId) return
    try {
      await rejectUnitCorrection(rejectUnitId, session, rejectUnitReason)
      setRejectUnitId(null)
      setRejectUnitReason('')
      showToast('info', 'Unit correction rejected')
    } catch (e) {
      showToast('info', `Error: ${e.message}`)
    }
  }

  const unitIndex = useMemo(() => {
    const byId = new Map(features.map((f) => [f.properties.building_id, f]))
    return allUnits().map((u) => {
      const f = byId.get(u.building_id)
      let pin = ''
      const ring = u.polygon || []
      if (f && ring.length) {
        const bb = bboxOfFeature(f)
        if (bb) {
          const cx = ring.reduce((s, p) => s + p[0], 0) / ring.length
          const cy = ring.reduce((s, p) => s + p[1], 0) / ring.length
          pin = digipin(bb.latMin + cy * bb.spanLat, bb.lonMin + cx * bb.spanLon)
        }
      }
      return {
        buildingId: u.building_id,
        ulpin: u.unit_ulpin,
        sub: `${u.owner_name} · ${u.validation_status}${pin ? ` · ${pin}` : ''}`,
        hay: `${u.unit_ulpin} ${u.owner_name} ${pin}`.toLowerCase(),
      }
    })
  }, [features, unitsVersion])

  const searchResults = useMemo(() => {
    const needle = searchQ.trim().toLowerCase()
    if (!needle) return []
    const out = []
    for (const f of features) {
      const p = f.properties
      if (
        (p.name || '').toLowerCase().includes(needle) ||
        (p.building_id || '').toLowerCase().includes(needle)
      ) {
        out.push({ id: p.building_id, name: p.name || p.building_id, note: `${p.stories ?? '—'} str`, sub: null })
        continue
      }
      const base = demoBaseUlpin(p.building_id)
      if (base.toLowerCase().includes(needle)) {
        out.push({ id: p.building_id, name: p.name || p.building_id, note: base, sub: null })
        continue
      }
      const hits = unitIndex.filter((e) => e.buildingId === p.building_id && e.hay.includes(needle))
      if (hits.length) {
        out.push({
          id: p.building_id,
          name: p.name || p.building_id,
          note: hits[0].ulpin,
          sub: hits.length > 1 ? `${hits[0].sub} · +${hits.length - 1} more` : hits[0].sub,
        })
      }
    }
    return out.slice(0, 8)
  }, [searchQ, features, unitIndex])

  const goToSearchResult = (r) => {
    setSearchQ('')
    setSearchFocus(false)
    setSelCountry(null)
    setSelRegion(null)
    setFocusSid(null)
    setSelectedId(r.id)
  }

  const showToast = (kind, text) => {
    setToast({ kind, text })
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setToast(null), 4200)
  }

  // edits awaiting registrar confirmation
  const pendingFeatures = useMemo(
    () => features.filter((f) => f.properties.edit_status === 'pending'),
    [features],
  )

  const saveBuildingEdit = () => {
    if (!selectedId || !editDraft) return
    const feature = features.find((f) => f.properties.building_id === selectedId)
    if (!feature) return
    const p = feature.properties
    const stories = Math.max(1, parseInt(editDraft.floors) || 1)
    const basements = Math.max(0, parseInt(editDraft.basements) || 0)
    const h = Math.max(0.5, parseFloat(editDraft.height) || stories * 3)
    const changes = []
    if (stories !== p.stories) changes.push(`storeys ${p.stories}→${stories}`)
    if (basements !== (p.basements || 0)) changes.push(`basements ${p.basements || 0}→${basements}`)
    if (h !== p.height_m) changes.push(`height ${p.height_m}→${h} m`)
    if (!changes.length) {
      setEditingBld(false)
      setEditDraft(null)
      return
    }
    // surveyor edits await registrar confirmation; registrar edits are final
    const status = session.role === 'registrar' ? 'confirmed' : 'pending'
    const updated = {
      ...feature,
      properties: {
        ...p,
        original_height_m: p.original_height_m ?? p.height_m,
        original_stories: p.original_stories ?? p.stories,
        original_basements: p.original_basements ?? (p.basements || 0),
        original_height_source: p.original_height_source ?? p.height_source,
        height_m: h,
        stories,
        basements,
        roof_z: p.ground_z != null ? +(p.ground_z + h).toFixed(2) : p.roof_z,
        height_source: p.height_source === 'manual' ? 'manual' : 'edited',
        color: '#2fbf8f',
        edit_status: status,
        edit_history: [
          ...(p.edit_history || []),
          {
            at: new Date().toISOString(),
            by: session.name,
            role: session.role,
            change: `${changes.join(', ')}${status === 'confirmed' ? ' (auto-confirmed)' : ' — awaiting registrar confirmation'}`,
          },
        ],
      },
    }
    updateBuilding(updated)
      .then(() => {
        setFeatures((prev) => prev.map((f) => (f.properties.building_id === selectedId ? updated : f)))
        setEditingBld(false)
        setEditDraft(null)
        showToast(
          status === 'confirmed' ? 'success' : 'info',
          status === 'confirmed'
            ? `✓ saved & auto-confirmed — ${selectedId}`
            : 'saved — awaiting registrar confirmation',
        )
      })
      .catch((e) => console.error('building update failed:', e.message))
  }

  const confirmBuilding = (bid) => {
    const entry = {
      at: new Date().toISOString(),
      by: session.name,
      role: session.role,
      change: 'edit confirmed by registrar',
    }
    // mark the notification row as resolving (green fade) while the API runs
    setResolvingIds((prev) => new Set(prev).add(bid))
    confirmBuildingEdit(bid, 'confirmed', entry)
      .then(() => {
        showToast('success', `✓ edit confirmed — ${bid}`)
        // let the resolve animation play before the row disappears
        setTimeout(() => {
          setFeatures((prev) =>
            prev.map((f) =>
              f.properties.building_id === bid
                ? {
                    ...f,
                    properties: {
                      ...f.properties,
                      edit_status: 'confirmed',
                      edit_history: [...(f.properties.edit_history || []), entry],
                    },
                  }
                : f,
            ),
          )
          setResolvingIds((prev) => {
            const next = new Set(prev)
            next.delete(bid)
            return next
          })
        }, 700)
      })
      .catch((e) => {
        setResolvingIds((prev) => {
          const next = new Set(prev)
          next.delete(bid)
          return next
        })
        console.error('confirm failed:', e.message)
      })
  }

  // free-draw footprint replacement from the dashboard map — same audit +
  // confirmation flow as every other edit
  const handleFootprintDrawn = (bid, ring) => {
    const feature = features.find((f) => f.properties.building_id === bid)
    if (!feature) return
    const p = feature.properties
    const status = session.role === 'registrar' ? 'confirmed' : 'pending'
    const updated = {
      ...feature,
      geometry: { type: 'Polygon', coordinates: [ring] },
      properties: {
        ...p,
        height_source: p.height_source === 'manual' ? 'manual' : 'edited',
        color: '#2fbf8f',
        edit_status: status,
        edit_history: [
          ...(p.edit_history || []),
          {
            at: new Date().toISOString(),
            by: session.name,
            role: session.role,
            change: `footprint redrawn (${ring.length} corners)${status === 'confirmed' ? ' (auto-confirmed)' : ' — awaiting registrar confirmation'}`,
          },
        ],
      },
    }
    updateBuilding(updated)
      .then(() => {
        setFeatures((prev) => prev.map((f) => (f.properties.building_id === bid ? updated : f)))
        showToast(
          status === 'confirmed' ? 'success' : 'info',
          status === 'confirmed'
            ? `✓ footprint redrawn & auto-confirmed — ${bid}`
            : `footprint redrawn — awaiting registrar confirmation`,
        )
      })
      .catch((e) => console.error('footprint update failed:', e.message))
  }

  // open a pending notification: leave any country/region focus so the
  // building is guaranteed visible, then select it
  const openPendingBuilding = (f) => {
    setSelCountry(null)
    setSelRegion(null)
    setFocusSid(null)
    setSelectedId(f.properties.building_id)
  }

  const removeBuilding = (bid) => {
    deleteBuildingApi(bid)
      .then(() => {
        setFeatures((prev) => prev.filter((f) => f.properties.building_id !== bid))
        setSelectedId(null)
        setEditingBld(false)
        setEditDraft(null)
        showToast('info', `building deleted — ${bid}`)
      })
      .catch((e) => console.error('building delete failed:', e.message))
  }

  const selected = useMemo(
    () => visibleFeatures.find((f) => f.properties.building_id === selectedId)?.properties ?? null,
    [visibleFeatures, selectedId],
  )

  // original → proposed comparison for a pending edit (drives the highlight)
  const proposedRows = useMemo(() => {
    if (!selected || selected.edit_status !== 'pending') return []
    const rows = []
    if (selected.original_height_m != null && selected.original_height_m !== selected.height_m)
      rows.push(['height', `${selected.original_height_m} m`, `${selected.height_m} m`])
    if (selected.original_stories != null && selected.original_stories !== selected.stories)
      rows.push(['storeys', selected.original_stories, selected.stories])
    if (selected.original_basements != null && selected.original_basements !== (selected.basements || 0))
      rows.push(['basements', selected.original_basements, selected.basements || 0])
    return rows
  }, [selected])

  const stats = useMemo(() => {
    const n = visibleFeatures.length
    if (!n) return null
    const fromLidar = visibleFeatures.filter((f) => f.properties.height_source === 'lidar').length
    const assumed = visibleFeatures.filter((f) => f.properties.height_source === 'assumed-1-story').length
    const edited = visibleFeatures.filter((f) => ['edited', 'manual'].includes(f.properties.height_source)).length
    const heights = visibleFeatures.map((f) => f.properties.height_m || 0)
    return {
      n,
      fromLidar,
      assumed,
      edited,
      tallest: Math.max(...heights),
      mean: heights.reduce((a, b) => a + b, 0) / n,
    }
  }, [visibleFeatures])

  // citizens land on their portfolio dashboard; the map is one click away
  if (isCitizen && !citizenMapView) {
    return (
      <div className="app min-h-screen citizen-dash" style={{ background: '#F5F6F8', color: '#1C2530', overflowY: 'auto' }}>
        <Topbar session={session} onLogout={onLogout} onSwitchRole={onSwitchRole} />
        <CitizenDashboard
          session={session}
          onOpenMap={(id) => {
            setSelCountry(null)
            setSelRegion(null)
            setFocusSid(null)
            setSelectedId(id || null)
            setCitizenMapView(true)
          }}
        />
      </div>
    )
  }

  return (
    <div className="app">
      <Topbar session={session} onLogout={onLogout} onSwitchRole={onSwitchRole}>
        {isRegistrar && (
          <div className="top-search">
            <input
              className="search"
              placeholder="search building, owner, ULPIN or DIGIPIN…"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              onFocus={() => setSearchFocus(true)}
              onBlur={() => setTimeout(() => setSearchFocus(false), 150)}
            />
            {searchFocus && searchQ.trim() && (
              <div className="search-results">
                {searchResults.length === 0 && (
                  <p className="muted tiny" style={{ padding: '8px 10px', margin: 0 }}>
                    no matches for “{searchQ.trim()}”.
                  </p>
                )}
                {searchResults.map((r) => (
                  <div
                    key={r.id}
                    className="nav-row"
                    title={r.sub || r.id}
                    onMouseDown={() => goToSearchResult(r)}
                  >
                    <span className="session-label" title={r.id}>{r.name}</span>
                    <span className="muted tiny">{r.note}</span>
                    <span className="enter-hint tiny">go →</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Topbar>
      {toast && <div className={`toast ${toast.kind}`}>{toast.text}</div>}

      {guideOpen && state === 'ready' && (
        <div className="guide-strip">
          <span className="guide-title tiny muted">how it works</span>
          <span className="guide-step tiny">
            <b>1</b> click any building on the map for details &amp; edits
          </span>
          <span className="guide-step tiny">
            <b>2</b> open its <NavLink to="/ulpin">ULPIN units</NavLink> — floors, owners, status
          </span>
          <span style={{ flex: 1 }} />
          <button className="btn tiny" onClick={dismissGuide}>
            got it
          </button>
        </div>
      )}

      <div className="parcel-strip">
        <span className="muted tiny">
          demo city — Chennai · T. Nagar buildings from OpenStreetMap — pan, zoom &amp; tilt freely
        </span>
        <span style={{ flex: 1 }} />
        {state === 'ready' && stats && !isCitizen && (
          <span className="mono tiny">{stats.n} buildings · tallest {stats.tallest} m</span>
        )}
        {isRegistrar && pendingFeatures.length > 0 && (
          <span className="pending-badge">
            ⚑ {pendingFeatures.length} edit{pendingFeatures.length > 1 ? 's' : ''} awaiting confirmation
          </span>
        )}
        {isCitizen && (
          <button className="btn" onClick={() => setCitizenMapView(false)}>← my properties</button>
        )}
        <button className="btn" onClick={() => setReloadKey((k) => k + 1)}>refresh</button>
      </div>

      <main className="workspace">
        <section className="viewport">
          {state === 'ready' && (
            <BuildingsMap
              features={isCitizen ? citizenMapFeatures : visibleFeatures}
              selectedId={selectedId}
              onSelect={setSelectedId}
              canEdit={canEditBuildings}
              onFootprintDrawn={handleFootprintDrawn}
              ownedIds={ownedIds}
            />
          )}
          {state === 'ready' && !visibleFeatures.length && (
            <div className="map-note muted tiny">
              no buildings in this view — go back to all areas
            </div>
          )}
          {state === 'loading' && <div className="loading muted">loading the city…</div>}
          {state === 'empty' && (
            <div className="lidar-empty muted">
              <h3>No buildings yet</h3>
              <p>the demo dataset is empty — clear this browser's localStorage to restore the baked Chennai data.</p>
            </div>
          )}
          {state === 'unavailable' && (
            <div className="lidar-empty muted">
              <h3>Demo data failed to load</h3>
              <p>refresh the page to retry.</p>
              {unavailableErr && <p className="error mono tiny">reason: {unavailableErr}</p>}
              <button className="btn" onClick={() => setReloadKey((k) => k + 1)}>retry now</button>
            </div>
          )}
        </section>

        <aside className="sidebar">
          {isRegistrar && (
          <div className="tab-btns">
              <button className={`btn nav-sessions ${panelTab === 'sessions' ? 'primary' : ''}`} onClick={() => setPanelTab('sessions')}>
                scan sessions
              </button>
              <button className={`btn nav-confirmations ${panelTab === 'confirmations' ? 'primary' : ''}`} onClick={() => setPanelTab('confirmations')}>
                ⚑ confirmations
                {(pendingFeatures.length + pendingUnitEdits.length) > 0 && (
                  <span className="pending-unit-badge">{pendingFeatures.length + pendingUnitEdits.length}</span>
                )}
              </button>
            </div>
          )}

          {(panelTab === 'sessions' || !isRegistrar) && (
            <>
          <div className="panel-section acc-blue">
            <h3>
              {selRegion ? (
                <button className="btn tiny" onClick={() => setSelRegion(null)}>← {selCountry}</button>
              ) : selCountry ? (
                <button
                  className="btn tiny"
                  onClick={() => {
                    setSelCountry(null)
                    setSelRegion(null)
                  }}
                >
                  ← all countries
                </button>
              ) : (
                'scans'
              )}
            </h3>

            {!selCountry && (
              <>
                {countryTree.map((c) => (
                  <div
                    key={c.name}
                    className={`group-row ${c.name === '⏳ locating…' ? 'dim' : ''}`}
                    onClick={() => {
                      if (c.name !== '⏳ locating…') setSelCountry(c.name)
                    }}
                  >
                    <span className="group-name">{c.name}</span>
                    <span className="muted tiny">
                      {c.name === '⏳ locating…'
                        ? 'resolving scan locations'
                        : `${c.regions.length} region${c.regions.length > 1 ? 's' : ''} · ${c.buildings} bld`}
                    </span>
                    <span className="enter-hint tiny">
                      {c.name === '⏳ locating…' ? '' : 'enter country →'}
                    </span>
                  </div>
                ))}
              </>
            )}

            {selCountry && !selRegion && (() => {
              const c = countryTree.find((x) => x.name === selCountry)
              if (!c) return <p className="muted tiny">…</p>
              return c.regions.map((r) => (
                <div key={r.key} className="group-row" onClick={() => setSelRegion(r.key)}>
                  <span className="group-name">{r.name}</span>
                  <span className="muted tiny">
                    {r.scans.length} scan{r.scans.length > 1 ? 's' : ''} · {r.buildings} bld
                  </span>
                  <span className="enter-hint tiny">enter region →</span>
                </div>
              ))
            })()}

            {selCountry && selRegion && (() => {
              const c = countryTree.find((x) => x.name === selCountry)
              const r = c?.regions.find((x) => x.key === selRegion)
              if (!r) return null
              return (
                <>
                  {r.scans.map((s) => (
                    <div
                      key={s.sid}
                      className={`nav-row ${focusSid === s.sid ? 'active' : ''}`}
                      onClick={() => focusSession(s.sid)}
                    >
                      <span className="session-label" title={s.label}>{s.label}</span>
                      <span className="muted tiny">{s.count} bld</span>
                      <span className="enter-hint tiny">{focusSid === s.sid ? 'whole region' : 'zoom'}</span>
                      {canEdit && (
                        <button
                          className="btn danger tiny"
                          title="delete this session and its buildings"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeSession(s.sid)
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <p className="muted tiny">click a scan to zoom to it — click again for the whole region.</p>
                </>
              )
            })()}
          </div>

            </>
          )}

          {isRegistrar && panelTab === 'confirmations' && (
            <div className="panel-section acc-clay">
              <h3>building edits ({pendingFeatures.length})</h3>
              {pendingFeatures.length ? (
                pendingFeatures.map((f) => {
                  const last = (f.properties.edit_history || []).slice(-1)[0]
                  return (
                    <div
                      key={f.properties.building_id}
                      className={`pending-row ${selectedId === f.properties.building_id ? 'active' : ''} ${
                        resolvingIds.has(f.properties.building_id) ? 'resolving' : ''
                      }`}
                      onClick={() => openPendingBuilding(f)}
                    >
                      <span className="mono tiny">{f.properties.building_id}</span>
                      <span className="muted tiny">{last ? `${last.change} — ${last.by}` : 'edited'}</span>
                      <span className="review-hint tiny">click to review →</span>
                    </div>
                  )
                })
              ) : (
                <p className="all-clear tiny">✓ no building edits awaiting confirmation.</p>
              )}

              <div style={{ marginTop: 16 }}>
                <h3 style={{ marginBottom: 8 }}>
                  unit corrections
                  {pendingUnitEdits.length > 0 && (
                    <span className="pending-unit-badge" style={{ marginLeft: 8 }}>{pendingUnitEdits.length}</span>
                  )}
                </h3>
                {pendingUnitEdits.length ? (
                  pendingUnitEdits.map((e) => (
                    <div key={e.id} className="pending-row" style={{ flexDirection: 'column', gap: 6, alignItems: 'stretch' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="mono tiny">{e.unit_ulpin}</span>
                        <span className="muted tiny">{new Date(e.created_at).toLocaleTimeString()}</span>
                      </div>
                      <span className="muted tiny">by {e.proposed_by} · bldg {e.building_id}</span>
                      <table className="diff-table" style={{ marginTop: 4 }}>
                        <thead><tr><th>Field</th><th>Before</th><th>After</th></tr></thead>
                        <tbody>
                          {Object.keys(e.after).filter((k) => String(e.before[k]) !== String(e.after[k])).map((k) => (
                            <tr key={k} className="diff-changed">
                              <td>{k.replace(/_/g, ' ')}</td>
                              <td className="diff-before">{e.before[k] ?? '—'}</td>
                              <td className="diff-after">{e.after[k] ?? '—'}</td>
                            </tr>
                          ))}
                          <tr className="diff-overlap-row">
                            <td>overlap vol</td>
                            <td className="diff-before">{e.overlap_before_m3} m³</td>
                            <td className="diff-after">{e.overlap_after_m3} m³</td>
                          </tr>
                        </tbody>
                      </table>
                      {e.resolution_note && <p className="muted tiny">Note: {e.resolution_note}</p>}
                      {rejectUnitId === e.id ? (
                        <div className="reject-dialog" style={{ margin: '4px 0 0' }}>
                          <textarea
                            className="reject-textarea"
                            rows={2}
                            placeholder="Rejection reason…"
                            value={rejectUnitReason}
                            onChange={(ev) => setRejectUnitReason(ev.target.value)}
                          />
                          <div className="btn-row">
                            <button className="btn danger" onClick={handleRejectUnitEdit}>Confirm Reject</button>
                            <button className="btn" onClick={() => { setRejectUnitId(null); setRejectUnitReason('') }}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div className="btn-row" style={{ marginTop: 4 }}>
                          <button className="btn primary" onClick={() => handleApproveUnitEdit(e.id)}>✓ Approve</button>
                          <button className="btn danger" onClick={() => { setRejectUnitId(e.id); setRejectUnitReason('') }}>✗ Reject</button>
                          <button className="btn" onClick={() => navigate(`/ulpin?building=${encodeURIComponent(e.building_id)}`)}>
                            view unit
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="all-clear tiny">✓ no unit corrections pending.</p>
                )}
              </div>
            </div>
          )}

          {(panelTab === 'sessions' || !isRegistrar) && (
            <>
          <div className="panel-section acc-green">
            <h3>saved buildings</h3>
            {stats ? (
              <table className="kv">
                <tbody>
                  <tr><td>buildings</td><td>{stats.n}</td></tr>
                  <tr><td>from LiDAR</td><td>{stats.fromLidar}</td></tr>
                  <tr><td>assumed 1 storey</td><td>{stats.assumed}</td></tr>
                  <tr><td>edited / manual</td><td>{stats.edited}</td></tr>
                  <tr><td>tallest</td><td>{stats.tallest} m</td></tr>
                  <tr><td>mean height</td><td>{stats.mean.toFixed(1)} m</td></tr>
                </tbody>
              </table>
            ) : (
              <p className="muted tiny">nothing saved yet</p>
            )}
            <p className="muted tiny" style={{ marginTop: 10 }}>
              data lives in PostgreSQL/PostGIS (<span className="mono">layerd.lidar_buildings</span>) — click any building on the map for details.
            </p>
          </div>
            </>
          )}

          {selected && (
            <div className="panel-section acc-brass">
              <h3>building details</h3>
              <table className="kv">
                <tbody>
                  <tr><td>id</td><td className="mono">{selected.building_id}</td></tr>
                  {selected.name && <tr><td>name</td><td>{selected.name}</td></tr>}
                  <tr><td>height</td><td>{selected.height_m} m</td></tr>
                  <tr><td>storeys</td><td>{selected.stories}</td></tr>
                  <tr><td>basements</td><td>{selected.basements || 0}</td></tr>
                  <tr><td>ground Z</td><td>{selected.ground_z ?? '—'}</td></tr>
                  <tr><td>roof Z</td><td>{selected.roof_z ?? '—'}</td></tr>
                  <tr><td>LiDAR points</td><td>{selected.lidar_points}</td></tr>
                  <tr><td>source</td><td>{selected.height_source}</td></tr>
                  <tr>
                    <td>confirmation</td>
                    <td className={selected.edit_status === 'pending' ? 'status-pending' : selected.edit_status === 'confirmed' ? 'status-confirmed' : ''}>
                      {selected.edit_status === 'pending' ? '⏳ pending' : selected.edit_status === 'confirmed' ? '✓ confirmed' : '—'}
                    </td>
                  </tr>
                </tbody>
              </table>
              <div className="btn-row">
                <button
                  className="btn"
                  title="open this building's 3D ULPIN unit tree"
                  onClick={() => navigate(`/ulpin?building=${encodeURIComponent(selected.building_id)}`)}
                >
                  ⬢ open ULPIN view
                </button>
              </div>
              {editingBld ? (
                <div className="edit-form">
                  <label>
                    <span>storeys</span>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={editDraft.floors}
                      onChange={(e) => {
                        const fl = Math.max(1, parseInt(e.target.value) || 1)
                        setEditDraft({ ...editDraft, floors: fl, height: +(fl * 3).toFixed(2) })
                      }}
                    />
                  </label>
                  <label>
                    <span>basements</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={editDraft.basements ?? 0}
                      onChange={(e) => setEditDraft({ ...editDraft, basements: Math.max(0, parseInt(e.target.value) || 0) })}
                    />
                  </label>
                  <label>
                    <span>height (m)</span>
                    <input
                      type="number"
                      step="0.1"
                      min="0.5"
                      value={editDraft.height}
                      onChange={(e) => {
                        const h = parseFloat(e.target.value) || 0
                        setEditDraft({ ...editDraft, height: e.target.value, floors: Math.max(1, Math.round(h / 3)) })
                      }}
                    />
                  </label>
                  <div className="btn-row">
                    <button className="btn primary" onClick={saveBuildingEdit}>save</button>
                    <button className="btn" onClick={() => { setEditingBld(false); setEditDraft(null) }}>cancel</button>
                  </div>
                </div>
              ) : canEditBuildings && (
                <div className="btn-row">
                  <button
                    className="btn primary"
                    onClick={() => { setEditDraft({ height: selected.height_m, floors: selected.stories, basements: selected.basements || 0 }); setEditingBld(true) }}
                  >
                    edit
                  </button>
                  {isRegistrar && selected.edit_status === 'pending' && (
                    <button
                      className="btn primary"
                      title="confirm this surveyor edit"
                      onClick={() => confirmBuilding(selected.building_id)}
                    >
                      ✓ confirm edit
                    </button>
                  )}
                  <button
                    className="btn danger"
                    title="delete this building from PostGIS"
                    onClick={() => removeBuilding(selected.building_id)}
                  >
                    delete
                  </button>
                </div>
              )}
              {selected.edit_status === 'pending' && (
                <div className="proposed-change">
                  <h3>proposed change</h3>
                  {proposedRows.length ? (
                    <table className="kv">
                      <tbody>
                        {proposedRows.map(([field, from, to]) => (
                          <tr key={field}>
                            <td>{field}</td>
                            <td>
                              <span className="old-val">{String(from)}</span> → <span className="new-val">{String(to)}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="muted tiny">footprint change — see the history below for details.</p>
                  )}
                </div>
              )}
              {(selected.edit_history?.length || 0) > 0 && (
                <ul className="history">
                  {[...selected.edit_history].reverse().map((h, i) => (
                    <li key={i}>
                      <span className="who">{h.by} ({h.role})</span> — {h.change}
                      <span className="when">{new Date(h.at).toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </aside>
      </main>
    </div>
  )
}

function UlpinPage({ session, onLogout }) {
  const [params] = useSearchParams()
  return (
    <div className="app">
      <Topbar session={session} onLogout={onLogout} />
      <Suspense fallback={<PageFallback />}>
        <UlpinView session={session} initialBuilding={params.get('building')} />
      </Suspense>
    </div>
  )
}
