# 3D ULPIN Generation & Vertical Property Mapping System

**Smart India Hackathon (SIH) 2026 — Problem Statement SIH26095**
*Ministry of Rural Development / Department of Land Resources (DoLR)*

---

## 📖 The Problem

Currently, India’s **ULPIN (Unique Land Parcel Identification Number)** system serves as a 14-digit alphanumeric Aadhaar for land. It is a strictly **2D surface-parcel ID**. 

While this works for flat agricultural plots or single-story homes, it fails to capture the complexity of modern urban landscapes. A 20-storey apartment complex, a multi-level basement parking garage, and a subway tunnel all occupy the same 2D footprint, making them identical under the current ULPIN system.

There is no standardized, automated way to:
1. Generate a unique spatial identity for a **vertical/volumetric unit** (a specific flat, basement slot, or utility corridor segment).
2. **Validate** that these volumetric units don't structurally conflict or overlap with each other (topology validation).
3. Tie these volumetric units back to a legally recognized base parcel (ensuring **backward compatibility** with the existing ULPIN framework).
4. Manage **ownership records, property passports, and disputes** for these specific 3D units.

**Why it matters:** Ownership ambiguity for high-rise apartment units causes legal disputes and fraudulent property sales. Utility departments lack ways to record underground infrastructure against surface parcels, and urban redevelopment approvals are drastically slowed by missing vertical records.

---

## 🚀 Our Solution

The **National Urban 3D Cadastre** (Avani) extends the existing ULPIN framework into the vertical and volumetric dimension. It introduces a derived ID format for each unit: `{base_ULPIN}-F{floor}-U{unit}`. 

### Key Features of this Demo:
- **Interactive 3D City Visualization:** Explore a real city segment (Chennai · T. Nagar) mapped with 3D extrusions. Features one coloured slice per storey, and underground basements rendered accurately below the ground plane.
- **3D ULPIN Generation:** Automatically generates vertically-aware ULPINs for every volumetric unit.
- **Role-Based Portals:**
  - **Citizen Dashboard:** View 3D property passports, download Government E-Stamp deeds, and report spatial disputes.
  - **Surveyor/Registrar (Mocked):** Validate boundaries and manage unit overlaps.
- **Vertical-Geometry Validation:** Computes accurate z-ranges and volumetric overlaps to prevent illegal or conflicting registrations.
- **Digital Property Passports:** A cryptographic, shareable record containing the ownership metadata and exact 3D spatial envelope for a unit.

---

## 🛠 Tech Stack (Demo Build)

This repository contains the **frontend-only interactive prototype** designed for the SIH presentation. To ensure a fast, robust demo without complex backend setup, all logic runs client-side with state persistence via `localStorage`.

- **Framework:** React 18 + Vite 5 (Fast SPA with lazy loading)
- **Map Engine (2D/3D):** MapLibre GL (`maplibre-gl`)
- **Volumetric Rendering:** Three.js + React Three Fiber (`@react-three/fiber`, `@react-three/drei`)
- **Styling:** Tailwind CSS 4 + Framer Motion
- **Data Source:** OpenStreetMap footprints parsed via Overpass API (baked into JSON)
- **Routing:** React Router v6

*(Note: The full production architecture involving FastAPI, PostGIS, LiDAR segmentation pipelines, and NGDRS handoff is documented in the project's PRD but excluded from this lightweight demo build).*

---

## 📂 Repository Structure

- `3D_ULPIN_PRD.md`: Full Product Requirements Document detailing the vision, data models, and backend architecture.
- `userstories.md`: Role-by-role user flows mapped to system requirements.
- `run.md`: Setup instructions for this frontend demo.
- `3d_map/frontend/src/`: Core React application logic.
  - `/components`: 3D Viewers, UI elements, and Dashboards.
  - `/pages`: Core role routes (Property Passport, Dashboard, Profile, etc).
  - `api.js`: Client-side logic for overlap detection and data mutation.
  - `mockData.js`: Pre-populated datasets for buildings, users, and disputes.

---

## 🚦 Getting Started

To run the interactive demo locally:

1. **Navigate to the frontend directory:**
   ```bash
   cd 3d_map/frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. Open `http://localhost:5173` in your browser. You can log in using the mock citizen or official profiles outlined in the app's login page.

---

*Built for Smart India Hackathon 2026.*
