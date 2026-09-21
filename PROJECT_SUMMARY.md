# Project Summary — 3D ULPIN Generation & Vertical Property Mapping System

> **SIH 2026 — Problem Statement SIH26095 (3D ULPIN variant)**
> Ministry: Ministry of Rural Development / Department of Land Resources (DoLR)
> Repo: `sih11-demo` ("Avani" demo) · Branch: `main` · Demo package: `ulpin-3d-frontend`

---

## 1. What This Project Is

A hackathon demo that extends India's **ULPIN** (Unique Land Parcel Identification Number) from a **2D surface-parcel ID** into the **vertical / volumetric dimension**. Today's ULPIN identifies a plot's footprint but says nothing about what is built above or below it — a 20-storey apartment and an empty plot look identical at the ULPIN level. This project demonstrates:

- **3D visualization** of a real city (Chennai · T. Nagar / Mambalam) with one coloured slice per storey, plus basements rendered below the ground plane.
- **Per-unit 3D ULPIN generation** — derived IDs of the form `{base_ULPIN}-F{floor}-U{unit}` (negative floors = basements, e.g. `F-1`).
- **Role-based portals** for Citizen, Surveyor and Registrar (property passports, records, complaints, profile).
- **Vertical-geometry logic**: z-range computation, volumetric overlap detection, unit corrections — the core "intelligence" of the system, with unit tests.
- **Mock NGDRS handoff** concept (mock payload only — no real government integration).

### Current build scope (important)

Per `run.md`, the **FastAPI/PostGIS backend, Electron shell and LiDAR pipeline were removed** for this demo. Everything runs **frontend-only** — no Python, no Node server beyond Vite, no database. State persists to `localStorage` / `sessionStorage`. The full backend architecture (FastAPI + SQLite + OpenCV segmentation + hash-chained ledger) is specified in `3D_ULPIN_PRD.md` and positioned as the production path.

---

## 2. Problem Being Solved

There is no standardized, automated way to:

1. Generate a unique spatial identity for a **vertical/volumetric unit** (a specific flat, basement slot, or utility corridor segment).
2. **Validate** that these volumetric units don't conflict with each other (topology validation).
3. Tie these units back to a legally recognized base parcel (**backward compatibility** with existing ULPIN).
4. Manage **ownership records and disputes** for these units.

**Why it matters:** ownership ambiguity for apartment units causes legal disputes; utility departments have no way to record underground infrastructure against the same spatial reference as surface parcels; urban redevelopment approvals are slowed by missing vertical records.

---

## 3. Tech Stack (as built)

| Layer | Choice | Notes |
|---|---|---|
| Framework | React 18 + Vite 5 | Fast dev server, SPA with lazy-loaded routes |
| 2D/3D map | **MapLibre GL** (`maplibre-gl`) | City view, per-storey `fill-extrusion` slices, cast shadows |
| 3D scenes | **Three.js + @react-three/fiber + @react-three/drei** | Building/unit 3D views, point-cloud viewer |
| Routing | react-router-dom v6 | Role-aware routes under `/portal/*` |
| Styling | Tailwind CSS 4 (`@tailwindcss/vite`) + custom CSS | Glass panels, cursor-spotlight cards |
| Geo helpers | `d3-geo`, `topojson-client`, `world-atlas` | Hero globe on the landing page |
| UI extras | framer-motion, lucide-react | Animations and icons |
| Persistence | `localStorage` + `sessionStorage` | Demo mutations + session; no backend |
| Testing | `node:test` (`node --test`) | Unit tests for vertical geometry & overlap logic |
| Dataset | OpenStreetMap via Overpass API | ~6,000 building footprints, baked to JSON |

---

## 4. Repository Layout

