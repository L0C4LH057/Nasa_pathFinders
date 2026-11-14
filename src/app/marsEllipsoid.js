import * as Cesium from 'cesium';

/**
 * IAU 2015 Mars Triaxial Reference Ellipsoid
 * Authority: IAU_2015:49900
 * Semi-major equatorial radius: 3,396,190.0 m
 * Semi-minor polar radius: 3,376,200.0 m
 */
export const MARS_EQUATORIAL_RADIUS_M = 3396190.0;
export const MARS_POLAR_RADIUS_M = 3376200.0;

export const MARS_ELLIPSOID = Object.freeze(
  new Cesium.Ellipsoid(
    MARS_EQUATORIAL_RADIUS_M,
    MARS_EQUATORIAL_RADIUS_M,
    MARS_POLAR_RADIUS_M
  )
);

// Override Cesium's default WGS84 ellipsoid globally
Cesium.Ellipsoid.default = MARS_ELLIPSOID;
