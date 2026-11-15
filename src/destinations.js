import * as Cesium from 'cesium';
import { MARS_ELLIPSOID } from './app/marsEllipsoid.js';

export const MARS_DESTINATIONS = [
  {
    id: 'jezero',
    name: 'Jezero Crater',
    subtitle: 'Perseverance & Ingenuity (2021)',
    category: 'Paleolake Delta Fan',
    lat: 18.2480,
    lon: 77.4350,
    altitude: 18000.0,
    headingDeg: 12.0,
    pitchDeg: -55.0,
    description: 'Ancient paleolake delta fan rich in clay and carbonate minerals with active Séítah sand ripples and Neretva Vallis breach.',
    defaultStart: { label: 'Start (Jezero Delta)', lat: 18.435, lon: 77.425 },
    defaultGoal: { label: 'Destination (Neretva Region)', lat: 18.490, lon: 77.490 },
    waypoints: [
      { label: 'Start (Jezero Delta)', lat: 18.435, lon: 77.425 },
      { label: 'Destination (Neretva Region)', lat: 18.490, lon: 77.490 },
      { label: 'Octavia E. Butler Landing Site', lat: 18.4447, lon: 77.4508 },
      { label: 'Séítah Sand Dune Margin', lat: 18.4350, lon: 77.4420 },
      { label: 'Three Forks Sample Depot', lat: 18.4550, lon: 77.4410 },
      { label: 'Hawksbill Gap Delta Scarp', lat: 18.4600, lon: 77.4280 },
      { label: 'Neretva Margin Carbonate Unit', lat: 18.4685, lon: 77.4165 },
      { label: 'Kodiak Butte Isolated Remnant', lat: 18.4230, lon: 77.4485 },
    ],
  },
  {
    id: 'gale',
    name: 'Gale Crater & Mount Sharp',
    subtitle: 'MSL Curiosity Rover (2012)',
    category: 'Layered Central Peak',
    lat: -4.7500,
    lon: 137.3800,
    altitude: 24000.0,
    headingDeg: 15.0,
    pitchDeg: -52.0,
    description: '154 km impact basin featuring Aeolis Mons (Mount Sharp) rising 5.5 km with sulfate and clay strata.',
    defaultStart: { label: 'Bradbury Landing Site', lat: -4.5895, lon: 137.4417 },
    defaultGoal: { label: 'Mount Sharp Base Ascent', lat: -4.6800, lon: 137.3400 },
    waypoints: [
      { label: 'Bradbury Landing Site', lat: -4.5895, lon: 137.4417 },
      { label: 'Yellowknife Bay Mudstones', lat: -4.5920, lon: 137.4450 },
      { label: 'Kimberley Sandstone Outcrop', lat: -4.6180, lon: 137.4120 },
      { label: 'Bagnold Active Dune Field', lat: -4.6350, lon: 137.3850 },
      { label: 'Vera Rubin Hematite Ridge', lat: -4.6550, lon: 137.3620 },
      { label: 'Mount Sharp Base Ascent', lat: -4.6800, lon: 137.3400 },
    ],
  },
  {
    id: 'valles-marineris',
    name: 'Valles Marineris',
    subtitle: 'Solar System Grand Canyon',
    category: 'Tectonic Rift Canyon',
    lat: -6.0000,
    lon: -74.0000,
    altitude: 45000.0,
    headingDeg: 35.0,
    pitchDeg: -60.0,
    description: 'Colossal tectonic rift system stretching over 4,000 km and plunging up to 7 km deep, dwarf earth Grand Canyon.',
    defaultStart: { label: 'Ophir Chasma Floor Ramp', lat: -4.200, lon: -72.600 },
    defaultGoal: { label: 'Candor Chasma Central Wall', lat: -6.500, lon: -75.800 },
    waypoints: [
      { label: 'Ophir Chasma Floor Ramp', lat: -4.200, lon: -72.600 },
      { label: 'Candor Chasma Central Wall', lat: -6.500, lon: -75.800 },
      { label: 'Melas Chasma Canyon Basin', lat: -9.800, lon: -76.500 },
      { label: 'Coprates Chasma Fault Line', lat: -14.800, lon: -59.200 },
    ],
  },
  {
    id: 'olympus-mons',
    name: 'Olympus Mons',
    subtitle: 'Largest Volcano in Solar System',
    category: 'Shield Volcano Caldera',
    lat: 18.4000,
    lon: -134.1000,
    altitude: 48000.0,
    headingDeg: 10.0,
    pitchDeg: -68.0,
    description: 'Colossal shield volcano rising 21.9 km above datum with a multi-ring summit caldera 80 km in diameter.',
    defaultStart: { label: 'Basal Scarp Flank Approach', lat: 17.500, lon: -135.200 },
    defaultGoal: { label: 'Summit Caldera Overlook', lat: 18.650, lon: -133.800 },
    waypoints: [
      { label: 'Basal Scarp Flank Approach', lat: 17.500, lon: -135.200 },
      { label: 'Mid-Flank Lava Channel Tube', lat: 18.150, lon: -134.500 },
      { label: 'Caldera Southern Rim Crest', lat: 18.450, lon: -133.950 },
      { label: 'Summit Caldera Overlook', lat: 18.650, lon: -133.800 },
    ],
  },
  {
    id: 'gusev',
    name: 'Gusev Crater & Columbia Hills',
    subtitle: 'MER-A Spirit Rover (2004)',
    category: 'Hydrothermal Basin',
    lat: -14.7000,
    lon: 175.4500,
    altitude: 18000.0,
    headingDeg: 18.0,
    pitchDeg: -55.0,
    description: '166 km impact crater hosting ancient volcanic hydrothermal hot springs explored by NASA Spirit rover.',
    defaultStart: { label: 'Columbia Memorial Station', lat: -14.5684, lon: 175.4729 },
    defaultGoal: { label: 'Home Plate Silica Deposits', lat: -14.6200, lon: 175.5380 },
    waypoints: [
      { label: 'Columbia Memorial Station', lat: -14.5684, lon: 175.4729 },
      { label: 'Bonneville Crater Rim', lat: -14.5820, lon: 175.4850 },
      { label: 'Husband Hill Summit Crest', lat: -14.6050, lon: 175.5250 },
      { label: 'Home Plate Silica Deposits', lat: -14.6200, lon: 175.5380 },
    ],
  },
  {
    id: 'meridiani',
    name: 'Meridiani Planum',
    subtitle: 'MER-B Opportunity Rover (2004)',
    category: 'Hematite Sedimentary Plain',
    lat: -2.1000,
    lon: -5.4500,
    altitude: 18000.0,
    headingDeg: 12.0,
    pitchDeg: -55.0,
    description: 'Sedimentary hematite plain where Opportunity confirmed past liquid groundwater over a 45 km traverse.',
    defaultStart: { label: 'Eagle Crater Touchdown Site', lat: -1.9462, lon: -5.5266 },
    defaultGoal: { label: 'Endeavour Crater Rim Cape', lat: -2.2800, lon: -5.2000 },
    waypoints: [
      { label: 'Eagle Crater Touchdown Site', lat: -1.9462, lon: -5.5266 },
      { label: 'Endurance Crater Overlook', lat: -1.9500, lon: -5.5050 },
      { label: 'Victoria Crater Promontory', lat: -2.0500, lon: -5.5000 },
      { label: 'Endeavour Crater Rim Cape', lat: -2.2800, lon: -5.2000 },
    ],
  },
];

