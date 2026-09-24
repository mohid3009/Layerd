import re

with open('3d_map/backend/app/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

new_endpoint = '''
@app.post("/lidar/units/generate_floor")
async def ulpin_units_generate_floor(
    building_id: str = Form(...),
    floor_index: int = Form(...),
    plan: UploadFile | None = File(None),
):
    import math
    from itertools import combinations
    from shapely.geometry import Polygon as ShPolygon

    from .postgis import fetch_buildings, save_floor_units, fetch_units
    from .segmentation import segment_floorplan
    from .ulpin import base_ulpin, owner_for, unit_ulpin

    fc = fetch_buildings()
    feat = next(
        (f for f in fc["features"] if f["properties"].get("building_id") == building_id),
        None,
    )
    if feat is None:
        raise HTTPException(404, f"building {building_id} not found")

    geom = feat["geometry"]
    ring = geom["coordinates"][0] if geom["type"] == "Polygon" else geom["coordinates"][0][0]
    lons = [c[0] for c in ring]
    lats = [c[1] for c in ring]
    min_lon, max_lon, min_lat, max_lat = min(lons), max(lons), min(lats), max(lats)
    base = base_ulpin(building_id)

    image_bytes = await plan.read() if plan else None
    seg = segment_floorplan(image_bytes)

    lat_mid = (min_lat + max_lat) / 2
    width_m = max(1.0, (max_lon - min_lon) * 111320 * math.cos(math.radians(lat_mid)))
    depth_m = max(1.0, (max_lat - min_lat) * 110540)

    floor_units = []
    for j, (x0, y0, x1, y1, conf) in enumerate(seg["rects"], start=1):
        ulp = unit_ulpin(base, floor_index, j)
        owner = owner_for(ulp, floor_index)
        poly = [[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]]
        poly_m = [[x * width_m, y * depth_m] for x, y in poly[:-1]]
        area = abs(ShPolygon(poly_m).area)
        floor_units.append({
            "unit_ulpin": ulp,
            "base_ulpin": base,
            "floor_index": floor_index,
            "unit_no": j,
            "polygon": poly,
            "area_sqm": round(area, 2),
            "rights_type": owner["rights_type"],
            "owner_id": owner["owner_id"],
            "owner_name": owner["owner_name"],
            "segmentation": seg["source"],
            "confidence": conf,
            "evidence": seg["source"],
            "validation_status": "valid",
        })
    # topology check
    for a, b in combinations(floor_units, 2):
        pa = ShPolygon(a["polygon"][:-1])
        pb = ShPolygon(b["polygon"][:-1])
        if pa.intersection(pb).area > 1e-9:
            a["validation_status"] = "conflict"
            b["validation_status"] = "conflict"

    saved = save_floor_units(building_id, floor_index, floor_units)
    
    # Return all units for the building so the UI updates
    all_units = fetch_units(building_id)
    return {
        "building_id": building_id,
        "base_ulpin": base,
        "segmentation": seg["source"],
        "unit_count": len(all_units),
        "saved": saved,
        "units": all_units,
    }
'''

if 'def ulpin_units_generate_floor' not in content:
    # insert before Citizen portal
    content = content.replace('# ---------------- Citizen portal (mobile app) ----------------', new_endpoint + '\n# ---------------- Citizen portal (mobile app) ----------------')

with open('3d_map/backend/app/main.py', 'w', encoding='utf-8') as f:
    f.write(content)
