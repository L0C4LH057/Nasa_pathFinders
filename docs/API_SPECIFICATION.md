# MARS PATHFINDER — API Contract & Microservice Interface Specification

**Document Identifier:** MARS-PF-2026-API-001  
**Version:** 1.0.0  
**Service Engine:** Rust `Axum` 0.7 Microservice (`mars-server`)  
**Network Binding:** Strictly Loopback `127.0.0.1:8081`  
**Frontend Gateway:** Vite 6.4 Reverse Proxy at `/api/mars/*`  
**Document Status:** Approved Interface Baseline  

---

## 1. Gateway & Proxy Configuration

To prevent Cross-Origin Resource Sharing (CORS) complexity and ensure seamless client communication, the Vite development and standalone servers proxy all `/api/mars/*` calls directly to the local Rust microservice:

```javascript
// server/standalone/vite.config.js
export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api/mars': {
        target: 'http://127.0.0.1:8081',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/mars/, ''),
      },
    },
  },
});
```

---

## 2. Global Error Handling Standard (RFC 7807)

All error responses return the standard `application/problem+json` format:

```json
{
  "type": "https://mars-pathfinder.local/errors/out-of-bounds",
  "title": "Coordinate Out of Bounds",
  "status": 400,
  "detail": "Requested start coordinate [19.1200, 77.4508] lies outside the Jezero pilot DTM grid [18.4100, 18.4900].",
  "instance": "/api/mars/route",
  "invalid_params": [
    {
      "name": "start[0]",
      "reason": "Latitude 19.1200 exceeds maximum pilot boundary 18.4900"
    }
  ]
}
```

---

## 3. Endpoints Specification

### 3.1 `GET /api/mars/grid-summary`
Returns the spatial extent, cell resolution, and elevation extrema of the loaded in-memory Jezero DTM.

* **Method:** `GET`
* **Route:** `/api/mars/grid-summary`
* **Query Parameters:** None
* **Headers:** `Accept: application/json`

#### Response (`200 OK`):
```json
{
  "rows": 200,
  "cols": 200,
  "bounds": {
    "min_lat": 18.4100,
    "max_lat": 18.4900,
    "min_lon": 77.4000,
    "max_lon": 77.5000
  },
  "cell_size_x_m": 24.98,
  "cell_size_y_m": 23.71,
  "min_elevation_m": -2568.4,
  "max_elevation_m": -2412.1,
  "geodetic_datum": "IAU_2015:49900"
}
```

---

### 3.2 `GET /api/mars/features`
Returns a valid GeoJSON `FeatureCollection` containing all verified Jezero Crater scientific waypoints and mapped hazard zones.

* **Method:** `GET`
* **Route:** `/api/mars/features`
* **Headers:** `Accept: application/geo+json, application/json`

#### Response (`200 OK`):
```json
{
  "type": "FeatureCollection",
  "crs": {
    "type": "name",
    "properties": {
      "name": "urn:ogc:def:crs:IAU:2015:49900"
    }
  },
  "features": [
    {
      "type": "Feature",
      "id": "butler-landing",
      "geometry": {
        "type": "Point",
        "coordinates": [77.4508, 18.4447, -2564.2]
      },
      "properties": {
        "name": "Octavia E. Butler Landing Site",
        "category": "base_camp",
        "mission": "NASA Mars 2020 Perseverance",
        "instrument": "Landing Radar / Navcam",
        "sol": 1,
        "elevation_m": -2564.2,
        "significance": "Touchdown site of the Mars 2020 Perseverance rover on February 18, 2021.",
        "pds_url": "https://pds-geosciences.wustl.edu/missions/m2020/",
        "icon": "rover-base"
      }
    },
    {
      "type": "Feature",
      "id": "neretva-carbonates",
      "geometry": {
        "type": "Point",
        "coordinates": [77.4165, 18.4685, -2415.8]
      },
      "properties": {
        "name": "Neretva Margin Carbonate Unit",
        "category": "science_target",
        "mission": "MRO CRISM / Perseverance",
        "instrument": "CRISM Targeted Spectrometer",
        "sol": 540,
        "elevation_m": -2415.8,
        "significance": "Hydrated magnesium carbonates deposited along the ancient paleolake shoreline.",
        "pds_url": "https://crism.jhuapl.edu/",
        "icon": "mineral-sample"
      }
    },
    {
      "type": "Feature",
      "id": "seitah-dune-hazard-01",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [77.4420, 18.4350],
            [77.4480, 18.4350],
            [77.4470, 18.4280],
            [77.4410, 18.4280],
            [77.4420, 18.4350]
          ]
        ]
      },
      "properties": {
        "name": "Séítah Sand Dune Ripple Hazard",
        "category": "hazard_exclusion",
        "hazard_type": "aeolian_entrapment",
        "severity": 1.0,
        "warning": "Unconsolidated fine sand ripples prone to rover wheel entrapment. Hard exclusion boundary."
      }
    }
  ]
}
```

