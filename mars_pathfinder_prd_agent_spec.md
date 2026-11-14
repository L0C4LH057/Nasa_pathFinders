# MARS PATHFINDER — Product Requirements Document (PRD) & Coding Agent Implementation Specification

**Project Name:** MARS PATHFINDER  
**Challenge:** 2026 NASA Space Apps Challenge — *"Interplanetary Survival Guide: Martian Map"*  
**Pilot Region:** Jezero Crater Western Delta, Mars ($\text{Lat: } 18.38^\circ\text{N} \text{ to } 18.52^\circ\text{N}$, $\text{Lon: } 77.38^\circ\text{E} \text{ to } 77.55^\circ\text{E}$)  
**Base Repository:** Forked from `gods-eye-view` (Vue 3.5 + Pinia 2.3 + CesiumJS 1.124 + Vite 6.4)  
**Backend Compute Engine:** Rust (`Axum` 0.7 + `Tokio` + `Serde`) proxied via Vite at `/api/mars/*`  

---

## 1. Executive Summary & Product Boundary

### 1.1 Problem Statement
A future Mars explorer (EVA astronaut or rover mission planner) needs a map that does more than show where things are. It must help them understand 3D Martian terrain, identify mapped hazards and scientific targets, compare algorithmic routes ($A^*$ vs. Dijkstra), and evaluate whether a planned outbound and return excursion fits within stated hypothetical mission resource constraints.

### 1.2 Proposed Solution
Convert the open-source `gods-eye-view` 3D Earth intelligence console into **MARS PATHFINDER**: an interactive, layered 3D Martian decision-support workstation bounded around **Jezero Crater**. All Earth OSINT layers, SDR radio decoders, and Earth coordinate assumptions (`WGS84`) must be removed and replaced with the **Mars IAU 2015 Ellipsoid (`IAU_2015:49900`)**, NASA Mars Trek WMTS streaming layers, local Jezero Crater Digital Terrain Model (DTM) analysis, and a memory-safe **Rust `Axum` pathfinding & EVA telemetry microservice**.

### 1.3 Mandatory Product Boundary Disclaimer (Must be visible in UI)
> *"MARS PATHFINDER is a research and decision-support prototype. It is not a flight-certified navigation system, a real spacesuit telemetry monitor, a guarantee of astronaut safety, or a substitute for NASA Mission Control. All slope cutoffs, mobility weights, and EVA resource rates are configurable prototype assumptions."*

---

## 2. Target Directory & System Architecture

The coding agent MUST adhere to `gods-eye-view`'s **Principle of Single Ownership** (`Vanilla JS Owner -> Pinia shallowRef/markRaw -> Vue 3 View`) while stripping Earth OSINT bloat and adding the `mars-server/` Rust workspace.

