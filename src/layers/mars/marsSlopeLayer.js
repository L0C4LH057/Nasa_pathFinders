import * as Cesium from 'cesium';
import { MARS_ELLIPSOID } from '../../app/marsEllipsoid.js';

export function createMarsSlopeLayer({ viewer }) {
  let imageryLayer = null;
  let visible = false;
  let opacity = 0.70;

  const rect = Cesium.Rectangle.fromDegrees(77.40, 18.41, 77.50, 18.49);

  const provider = new Cesium.SingleTileImageryProvider({
    url: '/mars-data/jezero_slope_rgba.png',
    rectangle: rect,
    tileWidth: 200,
    tileHeight: 200,
    ellipsoid: MARS_ELLIPSOID,
    credit: new Cesium.Credit('MARS PATHFINDER Horn Analytical Slope Severity Overlay'),
  });

  imageryLayer = viewer.imageryLayers.addImageryProvider(provider);
  imageryLayer.alpha = opacity;
  imageryLayer.show = visible;

  return {
    id: 'mars-slope',
    name: 'Slope Severity (<10° / 10-18° / >18°)',
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
