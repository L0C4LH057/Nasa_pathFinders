<script setup>
import { computed, ref } from 'vue';
import { useMarsStore } from '../../stores/marsStore.js';

const store = useMarsStore();

const activeWaypoints = computed(() => {
  return store.currentDestination?.waypoints || [];
});

const isComputing = ref(false);
const showWaypoints = ref(false);

const distanceDisplay = computed(() => {
  if (store.routeData?.outbound?.points?.length > 0) {
    const last = store.routeData.outbound.points[store.routeData.outbound.points.length - 1];
    if (last.cumulative_dist_m) {
      return `${(last.cumulative_dist_m / 1000.0).toFixed(1)} km`;
    }
  }
  return '12.8 km';
});

const elevationChangeDisplay = computed(() => {
  if (store.routeData?.outbound) {
    const gain = Math.round(store.routeData.outbound.elevation_gain_m || 320);
    const loss = Math.round(store.routeData.outbound.elevation_loss_m || 310);
    return `+${gain} m / -${loss} m`;
  }
  return '+320 m / -310 m';
});

const estimatedTimeDisplay = computed(() => {
  if (store.routeData?.resources?.estimated_duration_hr) {
    const dur = (store.routeData.resources.estimated_duration_hr / 2.0).toFixed(1);
    return `~ ${dur} hrs`;
  }
  return '~ 4.2 hrs';
});

function onStartChange(e) {
  const wp = activeWaypoints.value.find((w) => w.label === e.target.value);
  if (wp) {
    store.setStart(wp);
    computeOptimalTraverse();
  }
}

function onGoalChange(e) {
  const wp = activeWaypoints.value.find((w) => w.label === e.target.value);
  if (wp) {
    store.setGoal(wp);
    computeOptimalTraverse();
  }
}

function pickStartOnMap() {
  if (window.__marsController) {
    window.__marsController.armCoordinatePicker('start');
  }
}

function pickGoalOnMap() {
  if (window.__marsController) {
    window.__marsController.armCoordinatePicker('goal');
  }
}

function swapPoints() {
  store.swapStartAndGoal();
}

function startNavigation() {
  store.startNavigation();
}

async function computeOptimalTraverse() {
  if (!window.__marsController) return;
  isComputing.value = true;
  try {
    await window.__marsController.computeRoute();
  } catch (err) {
    console.error('Route calculation error:', err);
  } finally {
    isComputing.value = false;
  }
}
</script>