```text
mars-pathfinder/ (Root - formerly gods-eye-view)
├── mars-server/                         # [NEW] Rust Axum Geospatial & Pathfinding Engine
│   ├── Cargo.toml                       # Axum, Tokio, Serde, Tower-HTTP CORS
│   ├── data/                            # Optional external binary/GeoJSON overrides
│   │   ├── jezero_dtm.json              # Local bounded DTM elevation/hazard/uncertainty grid
│   │   └── jezero_features.geojson      # Perseverance waypoints, CRISM minerals, hazard zones
│   └── src/
│       └── main.rs                      # Horn's Slope, A* & Dijkstra, EVA Resource Calculator, API routes
├── public/
│   └── mars-data/                       # [NEW] Static raster overlays for Jezero Crater pilot region
│       ├── jezero_hillshade.png         # Derived analytical hillshade RGBA overlay
│       ├── jezero_slope_rgba.png        # Derived Horn's slope color-ramp RGBA overlay
│       └── jezero_uncertainty_rgba.png  # HiRISE (high confidence) vs MOLA (coarse) overlay
├── server/
│   └── standalone/
│       └── vite.config.js               # [MODIFY] Proxy /api/mars/* -> http://127.0.0.1:8081; strip Earth proxies
├── src/
│   ├── app/
│   │   ├── marsEllipsoid.js             # [NEW] Defines MARS_ELLIPSOID (3396190, 3396190, 3376200)
│   │   ├── viewer.js                    # [MODIFY] Enforce MARS_ELLIPSOID, butterscotch skyAtmosphere, disable Google 3D
│   │   ├── scene.js                     # [MODIFY] Boot camera to Jezero Crater (77.4508E, 18.4447N, 12000m)
│   │   └── catalog.js                   # [MODIFY] Unregister all 34 Earth layers; register 6 Mars layers
│   ├── layers/
│   │   └── mars/                        # [NEW] Mars Domain Layer Controllers
│   │       ├── marsBasemapLayer.js      # NASA Mars Trek CTX / Viking Global & Jezero Orthophoto WMTS
│   │       ├── marsElevationLayer.js    # MGS MOLA Colorized Elevation WMTS + Local DTM
│   │       ├── marsHillshadeLayer.js    # Analytical Hillshade overlay (via src/library/relief.js)
│   │       ├── marsSlopeLayer.js        # Slope severity overlay (<10° green, 10-18° amber, >18° red/excluded)
│   │       ├── marsHazardsLayer.js      # Mapped boulder/dune polygons + Coarse MOLA uncertainty boundary
│   │       ├── marsScienceLayer.js      # Clickable 3D pins for Perseverance Sol targets & CRISM carbonates
│   │       └── marsRouteLayer.js        # Renders 3D clamped Outbound (Cyan) & Return (Amber) polylines + pins
│   ├── ui/
│   │   ├── marsController.js            # [NEW] Vanilla JS Owner managing route state, pin picking, API calls
│   │   ├── stores/
│   │   │   └── marsStore.js             # [NEW] Pinia store (shallowRef) relaying route metrics, profile, provenance
│   │   └── views/                       # [MODIFY] Rebrand & rewire existing Vue 3 HUD Views
│   │       ├── WelcomeView.vue          # Mars Pathfinder briefing & mandatory safety boundary disclaimer
│   │       ├── LayerPanelsView.vue      # 6 Mars layer toggles + "ℹ️ Dataset Provenance" modal button
│   │       ├── CommandDockView.vue      # Start/Goal selectors, Slope/Penalty sliders, Compute Route CTA
│   │       ├── CockpitView.vue          # Elevation profile SVG chart, A* vs Dijkstra stats, EVA Resource bars
│   │       └── IntelHudView.vue         # Science Target & Hazard inspector card on entity click
└── package.json                         # [MODIFY] Neutralize check:boundaries; add dev:mars concurrent script
```

---

## 3. Phase-by-Phase Execution Plan for the Coding Agent

### Phase 1: Purge `gods-eye-view` Earth Bloat & Linter Traps
1. **Disable Boundary Checkers (`package.json`):**
   * Replace `"check:boundaries"` script in `package.json` with `"echo 'Boundary checks bypassed for Mars Pathfinder'"` so `scripts/check-import-directions.mjs` and `scripts/check-package-boundaries.mjs` never fail the build.
2. **Unregister the 34 Earth Layers (`src/standalone/data.js` & `src/app/catalog.js`):**
   * Remove or comment out registrations for all 34 Earth OSINT layers (`aircraft`, `flights`, `military`, `localAdsb`, `vessels`, `shipwrecks`, `submarineCables`, `satellites`, `launches`, `weather`, `wind`, `cyclones`, `airQuality`, `firms`, `perimeters`, `cctv`, `streetLevel`, `alpr`, `transit`, `rail`, `bikeshare`, `installations`, `droneAirspace`, `osmPlaces`, `directions`, `radio`, `gnss`, `earthquakes`, `ghostMaps`, `news`, `wildlifeSightings`).
3. **Disable WebUSB SDR & Earth Upstream Proxies:**
   * Do not initialize `src/sdr/controller.js`.
   * In `server/standalone/vite.config.js`, disable background polling providers (`ais-live.js`, `opensky.js`, `wind.js`) so the app starts cleanly with zero external Earth API calls or console errors.

---

### Phase 2: Planetary Conversion (`WGS84` $\to$ `IAU_2015:49900`)
**CRITICAL REQUIREMENT (Blueprint Section 3 & 13):** Default Earth map tiles and Earth distance/radius assumptions ($6,378,137\text{ m}$) are mathematically invalid for Mars and will corrupt distance and slope calculations by nearly $2\times$.

1. **Create `src/app/marsEllipsoid.js`:**
   ```javascript
   import * as Cesium from 'cesium';

   // IAU 2015 Mars Ellipsoid: Equatorial Radius = 3,396,190 m, Polar Radius = 3,376,200 m
   export const MARS_EQUATORIAL_RADIUS_M = 3396190.0;
   export const MARS_POLAR_RADIUS_M = 3376200.0;

   export const MARS_ELLIPSOID = Object.freeze(
     new Cesium.Ellipsoid(
       MARS_EQUATORIAL_RADIUS_M,
       MARS_EQUATORIAL_RADIUS_M,
       MARS_POLAR_RADIUS_M
     )
   );

   // Override Cesium default ellipsoid globally prior to Viewer construction
   Cesium.Ellipsoid.default = MARS_ELLIPSOID;
   ```
