import { defineStore } from 'pinia';
import { markRaw, shallowRef, ref } from 'vue';

export const useMarsStore = defineStore('mars-pathfinder', () => {
  // Navigation tabs: 'mission-control' | 'pharma' | 'life-support' | 'alerts' | 'settings'
  const activeTab = ref('mission-control');

  // Big Canvas View Mode: true expands canvas to 100% full screen
  const isCanvasMaximized = ref(false);

  // Route presentation snapshot (shallowRef to prevent Vue proxying of large point arrays)
  const routeData = shallowRef(null);

  // Inspected science target or hazard entity
  const inspectedEntity = shallowRef(null);

  // Selected Start and Destination coordinates
  const startCoord = ref({
    label: 'Start (Jezero South)',
    lat: 18.370,
    lon: 77.348,
  });

  const goalCoord = ref({
    label: 'Destination (Séítah Region)',
    lat: 18.502,
    lon: 77.522,
  });

  // Current active picking target: 'start' | 'goal' | null
  const activePicker = ref(null);

  // Modals state
  const isWelcomeOpen = ref(false);
  const isProvenanceOpen = ref(false);

  // Cursor coordinates tracking
  const cursorCoords = ref({
    lat: 18.4447,
    lon: 77.4508,
    alt: 11500,
  });

  // Layer list snapshot (including Explore-Mars Esri CTX and Viking MDIM Color)
  const layerStates = ref([
    { id: 'mars-basemap', name: 'Esri Viking Color Mosaic', visible: true, opacity: 100 },
    { id: 'mars-hillshade', name: 'High-Res Color Shaded Relief', visible: true, opacity: 100 },
    { id: 'mars-esri-ctx', name: 'Esri CTX 5m High-Res', visible: false, opacity: 55 },
    { id: 'mars-slope', name: 'Slope Severity (<10° / 10–18° / >18°)', visible: false, opacity: 70 },
    { id: 'mars-hazards', name: 'Mapped Hazards & Uncertainty', visible: false, opacity: 80 },
    { id: 'mars-science', name: 'Science Targets (Perseverance)', visible: true, opacity: 100 },
  ]);

  // Environmental & Safety Alerts (3 active)
  const alerts = ref([
    {
      id: 'alert-temp',
      title: 'Cabin Temperature Rising',
      time: '10:24',
      severity: 'warning',
      icon: 'thermometer',
      metric: 'Current: 24°C (Limit: 18–22°C)',
      action: 'Take action: Increase cooling.',
    },
    {
      id: 'alert-water',
      title: 'Water Supply Low',
      time: '10:20',
      severity: 'warning',
      icon: 'water',
      metric: 'Remaining: 18% (Critical: <10%)',
      action: 'Monitor consumption.',
    },
    {
      id: 'alert-o2',
      title: 'Oxygen Reserve Low',
      time: '10:15',
      severity: 'critical',
      icon: 'air',
      metric: 'Remaining: 12% (Critical: <10%)',
      action: 'Plan for conservation.',
    },
  ]);

  // Crew Biometrics & Health
  const crewHealth = ref({
    name: 'Dr. A. Taylor',
    role: 'Commander',
    status: 'Nominal',
    vitals: {
      heartRate: 72, // bpm
      bp: '118/76', // mmHg
      respRate: 16, // br/min
      temp: 36.6, // °C
      spo2: 98, // %
    },
  });

  // Life-Support Monitoring Telemetry
  const lifeSupport = ref({
    oxygen: {
      value: 62,
      max: 100,
      unit: '%',
      subtext: '~ 36 hrs remaining',
      status: 'Normal',
      statusType: 'normal',
    },
    co2: {
      value: 1.8,
      max: 5,
      unit: '%',
      subtext: '(≤ 3%)',
      status: 'Normal',
      statusType: 'normal',
    },
    water: {
      value: 18,
      max: 100,
      unit: '%',
      subtext: '~ 1.5 days',
      status: 'Low',
      statusType: 'warning',
    },
    pressure: {
      value: 14.7,
      max: 20,
      unit: 'psia',
      subtext: '(5-15)',
      status: 'Normal',
      statusType: 'normal',
    },
  });

  // Pharmaceutical & Medical Inventory
  const pharmaInventory = ref({
    activeCategory: 'inventory', // 'inventory' | 'crew-health' | 'medical-kit'
    activeItem: {
      name: 'Amoxicillin 500mg Capsule',
      batch: 'AMX-2025-047',
      expiry: '12/2026',
      inStock: 120,
      fefoCompliant: true,
      minStockThreshold: 150,
    },
    belowStockCount: 2,
  });

  // Featured Science Target
  const scienceTarget = ref({
    title: 'Clay-Rich Deposits',
    subtitle: 'Potential for ancient water activity.',
    confidence: 87,
    sol: 75,
    elevation_m: -2480,
    category: 'science_target',
    image: 'https://images-assets.nasa.gov/image/PIA24424/PIA24424~thumb.jpg',
  });

  function publishRoute(data) {
    routeData.value = data ? markRaw(data) : null;
  }

  function setInspectedEntity(entity) {
    inspectedEntity.value = entity ? markRaw(entity) : null;
  }

  function setStart(coord) {
    startCoord.value = { ...coord };
  }

  function setGoal(coord) {
    goalCoord.value = { ...coord };
  }

  function setActivePicker(target) {
    activePicker.value = target;
  }

  function setCursor(coords) {
    cursorCoords.value = { ...coords };
  }

  function setLayerVisibility(id, visible) {
    const layer = layerStates.value.find((l) => l.id === id);
    if (layer) layer.visible = visible;
  }

  function setLayerOpacity(id, opacity) {
    const layer = layerStates.value.find((l) => l.id === id);
    if (layer) layer.opacity = opacity;
  }

  function toggleCanvasMaximized() {
    isCanvasMaximized.value = !isCanvasMaximized.value;
  }

  function setActiveTab(tab) {
    activeTab.value = tab;
  }

  return {
    activeTab,
    isCanvasMaximized,
    routeData,
    inspectedEntity,
    startCoord,
    goalCoord,
    activePicker,
    isWelcomeOpen,
    isProvenanceOpen,
    cursorCoords,
    layerStates,
    alerts,
    crewHealth,
    lifeSupport,
    pharmaInventory,
    scienceTarget,
    publishRoute,
    setInspectedEntity,
    setStart,
    setGoal,
    setActivePicker,
    setCursor,
    setLayerVisibility,
    setLayerOpacity,
    toggleCanvasMaximized,
    setActiveTab,
  };
});
