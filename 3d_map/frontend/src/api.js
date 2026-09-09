// ── Demo build — no backend ─────────────────────────────────────────────────
// The whole FastAPI/PostGIS backend was removed for the demo. Every exported
// function keeps its original signature but is answered client-side:
//   · the city (Chennai · T. Nagar, ~6000 buildings from OpenStreetMap) is
//     baked into src/data/chennai_buildings.json and lazy-imported as a chunk
//   · edits / deletions / ULPIN units persist to localStorage, so the demo is
//     fully interactive without a server
// The baked dataset is immutable; only user mutations go to localStorage.

const MUT_KEY = 'layerd-demo-mutations'
const UNITS_KEY = 'layerd-demo-units'

const SESSION = {
  session_id: 'chennai-t-nagar',
  label: 'Chennai · T. Nagar — OSM demo scan',
  created_at: '2026-09-01T09:14:00Z',
  source: 'demo-osm',
}

let fcCache = null // lazy-loaded FeatureCollection

async function city() {
  if (!fcCache) fcCache = (await import('./data/chennai_buildings.json')).default
  return fcCache
}

function muts() {
  try {
    return JSON.parse(localStorage.getItem(MUT_KEY)) || {}
  } catch {
    return {}
  }
}
const saveMuts = (m) => localStorage.setItem(MUT_KEY, JSON.stringify(m))

function unitsDb() {
  try {
    return JSON.parse(localStorage.getItem(UNITS_KEY)) || {}
  } catch {
    return {}
  }
}
const saveUnits = (u) => {
  localStorage.setItem(UNITS_KEY, JSON.stringify(u))
  window.dispatchEvent(new Event('demo-units-changed'))
}

const applyMuts = async () => {
  const fc = await city()
  const m = muts()
  const deleted = new Set(m.deleted || [])
  const features = fc.features
    .filter((f) => !deleted.has(f.properties.building_id))
    .map((f) => (m.edits && m.edits[f.properties.building_id]) || f)
  return { type: 'FeatureCollection', features }
}

function stableHash(s) {
  let h = 0
  for (let i = 0; i < String(s).length; i++) h = (h * 31 + String(s).charCodeAt(i)) | 0
  return Math.abs(h)
}

// ── auth (any prefilled credentials pass) ────────────────────────────────────
// display name follows the role, per demo spec
const DEMO_NAMES = {
  citizen: 'Citizen 1',
  surveyor: 'Surveyor 1',
  registrar: 'Registrar 1',
}
export const login = (username, password, role) =>
  Promise.resolve({ username, name: DEMO_NAMES[role] || username, role })

// ── extraction (LiDAR) — not part of the demo build ─────────────────────────
export const startExtraction = () =>
  Promise.reject(new Error('LiDAR extraction is not available in the demo build'))
export const getExtractionStatus = () =>
  Promise.reject(new Error('LiDAR extraction is not available in the demo build'))

// ── saved buildings ──────────────────────────────────────────────────────────
export const getSavedBuildings = async () => applyMuts()

export const getSavedStatus = async () => {
  const fc = await applyMuts()
  return {
    building_count: fc.features.length,
    sessions: 1,
    postgis: { enabled: false, reason: 'demo build — data is baked in' },
  }
}

export const getSessions = async () => {
  const fc = await applyMuts()
  const m = muts()
  const deleted = new Set(m.deletedSessions || [])
  if (deleted.has(SESSION.session_id)) return []
  return [{ ...SESSION, building_count: fc.features.length }]
}

export const deleteSession = async (sessionId) => {
  const m = muts()
  m.deletedSessions = [...new Set([...(m.deletedSessions || []), sessionId])]
  saveMuts(m)
}

export const syncSavedBuildings = async (fc, sessionId) => {
  // no backend to reconcile with — edits made in the working set simply stay
  return { synced: fc?.features?.length || 0, session_id: sessionId }
}

// ── building edits ───────────────────────────────────────────────────────────
export const updateBuilding = async (feature) => {
  const m = muts()
  m.edits = m.edits || {}
  m.edits[feature.properties.building_id] = feature
  saveMuts(m)
  return { ok: true }
}

export const confirmBuildingEdit = async (buildingId, status, entry) => {
  const m = muts()
  m.edits = m.edits || {}
  const cur = m.edits[buildingId]
  if (cur) {
    cur.properties = {
      ...cur.properties,
      edit_status: status,
      edit_history: [...(cur.properties.edit_history || []), entry],
    }
    m.edits[buildingId] = cur
    saveMuts(m)
  }
  return { ok: true }
}

export const deleteBuilding = async (buildingId) => {
  const m = muts()
  m.deleted = [...new Set([...(m.deleted || []), buildingId])]
  saveMuts(m)
  return { ok: true }
}

export const getRegion = async () => ({ country: 'India', region: 'Chennai, Tamil Nadu' })

