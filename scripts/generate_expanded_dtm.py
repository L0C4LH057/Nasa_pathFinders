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

    cx, cy = 77.44, 18.44
    km_x = (lon_grid - cx) * 56.3
    km_y = (lat_grid - cy) * 59.3

    # Base elevation: Jezero Crater floor (-2550m) rising to the rim (-2200m)
    dist = np.sqrt(km_x**2 + km_y**2)
    # Basin depression
    elev = -2580.0 + 380.0 / (1.0 + np.exp(-(dist - 6.5) / 1.8))

    # Delta fan elevation in the west
    delta_dist = np.sqrt((km_x - (-3.5))**2 + (km_y - 1.0)**2)
    elev += 90.0 * np.exp(-(delta_dist / 2.5)**2) * (km_x < 0.0)

    # South-central crater
    c1_dist = np.sqrt((km_x - 1.0)**2 + (km_y + 4.5)**2)
    elev += -220.0 * np.exp(-(c1_dist / 2.0)**2) + 75.0 * np.exp(-((c1_dist - 2.8) / 0.6)**2)

    # Secondary craters
    for px, py, r, d, rim in [
        (-4.0, 3.5, 1.8, 120.0, 40.0),
        (3.5, 4.0, 2.0, 140.0, 45.0),
        (-2.0, -3.0, 1.2, 80.0, 30.0),
        (4.5, -2.0, 1.5, 95.0, 35.0),
    ]:
        cd = np.sqrt((km_x - px)**2 + (km_y - py)**2)
        elev += -d * np.exp(-(cd / (r * 0.8))**2) + rim * np.exp(-((cd - r) / (r * 0.25))**2)

    # Add gentle micro-relief
    np.random.seed(999)
    noise = np.random.randn(rows, cols) * 2.5
    elev += noise

    # Hazard mask (1.0 = impassable/sand dune hazard, 0.0 = safe)
    # Steep sand dunes in Séítah corridor: around km_x = -0.5, km_y = -1.2
    hazard_mask = np.zeros((rows, cols), dtype=np.float32)
    dune_dist = np.sqrt(((km_x + 0.2) / 1.2)**2 + ((km_y + 1.0) / 0.8)**2)
    hazard_mask[dune_dist < 1.0] = 1.0

    # Uncertainty mask (0.0 to 1.0)
    uncertainty_mask = np.zeros((rows, cols), dtype=np.float32)
    outer_dist = dist / 9.0
    uncertainty_mask = np.clip((outer_dist - 0.7) / 0.3, 0.0, 0.9).astype(np.float32)

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
