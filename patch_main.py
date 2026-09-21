import re

with open('3d_map/backend/app/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Update ulpin_units_generate loop
content = re.sub(
    r'for j, \(x0, y0, x1, y1\) in enumerate\(seg\["rects"\], start=1\):',
    r'for j, (x0, y0, x1, y1, conf) in enumerate(seg["rects"], start=1):',
    content
)

content = re.sub(
    r'"segmentation": seg\["source"\],',
    r'"segmentation": seg["source"],\n                "confidence": conf,\n                "evidence": seg["source"],',
    content
)

# Update ulpin_units_for_building loop
content = re.sub(
    r'for j, \(x0, y0, x1, y1\) in enumerate\(rects, start=1\):',
    r'for j, (x0, y0, x1, y1, conf) in enumerate(rects, start=1):',
    content
)

content = re.sub(
    r'"segmentation": "random",',
    r'"segmentation": "random",\n                "confidence": conf,\n                "evidence": "random mock",',
    content
)

# Append new routes before the Citizen portal section
routes = '''
@app.get("/lidar/units/pending")
def lidar_units_pending():
    from .postgis import get_pending_unit_edits
    return get_pending_unit_edits()

@app.post("/lidar/units/update")
def lidar_units_update(payload: dict = Body(...)):
    from .postgis import propose_unit_edit
    b_id = payload.get("building_id")
    ulp = payload.get("unit_ulpin")
    prop = payload.get("proposed_by")
    patch = payload.get("patch")
    edit_id = propose_unit_edit(b_id, ulp, prop, patch)
    return {"status": "pending", "id": edit_id}

@app.post("/lidar/units/confirm")
def lidar_units_confirm(payload: dict = Body(...)):
    from .postgis import confirm_unit_edit
    edit_id = payload.get("id")
    status = payload.get("status")
    res = confirm_unit_edit(edit_id, status)
    if not res:
        raise HTTPException(404, "edit not found")
    return {"status": status, "building_id": res[0], "unit_ulpin": res[1]}

'''

content = content.replace('# ---------------- Citizen portal (mobile app) ----------------', routes + '\n# ---------------- Citizen portal (mobile app) ----------------')

with open('3d_map/backend/app/main.py', 'w', encoding='utf-8') as f:
    f.write(content)