---

### 3.3 `GET /api/mars/provenance`
Returns the structured Dataset Provenance Register conforming to Blueprint Section 4.

* **Method:** `GET`
* **Route:** `/api/mars/provenance`
* **Headers:** `Accept: application/json`

#### Response (`200 OK`):
```json
{
  "datasets": [
    {
      "id": "viking-mdim21",
      "title": "Viking Orbiter MDIM 2.1 Colorized Global Mosaic",
      "instrument": "Viking Orbiter Visual Imaging Subsystem (VIS)",
      "mission": "Viking 1 & 2 Orbiters (NASA)",
      "spatial_resolution": "232 m/px",
      "coverage": "Global Martian Coverage (±90° Lat, 0-360° Lon)",
      "crs": "IAU_2015:49900",
      "pds_product_id": "VO_MDIM_21_GLOBAL",
      "source_url": "https://trek.nasa.gov/mars/",
      "limitations": "Coarse spatial resolution; legacy 1970s orthorectification limits localized landing site hazard identification.",
      "uncertainty_handling": "Used solely as regional spatial orientation basemap; overridden by HiRISE and CTX in Jezero Crater."
    },
    {
      "id": "mro-hirise-jezero-dtm",
      "title": "MRO HiRISE Jezero Crater Western Delta DTM",
      "instrument": "High Resolution Imaging Science Experiment (HiRISE)",
      "mission": "Mars Reconnaissance Orbiter (NASA/JPL/Univ of Arizona)",
      "spatial_resolution": "1.0 m/px",
      "coverage": "Jezero Crater Western Fan & Deltaic Deposits",
      "crs": "IAU_2015:49900 (Transverse Mercator projection clamped to Aeroid)",
      "pds_product_id": "DTEEC_045994_1985_046060_1985_A01",
      "source_url": "https://www.uahirise.org/dtm/dtm.php?ID=ESP_045994_1985",
      "limitations": "Stereo photogrammetric noise on uniform low-contrast sand surfaces; shadowed steep delta scarp facets.",
      "uncertainty_handling": "Primary substrate for Horn's slope derivation; uncertainty mask U(v) = 0.0 inside footprint."
    }
  ]
}
```

---

### 3.4 `POST /api/mars/route`
Computes the optimal 3D terrain-aware pathfinding traversal between Start and Goal points for both Outbound and Return journeys, including $A^*$ vs. Dijkstra performance metrics and EVA life-support consumption.

* **Method:** `POST`
* **Route:** `/api/mars/route`
* **Headers:** `Content-Type: application/json`, `Accept: application/json`

#### Request Schema:
```json
{
  "start": [18.4447, 77.4508],
  "goal": [18.4685, 77.4165],
  "max_slope_deg": 18.0,
  "w_slope": 3.5,
  "w_hazard": 6.0,
  "w_uncertainty": 4.0,
  "walk_speed_kmh": 2.4,
  "o2_rate_lpm": 1.1,
  "battery_wh_per_hr": 130.0
}
```

