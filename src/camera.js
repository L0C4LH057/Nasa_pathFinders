import * as Cesium from 'cesium';
import { MARS_ELLIPSOID } from './app/marsEllipsoid.js';

export const JEZERO_COORDINATES = Object.freeze({
  lon: 77.4350,
  lat: 18.4360,
  altitude: 20000.0,
  headingDeg: 0.0,
  pitchDeg: -84.0,
});

/**
 * Reset camera view to Jezero Crater Western Delta on the Martian Ellipsoid.
 */
export function setViewJezero(viewer) {
  const dest = Cesium.Cartesian3.fromDegrees(
    JEZERO_COORDINATES.lon,
    JEZERO_COORDINATES.lat,
    JEZERO_COORDINATES.altitude,
    MARS_ELLIPSOID,
  );
  viewer.camera.setView({
    destination: dest,
    orientation: {
      heading: Cesium.Math.toRadians(JEZERO_COORDINATES.headingDeg),
      pitch: Cesium.Math.toRadians(JEZERO_COORDINATES.pitchDeg),
      roll: 0.0,
    },
  });
}

/**
 * Fly camera to Jezero Crater Western Delta pilot region.
 */
export function flyToJezero(viewer, { duration = 2.0 } = {}) {
  const dest = Cesium.Cartesian3.fromDegrees(
    JEZERO_COORDINATES.lon,
    JEZERO_COORDINATES.lat,
    JEZERO_COORDINATES.altitude,
    MARS_ELLIPSOID,
  );
  viewer.camera.flyTo({
    destination: dest,
    orientation: {
      heading: Cesium.Math.toRadians(JEZERO_COORDINATES.headingDeg),
      pitch: Cesium.Math.toRadians(JEZERO_COORDINATES.pitchDeg),
      roll: 0.0,
    },
    duration,
    easingFunction: Cesium.EasingFunction.CUBIC_IN_OUT,
  });
}

/**
 * Boot camera flight to Jezero Crater (replacing legacy Earth Austin flight).
 */
export function flyToAustin(viewer) {
  setViewJezero(viewer);
  return () => {};
}
