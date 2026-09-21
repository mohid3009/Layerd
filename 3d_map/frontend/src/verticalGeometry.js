// Floor 1 starts at ground level; basement -1 ends at ground level.
// Explicit surveyed/corrected bounds take precedence over inferred heights.
export function unitZRange(unit, fallbackFloorHeight = 3) {
  const hasMin = unit.z_min != null
  const hasMax = unit.z_max != null
  if (hasMin || hasMax) {
    if (!hasMin || !hasMax || !Number.isFinite(unit.z_min) ||
        !Number.isFinite(unit.z_max) || unit.z_max <= unit.z_min) {
      throw new Error('Vertical bounds must be finite numbers with z_max greater than z_min')
    }
    return { zMin: unit.z_min, zMax: unit.z_max }
  }
  const floor = unit.floor_index ?? 1
  const height = unit.floor_height_m ?? fallbackFloorHeight
  if (!Number.isInteger(floor) || floor === 0 || !Number.isFinite(height) || height <= 0) {
    throw new Error('Use floor 1 for ground level, negative basement floors, and a positive floor height')
  }
  const zMin = (floor < 0 ? floor : floor - 1) * height
  return { zMin, zMax: zMin + height }
}

// Explosion offsets are presentation-only and must never enter validation.
export function unitRenderRange(unit, floorGap = 0, fallbackFloorHeight = 3) {
  const range = unitZRange(unit, fallbackFloorHeight)
  const floor = unit.floor_index ?? 1
  const offset = (floor < 0 ? floor : floor - 1) * floorGap
  return { base: range.zMin + offset, top: range.zMax + offset }
}
