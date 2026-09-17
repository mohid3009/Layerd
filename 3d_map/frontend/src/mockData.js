// ── Citizen portal mock data ─────────────────────────────────────────────────
// One source of truth for the portal pages. Swap these exports for real
// fetch calls later — the shape mirrors what an API would return.

export const buildings = [
  {
    id: 'bldg-1',
    name: 'Green Meadows Apartments',
    baseUlpin: 'TN-07-4821-9034-7756',
    address: '12, Lake View 1st Cross St, T. Nagar, Chennai 600017',
    floors: 4,
    basements: 1,
    height: 14.6,
    extraction: 'LiDAR point-cloud + AI segmentation',
    units: [
      { id: 'unit-1', ulpin: 'TN-07-4821-9034-7756-F3-U302', floor: 3, unitLabel: 'Flat 302', owner: 'Citizen 1', area: 84.2, rightsType: 'Owned', status: 'verified', lastUpdated: '2026-09-02' },
      { id: 'unit-2', ulpin: 'TN-07-4821-9034-7756-F2-U201', floor: 2, unitLabel: 'Flat 201', owner: 'Citizen 1', area: 79.5, rightsType: 'Owned', status: 'verified', lastUpdated: '2026-08-21' },
      { id: 'unit-3', ulpin: 'TN-07-4821-9034-7756-F1-U104', floor: 1, unitLabel: 'Shop 104', owner: 'Citizen 2', area: 42.0, rightsType: 'Leased', status: 'review', lastUpdated: '2026-08-30' },
      { id: 'unit-4', ulpin: 'TN-07-4821-9034-7756-F4-U401', floor: 4, unitLabel: 'Penthouse 401', owner: 'Citizen 3', area: 120.4, rightsType: 'Owned', status: 'verified', lastUpdated: '2026-07-19' },
    ],
  },
  {
    id: 'bldg-2',
    name: 'Sunrise Enclave',
    baseUlpin: 'TN-07-5544-2210-1187',
    address: '45, Bazullah Rd, T. Nagar, Chennai 600017',
    floors: 3,
    basements: 0,
    height: 10.2,
    extraction: 'LiDAR point-cloud + AI segmentation',
    units: [
      { id: 'unit-5', ulpin: 'TN-07-5544-2210-1187-F2-U204', floor: 2, unitLabel: 'Flat 204', owner: 'Citizen 4', area: 88.0, rightsType: 'Owned', status: 'verified', lastUpdated: '2026-08-11' },
      { id: 'unit-6', ulpin: 'TN-07-5544-2210-1187-F1-U103', floor: 1, unitLabel: 'Flat 103', owner: 'Citizen 5', area: 76.3, rightsType: 'Owned', status: 'review', lastUpdated: '2026-09-01' },
      { id: 'unit-7', ulpin: 'TN-07-5544-2210-1187-F3-U303', floor: 3, unitLabel: 'Flat 303', owner: 'Citizen 6', area: 91.7, rightsType: 'Leased', status: 'verified', lastUpdated: '2026-07-28' },
    ],
  },
  {
    id: 'bldg-3',
    name: 'Lakeview Residency',
    baseUlpin: 'TN-07-6391-8845-2210',
    address: '8, Venkatanarayana Rd, T. Nagar, Chennai 600017',
    floors: 5,
    basements: 1,
    height: 17.8,
    extraction: 'Drone photogrammetry',
    units: [
      { id: 'unit-8', ulpin: 'TN-07-6391-8845-2210-F4-U402', floor: 4, unitLabel: 'Flat 402', owner: 'Citizen 7', area: 102.6, rightsType: 'Owned', status: 'verified', lastUpdated: '2026-08-05' },
      { id: 'unit-9', ulpin: 'TN-07-6391-8845-2210-F2-U203', floor: 2, unitLabel: 'Flat 203', owner: 'Citizen 1', area: 81.1, rightsType: 'Owned', status: 'verified', lastUpdated: '2026-08-27' },
      { id: 'unit-10', ulpin: 'TN-07-6391-8845-2210-F5-U501', floor: 5, unitLabel: 'Flat 501', owner: 'Citizen 8', area: 118.9, rightsType: 'Owned', status: 'review', lastUpdated: '2026-09-04' },
    ],
  },
  {
    id: 'bldg-4',
    name: 'Anna Nagar Commercial Complex',
    baseUlpin: 'TN-07-7712-4408-9903',
    address: '2nd Ave, Anna Nagar, Chennai 600040',
    floors: 2,
    basements: 0,
    height: 7.4,
    extraction: 'Assumed from footprint',
    units: [
      { id: 'unit-11', ulpin: 'TN-07-7712-4408-9903-F1-U101', floor: 1, unitLabel: 'Showroom 101', owner: 'Citizen 9', area: 210.0, rightsType: 'Leased', status: 'verified', lastUpdated: '2026-06-15' },
      { id: 'unit-12', ulpin: 'TN-07-7712-4408-9903-F2-U201', floor: 2, unitLabel: 'Office 201', owner: 'Citizen 10', area: 168.2, rightsType: 'Leased', status: 'verified', lastUpdated: '2026-06-15' },
    ],
  },
  {
    id: 'bldg-5',
    name: 'Teynampet Heritage House',
    baseUlpin: 'TN-07-8803-9915-4417',
    address: '21, Bharathi Salai, Teynampet, Chennai 600018',
    floors: 2,
    basements: 0,
    height: 6.9,
    extraction: 'Assumed from footprint',
    units: [
      { id: 'unit-13', ulpin: 'TN-07-8803-9915-4417-F1-U001', floor: 1, unitLabel: 'Ground House', owner: 'Citizen 11', area: 94.4, rightsType: 'Owned', status: 'review', lastUpdated: '2026-05-30' },
      { id: 'unit-14', ulpin: 'TN-07-8803-9915-4417-F2-U002', floor: 2, unitLabel: 'Upper House', owner: 'Citizen 12', area: 88.8, rightsType: 'Owned', status: 'verified', lastUpdated: '2026-05-30' },
    ],
  },
]

