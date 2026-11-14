import * as Cesium from 'cesium';
import { MARS_ELLIPSOID } from '../../app/marsEllipsoid.js';

export function createMarsRouteLayer({ viewer }) {
  let outboundEntity = null;
  let returnEntity = null;
  let startEntity = null;
  let goalEntity = null;
  let hazardEntity = null;
  let scienceEntity1 = null;
  let scienceEntity2 = null;
  let reticleEntity = null;
  let visible = true;

  const entities = viewer.entities;

  function clearRoutes() {
    if (outboundEntity) {
      entities.remove(outboundEntity);
      outboundEntity = null;
    }
    if (returnEntity) {
      entities.remove(returnEntity);
      returnEntity = null;
    }
    if (startEntity) {
      entities.remove(startEntity);
      startEntity = null;
    }
    if (goalEntity) {
      entities.remove(goalEntity);
      goalEntity = null;
    }
    if (hazardEntity) {
      entities.remove(hazardEntity);
      hazardEntity = null;
    }
    if (scienceEntity1) {
      entities.remove(scienceEntity1);
      scienceEntity1 = null;
    }
    if (scienceEntity2) {
      entities.remove(scienceEntity2);
      scienceEntity2 = null;
    }
    if (reticleEntity) {
      entities.remove(reticleEntity);
      reticleEntity = null;
    }
  }

  function updateRoutes(outbound, returnLeg) {
    clearRoutes();

    if (!outbound || !outbound.points || outbound.points.length === 0) return;

    // 1. Outbound Polyline (Vibrant Electric Cyan Ribbon with Soft Glow)
    const outboundPositions = outbound.points.map((pt) =>
      Cesium.Cartesian3.fromDegrees(pt.lon, pt.lat, 25.0, MARS_ELLIPSOID)
    );

    outboundEntity = entities.add({
      name: 'Outbound Traverse',
      polyline: {
        positions: outboundPositions,
        width: 6.5,
        arcType: Cesium.ArcType.NONE,
        material: new Cesium.PolylineGlowMaterialProperty({
          glowPower: 0.35,
          taperPower: 1.0,
          color: Cesium.Color.fromCssColorString('#00d2ff'),
        }),
        depthFailMaterial: new Cesium.PolylineGlowMaterialProperty({
          glowPower: 0.35,
          taperPower: 1.0,
          color: Cesium.Color.fromCssColorString('#00d2ff'),
        }),
      },
    });

    // 2. Return Leg Polyline (Subtle Dashed Gold)
    if (returnLeg && returnLeg.points && returnLeg.points.length > 0) {
      const returnPositions = returnLeg.points.map((pt) =>
        Cesium.Cartesian3.fromDegrees(pt.lon, pt.lat, 25.0, MARS_ELLIPSOID)
      );

      returnEntity = entities.add({
        name: 'Return Traverse',
        polyline: {
          positions: returnPositions,
          width: 3.5,
          arcType: Cesium.ArcType.NONE,
          material: new Cesium.PolylineDashMaterialProperty({
            color: Cesium.Color.fromCssColorString('#ffb703'),
            dashLength: 16.0,
          }),
          depthFailMaterial: new Cesium.PolylineDashMaterialProperty({
            color: Cesium.Color.fromCssColorString('#ffb703'),
            dashLength: 16.0,
          }),
        },
      });
    }

    // 3. Start Pin (Green with white halo matching UI mockup)
    const startPt = outbound.points[0];
    startEntity = entities.add({
      name: 'Start',
      position: Cesium.Cartesian3.fromDegrees(startPt.lon, startPt.lat, 40.0, MARS_ELLIPSOID),
      billboard: {
        image: createPinCanvas('#10b981', 'rgba(16, 185, 129, 0.28)'),
        verticalOrigin: Cesium.VerticalOrigin.CENTER,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
      label: {
        text: 'Start',
        font: 'bold 15px Inter, -apple-system, sans-serif',
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.fromCssColorString('#090c12'),
        outlineWidth: 3.5,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        pixelOffset: new Cesium.Cartesian2(32, 0),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    });

    // 4. Destination Pin (Red with white halo matching UI mockup)
    const goalPt = outbound.points[outbound.points.length - 1];
    goalEntity = entities.add({
      name: 'Destination',
      position: Cesium.Cartesian3.fromDegrees(goalPt.lon, goalPt.lat, 40.0, MARS_ELLIPSOID),
      billboard: {
        image: createPinCanvas('#ef4444', 'rgba(239, 68, 68, 0.28)'),
        verticalOrigin: Cesium.VerticalOrigin.CENTER,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
      label: {
        text: 'Destination',
        font: 'bold 15px Inter, -apple-system, sans-serif',
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.fromCssColorString('#090c12'),
        outlineWidth: 3.5,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        pixelOffset: new Cesium.Cartesian2(48, 0),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    });

    // 5. Route Hazard Caution Marker (Yellow Triangle at Midpoint Dune Slope)
    const midIdx = Math.floor(outbound.points.length * 0.48);
    const midPt = outbound.points[midIdx];
    if (midPt) {
      hazardEntity = entities.add({
        name: 'Slope & Sand Hazard',
        position: Cesium.Cartesian3.fromDegrees(midPt.lon, midPt.lat, 35.0, MARS_ELLIPSOID),
        billboard: {
          image: createHazardWarningCanvas(),
          verticalOrigin: Cesium.VerticalOrigin.CENTER,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      });
    }

    // 6. Science Target Hexagonal Markers along traverse
    const sci1Idx = Math.floor(outbound.points.length * 0.28);
    const sci1Pt = outbound.points[sci1Idx];
    if (sci1Pt) {
      scienceEntity1 = entities.add({
        name: 'Science Target A',
        position: Cesium.Cartesian3.fromDegrees(sci1Pt.lon + 0.008, sci1Pt.lat - 0.005, 35.0, MARS_ELLIPSOID),
        billboard: {
          image: createScienceHexCanvas(),
          verticalOrigin: Cesium.VerticalOrigin.CENTER,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      });
    }

    const sci2Idx = Math.floor(outbound.points.length * 0.72);
    const sci2Pt = outbound.points[sci2Idx];
    if (sci2Pt) {
      scienceEntity2 = entities.add({
        name: 'Science Target B',
        position: Cesium.Cartesian3.fromDegrees(sci2Pt.lon - 0.007, sci2Pt.lat + 0.006, 35.0, MARS_ELLIPSOID),
        billboard: {
          image: createScienceHexCanvas(),
          verticalOrigin: Cesium.VerticalOrigin.CENTER,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      });
    }
  }

  function setReticle(pt) {
    if (!pt) {
      if (reticleEntity) {
        entities.remove(reticleEntity);
        reticleEntity = null;
      }
      return;
    }

    const pos = Cesium.Cartesian3.fromDegrees(pt.lon, pt.lat, 35.0, MARS_ELLIPSOID);

    if (!reticleEntity) {
      reticleEntity = entities.add({
        position: pos,
        point: {
          pixelSize: 14,
          color: Cesium.Color.fromCssColorString('#ff6b35'),
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      });
    } else {
      reticleEntity.position = pos;
    }
  }

  return {
    id: 'mars-route',
    name: 'Pathfinding Traversal Track',
    updateRoutes,
    setReticle,
    clearRoutes,
    show: () => {
      visible = true;
      if (outboundEntity) outboundEntity.show = true;
      if (returnEntity) returnEntity.show = true;
      if (startEntity) startEntity.show = true;
      if (goalEntity) goalEntity.show = true;
      if (hazardEntity) hazardEntity.show = true;
      if (scienceEntity1) scienceEntity1.show = true;
      if (scienceEntity2) scienceEntity2.show = true;
    },
    hide: () => {
      visible = false;
      if (outboundEntity) outboundEntity.show = false;
      if (returnEntity) returnEntity.show = false;
      if (startEntity) startEntity.show = false;
      if (goalEntity) goalEntity.show = false;
      if (hazardEntity) hazardEntity.show = false;
      if (scienceEntity1) scienceEntity1.show = false;
      if (scienceEntity2) scienceEntity2.show = false;
    },
    isVisible: () => visible,
    destroy: () => {
      clearRoutes();
    },
  };
}

function createPinCanvas(colorHex, glowRgba) {
  const canvas = document.createElement('canvas');
  canvas.width = 46;
  canvas.height = 46;
  const ctx = canvas.getContext('2d');

  // Outer glow halo
  ctx.beginPath();
  ctx.arc(23, 23, 21, 0, Math.PI * 2);
  ctx.fillStyle = glowRgba;
  ctx.fill();

  // Outer white border
  ctx.beginPath();
  ctx.arc(23, 23, 14, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  // Pin circle
  ctx.beginPath();
  ctx.arc(23, 23, 11, 0, Math.PI * 2);
  ctx.fillStyle = colorHex;
  ctx.fill();

  // Center white dot
  ctx.beginPath();
  ctx.arc(23, 23, 4, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  return canvas;
}

function createHazardWarningCanvas() {
  const canvas = document.createElement('canvas');
  canvas.width = 38;
  canvas.height = 38;
  const ctx = canvas.getContext('2d');

  // Yellow triangle with rounded tip
  ctx.beginPath();
  ctx.moveTo(19, 4);
  ctx.lineTo(34, 32);
  ctx.lineTo(4, 32);
  ctx.closePath();
  ctx.fillStyle = '#f59e0b';
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = '#090c12';
  ctx.stroke();

  // Exclamation mark
  ctx.fillStyle = '#090c12';
  ctx.fillRect(17.5, 12, 3, 10);
  ctx.beginPath();
  ctx.arc(19, 27, 2, 0, Math.PI * 2);
  ctx.fill();

  return canvas;
}

function createScienceHexCanvas() {
  const canvas = document.createElement('canvas');
  canvas.width = 42;
  canvas.height = 42;
  const ctx = canvas.getContext('2d');

  const cx = 21, cy = 21, r = 16;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = 'rgba(126, 34, 206, 0.88)';
  ctx.fill();
  ctx.lineWidth = 2.2;
  ctx.strokeStyle = '#c084fc';
  ctx.stroke();

  // Flask symbol
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(19, 11);
  ctx.lineTo(23, 11);
  ctx.lineTo(23, 16);
  ctx.lineTo(28, 25);
  ctx.arcTo(29, 28, 26, 28, 2);
  ctx.lineTo(16, 28);
  ctx.arcTo(13, 28, 14, 25, 2);
  ctx.lineTo(19, 16);
  ctx.closePath();
  ctx.fill();

  return canvas;
}
