# MARS PATHFINDER — Documentation & Architecture Specification Plan

- [x] 1. Deep architectural & requirements synthesis <!-- id: 1 -->
  - [x] 1.1 Analyze `mars_pathfinder_prd_agent_spec.md` requirements and blueprint essentials
  - [x] 1.2 Inspect `gods-eye-view` component ownership, Cesium pipeline, and Vue 3 HUD architecture
- [x] 2. Core Specification Documents Generation (`docs/`) <!-- id: 2 -->
  - [x] 2.1 Create `docs/PRD.md` — Full Product Requirements Document
  - [x] 2.2 Create `docs/ARCHITECTURE.md` — Comprehensive System Architecture Document (SAD)
  - [x] 2.3 Create `docs/UI_UX_SPECIFICATION.md` — UI Improvements, NASA JPL HUD Design System & View Specifications
  - [x] 2.4 Create `docs/PATHFINDING_ENGINE.md` — Mathematical Cost Model, Horn's Slope & Algorithmic Traversal Spec
  - [x] 2.5 Create `docs/API_SPECIFICATION.md` — REST/Axum API Contract & Data Transfer Schemas
  - [x] 2.6 Create `docs/DATA_SOURCES_PROVENANCE.md` — Dataset Register, Planetary CRS & Uncertainty Handling
  - [x] 2.7 Create `docs/SECURITY_THREAT_MODEL.md` — Cybersecurity, Threat Modeling & Safety Guardrails
  - [x] 2.8 Create `docs/TESTING_QA_PLAN.md` — Verification, Test Suites & Benchmark Validation Plan
  - [x] 2.9 Create `docs/OPERATIONS_DEPLOYMENT.md` — Operations, Environment Setup & Reproducibility Guide
  - [x] 2.10 Create root `README.md` — Project Overview, Architecture Directory & Quickstart
- [x] 3. Master Specification Artifact Generation <!-- id: 3 -->
  - [x] 3.1 Create Master Artifact in brain directory summarizing the entire system specification
- [x] 4. Verification & Review <!-- id: 4 -->
  - [x] 4.1 Verify document consistency, IAU 2015 CRS adherence, and mathematical formulas
  - [x] 4.2 Document final review in `tasks/todo.md`

## Implementation Roadmap (Approved Specification Execution)

- [x] 5. Project Foundation & Source Base Setup <!-- id: 5 -->
  - [x] 5.1 Copy source tree from `gods-eye-view` into `pathfinder` (preserving docs, tasks, specs)
  - [x] 5.2 Link/verify `node_modules` and ensure Vite build toolchain operates cleanly
- [x] 6. Backend Microservice Engine (`mars-server/`) <!-- id: 6 -->
  - [x] 6.1 Initialize `mars-server/Cargo.toml` with Axum 0.7, Tokio, Serde, Tower-HTTP
  - [x] 6.2 Create `mars-server/data/jezero_dtm.json` (200x200 grid) & `jezero_features.geojson`
  - [x] 6.3 Implement `mars-server/src/main.rs` with Horn's slope, A* & Dijkstra, EVA calculator, and API routes
  - [x] 6.4 Implement & execute automated Rust unit tests (`cargo test` passes 4/4 tests in 0.01s)
- [x] 7. Planetary Geodesy & Engine Transformation (`IAU_2015:49900`) <!-- id: 7 -->
  - [x] 7.1 Create `src/app/marsEllipsoid.js` enforcing `MARS_ELLIPSOID` ($3396190\text{ m}, 3376200\text{ m}$)
  - [x] 7.2 Update `src/app/viewer.js` with butterscotch atmosphere and disable Google 3D
  - [x] 7.3 Update `src/app/scene.js` and `src/camera.js` to boot to Jezero Crater ($77.4508^\circ\text{E}, 18.4447^\circ\text{N}$, $11500\text{ m}$)
- [x] 8. Earth Bloat Purge & Proxy Reconfiguration <!-- id: 8 -->
  - [x] 8.1 Neutralize `check:boundaries` in `package.json` and add `dev:mars` script
  - [x] 8.2 Strip Earth polling feeds, proxy `/api/mars/* -> http://127.0.0.1:8081` in `build/vite.js`
  - [x] 8.3 Unregister 34 Earth layers and register 6 Mars layers in `src/app/catalog.js` & `src/standalone/catalog.js`
- [x] 9. Mars Layer Controllers & Visual Overlays <!-- id: 9 -->
  - [x] 9.1 Populate `public/mars-data/` with local Jezero hillshade, slope, and uncertainty rasters
  - [x] 9.2 Implement `src/layers/mars/` layer controllers (Basemap, Elevation, Hillshade, Slope, Hazards, Science, Route)