export const currentUser = {
  name: 'Citizen 1',
  citizenId: 'LYD-CIT-88231',
  aadhaarMasked: 'XXXX XXXX 4821',
  mobileMasked: '+91 XXXXX 41209',
  ownedUnitIds: ['unit-1', 'unit-2', 'unit-9'],
}

export const activityLog = [
  { id: 'act-6', text: 'Ownership record for Flat 203 verified against registry', date: '2026-09-02', type: 'verified' },
  { id: 'act-5', text: '3D model updated for Lakeview Residency after re-survey', date: '2026-08-27', type: 'info' },
  { id: 'act-4', text: 'Boundary complaint CP-1042 resolved in your favour', date: '2026-08-19', type: 'verified' },
  { id: 'act-3', text: 'Shop 104 placed under review - floor-plan mismatch flagged', date: '2026-08-30', type: 'review' },
  { id: 'act-2', text: 'Annual property tax record synced for Flat 201', date: '2026-08-12', type: 'info' },
  { id: 'act-1', text: 'You reported a boundary mismatch for Flat 302', date: '2026-07-22', type: 'review' },
]

export const complaints = [
  { id: 'CP-1042', unitId: 'unit-1', issueType: 'Boundary mismatch', description: 'North-east corner of the balcony extends past the surveyed line.', status: 'resolved', date: '2026-07-22' },
  { id: 'CP-1188', unitId: 'unit-2', issueType: 'Area mismatch', description: 'Registry area shows 78 sqm but the sale deed says 79.5 sqm.', status: 'open', date: '2026-09-01' },
]

// - helpers (these become real API calls later) -
export const getBuilding = (id) => buildings.find((b) => b.id === id) || null
export const getUnit = (id) => {
  if (!id) return null
  for (const b of buildings) {
    const u = b.units.find((x) => x.id === id || x.ulpin === id)
    if (u) return { ...u, building: b }
  }
  try {
    const unitsRaw = JSON.parse(localStorage.getItem('layerd-demo-units') || '{}')
    for (const [bid, list] of Object.entries(unitsRaw)) {
      const match = list.find((u) => u.unit_ulpin === id || u.id === id || `${bid}-${u.unit_ulpin}` === id)
      if (match) {
        return {
          id: match.unit_ulpin || id,
          ulpin: match.unit_ulpin || `TN-07-${id}`,
          floor: match.floor ?? 2,
          unitLabel: match.owner_name ? `${match.owner_name}'s Unit` : `Unit ${String(id).slice(-4)}`,
          owner: match.owner_name || 'Citizen 1',
          area: match.area_sqm || 82.5,
          rightsType: match.rights_type || 'Owned',
          status: match.validation_status === 'conflict' ? 'conflict' : match.validation_status === 'verified' ? 'verified' : 'review',
          lastUpdated: match.updated_at ? match.updated_at.slice(0, 10) : '2026-09-01',
          building: {
            id: bid,
            name: `Building ${bid.slice(0, 10)}`,
            baseUlpin: `TN-07-${bid.slice(0, 8)}`,
            address: 'T. Nagar, Chennai 600017',
            floors: 4,
            basements: 0,
            height: 12.0,
            extraction: 'OpenStreetMap + Cadastre 3D',
            units: list.map((x) => ({
              id: x.unit_ulpin,
              ulpin: x.unit_ulpin,
              floor: x.floor ?? 1,
              unitLabel: x.owner_name || 'Unit',
              owner: x.owner_name || 'Citizen 1',
              area: x.area_sqm || 80,
              rightsType: x.rights_type || 'Owned',
              status: x.validation_status || 'verified',
            }))
          }
        }
      }
    }
  } catch (e) {}

  // Fallback for demo: if ID starts with unit- or any ID, create a plausible verified unit
  return {
    id: id,
    ulpin: `TN-07-4821-9034-7756-${id.toUpperCase()}`,
    floor: 2,
    unitLabel: `Unit ${id}`,
    owner: 'Citizen 1',
    area: 84.0,
    rightsType: 'Owned',
    status: 'verified',
    lastUpdated: '2026-09-02',
    building: buildings[0],
  }
}
export const buildingOfUnit = (unitId) => getUnit(unitId)?.building || null
export const ownedUnits = () =>
  currentUser.ownedUnitIds.map((id) => getUnit(id)).filter(Boolean)
export const openComplaints = () => complaints.filter((c) => c.status === 'open')

export function addComplaint({ unitId, issueType, description }) {
  const id = `CP-${1200 + complaints.length}`
  complaints.unshift({
    id,
    unitId,
    issueType,
    description,
    status: 'open',
    date: new Date().toISOString().slice(0, 10),
  })
  activityLog.unshift({
    id: `act-${activityLog.length + 1}`,
    text: `You reported a ${issueType.toLowerCase()} for ${getUnit(unitId)?.unitLabel || unitId}`,
    date: new Date().toISOString().slice(0, 10),
    type: 'review',
  })
  return id
}
