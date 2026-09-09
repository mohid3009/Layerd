import React, { useEffect, useMemo, useState } from 'react'
import { citizenProperties, peekUnits, demoBaseUlpin, digipin } from '../api.js'

const M_PER_DEG = 111320

// Citizen landing dashboard — every building the signed-in citizen "owns"
// (deterministic demo ownership), with portfolio stats and a card grid.
export default function CitizenDashboard({ session, onOpenMap }) {
  const [props, setProps] = useState([])
  const [query, setQuery] = useState('')
  const [unitsVersion, setUnitsVersion] = useState(0)

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
      return { p, digi, areaSqm, units: units.length, conflicts }
    })
  }, [props, unitsVersion])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return rows
    return rows.filter(
      (r) =>
        (r.p.name || '').toLowerCase().includes(needle) ||
        r.p.building_id.toLowerCase().includes(needle) ||
        demoBaseUlpin(r.p.building_id).toLowerCase().includes(needle),
    )
  }, [rows, query])

  const totals = useMemo(
    () => ({
      count: rows.length,
      storeys: rows.reduce((s, r) => s + (r.p.stories || 1), 0),
      area: rows.reduce((s, r) => s + (r.areaSqm || 0), 0),
      units: rows.reduce((s, r) => s + r.units, 0),
      conflicts: rows.reduce((s, r) => s + r.conflicts, 0),
    }),
    [rows],
  )

  return (
    <main className="citizen-dash">
      <div className="citizen-head">
        <div>
          <h2>my properties</h2>
          <span className="muted tiny">
            signed in as {session.name} · {session.role} · demo portfolio
          </span>
        </div>
        <button className="btn primary" onClick={() => onOpenMap(null)}>open map view</button>
      </div>

      <div className="stat-cards">
        <div className="stat-card"><b>{totals.count}</b><span className="muted tiny">properties owned</span></div>
        <div className="stat-card"><b>{totals.storeys}</b><span className="muted tiny">total storeys</span></div>
        <div className="stat-card"><b>{totals.area.toLocaleString('en-IN')} m²</b><span className="muted tiny">footprint area</span></div>
        <div className="stat-card"><b>{totals.units}</b><span className="muted tiny">minted units</span></div>
        <div className="stat-card"><b>{totals.conflicts}</b><span className="muted tiny">flagged conflicts</span></div>
      </div>

      <input
        className="search"
        placeholder="search my properties by name, id or ULPIN…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {filtered.length === 0 ? (
        <div className="panel-placeholder">
          <p className="muted tiny">no properties match “{query}”.</p>
        </div>
      ) : (
        <div className="prop-grid">
          {filtered.map((r) => (
            <div key={r.p.building_id} className="prop-card">
              <div className="prop-head">
                <strong>{r.p.name || r.p.building_id}</strong>
                <span className="muted tiny mono">{demoBaseUlpin(r.p.building_id)}</span>
              </div>
              <div className="chips">
                <span className="chip status-valid">verified</span>
                {r.p.basements > 0 && (
                  <span className="chip rights-common">B×{r.p.basements} basement</span>
                )}
                {r.conflicts > 0 && (
                  <span className="chip status-conflict">
                    {r.conflicts} conflict{r.conflicts > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <table className="kv">
                <tbody>
                  <tr><td>storeys</td><td>{r.p.stories || 1}</td></tr>
                  <tr><td>height</td><td>{r.p.height_m} m</td></tr>
                  <tr><td>footprint</td><td>{r.areaSqm.toLocaleString('en-IN')} m²</td></tr>
                  <tr><td>units</td><td>{r.units || '— not surveyed —'}</td></tr>
                  <tr><td>DIGIPIN</td><td className="mono tiny">{r.digi || '—'}</td></tr>
                </tbody>
              </table>
              <button className="btn tiny" onClick={() => onOpenMap(r.p.building_id)}>
                view on map →
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}