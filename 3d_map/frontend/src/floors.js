import { unitRenderRange } from './verticalGeometry.js'


// Per-floor 3D rendering helper.
//
// Multi-storey buildings are split into one extrusion slice per storey, each
// with its own colour along a ground→roof gradient, so individual floors are
// visually distinguishable in the 3D view. Single-storey buildings pass
// through unchanged and keep their status colours (LiDAR / assumed / edited).
// Every slice keeps the parent's `building_id`, so click-selection and the
// selected-outline filter keep working across all floors of a building.

// hsl(h, s%, l%) → '#rrggbb' (MapLibre paints accept hex everywhere)
export function hslToHex(h, s, l) {
  s /= 100
  l /= 100
  const k = (n) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  const to = (x) => Math.round(255 * x).toString(16).padStart(2, '0')
  return `#${to(f(0))}${to(f(8))}${to(f(4))}`
}

// floor 0 (ground, darkest) → top floor (lightest), in shades of blue with an
// alternating light/dark band per storey — so adjacent floors stay clearly
// distinguishable even on tall buildings with a shallow gradient
export function floorColor(i, n) {
  const t = n <= 1 ? 0 : i / (n - 1)
  const band = i % 2 ? -5 : 3 // stripe: odd floors darker, even floors lighter
  const l = Math.min(88, Math.max(20, 28 + t * 45 + band))
  return hslToHex(216, 68, l)
}

// basement level B1 (lightest grey) → deepest level (darkest grey)
export function basementColor(i, n) {
  const t = n <= 1 ? 0 : i / (n - 1)
  return hslToHex(240, 8, 38 - t * 16)
}

// Expand building features into render slices. Height is divided evenly
// across storeys. Slices stack from the map plane (there is no terrain
// source, so fill-extrusion-base is a render offset, not an elevation —
// using the real ground_z would make buildings float in mid-air).
// Buildings with `basements` levels additionally get one grey slice per
// basement hanging BELOW the map plane (negative base/top), each one
// storey-height deep. Single-storey buildings keep their status colour for
// the above-ground part, so the measured/assumed legend stays truthful.
export function floorSlices(features, floorGap = 0, selectedId = null) {
  const out = []
  for (const f of features) {
    if (!f.geometry) continue
    const p = f.properties
    const isSelected = selectedId && p.building_id === selectedId
    const gap = isSelected ? floorGap : 0
    const stories = Math.min(10, Math.max(1, parseInt(p.stories) || 1))
    const basements = Math.max(0, parseInt(p.basements) || 0)
    const height = p.height_m || 0
    if (!height || (stories <= 1 && basements <= 0)) {
      out.push(f)
      continue
    }
    const slice = height / stories
    if (stories <= 1 && gap <= 0) {
      out.push(f)
    } else {
      for (let i = 0; i < stories; i++) {
        const base = i * (slice + gap)
        const top = base + slice
        out.push({
          ...f,
          properties: {
            ...p,
            floor: i + 1,
            base_m: +base.toFixed(2),
            height_m: +top.toFixed(2),
            color: floorColor(i, stories),
          },
        })
      }
    }
    for (let k = 1; k <= basements; k++) {
      const base = -k * (slice + gap)
      const top = base + slice
      out.push({
        ...f,
        properties: {
          ...p,
          floor: -k, // B1, B2, … below ground
          base_m: +base.toFixed(2),
          height_m: +top.toFixed(2),
          color: basementColor(k - 1, basements),
        },
      })
    }
  }
  return out
}

