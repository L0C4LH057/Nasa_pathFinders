export const MARS_CATALOG_LAYERS = Object.freeze([
  { id: 'mars-basemap', name: 'Surface Imagery (Viking / CTX)' },
  { id: 'mars-esri-ctx', name: 'Esri CTX 5m High-Res (Explore Mars)' },
  { id: 'mars-esri-mdim', name: 'Esri Viking MDIM Color (Explore Mars)' },
  { id: 'mars-elevation', name: 'Topography (MOLA Elevation)' },
  { id: 'mars-hillshade', name: 'Analytical Hillshade (25m)' },
  { id: 'mars-slope', name: 'Slope Severity (<10° / 10-18° / >18°)' },
  { id: 'mars-hazards', name: 'Mapped Hazards & Uncertainty' },
  { id: 'mars-science', name: 'Science Targets (Perseverance)' },
  { id: 'mars-route', name: 'Pathfinding Traversal Track' },
]);

export function createStandaloneCatalog() {
  const dummyLayer = (def) => ({
    id: def.id,
    name: def.name,
    init: async () => {},
    destroy: async () => {},
    getStats: () => ({ entityCount: 0, loaded: true }),
    getParams: () => ({}),
  });

  const layers = MARS_CATALOG_LAYERS.map(dummyLayer);
  const metadata = layers.map((l) =>
    Object.freeze({ id: l.id, disposition: 'enabled-only' }),
  );
  const byId = new Map(layers.map((l) => [l.id, l]));

  return Object.freeze({
    layers: Object.freeze(layers),
    metadata: Object.freeze(metadata),
    get: (id) => byId.get(id),
  });
}

let compatibilityCatalog;
export function getStandaloneCatalog() {
  return (compatibilityCatalog ||= createStandaloneCatalog());
}
