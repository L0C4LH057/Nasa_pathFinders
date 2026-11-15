import * as Cesium from 'cesium';
import { MARS_ELLIPSOID } from '../../app/marsEllipsoid.js';

export function createMarsBasemapLayer({ viewer }) {
  let imageryLayer = null;
  let visible = true;
  let opacity = 1.0;

  // Geographic Tiling Scheme for IAU 2015 Mars Reference Ellipsoid
  const tilingScheme = new Cesium.GeographicTilingScheme({
    ellipsoid: MARS_ELLIPSOID,
    numberOfLevelZeroTilesX: 2,
    numberOfLevelZeroTilesY: 1,
  });

  // Esri Explore Mars Viking MDIM 2.1 Photographic Natural Color Mosaic
  // Directly streams from astro.arcgis.com (with CORS), or via optional window.MARS_ESRI_BASE
  const esriBase =
    (typeof window !== 'undefined' && window.MARS_ESRI_BASE) ||
    'https://astro.arcgis.com';

  const provider = new Cesium.UrlTemplateImageryProvider({
    url: `${esriBase}/arcgis/rest/services/OnMars/MDIM/MapServer/tile/{z}/{y}/{x}`,
    tilingScheme,
    tileWidth: 512,
    tileHeight: 512,
    maximumLevel: 7,
    minimumLevel: 0,
    ellipsoid: MARS_ELLIPSOID,
    credit: new Cesium.Credit('Esri / NASA / USGS Mars MDIM 2.1 Color Mosaic (Explore Mars)'),
    hasAlphaChannel: false,
  });

  provider.errorEvent.addEventListener((tileProviderError) => {
    tileProviderError.retry = false;
  });

  imageryLayer = viewer.imageryLayers.addImageryProvider(provider);
  imageryLayer.alpha = opacity;
  imageryLayer.show = visible;

  return {
    id: 'mars-basemap',
    name: 'Esri Viking MDIM 2.1 Color Mosaic',
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