// ── Unit-section slices (selected building) ─────────────────────────────────
// When the selected building has generated units, its exploded floors are
// rendered as their ACTUAL sections: each unit's polygon (normalised 0..1
// over the footprint bbox by the generator) is mapped back to lng/lat and
// stacked by floor, so the map shows the real section layout of every storey.
export function unitSliceFeatures(feature, units, floorGap = 0) {
  const ring =
    feature?.geometry?.type === 'Polygon' ? feature.geometry.coordinates[0] : null
  if (!ring || !units.length) return []
  const lats = ring.map((c) => c[1])
  const lons = ring.map((c) => c[0])
  const x0 = Math.min(...lons)
  const x1 = Math.max(...lons)
  const y0 = Math.min(...lats)
  const y1 = Math.max(...lats)
  const spanLon = x1 - x0 || 1e-9
  const spanLat = y1 - y0 || 1e-9
  const p = feature.properties
  const stories = Math.max(1, parseInt(p.stories) || 1)
  const basements = Math.max(0, parseInt(p.basements) || 0)
  const slice = (p.height_m || 0) / stories
  const out = []
  for (const u of units) {
    const f = u.floor_index
    const { base, top } = unitRenderRange(u, floorGap)
    const coords = (u.polygon || []).map(([nx, ny]) => [x0 + nx * spanLon, y0 + ny * spanLat])
    if (coords.length < 3) continue
    coords.push(coords[0])
    
    // Subunit color variation per subunit index on the floor
    const subIdx = u.subunit_no || 1
    const baseHue = f < 0 ? 240 : 216
    const baseSat = f < 0 ? 8 : 68
    const baseLum = f < 0 ? Math.max(15, 38 - Math.abs(f) * 10) : Math.min(85, Math.max(25, 28 + (f / stories) * 45))
    const lumOffset = (subIdx % 3 === 1) ? 4 : (subIdx % 3 === 2) ? -5 : 0
    const color = hslToHex((baseHue + (subIdx - 1) * 8) % 360, baseSat, Math.min(90, Math.max(20, baseLum + lumOffset)))

    out.push({
      type: 'Feature',
      properties: {
        ...p,
        floor: f,
        unit_ulpin: u.unit_ulpin,
        subunit_id: u.subunit_id || `SU-${subIdx}`,
        subunit_name: u.subunit_name || u.unit_ulpin,
        subunit_type: u.subunit_type || 'Unit',
        base_m: +base.toFixed(2),
        height_m: +top.toFixed(2),
        color: color,
      },
      geometry: { type: 'Polygon', coordinates: [coords] },
    })
  }
  return out
}

// ── Ground cast-shadows ────────────────────────────────────────────────────
// MapLibre has no native shadow support for fill-extrusions, so we fake the
// sun: each footprint is swept horizontally away from a fixed sun azimuth by
// a distance proportional to the building height, and the shadow polygon is
// the convex hull of the footprint and its offset copy (exact for the mostly
// convex/rectangular footprints in the data, a slight over-reach otherwise).
// The polygons are drawn as a flat dark fill UNDER the extrusions; a paint
// expression makes taller buildings cast denser shadows.

const M_PER_DEG = 111320 // metres per degree latitude
const SHADOW_BEARING = 315 // degrees clockwise from north — shadow points NW (sun in the SE)
const SHADOW_LENGTH_FACTOR = 0.7 // shadow length = height × factor

// Andrew's monotone chain convex hull on [x, y] points
function convexHull(pts) {
  if (pts.length < 4) return pts
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1])
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
  const half = (src) => {
    const out = []
    for (const pt of src) {
      while (out.length >= 2 && cross(out[out.length - 2], out[out.length - 1], pt) <= 0) out.pop()
      out.push(pt)
    }
    return out
  }
  const lower = half(p)
  const upper = half([...p].reverse())
  return lower.slice(0, -1).concat(upper.slice(0, -1))
}

// Building-level features → FeatureCollection of shadow polygons on the ground
export function shadowFeatures(features) {
  const out = []
  const rad = Math.PI / 180
  const dirX = Math.sin(SHADOW_BEARING * rad)
  const dirY = Math.cos(SHADOW_BEARING * rad)
  for (const f of features) {
    if (!f.geometry) continue
    const height = f.properties?.height_m || 0
    if (height <= 0) continue
    const polys =
      f.geometry.type === 'Polygon'
        ? [f.geometry.coordinates]
        : f.geometry.type === 'MultiPolygon'
          ? f.geometry.coordinates
          : []
    for (const coords of polys) {
      const ring = coords[0]
      if (!ring || ring.length < 3) continue
      // local equirectangular metre frame around the footprint centroid
      const clat = ring.reduce((s, c) => s + c[1], 0) / ring.length
      const clon = ring.reduce((s, c) => s + c[0], 0) / ring.length
      const metresX = (lon) => (lon - clon) * M_PER_DEG * Math.cos(clat * rad)
      const metresY = (lat) => (lat - clat) * M_PER_DEG
      const degX = (x) => clon + x / (M_PER_DEG * Math.cos(clat * rad))
      const degY = (y) => clat + y / M_PER_DEG
      const L = height * SHADOW_LENGTH_FACTOR
      const offX = dirX * L
      const offY = dirY * L
      const pts = []
      for (const [lo, la] of ring) {
        const x = metresX(lo)
        const y = metresY(la)
        pts.push([x, y], [x + offX, y + offY])
      }
      const hull = convexHull(pts)
      if (hull.length < 3) continue
      out.push({
        type: 'Feature',
        properties: { height_m: height },
        geometry: { type: 'Polygon', coordinates: [hull.map(([x, y]) => [degX(x), degY(y)])] },
      })
    }
  }
  return out
}
