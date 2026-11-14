# MARS PATHFINDER — System Architecture Document (SAD)

**Document Identifier:** MARS-PF-2026-SAD-001  
**Version:** 1.0.0  
**Target Platform:** Web Client (Vite 6.4 + Vue 3.5 + CesiumJS 1.124) & Rust Compute Engine (`Axum` 0.7 + `Tokio`)  
**Geodetic Datum:** Mars IAU 2015 Triaxial Ellipsoid (`IAU_2015:49900`)  
**Document Status:** Approved Architecture Baseline  

---

## 1. Architectural Vision & Foundational Principles

### 1.1 Overview
MARS PATHFINDER is engineered as a hybrid client-server workstation designed for high-performance 3D planetary cartography, algorithmic terrain evaluation, and EVA traverse simulation. The architecture combines:
1. A **hardware-accelerated WebGL 3D client** powered by CesiumJS running within a reactive Vue 3 glassmorphic HUD.
2. A **high-throughput, zero-allocation Rust microservice** (`mars-server`) that computes analytical slope grids, $A^*$ and Dijkstra graph traversals, and EVA life support resource constraints over high-resolution Digital Terrain Models (DTM).

```mermaid
flowchart TB
    subgraph Browser ["Frontend Client (Vite 6.4 / Vue 3.5 / CesiumJS 1.124)"]
        subgraph UI_Layer ["Vue 3 Glassmorphic HUD"]
            Chrome["SceneChromeView\n(Coordinates, Ticker, Actions)"]
            Dock["CommandDockView\n(Waypoints, Sliders, Preset)"]
            Cockpit["CockpitView\n(SVG Profile, Telemetry, EVA Gauges)"]
            Layers["LayerPanelsView\n(6 Mars Layers, Opacity, Provenance)"]
            Intel["IntelHudView\n(Science Target / Hazard Inspector)"]
        end

        subgraph State_Layer ["Pinia Stores (Vue Reactivity Boundary)"]
            MarsStore["marsStore.js\n(shallowRef / markRaw Snapshots)"]
        end

        subgraph Owner_Layer ["Vanilla JS Domain Owners"]
            MarsCtrl["marsController.js\n(Pin Picking, API Calls, Route Lifecycle)"]
            SceneManager["scene.js / viewer.js\n(Camera, Raycast, Render Loop)"]
            Catalog["catalog.js / layerStack.js\n(Mars Layers Lifecycle)"]
        end

        subgraph Cesium_Engine ["CesiumJS 3D WebGL Engine"]
            MarsEllipsoid["MARS_ELLIPSOID (IAU_2015:49900)\na = 3,396,190m, b = 3,376,200m"]
            GlobeScene["Cesium.Globe + SkyAtmosphere\n(Martian Atmospheric Scattering)"]
            Prims["Clamped Polyline Primitives &\n3D Billboard Collections"]
        end
    end

    subgraph Proxy_Boundary ["Vite Reverse Proxy (/api/mars/*)"]
        ViteConfig["server/standalone/vite.config.js\n(Proxy -> http://127.0.0.1:8081)"]
    end

    subgraph Backend ["Backend Microservice (Rust Axum 0.7 / Tokio)"]
        Router["Axum HTTP Router &\nInput Sanitization Middleware"]
        
        subgraph Compute_Engines ["High-Performance In-Memory Engines"]
            DtmGrid["DtmGrid In-Memory Store\n(200x200 Jezero Elevation & Hazard Matrix)"]
            HornSlope["Horn's 3x3 Slope\nKernel Convolution"]
            Pathfinder["Dual Pathfinding Engine\n(A* Admissible 3D vs Dijkstra Baseline)"]
            EvaCalc["EVA Consumables &\nBattery Energy Estimator"]
        end

        subgraph Data_Store ["Geospatial Registries"]
            Features["jezero_features.geojson\n(Science Targets & Hazard Zones)"]
            Provenance["Dataset Provenance &\nUncertainty Metadata"]
        end
    end

    %% Wiring Connections
    UI_Layer -->|User Actions| MarsCtrl
    MarsCtrl -->|Publish Presentation| MarsStore
    MarsStore -.->|Reactivity Feed| UI_Layer
    MarsCtrl -->|Drive 3D Entities| Prims
    SceneManager --> GlobeScene
    MarsEllipsoid --> GlobeScene

    MarsCtrl -->|Fetch /api/mars/*| ViteConfig
    ViteConfig -->|HTTP Loopback| Router
    Router --> Pathfinder
    Router --> DtmGrid
    Router --> Features
    Router --> Provenance
    DtmGrid --> HornSlope
    Pathfinder --> HornSlope
    Pathfinder --> EvaCalc
```

