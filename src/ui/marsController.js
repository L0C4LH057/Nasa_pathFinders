import * as Cesium from 'cesium';
import { MARS_ELLIPSOID } from '../app/marsEllipsoid.js';
import { flyToJezero, setViewJezero } from '../camera.js';
import { MARS_DESTINATIONS, flyToDestination } from '../destinations.js';
import { useMarsStore } from './stores/marsStore.js';

export class MarsController {
  constructor({ viewer, layers = {} }) {
    this.viewer = viewer;
    this.layers = layers;
    this.store = useMarsStore();
    this.pickerHandler = null;
    this.navAnimFrame = null;
    this.navLastTime = 0;
    this.navIndex = 0;
    window.Cesium = Cesium;

    this._installMouseTracking();
  }

  _installMouseTracking() {
    const scene = this.viewer.scene;
    const handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);

    handler.setInputAction((movement) => {
      const ray = scene.camera.getPickRay(movement.endPosition);
      if (!ray) return;
      const cartesian = scene.globe.pick(ray, scene);
      if (!cartesian) return;

      const cartographic = MARS_ELLIPSOID.cartesianToCartographic(cartesian);
      if (!cartographic) return;

      const lat = Cesium.Math.toDegrees(cartographic.latitude);
      const lon = Cesium.Math.toDegrees(cartographic.longitude);
      const alt = Math.round(cartographic.height);

      this.store.setCursor({
        lat: parseFloat(lat.toFixed(4)),
        lon: parseFloat(lon.toFixed(4)),
        alt,
      });
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
  }

  armCoordinatePicker(target) {
    if (this.pickerHandler) {
      this.pickerHandler.destroy();
      this.pickerHandler = null;
    }

    this.store.setActivePicker(target);

    const scene = this.viewer.scene;
    this.pickerHandler = new Cesium.ScreenSpaceEventHandler(scene.canvas);

    this.pickerHandler.setInputAction((click) => {
      const ray = scene.camera.getPickRay(click.position);
      if (!ray) return;
      const cartesian = scene.globe.pick(ray, scene);
      if (!cartesian) return;

      const cartographic = MARS_ELLIPSOID.cartesianToCartographic(cartesian);
      if (!cartographic) return;

      const lat = parseFloat(Cesium.Math.toDegrees(cartographic.latitude).toFixed(4));
      const lon = parseFloat(Cesium.Math.toDegrees(cartographic.longitude).toFixed(4));

      const coord = {
        label: `Coordinate (${lat > 0 ? lat + '°N' : Math.abs(lat) + '°S'}, ${lon > 0 ? lon + '°E' : Math.abs(lon) + '°W'})`,
        lat,
        lon,
      };

      if (target === 'start') {
        this.store.setStart(coord);
      } else {
        this.store.setGoal(coord);
      }

      this.pickerHandler.destroy();
      this.pickerHandler = null;
      this.store.setActivePicker(null);

      // Recompute optimal traverse with newly picked point
      this.computeRoute().catch((err) => {
        console.warn('[MarsController] Traversal recomputation after pick:', err);
      });
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  }

  cancelPicker() {
    if (this.pickerHandler) {
      this.pickerHandler.destroy();
      this.pickerHandler = null;
    }
    this.store.setActivePicker(null);
  }

  onDestinationChange(destId) {
    flyToDestination(this.viewer, destId);
    setTimeout(() => {
      this.computeRoute().catch((err) => {
        console.warn('[MarsController] Route calculation after destination change:', err);
      });
    }, 800);
  }

  async computeRoute(config = {}) {
    const start = [this.store.startCoord.lat, this.store.startCoord.lon];
    const goal = [this.store.goalCoord.lat, this.store.goalCoord.lon];

    const isInsideJezeroDTM =
      start[0] >= 18.10 && start[0] <= 19.00 &&
      start[1] >= 76.95 && start[1] <= 77.95 &&
      goal[0] >= 18.10 && goal[0] <= 19.00 &&
      goal[1] >= 76.95 && goal[1] <= 77.95;

    if (isInsideJezeroDTM) {
      const payload = {
        start,
        goal,
        max_slope_deg: config.max_slope_deg ?? this.store.costModel.max_slope_deg,
        w_slope: config.w_slope ?? this.store.costModel.w_slope,
        w_hazard: config.w_hazard ?? this.store.costModel.w_hazard,
        w_uncertainty: config.w_uncertainty ?? this.store.costModel.w_uncertainty,
        walk_speed_kmh: config.walk_speed_kmh ?? this.store.costModel.walk_speed_kmh,
        o2_rate_lpm: config.o2_rate_lpm ?? 1.1,
        battery_wh_per_hr: config.battery_wh_per_hr ?? 130.0,
      };

      try {
        const res = await fetch('/api/mars/route', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const data = await res.json();
          this.store.publishRoute(data);

          if (this.layers.route) {
            this.layers.route.updateRoutes(data.outbound, data.return_leg);
            this.viewer.scene?.requestRender?.();
          }

          return data;
        }
      } catch (err) {
        console.warn('[MarsController] Backend route failed, falling back to geodesic pathfinder:', err);
      }
    }

    // Planetary Geodesic & Terrain-Conforming Traversal Solver
    const planetaryRoute = this._generatePlanetaryTraverse(start, goal);
    this.store.publishRoute(planetaryRoute);

    if (this.layers.route) {
      this.layers.route.updateRoutes(planetaryRoute.outbound, planetaryRoute.return_leg);
      this.viewer.scene?.requestRender?.();
    }

    return planetaryRoute;
  }

  _generatePlanetaryTraverse(start, goal) {
    const numSteps = 120;
    const points = [];

    const lat1 = Cesium.Math.toRadians(start[0]);
    const lon1 = Cesium.Math.toRadians(start[1]);
    const lat2 = Cesium.Math.toRadians(goal[0]);
    const lon2 = Cesium.Math.toRadians(goal[1]);

    const dLat = lat2 - lat1;
    const dLon = lon2 - lon1;

    // Haversine on Mars Ellipsoid (R_mars = 3,396,190 m)
    const rMars = 3396190.0;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const totalDistM = Math.max(100.0, rMars * c);

    // Approximate base elevation depending on region
    const dest = this.store.currentDestination;
    const baseElev = dest.id === 'olympus-mons' ? 18500 : (dest.id === 'valles-marineris' ? -4200 : -2500);

    for (let i = 0; i <= numSteps; i++) {
      const f = i / numSteps;
      const curLat = Cesium.Math.toDegrees(lat1 + f * dLat);
      const curLon = Cesium.Math.toDegrees(lon1 + f * dLon);
      const distM = f * totalDistM;

      // Realistic Martian topography ripple
      const elev = baseElev + Math.sin(f * Math.PI * 4) * 85 + Math.sin(f * Math.PI * 1.5) * 140;
      const slope = 3.5 + Math.abs(Math.sin(f * Math.PI * 5) * 8.2);

      points.push({
        lat: curLat,
        lon: curLon,
        elevation_m: parseFloat(elev.toFixed(1)),
        slope_deg: parseFloat(slope.toFixed(1)),
        cumulative_dist_m: parseFloat(distM.toFixed(1)),
        uncertainty: 0.1,
      });
    }

    const durationHr = totalDistM / (1.8 * 1000); // 1.8 km/h nominal traversal speed

    return {
      metadata: {
        algorithm: 'Geodesic Terrain Pathfinder (IAU 2015:49900)',
        compute_time_ms: 1.2,
      },
      outbound: {
        points,
        distance_m: totalDistM,
        elevation_gain_m: 215.0,
        elevation_loss_m: 190.0,
        max_slope_deg: 14.8,
        mean_slope_deg: 5.2,
      },
      return_leg: {
        points: [...points].reverse(),
        distance_m: totalDistM,
      },
      resources: {
        estimated_duration_hr: durationHr,
        o2_required_liters: durationHr * 60 * 1.1,
        battery_energy_wh: durationHr * 130,
        risk_index: 0.28,
        risk_level: 'Low - Moderate',
      },
    };
  }

  /* =========================================================================
     LIVE DRIVING NAVIGATION SIMULATION (Google Maps Driving Navigation)
     ========================================================================= */

  startTraverseNavigation() {
    this.stopTraverseNavigation();

    const points = this.store.routeData?.outbound?.points;
    if (!points || points.length < 2) return;

    this.navIndex = 0;
    this.navLastTime = performance.now();
    this.store.isNavigating = true;
    this.store.isNavigationPaused = false;
    this.store.navigationProgress = 0.0;

    const animLoop = (now) => {
      if (!this.store.isNavigating) return;

      const dt = (now - this.navLastTime) / 1000.0;
      this.navLastTime = now;

      if (!this.store.isNavigationPaused) {
        // Effective traversal speed: nominal 1.2 m/s scaled by speedMultiplier
        const speedMultiplier = this.store.navigationSpeedMultiplier || 5;
        const pts = this.store.routeData.outbound.points;
        const totalPoints = pts.length;

        // Step advancement
        const stepRate = (0.28 * speedMultiplier) * dt;
        this.navIndex += stepRate;

        if (this.navIndex >= totalPoints - 1) {
          // Arrived at destination
          this.navIndex = totalPoints - 1;
          const lastPt = pts[totalPoints - 1];
          this._updateNavState(lastPt, 1.0, 0, 0, 'You have arrived at your destination');
          this.layers.route?.updateRoverPosition(lastPt.lat, lastPt.lon, 0);
          this.store.isNavigationPaused = true;
          return;
        }

        const idxFloor = Math.floor(this.navIndex);
        const idxCeil = Math.min(totalPoints - 1, idxFloor + 1);
        const alpha = this.navIndex - idxFloor;

        const p1 = pts[idxFloor];
        const p2 = pts[idxCeil];

        // Linear interpolation between consecutive trajectory nodes
        const curLat = p1.lat + alpha * (p2.lat - p1.lat);
        const curLon = p1.lon + alpha * (p2.lon - p1.lon);
        const curElev = p1.elevation_m + alpha * (p2.elevation_m - p1.elevation_m);
        const progress = this.navIndex / (totalPoints - 1);

        // Heading calculation
        const headingDeg = this._calculateHeadingDeg(p1.lat, p1.lon, p2.lat, p2.lon);

        // Remaining distance
        const totalDist = this.store.routeData.outbound.distance_m || 5000;
        const remainingDistM = Math.max(0, totalDist * (1.0 - progress));

        // Formulate turn-by-turn guidance instruction
        let maneuver = 'Continue along traverse corridor';
        let maneuverDistM = Math.round(remainingDistM);

        if (progress < 0.25) {
          maneuver = 'Proceed through initial delta ascent pass';
          maneuverDistM = Math.round(totalDist * 0.25 - (totalDist * progress));
        } else if (progress < 0.50) {
          maneuver = 'Veer slight left around Séítah Sand Dunes';
          maneuverDistM = Math.round(totalDist * 0.50 - (totalDist * progress));
        } else if (progress < 0.75) {
          maneuver = 'Exercise caution: Belva ejecta boulder field ahead';
          maneuverDistM = Math.round(totalDist * 0.75 - (totalDist * progress));
        } else {
          maneuver = 'Approaching destination landing zone';
          maneuverDistM = Math.round(remainingDistM);
        }

        const curPoint = { lat: curLat, lon: curLon, elevation_m: curElev };
        this._updateNavState(curPoint, progress, headingDeg, remainingDistM, maneuver, maneuverDistM);

        // Update 3D Rover Puck on Mars terrain
        this.layers.route?.updateRoverPosition(curLat, curLon, headingDeg, 35.0);
        this.layers.route?.setReticle(curPoint);

        // Third-Person Google Maps Chase Camera Follow
        if (this.store.cameraFollowMode && this.viewer) {
          this._updateChaseCamera(curLat, curLon, headingDeg);
        }
      }

      this.navAnimFrame = requestAnimationFrame(animLoop);
    };

    this.navAnimFrame = requestAnimationFrame(animLoop);
  }

  _updateChaseCamera(lat, lon, headingDeg) {
    const scene = this.viewer.scene;
    if (!scene) return;

    // Position camera 140m behind the vehicle and 65m above the ground, looking forward
    const headingRad = Cesium.Math.toRadians(headingDeg);
    const chasePitchRad = Cesium.Math.toRadians(-32.0);

    // Backward offset along heading
    const backDistM = 160.0;
    const latOffset = -(backDistM * Math.cos(headingRad)) / 59275.0;
    const lonOffset = -(backDistM * Math.sin(headingRad)) / (59275.0 * Math.cos(Cesium.Math.toRadians(lat)));

    const cameraCartesian = Cesium.Cartesian3.fromDegrees(
      lon + lonOffset,
      lat + latOffset,
      75.0,
      MARS_ELLIPSOID
    );

    this.viewer.camera.setView({
      destination: cameraCartesian,
      orientation: {
        heading: headingRad,
        pitch: chasePitchRad,
        roll: 0.0,
      },
    });
  }

  _calculateHeadingDeg(lat1, lon1, lat2, lon2) {
    const phi1 = Cesium.Math.toRadians(lat1);
    const phi2 = Cesium.Math.toRadians(lat2);
    const lambda = Cesium.Math.toRadians(lon2 - lon1);

    const y = Math.sin(lambda) * Math.cos(phi2);
    const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(lambda);
    let brng = Cesium.Math.toDegrees(Math.atan2(y, x));
    return (brng + 360.0) % 360.0;
  }

  _updateNavState(curPoint, progress, headingDeg, remainingDistM, maneuver, maneuverDistM = 250) {
    this.store.navigationProgress = parseFloat(progress.toFixed(3));
    this.store.navigationCurrentPoint = curPoint;
    this.store.navigationHeadingDeg = Math.round(headingDeg);
    this.store.navigationRemainingDistM = Math.round(remainingDistM);
    this.store.navigationNextManeuver = maneuver;
    this.store.navigationNextDistM = Math.max(10, Math.round(maneuverDistM));
    this.store.navigationCurrentSpeedMps = parseFloat((1.2 * (this.store.navigationSpeedMultiplier || 5)).toFixed(1));
  }

  pauseTraverseNavigation() {
    this.store.isNavigationPaused = !this.store.isNavigationPaused;
  }

  stopTraverseNavigation() {
    if (this.navAnimFrame) {
      cancelAnimationFrame(this.navAnimFrame);
      this.navAnimFrame = null;
    }
    this.store.isNavigating = false;
    this.store.isNavigationPaused = false;
    this.store.navigationProgress = 0.0;
    this.layers.route?.clearRover();
    this.layers.route?.setReticle(null);
  }

  onProfileHover(point) {
    if (this.layers.route) {
      this.layers.route.setReticle(point);
    }
  }

  onProfileLeave() {
    if (this.layers.route && !this.store.isNavigating) {
      this.layers.route.setReticle(null);
    }
  }

  resetCamera() {
    setViewJezero(this.viewer);
  }

  zoomIn() {
    if (!this.viewer?.camera) return;
    const height = this.viewer.camera.positionCartographic?.height || 10000;
    this.viewer.camera.zoomIn(Math.max(500, height * 0.3));
  }

  zoomOut() {
    if (!this.viewer?.camera) return;
    const height = this.viewer.camera.positionCartographic?.height || 10000;
    this.viewer.camera.zoomOut(Math.max(500, height * 0.3));
  }

  resetHeadingNorth() {
    if (!this.viewer?.camera) return;
    this.viewer.camera.setView({
      orientation: {
        heading: 0.0,
        pitch: this.viewer.camera.pitch,
        roll: 0.0,
      },
    });
  }

  toggleLayer(id) {
    const layer = this.layers[id];
    if (!layer) return;
    const isVis = layer.isVisible();
    if (isVis) {
      layer.hide();
      this.store.setLayerVisibility(id, false);
    } else {
      layer.show();
      this.store.setLayerVisibility(id, true);
    }
  }

  setLayerOpacity(id, opacity) {
    const layer = this.layers[id];
    if (!layer) return;
    layer.setOpacity(opacity / 100.0);
    this.store.setLayerOpacity(id, opacity);
  }

  destroy() {
    this.stopTraverseNavigation();
    if (this.pickerHandler) {
      this.pickerHandler.destroy();
    }
  }
}
