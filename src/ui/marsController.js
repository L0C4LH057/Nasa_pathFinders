import * as Cesium from 'cesium';
import { MARS_ELLIPSOID } from '../app/marsEllipsoid.js';
import { flyToJezero, setViewJezero } from '../camera.js';
import { useMarsStore } from './stores/marsStore.js';

export class MarsController {
  constructor({ viewer, layers = {} }) {
    this.viewer = viewer;
    this.layers = layers;
    this.store = useMarsStore();
    this.pickerHandler = null;
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

      // Boundary check: Jezero pilot grid is [18.36, 18.52] N, [77.34, 77.54] E
      if (lat < 18.36 || lat > 18.52 || lon < 77.34 || lon > 77.54) {
        alert(`Selected coordinate [${lat}°, ${lon}°] is outside the high-resolution Jezero DTM boundary [18.36°-18.52°N, 77.34°-77.54°E].`);
        return;
      }

      const coord = {
        label: `Picked Coordinate (${lat}°, ${lon}°)`,
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
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  }

  cancelPicker() {
    if (this.pickerHandler) {
      this.pickerHandler.destroy();
      this.pickerHandler = null;
    }
    this.store.setActivePicker(null);
  }

  async computeRoute(config = {}) {
    const start = [this.store.startCoord.lat, this.store.startCoord.lon];
    const goal = [this.store.goalCoord.lat, this.store.goalCoord.lon];

    const payload = {
      start,
      goal,
      max_slope_deg: config.max_slope_deg ?? 18.0,
      w_slope: config.w_slope ?? 3.5,
      w_hazard: config.w_hazard ?? 6.0,
      w_uncertainty: config.w_uncertainty ?? 4.0,
      walk_speed_kmh: config.walk_speed_kmh ?? 2.4,
      o2_rate_lpm: config.o2_rate_lpm ?? 1.1,
      battery_wh_per_hr: config.battery_wh_per_hr ?? 130.0,
    };

    try {
      const res = await fetch('/api/mars/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const problem = await res.json();
        throw new Error(problem.detail || 'Route calculation failed');
      }

      const data = await res.json();
      this.store.publishRoute(data);

      if (this.layers.route) {
        this.layers.route.updateRoutes(data.outbound, data.return_leg);
        this.viewer.scene?.requestRender?.();
      }

      return data;
    } catch (err) {
      console.error('[MarsController] Error computing route:', err);
      alert(`Pathfinding error: ${err.message}`);
      throw err;
    }
  }

  onProfileHover(point) {
    if (this.layers.route) {
      this.layers.route.setReticle(point);
    }
  }

  onProfileLeave() {
    if (this.layers.route) {
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
    if (this.pickerHandler) {
      this.pickerHandler.destroy();
    }
  }
}
