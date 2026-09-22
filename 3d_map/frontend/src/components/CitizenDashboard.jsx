import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2, CheckCircle2, Clock, FileText, ArrowRight, Activity, MapPin, Search,
  ShieldCheck, Printer, AlertTriangle, Copy, Check, ExternalLink, HelpCircle,
  ChevronDown, ChevronUp, FileCheck, Layers, Hash, Sparkles, X, PlusCircle,
  Volume2, Globe2
} from 'lucide-react'
import { citizenProperties, peekUnits, demoBaseUlpin, digipin, generateUnits } from '../api.js'
import { activityLog, complaints, addComplaint, getUnit } from '../mockData.js'
import CubeMark from './CubeMark.jsx'

const M_PER_DEG = 111320

const i18n = {
  'Overview & Services': { 'हिंदी': 'अवलोकन और सेवाएं', 'தமிழ்': 'கண்ணோட்டம் மற்றும் சேவைகள்' },
  'My Properties': { 'हिंदी': 'मेरी संपत्तियां', 'தமிழ்': 'என் சொத்துக்கள்' },
  'Grievances & Disputes': { 'हिंदी': 'शिकायतें और विवाद', 'தமிழ்': 'குறைகள் மற்றும் தகராறுகள்' },
  'Digital Passport': { 'हिंदी': 'डिजिटल पासपोर्ट', 'தமிழ்': 'டிஜிட்டல் பாஸ்போர்ட்' },
  '3D City Map View': { 'हिंदी': '3D शहर का नक्शा', 'தமிழ்': '3D நகர வரைபடம்' },
  'Welcome': { 'हिंदी': 'स्वागत है', 'தமிழ்': 'வரவேற்கிறோம்' },
  'View My Properties': { 'हिंदी': 'मेरी संपत्तियां देखें', 'தமிழ்': 'என் சொத்துக்களைக் காண்க' },
  'Download UPC Certificate & Deed': { 'हिंदी': 'UPC प्रमाणपत्र डाउनलोड करें', 'தமிழ்': 'UPC சான்றிதழைப் பதிவிறக்குக' },
}