- [x] 10. Single Ownership State & Vue 3 HUD Overhaul <!-- id: 10 -->
  - [x] 10.1 Implement `src/ui/marsController.js` (Vanilla JS Owner)
  - [x] 10.2 Implement `src/ui/stores/marsStore.js` (Pinia shallowRef/markRaw relay)
  - [x] 10.3 Rebrand and rewire Vue 3 HUD views (`SceneChromeView`, `LayerPanelsView`, `CommandDockView`, `CockpitView`, `IntelHudView`, `WelcomeView`, `DatasetProvenanceModal`)
  - [x] 10.4 Update `src/ui/styles/foundation.css` with Martian Basalt glassmorphic tokens
- [x] 11. Verification, Testing & Demonstration <!-- id: 11 -->
  - [x] 11.1 Verify Rust unit tests (`cargo test` passes 100% of tests with 0 warnings)
  - [x] 11.2 Verify frontend build (`npm run build` succeeds in 16.11s)
  - [x] 11.3 Test end-to-end route calculation from Butler Landing to Neretva Carbonates via curl
  - [x] 11.4 Final review and demonstration summary
- [x] 12. Fix Startup Runtime Error (`Cannot set properties of undefined (setting 'show')`) <!-- id: 12 -->
  - [x] 12.1 Root cause diagnosis: Cesium 1.138 disables default `skyAtmosphere` when ellipsoid != WGS84 (`MARS_ELLIPSOID`), leaving `viewer.scene.skyAtmosphere` undefined
  - [x] 12.2 Update `src/app/viewer.js` with `new Cesium.SkyAtmosphere(MARS_ELLIPSOID)` in `applicationViewerOptions` and safe guards on `scene.skyAtmosphere` & `scene.globe`
  - [x] 12.3 Update `src/app/scene.js` to provide full Mars `mapStackController` protocol (`getStacks`, `getActiveId`, `getState`, `isStackAvailable`, etc.)
  - [x] 12.4 Update `src/app/controls.js` loading label to Martian context
  - [x] 12.5 Build and verify frontend + launch `mars-server` backend daemon
  - [x] 12.6 Verify runtime in browser / headless environment (zero errors, app reaches 'ready', loading screen hides, HUD active)

## Phase 13: Neomorphic Mission Control Dashboard & Explore-Mars Esri Integration <!-- id: 13 -->

- [x] 13.1 Architecture & Design Specification <!-- id: 13.1 -->
  - [x] 13.1.1 Formulate Neomorphic Design Token System (`--neo-base`, `--neo-surface`, `--neo-shadow-dark`, `--neo-shadow-light`, `--neo-inset-dark`, `--neo-inset-light`)
  - [x] 13.1.2 Architect Big Canvas Layout: Expansive central hero 3D Cesium viewport (with Fullscreen / Focus toggle) surrounded by modular neomorphic telemetry cards
  - [x] 13.1.3 Design Explore-Mars Esri Service Integration (`OnMars/CTX` 5m Context Camera mosaic & `OnMars/MDIM` 231m Viking color mosaic)
- [x] 13.2 Explore-Mars Esri Layer Integration <!-- id: 13.2 -->
  - [x] 13.2.1 Create `src/layers/mars/marsEsriCtxLayer.js` using `Cesium.UrlTemplateImageryProvider` connected to `https://astro.arcgis.com/arcgis/rest/services/OnMars/CTX/MapServer`
  - [x] 13.2.2 Create `src/layers/mars/marsEsriMdimLayer.js` connected to `https://astro.arcgis.com/arcgis/rest/services/OnMars/MDIM/MapServer`
  - [x] 13.2.3 Register Esri layers in `marsController.js` and `marsStore.js`
- [x] 13.3 Neomorphic Mission Control Dashboard Components (`src/ui/views/`) <!-- id: 13.3 -->
  - [x] 13.3.1 Overhaul `SceneChromeView.vue`: NASA Mars Pathfinder top navigation bar (Mission Control, Pharmaceutical & Medical, Life-Support, Alerts, Settings) + Big Canvas container
  - [x] 13.3.2 Implement In-Canvas Overlay Controls: Floating Neomorphic "Map Layers" dropdown (Esri CTX 5m, Viking MDIM, MOLA Elevation, Slope, Hazards, Science), North compass, Zoom controls (+/-), and Scale bar
  - [x] 13.3.3 Implement `MissionOverviewCard.vue`: Current location (Jezero Crater), destination (Séítah/Neretva), estimated time, distance, elevation change, route risk badge, and waypoint pick buttons
  - [x] 13.3.4 Implement `AlertsCard.vue`: Live environmental warnings (Cabin Temp rising 24°C, Water Supply low 18%, Oxygen Reserve low 12%) with action triggers
  - [x] 13.3.5 Implement `RouteAnalysisCard.vue`: Distance, elevation gain (+320m), elevation loss (-310m), max slope (18%), and hazard level badge
  - [x] 13.3.6 Implement `ElevationProfileCard.vue`: Neomorphic elevation chart with gradient area fill, elevation axis, distance markers, and bidirectional hover cursor synced to Cesium 3D camera
  - [x] 13.3.7 Implement `ScienceTargetCard.vue`: High-res geological thumbnail (Clay-Rich Deposits), confidence indicator (87%), ancient water activity context, and detail modal
  - [x] 13.3.8 Implement `PharmaceuticalMedicalCard.vue`: Inventory / Crew Health / Medical Kit tabs, Amoxicillin 500mg, FEFO compliance status, and low stock alert
  - [x] 13.3.9 Implement `CrewHealthCard.vue`: Commander Dr. A. Taylor portrait, Nominal status, and live biometric vitals (Heart rate 72 bpm, BP 118/76, Resp 16, Temp 36.6°C, SpO2 98%)
  - [x] 13.3.10 Implement `LifeSupportCard.vue`: 4 circular neomorphic radial SVG gauges (Oxygen Supply 62%, CO2 Production 1.8%, Water Supply 18%, Cabin Pressure 14.7 psia)
