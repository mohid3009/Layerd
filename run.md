# Layerd — Demo Build (frontend only, no backend)

The FastAPI/PostGIS backend, Electron desktop shell and LiDAR pipeline were removed
for this demo. Everything now runs from the frontend alone — no Python, no Node
server beyond Vite, no database.

## What you get

- **Demo city**: ~6000 real building footprints from **Chennai · T. Nagar /
  Mambalam** (OpenStreetMap via Overpass), baked into
  `3d_map/frontend/src/data/chennai_buildings.json`. Buildings without OSM level
  tags get plausible storey counts derived from their building type — orange =
  estimated, blue = tagged in OSM.
- **3D map** with per-storey extrusions: every building is split into one
  coloured slice per floor (alternating light/dark banding so each storey reads
  clearly), plus ground cast-shadows.
- **ULPIN units view**: pick a building, generate 2×2 units per floor — all
  computed client-side.
- **Login**: demo-only, any prefilled credentials pass (ramesh / priya / arun).
- Your edits, deletions and generated units persist to `localStorage`, so the
  demo stays interactive across refreshes. Clear the site's storage to restore
  the baked city.

## Run it

```powershell
cd 3d_map\frontend
npm install        # once
npm run dev        # http://localhost:5173
```

That's it — one terminal, no database. `npm run build` produces a static
`dist/` you can host anywhere.

## Routes

| URL | Description |
|-----|-------------|
| `/` | Landing page (redirects to `/dashboard` if logged in) |
| `/login?role=citizen|surveyor|registrar` | Login for the chosen role (demo — always succeeds) |
| `/dashboard` | 3D city view of the Chennai demo dataset |
| `/ulpin` | 3D unit tree — floors, ULPINs, owners per building |

## Rebuilding the dataset (optional)

`convert_chennai.cjs` (repo root) converts a raw Overpass dump
(`chennai_raw.json`) into the baked JSON. To grab fresh data for another city,
query `way["building"]` + `relation["building"]` with `out tags geom` from
https://overpass-api.de and run `node convert_chennai.cjs`.