/**
 * Smoothly fly camera to selected planetary destination on MARS_ELLIPSOID
 * Replicating Caltech Murray Lab CTX / ArcGIS SceneView smooth orbital transition:
 * Calculates planetary great-circle distance, scales flight duration and arc apex height,
 * locks roll: 0.0, and sets pitchAdjustHeight to prevent disorienting tumbling in orbit.
 */
export function flyToDestination(viewer, destId, { duration } = {}) {
  const dest = MARS_DESTINATIONS.find((d) => d.id === destId) || MARS_DESTINATIONS[0];
  const camera = viewer.camera;

  const currentCarto = MARS_ELLIPSOID.cartesianToCartographic(camera.position);
  const currentLon = currentCarto ? Cesium.Math.toDegrees(currentCarto.longitude) : 77.45;
  const currentLat = currentCarto ? Cesium.Math.toDegrees(currentCarto.latitude) : 18.44;
  const currentAlt = currentCarto ? currentCarto.height : 18000.0;

  // Planetary Great-Circle Distance on Mars (R = 3,396.19 km)
  const dLat = Cesium.Math.toRadians(dest.lat - currentLat);
  const dLon = Cesium.Math.toRadians(dest.lon - currentLon);
  const lat1 = Cesium.Math.toRadians(currentLat);
  const lat2 = Cesium.Math.toRadians(dest.lat);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  const angularDist = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));
  const surfaceDistKm = angularDist * 3396.19;

  // Murray Lab CTX SceneView orbital transitions:
  // Dynamically compute flight duration and orbital apex height
  const flightDuration =
    duration ??
    (surfaceDistKm > 3000
      ? 3.8
      : surfaceDistKm > 1000
        ? 3.0
        : surfaceDistKm > 200
          ? 2.2
          : 1.6);

  const maxArcHeight =
    surfaceDistKm > 800
      ? Math.min(2200000, Math.max(currentAlt, dest.altitude, surfaceDistKm * 320))
      : surfaceDistKm > 100
        ? Math.max(currentAlt, dest.altitude) + surfaceDistKm * 200
        : Math.max(currentAlt, dest.altitude) + 15000;

  const targetCartesian = Cesium.Cartesian3.fromDegrees(
    dest.lon,
    dest.lat,
    dest.altitude,
    MARS_ELLIPSOID,
  );

  viewer.camera.flyTo({
    destination: targetCartesian,
    orientation: {
      heading: Cesium.Math.toRadians(dest.headingDeg),
      pitch: Cesium.Math.toRadians(dest.pitchDeg),
      roll: 0.0,
    },
    duration: flightDuration,
    maximumHeight: maxArcHeight,
    pitchAdjustHeight: 45000,
    easingFunction: Cesium.EasingFunction.CUBIC_IN_OUT,
  });

  return dest;
}