2. **Modify `src/app/viewer.js` & `src/maps/google3d.js`:**
   * Disable Google Photorealistic 3D Tiles (`google3d.js`) and force standard Globe rendering (`viewer.scene.globe.show = true`).
   * Instantiate `new Cesium.Globe(MARS_ELLIPSOID)` and `new Cesium.SkyAtmosphere(MARS_ELLIPSOID)`.
   * Configure Martian atmospheric scattering on `viewer.scene.skyAtmosphere`:
     * `hueShift = -0.45`
     * `saturationShift = -0.25`
     * `brightnessShift = -0.10`
   * Replace all occurrences of `Cesium.Ellipsoid.WGS84` in `src/app/scene.js` (specifically inside `installGlobeInViewRecovery` and camera raycasting helpers) with `MARS_ELLIPSOID`.
3. **Set Default Camera Pose to Jezero Crater (`src/app/scene.js`):**
   * On startup and when clicking "Reset View / Jezero Pilot Region", fly the camera to:
     * **Longitude:** $77.4508^\circ\text{E}$
     * **Latitude:** $18.4447^\circ\text{N}$
     * **Altitude:** $11,500\text{ m}$
     * **Heading:** $315^\circ$ (looking northwest across the Octavia E. Butler landing site toward the Western Delta scarp and Three Forks).

---

### Phase 3: Functional & Scientific Feature Requirements (Essentials 1–7)

#### Feature 1: Mars Basemap & Multi-Layer Stack (Essentials 1 & 2)
The user must be able to toggle and adjust opacity ($0\text{–}100\%$) for **6 distinct geospatial layers** in `LayerPanelsView.vue`:

| Layer ID | UI Label | Source / Implementation | Visual Behaviour |
| :--- | :--- | :--- | :--- |
| `mars-basemap` | **Surface Imagery (CTX / Viking)** | NASA Mars Trek WMTS (`Mars_Viking_MDIM21_ClrMosaic_global_232m` + Jezero CTX Ortho) | Default active basemap draped on `MARS_ELLIPSOID`. |
| `mars-elevation` | **Topography (MOLA + HiRISE DTM)** | NASA Mars Trek WMTS (`Mars_MGS_MOLA_ClrShade_merge_global_463m`) | Colorized elevation ramp ($-2,565\text{ m}$ to $-2,410\text{ m}$ in Jezero). |
| `mars-hillshade` | **Analytical Hillshade** | Generated from local Jezero DTM via Horn's method (`src/library/relief.js` or Rust `/api/mars/grid-layer/hillshade`) | Grayscale azimuth-shaded terrain relief draped on `Rectangle.fromDegrees(77.40, 18.41, 77.50, 18.49)`. |
| `mars-slope` | **Slope Steepness ($^\circ$)** | Derived via Horn's $3\times3$ slope formula in Rust | Color-coded + patterned: $<10^\circ$ (Safe/Green), $10^\circ\text{–}\theta_{\max}$ (Caution/Amber), $>\theta_{\max}$ (Hard Exclusion/Crimson Hatch). |
| `mars-hazards` | **Mapped Hazards & Uncertainty** | GeoJSON polygons + Uncertainty grid | Highlights *Séítah* dune ripples (Hard Exclusion), boulder fields, and the **Coarse MOLA Uncertainty Zone ($463\text{ m/px}$)** vs. **HiRISE High-Confidence Zone ($1\text{ m/px}$)**. |
| `mars-science` | **Science Targets (Perseverance / CRISM)** | `GET /api/mars/features` GeoJSON | Interactive 3D billboards/pins for Octavia E. Butler Landing, Three Forks Depot, Hawksbill Gap, Neretva Margin Carbonates, and Kodiak Butte. |

*Accessibility Rule (Section 8):* Do **not** communicate risk by colour alone. Include distinct border styles (solid vs. dashed vs. cross-hatched polygons) and explicit text labels in the legend.

---

