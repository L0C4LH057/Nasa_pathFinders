# Lessons Learned — Mars Pathfinder

## 1. Cesium Planetary Geodesy & SkyAtmosphere Initialization
- **Problem**: Setting `Cesium.Ellipsoid.default = MARS_ELLIPSOID` causes Cesium's internal `CesiumWidget` to skip automatic instantiation of `scene.skyAtmosphere` (Cesium only instantiates `new SkyAtmosphere()` if `Ellipsoid.WGS84.equals(ellipsoid)` is true). Any downstream code attempting `viewer.scene.skyAtmosphere.show = true` throws `TypeError: Cannot set properties of undefined (setting 'show')`.
- **Pattern / Solution**: When overriding the default reference ellipsoid to an extraterrestrial planetary body (e.g., `IAU_2015:49900`), explicitly pass `skyAtmosphere: new Cesium.SkyAtmosphere(MARS_ELLIPSOID)` in `Cesium.Viewer` options, and defensively guard `viewer.scene.skyAtmosphere` and `viewer.scene.globe` before modifying their properties.

## 2. Cesium SingleTileImageryProvider Tile Dimensions
- **Problem**: In Cesium 1.104+, instantiating `new Cesium.SingleTileImageryProvider(options)` requires explicit `tileWidth` and `tileHeight` numbers (`Check.typeOf.number("options.tileWidth", options.tileWidth)`).
- **Pattern / Solution**: Always pass `tileWidth` and `tileHeight` (e.g., matching raster dimensions such as `200`) when creating `SingleTileImageryProvider` instances.

## 3. Layer Catalog Disposition Serialization
- **Problem**: `LayerLifecycle.prototype.finalizeRegistrations` requires every metadata entry to specify a valid disposition (`VALID_LAYER_SERIALIZATION_DISPOSITIONS`: `enabled-only`, `enabled+options`, `enabled+mirrored-options`, `local-only`). Omitting `disposition` throws `Error: Layer serialization disposition is incomplete`.
- **Pattern / Solution**: Ensure catalog metadata objects always include a valid `disposition: 'enabled-only'`.

## 4. Optional Chaining on Domain Subsystem Services
- **Problem**: In modular multi-domain applications where certain subsystem layers (Earth ADSB, CCTV, FM radio, wildlife sightings) are excluded or absent, downstream controllers must never assume those services exist without optional chaining (`this.services.flightsLayer?.getTrackedInfo?.()`).
- **Pattern / Solution**: Guard all calls to optional subsystem services with optional chaining `?.` and return sensible fallbacks (`null` or empty arrays).

## 5. API Proxying vs Middleware Handlers in Dev Server
- **Problem**: Middleware plugins that catch `/api` routes (such as `api-not-found`) must explicitly call `next()` for proxied backend prefixes (`/api/mars/*`) so that Vite's reverse proxy can forward them to microservices (`127.0.0.1:8081`).
- **Pattern / Solution**: Always check if incoming URLs match upstream microservice prefixes before terminating with a 404 handler.

## 6. ArcGIS Planetary Tiling Scheme & UrlTemplateImageryProvider
- **Problem**: `Cesium.ArcGisMapServerImageryProvider.fromUrl` fails when parsing non-standard planetary spatial references (`wkid: 104971` for Martian Sphere $R=3,396,190\text{ m}$) without custom projection engine definitions.
- **Pattern / Solution**: Use `Cesium.UrlTemplateImageryProvider` with direct tile URL templates (`https://astro.arcgis.com/arcgis/rest/services/OnMars/{SERVICE}/MapServer/tile/{z}/{y}/{x}`), configured with `tilingScheme: new Cesium.GeographicTilingScheme({ ellipsoid: MARS_ELLIPSOID, numberOfLevelZeroTilesX: 2, numberOfLevelZeroTilesY: 1 })`. Add `provider.errorEvent.addEventListener(e => { e.retry = false; })` to gracefully handle edge tiles beyond high-resolution footprints.