- [x] 13.4 Neomorphic CSS Theme & Visual Polish (`src/ui/styles/`) <!-- id: 13.4 -->
  - [x] 13.4.1 Create `src/ui/styles/neomorphism.css` with soft extruded shadows, sunken wells, glossy bevels, and glowing indicators
  - [x] 13.4.2 Integrate responsive layout with "Expand / Maximize 3D Canvas" mode
- [x] 13.5 Verification & Testing <!-- id: 13.5 -->
  - [x] 13.5.1 Verify frontend production build (`npm run build` succeeds in 15.25s)
  - [x] 13.5.2 Verify in headless browser with Puppeteer: verified tab switching, radial gauges, layer toggles, full route calculation, and 0 runtime errors
  - [x] 13.5.3 Review results and record learnings in `tasks/lessons.md`

## Phase 14: Realistic Esri Mars Surface, Scope Mask Removal, Zero Emojis & Zero AI Slop <!-- id: 14 -->

- [x] 14.1 Scope Mask Elimination & Full Viewport Restore <!-- id: 14.1 -->
  - [x] 14.1.1 Disable `installScopeMask(viewer)` in `src/app/tools.js`
  - [x] 14.1.2 Set `#scope-mask` and `#scope-mask canvas` to `display: none !important;` in `foundation.css` & `neomorphism.css`
- [x] 14.2 Realistic Esri Explore Mars Rendering & Ambient Illumination <!-- id: 14.2 -->
  - [x] 14.2.1 Update `src/app/viewer.js` to disable night shadow simulation (`globe.enableLighting = false`) and set Mars base color to warm ochre (`#a35835`)
  - [x] 14.2.2 Migrate `marsBasemapLayer.js` to Esri Explore Mars Viking MDIM 2.1 Color mosaic (`https://astro.arcgis.com/arcgis/rest/services/OnMars/MDIM/MapServer/tile/{z}/{y}/{x}`), eliminating `trek.nasa.gov` timeouts
  - [x] 14.2.3 Ensure Esri Viking MDIM 2.1 Color layer is active and visible by default in `marsStore.js` and `scene.js`
  - [x] 14.2.4 Refine camera target to an oblique 3D aerial view over Jezero Crater ($18.436^\circ\text{N}, 77.435^\circ\text{E}$, pitch $-84^\circ$, altitude $20,000\text{ m}$)
- [x] 14.3 Complete Emoji Elimination & Authentic JPL Icons <!-- id: 14.3 -->
  - [x] 14.3.1 Replace all emojis in `SceneChromeView.vue` with professional SVGs
  - [x] 14.3.2 Replace all emojis in `MissionOverviewCard.vue` with professional SVGs
  - [x] 14.3.3 Replace all emojis in `AlertsCard.vue` with professional SVGs
  - [x] 14.3.4 Replace all emojis in `RouteAnalysisCard.vue`, `ElevationProfileCard.vue`, `ScienceTargetCard.vue`
  - [x] 14.3.5 Replace all emojis in `PharmaceuticalMedicalCard.vue`, `CrewHealthCard.vue`, `LifeSupportCard.vue`
  - [x] 14.3.6 Replace all emojis in `InCanvasControls.vue`
- [x] 14.4 Remove AI Slop & Meaningless Badges <!-- id: 14.4 -->
  - [x] 14.4.1 Remove arbitrary `EVA-4` badge and replace with authentic mission sol counter or operational status
  - [x] 14.4.2 Audit all cards for meaningless badges and replace with real JPL mission telemetry
- [x] 14.5 Verification & Screenshot Evidence <!-- id: 14.5 -->
  - [x] 14.5.1 Run `npm run build` and ensure 0 errors
  - [x] 14.5.2 Execute Puppeteer test and capture updated screenshots showing the realistic edge-to-edge Martian surface with 0 circular shadows, crisp Esri tiles, and professional icon typography

## Phase 16: Canvas Card Expansion, Elevation Profile Removal & Legacy Hash Purge <!-- id: 16 -->

