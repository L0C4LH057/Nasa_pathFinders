import { defineStore } from 'pinia';
import { markRaw, shallowRef, ref, computed } from 'vue';
import { MARS_DESTINATIONS } from '../../destinations.js';

export const useMarsStore = defineStore('mars-pathfinder', () => {
  // Navigation tabs: 'mission-control' | 'pharma' | 'life-support' | 'alerts' | 'settings'
  const activeTab = ref('mission-control');

  // Big Canvas View Mode: true expands canvas to 100% full screen
  const isCanvasMaximized = ref(false);

  // Theme: 'dark' | 'light' (saved in localStorage)
  const currentTheme = ref(typeof window !== 'undefined' ? (localStorage.getItem('mars_theme') || 'dark') : 'dark');

  // Planetary Destinations across Mars
  const selectedDestinationId = ref('jezero');
  const destinations = ref(MARS_DESTINATIONS);
  const currentDestination = computed(() =>
    destinations.value.find((d) => d.id === selectedDestinationId.value) || destinations.value[0]
  );

  // Route presentation snapshot (shallowRef to prevent Vue proxying of large point arrays)
  const routeData = shallowRef(null);

  // Inspected science target or hazard entity
  const inspectedEntity = shallowRef(null);

  // Selected Start and Destination coordinates
  const startCoord = ref({
    label: 'Start (Jezero Delta)',
    lat: 18.435,
    lon: 77.425,
  });

  const goalCoord = ref({
    label: 'Destination (Neretva Region)',
    lat: 18.490,
    lon: 77.490,
  });

  // Current active picking target: 'start' | 'goal' | null
  const activePicker = ref(null);

  // Live Navigation Simulation State (Google Maps driving guidance)
  const isNavigating = ref(false);
  const isNavigationPaused = ref(false);
  const navigationSpeedMultiplier = ref(5); // 1x, 5x, 20x, 50x
  const navigationProgress = ref(0.0); // 0.0 to 1.0
  const navigationCurrentPoint = shallowRef(null);
  const navigationRemainingDistM = ref(0);
  const navigationHeadingDeg = ref(0);
  const navigationCurrentSpeedMps = ref(1.2);
  const navigationNextManeuver = ref('Head northeast toward Neretva Margin');
  const navigationNextDistM = ref(350);
  const cameraFollowMode = ref(true); // Follow rover in 3D chase mode

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
    { id: 'mars-esri-ctx', name: 'Caltech Murray Lab CTX 5m Global Mosaic', visible: true, opacity: 100 },
    { id: 'mars-hazards', name: 'Mapped Road Hazards & Dunes', visible: true, opacity: 85 },
    { id: 'mars-science', name: 'Science Targets & Waypoints', visible: true, opacity: 100 },
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

  function toggleTheme() {
    currentTheme.value = currentTheme.value === 'light' ? 'dark' : 'light';
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('theme-light', currentTheme.value === 'light');
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('mars_theme', currentTheme.value);
    }
  }

  function setDestination(id) {
    const dest = destinations.value.find((d) => d.id === id);
    if (!dest) return;
    selectedDestinationId.value = id;
    if (dest.defaultStart) startCoord.value = { ...dest.defaultStart };
    if (dest.defaultGoal) goalCoord.value = { ...dest.defaultGoal };
    stopNavigation();
    if (window.__marsController) {
      window.__marsController.onDestinationChange(id);
    }
  }

  function swapStartAndGoal() {
    const tmp = { ...startCoord.value };
    startCoord.value = { ...goalCoord.value };
    goalCoord.value = tmp;
    stopNavigation();
    if (window.__marsController) {
      window.__marsController.computeRoute();
    }
  }

  function startNavigation() {
    isNavigating.value = true;
    isNavigationPaused.value = false;
    navigationProgress.value = 0.0;
    if (window.__marsController) {
      window.__marsController.startTraverseNavigation();
    }
  }

  function pauseNavigation() {
    isNavigationPaused.value = !isNavigationPaused.value;
  }

  function stopNavigation() {
    isNavigating.value = false;
    isNavigationPaused.value = false;
    navigationProgress.value = 0.0;
    if (window.__marsController) {
      window.__marsController.stopTraverseNavigation();
    }
  }

  function setSpeedMultiplier(mult) {
    navigationSpeedMultiplier.value = mult;
  }

  function toggleCameraFollow() {
    cameraFollowMode.value = !cameraFollowMode.value;
  }

  function setActiveTab(tab) {
    activeTab.value = tab;
  }

  return {
    activeTab,
    isCanvasMaximized,
    currentTheme,
    selectedDestinationId,
    destinations,
    currentDestination,
    routeData,
    inspectedEntity,
    startCoord,
    goalCoord,
    activePicker,
    isNavigating,
    isNavigationPaused,
    navigationSpeedMultiplier,
    navigationProgress,
    navigationCurrentPoint,
    navigationRemainingDistM,
    navigationHeadingDeg,
    navigationCurrentSpeedMps,
    navigationNextManeuver,
    navigationNextDistM,
    cameraFollowMode,
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
    toggleTheme,
    setDestination,
    swapStartAndGoal,
    startNavigation,
    pauseNavigation,
    stopNavigation,
    setSpeedMultiplier,
    toggleCameraFollow,
    setActiveTab,
  };
});
