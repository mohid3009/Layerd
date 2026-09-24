import json

with open('3d_map/frontend/src/api.js', 'r', encoding='utf-8') as f:
    content = f.read()

API_BASE = 'http://localhost:8000' # but since it's proxy or relative, I will just use relative paths '/lidar/...' and Vite proxy or production same-origin. Wait, Render backend will run on port 10000, and frontend will be served from somewhere else. For the demo, let's just assume we hit relative paths, except for the fact that the frontend is React. If we use relative paths, they work in production if the frontend is served by the backend (like main.py serving the SPA). 
# I saw main.py has a spa_fallback route! It serves the React frontend!
# So relative paths are PERFECT.

content = content.replace(
    'export const generateUnits = async (buildingId, { floors, basements }) => {',
    '''export const generateUnits = async (buildingId, { floors, basements, planFile }) => {
  const fd = new FormData()
  fd.append('building_id', buildingId)
  fd.append('floors', floors)
  fd.append('basements', basements || 0)
  if (planFile) fd.append('plan', planFile)

  const res = await fetch('/lidar/units/generate', { method: 'POST', body: fd })
  if (!res.ok) throw new Error(await res.text())
  const data = await res.json()
  window.dispatchEvent(new Event('demo-units-changed'))
  return data
}
//'''
)

content = content.replace(
    '''export const fetchUnits = async (buildingId) => {
  let db = unitsDb()
  if (!db[buildingId]) {
    try {
      const fc = await applyMuts()
      const b = fc?.features?.find((f) => f.properties.building_id === buildingId)
      if (b) {
        const stories = parseInt(b.properties.stories || 1, 10)
        await generateUnits(buildingId, { floors: stories, basements: 0 })
        db = unitsDb()
      }
    } catch (e) {
      console.warn('lazy-gen failed', e)
    }
  }
  return db[buildingId] || []
}''',
    '''export const fetchUnits = async (buildingId) => {
  const res = await fetch(/lidar/units?building_id=)
  if (!res.ok) throw new Error(await res.text())
  const data = await res.json()
  return data.units || []
}'''
)

content = content.replace(
    '''export const getPendingUnitEdits = () => pendingUnitEditsDb().filter((e) => e.status === 'pending')''',
    '''export const getPendingUnitEdits = async () => {
  try {
    const res = await fetch('/lidar/units/pending')
    if (res.ok) return await res.json()
  } catch (e) {
    console.error(e)
  }
  return []
}'''
)

content = content.replace(
    '''export const proposeUnitCorrection = async (buildingId, unitUlpin, patch, session) => {
  const db = unitsDb()
  const units = db[buildingId] || []
  const idx = units.findIndex((u) => u.unit_ulpin === unitUlpin)
  if (idx === -1) throw new Error('unit not found')

  const before = { ...units[idx] }
  // compute what the after would look like
  const after = { ...before }
  if (patch.owner_name != null && String(patch.owner_name).trim()) after.owner_name = String(patch.owner_name).trim()
  if (patch.rights_type) after.rights_type = patch.rights_type

  const pending = pendingUnitEditsDb()
  const editId = edit--
  pending.push({
    id: editId,
    building_id: buildingId,
    unit_ulpin: unitUlpin,
    proposed_by: session?.name || 'Surveyor',
    role: session?.role || 'surveyor',
    patch,
    before,
    after,
    status: 'pending',
    created_at: new Date().toISOString(),
  })
  savePendingUnitEdits(pending)
  return { ok: true, editId }
}''',
    '''export const proposeUnitCorrection = async (buildingId, unitUlpin, patch, session) => {
  const res = await fetch('/lidar/units/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      building_id: buildingId,
      unit_ulpin: unitUlpin,
      proposed_by: session?.name || 'Surveyor',
      patch
    })
  })
  if (!res.ok) throw new Error(await res.text())
  const data = await res.json()
  window.dispatchEvent(new Event('demo-pending-unit-edits-changed'))
  return { ok: true, editId: data.id }
}'''
)

content = content.replace(
    '''export const confirmUnitCorrection = async (editId, registrarSession) => {
  const pending = pendingUnitEditsDb()
  const eIdx = pending.findIndex((e) => e.id === editId)
  if (eIdx === -1) throw new Error('pending edit not found')
  const entry = pending[eIdx]

  const db = unitsDb()
  const units = db[entry.building_id] || []
  const uIdx = units.findIndex((u) => u.unit_ulpin === entry.unit_ulpin)
  if (uIdx === -1) throw new Error('unit not found')

  if (entry.patch.owner_name != null) units[uIdx].owner_name = entry.patch.owner_name
  if (entry.patch.rights_type) units[uIdx].rights_type = entry.patch.rights_type

  entry.status = 'approved'
  entry.resolved_by = registrarSession?.name
  entry.resolved_at = new Date().toISOString()

  saveUnits(db)
  savePendingUnitEdits(pending)
  window.dispatchEvent(new Event('demo-units-changed'))
  return { ok: true }
}''',
    '''export const confirmUnitCorrection = async (editId, registrarSession) => {
  const res = await fetch('/lidar/units/confirm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: editId, status: 'confirmed' })
  })
  if (!res.ok) throw new Error(await res.text())
  window.dispatchEvent(new Event('demo-units-changed'))
  window.dispatchEvent(new Event('demo-pending-unit-edits-changed'))
  return { ok: true }
}'''
)

content = content.replace(
    '''export const rejectUnitCorrection = async (editId, registrarSession, reason = '') => {
  const pending = pendingUnitEditsDb()
  const eIdx = pending.findIndex((e) => e.id === editId)
  if (eIdx === -1) throw new Error('pending edit not found')

  pending[eIdx].status = 'rejected'
  pending[eIdx].resolved_by = registrarSession?.name
  pending[eIdx].resolved_at = new Date().toISOString()
  pending[eIdx].reject_reason = reason

  savePendingUnitEdits(pending)
  return { ok: true }
}''',
    '''export const rejectUnitCorrection = async (editId, registrarSession, reason = '') => {
  const res = await fetch('/lidar/units/confirm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: editId, status: 'rejected' })
  })
  if (!res.ok) throw new Error(await res.text())
  window.dispatchEvent(new Event('demo-pending-unit-edits-changed'))
  return { ok: true }
}'''
)


with open('3d_map/frontend/src/api.js', 'w', encoding='utf-8') as f:
    f.write(content)