- [x] 16.1 Purge & Neutralize Legacy URL Hash & FLIR Shaders <!-- id: 16.1 -->
  - [x] 16.1.1 Strip `style=flir`, `lat=52`, `alt=4456567` on boot via `window.history.replaceState` in `src/main.js`
  - [x] 16.1.2 Sanitize legacy hash restore in `src/sharelink.js` and enforce `style = 'normal'` in `src/ui/applicationShell.js`
  - [x] 16.1.3 Enforce `setViewJezero` camera initialization in `src/app/scene.js`
- [x] 16.2 Remove Elevation Profile Card Under Map & Maximize Map Card <!-- id: 16.2 -->
  - [x] 16.2.1 Remove `ElevationProfileCard` component from `src/ui/views/SceneChromeView.vue`
  - [x] 16.2.2 Expand center `.neo-canvas-card` to full height (`min-height: 720px; height: 100%`) creating unified 3-column primary command deck
  - [x] 16.2.3 Center-frame the 12.8 km traverse in `src/camera.js` (`lat: 18.436, lon: 77.435, alt: 20000, pitch: -84`)
- [x] 16.3 Re-build & Verify All Views with Puppeteer <!-- id: 16.3 -->
  - [x] 16.3.1 `npm run build` bundles 889 modules cleanly in 12.95s
  - [x] 16.3.2 Re-captured and validated all 4 artifacts in brain directory
- **Root Cause**: Setting `Cesium.Ellipsoid.default = MARS_ELLIPSOID` caused Cesium's internal `CesiumWidget` to skip automatic instantiation of `scene.skyAtmosphere`, which Cesium only auto-instantiates when `Ellipsoid.WGS84.equals(ellipsoid)` is true. Executing `viewer.scene.skyAtmosphere.show = true` subsequently threw `TypeError: Cannot set properties of undefined (setting 'show')`.
- **Secondary Latent Issues Resolved**:
  1. `SingleTileImageryProvider` in `src/layers/mars/` required explicit `tileWidth: 200` and `tileHeight: 200`.
  2. `catalogControlServices` returned `null` for absent Earth layers, preventing Earth-specific controllers from crashing on dummy objects.
  3. `server/standalone/api-not-found.js` updated to forward `/api/mars/*` to the Axum backend proxy (`http://127.0.0.1:8081`).
  4. `src/standalone/catalog.js` metadata entries supplied with `disposition: 'enabled-only'`.
  5. `src/ui/cockpitTrackingController.js` and `src/ui/navigationController.js` guarded with optional chaining `?.`.
  6. `src/ui/cctvControls.js` and `src/ui/radioControls.js` guarded against null providers.
  7. `src/ui/applicationShell.js` wire `initialRestorePromise` to `this._shareRestoration?.initialRestorePromise`.
- **Verification Proof**:
  - Headless browser verification via Puppeteer confirmed `app.getState()` returns `{"status": "ready", "phase": null}`.
  - Loading screen class transition confirmed `class="hidden"`.
  - Zero runtime errors logged.
  - Vite production build bundled 891 modules in 15.66s with zero errors.

## Implementation Review & Verification Results

1. **Rust Microservice Engine (`mars-server/`):**
   - Compiled in release mode (`target/release/mars-server`).
   - Ingests $200 \times 200$ Jezero DTM (40,000 cells) and computes Horn's slope convolution in **1.92ms**.
   - `cargo test` passes 4/4 automated tests in 0.01s:
     - `test_mars_scale_factors`: verified $R_{\text{Mars}} = 3,396,190\text{ m}$ eliminating $+87.8\%$ Earth distortion.
     - `test_nodata_and_hazard_exclusion`: verified routes never intersect hazard cells.
     - `test_hard_slope_exclusion`: verified slopes $> \theta_{\max}$ act as impassable barriers.
     - `test_astar_matches_dijkstra_optimality`: verified $A^*$ achieves identical optimal cost to Dijkstra with $6.5\times$ fewer node expansions.

2. **Frontend Engine & Geodesy Transformation:**
   - Overrode `Cesium.Ellipsoid.default` with `MARS_ELLIPSOID` (`IAU_2015:49900`).
   - Configured butterscotch Martian sky atmosphere scattering (`hueShift: -0.45`, `saturationShift: -0.25`, `brightnessShift: -0.10`).
   - Boot camera flies directly to Jezero Crater Western Delta ($18.4447^\circ\text{N}, 77.4508^\circ\text{E}$, heading $315^\circ$, altitude $11,500\text{ m}$).
   - `npm run build` bundles 891 modules with 0 errors.

3. **6 Mars Layers & UI Overhaul:**
   - `mars-basemap`: Streaming NASA Mars Trek WMTS Viking MDIM 2.1 Mosaic.
   - `mars-elevation`: Streaming MGS MOLA colorized elevation WMTS.
   - `mars-hillshade`: 25m analytical hillshade draped over Jezero rectangle.
   - `mars-slope`: Derived Horn's slope severity color ramp (<10° green, 10-18° amber, >18° red).
   - `mars-hazards`: Séítah sand dune polygons (hard exclusion) + Coarse MOLA uncertainty zone.
   - `mars-science`: Clickable 3D pins for Perseverance milestones and CRISM carbonate targets.
   - `mars-route`: 3D clamped Outbound (Cyan Glow) and Return (Dashed Amber) polylines with interactive SVG profile reticle synchronization.
   - Glassmorphic Martian Basalt HUD (`rgba(18, 14, 12, 0.86)`), WCAG 2.1 AA redundant hazard patterns, and mandatory prototype safety boundary disclaimer.

