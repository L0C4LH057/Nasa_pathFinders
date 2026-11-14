<script setup>
import { computed, ref } from 'vue';
import { useMarsStore } from '../../stores/marsStore.js';

const store = useMarsStore();

const isLayerMenuOpen = ref(false);

const layers = computed(() => store.layerStates);
const isMaximized = computed(() => store.isCanvasMaximized);

function toggleLayer(id) {
  if (window.__marsController) {
    window.__marsController.toggleLayer(id);
  } else {
    const layer = store.layerStates.find((l) => l.id === id);
    if (layer) store.setLayerVisibility(id, !layer.visible);
  }
}

function zoomIn() {
  if (window.__marsController) {
    window.__marsController.zoomIn();
  }
}

function zoomOut() {
  if (window.__marsController) {
    window.__marsController.zoomOut();
  }
}

function resetNorth() {
  if (window.__marsController) {
    window.__marsController.resetHeadingNorth();
  }
}

function toggleExpand() {
  store.toggleCanvasMaximized();
}
</script>

<template>
  <div class="in-canvas-controls" :class="{ maximized: isMaximized }">
    <!-- Top-Left: Map Layers Dropdown -->
    <div class="layer-control-wrap">
      <button
        class="layer-toggle-btn neo-btn-floating"
        @click="isLayerMenuOpen = !isLayerMenuOpen"
      >
        <svg viewBox="0 0 24 24" class="btn-icon">
          <path fill="currentColor" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
        <span>Map Layers</span>
        <svg viewBox="0 0 24 24" class="chevron-svg" :class="{ open: isLayerMenuOpen }"><path fill="currentColor" d="M7 10l5 5 5-5z"/></svg>
      </button>

      <!-- Dropdown Card -->
      <div v-if="isLayerMenuOpen" class="layer-menu-popup neo-sunken">
        <div class="popup-title">Surface & Imagery Layers</div>
        <div
          v-for="ly in layers"
          :key="ly.id"
          class="layer-item"
          @click="toggleLayer(ly.id)"
        >
          <input
            type="checkbox"
            :checked="ly.visible"
            class="layer-chk"
            @click.stop="toggleLayer(ly.id)"
          />
          <span class="layer-name" :class="{ active: ly.visible }">{{ ly.name }}</span>
        </div>
      </div>
    </div>

    <!-- Top-Right: North Compass & Fullscreen Toggle -->
    <div class="top-right-group">
      <button
        class="compass-btn neo-btn-floating"
        title="Reset Heading North"
        @click="resetNorth"
      >
        <svg viewBox="0 0 24 24" class="compass-svg"><path fill="#ef4444" d="M12 2L6.5 14h11L12 2z"/><path fill="#64748b" d="M6.5 14L12 22l5.5-8h-11z"/></svg>
      </button>

      <button
        class="expand-btn neo-btn-floating"
        :title="isMaximized ? 'Restore View' : 'Maximize Canvas'"
        @click="toggleExpand"
      >
        <svg v-if="!isMaximized" viewBox="0 0 24 24" class="btn-icon">
          <path fill="currentColor" d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
        </svg>
        <svg v-else viewBox="0 0 24 24" class="btn-icon">
          <path fill="currentColor" d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
        </svg>
      </button>
    </div>

    <!-- Right-Middle: Zoom In / Zoom Out -->
    <div class="zoom-controls">
      <button
        class="zoom-btn neo-btn-floating"
        title="Zoom In"
        @click="zoomIn"
      >
        +
      </button>
      <button
        class="zoom-btn neo-btn-floating"
        title="Zoom Out"
        @click="zoomOut"
      >
        −
      </button>
    </div>

    <!-- Bottom-Left: Scale Bar -->
    <div class="scale-bar-container neo-sunken">
      <div class="scale-ticks">
        <div class="tick-line"></div>
      </div>
      <div class="scale-lbl">5 km</div>
    </div>

    <!-- Bottom Center: Coordinate Readout -->
    <div class="coord-pill neo-sunken">
      <span>LAT: {{ store.cursorCoords.lat }}°N</span>
      <span class="sep">|</span>
      <span>LON: {{ store.cursorCoords.lon }}°E</span>
      <span class="sep">|</span>
      <span>ALT: {{ store.cursorCoords.alt }} m</span>
    </div>
  </div>