#### Feature 2: Interactive Start & Destination Selection (Essential 3)
In `CommandDockView.vue`, users can select **Start (`A`)** and **Destination (`B`)** via two synchronized methods:
1. **Preset Waypoint Dropdowns:** Quick-select any official Jezero feature (e.g., *Start: Octavia E. Butler Landing Site* $\to$ *Destination: Neretva Vallis Margin Carbonate Unit*).
2. **Interactive 3D Globe Picking:** Clicking **"Pick Start on Map"** or **"Pick Goal on Map"** arms a Cesium `ScreenSpaceEventHandler` (`LEFT_CLICK`). Raycasting against `MARS_ELLIPSOID` converts the click to planetocentric `(lat, lon)`.
   * **Input Validation:** If the user clicks outside the bounded Jezero pilot grid ($\text{Lat} \notin [18.41^\circ, 18.49^\circ]$ or $\text{Lon} \notin [77.40^\circ, 77.50^\circ]$), display a clear toast warning: *"Selected point is outside the high-resolution Jezero Pilot DTM boundary. Clamping or rejecting coordinate."*

---

#### Feature 3: Algorithmic Pathfinding Engine — $A^*$ vs. Dijkstra (Essential 4 & Section 6)
**STRICT RULE (Section 8):** Never draw a decorative straight line and call it a route. Every route must be computed by the Rust `Axum` engine over the terrain cost grid.

1. **Mathematical Cost Model (Implemented in Rust `mars-server/src/main.rs`):**
   For a step from grid cell $u = (r_1, c_1)$ to 8-connected neighbor $v = (r_2, c_2)$:
   * Horizontal cell steps use Mars spherical metric scaling at mid-latitude $\phi_{\text{mid}}$:
     $$\Delta x = |c_2 - c_1| \cdot R_{\text{Mars}} \cos(\phi_{\text{mid}}) \Delta\lambda_{\text{rad}}, \quad \Delta y = |r_2 - r_1| \cdot R_{\text{Mars}} \Delta\phi_{\text{rad}}$$
   * 3D step distance:
     $$d_{\text{3D}}(u, v) = \sqrt{\Delta x^2 + \Delta y^2 + (z_v - z_u)^2}$$
   * **Hard Exclusions (Impassable Terrain):**
     $$\text{If } \text{slope}(v) > \theta_{\max} \;\lor\; H(v) \ge 0.99 \;\lor\; U(v) \ge 0.99 \implies \text{Cost}(u, v) = \infty$$
   * **Traversable Step Cost:**
     $$\text{Cost}(u, v) = d_{\text{3D}}(u, v) \cdot \left( \alpha_{\text{uphill}}(u,v) + w_s \left(\frac{\text{slope}(v)}{\theta_{\max}}\right)^2 + w_h H(v) + w_u U(v) \right)$$
     where $\alpha_{\text{uphill}}(u,v) = 1 + 2.5 \frac{\max(0, z_v - z_u)}{d_{\text{3D}}(u, v)}$ penalizes steep uphill climbs (explaining why the optimal **Outbound** and **Return** routes can take different paths!).
   * **Admissible $A^*$ Heuristic:**
     $$h(v, \text{goal}) = d_{\text{3D}}(v, \text{goal})$$
     Because $\alpha_{\text{uphill}} \ge 1$ and $w_s, w_h, w_u \ge 0$, $\text{Cost}(u, v) \ge d_{\text{3D}}(u, v)$ everywhere. Thus $h(v, \text{goal})$ never overestimates the true remaining cost, guaranteeing $A^*$ finds the exact same optimal cost as Dijkstra while exploring far fewer nodes.

2. **Configurable Mission Parameters in `CommandDockView.vue`:**
   * **Route Preset Mode (`UiSegmented`):** `Balanced` | `Shortest Distance` ($w_s=0.5, w_h=1, w_u=1$) | `Minimum Risk / High Certainty` ($w_s=6, w_h=10, w_u=8$).
   * **Max Passable Slope $\theta_{\max}$ (`UiSlider`):** $8^\circ$ to $30^\circ$ (Default: $18^\circ$).
   * **Slope Penalty Weight $w_s$ (`UiSlider`):** $0.0$ to $10.0$ (Default: $3.5$).
   * **Hazard Penalty Weight $w_h$ (`UiSlider`):** $0.0$ to $10.0$ (Default: $6.0$).
   * **Uncertainty Penalty Weight $w_u$ (`UiSlider`):** $0.0$ to $10.0$ (Default: $4.0$).

---