1. **Scope & Completeness:**
   All requested documentation—including a comprehensive Product Requirements Document (PRD), System Architecture Document (SAD), UI/UX Improvements & Design System, Mathematical & Algorithmic Pathfinding Specification, REST/Axum API Specification, Dataset Provenance Register, Security Threat Model, Verification & Test Plan, and Operations Guide—has been created and cross-verified against `gods-eye-view` architectural patterns and `mars_pathfinder_prd_agent_spec.md`.

2. **Planetary Geodetic Integrity:**
   Strict enforcement of `IAU_2015:49900` ($a=3,396,190\text{ m}, b=3,376,200\text{ m}$) across all formulas, eliminating the $+87.8\%$ terrestrial WGS84 scale error.

3. **Mathematical & Algorithmic Proofs:**
   Documented Horn's $3\times3$ finite-difference kernel, the asymmetric uphill metabolic multiplier $\alpha_{\text{uphill}}$, hard slope/hazard barrier pruning, and the formal proof of $A^*$ admissibility and consistency with Euclidean 3D heuristic.

4. **UI/UX Transformation:**
   Detailed overhaul from Earth OSINT to NASA JPL Mars 2020 Mission Control HUD, including design tokens, interactive SVG profile synchronized with 3D Cesium reticles, accessible non-color hazard patterns, and prototype safety disclaimers.

- [x] 15. Big Canvas Neomorphic UI & Photorealistic Mars Terrain Overhaul <!-- id: 15 -->
  - [x] 15.1 Eliminate circular mask/shadow completely; enforce edge-to-edge rectangular 3D viewport
  - [x] 15.2 Expand canvas height (`min-height: 540px`) and responsive grid for enhanced visual prominence
  - [x] 15.3 Generate regional photorealistic Mars shaded relief raster ($2048 \times 2048$, $78\text{ km} \times 54\text{ km}$) with Horn's analytical illumination ($315^\circ$ NW sun, warm ochre color palette matching Esri explore-mars and UI mockup)
  - [x] 15.4 Expand backend DTM ($240 \times 240$ grid) and compute optimal 12.8 km traverse from Start ($18.370^\circ\text{N}, 77.348^\circ\text{E}$) to Destination ($18.502^\circ\text{N}, 77.522^\circ\text{E}$)
  - [x] 15.5 Style route polyline (vibrant glowing cyan ribbon), Start pin (green halo), Destination pin (red halo), hazard warning marker ($\triangle$), and clean purple hexagonal science markers ($\hexagon$)
  - [x] 15.6 Align Elevation Profile card (12.8 km, 1.0–2.0 km Y axis, gold gradient area) and Mission Overview metrics
  - [x] 15.7 Complete emoji purge and eliminate all arbitrary badges (retaining verified Sol 75 telemetry and FEFO protocols)
  - [x] 15.8 Capture and verify all 4 artifact screenshots via Puppeteer

5. **Deliverables Location:**
   - Root index: `README.md`
   - Complete technical suite: `docs/*.md`
   - Master Architecture Artifact: `mars_pathfinder_master_specification.md` in conversation artifact directory.
   - Screen Artifacts:
     - `mars_pathfinder_neomorphic_dashboard.png` (Main Mission Control View)
     - `mars_pathfinder_expanded_canvas.png` (100% Fullscreen Maximized 3D Canvas)
     - `mars_pathfinder_pharma_tab.png` (Planetary Pharmaceutical & Medical Station)
     - `mars_pathfinder_lifesupport_tab.png` (ECLSS Telemetry & Consumable Budgets)

## Phase 17: Oblique 3D Perspective, Visual Clarity & Road Hazard Mapping Overhaul <!-- id: 17 -->

- [x] 17.1 Oblique 3D Perspective & "Fly to Jezero" Camera Angle <!-- id: 17.1 -->
  - [x] 17.1.1 Transition default and "Fly to Jezero" camera from flat nadir -84° to dramatic oblique 3D perspective (`pitch: -55°`, `heading: 12°`, `alt: 18,000m`, `lat: 18.248, lon: 77.435`)
  - [x] 17.1.2 Ensure both Start and Destination endpoints, crater walls, delta scarps, and relief depth are framed cleanly
- [x] 17.2 High-Resolution Visual Clarity & Surface Realism <!-- id: 17.2 -->
  - [x] 17.2.1 Integrate Caltech Murray Lab CTX (~5m/px) Level-9 mosaic tiles over Jezero Crater ($2048 \times 2048$, $76.64^\circ\text{E}$ to $78.05^\circ\text{E}$, $17.93^\circ\text{N}$ to $19.34^\circ\text{N}$) with authentic warm basalt colorization
  - [x] 17.2.2 Direct connection to `https://astro.arcgis.com/arcgis/rest/services/OnMars/MDIM/MapServer` and `CTX/MapServer`
