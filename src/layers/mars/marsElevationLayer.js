import * as Cesium from 'cesium';
import { MARS_ELLIPSOID } from '../../app/marsEllipsoid.js';

export function createMarsElevationLayer({ viewer }) {
  let imageryLayer = null;
  let visible = false;
  let opacity = 0.65;

  // Analytical DTM elevation drape over Jezero Crater [77.40, 18.41, 77.50, 18.49]
  const rect = Cesium.Rectangle.fromDegrees(77.40, 18.41, 77.50, 18.49);

  const provider = new Cesium.SingleTileImageryProvider({
    url: '/mars-data/jezero_hillshade.png',
    rectangle: rect,
    tileWidth: 200,
    tileHeight: 200,
    ellipsoid: MARS_ELLIPSOID,
    credit: new Cesium.Credit('HRSC/MOLA Jezero DTM Topography (200m)'),
  });

  imageryLayer = viewer.imageryLayers.addImageryProvider(provider);
  imageryLayer.alpha = opacity;
  imageryLayer.show = visible;

  return {
    id: 'mars-elevation',
    name: 'Topography (MOLA Elevation)',
    show: () => {
      visible = true;
      if (imageryLayer) imageryLayer.show = true;
    },
    hide: () => {
      visible = false;
      if (imageryLayer) imageryLayer.show = false;
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
    },
  };
}