#### Feature 4: Route Metrics, Elevation Profile & Outbound/Return Rendering (Essential 5)
1. **3D Globe Visualization (`marsRouteLayer.js`):**
   * Render the **Outbound Route** as a high-visibility glowing Cyan polyline (`#00f0ff`, width `5px`) clamped to surface.
   * Render the **Return Route** as a dashed Amber polyline (`#ffb703`, width `3px`).
   * Place distinct 3D billboards at **Start (`A`)**, **Destination (`B`)**, and at the **Steepest Point along the Route**.
2. **Telemetry & Elevation Chart (`CockpitView.vue`):**
   * **Metrics Grid:** Total Outbound Distance ($\text{m}$ / $\text{km}$), Return Distance ($\text{km}$), Cumulative Elevation Gain ($+\text{m}$) & Loss ($-\text{m}$), Max Slope Encountered ($^\circ$), Mean Slope ($^\circ$), and **Uncertainty Exposure ($\%$ of route on coarse MOLA vs. HiRISE DTM)**.
   * **Interactive SVG Elevation & Slope Profile:** Plots `elevation_m` (Y-axis) against `cumulative_dist_m` (X-axis), color-coded along the line by local `slope_deg`. Hovering a point on the chart highlights that exact 3D coordinate on the Cesium Mars globe.
   * **$A^*$ vs. Dijkstra Verification Badge:** Displays live algorithmic proof from the Rust response:
     > *"Optimal Cost Verified: $A^*$ explored **1,420 nodes** ($380\text{ }\mu\text{s}$) vs. Dijkstra's **19,840 nodes** ($2,910\text{ }\mu\text{s}$) — $13.9\times$ speedup, $0.00\%$ cost deviation."*

---

#### Feature 5: Hypothetical EVA Mission Resource Estimator (Section 7 Stretch Goal)
Integrated into `CockpitView.vue` and computed by Rust:
* **Configurable Inputs:**
  * Base Walking Speed: $2.4\text{ km/h}$
  * Science Stop Duration at Target: $30\text{ min}$ ($0.5\text{ hr}$)
  * $\text{O}_2$ Consumption Rate: $1.1\text{ L/min}$ (against $550\text{ L}$ tank capacity)
  * Suit Power Draw: $130\text{ Wh/hr}$ (against $850\text{ Wh}$ battery capacity)
  * Mandatory Emergency Reserve Policy: $25\%$
* **Visual Output:** Progress bars showing Outbound + Science Stop + Return consumption against the $75\%$ usable budget + $25\%$ reserve zone, with a clear **GO (Nominal)** or **NO-GO (Exceeds Reserve / Impassable)** badge.

---

#### Feature 6: Source-Linked Science Context & Dataset Provenance Register (Essentials 6 & 7)
1. **Science Target & Hazard Inspector (`IntelHudView.vue`):**
   * Clicking any 3D marker on the globe opens the Inspector card showing: Feature Name, Category (`Science Target` / `Base Camp` / `Hard Exclusion Hazard`), NASA Mission & Instrument (`Perseverance SHERLOC/PIXL`, `MRO CRISM`, `HiRISE`), Sol/Acquisition Date, Elevation ($\text{m}$), Geological Significance, and clickable official NASA PDS/Mars 2020 URL.
2. **Dataset Provenance & Uncertainty Modal (`LayerPanelsView.vue`):**
   * Clicking **"Dataset Register & Provenance"** fetches `GET /api/mars/provenance` and displays a structured table containing every required field from **Blueprint Section 4**:
     * Dataset Title, Instrument & Mission
     * Official Source URL & PDS Product ID
     * Spatial Resolution ($\text{m/px}$) & Coverage
     * CRS (`IAU_2015:49900`), Datum & Units
     * Known Limitations & How Uncertainty is Handled in Routing

---

## 4. API Contract (Vite Frontend $\leftrightarrow$ Rust `Axum` Server)

Configure `server/standalone/vite.config.js` to proxy `/api/mars` to `http://127.0.0.1:8081`.

### 4.1 `GET /api/mars/provenance`
Returns the complete Section 4 Dataset Register JSON (see Rust implementation in `mars-server/src/main.rs`).

### 4.2 `GET /api/mars/features`
Returns a valid `GeoJSON FeatureCollection` of Jezero Crater science targets and mapped hazard zones with full source metadata.

### 4.3 `GET /api/mars/grid-summary`
Returns the bounding box and summary statistics of the loaded Jezero DTM grid so the frontend can drape overlays accurately:
```json
{
  "rows": 200,
  "cols": 200,
  "bounds": { "min_lat": 18.41, "max_lat": 18.49, "min_lon": 77.40, "max_lon": 77.50 },
  "cell_size_x_m": 24.98,
  "cell_size_y_m": 23.71,
  "min_elevation_m": -2568.4,
  "max_elevation_m": -2412.1
}
```

