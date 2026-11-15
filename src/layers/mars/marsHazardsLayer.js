import * as Cesium from 'cesium';
import { MARS_ELLIPSOID } from '../../app/marsEllipsoid.js';

function createHazardBadgeCanvas(color = '#f59e0b', text = '!') {
  const canvas = document.createElement('canvas');
  canvas.width = 36;
  canvas.height = 36;
  const ctx = canvas.getContext('2d');

  ctx.save();
  ctx.translate(18, 18);
  ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
  ctx.shadowBlur = 6;

  ctx.beginPath();
  ctx.moveTo(0, -14);
  ctx.lineTo(15, 12);
  ctx.lineTo(-15, 12);
  ctx.closePath();

  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = 2.0;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();

  ctx.fillStyle = '#090c12';
  ctx.font = 'bold 15px -apple-system, Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, 3);
  ctx.restore();

  return canvas;
}

export function createMarsHazardsLayer({ viewer }) {
  let customDataSource = new Cesium.CustomDataSource('mars-hazards-ds');
  viewer.dataSources.add(customDataSource);
  let visible = true;
  let opacity = 0.85;

  async function loadFeatures() {
    try {
      const res = await fetch('/api/mars/features');
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        return await res.json();
      }
    } catch {}
    try {
      const fallbackRes = await fetch('/mars-data/jezero_features.geojson');
      if (fallbackRes.ok) {
        return await fallbackRes.json();
      }
    } catch {}
    return { features: [] };
  }

  loadFeatures()
    .then((data) => {
      const hazardFeatures = (data?.features || []).filter(
        (f) => f.geometry?.type === 'Polygon'
      );

      for (const f of hazardFeatures) {
        const coords = f.geometry.coordinates[0];
        const positions = coords.map(([lon, lat]) =>
          Cesium.Cartesian3.fromDegrees(lon, lat, 15.0, MARS_ELLIPSOID)
        );

        const isSlope =
          f.properties?.category === 'hazard_exclusion' ||
          f.properties?.hazard_type?.includes('slope') ||
          f.properties?.hazard_type?.includes('scarp');
        const isDune =
          f.properties?.category === 'dune_hazard' ||
          f.properties?.hazard_type?.includes('sand') ||
          f.properties?.hazard_type?.includes('aeolian');
        const isBoulder =
          f.properties?.category === 'boulder_hazard' ||
          f.properties?.hazard_type?.includes('boulder');
        const isUncertainty = f.properties?.category === 'uncertainty_zone';

        let fillColor = Cesium.Color.fromCssColorString('rgba(239, 68, 68, 0.40)'); // Red slope barrier
        let strokeColor = Cesium.Color.fromCssColorString('#ef4444');
        let iconColor = '#ef4444';

        if (isDune) {
          fillColor = Cesium.Color.fromCssColorString('rgba(245, 158, 11, 0.42)'); // Amber sand dune
          strokeColor = Cesium.Color.fromCssColorString('#f59e0b');
          iconColor = '#f59e0b';
        } else if (isBoulder) {
          fillColor = Cesium.Color.fromCssColorString('rgba(234, 88, 12, 0.40)'); // Orange boulder field
          strokeColor = Cesium.Color.fromCssColorString('#ea580c');
          iconColor = '#ea580c';
        } else if (isUncertainty) {
          fillColor = Cesium.Color.fromCssColorString('rgba(168, 85, 247, 0.30)'); // Purple uncertainty
          strokeColor = Cesium.Color.fromCssColorString('#a855f7');
          iconColor = '#a855f7';
        }

        // Add Polygon to Scene with clean closed polyline border (eliminating Cesium IAU outline artifact rays)
        customDataSource.entities.add({
          name: f.properties?.name || 'Hazard Zone',
          polygon: {
            hierarchy: new Cesium.PolygonHierarchy(positions),
            material: fillColor,
            height: 15.0,
          },
          polyline: {
            positions: [...positions, positions[0]],
            width: 2.5,
            material: strokeColor,
            arcType: Cesium.ArcType.NONE,
          },
          properties: f.properties,
        });

        // Add Centroid Badge & Label
        const lons = coords.map((c) => c[0]);
        const lats = coords.map((c) => c[1]);
        const cLon = (Math.min(...lons) + Math.max(...lons)) / 2.0;
        const cLat = (Math.min(...lats) + Math.max(...lats)) / 2.0;

        customDataSource.entities.add({
          name: `${f.properties?.name} Badge`,
          position: Cesium.Cartesian3.fromDegrees(cLon, cLat, 40.0, MARS_ELLIPSOID),
          billboard: {
            image: createHazardBadgeCanvas(iconColor, '!'),
            verticalOrigin: Cesium.VerticalOrigin.CENTER,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
          label: {
            text: f.properties?.name,
            font: 'bold 11px Inter, -apple-system, sans-serif',
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.fromCssColorString('#090c12'),
            outlineWidth: 3.5,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            pixelOffset: new Cesium.Cartesian2(0, 22),
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
          properties: f.properties,
        });
      }
    })
    .catch((err) => {
      console.warn('[Mars Hazards] Failed to load features:', err);
    });

  return {
    id: 'mars-hazards',
    name: 'Mapped Road Hazards & Dunes',
    show: () => {
      visible = true;
      if (customDataSource) customDataSource.show = true;
    },
    hide: () => {
      visible = false;
      if (customDataSource) customDataSource.show = false;
    },
    setOpacity: (val) => {
      opacity = Math.max(0.0, Math.min(1.0, val));
    },
    getOpacity: () => opacity,
    isVisible: () => visible,
    destroy: () => {
      if (customDataSource && !viewer.isDestroyed()) {
        viewer.dataSources.remove(customDataSource);
      }
    },
  };
}
