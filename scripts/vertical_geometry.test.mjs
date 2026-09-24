import test from 'node:test'
import assert from 'node:assert/strict'
import { unitZRange, unitRenderRange } from '../3d_map/frontend/src/verticalGeometry.js'
import { unitSliceFeatures } from '../3d_map/frontend/src/floors.js'
import {
  detectVolumetricOverlaps, proposeUnitCorrection, confirmUnitCorrection,
  rejectUnitCorrection, updateUnit, getPendingUnitEdits,
} from '../3d_map/frontend/src/api.js'

const polygon = [[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]
const unit = (floor, extra = {}) => ({
  unit_ulpin: `test-F${floor}`, floor_index: floor, polygon, ...extra,
})
const building = {
  type: 'Feature',
  properties: { building_id: 'test-building', stories: 2, height_m: 6, basements: 1 },
  geometry: { type: 'Polygon', coordinates: [[[80, 13], [80.001, 13], [80.001, 13.001], [80, 13.001], [80, 13]]] },
}

test('floor 1 starts at ground; floor 2 stacks above it; basements stay below ground', () => {
  assert.deepEqual(unitZRange(unit(1)), { zMin: 0, zMax: 3 })
  assert.deepEqual(unitZRange(unit(2)), { zMin: 3, zMax: 6 })
  assert.deepEqual(unitZRange(unit(-1)), { zMin: -3, zMax: 0 })
  assert.deepEqual(unitZRange(unit(-2)), { zMin: -6, zMax: -3 })
})

test('explicit corrections determine base, top and mesh depth', () => {
  const corrected = unit(2, { z_min: 5, z_max: 9 })
  assert.deepEqual(unitZRange(corrected), { zMin: 5, zMax: 9 })
  const range = unitRenderRange(corrected, 0.7)
  assert.deepEqual(range, { base: 5.7, top: 9.7 })
  assert.ok(Math.abs((range.top - range.base) - 4) < 1e-10)
  assert.deepEqual(unitRenderRange(unit(-1), 0.7), { base: -3.7, top: -0.7 })
  assert.deepEqual(unitZRange(unit(2, { floor_height_m: 4 })), { zMin: 4, zMax: 8 })
})

test('invalid or incomplete vertical ranges are rejected', () => {
  for (const extra of [
    { z_min: 4, z_max: 2 }, { z_min: 2, z_max: 2 },
    { z_min: 2 }, { z_max: 4 }, { z_min: NaN, z_max: 4 },
    { z_min: 2, z_max: Infinity }, { z_min: '2', z_max: 4 },
  ]) assert.throws(() => unitZRange(unit(1, extra)), /Vertical bounds/)
  assert.throws(() => unitZRange(unit(0)), /floor 1/)
  assert.throws(() => unitZRange(unit(1.5)), /floor 1/)
})

test('touching floor boundaries do not overlap; corrections change overlap volume', () => {
  const a = unit(1)
  const b = unit(2)
  assert.equal(detectVolumetricOverlaps([a, b], 100).length, 0)
  assert.equal(detectVolumetricOverlaps([unit(-1), a], 100).length, 0)
  const overlaps = detectVolumetricOverlaps([a, { ...b, z_min: 2, z_max: 6 }], 100)
  assert.equal(overlaps.length, 1)
  assert.equal(overlaps[0].volumeM3, 100) // 100 m² shared XY area × 1 m shared height
  assert.equal(detectVolumetricOverlaps([a, { ...b, z_min: 3, z_max: 6 }], 100).length, 0)
})

test('MapLibre slices use corrected elevations and negative basement bases', () => {
  const slices = unitSliceFeatures(building, [
    unit(-1), unit(1), unit(2, { z_min: 5, z_max: 9 }),
  ], 0.7)
  assert.deepEqual(slices.map(({ properties: p }) => [p.base_m, p.height_m]), [
    [-3.7, -0.7], [0, 3], [5.7, 9.7],
  ])
  for (const slice of slices) {
    const ring = slice.geometry.coordinates[0]
    assert.deepEqual(ring[0], ring.at(-1))
  }
})


test('correction decisions validate overlaps, preserve heights and reject stale or repeated decisions', async () => {
  const storage = new Map()
  const previousStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window')
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
  } })
  Object.defineProperty(globalThis, 'window', { configurable: true, value: new EventTarget() })
  const surveyor = { name: 'Surveyor 1', role: 'surveyor' }
  const registrar = { name: 'Registrar 1', role: 'registrar' }
  const key = 'avani-demo-units'
  storage.set(key, JSON.stringify({ test: [
    unit(1, { owner_name: 'A', area_sqm: 100, validation_status: 'confirmed' }),
    unit(2, { owner_name: 'B', area_sqm: 100, validation_status: 'confirmed' }),
  ] }))
  try {
    await assert.rejects(proposeUnitCorrection('test', 'test-F2', { z_min: '', z_max: 6 }, surveyor), /required/)
    assert.equal(getPendingUnitEdits().length, 0)
    const bad = await proposeUnitCorrection('test', 'test-F2', { z_min: 2, z_max: 6 }, surveyor)
    assert.ok(bad.overlapAfter > 0)
    await assert.rejects(confirmUnitCorrection(bad.editId, registrar), /overlaps/)
    await assert.rejects(proposeUnitCorrection('test', 'test-F2', {}, surveyor), /already has/)
    await assert.rejects(updateUnit('test', 'test-F2', { owner_name: 'Other' }), /pending correction/)
    await rejectUnitCorrection(bad.editId, registrar, 'Overlap remains')
    await assert.rejects(confirmUnitCorrection(bad.editId, registrar), /no longer pending/)
    await assert.rejects(rejectUnitCorrection(bad.editId, registrar), /no longer pending/)
    assert.equal(JSON.parse(storage.get(key)).test[1].validation_status, 'confirmed')

    const good = await proposeUnitCorrection('test', 'test-F2', { z_min: 3, z_max: 7 }, surveyor)
    const result = await confirmUnitCorrection(good.editId, registrar)
    assert.deepEqual(unitZRange(result.unit), { zMin: 3, zMax: 7 })
    assert.equal(result.unit.pending_edit_id, null)
    assert.equal(result.unit.revision, 1)
    assert.equal(result.unit.edit_history.length, 2)
    assert.equal(getPendingUnitEdits().length, 0)
    await assert.rejects(confirmUnitCorrection(good.editId, registrar), /no longer pending/)
    const updated = await updateUnit('test', 'test-F2', { owner_name: 'Updated' })
    const current = updated.units[1]
    assert.equal(current.revision, 2)
    assert.deepEqual(unitRenderRange(current, 0.7), { base: 3.7, top: 7.7 })
    assert.equal(unitSliceFeatures(building, [current], 0.7)[0].properties.height_m, 7.7)

    const stale = await proposeUnitCorrection('test', 'test-F2', { z_min: 3, z_max: 8 }, surveyor)
    const db = JSON.parse(storage.get(key))
    db.test[1].revision++
    storage.set(key, JSON.stringify(db))
    await assert.rejects(confirmUnitCorrection(stale.editId, registrar), /changed after/)
  } finally {
    if (previousStorage) Object.defineProperty(globalThis, 'localStorage', previousStorage)
    else delete globalThis.localStorage
    if (previousWindow) Object.defineProperty(globalThis, 'window', previousWindow)
    else delete globalThis.window
  }
})
