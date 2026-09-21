import React, { useCallback, useRef, useState } from 'react'
import { getSavedBuildings } from '../api.js'

// ── constants ─────────────────────────────────────────────────────────────────
const DIRECTIONS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']

// ── helpers ───────────────────────────────────────────────────────────────────
function downloadText(content, filename, type = 'text/plain') {
  const a   = document.createElement('a')
  a.href    = URL.createObjectURL(new Blob([content], { type }))
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}

// ── GCP table ─────────────────────────────────────────────────────────────────
function GcpPanel({ gcps, onAdd, onRemove, onExport }) {
  const [draft, setDraft] = useState({ label:'', easting:'', northing:'', elevation:'' })
  const set = (k, v) => setDraft((d) => ({ ...d, [k]: v }))

  const handleAdd = () => {
    if (!draft.easting || !draft.northing) return
    onAdd({ ...draft, id: Date.now() })
    setDraft({ label:'', easting:'', northing:'', elevation:'' })
  }

  return (
    <div className="panel-section acc-clay">
      <h3>ground control points</h3>

      {gcps.length > 0 && (
        <table className="kv" style={{ marginBottom: 10 }}>
          <thead>
            <tr>
              <th style={{ textAlign:'left', fontWeight:600, fontSize:10 }}>label</th>
              <th style={{ textAlign:'left', fontWeight:600, fontSize:10 }}>E</th>
              <th style={{ textAlign:'left', fontWeight:600, fontSize:10 }}>N</th>
              <th style={{ textAlign:'left', fontWeight:600, fontSize:10 }}>Z</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {gcps.map((g) => (
              <tr key={g.id}>
                <td className="mono tiny">{g.label || '—'}</td>
                <td className="mono tiny">{g.easting}</td>
                <td className="mono tiny">{g.northing}</td>
                <td className="mono tiny">{g.elevation || '—'}</td>
                <td>
                  <button className="btn danger tiny" onClick={() => onRemove(g.id)}>✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="edit-form" style={{ gap: 6 }}>
        <label>
          <span>label</span>
          <input type="text" placeholder="GCP-01" value={draft.label} onChange={(e) => set('label', e.target.value)} />
        </label>
        <label>
          <span>easting (m)</span>
          <input type="number" step="0.001" value={draft.easting} onChange={(e) => set('easting', e.target.value)} />
        </label>
        <label>
          <span>northing (m)</span>
          <input type="number" step="0.001" value={draft.northing} onChange={(e) => set('northing', e.target.value)} />
        </label>
        <label>
          <span>elevation (m)</span>
          <input type="number" step="0.001" value={draft.elevation} onChange={(e) => set('elevation', e.target.value)} />
        </label>
        <div className="btn-row">
          <button className="btn primary" onClick={handleAdd} disabled={!draft.easting || !draft.northing}>add GCP</button>
        </div>
      </div>

      {gcps.length > 0 && (
        <div className="btn-row" style={{ marginTop: 10 }}>
          <button className="btn" onClick={onExport}>export GCPs as CSV</button>
        </div>
      )}
    </div>
  )
}

// ── image card ────────────────────────────────────────────────────────────────
function ImageCard({ img, buildings, onUpdate, onRemove }) {
  return (
    <div style={{
      border: '1px solid var(--border)', borderRadius: 8,
      overflow: 'hidden', background: 'var(--panel2)', display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ position:'relative', paddingBottom:'60%', background:'#111' }}>
        <img
          src={img.url} alt={img.filename}
          style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }}
        />
      </div>
      <div style={{ padding: '8px 10px', display:'flex', flexDirection:'column', gap:6, flex:1 }}>
        <span className="mono tiny" style={{ wordBreak:'break-all', opacity:.7 }}>{img.filename}</span>

        <div style={{ display:'flex', gap:4 }}>
          <select
            value={img.direction}
            onChange={(e) => onUpdate(img.id, 'direction', e.target.value)}
            style={{ flex:1, background:'var(--panel2)', border:'1px solid var(--border)', color:'var(--text)', padding:'3px 4px', borderRadius:4, fontSize:11 }}
            title="Cardinal direction of the camera"
          >
            {DIRECTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <input
            type="number" min="0" max="90" step="1"
            value={img.elevation_angle}
            onChange={(e) => onUpdate(img.id, 'elevation_angle', e.target.value)}
            title="Elevation angle (degrees)"
            style={{ width:52, background:'var(--panel2)', border:'1px solid var(--border)', color:'var(--text)', padding:'3px 4px', borderRadius:4, fontSize:11 }}
          />
          <span className="muted tiny" style={{ alignSelf:'center', whiteSpace:'nowrap' }}>deg</span>
        </div>

        <select
          value={img.building_id || ''}
          onChange={(e) => onUpdate(img.id, 'building_id', e.target.value)}
          style={{ background:'var(--panel2)', border:'1px solid var(--border)', color:'var(--text)', padding:'3px 4px', borderRadius:4, fontSize:11 }}
          title="Associate with a building"
        >
          <option value="">— no building —</option>
          {buildings.map((b) => (
            <option key={b.id} value={b.id}>{b.label}</option>
          ))}
        </select>

        <button className="btn danger tiny" onClick={() => onRemove(img.id)} style={{ alignSelf:'flex-end' }}>remove</button>
      </div>
    </div>
  )
}

// ── main ───────────────────────────────────────────────────────────────────────
export default function ObliqueImagery() {
  const [images, setImages]     = useState([])
  const [gcps, setGcps]         = useState([])
  const [buildings, setBuildings] = useState([])
  const inputRef = useRef()

  // Load building list for association dropdown
  React.useEffect(() => {
    getSavedBuildings()
      .then((fc) => {
        const list = (fc.features || []).map((f) => ({
          id:    f.properties.building_id,
          label: f.properties.name || f.properties.building_id,
        }))
        setBuildings(list)
      })
      .catch(() => {})
  }, [])

  // File upload handler
  const handleFiles = useCallback((files) => {
    const valid = Array.from(files).filter((f) => f.type.startsWith('image/'))
    if (!valid.length) return
    const newImgs = valid.map((f) => ({
      id:             Date.now() + Math.random(),
      filename:       f.name,
      url:            URL.createObjectURL(f),
      direction:      'N',
      elevation_angle: 45,
      building_id:    '',
      captured_at:    new Date().toISOString(),
    }))
    setImages((prev) => [...prev, ...newImgs])
  }, [])

  const onDrop = useCallback((e) => {
    e.preventDefault()
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  const updateImage = (id, key, val) => setImages((prev) => prev.map((img) => img.id === id ? { ...img, [key]: val } : img))
  const removeImage = (id) => setImages((prev) => {
    const img = prev.find((i) => i.id === id)
    if (img) URL.revokeObjectURL(img.url)
    return prev.filter((i) => i.id !== id)
  })

  // GCP actions
  const addGcp    = (gcp) => setGcps((prev) => [...prev, gcp])
  const removeGcp = (id)  => setGcps((prev) => prev.filter((g) => g.id !== id))
  const exportGcpsCsv = () => {
    const header = 'label,easting,northing,elevation'
    const rows   = gcps.map((g) => `${g.label},${g.easting},${g.northing},${g.elevation}`)
    downloadText([header, ...rows].join('\n'), 'gcps.csv', 'text/csv')
  }

  // Manifest export
  const exportManifest = () => {
    const manifest = images.map(({ id, url, ...rest }) => rest) // drop internal fields
    downloadText(JSON.stringify(manifest, null, 2), 'oblique_manifest.json', 'application/json')
  }

  return (
    <main className="workspace" style={{ display:'flex', flex: 1, minHeight: 0, overflow:'hidden' }}>
      {/* ── sidebar ── */}
      <aside className="sidebar" style={{ overflowY:'auto', flexShrink:0 }}>
        <div className="panel-section acc-blue">
          <h3>oblique imagery</h3>
          <p className="muted tiny" style={{ marginBottom:10, lineHeight:1.5 }}>
            Upload oblique camera images. Tag each with a direction, elevation angle, and the building it covers.
          </p>

          {/* drop zone */}
          <div
            onDrop={onDrop} onDragOver={(e) => e.preventDefault()}
            onClick={() => inputRef.current?.click()}
            style={{ border:'2px dashed var(--border)', borderRadius:8, padding:'20px 12px', textAlign:'center', cursor:'pointer', marginBottom:10 }}
          >
            <input
              ref={inputRef} type="file" multiple accept="image/*"
              style={{ display:'none' }} onChange={(e) => handleFiles(e.target.files)}
            />
            <span className="muted tiny">drop images here or click to browse</span>
          </div>

          <div className="btn-row" style={{ flexWrap:'wrap' }}>
            {images.length > 0 && (
              <button className="btn" onClick={exportManifest}>export manifest JSON</button>
            )}
          </div>
        </div>

        {images.length > 0 && (
          <div className="panel-section" style={{ marginTop: 0 }}>
            <table className="kv">
              <tbody>
                <tr><td>uploaded</td><td>{images.length} image{images.length > 1 ? 's' : ''}</td></tr>
                <tr><td>tagged</td><td>{images.filter((i) => i.building_id).length}</td></tr>
                <tr><td>GCPs</td><td>{gcps.length}</td></tr>
              </tbody>
            </table>
          </div>
        )}

        <GcpPanel gcps={gcps} onAdd={addGcp} onRemove={removeGcp} onExport={exportGcpsCsv} />
      </aside>

      {/* ── image gallery ── */}
      <section style={{ flex:1, overflowY:'auto', padding:16, background:'var(--bg)' }}>
        {images.length === 0 ? (
          <div
            onDrop={onDrop} onDragOver={(e) => e.preventDefault()}
            className="muted"
            style={{ height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12, minHeight:320 }}
          >
            <span style={{ fontSize:48, opacity:0.2 }}>&#128247;</span>
            <p style={{ margin:0, fontSize:14 }}>no images yet</p>
            <p className="tiny" style={{ margin:0 }}>drop oblique imagery here or use the sidebar</p>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:12 }}>
            {images.map((img) => (
              <ImageCard
                key={img.id}
                img={img}
                buildings={buildings}
                onUpdate={updateImage}
                onRemove={removeImage}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