</template>

<style scoped>
.in-canvas-controls {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  padding: 14px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  z-index: 10;
}

.neo-btn-floating {
  pointer-events: auto;
  background: rgba(17, 21, 32, 0.88);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #f8fafc;
  border-radius: 8px;
  box-shadow: -2px -2px 6px rgba(255, 255, 255, 0.04), 4px 4px 10px rgba(0, 0, 0, 0.7);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.neo-btn-floating:hover {
  background: #151a28;
  border-color: rgba(0, 210, 255, 0.35);
  box-shadow: -3px -3px 8px rgba(255, 255, 255, 0.05), 5px 5px 12px rgba(0, 0, 0, 0.8);
}

.neo-btn-floating:active {
  box-shadow: inset 2px 2px 4px rgba(0, 0, 0, 0.8);
}

/* Layer Control */
.layer-control-wrap {
  position: relative;
  width: max-content;
}

.layer-toggle-btn {
  padding: 7px 12px;
  gap: 8px;
  font-size: 0.8rem;
  font-weight: 600;
}

.btn-icon {
  width: 16px;
  height: 16px;
  color: #00d2ff;
}

.chevron-svg {
  width: 14px;
  height: 14px;
  color: #94a3b8;
  transition: transform 0.15s ease;
}

.chevron-svg.open {
  transform: rotate(180deg);
}

.layer-menu-popup {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  width: 250px;
  padding: 10px;
  pointer-events: auto;
  background: rgba(9, 12, 18, 0.94);
  backdrop-filter: blur(14px);
  z-index: 20;
}

.popup-title {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #64748b;
  margin-bottom: 8px;
  letter-spacing: 0.05em;
}

.layer-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 6px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.12s ease;
}

.layer-item:hover {
  background: rgba(255, 255, 255, 0.04);
}

.layer-chk {
  cursor: pointer;
  accent-color: #00d2ff;
}

.layer-name {
  font-size: 0.76rem;
  color: #94a3b8;
  user-select: none;
}

.layer-name.active {
  color: #f1f5f9;
  font-weight: 600;
}

/* Top-Right Group */
.top-right-group {
  position: absolute;
  top: 14px;
  right: 14px;
  display: flex;
  gap: 8px;
}

.compass-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.compass-svg {
  width: 20px;
  height: 20px;
}

.expand-btn {
  width: 36px;
  height: 36px;
}

/* Right Zoom Buttons */
.zoom-controls {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.zoom-btn {
  width: 34px;
  height: 34px;
  font-size: 1.2rem;
  font-family: var(--neo-font-mono, monospace);
  font-weight: 600;
  color: #f1f5f9;
}

/* Scale Bar */
.scale-bar-container {
  position: absolute;
  bottom: 14px;
  left: 14px;
  padding: 4px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: auto;
}

.scale-ticks {
  width: 60px;
  height: 6px;
  border-left: 2px solid #f1f5f9;
  border-right: 2px solid #f1f5f9;
  border-bottom: 2px solid #f1f5f9;
  position: relative;
}

.scale-lbl {
  font-family: var(--neo-font-mono, monospace);
  font-size: 0.68rem;
  color: #cbd5e1;
  margin-top: 2px;
}

/* Coordinate Readout */
.coord-pill {
  position: absolute;
  bottom: 14px;
  left: 50%;
  transform: translateX(-50%);
  padding: 4px 12px;
  font-family: var(--neo-font-mono, monospace);
  font-size: 0.72rem;
  color: #94a3b8;
  display: flex;
  align-items: center;
  gap: 8px;
  pointer-events: auto;
}

.sep {
  color: #475569;
}
</style>
