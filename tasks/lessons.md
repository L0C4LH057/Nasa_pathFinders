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
