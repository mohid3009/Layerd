import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, NavLink, useNavigate } from 'react-router-dom'
import {
  getSavedBuildings, getSessions, deleteSession, updateBuilding,
  confirmBuildingEdit, deleteBuilding as deleteBuildingApi,
  getRegion, allUnits, demoBaseUlpin, digipin, citizenOwns,
  getPendingUnitEdits, confirmUnitCorrection, rejectUnitCorrection,
  proposeBuildingEdit, confirmPendingBuildingEdit, rejectPendingBuildingEdit, getPendingBuildingEdits,
} from '../api.js'
import BuildingsMap from './BuildingsMap.jsx'
import CitizenDashboard from './CitizenDashboard.jsx'
import Topbar from './layout/Topbar.jsx'

// ── helpers ──────────────────────────────────────────────────────────────────

/** Geographic bbox of one GeoJSON Polygon feature. */
function bboxOfFeature(feature) {
  const ring = feature?.geometry?.type === 'Polygon' ? feature.geometry.coordinates[0] : null
  if (!ring?.length) return null
  // Use a loop rather than Math.min/max spread to avoid RangeError on large rings
  let latMin = Infinity, latMax = -Infinity, lonMin = Infinity, lonMax = -Infinity
  for (const [lon, lat] of ring) {
    if (lat < latMin) latMin = lat
    if (lat > latMax) latMax = lat
    if (lon < lonMin) lonMin = lon
    if (lon > lonMax) lonMax = lon
  }
  return { latMin, lonMin, spanLat: latMax - latMin, spanLon: lonMax - lonMin }
}

// ── component ─────────────────────────────────────────────────────────────────