<template>
  <div class="neo-card mission-overview-card">
    <div class="neo-card-inner">
      <div class="neo-card-header">
        <h2 class="neo-card-title">
          <svg viewBox="0 0 24 24" class="title-svg"><circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" stroke-width="1.8"/><ellipse cx="12" cy="12" rx="10" ry="3.5" fill="none" stroke="currentColor" stroke-width="1.3" transform="rotate(-20 12 12)"/></svg>
          <span>Mission Overview</span>
        </h2>
        <span class="badge-sol">SOL 75 &bull; NOMINAL</span>
      </div>

      <!-- Overview Header Summary -->
      <div class="overview-grid">
        <div class="planet-thumb">
          <div class="mars-sphere"></div>
        </div>
        <div class="overview-details">
          <div class="detail-row">
            <span class="lbl">Current Location</span>
            <span class="val">{{ store.currentDestination.name }}</span>
          </div>
          <div class="detail-row">
            <span class="lbl">Destination</span>
            <span class="val accent-val">{{ store.goalCoord.label }}</span>
          </div>
          <div class="detail-row">
            <span class="lbl">Estimated Time</span>
            <span class="val highlight-time">{{ estimatedTimeDisplay }}</span>
          </div>
        </div>
      </div>

      <!-- Quick Metrics Strip -->
      <div class="stats-pills neo-sunken">
        <div class="pill-stat">
          <svg viewBox="0 0 24 24" class="pill-svg"><path fill="currentColor" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z"/></svg>
          <div class="pill-text">
            <span class="pill-lbl">Distance</span>
            <span class="pill-val">{{ distanceDisplay }}</span>
          </div>
        </div>

        <div class="pill-stat">
          <svg viewBox="0 0 24 24" class="pill-svg"><path fill="currentColor" d="M14 6l-3.75 5 2.85 3.8-1.6 1.2L7 10l-6 8h22L14 6z"/></svg>
          <div class="pill-text">
            <span class="pill-lbl">Elevation Change</span>
            <span class="pill-val">{{ elevationChangeDisplay }}</span>
          </div>
        </div>

        <div class="pill-stat">
          <svg viewBox="0 0 24 24" class="pill-svg"><path fill="currentColor" d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
          <div class="pill-text">
            <span class="pill-lbl">Route Risk</span>
            <span class="pill-val badge-risk">Low - Moderate</span>
          </div>
        </div>
      </div>

      <!-- Google Maps-Style Start Navigation & Route Details Actions -->
      <div class="actions-strip">
        <button
          class="start-nav-btn neo-btn"
          :class="{ active: store.isNavigating }"
          @click="startNavigation"
          title="Start Live Turn-by-Turn Driving Navigation"
        >
          <svg viewBox="0 0 24 24" class="nav-icon-svg">
            <path fill="currentColor" d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
          </svg>
          <span>{{ store.isNavigating ? 'Navigating...' : 'Start Navigation' }}</span>
        </button>

        <button class="footer-link-btn" @click="showWaypoints = !showWaypoints">
          <span>{{ showWaypoints ? 'Hide Inputs' : 'Waypoints' }}</span>
          <svg viewBox="0 0 24 24" class="link-arrow"><path fill="currentColor" d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/></svg>
        </button>
      </div>

      <!-- Collapsible Waypoint Coordination Pickers (Google Maps Style) -->
      <div v-if="showWaypoints" class="waypoints-picker">
        <div class="picker-row">
          <div class="picker-label-group">
            <span class="pin-dot pin-start">A</span>
            <span class="wp-title">Start Point</span>
          </div>
          <div class="picker-input-wrap">
            <select class="neo-select" :value="store.startCoord.label" @change="onStartChange">
              <option v-for="w in activeWaypoints" :key="w.label" :value="w.label">{{ w.label }}</option>
              <option v-if="!activeWaypoints.some(w => w.label === store.startCoord.label)" :value="store.startCoord.label">
                {{ store.startCoord.label }}
              </option>
            </select>
            <button
              class="neo-btn pick-crosshair-btn"
              :class="{ active: store.activePicker === 'start' }"
              @click="pickStartOnMap"
              title="Pick start location on 3D Mars globe"
            >
              <svg viewBox="0 0 24 24" class="crosshair-svg"><circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" stroke-width="1.8"/><line x1="12" y1="2" x2="12" y2="6" stroke="currentColor" stroke-width="1.8"/><line x1="12" y1="18" x2="12" y2="22" stroke="currentColor" stroke-width="1.8"/><line x1="2" y1="12" x2="6" y2="12" stroke="currentColor" stroke-width="1.8"/><line x1="18" y1="12" x2="22" y2="12" stroke="currentColor" stroke-width="1.8"/></svg>
            </button>
          </div>
        </div>

        <!-- Google Maps-style Swap Button -->
        <div class="swap-row">
          <button class="swap-btn" @click="swapPoints" title="Swap Start and Destination">
            <svg viewBox="0 0 24 24" class="swap-svg">
              <path fill="currentColor" d="M16 17.01V10h-2v7.01h-3L15 21l4-3.99h-3zM9 3L5 6.99h3V14h2V6.99h3L9 3z"/>
            </svg>
          </button>
        </div>

        <div class="picker-row">
          <div class="picker-label-group">
            <span class="pin-dot pin-goal">B</span>
            <span class="wp-title">Destination</span>
          </div>
          <div class="picker-input-wrap">
            <select class="neo-select" :value="store.goalCoord.label" @change="onGoalChange">
              <option v-for="w in activeWaypoints" :key="w.label" :value="w.label">{{ w.label }}</option>
              <option v-if="!activeWaypoints.some(w => w.label === store.goalCoord.label)" :value="store.goalCoord.label">
                {{ store.goalCoord.label }}
              </option>
            </select>
            <button
              class="neo-btn pick-crosshair-btn"
              :class="{ active: store.activePicker === 'goal' }"
              @click="pickGoalOnMap"
              title="Pick destination location on 3D Mars globe"
            >
              <svg viewBox="0 0 24 24" class="crosshair-svg"><circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" stroke-width="1.8"/><line x1="12" y1="2" x2="12" y2="6" stroke="currentColor" stroke-width="1.8"/><line x1="12" y1="18" x2="12" y2="22" stroke="currentColor" stroke-width="1.8"/><line x1="2" y1="12" x2="6" y2="12" stroke="currentColor" stroke-width="1.8"/><line x1="18" y1="12" x2="22" y2="12" stroke="currentColor" stroke-width="1.8"/></svg>
            </button>
          </div>
        </div>

        <!-- Recompute Button -->
        <button
          class="neo-btn neo-btn-primary full-width-btn"
          :disabled="isComputing"
          @click="computeOptimalTraverse"
        >
          <span v-if="isComputing" class="spinner"></span>
          <span v-else>Recalculate Traverse &rarr;</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mission-overview-card {
  width: 100%;
}

.title-svg {
  width: 18px;
  height: 18px;
  color: var(--neo-cyan);
}

.badge-sol {
  font-family: var(--neo-font-mono, monospace);
  font-size: 0.65rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 6px;
  background: rgba(0, 210, 255, 0.12);
  color: var(--neo-cyan);
  border: 1px solid rgba(0, 210, 255, 0.3);
  letter-spacing: 0.04em;
}

