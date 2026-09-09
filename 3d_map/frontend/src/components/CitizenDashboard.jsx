import React, { useEffect, useMemo, useState } from 'react'
import {
  Building2, CheckCircle2, Clock, FileText, ArrowRight, Activity, MapPin, Search,
} from 'lucide-react'
import { citizenProperties, peekUnits, demoBaseUlpin, digipin, generateUnits } from '../api.js'
import { activityLog } from '../mockData.js'
const M_PER_DEG = 111320
export default function CitizenDashboard({ session, onOpenMap }) {
  const [props, setProps] = useState([])
  const [query, setQuery] = useState('')
  const [unitsVersion, setUnitsVersion] = useState(0)
  const [view, setView] = useState('welcome') // welcome | properties
  useEffect(() => {
    let alive = true
    citizenProperties()
      .then((rows) => alive && setProps(rows))
      .catch(() => {})
    const bump = () => setUnitsVersion((v) => v + 1)
    window.addEventListener('demo-units-changed', bump)
    return () => {
      alive = false
      window.removeEventListener('demo-units-changed', bump)
    }
  }, [])

  // every owned place gets real 3D units the first time the citizen visits
  // (generated once, then persisted) - so My Properties always shows one
  // ready unit per property
  useEffect(() => {
    if (!props.length) return
    let changed = false
    for (const f of props) {
      if (peekUnits(f.properties.building_id).length === 0) {
        generateUnits(f.properties.building_id, {
          floors: f.properties.stories || 1,
          basements: f.properties.basements || 0,
        })
        changed = true
      }
    }
    if (changed) setUnitsVersion((v) => v + 1)
  }, [props])
  // per-owned-building summary + its 3D spaces (units)
  const rows = useMemo(() => {
    return props.map((f) => {
      const p = f.properties
      const ring = f.geometry?.type === 'Polygon' ? f.geometry.coordinates[0] : null
      let digi = null
      let areaSqm = 0
      if (ring?.length) {
        const lats = ring.map((c) => c[1])
        const lons = ring.map((c) => c[0])
        const latMin = Math.min(...lats)
        const lonMin = Math.min(...lons)
        const latMid = (latMin + Math.max(...lats)) / 2
        const mx = (lon) => (lon - lonMin) * M_PER_DEG * Math.cos((latMid * Math.PI) / 180)
        const my = (lat) => (lat - latMin) * M_PER_DEG
        let a2 = 0
        for (let i = 0; i < ring.length - 1; i++) {
          a2 += mx(ring[i][0]) * my(ring[i + 1][1]) - mx(ring[i + 1][0]) * my(ring[i][1])
        }
        areaSqm = Math.round(Math.abs(a2 / 2))
        const clat = lats.reduce((s, c) => s + c, 0) / ring.length
        const clon = lons.reduce((s, c) => s + c, 0) / ring.length
        digi = digipin(clat, clon)
      }
      const units = peekUnits(p.building_id)
      const conflicts = units.filter((u) => u.validation_status === 'conflict').length
      return { p, digi, areaSqm, units, conflicts }
    })
  }, [props, unitsVersion])
  // flat list of every 3D space inside the citizen's buildings, plus the
  // buildings that have not been surveyed into units yet
  const portfolio = useMemo(() => {
    const units = []
    const awaiting = []
    for (const r of rows) {
      if (r.units.length) {
        for (const u of r.units.slice(0, 1)) {
          units.push({
            u,
            building: r.p,
            status: u.validation_status === 'verified' ? 'Ready' : 'Being checked',
            tone: u.validation_status === 'verified' ? 'verified' : 'review',
          })
        }
      } else {
        awaiting.push(r)
      }
    }
    return { units, awaiting }
  }, [rows])
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return portfolio
    return {
      units: portfolio.units.filter(
        (x) =>
          x.u.unitLabel.toLowerCase().includes(needle) ||
          x.u.ulpin.toLowerCase().includes(needle) ||
          x.u.owner.toLowerCase().includes(needle) ||
          x.building.name.toLowerCase().includes(needle),
      ),
      awaiting: portfolio.awaiting.filter(
        (r) =>
          (r.p.name || '').toLowerCase().includes(needle) ||
          r.p.building_id.toLowerCase().includes(needle),
      ),
    }
  }, [query, portfolio])
  const totals = useMemo(
    () => ({
      count: rows.length,
      area: rows.reduce((s, r) => s + (r.areaSqm || 0), 0),
      units: rows.reduce((s, r) => s + Math.min(1, r.units.length), 0),
      conflicts: rows.reduce(
        (s, r) => s + (r.units[0] && r.units[0].validation_status === 'conflict' ? 1 : 0),
        0,
      ),
      surveyed: rows.reduce((s, r) => s + Math.min(1, r.units.length), 0),
    }),
    [rows, portfolio],
  )
  const surveyedPct = totals.count ? Math.round((totals.surveyed / totals.count) * 100) : 0
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const activity = [...activityLog].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6)
  const actIcon = {
    verified: <CheckCircle2 size={15} className="act-ic ic-green" />,
    review: <Clock size={15} className="act-ic ic-amber" />,
    info: <FileText size={15} className="act-ic ic-indigo" />,
  }
  return (
    <main className="citizen-dash">
      <div className="citizen-head">
        <div className="view-tabs">
          <button className={`view-tab ${view === 'welcome' ? 'active' : ''}`} onClick={() => setView('welcome')}>
            <Activity size={14} /> Overview
          </button>
          <button className={`view-tab ${view === 'properties' ? 'active' : ''}`} onClick={() => setView('properties')}>
            <Building2 size={14} /> My Properties
          </button>
        </div>
        <button className="btn primary" onClick={() => onOpenMap(null)}>open map view</button>
      </div>
      {view === 'welcome' ? (
        <>
          <div className="citizen-banner">
            <div className="cb-circle c1" />
            <div className="cb-circle c2" />
            <div className="cb-content">
              <div className="cb-eyebrow">{greeting} · Citizen Login</div>
              <div className="cb-title">Welcome, {session.name}</div>
              <div className="cb-sub">
                You own {totals.count} place{totals.count !== 1 ? 's' : ''} in the city, with{' '}
                {totals.units} space{totals.units !== 1 ? 's' : ''} already mapped in 3D.
                {totals.conflicts > 0 && ` ${totals.conflicts} need${totals.conflicts === 1 ? 's' : ''} a quick check.`}
              </div>
              <button className="btn primary cb-cta" onClick={() => setView('properties')}>
                See my properties <ArrowRight size={15} />
              </button>
            </div>
            <svg className="cb-art" width="130" height="110" viewBox="0 0 130 110">
              <rect x="70" y="20" width="40" height="80" rx="2" fill="rgba(255,255,255,0.12)" />
              <rect x="76" y="28" width="10" height="10" fill="rgba(255,255,255,0.35)" />
              <rect x="92" y="28" width="10" height="10" fill="rgba(255,255,255,0.35)" />
              <rect x="76" y="44" width="10" height="10" fill="rgba(255,255,255,0.35)" />
              <rect x="92" y="44" width="10" height="10" fill="#5E6AD2" opacity="0.9" />
              <rect x="76" y="60" width="10" height="10" fill="rgba(255,255,255,0.35)" />
              <rect x="92" y="60" width="10" height="10" fill="rgba(255,255,255,0.35)" />
              <rect x="76" y="76" width="10" height="10" fill="rgba(255,255,255,0.35)" />
              <rect x="92" y="76" width="10" height="10" fill="rgba(255,255,255,0.35)" />
              <rect x="30" y="55" width="34" height="45" rx="2" fill="rgba(255,255,255,0.08)" />
              <rect x="36" y="62" width="9" height="9" fill="rgba(255,255,255,0.3)" />
              <rect x="50" y="62" width="9" height="9" fill="rgba(255,255,255,0.3)" />
              <rect x="36" y="76" width="9" height="9" fill="rgba(255,255,255,0.3)" />
              <rect x="50" y="76" width="9" height="9" fill="rgba(255,255,255,0.3)" />
              <rect x="10" y="100" width="112" height="4" rx="2" fill="rgba(255,255,255,0.2)" />
            </svg>
          </div>
          <div className="stat-cards">
            <div className="stat-card"><b>{totals.count}</b><span className="muted tiny">places you own</span></div>
            <div className="stat-card"><b>{totals.units}</b><span className="muted tiny">spaces in 3D</span></div>
            <div className="stat-card"><b>{totals.area.toLocaleString('en-IN')} m²</b><span className="muted tiny">total area</span></div>
            <div className="stat-card"><b>{totals.conflicts}</b><span className="muted tiny">need a check</span></div>
          </div>
          <div className="welcome-grid">
            <div className="panel-section welcome-card">
              <h3>how much is mapped so far?</h3>
              <div className="ring-row">
                <svg width="110" height="110" viewBox="0 0 110 110" className="ring-svg">
                  <circle cx="55" cy="55" r="42" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
                  <circle
                    cx="55" cy="55" r="42" fill="none" stroke="#5E6AD2" strokeWidth="10" strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 42}
                    strokeDashoffset={2 * Math.PI * 42 * (1 - surveyedPct / 100)}
                    transform="rotate(-90 55 55)"
                    style={{ transition: 'stroke-dashoffset 0.9s ease' }}
                  />
                  <text x="55" y="61" textAnchor="middle" fill="#EDEDEF" style={{ fontSize: 20, fontWeight: 800 }}>
                    {surveyedPct}%
                  </text>
                </svg>
                <div className="muted tiny ring-note">
                  {surveyedPct}% of your places have been fully measured and have their own 3D floor plan.
                  {surveyedPct < 100 && ' The rest are waiting for the next survey round.'}
                </div>
              </div>
            </div>
            <div className="panel-section welcome-card">
              <h3>what's new</h3>
              {activity.map((a, i) => (
                <div key={a.id} className={`act-row ${i === activity.length - 1 ? 'last' : ''}`}>
                  {actIcon[a.type] || actIcon.info}
                  <div className="act-body">
                    <div className="act-text">{a.text}</div>
                    <div className="muted tiny">{a.date}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="records-search">
            <Search size={15} className="rs-icon" />
            <input
              className="search"
              placeholder="Search your spaces by name, floor or ID…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          {filtered.units.length === 0 && filtered.awaiting.length === 0 && (
            <div className="panel-placeholder">
              <p className="muted tiny">Nothing matches your search.</p>
            </div>
          )}
          {filtered.units.length > 0 && (
            <div className="prop-grid">
              {filtered.units.map(({ u, building, status, tone }) => (
                <div key={u.unit_ulpin} className="prop-card">
                  <div className="prop-head">
                    <strong>{u.unitLabel}</strong>
                    <span className={`chip ${tone === 'verified' ? 'status-valid' : 'under-review'}`}>
                      {tone === 'verified' ? '✓ Ready' : '⋯ Being checked'}
                    </span>
                  </div>
                  <div className="muted tiny unit-where">
                    <MapPin size={11} className="unit-pin" /> {building.name} · Floor {u.floor}
                  </div>
                  <table className="kv">
                    <tbody>
                      <tr><td>size</td><td>{u.area} m²</td></tr>
                      <tr><td>held by</td><td>{u.owner}</td></tr>
                      <tr><td>space ID</td><td className="mono tiny" title={u.ulpin}>{u.ulpin}</td></tr>
                    </tbody>
                  </table>
                  <button className="btn tiny" onClick={() => onOpenMap(building.building_id || building.id || building.building_id)}>
                    <MapPin size={12} /> show on map
                  </button>
                </div>
              ))}
            </div>
          )}
          {filtered.awaiting.length > 0 && (
            <>
              <h3 className="await-title muted tiny">WAITING FOR A 3D SURVEY</h3>
              <div className="prop-grid">
                {filtered.awaiting.map((r) => (
                  <div key={r.p.building_id} className="prop-card">
                    <div className="prop-head">
                      <strong>{r.p.name || r.p.building_id}</strong>
                      <span className="chip chip-muted">no 3D yet</span>
                    </div>
                    <table className="kv">
                      <tbody>
                        <tr><td>storeys</td><td>{r.p.stories || 1}</td></tr>
                        <tr><td>footprint</td><td>{r.areaSqm.toLocaleString('en-IN')} m²</td></tr>
                      </tbody>
                    </table>
                    <button className="btn tiny" onClick={() => onOpenMap(r.p.building_id)}>
                      <MapPin size={12} /> show on map
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </main>
  )
}

