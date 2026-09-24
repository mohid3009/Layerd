"""
DigiPin — India Post's 10-character digital address code.

Implements the official DIGIPIN encoding: a 4x4 grid applied hierarchically
over India's bounding box (lat 2.5–38.5, lon 63.5–99.5) for 10 levels
(~3.8 m resolution). Display format groups the characters 3-3-4, e.g.
"39J-4LL-L8T4" for central Delhi.
"""

DIGIPIN_GRID = (
    ("F", "C", "9", "8"),
    ("J", "3", "2", "7"),
    ("K", "4", "5", "6"),
    ("L", "M", "P", "T"),
)

MIN_LAT, MAX_LAT = 2.5, 38.5
MIN_LON, MAX_LON = 63.5, 99.5


def digipin_encode(lat, lon):
    """Encode WGS84 lat/lon to a 10-char DIGIPIN (no hyphens)."""
    lat, lon = float(lat), float(lon)
    if not (MIN_LAT <= lat <= MAX_LAT and MIN_LON <= lon <= MAX_LON):
        return None
    min_lat, max_lat, min_lon, max_lon = MIN_LAT, MAX_LAT, MIN_LON, MAX_LON
    chars = []
    for _ in range(10):
        lat_div = (max_lat - min_lat) / 4
        lon_div = (max_lon - min_lon) / 4
        row = 3 - int((lat - min_lat) / lat_div)
        row = max(0, min(row, 3))
        col = int((lon - min_lon) / lon_div)
        col = max(0, min(col, 3))
        chars.append(DIGIPIN_GRID[row][col])
        # narrow to the selected cell (row 0 = northern quarter)
        min_lat, max_lat = min_lat + lat_div * (3 - row), min_lat + lat_div * (4 - row)
        min_lon, max_lon = min_lon + lon_div * col, min_lon + lon_div * (col + 1)
    return "".join(chars)


def digipin_format(pin):
    """Official display grouping: XXX-XXX-XXXX."""
    if not pin or len(pin) != 10:
        return pin
    return f"{pin[0:3]}-{pin[3:6]}-{pin[6:10]}"