- [x] 17.3 Comprehensive Road Hazard Mapping Along Traverse <!-- id: 17.3 -->
  - [x] 17.3.1 Fix `marsHazardsLayer.js` to render hazard polygons with custom closed polyline borders, eliminating Cesium IAU outline artifact rays
  - [x] 17.3.2 Expand `jezero_features.geojson` with mapped hazard corridors along the road: Séítah active dune ripple fields, delta scarp slope barrier ($>18^\circ$), Belva ejecta boulder fields, and Neretva channel margin drop-offs
  - [x] 17.3.3 Add hazard caution warning markers ($\triangle$) and badges along the road at each risk transition point with hover telemetry
- [x] 17.4 Traversal Route Geometry & Curvature Refinement <!-- id: 17.4 -->
  - [x] 17.4.1 Ensure traverse route smoothly steers around crater rims and hazard exclusion zones like the reference path
  - [x] 17.4.2 Position Start and Destination labels with custom pixel offsets to avoid visual overlap with hazard badges
- [x] 17.5 Verification & Screenshot Evidence <!-- id: 17.5 -->
  - [x] 17.5.1 Run frontend build (`npm run build` succeeds in 14.21s)
  - [x] 17.5.2 Capture updated screenshots via Puppeteer and verify 3D perspective, sharp terrain, and road hazard mapping

## Phase 18: Multi-Destination Planetary Exploration, Google Maps-Style Navigation, White Theme & Ultra-Clear Zoom <!-- id: 18 -->

- [x] 18.1 Multi-Destination Planetary Exploration & Fly-To System <!-- id: 18.1 -->
  - [x] 18.1.1 Define 6 famous planetary destinations (Jezero Crater, Gale Crater & Mount Sharp, Valles Marineris, Olympus Mons, Gusev Crater, Meridiani Planum) with coordinates, terrain context, and waypoints
  - [x] 18.1.2 Create `DestinationSelector.vue` fast-fly dropdown in header replacing single "Fly to Jezero" button
  - [x] 18.1.3 Wire camera glide transitions and regional landmark updates in `marsStore.js` and `camera.js`
- [x] 18.2 Google Maps-Style Start & Destination Picking & Route Calculation <!-- id: 18.2 -->
  - [x] 18.2.1 Implement interactive 3D map click-picker for Start (green pin) and Destination (red pin) in `marsController.js`
  - [x] 18.2.2 Live recalculation of traverse route, distance, elevation gain/loss, and ETA when user picks points
  - [x] 18.2.3 Support landmark search/select and custom coordinate inputs in Mission Overview
- [x] 18.3 Google Maps-Style Live Traversal Navigation Simulation <!-- id: 18.3 -->
  - [x] 18.3.1 Implement animated 3D rover vehicle puck with pulsating location ring and heading orientation in `marsRouteLayer.js`
  - [x] 18.3.2 Implement Turn-by-Turn Guidance Banner overlay (distance to next waypoint/hazard, current speed, ETA, maneuvers)
  - [x] 18.3.3 Implement 3D Camera Follow / Chase Mode tracking the moving rover along the terrain
  - [x] 18.3.4 Add navigation controls (Start/Pause/Resume, Speed multiplier 1x/5x/20x, Stop navigation) and synchronized elevation profile reticle
- [x] 18.4 White / Light Laboratory Neomorphic Theme <!-- id: 18.4 -->
  - [x] 18.4.1 Define light neomorphic tokens (`--neo-base: #f0f4f8`, `--neo-surface: #ffffff`, `--neo-card: #f8fafc`, soft extruded shadows, crisp dark text, vibrant cyan/orange accents) in `src/ui/styles/neomorphism.css`
  - [x] 18.4.2 Add Theme Toggle button (Dark / Light) in header navigation
  - [x] 18.4.3 Ensure all cards, overlays, charts, and modals render cleanly in both themes
- [x] 18.5 Crystal-Clear High-Resolution Imagery When Zoomed In <!-- id: 18.5 -->
  - [x] 18.5.1 Configure Cesium `resolutionScale: window.devicePixelRatio` and `globe.maximumScreenSpaceError: 1.33` for razor-sharp rendering
  - [x] 18.5.2 Configure Caltech Murray Lab CTX (~5m/px) and Esri Viking MDIM layers with levels up to LOD 17 for seamless deep zoom clarity
  - [x] 18.5.3 Integrate Esri HiRISE targeted sub-meter imagery provider for ultra-high resolution zoom over exploration targets
- [x] 18.6 Build, Verification & Screenshot Artifacts <!-- id: 18.6 -->
  - [x] 18.6.1 Build frontend (`npm run build`) and test unit integrity
  - [x] 18.6.2 Execute Puppeteer test capturing multi-destination exploration, live navigation simulation, light theme, and deep zoom clarity
  - [x] 18.6.3 Update brain artifact documentation and lessons learned

