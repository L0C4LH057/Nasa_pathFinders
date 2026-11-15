import json
import numpy as np

def generate_dtm():
    rows = 240
    cols = 240
    min_lat = 18.36
    max_lat = 18.52
    min_lon = 77.34
    max_lon = 77.54

    lats = np.linspace(max_lat, min_lat, rows) # row 0 is max_lat (North)
    lons = np.linspace(min_lon, max_lon, cols)
    lon_grid, lat_grid = np.meshgrid(lons, lats)

    cx, cy = 77.445, 18.445
    km_x = (lon_grid - cx) * 56.3
    km_y = (lat_grid - cy) * 59.3

    # Base elevation: Jezero Crater floor (-2560m) rising to delta and rim
    dist = np.sqrt(km_x**2 + km_y**2)
    elev = -2580.0 + 360.0 / (1.0 + np.exp(-(dist - 7.5) / 1.8))

    # 1. Prominent Southern Crater (forces route to curve around its north rim)
    # At km_x = 0.8, km_y = -3.2 (radius = 2.4 km, depth = 380m, rim = 120m)
    c1_dist = np.sqrt((km_x - 0.8)**2 + (km_y + 3.2)**2)
    c1_inner = c1_dist < 2.4
    c1_bowl = -380.0 + (380.0 + 120.0) * (c1_dist / 2.4)**2.5
    c1_rim = 120.0 * np.exp(-((np.maximum(0.0, c1_dist - 2.4)) / 0.8)**1.6)
    elev += np.where(c1_inner, c1_bowl, c1_rim)

    # 2. Central crater obstacle
    c2_dist = np.sqrt((km_x - 1.2)**2 + (km_y - 1.0)**2)
    c2_inner = c2_dist < 1.4
    c2_bowl = -220.0 + (220.0 + 80.0) * (c2_dist / 1.4)**2.4
    c2_rim = 80.0 * np.exp(-((np.maximum(0.0, c2_dist - 1.4)) / 0.6)**1.6)
    elev += np.where(c2_inner, c2_bowl, c2_rim)

    # 3. Western Delta fan elevation in the west
    delta_dist = np.sqrt((km_x - (-3.2))**2 + (km_y - 1.2)**2)
    elev += 110.0 * np.exp(-(delta_dist / 2.8)**2) * (km_x < 0.2)

    # 4. Secondary craters
    for px, py, r, d, rim in [
        (-3.8, 3.2, 1.6, 160.0, 50.0),
        (3.6, 3.5, 1.8, 180.0, 55.0),
        (-2.2, -2.5, 1.1, 110.0, 35.0),
        (4.2, -1.8, 1.4, 130.0, 40.0),
    ]:
        cd = np.sqrt((km_x - px)**2 + (km_y - py)**2)
        elev += np.where(cd < r, -d + (d + rim) * (cd / r)**2.2, rim * np.exp(-((np.maximum(0.0, cd - r)) / (r * 0.4))**1.6))

    # Add gentle micro-relief
    np.random.seed(999)
    noise = np.random.randn(rows, cols) * 2.0
    elev += noise

    # Hazard mask (1.0 = impassable/sand dune hazard, 0.0 = safe)
    # Séítah active dune corridor: around km_x = -0.4 to 0.6, km_y = -1.8 to -0.2
    hazard_mask = np.zeros((rows, cols), dtype=np.float32)
    dune_dist = np.sqrt(((km_x - 0.2) / 1.4)**2 + ((km_y + 1.0) / 1.0)**2)
    hazard_mask[dune_dist < 1.0] = 0.95

    # Crater wall steep slopes act as hard hazards
    hazard_mask[c1_inner & (c1_dist > 1.8)] = 1.0
    hazard_mask[c2_inner & (c2_dist > 1.0)] = 1.0

    # Uncertainty mask
    uncertainty_mask = np.zeros((rows, cols), dtype=np.float32)
    outer_dist = dist / 9.5
    uncertainty_mask = np.clip((outer_dist - 0.7) / 0.3, 0.0, 0.85).astype(np.float32)

    dtm_data = {
        "rows": rows,
        "cols": cols,
        "bounds": {
            "min_lat": min_lat,
            "max_lat": max_lat,
            "min_lon": min_lon,
            "max_lon": max_lon
        },
        "elevations": [round(float(v), 2) for v in elev.flatten()],
        "hazard_mask": [round(float(v), 2) for v in hazard_mask.flatten()],
        "uncertainty_mask": [round(float(v), 2) for v in uncertainty_mask.flatten()]
    }

    out_path = "mars-server/data/jezero_dtm.json"
    with open(out_path, "w") as f:
        json.dump(dtm_data, f)
    print(f"Generated {out_path} ({rows}x{cols}), bounds: [{min_lat}, {max_lat}, {min_lon}, {max_lon}]")

if __name__ == "__main__":
    generate_dtm()
