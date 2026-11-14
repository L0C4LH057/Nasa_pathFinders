import * as Cesium from 'cesium';
import { MARS_ELLIPSOID } from '../../app/marsEllipsoid.js';

export function createMarsEsriCtxLayer({ viewer }) {
  let imageryLayer = null;
  let visible = false;
  let opacity = 0.55;

  // Esri Explore Mars Context Camera (CTX) ~5m Global Mosaic (Caltech Murray Lab / MSSS / NASA / Esri)
  const tilingScheme = new Cesium.GeographicTilingScheme({
    ellipsoid: MARS_ELLIPSOID,
    numberOfLevelZeroTilesX: 2,
    numberOfLevelZeroTilesY: 1,
  });

  const provider = new Cesium.UrlTemplateImageryProvider({
    url: '/esri-mars/arcgis/rest/services/OnMars/CTX/MapServer/tile/{z}/{y}/{x}',
    tilingScheme,
    tileWidth: 512,
    tileHeight: 512,
    minimumLevel: 2,
    maximumLevel: 12,
    ellipsoid: MARS_ELLIPSOID,
    credit: new Cesium.Credit('Esri / Caltech Murray Lab / NASA MRO CTX (~5m/px)'),
    hasAlphaChannel: true,
  });

  // Gracefully silence sporadic ArcGIS server edge-tile misses
  provider.errorEvent.addEventListener((tileProviderError) => {
    tileProviderError.retry = false;
  });

  imageryLayer = viewer.imageryLayers.addImageryProvider(provider);
  imageryLayer.alpha = opacity;
  imageryLayer.show = visible;

  return {
    id: 'mars-esri-ctx',
    name: 'Esri CTX 5m High-Res (Explore Mars)',
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