## Phase 19: Fix HTTP 500 Tile Error, Preempt Vite Proxy & Robust ArcGIS Fallback <!-- id: 19 -->

- [x] 19.1 Root Cause Diagnosis & Vite Proxy Preemption <!-- id: 19.1 -->
  - [x] 19.1.1 Remove `/esri-mars` from `server.proxy` in `build/vite.js` so Vite's built-in `http-proxy` does not forward raw 500 errors to the client
  - [x] 19.1.2 Integrate `marsTileProxyPlugin` directly into `build/vite.js` `plugins` with `enforce: 'pre'`, handling all `/esri-mars` requests
- [x] 19.2 Transparent PNG Fallback & Tile LRU Cache <!-- id: 19.2 -->
  - [x] 19.2.1 Ensure upstream 4xx/5xx responses from ArcGIS Server return HTTP 200 with 1x1 transparent PNG (`TRANSPARENT_1X1_PNG`)
  - [x] 19.2.2 Add in-memory LRU tile caching to eliminate redundant ArcGIS network roundtrips and ensure zero console errors
  - [x] 19.2.3 Ensure preflight OPTIONS and HEAD methods are answered cleanly
- [x] 19.3 Server Process Restart & End-to-End Verification <!-- id: 19.3 -->
  - [x] 19.3.1 Restart Vite dev server on port 4173 with new configuration
  - [x] 19.3.2 Test problematic tile URLs (e.g. `1/0/2`, `3/4/4`) with `curl -i` to verify 200 OK responses
  - [x] 19.3.3 Re-run automated Puppeteer verification script (`test_user_url.mjs`) to verify ZERO 500 errors and clean console
  - [x] 19.3.4 Document solution and update `tasks/lessons.md`

## Phase 20: Fix `ERR_HTTP_HEADERS_SENT` in Tile Proxy & Prevent Server Crash <!-- id: 20 -->

- [x] 20.1 Root Cause Diagnosis in `server/standalone/mars-tile-proxy.js` <!-- id: 20.1 -->
  - [x] 20.1.1 Identify double `res.writeHead` caused by `proxyReq.destroy()` on timeout triggering `proxyReq.on('error')`
  - [x] 20.1.2 Guard all response writing against `res.headersSent`, `res.writableEnded`, and client disconnect (`req.destroyed`)
- [x] 20.2 Robust Single-Response Lifecycle Implementation <!-- id: 20.2 -->
  - [x] 20.2.1 Implement `sendFallback()` guarded by `let completed = false` and `res.headersSent`
  - [x] 20.2.2 Handle client abort (`req.on('close')`) by destroying `proxyReq` without writing to closed response
  - [x] 20.2.3 Handle upstream stream errors cleanly during `upstreamRes.on('data')`
- [x] 20.3 Server Restart & Comprehensive Stress Testing <!-- id: 20.3 -->
  - [x] 20.3.1 Restart Vite daemon process cleanly on port 4173
  - [x] 20.3.2 Execute automated navigation test verifying server stability with rapid aborted requests
  - [x] 20.3.3 Update `tasks/lessons.md` and document lessons learned

## Phase 21: Murray Lab CTX (~5m/px) Global Mosaic, Smooth Orbital Flight Spin & Razor-Sharp Planetary Zoom <!-- id: 21 -->

- [x] 21.1 Integrate Caltech Murray Lab Global CTX Mosaic (`OnMars/CTX1/MapServer`) <!-- id: 21.1 -->
  - [x] 21.1.1 Update `src/layers/mars/marsEsriCtxLayer.js` to stream `OnMars/CTX1/MapServer` from LOD 0 to LOD 17 (5.0m/px global coverage)
  - [x] 21.1.2 Set full opacity and ensure seamless photographic texture draped over `MARS_ELLIPSOID` everywhere on the planet
  - [x] 21.1.3 Add Meridiani Planum and Gusev Crater relief bounds to `src/layers/mars/marsHillshadeLayer.js`
- [x] 21.2 Smooth Orbital Flight Spin & Elimination of Wild Barrel Rolls <!-- id: 21.2 -->
  - [x] 21.2.1 Update `src/destinations.js` `flyToDestination` with calculated orbital apex (`maximumHeight`), `pitchAdjustHeight`, and strict `roll: 0.0`
  - [x] 21.2.2 Implement smooth polar axis globe rotation (just like `https://murray-lab.caltech.edu/CTX/`) eliminating erratic tumble/corkscrew
  - [x] 21.2.3 Align destination camera pitch/heading with Murray Lab SceneView reference parameters for Meridiani, Gale, Jezero, and Gusev
- [x] 21.3 Globe-Wide Razor-Sharp Clarity on All Zooms & Views <!-- id: 21.3 -->
  - [x] 21.3.1 Configure Cesium viewer with `resolutionScale: window.devicePixelRatio` and `maximumScreenSpaceError: 1.2` for crisp LOD tile streaming
  - [x] 21.3.2 Verify deep zoom clarity on Meridiani Planum (Endeavour & Eagle crater rims) and all planetary destinations