## 7. WebGL Canvas Sizing in Neomorphic Flex/Grid Layouts
- **Problem**: Mounting `#cesiumContainer` inside responsive neomorphic cards can result in incorrect initial WebGL canvas aspect ratios if parent dimensions change after mount or during fullscreen expansion.
- **Pattern / Solution**: Wrap `#cesiumContainer` in an absolute container with `ResizeObserver` observing dimension updates, and call `viewer.resize()` on nextTick whenever expanding or restoring canvas view modes.

## 8. SVG Chart Normalization with Extraterrestrial Negative Altitudes
- **Problem**: Terrestrial charts often assume elevations are positive above sea level. In Martian basins like Jezero Crater, altitudes are negative (e.g., $-2550\text{ m}$ to $-2420\text{ m}$ relative to the MOLA datum). Hardcoded altitude boundaries cause `NaN` coordinates or inverted SVG paths.
- **Pattern / Solution**: Compute dynamic bounding boxes directly from traversal waypoint coordinates (`Math.min(...pts.map(p => p.elevation_m))` and `Math.max(...)`) and normalize distances using `cumulative_dist_m / 1000.0`.

## 9. Camera Coordinate Projections & Pitch-Dependent Clipping in Cesium
- **Problem**: When tilting a perspective camera to an oblique angle (e.g. pitch $-65^\circ$ to $-80^\circ$ looking North), points south of the camera position fall behind the viewport frustum and are clipped off the bottom of the canvas.
- **Pattern / Solution**: Calculate camera placement mathematically using `Cesium.SceneTransforms.worldToWindowCoordinates(scene, pos)` to ensure all route endpoints (Start at $(x_1, y_1)$ and Goal at $(x_2, y_2)$) project cleanly onto the visible screen viewport without relying on guesswork.

## 10. Regional Shaded Relief Coverage & Seamless Edge Blending
- **Problem**: Draping a local high-resolution terrain texture with tight geographic bounds (e.g. $0.5^\circ \times 0.4^\circ$) results in harsh rectangular boundary seams when the camera is at high operational altitudes (20–25 km).
- **Pattern / Solution**: Expand the regional terrain raster bounds (e.g. $1.3^\circ \times 0.9^\circ \approx 78\text{ km} \times 54\text{ km}$) to exceed the maximum camera field of view, apply analytical Horn's shaded relief with warm ochre color mapping, and add a feathered alpha border ramp to smoothly blend into the underlying planetary globe base color.

## 11. Legacy URL Hash Restoration & Post-Processing Shader Sanitization
- **Problem**: When users launch the app with a bookmarked or history URL containing legacy hash parameters from previous templates (e.g., `#/v=2&lat=52.2776&lon=154.2437&alt=4456567...&style=flir`), the app deserializes the hash on boot, setting the camera 4,456 km away in outer space and activating the FLIR thermal shader stage (purple/yellow distortion).
- **Pattern / Solution**: 
  1. Inspect the URL hash on application startup in `main.js` and immediately purge legacy parameters (`style=`, `lat=52`, `alt=44`, `flir`) via `window.history.replaceState`.
  2. In `sharelink.js`, abort hash deserialization if legacy parameters are detected.
  3. In `applicationShell.js`, enforce `state.style = 'normal'` on state restoration.
  4. Always explicitly invoke `setViewJezero(viewer)` on initial scene readiness to mount the camera directly over the target Martian terrain.

