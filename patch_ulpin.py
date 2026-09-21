import json
import re

with open('3d_map/frontend/src/components/UlpinView.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "import { getSavedBuildings, fetchUnits, generateUnits, deleteUnits } from '../api.js'",
    "import { getSavedBuildings, fetchUnits, generateUnits, generateFloorUnits, deleteUnits } from '../api.js'"
)

content = content.replace(
    "const [planFile, setPlanFile]   = useState(null)",
    "const [planFile, setPlanFile]   = useState(null)\n  const [floorPlanFile, setFloorPlanFile] = useState(null)"
)

new_func = '''
  const generateFloor = () => {
    if (!selId || !selSlab) return
    setBusy(true); setErr(null); setMsg(null)
    generateFloorUnits(selId, selSlab.floor_index, floorPlanFile)
      .then((r) => {
        setUnits(r.units)
        setMsg(Floor  regenerated via  segmentation)
        setBusy(false)
        setFloorPlanFile(null)
      })
      .catch((e) => { setErr(e.message); setBusy(false) })
  }
'''

content = content.replace(
    "const clear = () => {",
    new_func + "\n  const clear = () => {"
)

selSlab_html = '''        {selSlab && (
          <div className="panel-section">
            <h3>section details</h3>
            <table className="kv">
              <tbody>
                <tr><td>section</td><td>{selSlab.floor_index < 0 ? asement  : loor }</td></tr>
                <tr><td>z-range</td><td>{selSlab.floor_index * FH} m — {(selSlab.floor_index + 1) * FH} m</td></tr>
              </tbody>
            </table>
            
            {canManage && (
              <div style={{ marginTop: 12 }}>
                <p className="muted tiny" style={{ marginBottom: 4 }}>override this floor's segmentation</p>
                <input 
                  type="file" 
                  accept="image/png, image/jpeg" 
                  onChange={(e) => setFloorPlanFile(e.target.files[0])}
                  style={{ fontSize: 11, marginBottom: 8 }}
                />
                <button className="btn primary" onClick={generateFloor} disabled={busy} style={{ width: '100%', fontSize: 12, padding: '4px 8px' }}>
                  {busy ? 'generating...' : 'generate units for this floor'}
                </button>
              </div>
            )}
          </div>
        )}'''

# regex to replace selSlab
content = re.sub(
    r'\{selSlab && \(\s*<div className="panel-section">.*?generate units to populate this section</td></tr>\s*</tbody>\s*</table>\s*</div>\s*\)\}',
    selSlab_html,
    content,
    flags=re.DOTALL
)

with open('3d_map/frontend/src/components/UlpinView.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
