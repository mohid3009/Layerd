import json

with open('3d_map/frontend/src/api.js', 'r', encoding='utf-8') as f:
    content = f.read()

new_api = '''
export const generateFloorUnits = async (buildingId, floorIndex, planFile) => {
  const fd = new FormData()
  fd.append('building_id', buildingId)
  fd.append('floor_index', floorIndex)
  if (planFile) fd.append('plan', planFile)

  const res = await fetch('/lidar/units/generate_floor', { method: 'POST', body: fd })
  if (!res.ok) throw new Error(await res.text())
  const data = await res.json()
  window.dispatchEvent(new Event('demo-units-changed'))
  return data
}
'''

if 'export const generateFloorUnits' not in content:
    content = content.replace('export const deleteUnits = async', new_api + '\nexport const deleteUnits = async')

with open('3d_map/frontend/src/api.js', 'w', encoding='utf-8') as f:
    f.write(content)
