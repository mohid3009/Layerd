import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Building2, ChevronRight, Box } from 'lucide-react'
import Breadcrumb from '../components/ui/Breadcrumb.jsx'
import TicketCard from '../components/ui/TicketCard.jsx'
import DetailGrid from '../components/ui/DetailGrid.jsx'
import QRBlock from '../components/ui/QRBlock.jsx'
import MapInset from '../components/ui/MapInset.jsx'
import { getUnit } from '../mockData.js'

const ordinal = (n) => {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`
}

export default function PropertyPassport() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [showFull, setShowFull] = useState(false)
  const unit = getUnit(id)

  if (!unit) {
    return (
      <div className="max-w-[640px]">
        <Breadcrumb current="Property Passport" />
        <div className="bg-surface border border-line rounded-[14px] p-6 text-sm text-ink-mid">
          Unit not found.{' '}
          <Link to="/portal/records" className="text-accent font-semibold">Back to records</Link>
        </div>
      </div>
    )
  }

  const b = unit.building
  return (
    <div className="max-w-[640px]">
      <Breadcrumb current="Property Passport" />
      <TicketCard
        illustration={
          <div className="w-10 h-10 rounded-[10px] bg-bluebg text-blue grid place-items-center shrink-0">
            <Building2 size={18} />
          </div>
        }
        badgeVariant={unit.status}
        badgeLabel={unit.status}
        buildingName={b.name}
        unitLabel={`${unit.unitLabel}, ${ordinal(unit.floor)} floor`}
        metaText={`Updated · ${new Date(unit.lastUpdated).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`}
        accentColor={unit.status === 'verified' ? '#3A9B6A' : '#E8A93A'}
      >
        <div className="bg-surface border border-line rounded-[12px] p-4 mt-4">
          <DetailGrid
            fields={[
              { label: 'Owner', value: unit.owner },
              { label: 'Area', value: `${unit.area} m²` },
              {
                label: 'Property ID',
                value: (
                  <span className="font-id text-[12.5px]">
                    {showFull ? unit.ulpin : `${unit.ulpin.slice(0, 17)}…`}
                  </span>
                ),
              },
              { label: 'Rights Type', value: unit.rightsType },
            ]}
          />
          <button
            onClick={() => setShowFull((v) => !v)}
            className="mt-3 text-xs font-semibold text-accent hover:underline"
          >
            {showFull ? 'Hide full property ID' : 'Show full property ID'}
          </button>
        </div>

        <div className="bg-surface border border-line rounded-[12px] p-4 mt-3">
          <QRBlock reference={unit.ulpin} />
        </div>

        <div className="mt-3">
          <MapInset highlightUnit ulpin={b.baseUlpin} />
        </div>

        <div className="flex gap-2 mt-3">
          <button
            onClick={() => navigate(`/portal/report/${unit.id}`)}
            className="flex-1 bg-accent text-white text-sm font-semibold rounded-[10px] px-4 py-2.5 hover:brightness-95"
          >
            Report a Problem
          </button>
          <button
            onClick={() => navigate(`/portal/building/${b.id}/3d`)}
            className="flex-1 bg-surface border border-line text-ink text-sm font-semibold rounded-[10px] px-4 py-2.5 hover:bg-neutralbg inline-flex items-center justify-center gap-2"
          >
            <Box size={15} /> View in 3D
          </button>
        </div>

        <Link
          to={`/portal/upc/${b.id}`}
          className="mt-3 flex items-center justify-between bg-neutralbg border border-line rounded-[12px] px-4 py-3"
        >
          <span className="text-xs text-ink-mid">
            Part of the parcel record · <span className="font-semibold text-ink">{b.name}</span>
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-accent">
            Unified Property Card <ChevronRight size={13} />
          </span>
        </Link>
      </TicketCard>
    </div>
  )
}