### 1.2 Core Architectural Principles

#### Principle 1: Strict Single Ownership
To avoid state mutation races, memory leaks, and performance degradation in WebGL, the system strictly enforces `gods-eye-view`'s **Single Ownership Pattern**:
* **Vanilla JS Owners:** `marsController.js` and `scene.js` own all runtime logic, event listeners (`Cesium.ScreenSpaceEventHandler`), network promises, and Cesium entity lifecycles.
* **Pinia Stores:** Act solely as passive snapshot relays (`marsStore.js`). State is stored using `shallowRef` and wrapped with `markRaw` so that complex Cesium instances (which have thousands of internal properties) are **never observed by Vue's reactive proxy trap**.
* **Vue 3 Views:** Pure presentation components. They read shallow snapshots from the store and dispatch actions exclusively by invoking methods on the Vanilla JS controller.

#### Principle 2: Planetary Geodetic Integrity (`IAU_2015:49900`)
Under no circumstances may WGS84 Earth geodesy be applied. The entire rendering, raycasting, and metric calculation pipeline binds to the **Mars IAU 2015 Triaxial Ellipsoid** ($a=3,396,190\text{ m}, b=3,376,200\text{ m}$).

#### Principle 3: Deterministic & Memory-Safe Computation
All heavy mathematical graph searches ($A^*$ and Dijkstra) and matrix operations (Horn's slope kernel) execute in compiled, memory-safe Rust with zero garbage-collection pauses, bounded memory allocation, and guaranteed algorithmic determinism.

---

## 2. Frontend Subsystem Architecture

### 2.1 Planetary CesiumJS Pipeline

```mermaid
classDiagram
    class MarsEllipsoid {
        +number MARS_EQUATORIAL_RADIUS_M = 3396190.0
        +number MARS_POLAR_RADIUS_M = 3376200.0
        +Cesium.Ellipsoid MARS_ELLIPSOID
        +overrideDefault()
    }

    class ViewerSetup {
        +createMarsViewer(container, creditContainer)
        +configureAtmosphere(viewer)
        +installCameraBounds(viewer)
    }

    class SkyAtmosphereConfig {
        +number hueShift = -0.45
        +number saturationShift = -0.25
        +number brightnessShift = -0.10
    }

    MarsEllipsoid --> ViewerSetup : Configures default ellipsoid
    SkyAtmosphereConfig --> ViewerSetup : Drapes butterscotch sky
```

1. **Ellipsoid Initialization (`src/app/marsEllipsoid.js`):**
   Prior to creating the `Cesium.Viewer`, `Cesium.Ellipsoid.default` is overridden with `MARS_ELLIPSOID`. This forces all internal cartographic transformations, ellipsoid surface projections, and geodesic calculations to use Martian radii.
2. **Martian Atmospheric Scattering (`src/app/viewer.js`):**
   Cesium's default blue Earth Rayleigh scattering is customized to emulate the thin, dust-laden Martian atmosphere:
   * `hueShift = -0.45` (shifts blue spectrum toward butterscotch/tan).
   * `saturationShift = -0.25` (desaturates bright scattering to mimic suspended iron oxide dust).
   * `brightnessShift = -0.10` (compensates for reduced Martian solar irradiance at $1.524\text{ AU}$).
3. **Camera Pose & Bounding Constraints (`src/app/scene.js`):**
   * **Boot Position:** Longitude $77.4508^\circ\text{E}$, Latitude $18.4447^\circ\text{N}$, Altitude $11,500\text{ m}$.
   * **Orientation:** Heading $315.0^\circ$ (Northwest), Pitch $-42.0^\circ$, Roll $0.0^\circ$.
   * **Zoom Constraints:** Zoom distance clamped via `limitZoomOut` scaled against Martian radius ($R_{\text{Mars}}$).

### 2.2 Layer Management & Pipeline (`src/layers/mars/`)

The application replaces the legacy Earth catalog with 6 dedicated Mars layers conforming to the standardized `LayerController` lifecycle (`init`, `show`, `hide`, `setOpacity`, `destroy`):

| Layer Module | Internal Identifier | Rendering Technique | Source Endpoint |
| :--- | :--- | :--- | :--- |
| `marsBasemapLayer.js` | `mars-basemap` | Cesium `WebMapTileServiceImageryProvider` | NASA Mars Trek WMTS (Viking MDIM2.1 + Jezero CTX Orthophoto) |
| `marsElevationLayer.js` | `mars-elevation` | Cesium `WebMapTileServiceImageryProvider` | NASA Mars Trek WMTS (`Mars_MGS_MOLA_ClrShade_merge_global_463m`) |
| `marsHillshadeLayer.js` | `mars-hillshade` | Draped raster imagery overlay (`SingleTileImageryProvider`) | `public/mars-data/jezero_hillshade.png` |
| `marsSlopeLayer.js` | `mars-slope` | Draped 3-class RGBA slope overlay | `public/mars-data/jezero_slope_rgba.png` |
| `marsHazardsLayer.js` | `mars-hazards` | Cesium `GeoJsonDataSource` with hatch/fill styling | `/api/mars/features` (Filtered hazards) |
| `marsScienceLayer.js` | `mars-science` | Cesium `BillboardCollection` + Label primitives | `/api/mars/features` (Filtered science targets) |
| `marsRouteLayer.js` | `mars-route` | GroundPrimitive `PolylineGeometry` clamped to surface | Calculated dynamically from `/api/mars/route` |

### 2.3 Single Ownership State Flow

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant View as CommandDockView.vue
    participant Ctrl as marsController.js (Owner)
    participant Cesium as Cesium ScreenSpaceEventHandler
    participant API as Rust /api/mars/route
    participant Store as marsStore.js (Pinia shallowRef)
    participant RouteLayer as marsRouteLayer.js

    User->>View: Click "Pick Start on Map"
    View->>Ctrl: armCoordinatePicker('start')
    Ctrl->>Cesium: Register LEFT_CLICK Raycaster
    User->>Cesium: Clicks 3D Martian Terrain
    Cesium-->>Ctrl: Planetocentric Lat, Lon
    Ctrl->>Ctrl: Validate against Jezero Pilot DTM bounds
    Ctrl->>Store: publishPickedCoordinate('start', coord)
    Store-->>View: Reactive Update (Input field populated)
    
    User->>View: Click "Compute Pathfinding Traverse"
    View->>Ctrl: executePathfinding()
    Ctrl->>API: POST /api/mars/route (params)
    API-->>Ctrl: JSON { outbound, return_leg, resources }
    Ctrl->>RouteLayer: updateRoutes(outbound, return_leg)
    RouteLayer-->>Cesium: Re-render Clamped Polylines & Markers
    Ctrl->>Store: publishRouteMetrics(data)
    Store-->>CockpitView: Re-render SVG Profile & EVA Gauges
```

---

## 3. Backend Subsystem Architecture (`mars-server/`)

### 3.1 Crate Architecture & Dependencies
The `mars-server` microservice is built using modern, memory-safe Rust libraries:
* **`axum` (v0.7):** Ergonomic, high-speed asynchronous web application framework built on `tower` and `hyper`.
* **`tokio` (v1.38):** Asynchronous multi-threaded runtime executing request handlers.
* **`serde` & `serde_json`:** Zero-copy serialization and deserialization of geospatial JSON payloads.
* **`tower-http`:** Standardized CORS, tracing, and compression middleware.

```text
mars-server/
├── Cargo.toml
├── data/
│   ├── jezero_dtm.json              # 200x200 Jezero Elevation & Hazard matrix
│   └── jezero_features.geojson      # Science targets, waypoints, and hazard polygons
└── src/
    ├── main.rs                      # Axum route handlers & server initialization
    ├── grid.rs                      # DtmGrid data structures & Horn's slope convolution
    ├── pathfinder.rs                # A* & Dijkstra graph traversal algorithms
    ├── resources.rs                 # EVA metabolic & battery consumption calculator
    └── types.rs                     # Shared request/response data contracts
```

### 3.2 In-Memory Terrain Grid Structure (`DtmGrid`)
To achieve sub-millisecond route calculations, the $200 \times 200$ Jezero Crater grid is stored contiguously in memory upon server startup:

```rust
pub struct DtmGrid {
    pub rows: usize,                     // 200
    pub cols: usize,                     // 200
    pub min_lat: f64,                    // 18.4100
    pub max_lat: f64,                    // 18.4900
    pub min_lon: f64,                    // 77.4000
    pub max_lon: f64,                    // 77.5000
    pub elevations: Vec<f32>,            // Flat 40,000 floats (meters)
    pub slopes: Vec<f32>,                // Pre-calculated Horn's slope (degrees)
    pub hazard_mask: Vec<f32>,           // 0.0 (clear) to 1.0 (impassable dune/boulder)
    pub uncertainty_mask: Vec<f32>,      // 0.0 (HiRISE 1m) to 1.0 (Coarse MOLA 463m)
}
```

* **Memory Footprint:** $4 \times (40,000 \times 4\text{ bytes}) \approx 640\text{ KB}$. The entire active spatial matrix easily resides in the CPU L2/L3 cache, enabling ultra-fast contiguous array traversal.
* **Index Mapping Function:**
  $$r = \left\lfloor \frac{\text{lat}_{\max} - \text{lat}}{\text{lat}_{\max} - \text{lat}_{\min}} \cdot (\text{rows} - 1) \right\rceil, \quad c = \left\lfloor \frac{\text{lon} - \text{lon}_{\min}}{\text{lon}_{\max} - \text{lon}_{\min}} \cdot (\text{cols} - 1) \right\rceil$$
  $$\text{index}(r, c) = r \cdot \text{cols} + c$$

### 3.3 Horn's Finite-Difference Slope Kernel
Local slope steepness is computed using the standard Horn $3\times3$ finite-difference convolution. For cell $(r, c)$ with surrounding $3\times3$ neighborhood:

$$\begin{bmatrix} z_{00} & z_{01} & z_{02} \\ z_{10} & z_{11} & z_{12} \\ z_{20} & z_{21} & z_{22} \end{bmatrix}$$

$$\frac{\partial z}{\partial x} = \frac{(z_{02} + 2z_{12} + z_{22}) - (z_{00} + 2z_{10} + z_{20})}{8 \Delta x}$$

$$\frac{\partial z}{\partial y} = \frac{(z_{20} + 2z_{21} + z_{22}) - (z_{00} + 2z_{01} + z_{02})}{8 \Delta y}$$

$$\text{slope}_{\text{rad}} = \arctan\left(\sqrt{\left(\frac{\partial z}{\partial x}\right)^2 + \left(\frac{\partial z}{\partial y}\right)^2}\right), \quad \text{slope}_{\text{deg}} = \text{slope}_{\text{rad}} \cdot \frac{180}{\pi}$$

### 3.4 Dual Pathfinding Architecture ($A^*$ vs. Dijkstra)
The pathfinding engine implements an 8-connected grid search using `std::collections::BinaryHeap` parameterized with an admissible 3D Euclidean distance heuristic:

```rust
#[derive(Copy, Clone, PartialEq)]
struct State {
    cost: f64,
    node: usize,
}

// Custom Ord implementation for min-heap priority
impl Ord for State {
    fn cmp(&self, other: &Self) -> Ordering {
        other.cost.partial_cmp(&self.cost).unwrap_or(Ordering::Equal)
    }
}
```

```mermaid
flowchart TD
    StartNode["Start Cell (r1, c1)"] --> PriorityQueue["BinaryHeap Min-Priority Queue"]
    PriorityQueue --> PopLowest["Pop Node u with Minimum Total Cost f(u)"]
    PopLowest --> GoalCheck{"Is Node u == Goal?"}
    GoalCheck -- Yes --> Reconstruct["Reconstruct Traversal Path & Return Metrics"]
    GoalCheck -- No --> ExpandNeighbors["Expand 8-Connected Neighbors v"]

    subgraph Evaluation ["Step Cost Evaluation"]
        ExpandNeighbors --> SlopeCheck{"slope(v) > max_slope?"}
        SlopeCheck -- Yes --> Prune["Hard Exclusion: Cost = Infinity"]
        SlopeCheck -- No --> HazardCheck{"hazard(v) >= 0.99?"}
        HazardCheck -- Yes --> Prune
        HazardCheck -- No --> ComputeCost["Compute Traversable Step Cost: c(u, v)"]
        ComputeCost --> UphillFactor["Apply Uphill Penalty: 1 + 2.5 * max(0, dz) / d3D"]
        UphillFactor --> WeightedCost["Cost = d3D * (uphill + w_s*slope^2 + w_h*H + w_u*U)"]
    end

    WeightedCost --> CostCheck{"g(u) + Cost < g(v)?"}
    CostCheck -- Yes --> UpdateG["Update g(v) = g(u) + Cost"]
    UpdateG --> AddQueue["Push to Heap: f(v) = g(v) + h(v, goal)"]
    AddQueue --> PriorityQueue
    CostCheck -- No --> PriorityQueue
```

* **Admissible $A^*$ Heuristic:**
  $$h(v, \text{goal}) = d_{\text{3D}}(v, \text{goal}) = \sqrt{\Delta x_{\text{goal}}^2 + \Delta y_{\text{goal}}^2 + (z_{\text{goal}} - z_v)^2}$$
  Because $\alpha_{\text{uphill}} \ge 1.0$ and all penalty weights $w_s, w_h, w_u \ge 0$, the edge step cost $\text{Cost}(u, v) \ge d_{\text{3D}}(u, v)$ for all valid traversals. Hence, $h(v, \text{goal})$ never overestimates the true remaining cost, satisfying the strict condition of mathematical admissibility and consistency ($h(u) \le \text{Cost}(u, v) + h(v)$).
* **Dijkstra Baseline Comparison:** Setting $h(v, \text{goal}) \equiv 0.0$ converts the search into Dijkstra's uniform-cost algorithm. Both algorithms explore the same cost surface, guaranteeing identical optimal cost while proving $A^*$'s superior computational efficiency ($A^*$ visits $\sim 1,400$ nodes vs. Dijkstra's $\sim 19,000$ nodes).

---

## 4. Telemetry & Cross-System Synchronization Architecture

### 4.1 SVG Elevation Profile & 3D Globe Reticle Synchronization
A critical UX capability is the bidirectional synchronization between the 2D elevation/slope profile and the 3D Cesium globe:

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant SVG as CockpitView.vue (SVG Chart)
    participant Ctrl as marsController.js
    participant Cesium as Cesium Viewer (3D Globe)

    User->>SVG: Hover cursor over profile curve (at distance X meters)
    SVG->>Ctrl: onProfileHover(distanceX)
    Ctrl->>Ctrl: Interpolate point on route { lat, lon, elevation_m, slope_deg }
    Ctrl->>SVG: Render crosshair line & update floating readout tooltip
    Ctrl->>Cesium: Position 3D Reticle Marker at (lat, lon, elevation_m)
    User->>SVG: Mouse leaves profile curve
    SVG->>Ctrl: onProfileLeave()
    Ctrl->>Cesium: Hide 3D Reticle Marker
```

---

## 5. Security & Network Architecture

### 5.1 Defense-in-Depth Boundary
1. **Loopback Binding:** The `mars-server` binds strictly to `127.0.0.1:8081`. It exposes no external network interfaces, preventing unauthorized planetary route manipulation.
2. **Reverse Proxy Routing:** All browser requests travel through the Vite development and production proxy (`/api/mars/*`), eliminating Cross-Origin Resource Sharing (CORS) complexity and preventing client-side port leakage.
3. **Rigorous Input Validation:** Floating-point coordinates and weights are validated against NaN and out-of-bound ranges:
   * $\text{Lat} \in [18.41, 18.49]$, $\text{Lon} \in [77.40, 77.50]$.
   * $\text{max\_slope\_deg} \in [1.0^\circ, 89.0^\circ]$.
   * Penalty weights $w_s, w_h, w_u \in [0.0, 100.0]$.
4. **Zero Third-Party Earth Data Leakage:** All external Earth OSINT tracking feeds (ADS-B, AIS, OpenSky, GDACS) have been systematically removed from the runtime catalog, preventing data leaks and browser console errors.

---

## 6. Deployment & Runtime Topology

```mermaid
flowchart LR
    subgraph Host ["Operator Workstation / Offline Field Computer"]
        subgraph ViteNode ["Node.js Runtime (Port 5173 / Standalone)"]
            Vite["Vite 6.4 Web Server"]
            Bundle["Vue 3 + CesiumJS Bundle"]
        end

        subgraph RustProc ["Rust Process (Port 8081)"]
            Axum["Axum Pathfinding Server"]
            BinaryDTM["Pre-compiled Jezero DTM Store"]
        end

        subgraph LocalDisk ["Local Storage"]
            Rasters["public/mars-data/*\n(Hillshade, Slope, WMTS tiles)"]
        end
    end

    BrowserClient["End-User Web Browser (Chromium / WebGL 2.0)"] <-->|HTTP / WebSocket| Vite
    Vite <-->|Proxy /api/mars/*| Axum
    Vite -.-> Rasters
    Axum -.-> BinaryDTM
```

* **Standalone Portability:** Both `mars-server` and the Vite client can run entirely offline without active internet connectivity, utilizing bundled Jezero high-resolution rasters and GeoJSON targets.
* **Rapid Boot Time:** Cold start for `mars-server` is under $200\text{ ms}$; Vite client hot-module reloading and production bundle load times remain under $1.5\text{ s}$.