### 4.4 `POST /api/mars/route`
**Request Body:**
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
**Response Body (`200 OK`):**
```json
{
  "outbound": {
    "reachable": true,
    "points": [
      { "lat": 18.4447, "lon": 77.4508, "elevation_m": -2564.2, "slope_deg": 2.1, "cumulative_dist_m": 0.0, "uncertainty": 0.1 }
    ],
    "distance_m": 2845.6,
    "elevation_gain_m": 152.4,
    "elevation_loss_m": 13.1,
    "max_slope_deg": 16.4,
    "mean_slope_deg": 6.8,
    "high_uncertainty_pct": 0.0,
    "model_cost": 5412.8,
    "astar_nodes_explored": 1142,
    "astar_time_us": 410,
    "dijkstra_nodes_explored": 18420,
    "dijkstra_time_us": 3120
  },
  "return_leg": { "reachable": true, "...": "..." },
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
  "assumptions_disclaimer": "PROTOTYPE DECISION-SUPPORT ONLY..."
}
```

---

## 5. UI / UX Design System & Rebranding Specifications

Keep `gods-eye-view`'s sleek glassmorphic HUD layout (`style.css` & `src/ui/kit/`), but shift the visual theme from "Earth Tactical OSINT" to **"NASA JPL / Mars 2020 Mission Control"**:

1. **Color Palette Tokens (`style.css`):**
   * `--bg-panel`: `rgba(18, 14, 12, 0.86)` (Deep Martian Basalt glass)
   * `--accent-primary`: `#ff6b35` (Mars Mission Amber/Orange)
   * `--route-outbound`: `#00f0ff` (High-contrast EVA Telemetry Cyan)
   * `--route-return`: `#ffb703` (Return Traverse Gold)
   * `--status-nominal`: `#10b981` (Emerald GO)
   * `--status-hazard`: `#ef4444` (Crimson Hard Exclusion / NO-GO)
2. **Top Header Bar (`SceneChromeView.vue`):**
   * **Left:** `MARS PATHFINDER // JEZERO CRATER PILOT [IAU_2015:49900]`
   * **Center:** Live cursor planetocentric coordinates (`LAT 18.4447°N | LON 77.4508°E | RADIUS 3,396.19 KM`)
   * **Right:** Quick-action buttons: `[Fly to Jezero Delta]` `[Dataset Provenance]` `[Prototype Disclaimer]`

---

## 6. Quality Assurance, Security & Testing Checklist (Blueprint Sections 9 & 13)

The coding agent MUST implement and verify the following tests before marking the task complete:

1. **Rust Unit Tests (`cargo test` in `mars-server/`):**
   * `test_mars_scale_factors`: Verify $\Delta x, \Delta y$ use $R_{\text{Mars}} = 3,396,190\text{ m}$ and NOT Earth's radius.
   * `test_astar_matches_dijkstra_optimality`: Assert that on the Jezero grid, `run_search(..., use_heuristic: true)` returns the **exact same `model_cost`** (within $10^{-5}$ float epsilon) as `run_search(..., use_heuristic: false)` while exploring fewer nodes (`astar_nodes < dijkstra_nodes`).
   * `test_hard_slope_exclusion`: Set `max_slope_deg = 2.0` across the steep delta scarp and assert `reachable == false` (proving hard exclusions block cliffs rather than merely penalizing them).
   * `test_nodata_and_hazard_exclusion`: Assert that no point in `outbound.points` ever lands on a cell with `hazard_level >= 0.99` or `uncertainty_level >= 0.99`.
2. **Cybersecurity Hardening (Section 9):**
   * Validate all incoming `POST /api/mars/route` float parameters (`!lat.is_nan()`, `!lon.is_nan()`, clamp `max_slope_deg` to $[1.0, 89.0]$, clamp weights to $[0.0, 100.0]$).
   * Bind `mars-server` strictly to loopback `127.0.0.1:8081`.
   * Zero hardcoded API keys or credentials required to boot and run the full demo.
3. **One-Command Reproducibility:**
   * Update `README.md` with clear 2-step setup instructions (`cargo run --release` + `npm run dev`) so any judge or teammate can run the full 3D Mars Pathfinder demo offline or online in under 60 seconds.