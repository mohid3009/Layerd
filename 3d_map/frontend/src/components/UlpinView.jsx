import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { getSavedBuildings, fetchUnits, generateUnits, deleteUnits, updateUnit, digipin, allUnits, demoBaseUlpin, detectVolumetricOverlaps, overlapsForUnit, unitZRange, proposeUnitCorrection, confirmUnitCorrection, rejectUnitCorrection, getPendingUnitEdits } from '../api.js'
import BuildingsMap from './BuildingsMap.jsx'

const FH = 3 // storey height used by the generator (m)
const FLOOR_GAP = 0.7 // vertical gap between floors (m) — keeps every level visible in 3D

function floorColor(floorIndex, maxFloor) {
  if (floorIndex < 0) return '#595969' // basement grey
  const t = maxFloor <= 1 ? 0 : (floorIndex - 1) / (maxFloor - 1)
  return `hsl(216, 68%, ${28 + t * 30}%)`
}

// geographic bbox of a footprint — used for unit DIGIPIN lookups in search
function bboxOf(feature) {
  const ring = feature?.geometry?.coordinates?.[0]
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

function UnitMesh({ unit, w, d, fh, color, selected, onPick }) {
  const geo = useMemo(() => {
    const shape = new THREE.Shape(
      unit.polygon.map(([x, y]) => new THREE.Vector2(x * w - w / 2, y * d - d / 2)),
    )
    const g = new THREE.ExtrudeGeometry(shape, { depth: fh * 0.88, bevelEnabled: false })
    g.rotateX(-Math.PI / 2) // extrude upward, footprint flat on the ground plane
    return g
  }, [unit, w, d, fh])
  return (
    <mesh
      geometry={geo}
      position={[0, unit.floor_index * (fh + FLOOR_GAP), 0]}
      castShadow
      receiveShadow
      onClick={(e) => {
        e.stopPropagation()
        onPick(unit)
      }}
      onPointerOver={() => (document.body.style.cursor = 'pointer')}
      onPointerOut={() => (document.body.style.cursor = 'auto')}
    >
      <meshLambertMaterial
        color={selected ? '#ffffff' : unit.validation_status === 'conflict' ? '#e05252' : color}
        transparent
        opacity={selected ? 1 : 0.96}
      />
    </mesh>
  )
}

export default function UlpinView({ session, initialBuilding = null }) {
  const bootstrappedRef = useRef(false)
  const canManage = session?.role !== 'citizen'
  const isSurveyor = session?.role === 'surveyor'
  const isRegistrar = session?.role === 'registrar'
  const [buildings, setBuildings] = useState([])
  const [selId, setSelId] = useState(null)
  const [units, setUnits] = useState([])
  const [selUlpin, setSelUlpin] = useState(null)
  const [floors, setFloors] = useState(3)
  const [basements, setBasements] = useState(0)
  const [fh, setFh] = useState(3)
  const [planFile, setPlanFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  const [err, setErr] = useState(null)
  const [query, setQuery] = useState('') // building picker search
  const [editingUnit, setEditingUnit] = useState(false) // registrar direct edit
  const [unitDraft, setUnitDraft] = useState(null)
  const canEditUnits = isRegistrar // registrar direct edit
  const canProposeCorrection = isSurveyor // surveyor proposes, awaits approval

  // Surveyor correction flow
  const [correctingUnit, setCorrectingUnit] = useState(false)
  const [correctionDraft, setCorrectionDraft] = useState(null)
  const [correctionErr, setCorrectionErr] = useState(null)

  // Registrar reject dialog
  const [rejectEditId, setRejectEditId] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  // Pending unit edits (reactive)
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

  useEffect(() => {
    getSavedBuildings()
      .then((fc) => setBuildings(fc.features || []))
      .catch(() => {})
  }, [])


  // search index over every generated unit: its ULPIN, owner and DIGIPIN
  const unitIndex = useMemo(() => {
    const byId = new Map(buildings.map((b) => [b.properties.building_id, b]))
    return allUnits().map((u) => {
      const f = byId.get(u.building_id)
      let pin = ''
      const ring = u.polygon || []
      if (f && ring.length) {
        const bb = bboxOf(f)
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
  }, [buildings, units]) // units dep → reindex after generate/clear

  // searchable list of buildings for the picker — name/id, base ULPIN,
  // owner names, unit ULPINs and unit DIGIPINs (case-insensitive)
  const candidates = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const props = buildings.map((b) => b.properties)
    if (!needle) return props.map((p) => ({ p }))
    const out = []
    for (const p of props) {
      if (
        (p.name || '').toLowerCase().includes(needle) ||
        (p.building_id || '').toLowerCase().includes(needle)
      ) {
        out.push({ p })
        continue
      }
      const base = demoBaseUlpin(p.building_id)
      if (base.toLowerCase().includes(needle)) {
        out.push({ p, note: base })
        continue
      }
      const hits = unitIndex.filter(
        (e) => e.buildingId === p.building_id && e.hay.includes(needle),
      )
      if (hits.length) {
        out.push({
          p,
          note: hits[0].ulpin,
          sub:
            hits.length > 1
              ? `${hits[0].sub} · +${hits.length - 1} more`
              : hits[0].sub,
          ulpin: hits[0].ulpin,
        })
      }
    }
    return out
  }, [buildings, query, unitIndex])

  const selected = buildings.find((b) => b.properties.building_id === selId) || null

  const selectBuilding = (bid, ulpin = null) => {
    setSelId(bid)
    setSelUlpin(ulpin)
    setUnits([])
    setMsg(null)
    setErr(null)
    fetchUnits(bid)
      .then((r) => setUnits(r.units || []))
      .catch(() => setUnits([]))
  }

  // deep link (dashboard → /ulpin?building=<id>): select and open that building
  useEffect(() => {
    if (bootstrappedRef.current || !buildings.length || !initialBuilding) return
    bootstrappedRef.current = true
    selectBuilding(initialBuilding)
  }, [buildings, initialBuilding]) // eslint-disable-line react-hooks/exhaustive-deps

  const generate = () => {
    if (!selId) return
    setBusy(true)
    setErr(null)
    setMsg(null)
    generateUnits(selId, { floors, basements, floorHeight: fh, planFile })
      .then((r) => {
        setUnits(r.units)
        setMsg(
          `${r.unit_count} units generated via ${r.segmentation} segmentation — base ULPIN ${r.base_ulpin}`,
        )
        setBusy(false)
      })
      .catch((e) => {
        setErr(e.message)
        setBusy(false)
      })
  }

  const clear = () => {
    deleteUnits(selId)
      .then(() => {
        setUnits([])
        setSelUlpin(null)
        setMsg('units cleared')
      })
      .catch(() => {})
  }

  // leave edit mode whenever the selected unit or building changes
  useEffect(() => {
    setEditingUnit(false)
    setCorrectingUnit(false)
    setCorrectionDraft(null)
    setCorrectionErr(null)
  }, [selUlpin, selId])

  const startUnitEdit = () => {
    if (!selUnit) return
    setUnitDraft({
      owner_name: selUnit.owner_name,
      rights_type: selUnit.rights_type,
      area_sqm: selUnit.area_sqm,
      validation_status: selUnit.validation_status,
    })
    setEditingUnit(true)
  }

  const saveUnitEdits = () => {
    if (!selId || !selUnit || !unitDraft) return
    setBusy(true)
    setErr(null)
    updateUnit(selId, selUnit.unit_ulpin, unitDraft)
      .then((r) => {
        setUnits(r.units)
        setEditingUnit(false)
        setMsg(`${selUnit.unit_ulpin} updated`)
        setBusy(false)
      })
      .catch((e) => {
        setErr(e.message)
        setBusy(false)
      })
  }

  // Surveyor: open correction form
  const startCorrection = () => {
    if (!selUnit) return
    setCorrectionDraft({
      owner_name: selUnit.owner_name,
      rights_type: selUnit.rights_type,
      area_sqm: selUnit.area_sqm,
      resolution_note: '',
    })
    setCorrectingUnit(true)
    setCorrectionErr(null)
  }

  const submitCorrection = async () => {
    if (!selId || !selUnit || !correctionDraft) return
    setBusy(true)
    setCorrectionErr(null)
    try {
      const result = await proposeUnitCorrection(selId, selUnit.unit_ulpin, correctionDraft, session)
      const refreshed = await fetchUnits(selId)
      setUnits(refreshed.units || [])
      setCorrectingUnit(false)
      setCorrectionDraft(null)
      setMsg(`Correction submitted for ${selUnit.unit_ulpin}. Overlap: ${result.overlapBefore.toFixed(1)} → ${result.overlapAfter.toFixed(1)} m³. Awaiting registrar approval.`)
    } catch (e) {
      setCorrectionErr(e.message)
    } finally {
      setBusy(false)
    }
  }

  // Registrar: approve a pending unit edit
  const handleApprove = async (editId) => {
    setBusy(true)
    try {
      await confirmUnitCorrection(editId, session)
      const refreshed = await fetchUnits(selId)
      setUnits(refreshed.units || [])
      setMsg('Correction approved and applied.')
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusy(false)
    }
  }

  // Registrar: reject
  const handleReject = async () => {
    if (!rejectEditId) return
    setBusy(true)
    try {
      await rejectUnitCorrection(rejectEditId, session, rejectReason)
      const refreshed = await fetchUnits(selId)
      setUnits(refreshed.units || [])
      setRejectEditId(null)
      setRejectReason('')
      setMsg('Correction rejected.')
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusy(false)
    }
  }

  // footprint dimensions in metres (for the 3D mapping)
  const dims = useMemo(() => {
    if (!selected) return null
    const ring = selected.geometry.coordinates[0]
    const lons = ring.map((c) => c[0])
    const lats = ring.map((c) => c[1])
    const latMid = (Math.min(...lats) + Math.max(...lats)) / 2
    return {
      w: Math.max(1, (Math.max(...lons) - Math.min(...lons)) * 111320 * Math.cos((latMid * Math.PI) / 180)),
      d: Math.max(1, (Math.max(...lats) - Math.min(...lats)) * 110540),
    }
  }, [selected])

  const selUnit = units.find((u) => u.unit_ulpin === selUlpin) || null

  // geographic frame of the footprint — maps unit polygons back to lat/lon
  const geo = useMemo(() => {
    if (!selected) return null
    const ring = selected.geometry.coordinates[0]
    const lats = ring.map((c) => c[1])
    const lons = ring.map((c) => c[0])
    const latMin = Math.min(...lats)
    const latMax = Math.max(...lats)
    const lonMin = Math.min(...lons)
    const lonMax = Math.max(...lons)
    const latMid = (latMin + latMax) / 2
    // real footprint area (m²) via the shoelace formula on a local metre frame
    const mx = (lon) => (lon - lonMin) * 111320 * Math.cos((latMid * Math.PI) / 180)
    const my = (lat) => (lat - latMin) * 111320
    let a2 = 0
    for (let i = 0; i < ring.length - 1; i++) {
      a2 += mx(ring[i][0]) * my(ring[i + 1][1]) - mx(ring[i + 1][0]) * my(ring[i][1])
    }
    return {
      latMin, latMax, lonMin, lonMax,
      spanLat: latMax - latMin,
      spanLon: lonMax - lonMin,
      areaSqm: Math.abs(a2 / 2),
    }
  }, [selected])
  const centroid = geo
    ? { lat: (geo.latMin + geo.latMax) / 2, lon: (geo.lonMin + geo.lonMax) / 2 }
    : null
  // centroid lat/lon + DIGIPIN of a unit (polygon is normalised 0..1 over the bbox)
  const unitGeo = (u) => {
    if (!geo || !u?.polygon?.length) return null
    const cx = u.polygon.reduce((s, p) => s + p[0], 0) / u.polygon.length
    const cy = u.polygon.reduce((s, p) => s + p[1], 0) / u.polygon.length
    const lon = geo.lonMin + cx * geo.spanLon
    const lat = geo.latMin + cy * geo.spanLat
    return { lat, lon, digipin: digipin(lat, lon) }
  }

  // before units are generated, show the building's sections as mock slabs —
  // the chosen building is always fully visible in 3D
  const mockSlabs = useMemo(() => {
    if (!selected || units.length) return []
    const stories = selected.properties.stories || 1
    const basements = selected.properties.basements || 0
    const out = []
    for (let f = -basements; f <= stories; f++) {
      if (f === 0) continue
      out.push({
        unit_ulpin: `section-F${f}`,
        floor_index: f,
        unit_no: 0,
        polygon: [[0.02, 0.02], [0.98, 0.02], [0.98, 0.98], [0.02, 0.98], [0.02, 0.02]],
        area_sqm: null,
        mock: true,
      })
    }
    return out
  }, [selected, units.length])

  const displayUnits = units.length ? units : mockSlabs
  const selSlab = mockSlabs.find((s) => s.unit_ulpin === selUlpin) || null
  const maxFloor = displayUnits.reduce((m, u) => Math.max(m, u.floor_index), 1)
  const minFloor = displayUnits.reduce((m, u) => Math.min(m, u.floor_index), 0)
  // exploded stack size — drives camera framing and the shadow camera bounds
  const totalH = (maxFloor - minFloor + 2) * (FH + FLOOR_GAP)
  const span = Math.max(dims ? Math.max(dims.w, dims.d) : 10, totalH) * 2.2
  const baseUlpin = units[0]?.base_ulpin || null

  // units grouped by floor for the sidebar list
  const byFloor = useMemo(() => {
    const m = new Map()
    for (const u of units) {
      if (!m.has(u.floor_index)) m.set(u.floor_index, [])
      m.get(u.floor_index).push(u)
    }
    return [...m.entries()].sort((a, b) => a[0] - b[0])
  }, [units])

  return (
    <main className="workspace">
        <section className="viewport">
          <BuildingsMap
            features={buildings}
            selectedId={selId}
            onSelect={(bid) => selectBuilding(bid)}
          />
          {!selId && (
            <div className="map-note muted tiny">
              click a building on the map to open its 3D ULPIN unit tree
            </div>
          )}
          {selId && dims && (
            <div className="ulpin-3d">
              <div className="ulpin-3d-bar">
                <button className="btn tiny" onClick={() => setSelId(null)}>← choose on map</button>
                <span className="mono tiny">{selected?.properties.name || selId}</span>
                {baseUlpin && <span className="muted tiny mono">base {baseUlpin}</span>}
              </div>
              <div className="ulpin-3d-stage">
                <Canvas
                  shadows
                  camera={{
                    position: [
                      0,
                      Math.max(dims.w, dims.d) * 1.3 + totalH * 0.9,
                      Math.max(dims.w, dims.d) * 1.6 + totalH * 0.55,
                    ],
                    fov: 42,
                    near: 0.1,
                    far: 12000,
                  }}
                >
                  <ambientLight intensity={0.8} />
                  <directionalLight
                    position={[dims.w * 1.2, (maxFloor + 4) * (FH + FLOOR_GAP) + dims.d, dims.d * 1.2]}
                    intensity={1.05}
                    castShadow
                    shadow-mapSize-width={2048}
                    shadow-mapSize-height={2048}
                    shadow-camera-near={1}
                    shadow-camera-far={span * 8}
                    shadow-camera-left={-span}
                    shadow-camera-right={span}
                    shadow-camera-top={span}
                    shadow-camera-bottom={-span}
                  />
                  <gridHelper args={[Math.max(dims.w, dims.d) * 4, 24, '#2c2c2c', '#1c1c1c']} />
                  {/* shadow catcher — a plane just below the lowest level */}
                  <mesh
                    receiveShadow
                    rotation={[-Math.PI / 2, 0, 0]}
                    position={[0, minFloor * (FH + FLOOR_GAP) - 0.02, 0]}
                  >
                    <planeGeometry args={[span * 8, span * 8]} />
                    <shadowMaterial transparent opacity={0.38} />
                  </mesh>
                  {displayUnits.map((u) => (
                    <UnitMesh
                      key={u.unit_ulpin}
                      unit={u}
                      w={dims.w}
                      d={dims.d}
                      fh={FH}
                      color={floorColor(u.floor_index, maxFloor)}
                      selected={selUlpin === u.unit_ulpin}
                      onPick={(unit) => setSelUlpin(unit.unit_ulpin)}
                    />
                  ))}
                  <OrbitControls />
                </Canvas>
              </div>
            </div>
          )}
        </section>

        <aside className="sidebar">
          {!selId && (
            <div className="panel-section acc-blue">
              <h3>3D ULPIN explorer</h3>
              {buildings.length === 0 ? (
                <>
                  <p className="muted tiny">
                    no saved buildings yet — run a LiDAR scan first, then come back here to open a
                    building in 3D and mint its ULPIN unit tree.
                  </p>
                  <div className="btn-row">
                    {canManage && (
                      <Link to="/lidar" className="btn primary">
                        run a LiDAR scan
                      </Link>
                    )}
                    <Link to="/dashboard" className="btn">
                      open dashboard
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <p className="muted tiny">
                    pick a building below or click it on the map — it opens in 3D with all of its
                    sections, ULPINs, owners and details.
                  </p>
                  <input
                    className="search"
                    placeholder="search name, id, owner, ULPIN or DIGIPIN…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  <div className="picker-list">
                    {candidates.map(({ p, note, sub, ulpin }) => (
                      <div
                        key={p.building_id}
                        className="nav-row"
                        title={sub || p.building_id}
                        onClick={() => selectBuilding(p.building_id, ulpin || null)}
                      >
                        <span className="session-label" title={p.building_id}>
                          {p.name || p.building_id}
                        </span>
                        <span className="muted tiny">{note || `${p.stories ?? '—'} str`}</span>
                        <span className="enter-hint tiny">open →</span>
                      </div>
                    ))}
                    {!candidates.length && (
                      <p className="muted tiny">no building matches “{query}”.</p>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
          {selected && (
            <div className="panel-section acc-brass">
              <h3>base ULPIN</h3>
              <p className="ulpin">{baseUlpin || '— generate units to mint the base ULPIN —'}</p>
              {canManage && (
                <>
                  <div className="edit-form">
                    <label>
                      <span>floors</span>
                      <input type="number" min="1" max="60" value={floors} onChange={(e) => setFloors(Math.max(1, parseInt(e.target.value) || 1))} />
                    </label>
                    <label>
                      <span>basements</span>
                      <input type="number" min="0" max="6" value={basements} onChange={(e) => setBasements(Math.max(0, parseInt(e.target.value) || 0))} />
                    </label>
                    <label>
                      <span>floor h (m)</span>
                      <input type="number" min="0.5" step="0.1" value={fh} onChange={(e) => setFh(Math.max(0.5, parseFloat(e.target.value) || 3))} />
                    </label>
                  </div>
                  <label className="upload-field">
                    <span>floor plan image (YOLOv11-seg)</span>
                    <input type="file" accept=".png,.jpg,.jpeg" onChange={(e) => setPlanFile(e.target.files[0] || null)} />
                  </label>
                  <div className="btn-row">
                    <button className="btn primary" disabled={busy} onClick={generate}>
                      {busy ? 'generating…' : 'generate units'}
                    </button>
                    {units.length > 0 && (
                      <button className="btn danger" onClick={clear}>clear units</button>
                    )}
                  </div>
                  {msg && <p className="all-clear tiny">{msg}</p>}
                  {err && <div className="error mono tiny">{err}</div>}
                </>
              )}
            </div>
          )}

          {selected && geo && (
            <div className="panel-section acc-mauve">
              <h3>building details</h3>
              <table className="kv">
                <tbody>
                  <tr><td>name</td><td>{selected.properties.name || selId}</td></tr>
                  <tr><td>building id</td><td className="mono tiny">{selId}</td></tr>
                  <tr><td>footprint</td><td>{Math.round(geo.areaSqm).toLocaleString('en-IN')} m²</td></tr>
                  <tr><td>storeys</td><td>{selected.properties.stories || 1}{(selected.properties.basements || 0) > 0 ? ` (+${selected.properties.basements} basement)` : ''}</td></tr>
                  <tr><td>storey height</td><td>{FH} m</td></tr>
                  <tr><td>units</td><td>{units.length || '— not generated —'}</td></tr>
                  <tr><td>centroid</td><td className="mono tiny">{centroid.lat.toFixed(5)}, {centroid.lon.toFixed(5)}</td></tr>
                  <tr><td>DIGIPIN</td><td className="mono">{digipin(centroid.lat, centroid.lon)}</td></tr>
                </tbody>
              </table>
            </div>
          )}

          {byFloor.length > 0 && (
            <div className="panel-section acc-green">
              <h3>units ({units.length})</h3>
              {byFloor.map(([floor, us]) => (
                <div key={floor}>
                  <div className="ulpin-floor-head">
                    {floor < 0 ? `basement ${-floor}` : `floor ${floor}`}
                  </div>
                  {us.map((u) => {
                    const hasPending = pendingUnitEdits.some((e) => e.unit_ulpin === u.unit_ulpin)
                    const overlaps = detectVolumetricOverlaps(units)
                    const hasOverlap = overlaps.some((o) => o.unitA_ulpin === u.unit_ulpin || o.unitB_ulpin === u.unit_ulpin)
                    return (
                      <div
                        key={u.unit_ulpin}
                        className={`nav-row ${selUlpin === u.unit_ulpin ? 'active' : ''} ${hasOverlap ? 'nav-row-overlap' : ''}`}
                        onClick={() => setSelUlpin(u.unit_ulpin)}
                      >
                        <span className="session-label mono tiny" title={u.unit_ulpin}>
                          {u.unit_ulpin}
                          {hasPending && <span className="badge-pending-dot" title="Pending approval"> ●</span>}
                          {hasOverlap && !hasPending && <span className="badge-overlap-dot" title="Overlap detected"> ⚠</span>}
                        </span>
                        <span className="muted tiny">{u.owner_name} · {u.area_sqm} m²</span>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          )}

          {selUnit && (() => {
            const myOverlaps = overlapsForUnit(units, selUnit.unit_ulpin, geo?.areaSqm)
            const myPendingEdit = pendingUnitEdits.find((e) => e.unit_ulpin === selUnit.unit_ulpin)
            const zRange = unitZRange(selUnit)
            return (
              <div className="panel-section acc-slate">
                <div className="section-head">
                  <h3>unit details</h3>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {canEditUnits && !editingUnit && !correctingUnit && (
                      <button className="btn tiny" onClick={startUnitEdit}>edit unit</button>
                    )}
                    {canProposeCorrection && !correctingUnit && !editingUnit && selUnit.validation_status !== 'pending_approval' && (
                      <button className="btn tiny btn-propose" onClick={startCorrection}>propose correction</button>
                    )}
                  </div>
                </div>

                {/* Pending approval badge */}
                {selUnit.validation_status === 'pending_approval' && (
                  <div className="overlap-warning pending-approval-banner">
                    <span>⏳</span>
                    <div>
                      <strong>Pending Registrar Approval</strong>
                      <p style={{ margin: 0, fontSize: 11 }}>Correction proposed by {selUnit.last_edited_by}. Awaiting review.</p>
                    </div>
                  </div>
                )}

                {/* Volumetric overlap alerts */}
                {myOverlaps.length > 0 && (
                  <div className="overlap-card">
                    <div className="overlap-card-header">
                      <span>⚠ Volumetric Overlaps Detected ({myOverlaps.length})</span>
                    </div>
                    {myOverlaps.map((o, i) => {
                      const partner = o.unitA_ulpin === selUnit.unit_ulpin ? o.unitB_ulpin : o.unitA_ulpin
                      const partnerOwner = o.unitA_ulpin === selUnit.unit_ulpin ? o.ownerB : o.ownerA
                      return (
                        <div key={i} className="overlap-row">
                          <div className="overlap-row-unit">
                            <span className="mono tiny">{partner}</span>
                            <span className="muted tiny">{partnerOwner}</span>
                          </div>
                          <div className="overlap-metrics">
                            <span className="badge-overlap-vol">{o.volumeM3} m³</span>
                            <span className="muted tiny">{o.zOverlapM} m vert. · {o.xyOverlapM2} m² XY</span>
                          </div>
                          <button className="btn tiny btn-small-link" onClick={() => setSelUlpin(partner)}>view</button>
                        </div>
                      )
                    })}
                    {canProposeCorrection && selUnit.validation_status !== 'pending_approval' && !correctingUnit && (
                      <button className="btn tiny btn-propose" style={{ marginTop: 8 }} onClick={startCorrection}>
                        Propose Resolution
                      </button>
                    )}
                  </div>
                )}

                {/* Registrar: Pending unit edit approval card */}
                {isRegistrar && myPendingEdit && (
                  <div className="approval-card">
                    <div className="approval-card-header">📋 Pending Correction — Awaiting Your Approval</div>
                    <table className="diff-table">
                      <thead><tr><th>Field</th><th>Before</th><th>After</th></tr></thead>
                      <tbody>
                        {Object.keys(myPendingEdit.after).map((k) => {
                          const bv = myPendingEdit.before[k]
                          const av = myPendingEdit.after[k]
                          const changed = String(bv) !== String(av)
                          return (
                            <tr key={k} className={changed ? 'diff-changed' : ''}>
                              <td>{k.replace(/_/g, ' ')}</td>
                              <td className={changed ? 'diff-before' : ''}>{bv ?? '—'}</td>
                              <td className={changed ? 'diff-after' : ''}>{av ?? '—'}</td>
                            </tr>
                          )
                        })}
                        <tr className="diff-overlap-row">
                          <td>overlap volume</td>
                          <td className="diff-before">{myPendingEdit.overlap_before_m3} m³</td>
                          <td className="diff-after">{myPendingEdit.overlap_after_m3} m³</td>
                        </tr>
                      </tbody>
                    </table>
                    {myPendingEdit.resolution_note && (
                      <p className="muted tiny" style={{ marginTop: 6 }}>Note: {myPendingEdit.resolution_note}</p>
                    )}
                    <p className="muted tiny">Proposed by {myPendingEdit.proposed_by} · {new Date(myPendingEdit.created_at).toLocaleString()}</p>
                    <div className="btn-row">
                      <button className="btn primary" disabled={busy} onClick={() => handleApprove(myPendingEdit.id)}>✓ Approve</button>
                      <button className="btn danger" onClick={() => { setRejectEditId(myPendingEdit.id); setRejectReason('') }}>✗ Reject</button>
                    </div>
                  </div>
                )}

                {/* Reject dialog */}
                {isRegistrar && rejectEditId && (
                  <div className="reject-dialog">
                    <p style={{ margin: '0 0 6px', fontWeight: 600 }}>Rejection Reason</p>
                    <textarea
                      className="reject-textarea"
                      rows={3}
                      placeholder="Explain why this correction is rejected…"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                    />
                    <div className="btn-row">
                      <button className="btn danger" disabled={busy} onClick={handleReject}>Confirm Rejection</button>
                      <button className="btn" onClick={() => { setRejectEditId(null); setRejectReason('') }}>Cancel</button>
                    </div>
                  </div>
                )}

                {/* Surveyor: Correction form */}
                {correctingUnit && correctionDraft && (
                  <div className="correction-form">
                    <div className="correction-form-header">📝 Propose Correction</div>
                    <div className="edit-form">
                      <label>
                        <span>owner name</span>
                        <input
                          value={correctionDraft.owner_name}
                          onChange={(e) => setCorrectionDraft({ ...correctionDraft, owner_name: e.target.value })}
                        />
                      </label>
                      <label>
                        <span>rights type</span>
                        <select
                          value={correctionDraft.rights_type}
                          onChange={(e) => setCorrectionDraft({ ...correctionDraft, rights_type: e.target.value })}
                        >
                          <option value="freehold">freehold</option>
                          <option value="leasehold">leasehold</option>
                          <option value="common">common</option>
                          <option value="air-rights">air-rights</option>
                        </select>
                      </label>
                      <label>
                        <span>area (m²)</span>
                        <input
                          type="number" min="1"
                          value={correctionDraft.area_sqm}
                          onChange={(e) => setCorrectionDraft({ ...correctionDraft, area_sqm: e.target.value })}
                        />
                      </label>
                      <label>
                        <span>resolution note</span>
                        <textarea
                          rows={2}
                          placeholder="Describe the correction and why…"
                          value={correctionDraft.resolution_note}
                          onChange={(e) => setCorrectionDraft({ ...correctionDraft, resolution_note: e.target.value })}
                        />
                      </label>
                      {correctionErr && <div className="error mono tiny">{correctionErr}</div>}
                      <div className="btn-row">
                        <button className="btn primary" disabled={busy} onClick={submitCorrection}>
                          {busy ? 'submitting…' : 'Submit for Approval'}
                        </button>
                        <button className="btn" onClick={() => { setCorrectingUnit(false); setCorrectionDraft(null) }}>cancel</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Read-only unit details */}
                {!editingUnit && !correctingUnit && (
                  <table className="kv">
                    <tbody>
                      <tr><td>ULPIN</td><td className="mono">{selUnit.unit_ulpin}</td></tr>
                      <tr><td>DIGIPIN</td><td className="mono">{unitGeo(selUnit)?.digipin || '—'}</td></tr>
                      <tr><td>building</td><td>{selected?.properties.name || selId}</td></tr>
                      <tr><td>floor</td><td>{selUnit.floor_index < 0 ? `basement ${-selUnit.floor_index}` : `floor ${selUnit.floor_index}`}</td></tr>
                      <tr><td>z-range</td><td>{zRange.zMin.toFixed(1)} m → {zRange.zMax.toFixed(1)} m</td></tr>
                      <tr><td>centroid</td><td className="mono tiny">{unitGeo(selUnit) ? `${unitGeo(selUnit).lat.toFixed(6)}, ${unitGeo(selUnit).lon.toFixed(6)}` : '—'}</td></tr>
                      <tr><td>unit no.</td><td>U{selUnit.unit_no}</td></tr>
                      <tr><td>area</td><td>{selUnit.area_sqm} m²</td></tr>
                      <tr><td>rights</td><td>{selUnit.rights_type}</td></tr>
                      <tr><td>owner</td><td><strong>{selUnit.owner_name}</strong></td></tr>
                      <tr><td>owner id</td><td className="mono">{selUnit.owner_id}</td></tr>
                      <tr><td>overlaps</td><td className={myOverlaps.length ? 'status-pending' : 'status-confirmed'}>{myOverlaps.length ? `${myOverlaps.length} conflict(s)` : 'none'}</td></tr>
                      <tr><td>status</td><td className={selUnit.validation_status === 'pending_approval' ? 'status-pending' : selUnit.validation_status === 'conflict' ? 'status-pending' : 'status-confirmed'}>{selUnit.validation_status}</td></tr>
                      <tr><td>segmentation</td><td>{selUnit.segmentation}</td></tr>
                      {selUnit.updated_at && (
                        <tr><td>last edit</td><td className="tiny">by {selUnit.last_edited_by} · {new Date(selUnit.updated_at).toLocaleString()}</td></tr>
                      )}
                    </tbody>
                  </table>
                )}

                {/* Registrar direct edit form */}
                {editingUnit && (
                  <div className="edit-form">
                    <label>
                      <span>owner name</span>
                      <input
                        value={unitDraft.owner_name}
                        onChange={(e) => setUnitDraft({ ...unitDraft, owner_name: e.target.value })}
                      />
                    </label>
                    <label>
                      <span>rights type</span>
                      <select
                        value={unitDraft.rights_type}
                        onChange={(e) => setUnitDraft({ ...unitDraft, rights_type: e.target.value })}
                      >
                        <option value="freehold">freehold</option>
                        <option value="leasehold">leasehold</option>
                        <option value="common">common</option>
                        <option value="air-rights">air-rights</option>
                      </select>
                    </label>
                    <label>
                      <span>area (m²)</span>
                      <input
                        type="number" min="1"
                        value={unitDraft.area_sqm}
                        onChange={(e) => setUnitDraft({ ...unitDraft, area_sqm: e.target.value })}
                      />
                    </label>
                    <label>
                      <span>status</span>
                      <select
                        value={unitDraft.validation_status}
                        onChange={(e) => setUnitDraft({ ...unitDraft, validation_status: e.target.value })}
                      >
                        <option value="confirmed">confirmed</option>
                        <option value="conflict">conflict</option>
                        <option value="pending review">pending review</option>
                      </select>
                    </label>
                    <div className="btn-row">
                      <button className="btn primary" disabled={busy} onClick={saveUnitEdits}>
                        save changes
                      </button>
                      <button className="btn" onClick={() => setEditingUnit(false)}>cancel</button>
                    </div>
                  </div>
                )}

                {/* Edit history */}
                {!editingUnit && !correctingUnit && selUnit.edit_history?.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Change History</div>
                    {selUnit.edit_history.slice().reverse().map((h, i) => (
                      <div key={i} className="history-row">
                        <span className={`badge-role badge-role-${h.role}`}>{h.role}</span>
                        <span className="muted tiny">{new Date(h.at).toLocaleString()} · {h.by}</span>
                        <p className="history-change">{h.change}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })()}

          {selSlab && (
            <div className="panel-section acc-clay">
              <h3>section details</h3>
              <table className="kv">
                <tbody>
                  <tr><td>section</td><td>{selSlab.floor_index < 0 ? `basement ${-selSlab.floor_index}` : `floor ${selSlab.floor_index}`}</td></tr>
                  <tr><td>building</td><td>{selected?.properties.name || selId}</td></tr>
                  <tr><td>z-range</td><td>{selSlab.floor_index * FH} m → {(selSlab.floor_index + 1) * FH} m</td></tr>
                  <tr><td>footprint</td><td>{geo ? `${Math.round(geo.areaSqm).toLocaleString('en-IN')} m²` : '—'}</td></tr>
                  <tr><td>DIGIPIN</td><td className="mono">{centroid ? digipin(centroid.lat, centroid.lon) : '—'}</td></tr>
                  <tr><td>ULPINs</td><td>generate units to populate this section</td></tr>
                </tbody>
              </table>
            </div>
          )}
        </aside>
      </main>
  )
}