export default function Dashboard({ session, onLogout, onSwitchRole }) {
  if (!session) return <Navigate to="/" replace />

  const [state, setState]               = useState('loading') // loading | ready | empty | unavailable
  const [features, setFeatures]         = useState([])
  const [sessions, setSessions]         = useState([])
  const [focusSid, setFocusSid]         = useState(null)   // focused session inside a region
  const [regionData, setRegionData]     = useState({})     // cluster key -> { country, region }
  const [selCountry, setSelCountry]     = useState(null)
  const [selRegion, setSelRegion]       = useState(null)   // "country||region" key
  const [selectedId, setSelectedId]     = useState(null)
  const [reloadKey, setReloadKey]       = useState(0)
  const [editingBld, setEditingBld]     = useState(false)  // inline dashboard edit
  const [editDraft, setEditDraft]       = useState(null)
  const [panelTab, setPanelTab]         = useState('sessions') // registrar sidebar tab
  const [toast, setToast]               = useState(null)   // { kind: 'success' | 'info', text }
  const [resolvingIds, setResolvingIds] = useState(() => new Set())
  const [unavailableErr, setUnavailableErr] = useState(null)
  const toastTimerRef = useRef(null)

  // first-run orientation: dismissible, remembered for the browser session
  const [guideOpen, setGuideOpen] = useState(() => !sessionStorage.getItem('layerd-guide-seen'))
  const dismissGuide = () => {
    setGuideOpen(false)
    sessionStorage.setItem('layerd-guide-seen', '1')
  }

  // ── data loading ─────────────────────────────────────────────────────────
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

  // If PostgreSQL wasn't reachable, keep retrying every 5 s
  useEffect(() => {
    if (state !== 'unavailable') return
    const t = setTimeout(() => setReloadKey((k) => k + 1), 5000)
    return () => clearTimeout(t)
  }, [state, reloadKey])

  // ── proximity clusters ────────────────────────────────────────────────────
  const clusters = useMemo(() => {
    const meta = new Map() // session_id -> { count, lon, lat }
    for (const f of features) {
      const sid = f.properties.session_id
      const g   = f.geometry
      if (!sid || !g) continue
      const coords = g.type === 'Polygon' ? g.coordinates[0] : (g.coordinates || []).flat()
      if (!coords?.length) continue
      let lon = 0, lat = 0
      for (const [x, y] of coords) { lon += x; lat += y }
      lon /= coords.length; lat /= coords.length
      const m = meta.get(sid) || { count: 0, lon: 0, lat: 0 }
      m.count += 1; m.lon += lon; m.lat += lat
      meta.set(sid, m)
    }
    const TH  = 0.5 // degrees (~55 km)
    const raw = []
    for (const [sid, m] of meta) {
      const s   = { sid, count: m.count, lon: m.lon / m.count, lat: m.lat / m.count }
      let grp   = raw.find((g) => Math.abs(g.lat - s.lat) < TH && Math.abs(g.lon - s.lon) < TH)
      if (!grp) { grp = { sids: [], lonSum: 0, latSum: 0, buildings: 0 }; raw.push(grp) }
      grp.sids.push(sid); grp.lonSum += s.lon; grp.latSum += s.lat; grp.buildings += s.count
    }
    const labelOf = (sid) => sessions.find((x) => x.session_id === sid)?.label || sid
    return raw.map((g) => ({
      key:       `${(g.latSum / g.sids.length).toFixed(2)},${(g.lonSum / g.sids.length).toFixed(2)}`,
      lat:       g.latSum / g.sids.length,
      lon:       g.lonSum / g.sids.length,
      sids:      g.sids,
      buildings: g.buildings,
      objs:      g.sids.map((sid) => ({ sid, label: labelOf(sid), count: meta.get(sid).count })),
    }))
  }, [features, sessions])

  // ── region resolution (Nominatim-backed in production, stub in demo) ──────
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
    return () => { cancelled = true }
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
      const c  = countries.get(country)
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

  const visibleFeatures = useMemo(() => {
    if (focusSid) return features.filter((f) => f.properties.session_id === focusSid)
    if (visibleSids) return features.filter((f) => visibleSids.has(f.properties.session_id))
    return features
  }, [features, focusSid, visibleSids])

  const focusSession  = (sid) => setFocusSid((cur) => (cur === sid ? null : sid))
  const removeSession = (sid) => {
    deleteSession(sid)
      .then(() => setReloadKey((k) => k + 1))
      .catch((e) => console.error('session delete failed:', e))
  }

  const canEdit         = session?.role === 'surveyor'
  const isRegistrar     = session?.role === 'registrar'
  const isSurveyor      = session?.role === 'surveyor'
  const isCitizen       = session?.role === 'citizen'
  const canEditBuildings = true
  const navigate        = useNavigate()

  const [citizenMapView, setCitizenMapView] = useState(false)

  const ownedIds = useMemo(
    () => isCitizen
      ? features.filter((f) => citizenOwns(f.properties.building_id)).map((f) => f.properties.building_id)
      : null,
    [features, isCitizen],
  )

  const citizenMapFeatures = useMemo(() => {
    if (!isCitizen) return null
    if (selectedId) {
      const f = features.find((x) => x.properties.building_id === selectedId)
      if (f) return [f]
    }
    return features.filter((f) => citizenOwns(f.properties.building_id))
  }, [isCitizen, features, selectedId])

  // ── registrar search ──────────────────────────────────────────────────────
  const [searchQ, setSearchQ]       = useState('')
  const [searchFocus, setSearchFocus] = useState(false)
  const [unitsVersion, setUnitsVersion] = useState(0)
  useEffect(() => {
    const bump = () => setUnitsVersion((v) => v + 1)
    window.addEventListener('demo-units-changed', bump)
    return () => window.removeEventListener('demo-units-changed', bump)
  }, [])

  const [pendingUnitEdits, setPendingUnitEdits] = useState(() => getPendingUnitEdits())
  const [pendingBuildingProposals, setPendingBuildingProposals] = useState(() => getPendingBuildingEdits())

  useEffect(() => {
    const refresh = () => {
      setPendingUnitEdits(getPendingUnitEdits())
      setPendingBuildingProposals(getPendingBuildingEdits())
    }
    window.addEventListener('demo-pending-unit-edits-changed', refresh)
    window.addEventListener('demo-pending-building-edits-changed', refresh)
    window.addEventListener('demo-units-changed', refresh)
    return () => {
      window.removeEventListener('demo-pending-unit-edits-changed', refresh)
      window.removeEventListener('demo-pending-building-edits-changed', refresh)
      window.removeEventListener('demo-units-changed', refresh)
    }
  }, [])

  const [rejectBldProposalId, setRejectBldProposalId] = useState(null)
  const [rejectBldProposalReason, setRejectBldProposalReason] = useState('')

  const handleApproveBuildingProposal = async (proposalId) => {
    try {
      const res = await confirmPendingBuildingEdit(proposalId, session)
      showToast('success', `✓ Building proposal approved & updated live`)
      setFeatures((prev) =>
        prev.map((f) => (f.properties.building_id === res.building.properties.building_id ? res.building : f))
      )
    } catch (e) {
      showToast('info', `Error: ${e.message}`)
    }
  }

  const handleRejectBuildingProposal = async () => {
    if (!rejectBldProposalId) return
    try {
      await rejectPendingBuildingEdit(rejectBldProposalId, session, rejectBldProposalReason)
      setRejectBldProposalId(null)
      setRejectBldProposalReason('')
      showToast('info', 'Building proposal rejected')
      setReloadKey((k) => k + 1)
    } catch (e) {
      showToast('info', `Error: ${e.message}`)
    }
  }

  const [rejectUnitId, setRejectUnitId]       = useState(null)
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
      const f    = byId.get(u.building_id)
      let pin    = ''
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
        sub:   `${u.owner_name} · ${u.validation_status}${pin ? ` · ${pin}` : ''}`,
        hay:   `${u.unit_ulpin} ${u.owner_name} ${pin}`.toLowerCase(),
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
          id:   p.building_id,
          name: p.name || p.building_id,
          note: hits[0].ulpin,
          sub:  hits.length > 1 ? `${hits[0].sub} · +${hits.length - 1} more` : hits[0].sub,
        })
      }
    }
    return out.slice(0, 8)
  }, [searchQ, features, unitIndex])

  const goToSearchResult = (r) => {
    setSearchQ(''); setSearchFocus(false)
    setSelCountry(null); setSelRegion(null); setFocusSid(null)
    setSelectedId(r.id)
  }

  const showToast = (kind, text) => {
    setToast({ kind, text })
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setToast(null), 4200)
  }

  const pendingFeatures = useMemo(
    () => features.filter((f) => f.properties.edit_status === 'pending'),
    [features],
  )

  // ── building edit / confirm / delete ─────────────────────────────────────
  const saveBuildingEdit = async () => {
    if (!selectedId || !editDraft) return
    const feature = features.find((f) => f.properties.building_id === selectedId)
    if (!feature) return

    const stories = Math.min(10, Math.max(1, parseInt(editDraft.floors) || 1))
    const basements = Math.max(0, parseInt(editDraft.basements) || 0)
    const height_m = Math.min(30, Math.max(0.5, parseFloat(editDraft.height) || stories * 3))
    const note = editDraft.note || ''
    const file = editDraft.spatialFile || null

    try {
      const res = await proposeBuildingEdit(
        selectedId,
        { height_m, stories, basements, asset_type: editDraft.assetType, note },
        session,
        file
      )

      if (res.pending) {
        showToast('info', `Proposal submitted for Registrar review — ${selectedId}`)
        setFeatures((prev) =>
          prev.map((f) =>
            f.properties.building_id === selectedId
              ? { ...f, properties: { ...f.properties, edit_status: 'pending', pending_proposal_id: res.proposal.id } }
              : f
          )
        )
      } else {
        showToast('success', `✓ saved & updated live — ${selectedId}`)
        setFeatures((prev) =>
          prev.map((f) => (f.properties.building_id === selectedId ? res.building : f))
        )
      }
      setEditingBld(false)
      setEditDraft(null)
    } catch (err) {
      console.error('Save building edit error:', err)
      showToast('info', `Error: ${err.message}`)
    }
  }

  const confirmBuilding = (bid) => {
    const entry = {
      at: new Date().toISOString(), by: session.name, role: session.role,
      change: 'edit confirmed by registrar',
    }
    setResolvingIds((prev) => new Set(prev).add(bid))
    confirmBuildingEdit(bid, 'confirmed', entry)
      .then(() => {
        showToast('success', `✓ edit confirmed — ${bid}`)
        setTimeout(() => {
          setFeatures((prev) =>
            prev.map((f) =>
              f.properties.building_id === bid
                ? { ...f, properties: { ...f.properties, edit_status: 'confirmed', edit_history: [...(f.properties.edit_history || []), entry] } }
                : f,
            ),
          )
          setResolvingIds((prev) => { const next = new Set(prev); next.delete(bid); return next })
        }, 700)
      })
      .catch((e) => {
        setResolvingIds((prev) => { const next = new Set(prev); next.delete(bid); return next })
        console.error('confirm failed:', e.message)
      })
  }

  const handleFootprintDrawn = (bid, ring) => {
    const feature = features.find((f) => f.properties.building_id === bid)
    if (!feature) return
    const p      = feature.properties
    const status = session.role === 'registrar' ? 'confirmed' : 'pending'
    const updated = {
      ...feature,
      geometry: { type: 'Polygon', coordinates: [ring] },
      properties: {
        ...p,
        height_source: p.height_source === 'manual' ? 'manual' : 'edited',
        color:        '#2fbf8f',
        edit_status:  status,
        edit_history: [
          ...(p.edit_history || []),
          {
            at: new Date().toISOString(), by: session.name, role: session.role,
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

  const openPendingBuilding = (f) => {
    setSelCountry(null); setSelRegion(null); setFocusSid(null)
    setSelectedId(f.properties.building_id)
  }

  const removeBuilding = (bid) => {
    deleteBuildingApi(bid)
      .then(() => {
        setFeatures((prev) => prev.filter((f) => f.properties.building_id !== bid))
        setSelectedId(null); setEditingBld(false); setEditDraft(null)
        showToast('info', `building deleted — ${bid}`)
      })
      .catch((e) => console.error('building delete failed:', e.message))
  }

  const selected = useMemo(
    () => visibleFeatures.find((f) => f.properties.building_id === selectedId)?.properties ?? null,
    [visibleFeatures, selectedId],
  )

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
    const assumed   = visibleFeatures.filter((f) => f.properties.height_source === 'assumed-1-story').length
    const edited    = visibleFeatures.filter((f) => ['edited', 'manual'].includes(f.properties.height_source)).length
    const heights   = visibleFeatures.map((f) => f.properties.height_m || 0)
    return {
      n, fromLidar, assumed, edited,
      tallest: heights.reduce((a, b) => Math.max(a, b), 0),
      mean:    heights.reduce((a, b) => a + b, 0) / n,
    }
  }, [visibleFeatures])

  // ── citizen map view ──────────────────────────────────────────────────────
  if (isCitizen && !citizenMapView) {
    return (
      <div className="app min-h-screen citizen-dash" style={{ background: '#F5F6F8', color: '#1C2530', overflowY: 'auto' }}>
        <Topbar session={session} onLogout={onLogout} onSwitchRole={onSwitchRole} />
        <CitizenDashboard
          session={session}
          onOpenMap={(id) => {
            setSelCountry(null); setSelRegion(null); setFocusSid(null)
            setSelectedId(id || null)
            setCitizenMapView(true)
          }}
        />
      </div>
    )
  }

  // ── main layout ───────────────────────────────────────────────────────────
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
                    no matches for "{searchQ.trim()}".
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
          <span className="guide-step tiny"><b>1</b> click any building on the map for details &amp; edits</span>
          <span className="guide-step tiny">
            <b>2</b> open its <NavLink to="/ulpin">ULPIN units</NavLink> — floors, owners, status
          </span>
          <span style={{ flex: 1 }} />
          <button className="btn tiny" onClick={dismissGuide}>got it</button>
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
            <div className="map-note muted tiny">no buildings in this view — go back to all areas</div>
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
          {selected ? (
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
                    <span>storeys (max 10)</span>
                    <input
                      type="number" min="1" max="10" step="1" value={editDraft.floors}
                      onChange={(e) => {
                        const fl = Math.min(10, Math.max(1, parseInt(e.target.value) || 1))
                        setEditDraft({ ...editDraft, floors: fl, height: +(fl * 3).toFixed(2) })
                      }}
                    />
                  </label>
                  <label>
                    <span>basements</span>
                    <input
                      type="number" min="0" max="6" step="1" value={editDraft.basements ?? 0}
                      onChange={(e) => setEditDraft({ ...editDraft, basements: Math.max(0, parseInt(e.target.value) || 0) })}
                    />
                  </label>
                  <label>
                    <span>height (m)</span>
                    <input
                      type="number" step="0.1" min="0.5" max="30" value={editDraft.height}
                      onChange={(e) => {
                        const h = Math.min(30, Math.max(0.5, parseFloat(e.target.value) || 0))
                        setEditDraft({ ...editDraft, height: e.target.value, floors: Math.min(10, Math.max(1, Math.round(h / 3))) })
                      }}
                    />
                  </label>

                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                    <span className="tiny muted" style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>
                      UPLOAD SPATIAL DATASET (OPTIONAL)
                    </span>
                    <label style={{ display: 'block', marginBottom: 6 }}>
                      <span className="tiny muted">Asset Type</span>
                      <select
                        style={{ width: '100%', background: 'var(--panel2)', border: '1px solid var(--border)', color: 'var(--text)', padding: '4px 6px', borderRadius: 4, fontSize: 11 }}
                        value={editDraft.assetType || 'Floor Plan / Architectural CAD'}
                        onChange={(e) => setEditDraft({ ...editDraft, assetType: e.target.value })}
                      >
                        <option value="Floor Plan / Architectural CAD">Floor Plan / Architectural CAD (.dwg, .dxf, .pdf, .svg, .png, .zip)</option>
                        <option value="LiDAR Point Cloud">LiDAR Point Cloud (.las, .laz, .ply, .pcd)</option>
                        <option value="Oblique Imagery">Oblique Camera Imagery (.jpg, .tiff, .zip)</option>
                        <option value="3D Model">3D Model (.gltf, .glb, .obj, .fbx, .ifc)</option>
                      </select>
                    </label>
                    <label style={{ display: 'block', marginBottom: 6 }}>
                      <span className="tiny muted">File Attachment</span>
                      <input
                        type="file"
                        accept=".dwg,.dxf,.pdf,.svg,.png,.jpg,.jpeg,.tiff,.tif,.zip,.las,.laz,.ply,.pcd,.gltf,.glb,.obj,.fbx,.ifc"
                        style={{ fontSize: 11, width: '100%', color: 'var(--muted)' }}
                        onChange={(e) => {
                          const file = e.target.files[0]
                          if (file) setEditDraft({ ...editDraft, spatialFile: file })
                        }}
                      />
                    </label>
                    {editDraft.spatialFile && (
                      <div className="mono tiny" style={{ color: 'var(--accent)', marginBottom: 6 }}>
                        Selected: {editDraft.spatialFile.name} ({(editDraft.spatialFile.size / (1024 * 1024)).toFixed(2)} MB)
                      </div>
                    )}
                    <label style={{ display: 'block' }}>
                      <span className="tiny muted">Proposal Note / Reason</span>
                      <textarea
                        rows={2}
                        placeholder="Detail height change survey notes or verification source…"
                        style={{ width: '100%', background: 'var(--panel2)', border: '1px solid var(--border)', color: 'var(--text)', padding: '6px', borderRadius: 4, fontSize: 11 }}
                        value={editDraft.note || ''}
                        onChange={(e) => setEditDraft({ ...editDraft, note: e.target.value })}
                      />
                    </label>
                  </div>

                  <div className="btn-row" style={{ marginTop: 12 }}>
                    <button className="btn primary" onClick={saveBuildingEdit}>
                      {session?.role === 'surveyor' ? 'Submit Proposal' : 'Save Direct Update'}
                    </button>
                    <button className="btn" onClick={() => { setEditingBld(false); setEditDraft(null) }}>cancel</button>
                  </div>
                </div>
              ) : canEditBuildings && (
                <div className="btn-row">
                  <button
                    className="btn primary"
                    style={{ fontWeight: 700 }}
                    onClick={() => {
                      setEditDraft({
                        height: selected.height_m,
                        floors: selected.stories,
                        basements: selected.basements || 0,
                        spatialFile: null,
                        assetType: 'Floor Plan / Architectural CAD',
                        note: '',
                      })
                      setEditingBld(true)
                    }}
                  >
                    ✏️ Edit Height &amp; Upload Floor Plan
                  </button>
                  {isRegistrar && selected.edit_status === 'pending' && (
                    <button className="btn primary" title="confirm this surveyor edit" onClick={() => confirmBuilding(selected.building_id)}>
                      ✓ confirm edit
                    </button>
                  )}
                  <button className="btn danger" title="delete this building from PostGIS" onClick={() => removeBuilding(selected.building_id)}>
                    delete
                  </button>
                </div>
              )}

              {selected.spatial_assets && selected.spatial_assets.length > 0 && (
                <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                  <span className="tiny muted" style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>
                    ATTACHED SPATIAL DATASETS ({selected.spatial_assets.length})
                  </span>
                  {selected.spatial_assets.map((asset, idx) => (
                    <div key={idx} style={{ padding: '6px 8px', background: 'var(--panel2)', border: '1px solid var(--border)', borderRadius: 6, marginBottom: 4 }}>
                      <div style={{ fontWeight: 600, color: 'var(--accent)', fontSize: 11 }}>📦 {asset.asset_type}</div>
                      <div className="mono tiny" style={{ color: 'var(--text)' }}>{asset.file_name} ({(asset.file_size / (1024 * 1024)).toFixed(2)} MB)</div>
                      <div className="muted tiny" style={{ fontSize: 10 }}>Uploaded by {asset.uploaded_by} on {new Date(asset.uploaded_at).toLocaleDateString()}</div>
                    </div>
                  ))}
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
                            <td><span className="old-val">{String(from)}</span> → <span className="new-val">{String(to)}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="muted tiny">footprint / spatial proposal — see history below.</p>
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
          ) : canEditBuildings && (
            <div className="panel-section acc-brass" style={{ background: 'rgba(201, 164, 92, 0.08)', borderColor: 'rgba(201, 164, 92, 0.3)' }}>
              <h3 style={{ color: 'var(--accent)', margin: 0, fontSize: 12 }}>💡 Edit Building &amp; Upload Spatial Data</h3>
              <p className="muted tiny" style={{ margin: '6px 0 10px', lineHeight: 1.4 }}>
                Click any building on the 3D map (or search by building ID) to view details, edit height/storeys, and attach LiDAR point clouds, 3D models, or oblique imagery.
              </p>
              {visibleFeatures.length > 0 && (
                <button
                  className="btn tiny primary"
                  onClick={() => setSelectedId(visibleFeatures[0].properties.building_id)}
                >
                  Select Sample Building ({visibleFeatures[0].properties.building_id})
                </button>
              )}
            </div>
          )}

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
                    <button className="btn tiny" onClick={() => { setSelCountry(null); setSelRegion(null) }}>← all countries</button>
                  ) : 'scans'}
                </h3>

                {!selCountry && (
                  <>
                    {countryTree.map((c) => (
                      <div
                        key={c.name}
                        className={`group-row ${c.name === '⏳ locating…' ? 'dim' : ''}`}
                        onClick={() => { if (c.name !== '⏳ locating…') setSelCountry(c.name) }}
                      >
                        <span className="group-name">{c.name}</span>
                        <span className="muted tiny">
                          {c.name === '⏳ locating…'
                            ? 'resolving scan locations'
                            : `${c.regions.length} region${c.regions.length > 1 ? 's' : ''} · ${c.buildings} bld`}
                        </span>
                        <span className="enter-hint tiny">{c.name === '⏳ locating…' ? '' : 'enter country →'}</span>
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
                      <span className="muted tiny">{r.scans.length} scan{r.scans.length > 1 ? 's' : ''} · {r.buildings} bld</span>
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
                              onClick={(e) => { e.stopPropagation(); removeSession(s.sid) }}
                            >✕</button>
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
              <h3>
                building proposals
                {pendingBuildingProposals.length > 0 && (
                  <span className="pending-unit-badge" style={{ marginLeft: 8 }}>{pendingBuildingProposals.length}</span>
                )}
              </h3>
              {pendingBuildingProposals.length ? (
                pendingBuildingProposals.map((p) => (
                  <div key={p.id} className="pending-row" style={{ flexDirection: 'column', gap: 6, alignItems: 'stretch' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="mono tiny">{p.building_id}</span>
                      <span className="muted tiny">{new Date(p.created_at).toLocaleTimeString()}</span>
                    </div>
                    <span className="muted tiny">Proposed by {p.proposed_by} ({p.role})</span>

                    <table className="diff-table" style={{ marginTop: 4 }}>
                      <thead><tr><th>Property</th><th>Current</th><th>Proposed</th></tr></thead>
                      <tbody>
                        {p.before.height_m !== p.after.height_m && (
                          <tr className="diff-changed">
                            <td>Height</td>
                            <td className="diff-before">{p.before.height_m} m</td>
                            <td className="diff-after">{p.after.height_m} m</td>
                          </tr>
                        )}
                        {p.before.stories !== p.after.stories && (
                          <tr className="diff-changed">
                            <td>Storeys</td>
                            <td className="diff-before">{p.before.stories}</td>
                            <td className="diff-after">{p.after.stories}</td>
                          </tr>
                        )}
                        {p.before.basements !== p.after.basements && (
                          <tr className="diff-changed">
                            <td>Basements</td>
                            <td className="diff-before">{p.before.basements}</td>
                            <td className="diff-after">{p.after.basements}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>

                    {/* Render attached spatial asset summary if available */}
                    {p.after.spatial_assets && p.after.spatial_assets.length > p.before.spatial_assets.length && (() => {
                      const newAsset = p.after.spatial_assets[p.after.spatial_assets.length - 1]
                      return (
                        <div style={{ padding: '4px 6px', background: 'rgba(201, 164, 92, 0.12)', border: '1px solid rgba(201, 164, 92, 0.25)', borderRadius: 6, marginTop: 2 }}>
                          <span className="tiny" style={{ color: 'var(--accent)', fontWeight: 600 }}>🏷️ {newAsset.asset_type}: </span>
                          <span className="mono tiny">{newAsset.file_name} ({(newAsset.file_size / (1024 * 1024)).toFixed(2)} MB)</span>
                        </div>
                      )
                    })()}

                    {p.note && <p className="muted tiny" style={{ fontStyle: 'italic', margin: '2px 0' }}>"{p.note}"</p>}

                    {rejectBldProposalId === p.id ? (
                      <div className="reject-dialog" style={{ margin: '4px 0 0' }}>
                        <textarea
                          className="reject-textarea"
                          rows={2}
                          placeholder="Rejection reason…"
                          value={rejectBldProposalReason}
                          onChange={(ev) => setRejectBldProposalReason(ev.target.value)}
                        />
                        <div className="btn-row">
                          <button className="btn danger" onClick={handleRejectBuildingProposal}>Confirm Reject</button>
                          <button className="btn" onClick={() => { setRejectBldProposalId(null); setRejectBldProposalReason('') }}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className="btn-row" style={{ marginTop: 4 }}>
                        <button className="btn primary" onClick={() => handleApproveBuildingProposal(p.id)}>✓ Approve &amp; Apply</button>
                        <button className="btn danger" onClick={() => { setRejectBldProposalId(p.id); setRejectBldProposalReason('') }}>✗ Reject</button>
                        <button className="btn" onClick={() => setSelectedId(p.building_id)}>focus map</button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="all-clear tiny">✓ no building proposals awaiting confirmation.</p>
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
                          <button className="btn" onClick={() => navigate(`/ulpin?building=${encodeURIComponent(e.building_id)}`)}>view unit</button>
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
                      type="number" min="1" step="1" value={editDraft.floors}
                      onChange={(e) => {
                        const fl = Math.max(1, parseInt(e.target.value) || 1)
                        setEditDraft({ ...editDraft, floors: fl, height: +(fl * 3).toFixed(2) })
                      }}
                    />
                  </label>
                  <label>
                    <span>basements</span>
                    <input
                      type="number" min="0" step="1" value={editDraft.basements ?? 0}
                      onChange={(e) => setEditDraft({ ...editDraft, basements: Math.max(0, parseInt(e.target.value) || 0) })}
                    />
                  </label>
                  <label>
                    <span>height (m)</span>
                    <input
                      type="number" step="0.1" min="0.5" value={editDraft.height}
                      onChange={(e) => {
                        const h = parseFloat(e.target.value) || 0
                        setEditDraft({ ...editDraft, height: e.target.value, floors: Math.max(1, Math.round(h / 3)) })
                      }}
                    />
                  </label>

                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                    <span className="tiny muted" style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>
                      UPLOAD SPATIAL DATASET (OPTIONAL)
                    </span>
                    <label style={{ display: 'block', marginBottom: 6 }}>
                      <span className="tiny muted">Asset Type</span>
                      <select
                        style={{ width: '100%', background: 'var(--panel2)', border: '1px solid var(--border)', color: 'var(--text)', padding: '4px 6px', borderRadius: 4, fontSize: 11 }}
                        value={editDraft.assetType || 'Floor Plan / Architectural CAD'}
                        onChange={(e) => setEditDraft({ ...editDraft, assetType: e.target.value })}
                      >
                        <option value="Floor Plan / Architectural CAD">Floor Plan / Architectural CAD (.dwg, .dxf, .pdf, .svg, .png, .zip)</option>
                        <option value="LiDAR Point Cloud">LiDAR Point Cloud (.las, .laz, .ply, .pcd)</option>
                        <option value="Oblique Imagery">Oblique Camera Imagery (.jpg, .tiff, .zip)</option>
                        <option value="3D Model">3D Model (.gltf, .glb, .obj, .fbx, .ifc)</option>
                      </select>
                    </label>
                    <label style={{ display: 'block', marginBottom: 6 }}>
                      <span className="tiny muted">File Attachment</span>
                      <input
                        type="file"
                        accept=".dwg,.dxf,.pdf,.svg,.png,.jpg,.jpeg,.tiff,.tif,.zip,.las,.laz,.ply,.pcd,.gltf,.glb,.obj,.fbx,.ifc"
                        style={{ fontSize: 11, width: '100%', color: 'var(--muted)' }}
                        onChange={(e) => {
                          const file = e.target.files[0]
                          if (file) setEditDraft({ ...editDraft, spatialFile: file })
                        }}
                      />
                    </label>
                    {editDraft.spatialFile && (
                      <div className="mono tiny" style={{ color: 'var(--accent)', marginBottom: 6 }}>
                        Selected: {editDraft.spatialFile.name} ({(editDraft.spatialFile.size / (1024 * 1024)).toFixed(2)} MB)
                      </div>
                    )}
                    <label style={{ display: 'block' }}>
                      <span className="tiny muted">Proposal Note / Reason</span>
                      <textarea
                        rows={2}
                        placeholder="Detail height change survey notes or verification source…"
                        style={{ width: '100%', background: 'var(--panel2)', border: '1px solid var(--border)', color: 'var(--text)', padding: '6px', borderRadius: 4, fontSize: 11 }}
                        value={editDraft.note || ''}
                        onChange={(e) => setEditDraft({ ...editDraft, note: e.target.value })}
                      />
                    </label>
                  </div>

                  <div className="btn-row" style={{ marginTop: 12 }}>
                    <button className="btn primary" onClick={saveBuildingEdit}>
                      {session?.role === 'surveyor' ? 'Submit Proposal' : 'Save Direct Update'}
                    </button>
                    <button className="btn" onClick={() => { setEditingBld(false); setEditDraft(null) }}>cancel</button>
                  </div>
                </div>
              ) : canEditBuildings && (
                <div className="btn-row">
                  <button
                    className="btn primary"
                    style={{ fontWeight: 700 }}
                    onClick={() => {
                      setEditDraft({
                        height: selected.height_m,
                        floors: selected.stories,
                        basements: selected.basements || 0,
                        spatialFile: null,
                        assetType: 'Floor Plan / Architectural CAD',
                        note: '',
                      })
                      setEditingBld(true)
                    }}
                  >
                    ✏️ Edit Height &amp; Upload Floor Plan
                  </button>
                  {isRegistrar && selected.edit_status === 'pending' && (
                    <button className="btn primary" title="confirm this surveyor edit" onClick={() => confirmBuilding(selected.building_id)}>
                      ✓ confirm edit
                    </button>
                  )}
                  <button className="btn danger" title="delete this building from PostGIS" onClick={() => removeBuilding(selected.building_id)}>
                    delete
                  </button>
                </div>
              )}

              {selected.spatial_assets && selected.spatial_assets.length > 0 && (
                <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                  <span className="tiny muted" style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>
                    ATTACHED SPATIAL DATASETS ({selected.spatial_assets.length})
                  </span>
                  {selected.spatial_assets.map((asset, idx) => (
                    <div key={idx} style={{ padding: '6px 8px', background: 'var(--panel2)', border: '1px solid var(--border)', borderRadius: 6, marginBottom: 4 }}>
                      <div style={{ fontWeight: 600, color: 'var(--accent)', fontSize: 11 }}>📦 {asset.asset_type}</div>
                      <div className="mono tiny" style={{ color: 'var(--text)' }}>{asset.file_name} ({(asset.file_size / (1024 * 1024)).toFixed(2)} MB)</div>
                      <div className="muted tiny" style={{ fontSize: 10 }}>Uploaded by {asset.uploaded_by} on {new Date(asset.uploaded_at).toLocaleDateString()}</div>
                    </div>
                  ))}
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
                            <td><span className="old-val">{String(from)}</span> → <span className="new-val">{String(to)}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="muted tiny">footprint / spatial proposal — see history below.</p>
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
