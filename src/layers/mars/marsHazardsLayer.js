import * as Cesium from 'cesium';
import { MARS_ELLIPSOID } from '../../app/marsEllipsoid.js';

export function createMarsHazardsLayer({ viewer }) {
  let imageryLayer = null;
  let dataSource = null;
  let visible = true;
  let opacity = 0.85;

  const rect = Cesium.Rectangle.fromDegrees(77.40, 18.41, 77.50, 18.49);

  // Uncertainty Overlay (disabled by default, enabled when Uncertainty is checked)
  const provider = new Cesium.SingleTileImageryProvider({
    url: '/mars-data/jezero_uncertainty_rgba.png',
    rectangle: rect,
    tileWidth: 200,
    tileHeight: 200,
    ellipsoid: MARS_ELLIPSOID,
    credit: new Cesium.Credit('MARS PATHFINDER Spatial Uncertainty Layer'),
  });

  imageryLayer = viewer.imageryLayers.addImageryProvider(provider);
  imageryLayer.alpha = opacity;
  imageryLayer.show = false;

  // Load GeoJSON hazard polygons
  Cesium.GeoJsonDataSource.load('/api/mars/features', {
    stroke: Cesium.Color.fromCssColorString('#ef4444'),
    fill: Cesium.Color.fromCssColorString('rgba(239, 68, 68, 0.35)'),
    strokeWidth: 3,
    clampToGround: true,
  }).then((ds) => {
    dataSource = ds;
    // Keep only hazard polygons
    const toRemove = [];
    for (const entity of ds.entities.values) {
      if (entity.properties?.category?.getValue() !== 'hazard_exclusion' &&
          entity.properties?.category?.getValue() !== 'uncertainty_zone') {
        toRemove.push(entity);
      }
    }
    toRemove.forEach((e) => ds.entities.remove(e));
    viewer.dataSources.add(ds);
    ds.show = visible;
  }).catch((err) => {
    console.warn('[Mars Hazards] Fallback to embedded hazard polygons:', err);
  });

  return {
    id: 'mars-hazards',
    name: 'Mapped Hazards & Uncertainty (Séítah Dunes / MOLA)',
    show: () => {
      visible = true;
      if (imageryLayer) imageryLayer.show = true;
      if (dataSource) dataSource.show = true;
    },
    hide: () => {
      visible = false;
      if (imageryLayer) imageryLayer.show = false;
      if (dataSource) dataSource.show = false;
    },
    setOpacity: (val) => {
      opacity = Math.max(0.0, Math.min(1.0, val));
      if (imageryLayer) imageryLayer.alpha = opacity;
    },
    getOpacity: () => opacity,
    isVisible: () => visible,
    destroy: () => {
      if (imageryLayer && !viewer.isDestroyed()) {
        viewer.imageryLayers.remove(imageryLayer);
      }
      if (dataSource && !viewer.isDestroyed()) {
        viewer.dataSources.remove(dataSource);
      }
    },
  };
}