.pill-svg {
  width: 16px;
  height: 16px;
  color: var(--neo-cyan);
  flex-shrink: 0;
}

.crosshair-svg {
  width: 14px;
  height: 14px;
}

.overview-grid {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 14px;
}

.planet-thumb {
  width: 58px;
  height: 58px;
  flex-shrink: 0;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #ff8c5a 0%, #c44a1d 55%, #3d1406 100%);
  box-shadow: 
    inset -3px -3px 8px rgba(0, 0, 0, 0.8),
    0 0 16px rgba(255, 107, 53, 0.35);
  position: relative;
  overflow: hidden;
}

.overview-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.78rem;
}

.detail-row .lbl {
  color: var(--neo-text-muted);
}

.detail-row .val {
  font-weight: 600;
  color: var(--neo-text-primary);
}

.accent-val {
  color: var(--neo-orange);
}

.highlight-time {
  font-family: var(--neo-font-mono);
  color: var(--neo-cyan);
}

/* Stats Pills Strip */
.stats-pills {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  margin-bottom: 14px;
}

.pill-stat {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pill-icon {
  font-size: 0.95rem;
  width: 20px;
  text-align: center;
}

.pill-text {
  display: flex;
  justify-content: space-between;
  width: 100%;
  align-items: center;
}

.pill-lbl {
  font-size: 0.74rem;
  color: var(--neo-text-muted);
}

.pill-val {
  font-size: 0.82rem;
  font-weight: 700;
  font-family: var(--neo-font-mono);
  color: var(--neo-text-primary);
}

.badge-risk {
  font-size: 0.72rem;
  color: #fbbf24;
}

.actions-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 6px;
}

.start-nav-btn {
  flex: 1;
  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
  color: #ffffff;
  border: 1px solid rgba(16, 185, 129, 0.4);
  font-weight: 700;
  font-size: 0.82rem;
  padding: 8px 12px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
  transition: all 0.2s ease;
}

.start-nav-btn:hover {
  background: linear-gradient(135deg, #047857 0%, #059669 100%);
  box-shadow: 0 6px 18px rgba(16, 185, 129, 0.5);
  transform: translateY(-1px);
}

.start-nav-btn.active {
  background: linear-gradient(135deg, #0284c7 0%, #00d2ff 100%);
  border-color: rgba(0, 210, 255, 0.5);
  box-shadow: 0 0 14px rgba(0, 210, 255, 0.45);
}

.nav-icon-svg {
  width: 15px;
  height: 15px;
  transform: rotate(45deg);
}

.swap-row {
  display: flex;
  justify-content: center;
  margin: -4px 0;
}

.swap-btn {
  background: var(--neo-card-bg);
  border: 1px solid var(--neo-border);
  color: var(--neo-cyan);
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: var(--neo-shadow-btn);
  transition: all 0.2s ease;
  z-index: 2;
}

.swap-btn:hover {
  border-color: var(--neo-cyan);
  background: rgba(0, 210, 255, 0.15);
  transform: scale(1.1);
}

.swap-svg {
  width: 14px;
  height: 14px;
}

.card-footer-action {
  display: flex;
  justify-content: flex-end;
  margin-top: 6px;
}

.footer-link-btn {
  background: none;
  border: none;
  color: var(--neo-cyan);
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 6px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.footer-link-btn:hover {
  color: #38bdf8;
  text-shadow: 0 0 8px rgba(0, 210, 255, 0.4);
}

.link-arrow {
  width: 14px;
  height: 14px;
}

/* Waypoints Selection */
.waypoints-picker {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 14px;
}

.picker-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.picker-label-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.pin-dot {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  font-size: 0.65rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #000;
}

.pin-start {
  background: var(--neo-green);
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
}

.pin-goal {
  background: var(--neo-red);
  box-shadow: 0 0 8px rgba(239, 68, 68, 0.6);
}

.wp-title {
  font-size: 0.72rem;
  text-transform: uppercase;
  color: var(--neo-text-secondary);
  font-weight: 600;
}

.picker-input-wrap {
  display: flex;
  gap: 6px;
}

.neo-select {
  flex: 1;
  background: var(--neo-card-sunken);
  color: var(--neo-text-primary);
  border: 1px solid var(--neo-border);
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 0.76rem;
  outline: none;
  font-family: var(--neo-font-sans);
  box-shadow: var(--neo-shadow-inset);
}

.neo-select:focus {
  border-color: rgba(0, 210, 255, 0.5);
}

.pick-crosshair-btn {
  padding: 6px 10px;
  border-radius: 8px;
}

.pick-crosshair-btn.active {
  background: rgba(0, 210, 255, 0.25);
  border-color: var(--neo-cyan);
  box-shadow: 0 0 10px rgba(0, 210, 255, 0.5);
}

.full-width-btn {
  width: 100%;
  justify-content: center;
  padding: 10px;
  font-size: 0.86rem;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(0, 210, 255, 0.3);
  border-top-color: var(--neo-cyan);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
