import json

with open('3d_map/backend/app/postgis.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Add save_floor_units
new_func = '''
def save_floor_units(building_id, floor_index, units):
    """Replace the units of a single floor in a building; returns the saved count."""
    ensure_init()
    with _conn() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM ulpin_units WHERE building_id = %s AND floor_index = %s", (building_id, floor_index))
            if units:
                rows = [
                    (
                        u["unit_ulpin"], building_id, u["base_ulpin"], u["floor_index"],
                        u["unit_no"], json.dumps(u["polygon"]), u.get("area_sqm"),
                        u.get("rights_type"), u.get("owner_id"), u.get("owner_name"),
                        u.get("segmentation"), u.get("confidence"), u.get("evidence"), u.get("validation_status", "valid"),
                    )
                    for u in units
                ]
                import psycopg2.extras
                psycopg2.extras.execute_batch(
                    cur,
                    """INSERT INTO ulpin_units (unit_ulpin, building_id, base_ulpin, floor_index,
                                               unit_no, polygon, area_sqm, rights_type, owner_id,
                                               owner_name, segmentation, confidence, evidence, validation_status)
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                       ON CONFLICT (unit_ulpin) DO UPDATE SET
                         polygon = EXCLUDED.polygon, area_sqm = EXCLUDED.area_sqm,
                         rights_type = EXCLUDED.rights_type, owner_id = EXCLUDED.owner_id,
                         owner_name = EXCLUDED.owner_name, segmentation = EXCLUDED.segmentation,
                         confidence = EXCLUDED.confidence, evidence = EXCLUDED.evidence,
                         validation_status = EXCLUDED.validation_status""",
                    rows,
                    page_size=500,
                )
                return len(rows)
            return 0
'''

if 'def save_floor_units' not in content:
    content += new_func

with open('3d_map/backend/app/postgis.py', 'w', encoding='utf-8') as f:
    f.write(content)