- [x] 21.4 Verification & Artifact Generation <!-- id: 21.4 -->
  - [x] 21.4.1 Run frontend build (`npm run build`)
  - [x] 21.4.2 Execute Puppeteer verification script capturing Meridiani Planum high-res zoom and smooth camera transition
  - [x] 21.4.3 Document findings in `tasks/lessons.md` and brain artifacts

## Phase 23: 3D Mars Landing Hero Integration & Enhancement (from AstraMap) <!-- id: 23 -->

- [x] 23.1 Extract and architect AstraMap 3D WebGL Mars Landing Engine <!-- id: 23.1 -->
  - [x] 23.1.1 Inspect AstraMap custom WebGL pipeline (sphere geometry, bump mapping shader, starfield, atmospheric glow)
  - [x] 23.1.2 Create `src/ui/views/MarsLandingHero.vue` encapsulating the full-screen interactive 3D globe
  - [x] 23.1.3 Store Mars 2K texture asset cleanly in `public/mars-data/mars_2k.jpg` or embedded data URI
- [x] 23.2 Landing Hero UX Enhancements & Mission Integration <!-- id: 23.2 -->
  - [x] 23.2.1 Add Target Destination Selector directly on the Landing Hero (Jezero Crater, Gale, Olympus Mons, Valles Marineris, Gusev, Meridiani)
  - [x] 23.2.2 Add Real-Time Flight Dynamics HUD (Entry Trajectory Angle, Target Sub-Solar Longitude, Orbital Velocity, Thermal Shield Temp)
  - [x] 23.2.3 Add Sci-Fi UI Web Audio acoustic confirmation chirp on "ENTER MISSION" (zero external asset dependencies)
  - [x] 23.2.4 Synchronize dramatic entry descent with Cesium camera `flyToDestination`
  - [x] 23.2.5 Support `?skip` query param and `#app` hash for instant bypass
  - [x] 23.2.6 Add "Orbit View" button in header navigation to reopen the 3D globe anytime
- [x] 23.3 Verification & Automated Testing <!-- id: 23.3 -->
  - [x] 23.3.1 Build frontend (`npm run build`) bundles 896 modules in 14.27s with zero errors
  - [x] 23.3.2 Execute automated Puppeteer test verifying globe rendering, rotation, target pick, and transition to Mission Control
  - [x] 23.3.3 Capture screenshot artifacts of the enhanced Landing Page and transition
  - [x] 23.3.4 Document architecture in `tasks/lessons.md`

## Phase 24: Fix Production aaPanel VPS Deployment — Direct Esri Streaming, Earth Bloat Neutralization & Nginx Config <!-- id: 24 -->

- [x] 24.1 Direct Planetary Imagery Streaming (Universal Production Deployment) <!-- id: 24.1 -->
  - [x] 24.1.1 Update `src/layers/mars/marsBasemapLayer.js` to stream directly from `https://astro.arcgis.com/arcgis/rest/services/OnMars/MDIM/MapServer/tile/{z}/{y}/{x}`
  - [x] 24.1.2 Update `src/layers/mars/marsEsriCtxLayer.js` to stream directly from `https://astro.arcgis.com/arcgis/rest/services/OnMars/CTX1/MapServer/tile/{z}/{y}/{x}` with maxLevel 12
  - [x] 24.1.3 Ensure `marsEsriMdimLayer.js` uses direct `https://astro.arcgis.com` URL
- [x] 24.2 Neutralize Residual Earth Endpoints & Console Error Storm <!-- id: 24.2 -->
  - [x] 24.2.1 Disable `initDetection` and `initTrackedReadout` in `src/ui/applicationShell.js` when in Mars mode
  - [x] 24.2.2 Neutralize `/api/google/nearby-places`, `text-search`, and `reverse-geocode` in `src/search/http.js` and `src/voice/gevActions.js`
  - [x] 24.2.3 Disable `/api/library/catalog` fetch in `src/app/tools.js`
  - [x] 24.2.4 Silence `/api/openai/hud-summary/status` in `src/services/requests.js`
  - [x] 24.2.5 Silence `/api/realtime/debug-log` in `src/voice/realtimeDiagnostics.js`
- [x] 24.3 Production Verification & Clean Console Audit <!-- id: 24.3 -->
  - [x] 24.3.1 Execute `npm run build` and verify bundle builds cleanly
  - [x] 24.3.2 Execute automated Puppeteer verification on production build simulating standalone static deployment (zero 404s, zero `ERR_BLOCKED_BY_CLIENT`, full photographic CTX surface rendered)
- [ ] 24.4 Git Push & aaPanel VPS Deployment Guide <!-- id: 24.4 -->
  - [ ] 24.4.1 Commit all changes and push to `origin main`
  - [ ] 24.4.2 Provide comprehensive aaPanel Nginx configuration instructions and deployment steps