```
sih11-demo/
├── 3D_ULPIN_PRD.md              # Full PRD: problem, FRs 1–26, data model, architecture, demo script
├── userstories.md               # Role-by-role user stories (C1–C9, S1–S8, R1–R11) mapped to FRs
├── run.md                       # Quick-start + routes doc for the frontend-only demo
├── chennai_raw.json             # Raw Overpass dump (~7.3 MB)
├── scripts/
│   ├── convert_chennai.cjs      # One-off: raw Overpass JSON → baked demo dataset
│   ├── vertical_geometry.test.mjs  # node:test suite for z-ranges, overlaps, corrections
│   └── check_jsx.cjs            # Lint-style JSX sanity check (npm run check)
└── 3d_map/frontend/
    ├── package.json             # Scripts: dev, build, preview, test, check
    ├── public/
    │   ├── chennai_buildings.json   # Baked city (~2.4 MB, fetched at runtime)
    │   └── samples/sample_lidar.ply # Sample point cloud for /pointcloud
    └── src/
        ├── App.jsx              # Router, session/role switching, PageShell, lazy routes
        ├── api.js               # Client-side "backend": city fetch, mutations→localStorage,
        │                        #   overlap detection, unit edit/correction/approval APIs
        ├── verticalGeometry.js  # unitZRange / unitRenderRange — floor→z mapping rules
        ├── floors.js            # Per-storey render slices, floor/basement colour ramps
        ├── constants.js         # Demo users, session key, dawn/noon/dusk/night lighting presets
        ├── mockData.js          # Portal mock data: 5 buildings, 14 units, complaints, activity
        ├── data/chennai_buildings.json  # Same dataset, lazy-imported as a chunk
        ├── components/
        │   ├── Landing.jsx, Login.jsx, Dashboard.jsx, UlpinView.jsx
        │   ├── BuildingsMap.jsx, LidarMap.jsx, PointCloudViewer.jsx,
        │   │   ObliqueImagery.jsx, HeroGlobe.jsx, ErrorBoundary.jsx, CubeMark.jsx
        │   ├── layout/          # Topbar, Sidebar, Header, Footer, PortalLayout
        │   └── ui/              # Breadcrumb, DetailGrid, StatCard, StatusPill, QRBlock,
        │                        #   MapInset, MiniRow, ProgressRing, TicketCard, WelcomeBanner
        └── pages/
            ├── PortalDashboard.jsx      # Citizen dashboard
            ├── PropertyRecords.jsx      # Searchable/filterable parcel list
            ├── PropertyPassport.jsx     # Unit "e-stamp deed" + interactive views
            ├── UnifiedPropertyCard.jsx  # Parcel-level record card
            ├── ComplaintForm.jsx        # Dispute / issue reporting
            ├── Profile.jsx              # Profile & settings (masked Aadhaar etc.)
            └── Building3DView.jsx       # Single-building 3D scene
```

---

## 5. Demo Dataset

- **Source:** OpenStreetMap via Overpass API (`way["building"]` + `relation["building"]`, `out tags geom`), bbox ≈ `13.028–13.052 N, 80.215–80.248 E` (T. Nagar / Mambalam, Chennai).
- **Build:** `node scripts/convert_chennai.cjs` converts the raw dump into `chennai_buildings.json`, capped at **6,000 buildings** (OSM-tagged buildings kept first).
- **Storey counts:** real `building:levels` tag when present (blue on the map); otherwise a **deterministic heuristic per building type** (apartments 3–11, houses 1–4, retail/commercial 2–9, hotels 3–12, …) derived from a stable hash of the OSM id, so re-runs agree (orange on the map).
- **Immutable baked city + mutable user layer:** the dataset never changes; user edits/deletions/generated units live in `localStorage` (`avani-demo-mutations`, `avani-demo-units`) and replay on load. Clearing site storage restores the baked city.

---

## 6. Vertical Geometry Model (core logic)

`src/verticalGeometry.js` — the single source of truth for floor→z mapping:

- **`unitZRange(unit, fallbackFloorHeight = 3)`**
  - Explicit surveyed bounds (`z_min` / `z_max`) take precedence when both are present; they must be finite numbers with `z_max > z_min` or an error is thrown.
  - Otherwise, derived from `floor_index` (default 1) and `floor_height_m` (default 3 m):
    - Floor `n ≥ 1`: `zMin = (n−1)·h`, `zMax = n·h` → **floor 1 starts at ground level**.
    - Basement `n ≤ −1`: `zMin = n·h`, `zMax = (n+1)·h` → **basement −1 ends at ground level** (renders below the map plane).
  - Rejects `floor_index = 0`, non-integer floors, and non-positive heights.
- **`unitRenderRange(unit, floorGap, fallback)`** — adds a presentation-only "explosion" offset for selected buildings; offsets never enter validation.
- **Volumetric overlap detection** (`api.js` → `detectVolumetricOverlaps`): touching floor boundaries do **not** count as overlaps; overlapping unit pairs are reported. Unit correction workflow (`proposeUnitCorrection`, `confirmUnitCorrection`, `rejectUnitCorrection`, `updateUnit`, `getPendingUnitEdits`) changes the overlap result and persists to localStorage.

