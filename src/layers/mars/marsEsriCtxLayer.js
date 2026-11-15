import * as Cesium from 'cesium';
import { MARS_ELLIPSOID } from '../../app/marsEllipsoid.js';

export function createMarsEsriCtxLayer({ viewer }) {
  let imageryLayer = null;
  let visible = true;
  let opacity = 1.0;

  // Caltech Murray Lab Global CTX Mosaic ~5m/px (MSSS / NASA JPL / Caltech / Esri)
  const tilingScheme = new Cesium.GeographicTilingScheme({
    ellipsoid: MARS_ELLIPSOID,
    numberOfLevelZeroTilesX: 2,
    numberOfLevelZeroTilesY: 1,
  });

  const esriBase =
    (typeof window !== 'undefined' && window.MARS_ESRI_BASE) ||
    'https://astro.arcgis.com';

  const provider = new Cesium.UrlTemplateImageryProvider({
    url: `${esriBase}/arcgis/rest/services/OnMars/CTX1/MapServer/tile/{z}/{y}/{x}`,
    tilingScheme,
    tileWidth: 512,
    tileHeight: 512,
    minimumLevel: 0,
    maximumLevel: 12,
    ellipsoid: MARS_ELLIPSOID,
    credit: new Cesium.Credit('Caltech Murray Lab / NASA MRO CTX Global Mosaic (~5m/px)'),
    hasAlphaChannel: false,
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
    name: 'Caltech Murray Lab CTX 5m Global Mosaic',
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
