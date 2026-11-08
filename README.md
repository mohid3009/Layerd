# Layerd

**One parcel. Every dimension.** A 3D cadastral system that gives unique IDs to land parcels *and* to the vertical units above and below them: flats, basements, and shared space. Built for **SIH 2026 · SIH26011** (3D ULPIN variant, Dept. of Land Resources).

India's ULPIN identifies a 2D plot, so a 20-storey tower and an empty plot look the same at the ID level. Layerd measures real buildings from LiDAR, extrudes them in 3D, and derives a ULPIN for every floor and unit, with ownership and role-based editing on top.

![Landing page](docs/screenshots/landing.png)

## Screenshots

| Dashboard: every saved building, pannable worldwide | LiDAR scan: footprints extruded by measured height |
|---|---|
| ![Dashboard](docs/screenshots/dashboard.png) | ![LiDAR scan](docs/screenshots/lidar-result.png) |

| 3D ULPIN units: per-floor unit tree | Login: citizen / surveyor / registrar |
|---|---|
| ![ULPIN units](docs/screenshots/ulpin-units.png) | ![Login](docs/screenshots/login.png) |

## Features

- **LiDAR → 3D buildings.** Upload a `.laz` cloud (CRS read from the header), then supply a bounding box (footprints from OSM) or your own footprint GeoJSON. Roof and ground heights are measured per footprint, giving `height_m` and `stories`. Footprints with no points are assumed 1 storey and flagged.
- **PostGIS persistence.** Every extraction is saved as its own scan session; the dashboard shows all sessions, grouped by country → region → scan.
- **Manual editing.** Set floors or height, add or remove basements, drag footprint corners, or free-draw a new outline. Every change is logged in a per-building audit trail (who, what, when).
- **Surveyor → registrar confirmation.** Surveyor edits are `pending` until a registrar confirms them. Citizens are read-only.
- **3D ULPIN units.** A deterministic base ULPIN per building, with unit IDs of the form `{base}-F{floor}-U{unit}` (basements are negative floors). Floor plans are segmented with **YOLOv11-seg**, falling back to a generated plan. Units on a floor are checked for overlaps and flagged `conflict`.
- **Desktop app.** An Electron shell starts the backend and the UI together.

![Floor plan conflict example](docs/screenshots/floorplan-conflict.png)

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, MapLibre GL, three.js / react-three-fiber, Tailwind 4, Framer Motion |
| Backend | FastAPI, Shapely, pyproj, laspy (lazrs), psycopg2 |
| Data | PostgreSQL 16 + PostGIS |
| CV | Ultralytics YOLOv11-seg (`yolo11n-seg.pt`) |
| Desktop | Electron |

## Quick start

Requires Python ≥ 3.10, Node ≥ 18, and PostgreSQL + PostGIS. PostGIS is optional: without it, extraction still works but nothing is saved.

```bash
# 1. database (one-off). Default DSN: postgresql://postgres:postgres@localhost:5432/layerd
python setup_db.py          # override with POSTGRES_DSN

# 2. backend
cd 3d_map/backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000     # docs at /docs

# 3. frontend (new terminal)
cd 3d_map/frontend
npm install
npm run dev                                   # http://localhost:5173
```

Desktop: `cd 3d_map/desktop && npm install && npm start` (run `npm run build` in `frontend` first).

YOLO segmentation needs `pip install ultralytics`. Without it, ULPIN unit generation uses the random-plan fallback.

### Demo accounts

| Role | Username | Password | Can |
|---|---|---|---|
| Citizen | `ramesh` | `citizen123` | view |
| Surveyor | `priya` | `survey123` | edit (pending confirmation) |
| Registrar | `arun` | `register123` | edit and confirm |

These are demo credentials only; there is no real authentication.

### Try it with the bundled data

Log in, open **LiDAR scan**, upload `lidar/points.laz`, choose *use footprint GeoJSON*, upload `3d_map/backend/test_footprints.geojson`, then click **extract buildings**. Check the pipeline with `python test_lidar_buildings.py`.

## Routes

| URL | Purpose |
|---|---|
| `/` | Landing page |
| `/login?role=citizen\|surveyor\|registrar` | Sign in |
| `/dashboard` | All saved buildings (protected) |
| `/lidar` | Extraction and editing (protected) |
| `/ulpin` | 3D ULPIN unit explorer (protected) |

## Repo layout

```
3d_map/backend/    FastAPI app: LiDAR pipeline, PostGIS, ULPIN, segmentation
3d_map/frontend/   React + MapLibre + three.js UI
3d_map/desktop/    Electron shell
lidar/             Standalone LiDAR script + sample .laz clouds
3D_ULPIN_PRD.md    Product requirements
userstories.md     User stories per role
run.md             Detailed run and feature notes
```

## Docs

[PRD](3D_ULPIN_PRD.md) · [User stories](userstories.md) · [Run guide](run.md)
