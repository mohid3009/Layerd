import { Link, useParams } from 'react-router-dom'
import { MousePointer, CircleDot, CheckCircle2, Clock } from 'lucide-react'
import Breadcrumb from '../components/ui/Breadcrumb.jsx'
import DetailGrid from '../components/ui/DetailGrid.jsx'
import Building3DScene from '../components/Building3DScene.jsx'
import { getBuilding, currentUser } from '../mockData.js'

export default function Building3DView() {
  const { id } = useParams()
  const b = getBuilding(id)

  if (!b) {
    return (
      <div className="max-w-[640px]">
        <Breadcrumb current="3D Building View" />
        <div className="bg-surface border border-line rounded-[14px] p-6 text-sm text-ink-mid">
          Building not found.{' '}
          <Link to="/portal/records" className="text-accent font-semibold">Back to records</Link>
        </div>
      </div>
    )
  }

  // highlight the viewer's own unit's floor when they own one here
  const ownedHere = b.units.find(
    (u) => currentUser.ownedUnitIds.includes(u.id),
  )
  const unitFloor = ownedHere ? ownedHere.floor : 3

  return (
    <div className="max-w-[1080px]">
      <Breadcrumb current="3D Building View" />
      <h1 className="text-xl font-extrabold text-ink">{b.name} — 3D</h1>
      <p className="text-sm text-ink-mid mt-0.5 mb-4">{b.address}</p>

      <div className="grid gap-4 min-[900px]:grid-cols-[1fr_320px]">
        <div className="relative bg-surface border border-line rounded-[14px] overflow-hidden h-[440px]">
          <Building3DScene
            floors={b.floors}
            basements={b.basements}
            unitFloor={unitFloor}
            size={2.2}
          />
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-ink/80 text-white text-[11px] px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 pointer-events-none">
            <MousePointer size={12} /> drag to rotate
          </div>
          <div className="absolute bottom-3 left-3 bg-surface/95 border border-line rounded-[10px] px-3 py-2 flex flex-col gap-1 text-[11px] text-ink">
            <span className="inline-flex items-center gap-1.5">
              <CircleDot size={11} className="text-accent" /> Selected unit
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 size={11} className="text-blue" /> Verified
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock size={11} className="text-amber" /> Under review
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-surface border border-line rounded-[14px] p-4">
            <h3 className="text-sm font-bold text-ink mb-3">Building summary</h3>
            <DetailGrid
              fields={[
                { label: 'Floors', value: b.floors },
                { label: 'Total Units', value: b.units.length },
                { label: 'Height', value: `${b.height} m` },
                { label: 'Basements', value: b.basements },
                { label: 'Extraction', value: b.extraction, },
              ]}
            />
          </div>
          <div className="bg-surface border border-line rounded-[14px] p-4">
            <h3 className="text-sm font-bold text-ink mb-1">About this model</h3>
            <p className="text-xs text-ink-mid leading-relaxed">
              This is a schematic demonstration, not a surveyed or authoritative
              volume record. Use the ULPIN view to inspect generated unit geometry.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}