#### Parameter Validation Matrix:

| Field | Type | Required | Range Constraints | Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `start` | `[f64, f64]` | Yes | $\text{Lat} \in [18.41, 18.49], \text{Lon} \in [77.40, 77.50]$ | — | `[latitude, longitude]` of origin |
| `goal` | `[f64, f64]` | Yes | $\text{Lat} \in [18.41, 18.49], \text{Lon} \in [77.40, 77.50]$ | — | `[latitude, longitude]` of destination |
| `max_slope_deg` | `f64` | No | $[1.0, 89.0]$ | `18.0` | Maximum passable slope angle |
| `w_slope` | `f64` | No | $[0.0, 100.0]$ | `3.5` | Penalty weight for terrain slope |
| `w_hazard` | `f64` | No | $[0.0, 100.0]$ | `6.0` | Penalty weight for mapped hazards |
| `w_uncertainty` | `f64` | No | $[0.0, 100.0]$ | `4.0` | Penalty weight for coarse data |
| `walk_speed_kmh` | `f64` | No | $[0.1, 10.0]$ | `2.4` | Astronaut surface walking speed |
| `o2_rate_lpm` | `f64` | No | $[0.1, 5.0]$ | `1.1` | Metabolic oxygen consumption rate |
| `battery_wh_per_hr` | `f64` | No | $[10.0, 500.0]$ | `130.0` | Spacesuit electrical power draw |

#### Response Schema (`200 OK`):
```json
{
  "outbound": {
    "reachable": true,
    "points": [
      {
        "lat": 18.4447,
        "lon": 77.4508,
        "elevation_m": -2564.2,
        "slope_deg": 2.1,
        "cumulative_dist_m": 0.0,
        "uncertainty": 0.0
      },
      {
        "lat": 18.4452,
        "lon": 77.4501,
        "elevation_m": -2563.8,
        "slope_deg": 3.4,
        "cumulative_dist_m": 24.8,
        "uncertainty": 0.0
      }
    ],
    "distance_m": 2845.6,
    "elevation_gain_m": 152.4,
    "elevation_loss_m": 4.0,
    "max_slope_deg": 16.4,
    "mean_slope_deg": 6.8,
    "high_uncertainty_pct": 0.0,
    "model_cost": 5412.8,
    "astar_nodes_explored": 1420,
    "astar_time_us": 380,
    "dijkstra_nodes_explored": 19840,
    "dijkstra_time_us": 2910
  },
  "return_leg": {
    "reachable": true,
    "points": [
      {
        "lat": 18.4685,
        "lon": 77.4165,
        "elevation_m": -2415.8,
        "slope_deg": 4.1,
        "cumulative_dist_m": 0.0,
        "uncertainty": 0.0
      }
    ],
    "distance_m": 2794.1,
    "elevation_gain_m": 4.2,
    "elevation_loss_m": 152.6,
    "max_slope_deg": 14.8,
    "mean_slope_deg": 6.2,
    "high_uncertainty_pct": 0.0,
    "model_cost": 4920.4,
    "astar_nodes_explored": 1390,
    "astar_time_us": 370,
    "dijkstra_nodes_explored": 19410,
    "dijkstra_time_us": 2850
  },
  "resources": {
    "total_distance_km": 5.64,
    "estimated_duration_hr": 2.85,
    "o2_required_liters": 188.1,
    "o2_capacity_liters": 550.0,
    "battery_required_wh": 370.5,
    "battery_capacity_wh": 850.0,
    "reserve_policy_pct": 25.0,
    "fits_within_limits": true,
    "limiting_factor": "Nominal — Outbound + Return + 30m Science Stop fits within 25% safety reserve"
  },
  "assumptions_disclaimer": "PROTOTYPE DECISION-SUPPORT ONLY: All slope cutoffs, mobility weights, and EVA resource rates are configurable prototype assumptions. Not certified for flight operations."
}
```
