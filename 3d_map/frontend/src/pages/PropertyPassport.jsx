import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Building2, ChevronRight, Box, ShieldCheck, Printer, AlertTriangle,
  Copy, Check, FileCheck, Layers, Hash, ArrowLeft
} from 'lucide-react'
import Breadcrumb from '../components/ui/Breadcrumb.jsx'
import DetailGrid from '../components/ui/DetailGrid.jsx'
import QRBlock from '../components/ui/QRBlock.jsx'
import MapInset from '../components/ui/MapInset.jsx'
import CubeMark from '../components/CubeMark.jsx'
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
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState('specs') // 'specs' | 'encumbrance' | 'ledger'

  const unit = getUnit(id)

  const copyUlpin = () => {
    if (!unit) return
    navigator.clipboard?.writeText(unit.ulpin)
    setCopied(true)
    setTimeout(() => setCopied(false), 2200)
  }

  if (!unit) {
    return (
      <div className="max-w-[720px] mx-auto p-6">
        <Breadcrumb current="Property Passport" />
        <div className="bg-white border border-[#E4E7EC] rounded-[14px] p-8 text-center text-sm text-[#5C6675] mt-4 shadow-sm">
          <p className="text-base font-bold text-[#1C2530] mb-2">Property Record Not Found</p>
          <p className="mb-4">No 3D unit record exists with identifier &ldquo;{id}&rdquo;.</p>
          <Link
            to="/dashboard"
            className="btn primary inline-flex items-center gap-2"
          >
            <ArrowLeft size={14} /> Back to My Properties
          </Link>
        </div>
      </div>
    )
  }

  const b = unit.building

  return (
    <div className="max-w-[840px] mx-auto pb-12 text-[#1C2530]">
      {/* Top action bar */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="btn tiny inline-flex items-center gap-1.5"
            title="Return to your dashboard"
          >
            <ArrowLeft size={13} /> Dashboard
          </button>
          <Breadcrumb current="Property Passport" />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="btn tiny inline-flex items-center gap-1.5"
            title="Print or save as official PDF"
          >
            <Printer size={13} /> Print Certificate
          </button>
          <button
            onClick={() => navigate(`/portal/report/${unit.id}`)}
            className="btn tiny inline-flex items-center gap-1.5 text-[#8A6410] border-[#E4E7EC] hover:bg-amber-50"
            title="File dispute if details do not match"
          >
            <AlertTriangle size={13} /> Report Problem
          </button>
        </div>
      </div>

      {/* Official Government Digital Passport Card */}
      <div className="bg-white border border-[#E4E7EC] rounded-[16px] overflow-hidden shadow-md">
        {/* Official Header Strip */}
        <div className="bg-gradient-to-r from-[#0D1126] via-[#141A38] to-[#0D1126] border-b border-[#1E2548] p-5 text-white flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-[10px] bg-white/10 backdrop-blur border border-white/15 grid place-items-center shrink-0">
              <CubeMark size={24} tint="#8B93E8" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#A5B4FC]">
                Government of India · National Urban 3D Cadastre
              </div>
              <h1 className="text-lg font-extrabold text-white tracking-tight flex items-center gap-2 mt-0.5">
                Digital Property Passport
                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-[#34D399]/20 text-[#34D399] border border-[#34D399]/40 px-2.5 py-0.5 rounded-full">
                  <ShieldCheck size={12} /> VERIFIED TITLE
                </span>
              </h1>
            </div>
          </div>

          <div className="text-right text-xs text-white/70">
            <span className="text-[10px] uppercase tracking-wider block text-white/50">Jurisdiction</span>
            <span className="font-semibold text-white">Greater Chennai · Ward 114</span>
          </div>
        </div>

        {/* Identity & ULPIN Hero */}
        <div className="p-6 bg-white border-b border-[#E4E7EC]">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <div className="text-xs uppercase font-semibold tracking-wider text-[#5C6675] mb-1">
                {b.name}
              </div>
              <div className="text-2xl font-black text-[#1C2530] tracking-tight flex items-center gap-2">
                {unit.unitLabel}
                <span className="text-sm font-medium text-[#5C6675]">
                  ({ordinal(unit.floor)} Floor)
                </span>
              </div>
              <div className="text-xs text-[#5C6675] mt-1 flex items-center gap-2">
                <span>{b.address}</span>
              </div>
            </div>

            {/* ULPIN Copy Badge */}
            <div className="bg-[#F8F9FA] border border-[#E4E7EC] rounded-[12px] p-3 shrink-0 flex flex-col items-end">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#5C6675] block mb-1">
                3D ULPIN (National Spatial ID)
              </span>
              <div className="flex items-center gap-2">
                <span className="font-id text-[13px] font-semibold text-[#4C5BD4]">
                  {showFull ? unit.ulpin : `${unit.ulpin.slice(0, 22)}…`}
                </span>
                <button
                  onClick={copyUlpin}
                  className="p-1.5 rounded-md hover:bg-black/5 text-[#5C6675] hover:text-[#1C2530] transition-colors"
                  title="Copy full ULPIN"
                >
                  {copied ? <Check size={14} className="text-green" /> : <Copy size={14} />}
                </button>
              </div>
              <button
                onClick={() => setShowFull(!showFull)}
                className="text-[11px] text-[#4C5BD4] hover:underline mt-1 font-medium"
              >
                {showFull ? 'Show condensed' : 'Show full national key'}
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            <div className="bg-[#FFFFFF] border border-[#E4E7EC] rounded-[10px] p-3 shadow-xs">
              <span className="text-[10.5px] uppercase font-semibold text-[#5C6675] block">Carpet Area</span>
              <span className="text-base font-bold text-[#1C2530]">{unit.area} m²</span>
              <span className="text-[10px] text-[#5C6675] block">~{Math.round(unit.area * 10.764)} sq.ft</span>
            </div>
            <div className="bg-[#FFFFFF] border border-[#E4E7EC] rounded-[10px] p-3 shadow-xs">
              <span className="text-[10.5px] uppercase font-semibold text-[#5C6675] block">Registered Owner</span>
              <span className="text-base font-bold text-[#1C2530] truncate block">{unit.owner}</span>
              <span className="text-[10px] text-[#1B7A4A] font-medium block">✓ Sole Freehold Title</span>
            </div>
            <div className="bg-[#FFFFFF] border border-[#E4E7EC] rounded-[10px] p-3 shadow-xs">
              <span className="text-[10.5px] uppercase font-semibold text-[#5C6675] block">Encumbrance (NOC)</span>
              <span className="text-base font-bold text-[#1B7A4A]">Clear</span>
              <span className="text-[10px] text-[#5C6675] block">No Bank Lien / Claims</span>
            </div>
            <div className="bg-[#FFFFFF] border border-[#E4E7EC] rounded-[10px] p-3 shadow-xs">
              <span className="text-[10.5px] uppercase font-semibold text-[#5C6675] block">Property Tax</span>
              <span className="text-base font-bold text-[#1B7A4A]">Paid</span>
              <span className="text-[10px] text-[#5C6675] block">FY 2026-27 Cleared</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs inside Passport */}
        <div className="flex border-b border-[#E4E7EC] px-6 pt-2 bg-[#F9FAFB] gap-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('specs')}
            className={`pb-3 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'specs'
                ? 'border-[#4C5BD4] text-[#4C5BD4]'
                : 'border-transparent text-[#5C6675] hover:text-[#1C2530]'
            }`}
          >
            <Layers size={14} /> 3D Spatial Specs &amp; Map
          </button>
          <button
            onClick={() => setActiveTab('encumbrance')}
            className={`pb-3 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'encumbrance'
                ? 'border-[#4C5BD4] text-[#4C5BD4]'
                : 'border-transparent text-[#5C6675] hover:text-[#1C2530]'
            }`}
          >
            <FileCheck size={14} /> Record of Rights &amp; Encumbrance
          </button>
          <button
            onClick={() => setActiveTab('ledger')}
            className={`pb-3 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'ledger'
                ? 'border-[#4C5BD4] text-[#4C5BD4]'
                : 'border-transparent text-[#5C6675] hover:text-[#1C2530]'
            }`}
          >
            <Hash size={14} /> Blockchain Audit Trail
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 bg-white">
          {activeTab === 'specs' && (
            <div className="space-y-5">
              <div className="bg-[#F9FAFB] border border-[#E4E7EC] rounded-[12px] p-4">
                <h3 className="text-xs uppercase tracking-wider font-bold text-[#5C6675] mb-3">
                  Volumetric &amp; Cadastral Dimensions
                </h3>
                <DetailGrid
                  fields={[
                    { label: 'Vertical Level', value: `Floor ${unit.floor} of ${b.floors}` },
                    { label: 'Ceiling Height', value: '3.05 metres' },
                    { label: 'Volumetric Envelope', value: `${(unit.area * 3.05).toFixed(1)} m³` },
                    { label: 'Base Parcel ULPIN', value: <span className="font-id">{b.baseUlpin}</span> },
                    { label: 'Rights Category', value: unit.rightsType || 'Freehold Title' },
                    { label: 'Survey Source', value: b.extraction || 'LiDAR & Cadastre Mesh' },
                  ]}
                  columns={3}
                />
              </div>

              {/* QR Verification Block */}
              <div className="bg-[#F9FAFB] border border-[#E4E7EC] rounded-[12px] p-4">
                <QRBlock reference={unit.ulpin} />
              </div>

              {/* Map Inset */}
              <div>
                <MapInset highlightUnit ulpin={b.baseUlpin} />
              </div>
            </div>
          )}

          {activeTab === 'encumbrance' && (
            <div className="space-y-4">
              <div className="bg-[#F9FAFB] border border-[#E4E7EC] rounded-[12px] p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-[#1C2530]">Record of Rights (RoR) Certificate</h3>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#1B7A4A] border border-emerald-200">
                    Clear &amp; Marketable
                  </span>
                </div>
                <DetailGrid
                  fields={[
                    { label: 'Registry Document #', value: 'DOC-2024-TN07-44821' },
                    { label: 'Registration Date', value: '14 November 2024' },
                    { label: 'Sub-Registrar Office', value: 'SRO T. Nagar, Central Chennai' },
                    { label: 'Survey Ward & Block', value: 'Block 24 · Town Survey # 104/2' },
                    { label: 'Aadhaar Linkage', value: 'Verified (Masked · XXXX 4821)' },
                    { label: 'DigiLocker Doc URI', value: 'gov.in.tn.rev.ror/44821' },
                  ]}
                  columns={2}
                />
              </div>

              <div className="bg-[#F9FAFB] border border-[#E4E7EC] rounded-[12px] p-5">
                <h3 className="text-sm font-bold text-[#1C2530] mb-3">No-Encumbrance Status (NOC)</h3>
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between p-2.5 bg-white rounded-[8px] border border-[#E4E7EC]">
                    <span className="text-[#1C2530]">Mortgage / Bank Lien Search (Past 30 Years)</span>
                    <span className="text-[#1B7A4A] font-bold">NIL (No registered encumbrance)</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-white rounded-[8px] border border-[#E4E7EC]">
                    <span className="text-[#1C2530]">Civil Court Lis Pendens / Injunctions</span>
                    <span className="text-[#1B7A4A] font-bold">NONE FILED</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-white rounded-[8px] border border-[#E4E7EC]">
                    <span className="text-[#1C2530]">Municipal Property Tax Dues</span>
                    <span className="text-[#1B7A4A] font-bold">ZERO DUES (Receipt #2026-CH-991)</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-white rounded-[8px] border border-[#E4E7EC]">
                    <span className="text-[#1C2530]">Electricity &amp; Water Board Arrears</span>
                    <span className="text-[#1B7A4A] font-bold">ACTIVE &amp; PAID</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ledger' && (
            <div className="space-y-4">
              <div className="bg-[#F9FAFB] border border-[#E4E7EC] rounded-[12px] p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-[#1C2530]">Cryptographic Audit Chain</h3>
                    <p className="text-xs text-[#5C6675]">
                      Every transaction is hashed into an immutable append-only ledger
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#1B7A4A] border border-emerald-200 flex items-center gap-1">
                    <Check size={13} /> Chain Valid
                  </span>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  {/* Block 3 */}
                  <div className="p-3 bg-white rounded-[8px] border-l-4 border-[#34D399] border border-[#E4E7EC]">
                    <div className="flex items-center justify-between text-[11px] text-[#5C6675] mb-1">
                      <span className="font-bold text-[#1C2530]">BLOCK #3 · 3D ULPIN REGISTRATION</span>
                      <span>2026-09-02 14:10 UTC</span>
                    </div>
                    <div className="text-[#1C2530] font-sans text-xs mb-1">
                      Vertical volumetric boundaries minted and assigned to {unit.owner}
                    </div>
                    <div className="text-[11px] text-[#5C6675]">
                      Prev Hash: <span className="text-[#4C5BD4]">9e8a71...4401</span> · Block Hash:{' '}
                      <span className="text-[#1B7A4A]">d7204f...b891</span>
                    </div>
                  </div>

                  {/* Block 2 */}
                  <div className="p-3 bg-white rounded-[8px] border-l-4 border-[#4C5BD4] border border-[#E4E7EC]">
                    <div className="flex items-center justify-between text-[11px] text-[#5C6675] mb-1">
                      <span className="font-bold text-[#1C2530]">BLOCK #2 · SPATIAL SURVEY CERTIFICATION</span>
                      <span>2026-08-20 09:30 UTC</span>
                    </div>
                    <div className="text-[#1C2530] font-sans text-xs mb-1">
                      OpenStreetMap footprint topology validated with 0 overlap conflicts
                    </div>
                    <div className="text-[11px] text-[#5C6675]">
                      Prev Hash: <span className="text-[#4C5BD4]">1a2b3c...9981</span> · Block Hash:{' '}
                      <span className="text-[#4C5BD4]">9e8a71...4401</span>
                    </div>
                  </div>

                  {/* Block 1 */}
                  <div className="p-3 bg-white rounded-[8px] border-l-4 border-gray-400 border border-[#E4E7EC]">
                    <div className="flex items-center justify-between text-[11px] text-[#5C6675] mb-1">
                      <span className="font-bold text-[#1C2530]">BLOCK #1 · GENESIS TITLE REGISTRATION</span>
                      <span>2024-11-14 11:20 UTC</span>
                    </div>
                    <div className="text-[#1C2530] font-sans text-xs mb-1">
                      Sale Deed executed at SRO T. Nagar · Title conveyed to {unit.owner}
                    </div>
                    <div className="text-[11px] text-[#5C6675]">
                      Prev Hash: <span className="text-[#5C6675]">000000...0000</span> · Block Hash:{' '}
                      <span className="text-[#4C5BD4]">1a2b3c...9981</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-[#F9FAFB] border-t border-[#E4E7EC] p-5 flex items-center justify-between gap-3 flex-wrap">
          <Link
            to={`/portal/upc/${b.id}`}
            className="text-xs font-semibold text-[#4C5BD4] hover:underline inline-flex items-center gap-1"
          >
            Part of {b.name} parcel record <ChevronRight size={13} />
          </Link>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => navigate('/dashboard')}
              className="btn text-xs"
            >
              ← Back to My Properties
            </button>
            <button
              onClick={() => navigate(`/portal/report/${unit.id}`)}
              className="btn text-xs"
            >
              Report Discrepancy
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}