export default function CitizenDashboard({ session, onOpenMap }) {
  const navigate = useNavigate()
  const [props, setProps] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [unitsVersion, setUnitsVersion] = useState(0)
  const [view, setView] = useState('welcome') // welcome | properties | grievances
  const [statusFilter, setStatusFilter] = useState('all') // all | verified | review
  const [copiedId, setCopiedId] = useState(null)
  const [toast, setToast] = useState(null)

  // Modals state
  const [selectedUnitForCert, setSelectedUnitForCert] = useState(null)
  const [selectedUnitForLedger, setSelectedUnitForLedger] = useState(null)
  const [selectedUnitForDispute, setSelectedUnitForDispute] = useState(null)
  const [openFaq, setOpenFaq] = useState(null)

  // Grievance form state
  const [grievanceUnitId, setGrievanceUnitId] = useState('')
  const [grievanceType, setGrievanceType] = useState('Area mismatch')
  const [grievanceDesc, setGrievanceDesc] = useState('')
  const [grievanceSubmitted, setGrievanceSubmitted] = useState(null)

  // Any modal open → ESC closes it, background scroll locks, print isolates it
  const modalOpen = !!(selectedUnitForCert || selectedUnitForLedger || selectedUnitForDispute)
  const closeModals = () => {
    setSelectedUnitForCert(null)
    setSelectedUnitForLedger(null)
    setSelectedUnitForDispute(null)
    setGrievanceSubmitted(null)
  }
  useEffect(() => {
    if (!modalOpen) return undefined
    const onKey = (e) => { if (e.key === 'Escape') closeModals() }
    window.addEventListener('keydown', onKey)
    document.body.classList.add('modal-scroll-lock')
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.classList.remove('modal-scroll-lock')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalOpen])

  useEffect(() => {
    let alive = true
    citizenProperties()
      .then((rows) => {
        if (!alive) return
        setProps(rows)
        setLoading(false)
      })
      .catch(() => { if (alive) setLoading(false) })
    const bump = () => setUnitsVersion((v) => v + 1)
    window.addEventListener('demo-units-changed', bump)
    return () => {
      alive = false
      window.removeEventListener('demo-units-changed', bump)
    }
  }, [])

  // Auto-generate 3D units for owned properties on first load
  useEffect(() => {
    if (!props.length) return
    let changed = false
    for (const f of props) {
      if (peekUnits(f.properties.building_id).length === 0) {
        generateUnits(f.properties.building_id, {
          floors: f.properties.stories || 1,
          basements: f.properties.basements || 0,
        })
        changed = true
      }
    }
    if (changed) setUnitsVersion((v) => v + 1)
  }, [props])

  const showToastMsg = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const copyToClipboard = (text, id) => {
    navigator.clipboard?.writeText(text)
    setCopiedId(id)
    showToastMsg(`Copied ULPIN to clipboard: ${text}`)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const [complaintsVersion, setComplaintsVersion] = useState(0)
  const citizenName = session?.name || 'Citizen 1'

  // Summary of owned buildings + 3D spaces strictly for this citizen
  const rows = useMemo(() => {
    return props.map((f) => {
      const p = f.properties
      const ring = f.geometry?.type === 'Polygon' ? f.geometry.coordinates[0] : null
      let digi = null
      let areaSqm = 0
      if (ring?.length) {
        const lats = ring.map((c) => c[1])
        const lons = ring.map((c) => c[0])
        const latMin = Math.min(...lats)
        const lonMin = Math.min(...lons)
        const latMid = (latMin + Math.max(...lats)) / 2
        const mx = (lon) => (lon - lonMin) * M_PER_DEG * Math.cos((latMid * Math.PI) / 180)
        const my = (lat) => (lat - latMin) * M_PER_DEG
        let a2 = 0
        for (let i = 0; i < ring.length - 1; i++) {
          a2 += mx(ring[i][0]) * my(ring[i + 1][1]) - mx(ring[i + 1][0]) * my(ring[i][1])
        }
        areaSqm = Math.round(Math.abs(a2 / 2))
        const clat = lats.reduce((s, c) => s + c, 0) / ring.length
        const clon = lons.reduce((s, c) => s + c, 0) / ring.length
        digi = digipin(clat, clon)
      }
      const rawUnits = peekUnits(p.building_id)
      // Filter to units explicitly owned by this citizen
      let citizenUnits = rawUnits.filter((u) => {
        const owner = (u.owner_name || u.owner || '').toLowerCase()
        const cNameLower = citizenName.toLowerCase()
        return (
          owner === cNameLower ||
          owner === 'citizen 1' ||
          u.unit_no === 1 ||
          u.subunit_no === 1
        )
      })
      if (!citizenUnits.length && rawUnits.length) {
        citizenUnits = rawUnits.slice(0, 1)
      }
      // ── Fallback: if no generated 3D units, use the pre-seeded mock units ──
      if (!citizenUnits.length && p._mockUnits?.length) {
        citizenUnits = p._mockUnits.map((mu) => ({
          unit_ulpin: mu.ulpin,
          unitLabel: mu.unitLabel,
          floor: mu.floor,
          floor_index: mu.floor,
          area_sqm: mu.area,
          owner_name: mu.owner,
          owner: mu.owner,
          validation_status: mu.status === 'verified' ? 'verified' : 'review',
          rights_type: mu.rightsType,
        }))
      }
      const units = citizenUnits.map((u) => ({
        ...u,
        owner_name: citizenName,
        owner: citizenName,
      }))
      const conflicts = units.filter((u) => u.validation_status === 'conflict').length
      return { p, digi, areaSqm, units, conflicts }
    })
  }, [props, unitsVersion, citizenName])

  const portfolio = useMemo(() => {
    const units = []
    const awaiting = []
    for (const r of rows) {
      if (r.units.length) {
        for (const u of r.units) {
          units.push({
            u,
            building: r.p,
            status: u.validation_status === 'conflict' ? 'Conflict' : u.validation_status === 'verified' ? 'Verified Title' : 'Under Survey Check',
            tone: u.validation_status === 'verified' ? 'verified' : u.validation_status === 'conflict' ? 'conflict' : 'review',
          })
        }
      } else {
        awaiting.push(r)
      }
    }
    return { units, awaiting }
  }, [rows])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    let list = portfolio.units

    if (statusFilter === 'verified') {
      list = list.filter((x) => x.tone === 'verified')
    } else if (statusFilter === 'review') {
      list = list.filter((x) => x.tone !== 'verified')
    }

    if (needle) {
      list = list.filter(
        (x) =>
          (x.u.unitLabel || x.u.subunit_name || '').toLowerCase().includes(needle) ||
          (x.u.unit_ulpin || x.u.ulpin || '').toLowerCase().includes(needle) ||
          (x.u.owner_name || x.u.owner || '').toLowerCase().includes(needle) ||
          (x.building.name || '').toLowerCase().includes(needle),
      )
    }

    return {
      units: list,
      awaiting: needle
        ? portfolio.awaiting.filter(
            (r) =>
              (r.p.name || '').toLowerCase().includes(needle) ||
              r.p.building_id.toLowerCase().includes(needle),
          )
        : portfolio.awaiting,
    }
  }, [query, portfolio, statusFilter])

  const totals = useMemo(
    () => ({
      count: rows.length,
      area: portfolio.units.reduce((s, item) => s + (item.u.area_sqm || item.u.area || 82), 0) || rows.reduce((s, r) => s + (r.areaSqm || 0), 0),
      units: portfolio.units.length,
      conflicts: portfolio.units.filter((item) => item.u.validation_status === 'conflict').length,
      surveyed: portfolio.units.length,
    }),
    [rows, portfolio],
  )

  // Citizen's tracked complaints / grievances strictly for their owned units
  const citizenComplaints = useMemo(() => {
    const ownedUlpins = new Set(
      portfolio.units.map((item) => item.u.unit_ulpin || item.u.id || item.u.ulpin),
    )
    return complaints.filter(
      (c) => ownedUlpins.has(c.unitId) || c.unitId === 'unit-1' || c.unitId === 'unit-2' || c.unitId?.startsWith('ULP-')
    )
  }, [portfolio, complaintsVersion])

  const surveyedPct = totals.count ? Math.round((totals.surveyed / totals.count) * 100) : 100
  // Share of units holding a clear, verified title — drives the health stat card
  const titleHealthPct = totals.units
    ? Math.round(((totals.units - totals.conflicts) / totals.units) * 100)
    : 100
  const needsAttention = totals.conflicts > 0
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  // Activity log filtered for citizen's owned properties
  const activity = useMemo(() => {
    const firstLabel = portfolio.units[0]?.u?.subunit_name || portfolio.units[0]?.u?.unitLabel || 'Flat 201'
    const bldgName = portfolio.units[0]?.building?.name || 'Green Meadows'
    const relevant = activityLog.filter((a) => {
      const lower = a.text.toLowerCase()
      return (
        lower.includes('you reported') ||
        lower.includes('your favour') ||
        lower.includes(firstLabel.toLowerCase()) ||
        lower.includes('verified against registry')
      )
    })
    return relevant.length > 0
      ? relevant.slice(0, 6)
      : [
          { id: 'act-101', text: `Volumetric 3D title record for ${firstLabel} verified against state registry`, date: '2026-09-02', type: 'verified' },
          { id: 'act-102', text: `Annual 3D Cadastral tax assessment synced for ${bldgName}`, date: '2026-08-28', type: 'info' },
          { id: 'act-103', text: `Official UPC Certificate & Digital Deed ready for download`, date: '2026-08-15', type: 'verified' },
        ]
  }, [portfolio])

  const [activeLang, setActiveLang] = useState('English')
  const t = (key) => i18n[key]?.[activeLang] || key

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      window.speechSynthesis.speak(utterance)
    }
  }

  const actIcon = {
    verified: <CheckCircle2 size={15} className="act-ic ic-green" />,
    review: <Clock size={15} className="act-ic ic-amber" />,
    info: <FileText size={15} className="act-ic ic-blue" />,
  }

  const handleFileDispute = (e) => {
    e.preventDefault()
    if (!grievanceDesc.trim()) return
    const targetUnit = grievanceUnitId || (portfolio.units[0]?.u.unit_ulpin || portfolio.units[0]?.u.id || 'unit-2')
    const ticketId = addComplaint({
      unitId: targetUnit,
      issueType: grievanceType,
      description: grievanceDesc,
    })
    setGrievanceSubmitted(ticketId)
    setComplaintsVersion((v) => v + 1)
    showToastMsg(`Grievance submitted successfully! Tracking token: ${ticketId}`)
    setGrievanceDesc('')
    setTimeout(() => {
      setSelectedUnitForDispute(null)
      setGrievanceSubmitted(null)
      setView('grievances')
    }, 1800)
  }

  const faqs = [
    {
      q: 'What is a 3D ULPIN and how does it protect my flat?',
      a: 'Standard land records only register ground land parcels (2D). A 3D ULPIN assigns a unique, immutable spatial volume code to your specific apartment floor and unit envelope. This guarantees your vertical ownership rights against duplication, encroachment, or boundary ambiguity.',
    },
    {
      q: 'Can I use this Digital Passport to obtain a bank mortgage or NOC?',
      a: 'Yes. The 3D Digital Passport contains verified encumbrance status, Record of Rights (RoR) data, and a digitally scannable QR code recognized by participating financial institutions and the National Generic Document Registration System (NGDRS).',
    },
    {
      q: 'What should I do if my registered area does not match my sale deed?',
      a: 'You can file a quick grievance directly via the "Grievance Desk" tab. The District Land Registrar and Cadastral Surveyors will review your deed against the 3D LiDAR/OSM volumetric mesh and issue an updated spatial determination within 7 working days.',
    },
  ]

  // Keyboard support for the clickable service cards (Enter / Space activate)
  const cardProps = (handler) => ({
    role: 'button',
    tabIndex: 0,
    onClick: handler,
    onKeyDown: (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handler()
      }
    },
  })

  return (
    <main className={`citizen-main-content${modalOpen ? ' has-modal' : ''}`}>
      {/* Toast Notification */}
      {toast && (
        <div className="cb-toast" role="status" aria-live="polite">
          <Check size={14} className="cb-toast-check" /> {toast}
        </div>
      )}

      {/* Navigation Header */}
      <div className="citizen-head flex items-center justify-between gap-4 flex-wrap mb-4">
        <div className="view-tabs">
          <button
            className={`view-tab ${view === 'welcome' ? 'active' : ''}`}
            onClick={() => setView('welcome')}
            aria-pressed={view === 'welcome'}
          >
            <Activity size={14} /> {t('Overview & Services')}
          </button>
          <button
            className={`view-tab ${view === 'properties' ? 'active' : ''}`}
            onClick={() => setView('properties')}
            aria-pressed={view === 'properties'}
          >
            <Building2 size={14} /> {t('My Properties')} ({rows.length})
          </button>
          <button
            className={`view-tab ${view === 'grievances' ? 'active' : ''}`}
            onClick={() => setView('grievances')}
            aria-pressed={view === 'grievances'}
          >
            <AlertTriangle size={14} /> {t('Grievances & Disputes')}
          </button>
        </div>

        <div className="citizen-head-actions flex items-center gap-2.5">
          <button
            className="btn tiny inline-flex items-center gap-1.5"
            onClick={() => {
              const first = portfolio.units[0]?.u.unit_ulpin || 'unit-2'
              navigate(`/passport/${first}`)
            }}
            title="Open primary property passport"
          >
            <ShieldCheck size={13} className="text-accent" /> {t('Digital Passport')}
          </button>
          <button
            className="btn primary tiny inline-flex items-center gap-1.5"
            onClick={() => onOpenMap(null)}
          >
            <MapPin size={13} /> {t('3D City Map View')}
          </button>
          <div className="relative group">
            <button className="flex items-center gap-2 px-3 py-1.5 rounded bg-white border border-gray-200 text-sm font-medium hover:bg-gray-50 transition-colors">
              <Globe2 size={16} className="text-ink-mid" />
              {activeLang}
              <ChevronDown size={14} className="text-ink-mid" />
            </button>
            <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-gray-200 rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              {['English', 'हिंदी', 'தமிழ்'].map(lang => (
                <button
                  key={lang}
                  onClick={() => setActiveLang(lang)}
                  className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${activeLang === lang ? 'font-bold text-[#4C5BD4]' : 'text-ink'}`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Initial loading skeleton — shown until the portfolio resolves */}
      {loading && (
        <div aria-busy="true" aria-label="Loading your property portfolio…">
          <div className="cb-skeleton cb-skeleton-banner" />
          <div className="stat-cards">
            <div className="cb-skeleton cb-skeleton-stat" />
            <div className="cb-skeleton cb-skeleton-stat" />
            <div className="cb-skeleton cb-skeleton-stat" />
            <div className="cb-skeleton cb-skeleton-stat" />
          </div>
        </div>
      )}

      {/* ── OVERVIEW & SERVICES VIEW ── */}
      {!loading && view === 'welcome' && (
        <>
          {/* Welcome Banner */}
          <div className="citizen-banner">
            <div className="cb-circle c1" />
            <div className="cb-circle c2" />
            {needsAttention && (
              <div className="absolute top-3 right-3 flex items-center gap-2 bg-red-500/20 border border-red-400/30 text-white text-xs px-3 py-1.5 rounded-full font-semibold">
                <AlertTriangle size={13} /> {totals.conflicts} unit{totals.conflicts !== 1 ? 's' : ''} need attention
              </div>
            )}
            <div className="cb-content">
              <div className="cb-eyebrow flex items-center gap-2">
                <span>{greeting} · National Urban 3D Cadastre</span>
                <span className="inline-flex items-center gap-1 bg-white/15 px-2 py-0.5 rounded text-[10px] font-bold text-white">
                  <ShieldCheck size={11} className="text-[#34D399]" /> Aadhaar Linked
                </span>
              </div>
              <div className="cb-title">{t('Welcome')}, {session?.name?.split(' ')[0] || 'Citizen'}</div>
              <div className="cb-sub">
                Your portfolio holds <b>{totals.count} registered property parcel{totals.count !== 1 ? 's' : ''}</b> in Chennai with{' '}
                <b>{totals.units} volumetric unit{totals.units !== 1 ? 's' : ''}</b> mapped in 3D.{' '}
                {needsAttention
                  ? `${totals.conflicts} unit${totals.conflicts !== 1 ? 's' : ''} flagged for review — open Grievances & Disputes to track resolution.`
                  : 'All titles are clear and verified against the state revenue register.'}
              </div>
              <div className="flex items-center gap-3 mt-4 flex-wrap">
                <button
                  className="btn primary cb-cta inline-flex items-center gap-2"
                  onClick={() => setView('properties')}
                >
                  {t('View My Properties')} <ArrowRight size={15} />
                </button>
                <button
                  className="btn cb-cta inline-flex items-center gap-2"
                  onClick={() => {
                    const target = portfolio.units[0]?.u.unit_ulpin || 'unit-2'
                    navigate(`/passport/${target}`)
                  }}
                >
                  <Printer size={14} /> {t('Download UPC Certificate & Deed')}
                </button>
              </div>
            </div>
            <svg className="cb-art" width="130" height="110" viewBox="0 0 130 110">
              <rect x="70" y="20" width="40" height="80" rx="2" fill="rgba(255,255,255,0.12)" />
              <rect x="76" y="28" width="10" height="10" fill="rgba(255,255,255,0.35)" />
              <rect x="92" y="28" width="10" height="10" fill="rgba(255,255,255,0.35)" />
              <rect x="76" y="44" width="10" height="10" fill="rgba(255,255,255,0.35)" />
              <rect x="92" y="44" width="10" height="10" fill="#5E6AD2" opacity="0.9" />
              <rect x="76" y="60" width="10" height="10" fill="rgba(255,255,255,0.35)" />
              <rect x="92" y="60" width="10" height="10" fill="rgba(255,255,255,0.35)" />
              <rect x="76" y="76" width="10" height="10" fill="rgba(255,255,255,0.35)" />
              <rect x="92" y="76" width="10" height="10" fill="rgba(255,255,255,0.35)" />
              <rect x="30" y="55" width="34" height="45" rx="2" fill="rgba(255,255,255,0.08)" />
              <rect x="36" y="62" width="9" height="9" fill="rgba(255,255,255,0.3)" />
              <rect x="50" y="62" width="9" height="9" fill="rgba(255,255,255,0.3)" />
              <rect x="36" y="76" width="9" height="9" fill="rgba(255,255,255,0.3)" />
              <rect x="50" y="76" width="9" height="9" fill="rgba(255,255,255,0.3)" />
              <rect x="10" y="100" width="112" height="4" rx="2" fill="rgba(255,255,255,0.2)" />
            </svg>
          </div>

          {/* Stat Cards */}
          <div className="stat-cards">
            <div className="stat-card">
              <b>{totals.count}</b>
              <span className="muted tiny">Properties Owned</span>
            </div>
            <div className="stat-card">
              <b>{totals.units}</b>
              <span className="muted tiny">3D Units Mapped</span>
            </div>
            <div className="stat-card">
              <b>{totals.area.toLocaleString('en-IN')} m²</b>
              <span className="muted tiny">Total Footprint Area (~{(totals.area * 10.764).toFixed(0)} sq.ft)</span>
            </div>
            <div className="stat-card" title="Share of your volumetric units with a clear, verified title">
              <b className={needsAttention ? 'stat-warn' : 'stat-ok'}>{titleHealthPct}%</b>
              <span className="muted tiny">
                Title Verification Health{needsAttention ? ` — ${totals.conflicts} flagged` : ''}
              </span>
            </div>
          </div>

          {/* Quick Citizen Services Grid */}
          <div>
            <h3 className="text-xs uppercase font-bold text-[#5C6675] tracking-wider mb-2">
              Citizen Self-Service Actions
            </h3>
            <div className="citizen-quick-services">
              <div
                className="quick-service-card"
                {...cardProps(() => navigate(`/passport/${portfolio.units[0]?.u.unit_ulpin || 'unit-2'}`))}
              >
                <div>
                  <div className="qs-icon-box bg-blue-50 text-[#4C5BD4]">
                    <ShieldCheck size={20} />
                  </div>
                  <div className="qs-title">Digital Property Passport</div>
                  <div className="qs-desc">
                    Access your official 3D volumetric deed, scannable QR verification code, and architectural floor bounds.
                  </div>
                </div>
                <div className="qs-action">Open Passport →</div>
              </div>

              <div
                className="quick-service-card"
                {...cardProps(() => navigate(`/passport/${portfolio.units[0]?.u.unit_ulpin || 'unit-2'}`))}
              >
                <div>
                  <div className="qs-icon-box bg-emerald-50 text-[#1B7A4A]">
                    <Printer size={20} />
                  </div>
                  <div className="qs-title">Certified UPC &amp; Title Deed</div>
                  <div className="qs-desc">
                    Print or save an authenticated Government of India UPC Certificate &amp; Title Deed with audit trail.
                  </div>
                </div>
                <div className="qs-action">Download Certificate →</div>
              </div>

              <div
                className="quick-service-card"
                {...cardProps(() => setView('grievances'))}
              >
                <div>
                  <div className="qs-icon-box bg-amber-50 text-[#8A6410]">
                    <AlertTriangle size={20} />
                  </div>
                  <div className="qs-title">Grievances &amp; Dispute Desk</div>
                  <div className="qs-desc">
                    Report boundary mismatches, area discrepancies, or track resolution status with the District Registrar.
                  </div>
                </div>
                <div className="qs-action">Track &amp; File Issue →</div>
              </div>

              <div
                className="quick-service-card"
                {...cardProps(() =>
                  setSelectedUnitForLedger(portfolio.units[0]?.u || { unit_ulpin: 'unit-2', unitLabel: 'Flat 201' }),
                )}
              >
                <div>
                  <div className="qs-icon-box bg-purple-50 text-[#7C3AED]">
                    <Hash size={20} />
                  </div>
                  <div className="qs-title">Cryptographic Audit Chain</div>
                  <div className="qs-desc">
                    Inspect the tamper-proof blockchain ledger validating your sale deed and LiDAR survey mesh.
                  </div>
                </div>
                <div className="qs-action">Inspect Hash Chain →</div>
              </div>
            </div>
          </div>

          {/* ── Real-Time Unit Change Notifications ── */}
          <div className="panel-section welcome-card mb-0">
            <h3 className="flex items-center gap-2 justify-between">
              <span className="flex items-center gap-2">
                <Activity size={15} className="text-[#4C5BD4]" />
                Unit Change Notifications
              </span>
              <span className="text-xs font-normal text-ink-mid bg-[#4C5BD4]/10 text-[#4C5BD4] px-2 py-0.5 rounded-full">Live</span>
            </h3>
            <div className="mt-3 space-y-2">
              {[
                { icon: <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />, title: 'Flat 302 title verified', sub: 'Registrar Arun Krishnan approved the 3D boundary update · 2 Sep 2026', tone: 'ok' },
                { icon: <Clock size={15} className="text-amber-500 shrink-0 mt-0.5" />, title: 'Flat 201 area mismatch under review', sub: 'Surveyor Priya Venkatesan assigned · Response due 29 Sep 2026', tone: 'warn' },
                { icon: <ShieldCheck size={15} className="text-[#4C5BD4] shrink-0 mt-0.5" />, title: 'SHA-256 audit entry created', sub: 'New hash-chained record appended for Flat 203, Lakeview Residency · 27 Aug 2026', tone: 'info' },
              ].map((n, i) => (
                <div key={i} className={`flex gap-3 p-3 rounded-lg border text-sm ${n.tone === 'ok' ? 'bg-emerald-50 border-emerald-100' : n.tone === 'warn' ? 'bg-amber-50 border-amber-100' : 'bg-blue-50 border-blue-100'}`}>
                  {n.icon}
                  <div>
                    <div className="font-semibold text-[#1C2530]">{n.title}</div>
                    <div className="text-xs text-ink-mid mt-0.5">{n.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Survey Progress & Activity Grid */}
          <div className="welcome-grid">
            <div className="panel-section welcome-card">
              <h3>3D Cadastre Survey Status</h3>
              <div className="ring-row">
                <svg width="110" height="110" viewBox="0 0 110 110" className="ring-svg">
                  <circle cx="55" cy="55" r="42" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="10" />
                  <circle
                    cx="55"
                    cy="55"
                    r="42"
                    fill="none"
                    stroke="#4C5BD4"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 42}
                    strokeDashoffset={2 * Math.PI * 42 * (1 - surveyedPct / 100)}
                    transform="rotate(-90 55 55)"
                    style={{ transition: 'stroke-dashoffset 0.9s ease' }}
                  />
                  <text x="55" y="61" textAnchor="middle" fill="#1C2530" style={{ fontSize: 20, fontWeight: 800 }}>
                    {surveyedPct}%
                  </text>
                </svg>
                <div className="muted tiny ring-note">
                  <b>{surveyedPct}% mapped in 3D:</b> Your properties have verified LiDAR and OpenStreetMap volumetric storeys registered with the Greater Chennai cadastre.
                </div>
              </div>
            </div>

            <div className="panel-section welcome-card">
              <h3>Recent Cadastre Notices &amp; Activity</h3>
              {activity.map((a, i) => (
                <div key={a.id} className={`act-row ${i === activity.length - 1 ? 'last' : ''}`}>
                  {actIcon[a.type] || actIcon.info}
                  <div className="act-body">
                    <div className="act-text">{a.text}</div>
                    <div className="muted tiny">{a.date}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Citizen FAQs Section */}
          <div className="panel-section welcome-card">
            <h3 className="flex items-center gap-2">
              <HelpCircle size={15} className="text-[#4C5BD4]" /> Frequently Asked Questions for Property Owners
            </h3>
            <div className="faq-list mt-3">
              {faqs.map((faq, i) => (
                <div key={i} className="faq-item">
                  <button
                    className="faq-btn"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    aria-expanded={openFaq === i}
                  >
                    <span>{faq.q}</span>
                    {openFaq === i ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {openFaq === i && <div className="faq-ans">{faq.a}</div>}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── MY PROPERTIES VIEW ── */}
      {!loading && view === 'properties' && (
        <>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="records-search flex-1 min-w-[280px]">
              <Search size={15} className="rs-icon" />
              <input
                className="search"
                placeholder="Search by apartment number, building name, or ULPIN key…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <div className="filter-pills">
              <button
                className={`filter-pill ${statusFilter === 'all' ? 'active' : ''}`}
                onClick={() => setStatusFilter('all')}
              >
                All Properties ({portfolio.units.length})
              </button>
              <button
                className={`filter-pill ${statusFilter === 'verified' ? 'active' : ''}`}
                onClick={() => setStatusFilter('verified')}
              >
                ✓ Clear Title ({portfolio.units.filter((x) => x.tone === 'verified').length})
              </button>
              <button
                className={`filter-pill ${statusFilter === 'review' ? 'active' : ''}`}
                onClick={() => setStatusFilter('review')}
              >
                In Review ({portfolio.units.filter((x) => x.tone !== 'verified').length})
              </button>
            </div>

            {(query.trim() || statusFilter !== 'all') && (
              <span className="muted tiny whitespace-nowrap">
                Showing {filtered.units.length} of {portfolio.units.length} units
              </span>
            )}
          </div>

          {filtered.units.length === 0 && (
            portfolio.units.length === 0 ? (
              <div className="cb-empty">
                <Building2 size={26} className="cb-empty-icon" />
                <p className="text-sm font-bold text-ink">No registered properties yet</p>
                <p className="muted tiny mt-1 max-w-[420px]">
                  When a property is registered against your Aadhaar-linked account, its 3D
                  volumetric title record will appear here automatically.
                </p>
                <button
                  className="btn tiny mt-3 inline-flex items-center gap-1.5"
                  onClick={() => onOpenMap(null)}
                >
                  <MapPin size={13} /> Explore the 3D City Map
                </button>
              </div>
            ) : (
              <div className="cb-empty">
                <Search size={26} className="cb-empty-icon" />
                <p className="text-sm font-bold text-ink">No properties matched your search</p>
                <p className="muted tiny mt-1">
                  Try a different apartment number, building name or ULPIN key.
                </p>
                <button
                  className="btn tiny mt-3"
                  onClick={() => { setQuery(''); setStatusFilter('all'); }}
                >
                  Reset Search &amp; Filters
                </button>
              </div>
            )
          )}

          {filtered.units.length > 0 && (
            <div className="prop-grid">
              {filtered.units.map(({ u, building, status, tone }) => {
                const unitId = u.unit_ulpin || u.id || 'unit-2'
                const displayUlpin = u.unit_ulpin || u.ulpin || `TN-07-${building.building_id}`
                const label = u.unitLabel || 'Residential Unit'
                const owner = u.owner_name || u.owner || session?.name || 'Citizen'

                return (
                  <div key={unitId} className="prop-card">
                    <div className="prop-head">
                      <div>
                        <strong>{label}</strong>
                        <div className="muted tiny unit-where mt-0.5">
                          <MapPin size={11} className="unit-pin" /> {building.name || 'Building'} · Floor {u.floor ?? 2}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`chip ${
                            tone === 'verified'
                              ? 'status-valid'
                              : tone === 'conflict'
                                ? 'status-conflict'
                                : 'under-review'
                          }`}
                        >
                          {tone === 'verified'
                            ? '✓ Clear Title'
                            : tone === 'conflict'
                              ? '⚠ Boundary Conflict'
                              : '⋯ Under Review'}
                        </span>
                        <button
                          onClick={() => speakText(`Title Status: ${tone === 'verified' ? 'Clear Title' : tone === 'conflict' ? 'Boundary Conflict' : 'Under Review'}`)}
                          className="p-1 rounded hover:bg-black/5 text-ink-mid"
                          title="Read status aloud"
                        >
                          <Volume2 size={14} />
                        </button>
                      </div>
                    </div>

                    <table className="kv mt-2">
                      <tbody>
                        <tr>
                          <td>Carpet Area</td>
                          <td>
                            <b>{u.area_sqm || u.area || 82} m²</b>
                            <span className="muted tiny ml-1">
                              (~{Math.round((u.area_sqm || u.area || 82) * 10.764)} sq.ft)
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td>Registered Owner</td>
                          <td>{owner}</td>
                        </tr>
                        <tr>
                          <td>National 3D ULPIN</td>
                          <td>
                            <div className="flex items-center justify-between gap-1">
                              <span className="mono tiny truncate max-w-[200px]" title={displayUlpin}>
                                {displayUlpin}
                              </span>
                              <button
                                onClick={() => copyToClipboard(displayUlpin, unitId)}
                                className="p-1 hover:bg-black/5 rounded text-ink-mid"
                                title="Copy ULPIN"
                              >
                                {copiedId === unitId ? <Check size={12} className="text-green" /> : <Copy size={12} />}
                              </button>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td>Encumbrance (NOC)</td>
                          <td>
                            <span className="text-[#1B7A4A] font-semibold text-xs">Nil / Clear Title</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Action Button Row */}
                    <div className="prop-card-actions">
                      <button
                        className="btn tiny primary inline-flex items-center gap-1.5 flex-1 justify-center"
                        onClick={() => navigate(`/passport/${unitId}`)}
                        title="View complete Digital Property Passport"
                      >
                        <ShieldCheck size={13} /> Passport
                      </button>

                      <button
                        className="btn tiny inline-flex items-center gap-1.5 flex-1 justify-center"
                        onClick={() => setSelectedUnitForCert(u)}
                        title="Download or print official Certificate of Ownership"
                      >
                        <Printer size={13} /> Certificate
                      </button>

                      <button
                        className="btn tiny inline-flex items-center gap-1.5 flex-1 justify-center"
                        onClick={() => setSelectedUnitForLedger(u)}
                        title="Inspect blockchain audit chain"
                      >
                        <Hash size={13} /> Ledger
                      </button>

                      <button
                        className="btn tiny prop-report-btn inline-flex items-center gap-1.5 justify-center"
                        onClick={() => {
                          setGrievanceUnitId(unitId)
                          setSelectedUnitForDispute(u)
                        }}
                        title="Report boundary or area discrepancy"
                      >
                        <AlertTriangle size={13} /> Report
                      </button>

                      <button
                        className="btn tiny inline-flex items-center gap-1.5 flex-1 justify-center"
                        onClick={() => onOpenMap(building.building_id || building.id)}
                        title="Show on 3D Map"
                      >
                        <MapPin size={13} /> Map
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ── GRIEVANCES & DISPUTES VIEW ── */}
      {!loading && view === 'grievances' && (
        <div className="space-y-6">
          <div className="bg-white border border-[#E4E7EC] rounded-[14px] p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
              <div>
                <h2 className="text-lg font-bold text-ink">Grievances &amp; Dispute Desk</h2>
                <p className="text-xs text-ink-mid mt-0.5">
                  Report discrepancies in registered area, floor index, or volumetric boundaries to the District Registrar.
                </p>
              </div>
              <button
                className="btn primary tiny inline-flex items-center gap-1.5"
                onClick={() => {
                  setGrievanceUnitId('')
                  setSelectedUnitForDispute(portfolio.units[0]?.u || { unit_ulpin: 'unit-2' })
                }}
              >
                <PlusCircle size={14} /> File New Grievance
              </button>
            </div>

            {/* Complaints List */}
            <div className="space-y-3 mt-4">
              <h3 className="text-xs uppercase font-bold text-ink-mid tracking-wider">
                Tracked Tickets ({citizenComplaints.length})
              </h3>
              {citizenComplaints.length === 0 ? (
                <div className="cb-empty cb-empty-sm">
                  <CheckCircle2 size={26} className="cb-empty-icon" />
                  <p className="text-sm font-bold text-ink">No grievances on record</p>
                  <p className="muted tiny mt-1">
                    No complaints or disputes have been filed for your properties. Flag an
                    issue and track its resolution from here.
                  </p>
                  <button
                    className="btn tiny mt-3 inline-flex items-center gap-1.5"
                    onClick={() => {
                      setGrievanceUnitId('')
                      setSelectedUnitForDispute(portfolio.units[0]?.u || { unit_ulpin: 'unit-2' })
                    }}
                  >
                    <PlusCircle size={13} /> File a Grievance
                  </button>
                </div>
              ) : (
                citizenComplaints.map((c) => {
                  const target = getUnit(c.unitId)
                  return (
                    <div
                      key={c.id}
                      className="p-4 rounded-[10px] border border-[#E4E7EC] bg-[#FAFAFB] flex items-start justify-between gap-4 flex-wrap"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-ink">{c.id}</span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-[#4C5BD4]">
                            {c.issueType}
                          </span>
                        </div>
                        <div className="text-xs text-ink-mid mt-1">
                          Property: <span className="font-semibold text-ink">{target?.unitLabel || c.unitId}</span> · Filed on {c.date}
                        </div>
                        <div className="text-xs text-[#1C2530] mt-2 font-medium bg-white p-2.5 rounded border border-[#E4E7EC]">
                          &ldquo;{c.description}&rdquo;
                        </div>
                      </div>

                      <div className="ticket-status flex flex-col items-end gap-2 shrink-0">
                        <span
                          className={`chip ${
                            c.status === 'resolved' ? 'status-valid' : 'under-review'
                          }`}
                        >
                          {c.status === 'resolved' ? '✓ Resolved by Registrar' : '⋯ Under Active Review'}
                        </span>
                        <span className="text-[11px] text-ink-mid">
                          Resolution SLA: Within 7 days
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: OFFICIAL CERTIFICATE OF OWNERSHIP ── */}
      {selectedUnitForCert && (
        <div className="citizen-modal-backdrop" onClick={closeModals}>
          <div
            className="citizen-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Official Certificate of Ownership and 3D Title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="flex items-center gap-2">
                <CubeMark size={22} tint="#4C5BD4" />
                <h3 className="font-bold text-sm text-ink">Official Certificate of Ownership &amp; 3D Title</h3>
              </div>
              <button
                onClick={() => setSelectedUnitForCert(null)}
                className="p-1 rounded hover:bg-black/5 text-ink-mid"
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              <div className="cert-frame text-[#1C2530]">
                <div className="text-center pb-4 border-b border-[#E4E7EC]">
                  <div className="text-[10px] font-bold tracking-[0.16em] uppercase text-[#4C5BD4]">
                    Government of India · Department of Land Resources
                  </div>
                  <h2 className="text-xl font-black tracking-tight mt-1 text-[#0D1126]">
                    CERTIFICATE OF VERTICAL PROPERTY TITLE
                  </h2>
                  <div className="text-xs text-ink-mid mt-0.5">
                    Issued under the National Urban 3D Cadastre Framework (SIH26095)
                  </div>
                </div>

                <div className="my-5 space-y-3 text-xs">
                  <div className="flex justify-between border-b border-dashed border-[#E4E7EC] pb-1.5">
                    <span className="text-ink-mid">Unique Land Parcel Identification (3D ULPIN):</span>
                    <span className="font-id font-bold text-[#0D1126]">
                      {selectedUnitForCert.unit_ulpin || selectedUnitForCert.ulpin || 'TN-07-4821-9034-F2-U201'}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-dashed border-[#E4E7EC] pb-1.5">
                    <span className="text-ink-mid">Registered Title Holder:</span>
                    <span className="font-bold text-[#0D1126]">
                      {selectedUnitForCert.owner_name || selectedUnitForCert.owner || session.name}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-dashed border-[#E4E7EC] pb-1.5">
                    <span className="text-ink-mid">Volumetric Space Designation:</span>
                    <span className="font-bold text-[#0D1126]">
                      {selectedUnitForCert.unitLabel || 'Flat 201'} · Level {selectedUnitForCert.floor ?? 2}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-dashed border-[#E4E7EC] pb-1.5">
                    <span className="text-ink-mid">Registered Carpet Area:</span>
                    <span className="font-bold text-[#0D1126]">
                      {selectedUnitForCert.area_sqm || selectedUnitForCert.area || 82} m² (~
                      {Math.round((selectedUnitForCert.area_sqm || selectedUnitForCert.area || 82) * 10.764)} sq.ft)
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-dashed border-[#E4E7EC] pb-1.5">
                    <span className="text-ink-mid">Encumbrance (NOC) Status:</span>
                    <span className="font-bold text-[#1B7A4A]">NIL ENCUMBRANCE · CLEAR TITLE</span>
                  </div>
                  <div className="flex justify-between pb-1.5">
                    <span className="text-ink-mid">Issuance Date:</span>
                    <span className="font-medium text-[#0D1126]">
                      {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#E4E7EC] flex items-center justify-between">
                  <div className="cert-stamp">VERIFIED · DO NOT ALTER</div>
                  <div className="text-right text-[11px] text-ink-mid">
                    <div className="font-bold text-[#0D1126]">Registrar of Land Records</div>
                    <div>Cadastral Zone Chennai Central</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn"
                onClick={() => setSelectedUnitForCert(null)}
              >
                Close
              </button>
              <button
                className="btn primary inline-flex items-center gap-1.5"
                onClick={() => window.print()}
              >
                <Printer size={14} /> Print / Save as PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: BLOCKCHAIN AUDIT TRAIL ── */}
      {selectedUnitForLedger && (
        <div className="citizen-modal-backdrop" onClick={closeModals}>
          <div
            className="citizen-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Cryptographic title audit trail"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="flex items-center gap-2">
                <Hash size={18} className="text-[#4C5BD4]" />
                <h3 className="font-bold text-sm text-ink">Cryptographic Title Audit Trail</h3>
              </div>
              <button
                onClick={() => setSelectedUnitForLedger(null)}
                className="p-1 rounded hover:bg-black/5 text-ink-mid"
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-body space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between p-3 bg-emerald-50 text-[#1B7A4A] rounded-lg font-sans font-semibold">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={16} /> Blockchain State: Verified &amp; Unbroken
                </span>
                <span className="text-xs font-mono">3 Blocks</span>
              </div>

              {/* Block 3 */}
              <div className="p-3 bg-[#F9FAFB] rounded-lg border-l-4 border-[#34D399] border border-[#E4E7EC]">
                <div className="flex justify-between font-bold text-[#1C2530] mb-1">
                  <span>BLOCK #3 · 3D ULPIN MINTING</span>
                  <span className="text-[10px] text-ink-mid">2026-09-02 14:10 UTC</span>
                </div>
                <div className="font-sans text-xs text-[#5C6675] mb-2">
                  Vertical volumetric boundaries minted and registered to{' '}
                  {selectedUnitForLedger.owner_name || selectedUnitForLedger.owner || session.name}
                </div>
                <div className="text-[11px] text-ink-mid">
                  Block Hash: <span className="text-[#1B7A4A]">0x4c1a...8e44</span> · Prev:{' '}
                  <span className="text-[#4C5BD4]">0x9f8e...3b12</span>
                </div>
              </div>

              {/* Block 2 */}
              <div className="p-3 bg-[#F9FAFB] rounded-lg border-l-4 border-[#4C5BD4] border border-[#E4E7EC]">
                <div className="flex justify-between font-bold text-[#1C2530] mb-1">
                  <span>BLOCK #2 · TOPOLOGY VALIDATION</span>
                  <span className="text-[10px] text-ink-mid">2026-08-20 09:30 UTC</span>
                </div>
                <div className="font-sans text-xs text-[#5C6675] mb-2">
                  LiDAR/OpenStreetMap polygon checked for overlaps · 0 conflicting volumes detected
                </div>
                <div className="text-[11px] text-ink-mid">
                  Block Hash: <span className="text-[#4C5BD4]">0x9f8e...3b12</span> · Prev:{' '}
                  <span className="text-ink-mid">0x1a2b...9981</span>
                </div>
              </div>

              {/* Block 1 */}
              <div className="p-3 bg-[#F9FAFB] rounded-lg border-l-4 border-gray-400 border border-[#E4E7EC]">
                <div className="flex justify-between font-bold text-[#1C2530] mb-1">
                  <span>BLOCK #1 · SALE DEED CONVEYANCE</span>
                  <span className="text-[10px] text-ink-mid">2024-11-14 11:20 UTC</span>
                </div>
                <div className="font-sans text-xs text-[#5C6675] mb-2">
                  Genesis conveyance registered at SRO T. Nagar · Book 1, Volume 12
                </div>
                <div className="text-[11px] text-ink-mid">
                  Block Hash: <span className="text-[#1C2530]">0x1a2b...9981</span> · Prev: 0x0000...0000
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn primary"
                onClick={() => setSelectedUnitForLedger(null)}
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: FILE GRIEVANCE / DISPUTE ── */}
      {selectedUnitForDispute && (
        <div className="citizen-modal-backdrop" onClick={closeModals}>
          <div
            className="citizen-modal"
            role="dialog"
            aria-modal="true"
            aria-label="File a property discrepancy or grievance"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber" />
                <h3 className="font-bold text-sm text-ink">File a Property Discrepancy / Grievance</h3>
              </div>
              <button
                onClick={() => setSelectedUnitForDispute(null)}
                className="p-1 rounded hover:bg-black/5 text-ink-mid"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleFileDispute}>
              <div className="modal-body space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Select Property</label>
                  <select
                    className="w-full p-2.5 border border-[#E4E7EC] rounded-lg text-sm bg-white"
                    value={grievanceUnitId || selectedUnitForDispute.unit_ulpin || 'unit-2'}
                    onChange={(e) => setGrievanceUnitId(e.target.value)}
                  >
                    {portfolio.units.map(({ u, building }) => (
                      <option key={u.unit_ulpin || u.id} value={u.unit_ulpin || u.id}>
                        {u.unitLabel || 'Unit'} — {building.name} (Floor {u.floor ?? 2})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Issue Category</label>
                  <select
                    className="w-full p-2.5 border border-[#E4E7EC] rounded-lg text-sm bg-white"
                    value={grievanceType}
                    onChange={(e) => setGrievanceType(e.target.value)}
                  >
                    <option>Area mismatch (Deed area differs from 3D model)</option>
                    <option>Boundary mismatch (Balcony/wall encroachment)</option>
                    <option>Wrong floor level recorded</option>
                    <option>Owner name or Aadhaar linkage spelling error</option>
                    <option>Unauthorized vertical construction on adjacent unit</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Discrepancy Details</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Describe the discrepancy with respect to your sale deed or physical inspection…"
                    className="w-full p-2.5 border border-[#E4E7EC] rounded-lg text-sm bg-white"
                    value={grievanceDesc}
                    onChange={(e) => setGrievanceDesc(e.target.value)}
                  />
                </div>

                {grievanceSubmitted && (
                  <div className="p-3 bg-emerald-50 text-[#1B7A4A] rounded-lg text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 size={16} /> Ticket {grievanceSubmitted} created! Redirecting to tracker…
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-4 mb-2">
                <button
                  type="button"
                  className="btn secondary flex-1 flex items-center justify-center gap-2"
                  onClick={() => {
                    closeModals()
                    if (onOpenMap) {
                      // Pan to the building and zoom in
                      onOpenMap(selectedUnitForDispute.building_id || selectedUnitForDispute.buildingId)
                    }
                  }}
                >
                  <MapPin size={16} /> Select Disputed Area on 3D Model
                </button>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn"
                  onClick={() => setSelectedUnitForDispute(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!grievanceDesc.trim() || grievanceSubmitted}
                  className="btn primary"
                >
                  Submit Official Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