All of this is covered by `scripts/vertical_geometry.test.mjs` (run with `npm test`).

---

## 7. Routes & Functionalities

| URL | View | What it does |
|---|---|---|
| `/` | **Landing** | Hero globe (d3-geo + topojson world-atlas), project pitch, role selection; redirects to `/dashboard` if logged in |
| `/login?role=citizen\|surveyor\|registrar` | **Login** | Demo-only: any prefilled credentials pass; creates a session in `sessionStorage` (`avani-session`) |
| `/dashboard` | **3D city map** | MapLibre view of ~6,000 Chennai buildings; per-storey extrusion slices (alternating light/dark blue banding, ground→roof gradient), grey basement slices below the map plane, ground cast-shadows, click-to-select with floor-gap explosion, status colours (measured / estimated / edited), dawn/noon/dusk/night lighting presets, search, legend |
| `/ulpin` | **ULPIN units tree** | Pick a building → generate **2×2 units per floor** client-side; per-unit ULPINs (`base-Fn-Un`), owners, areas; Three.js-based per-unit inspection; lazy-loaded inside an ErrorBoundary |
| `/lidar` | **LiDAR footprint extraction** | Surveyor/Registrar only (`canEdit` gate); footprint extraction workflow over the map |
| `/pointcloud` | **Point-cloud viewer** | Three.js PLY viewer over `public/samples/sample_lidar.ply` |
| `/oblique` | **Oblique imagery manager** | Oblique aerial imagery view/management |
| `/portal/dashboard` | **Citizen dashboard** | Welcome banner, stat cards (owned units, verified vs under-review, open complaints), progress ring, recent activity log, quick links to owned units |
| `/portal/records` | **Property records** | Live search (name / base ULPIN / address) + filter chips (All / Verified / Under Review / My Parcel); per-building derived status (all units verified → verified) |
| `/portal/passport/:id` | **Property passport** | Two view modes: **Deed** (formal government e-stamp look: Indian emblem, QR block, ULPIN copy-to-clipboard, print) and interactive dashboard; tabs: specs, encumbrance, ownership ledger |
| `/portal/card/:id` | **Unified property card** | Parcel-level ticket card: all units, aggregate verification badge (`verified` / `partial`), map inset, detail grid |
| `/portal/report/:unitId` | **Complaint form** | Issue types (Boundary mismatch, Area mismatch, Wrong floor, Ownership mismatch) + description; validation; success screen with tracking; stored via `addComplaint` |
| `/portal/profile` | **Profile & settings** | Avatar, citizen ID, masked Aadhaar / linked identity, language / notifications / privacy / help entries, logout |

Heavy libraries (MapLibre ≈800 KB, Three + drei ≈1 MB) are **lazy-loaded** only on the routes that need them.

---

## 8. Roles & Access (demo-grade)

| Role | Demo user | Capabilities |
|---|---|---|
| **Citizen** | `citizen1` / "Citizen 1" (ramesh) | Read-only parcel/unit data, masked owner names, 3D building view, submit disputes/complaints, view ownership history |
| **Surveyor** | `surveyor1` / "Surveyor 1" (priya) | Upload floor plans, trigger segmentation, generate ULPIN units, edit/delete buildings, trigger validation, LiDAR edit access |
| **Registrar** | `registrar1` / "Registrar 1" (arun) | Full read access, dispute queue review/approve, ledger writes, unit-correction approval, LiDAR edit access |

Role switching is a one-click UI toggle in the Topbar (`switchRole` in `App.jsx`) — no real auth, per PRD non-goals.

---

## 9. Mock Data & Portal Domain Model

`src/mockData.js` mirrors the API shape the production backend would return:

- **`buildings`** — 5 demo buildings (T. Nagar / Anna Nagar / Teynampet, Chennai), each with: `id, name, baseUlpin` (e.g. `TN-07-4821-9034-7756`), `address, floors, basements, height, extraction method` (LiDAR + AI segmentation / drone photogrammetry / assumed from footprint).
- **`units`** — 14 units, each with `ulpin` (derived `base-F{floor}-U{n}`), `floor`, `unitLabel`, `owner`, `area` (m²), `rightsType` (Owned / Leased), `status` (verified / review), `lastUpdated`.
- **`complaints` / `addComplaint`**, **`activityLog`**, **`currentUser`** (owned unit ids, masked Aadhaar, citizen id).

