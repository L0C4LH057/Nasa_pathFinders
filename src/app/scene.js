import { createApplicationOperations } from './operations.js';
import * as Cesium from 'cesium';
import {
  createApplicationViewer,
  installFreeLookHeightLimit,
  installTrackpadPinchZoom,
} from '../app/viewer.js';
import { registerDataCredits } from '../data/dataCredits.js';
import { configureCreditKeyboardAccess } from '../creditKeyboard.js';
import { MapStackController } from '../mapStackController.js';
import { loadPhotorealisticTileset } from '../mapStartup.js';
import { initLogoGaze } from '../logoGaze.js';
import {
  uninstallRenderGovernor,
  governorRequestRender,
} from '../renderGovernor.js';
import { describeError } from './errors.js';
import { isEmbeddedInline } from './embed.js';
import { installRenderFailureNotice } from '../ui/renderFailure.js';
import { worldClock, worldTimeFor } from '../time/worldClock.js';
import { followWorldTime } from '../time/viewerClock.js';
import { onLocaleChange, t } from '../i18n/index.js';
import { createMarsBasemapLayer } from '../layers/mars/marsBasemapLayer.js';
import { createMarsElevationLayer } from '../layers/mars/marsElevationLayer.js';
import { createMarsHillshadeLayer } from '../layers/mars/marsHillshadeLayer.js';
import { createMarsSlopeLayer } from '../layers/mars/marsSlopeLayer.js';
import { createMarsHazardsLayer } from '../layers/mars/marsHazardsLayer.js';
import { createMarsScienceLayer } from '../layers/mars/marsScienceLayer.js';
import { createMarsRouteLayer } from '../layers/mars/marsRouteLayer.js';
import { createMarsEsriCtxLayer } from '../layers/mars/marsEsriCtxLayer.js';
import { createMarsEsriMdimLayer } from '../layers/mars/marsEsriMdimLayer.js';
import { MarsController } from '../ui/marsController.js';
import { useMarsStore } from '../ui/stores/marsStore.js';
import { setViewJezero } from '../camera.js';

/** Construct the application globe using the caller's local configuration. */
export async function createApplicationScene({
  requestServices,
  googleApiKey,
  googleTokens = null,
  cesiumToken,
  credits,
  MapController = MapStackController,
  mapOptions = {},
  loaderStatus,
  signal,
  defer,
}) {
  const operations = createApplicationOperations({
    requests: requestServices,
    signal,
  });
  defer(initLogoGaze());
  const previousKey = window.__GOOGLE_MAPS_API_KEY__;
  if (googleApiKey) {
    window.__GOOGLE_MAPS_API_KEY__ = googleApiKey;
    defer(() => {
      if (window.__GOOGLE_MAPS_API_KEY__ !== googleApiKey) return;
      if (previousKey === undefined) delete window.__GOOGLE_MAPS_API_KEY__;
      else window.__GOOGLE_MAPS_API_KEY__ = previousKey;
    });
  }
  loaderStatus.textContent = t('Configuring viewer...');
  // Provider attribution stays visible, including clean-view and recording.
  const creditContainer = document.createElement('div');
  creditContainer.id = 'cesium-credits';
  document.body.appendChild(creditContainer);
  defer(() => creditContainer.remove());
  const viewer = createApplicationViewer({
    container: 'cesiumContainer',
    creditContainer,
    // The render failure notice below replaces Cesium's dead-end panel.
    showRenderLoopErrors: false,
  });
  defer(() => {
    uninstallRenderGovernor(viewer);
    if (!viewer.isDestroyed()) viewer.destroy();
  });
  // An inline panel must not reload or navigate its host's page.
  defer(
    installRenderFailureNotice(viewer, { allowReload: !isEmbeddedInline() }),
  );
  defer(installTrackpadPinchZoom(viewer));
  defer(
    followWorldTime(viewer, worldTimeFor('sky'), {
      subscribe: worldClock.subscribe,
      requestRender: () => governorRequestRender('world-time'),
    }),
  );
  defer(installFreeLookHeightLimit(viewer));
  registerDataCredits(viewer, credits);
  configureCreditKeyboardAccess(document);
  defer(onLocaleChange(() => configureCreditKeyboardAccess(document)));
  loaderStatus.textContent = t('Initializing Mars Pathfinder Globe...');
  const tileset = null;
  if (viewer.scene?.globe) {
    viewer.scene.globe.show = true;
  }

  loaderStatus.textContent = t('Initializing systems...');

  // Initialize Mars Pathfinder Layers & Controller
  const marsBasemap = createMarsBasemapLayer({ viewer });
  const marsElevation = createMarsElevationLayer({ viewer });
  const marsEsriCtx = createMarsEsriCtxLayer({ viewer });
  const marsEsriMdim = createMarsEsriMdimLayer({ viewer });
  const marsHillshade = createMarsHillshadeLayer({ viewer });
  const marsSlope = createMarsSlopeLayer({ viewer });
  const marsHazards = createMarsHazardsLayer({ viewer });
  const marsRoute = createMarsRouteLayer({ viewer });
  const marsScience = createMarsScienceLayer({
    viewer,
    onSelectTarget: (props) => {
      useMarsStore().setInspectedEntity(props);
    },
  });

  const marsLayers = {
    'mars-basemap': marsBasemap,
    'mars-elevation': marsElevation,
    'mars-esri-ctx': marsEsriCtx,
    'mars-esri-mdim': marsEsriMdim,
    'mars-hillshade': marsHillshade,
    'mars-slope': marsSlope,
    'mars-hazards': marsHazards,
    'mars-science': marsScience,
    route: marsRoute,
  };

  const marsController = new MarsController({ viewer, layers: marsLayers });
  window.__marsController = marsController;

  // Ensure camera is positioned at Jezero Crater and baseline route is computed
  setViewJezero(viewer);
  setTimeout(() => {
    setViewJezero(viewer);
    marsController.computeRoute().catch((err) => {
      console.warn('[MarsController] Initial route calculation deferred:', err);
    });
  }, 300);

  defer(() => {
    marsController.destroy();
    marsBasemap.destroy();
    marsElevation.destroy();
    marsEsriCtx.destroy();
    marsEsriMdim.destroy();
    marsHillshade.destroy();
    marsSlope.destroy();
    marsHazards.destroy();
    marsScience.destroy();
    marsRoute.destroy();
    delete window.__marsController;
  });

  const marsStack = {
    id: 'mars-viking',
    label: 'Mars Viking MDIM 2.1',
    shortLabel: 'VIKING',
    available: true,
  };

  const mapStackController = {
    getActiveId: () => marsStack.id,
    getStacks: () => [marsStack],
    getState: (status = 'ready') => ({
      activeId: marsStack.id,
      activeStack: marsStack,
      status,
      lastError: null,
    }),
    isStackAvailable: (id) => id === marsStack.id,
    getSwitchGeneration: () => 1,
    getImageryHostTileset: () => null,
    acquireImageryComparison: () => null,
    subscribe: () => () => {},
    setStack: async () => ({
      activeId: marsStack.id,
      activeStack: marsStack,
      status: 'ready',
    }),
    destroy: () => {},
  };

  signal.throwIfAborted();
  return { viewer, tileset, mapStackController, operations, marsController };
}