## 12. Preempting Vite's Built-in Proxy for Upstream 500 Sanitization
- **Problem**: When proxying third-party tile APIs (such as Esri's `astro.arcgis.com/arcgis/rest/services/OnMars/CTX/MapServer/tile/{z}/{y}/{x}`), missing tiles or out-of-bounds zoom requests respond with raw Apache `500 Internal Server Error` pages without CORS headers. If `/esri-mars` is defined in Vite's `server.proxy`, Vite's internal `http-proxy` passes upstream 500s directly to the client browser, logging `Failed to load resource: the server responded with a status of 500 (Internal Server Error)`.
- **Pattern / Solution**:
  1. Remove the prefix from `server.proxy` in `build/vite.js` so Vite does not blindly pipe upstream 500s.
  2. Implement an `enforce: 'pre'` custom Vite middleware plugin (`marsTileProxyPlugin`) that intercepts all tile requests.
  3. When the upstream responds with 200, stream the image and cache in an in-memory LRU cache (`Map<string, { buffer, contentType }>`).
  4. When the upstream responds with anything non-200 (500, 404, 400) or times out, convert it into an `HTTP 200 OK` response with `Content-Type: image/png` returning a 1x1 transparent PNG (`TRANSPARENT_1X1_PNG`).
  5. Always answer preflight `OPTIONS` and `HEAD` requests cleanly. Cesium renders missing tiles as transparent without error, and the browser console remains 100% clean.

## 13. Node.js HTTP Proxy Socket Lifecycle and `ERR_HTTP_HEADERS_SENT` Prevention
- **Problem**: In custom Node.js HTTP proxy middleware, invoking `proxyReq.destroy()` on a request timeout triggers a socket close event that synchronously or asynchronously emits `error` on `proxyReq`. If both the `timeout` handler and `error` handler attempt to write fallback headers via `res.writeHead(...)`, Node throws `ERR_HTTP_HEADERS_SENT: Cannot write headers after they are sent to the client`, crashing the dev server process. Additionally, when a user rapidly pans the 3D globe, the browser aborts pending image fetches, closing the incoming socket (`req.on('close')`).
- **Pattern / Solution**:
  1. Guard every response write through an atomic `sendResponse(statusCode, headers, body)` helper that checks `let completed = false;` as well as `res.headersSent` and `res.writableEnded`. Once written, mark `completed = true`.
  2. In `req.on('close')`, immediately set `completed = true` and destroy the upstream `proxyReq` safely inside `try/catch` without attempting to write to the dead client response.
  3. In `proxyReq.on('timeout')`, call `proxyReq.destroy()` safely and delegate fallback delivery to `sendFallback()` guarded by `completed`.
  4. In `proxyReq.on('error')` and `upstreamRes.on('error')`, invoke `sendFallback()`. If already responded or aborted, `sendFallback()` safely no-ops.

## 14. Planetary Cross-Continent Camera Flights: Eliminating Barrel Rolls & Matching Murray Lab CTX Orbital Arc
- **Problem**: When flying long planetary distances (e.g. from Jezero $77^\circ\text{E}$ to Meridiani $-5.4^\circ\text{W}$, $\sim 4,800\text{ km}$ across Mars), Cesium's default `camera.flyTo` interpolates orientation using quaternion SLERP in camera-space. Because the planetary East-North-Up coordinate frame rotates around the planetary polar axis as longitude shifts, this raw SLERP results in an erratic, dizzying propeller spin / barrel roll high in the sky.
- **Pattern / Solution**:
  1. Set `pitchAdjustHeight: 45000` (45 km). When above 45 km, Cesium automatically locks camera pitch to nadir ($-90^\circ$, looking straight down at the planet surface) and locks `roll: 0.0`. This allows the red planet to rotate naturally around its polar axis beneath the camera with zero tumble.
  2. Dynamically calculate great-circle surface distance $D$ on `MARS_ELLIPSOID` and set an orbital apex `maximumHeight = min(2200000, max(currentAlt, dest.altitude, D * 320))` with `easingFunction: Cesium.EasingFunction.CUBIC_IN_OUT`.
  3. As the camera descends through 45 km into the destination valley, it smoothly tilts from nadir into the target oblique pitch ($-55^\circ$) and aligns with destination heading, matching the exact majestic orbital transition of Caltech Murray Lab CTX SceneView.
  4. Stream Caltech Murray Lab CTX1 Mosaic (`OnMars/CTX1/MapServer`) at 100% opacity for global 5.0m/px clarity at all altitudes.

## 15. Tile Pyramid Limits, Native Upsampling & Preserving Authentic Surface Mosaics
- **Problem**:
  1. Setting `maximumLevel: 17` on `OnMars/CTX1/MapServer` caused Cesium to request tiles at levels 13–17. However, the server's pre-rendered tile cache only extends to Level 12 ($~5.08\text{ m/px}$). Requests for levels 13–17 returned HTTP 400 Bad Request. The tile proxy converted these into 1x1 transparent PNG fallbacks, replacing the photographic surface with black void when zooming in closer than 15 km altitude. Furthermore, transient upstream errors were previously saved in the LRU tile cache, causing permanent transparent tile holes.
  2. Procedural single-tile relief rasters (`SingleTileImageryProvider`) generated via Python scripts (`olympus_shaded_relief.png`, `valles_shaded_relief.png`, `gusev_shaded_relief.png`) pasted artificial, low-resolution brownish clay rectangles over destinations, destroying the uniform, seamless photographic Context Camera appearance.
- **Pattern / Solution**:
  1. Clamp `marsEsriCtxLayer.js` to `maximumLevel: 12`. When zooming closer than Level 12 down to surface level (100m altitude), Cesium automatically performs texture-coordinate upsampling of Level 12 tiles onto deeper terrain levels without sending requests for non-existent LODs 13–17.
  2. Never store 4xx/5xx transparent fallbacks into the LRU `tileCache`. Only valid 200 OK image buffers should be cached, allowing transient network glitches to recover on the next frame.
  3. Set `globe.baseColor = '#a35835'` (warm Martian ochre) so that even during network latency, tiles never flash black.
  4. Completely purge synthetic single-tile procedural hillshade images from active imagery providers. Let the authentic, uniform, photorealistic Caltech Murray Lab CTX Global Mosaic (~5m/px) render seamlessly everywhere on Mars with zero clay patches.

## 16. WebGL Landing Globe Integration & Cinematic Atmospheric Entry Transition
- **Problem**: The project needed an immersive, full-screen interactive 3D landing page based on AstraMap, allowing users to inspect the red planet in orbit before diving into Mission Control, while improving upon the prototype with multi-destination targeting, real-time orbital flight telemetry, zero external audio asset dependencies, and synchronized Cesium handoff.
- **Pattern / Solution**:
  1. Implemented [MarsLandingHero.vue](file:///home/localhost/projects/colab/NASA/pathfinder/src/ui/views/MarsLandingHero.vue) with a lightweight custom WebGL pipeline:
     - 16,384-triangle UV sphere geometry ($128 \times 64$).
     - Luminance-gradient bump mapping and multi-band atmospheric rim glow shaders.
     - 950-point twinkling starfield background.
     - Equirectangular $2048 \times 1024$ photographic Mars texture loaded from `public/mars-data/mars_2k.jpg`.
  2. Implemented multi-destination targeting right on the landing page:
     - User can click any of the 6 planetary destinations (Jezero Crater, Olympus Mons, Valles Marineris, Gale Crater, Gusev Crater, Meridiani Planum).
     - Clicking a destination smoothly rotates the 3D globe to bring that site's exact longitude ($-\text{lon}$) and latitude ($\text{lat}$) into front view.
  3. Integrated Web Audio API frequency sweep oscillator ($440\text{ Hz} \to 880\text{ Hz} \to 1320\text{ Hz}$) on "ENTER MISSION" providing crisp sci-fi acoustic feedback without any external audio files.
  4. Synchronized atmospheric entry descent: `dist` dives from $4.6$ down to $1.07$, the `uEntry` heating glow shader blends in fiery orange plasma, and Cesium simultaneously initiates camera trajectory glide in the background, smoothly transitioning into the Mission Control dashboard.
  5. Added "Orbit View" header navigation button allowing operators to seamlessly return to the 3D rotating globe anytime. Added `?skip` query and `#app` hash bypass for developers and automated tests.