// ── citizen portfolio — deterministic demo ownership (exactly 3 buildings) ──
export const citizenOwns = (buildingId) => stableHash(buildingId) % 1500 === 0
export const citizenProperties = async () => {
  const fc = await applyMuts()
  return fc.features.filter((f) => citizenOwns(f.properties.building_id))
}

// ── 3D ULPIN units — generated client-side with a quad-grid segmentation ─────
const RIGHTS = ['freehold', 'leasehold', 'freehold', 'freehold', 'leasehold']
const SURNAMES = [
  'Ramesh Kumar', 'Lakshmi Narayanan', 'Priya Sharma', 'Arun Iyer', 'Deepa Krishnan',
  'Suresh Babu', 'Meena Raghavan', 'Vijay Anand', 'Kavitha Selvam', 'Rahul Menon',
  'Anitha Durai', 'Mohan Pillai', 'Divya Chandran', 'Karthik Subramanian', 'Revathi Nair',
]

export const fetchUnits = async (buildingId) => ({
  units: unitsDb()[buildingId] || [],
})

export const deleteUnits = async (buildingId) => {
  const db = unitsDb()
  delete db[buildingId]
  saveUnits(db)
  return { ok: true }
}

// registrar-only: patch a single unit's record (owner, rights, area, status)
export const updateUnit = async (buildingId, unitUlpin, patch) => {
  const db = unitsDb()
  const units = db[buildingId] || []
  const idx = units.findIndex((u) => u.unit_ulpin === unitUlpin)
  if (idx === -1) throw new Error('unit not found')
  const next = { ...units[idx] }
  if (patch.owner_name != null && String(patch.owner_name).trim()) {
    next.owner_name = String(patch.owner_name).trim()
  }
  if (patch.rights_type) next.rights_type = patch.rights_type
  if (patch.area_sqm != null && patch.area_sqm !== '') {
    const n = Number(patch.area_sqm)
    if (!Number.isNaN(n)) next.area_sqm = Math.max(1, Math.round(n))
  }
  if (patch.validation_status) next.validation_status = patch.validation_status
  next.last_edited_by = 'registrar'
  next.updated_at = new Date().toISOString()
  units[idx] = next
  db[buildingId] = units
  saveUnits(db)
  return { units }
}