Example unit ULPIN: `TN-07-4821-9034-7756-F3-U302` → Flat 302, 84.2 m², Owned, verified.

---

## 10. Scripts & Tests

| Command (from `3d_map/frontend`) | What it runs |
|---|---|
| `npm run dev` | Vite dev server → http://localhost:5173 |
| `npm run build` | Production build → static `dist/` (hostable anywhere) |
| `npm run preview` | Serve the built `dist/` |
| `npm test` | `node --test ../../scripts/vertical_geometry.test.mjs` |
| `npm run check` | `node ../../scripts/check_jsx.cjs` (JSX sanity check) |
| `node scripts/convert_chennai.cjs` (repo root) | Rebuild `chennai_buildings.json` from a fresh Overpass dump (`chennai_raw.json`) |

**Test coverage** (`vertical_geometry.test.mjs` — 6 tests, all passing): floor stacking (floor 1 at ground, floor 2 above, basements below), explicit corrected bounds and render offsets, rejection of invalid/incomplete vertical ranges, volumetric overlap semantics (touching ≠ overlapping; corrections change overlap volume), MapLibre slices using corrected elevations with negative basement bases, and correction decisions validating overlaps / rejecting stale or repeated decisions.

---

## 11. How To Run

```powershell
cd 3d_map\frontend
npm install        # once
npm run dev        # http://localhost:5173
```

One terminal, no database, fully offline-capable for demo day. `npm run build` produces a static bundle you can host anywhere.

**Demo login:** any prefilled credentials pass (ramesh / priya / arun), or use `/login?role=citizen|surveyor|registrar` to jump straight in.

**Reset the demo:** clear the site's localStorage to restore the baked Chennai city.

---

## 12. Relationship To The PRD (`3D_ULPIN_PRD.md`)

The PRD defines the full system; this repo implements the visual + geometry layer of it.

| PRD requirement group | Status in this demo |
|---|---|
| FR1–FR4 Parcel & ULPIN management (14-digit base ULPIN, derived `-F{n}-U{n}` unit IDs, negative basement floors, rights types) | ✅ Implemented (mock data + `verticalGeometry.js`) |
| FR5–FR8 3D visualization (extrusion per storey, clickable units, basements below ground in distinct shading) | ✅ Implemented (MapLibre slices + Three.js views) |
| FR9–FR12 OpenCV floor segmentation | ❌ Backend removed — concept shown via mock "extraction" metadata & `/lidar` view |
| FR13–FR16 Topology validation | ✅ Core logic implemented client-side (`detectVolumetricOverlaps`) + tested |
| FR17–FR19 Hash-chained ownership ledger | ⚠️ UI surfaces exist (passport ledger tab); chain logic per PRD was backend-side |
| FR20–FR23 Dispute management | ✅ Citizen complaint flow + statuses implemented (mock persistence) |
| FR24–FR26 Role-based access | ✅ Demo-grade role switching (no real auth) |
| NGDRS integration | Mock payload concept only |

**Deliberately out of scope (PRD §2.2):** real LiDAR/drone processing, trained ML models, real blockchain (hash-chained ledger instead), real NGDRS integration, real auth, mobile app, GNSS hardware.

---

## 13. Known Limitations

- **No backend** — everything is client-side; localStorage is the only persistence and is per-browser.
- **Storey counts partly estimated** — buildings without OSM `building:levels` use a deterministic heuristic (colour-coded on the map so it stays honest).
- **Max 10 storeys rendered per building** in the slice logic (`floors.js` clamps `stories` to 1–10); dataset capped at 6,000 buildings for GPU comfort.
- **`chennai_raw.json` (7.3 MB) is gitignored** — regenerate via Overpass + `convert_chennai.cjs` if lost.
- Unit ULPINs generated in `/ulpin` and portal records come from **separate mock sources** (client-side generator vs `mockData.js`).

---

## 14. Key Documents

| File | Contents |
|---|---|
| `3D_ULPIN_PRD.md` | Full PRD: problem, goals/non-goals, roles, user journeys, FRs 1–26, NFRs, architecture, data model, upgrade paths (LiDAR/CV, blockchain scoping), judge demo script, build priorities, rejected-approaches log |
| `userstories.md` | User stories per role mapped to functional requirements |
| `run.md` | Original quick-start note for the frontend-only build |
| `PROJECT_SUMMARY.md` | This document |