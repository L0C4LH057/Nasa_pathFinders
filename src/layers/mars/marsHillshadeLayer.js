import * as Cesium from 'cesium';
import { MARS_ELLIPSOID } from '../../app/marsEllipsoid.js';

export function createMarsHillshadeLayer({ viewer }) {
  let imageryLayer = null;
  let visible = true;
  let opacity = 1.0;

  // High-Resolution Regional Mars Relief bounds: 78 km x 54 km encompassing Jezero Crater & Delta
  const rect = Cesium.Rectangle.fromDegrees(76.80, 18.00, 78.10, 18.90);

  const provider = new Cesium.SingleTileImageryProvider({
    url: '/mars-data/jezero_wide_shaded_relief.png',
    rectangle: rect,
    tileWidth: 2048,
    tileHeight: 2048,
    ellipsoid: MARS_ELLIPSOID,
    credit: new Cesium.Credit('MARS PATHFINDER High-Res Color Shaded Relief (Explore Mars)'),
  });

  imageryLayer = viewer.imageryLayers.addImageryProvider(provider);
  imageryLayer.alpha = opacity;
  imageryLayer.show = visible;

  return {
    id: 'mars-hillshade',
    name: 'Analytical Hillshade (25m)',
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