export const generateUnits = async (buildingId, { floors, basements }) => {
  const fc = await applyMuts()
  const b = fc.features.find((f) => f.properties.building_id === buildingId)
  if (!b) throw new Error('building not found')
  const n = Math.max(1, parseInt(floors, 10) || 1)
  const nb = Math.max(0, parseInt(basements, 10) || 0)

  // footprint frame in metres (bbox of the ring)
  const ring = b.geometry.coordinates[0]
  const lats = ring.map((c) => c[1])
  const lons = ring.map((c) => c[0])
  const x0 = Math.min(...lons)
  const x1 = Math.max(...lons)
  const y0 = Math.min(...lats)
  const y1 = Math.max(...lats)
  const spanX = x1 - x0
  const spanY = y1 - y0
  const latMid = (y0 + y1) / 2
  const widthM = Math.max(1, spanX * 111320 * Math.cos((latMid * Math.PI) / 180))
  const depthM = Math.max(1, spanY * 110540)

  const baseUlpin = `ULP-TN-${String(stableHash(buildingId) % 100000).padStart(5, '0')}`

  // segmentation strategy — deterministic per building, so only *some*
  // buildings have their floors divided into sections and re-runs are stable
  const roll = stableHash(buildingId) % 10
  const strategy =
    roll < 4 ? 'quad-grid' : roll < 6 ? 'strip-3' : roll < 8 ? 'mixed' : 'single'

  // deterministic jitter per floor (±amp around 0)
  const jitter = (floorIndex, k, amp) =>
    ((stableHash(`${buildingId}:${floorIndex}:${k}`) % 1000) / 1000 - 0.5) * 2 * amp
  const rect = (xa, xb, ya, yb) => [
    [xa, ya],
    [xb, ya],
    [xb, yb],
    [xa, yb],
  ]

  // section polygons (normalised 0..1 over the bbox) for one floor
  const sectionsForFloor = (floorIndex) => {
    if (strategy === 'single') {
      // one section: the whole floor plate
      return [rect(0.03, 0.97, 0.03, 0.97)]
    }
    if (strategy === 'quad-grid') {
      // 2×2 sections with a jittered cross divider
      const mx = 0.5 + jitter(floorIndex, 1, 0.08)
      const my = 0.5 + jitter(floorIndex, 2, 0.08)
      return [
        rect(0.02, mx, 0.02, my),
        rect(mx, 0.98, 0.02, my),
        rect(mx, 0.98, my, 0.98),
        rect(0.02, mx, my, 0.98),
      ]
    }
    if (strategy === 'strip-3') {
      // three vertical strips with jittered dividers
      const a = 0.34 + jitter(floorIndex, 1, 0.06)
      const b2 = a + 0.33 + jitter(floorIndex, 2, 0.06)
      return [
        rect(0.02, a, 0.03, 0.97),
        rect(a, b2, 0.03, 0.97),
        rect(b2, 0.98, 0.03, 0.97),
      ]
    }
    // mixed: the split varies floor by floor — some floors stay whole,
    // others divide into two or three sections
    const m = stableHash(`${buildingId}:${floorIndex}`) % 3
    if (m === 0) return [rect(0.03, 0.97, 0.03, 0.97)]
    if (m === 1) {
      const my = 0.5 + jitter(floorIndex, 3, 0.1)
      return [rect(0.03, 0.97, 0.03, my), rect(0.03, 0.97, my, 0.97)]
    }
    const mx = 0.5 + jitter(floorIndex, 4, 0.1)
    return [rect(0.03, mx, 0.03, 0.97), rect(mx, 0.97, 0.03, 0.97)]
  }

  const levels = [
    ...Array.from({ length: nb }, (_, i) => -(nb - i)),
    ...Array.from({ length: n }, (_, i) => i + 1),
  ]
  const units = []
  let unitNo = 0
  for (const floorIndex of levels) {
    for (const poly of sectionsForFloor(floorIndex)) {
      unitNo++
      const seed = stableHash(`${buildingId}:${floorIndex}:${unitNo}`)
      // real section area (m²) — shoelace on the normalised polygon, scaled
      // into the footprint's metre frame
      let a2 = 0
      for (let i = 0; i < poly.length; i++) {
        const [ax, ay] = poly[i]
        const [bx, by] = poly[(i + 1) % poly.length]
        a2 += ax * by - bx * ay
      }
      const areaSqm = Math.max(8, Math.round(Math.abs(a2 / 2) * widthM * depthM))
      units.push({
        unit_ulpin: `${baseUlpin}-F${floorIndex < 0 ? `B${-floorIndex}` : floorIndex}U${unitNo}`,
        building_id: buildingId,
        floor_index: floorIndex,
        unit_no: unitNo,
        polygon: poly,
        area_sqm: areaSqm,
        rights_type: RIGHTS[seed % RIGHTS.length],
        owner_name: SURNAMES[(seed >> 5) % SURNAMES.length],
        owner_id: `TN-PAN-${String((seed % 9000000000) + 1000000000)}`,
        validation_status: seed % 11 === 0 ? 'conflict' : 'confirmed',
        segmentation: strategy,
      })
    }
  }
  const db = unitsDb()
  db[buildingId] = units
  saveUnits(db)
  return { units, unit_count: units.length, segmentation: strategy, base_ulpin: baseUlpin }
}

// ── map-hover helpers (shared identity scheme with generateUnits) ────────────
export const demoBaseUlpin = (buildingId) =>
  `ULP-TN-${String(stableHash(buildingId) % 100000).padStart(5, '0')}`
export const demoOwner = (seed) => SURNAMES[stableHash(seed) % SURNAMES.length]
export const peekUnits = (buildingId) => unitsDb()[buildingId] || []

// every generated unit across all buildings (for the registrar search index)
export const allUnits = () => {
  const out = []
  for (const [buildingId, units] of Object.entries(unitsDb())) {
    for (const u of units || []) out.push({ ...u, building_id: u.building_id || buildingId })
  }
  return out
}

// DIGIPIN — India's official digital address code (DoLR / India Post): a
// 10-level 4×4 grid encoding of lat/lon inside India's bounding box (~3.8 m).
// Single source of truth — used by the map hover tooltip and the ULPIN view.
const DIGIPIN_GRID = [
  ['F', 'C', '9', '8'],
  ['J', '3', '2', '7'],
  ['K', '4', '5', '6'],
  ['L', 'M', 'P', 'T'],
]
export const digipin = (lat, lon) => {
  let latMin = 2.5, latMax = 38.5, lonMin = 63.5, lonMax = 99.5
  let out = ''
  for (let level = 0; level < 10; level++) {
    const latDiv = (latMax - latMin) / 4
    const lonDiv = (lonMax - lonMin) / 4
    const row = Math.min(3, Math.max(0, Math.floor((latMax - lat) / latDiv)))
    const col = Math.min(3, Math.max(0, Math.floor((lon - lonMin) / lonDiv)))
    out += DIGIPIN_GRID[row][col]
    if (level === 2 || level === 5) out += '-'
    // row counts down from latMax, col counts right from lonMin
    latMax = latMax - latDiv * row
    latMin = latMax - latDiv
    lonMin = lonMin + lonDiv * col
    lonMax = lonMin + lonDiv
  }
  return out
}
