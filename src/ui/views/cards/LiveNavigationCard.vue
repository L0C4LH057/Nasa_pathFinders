<script setup>
import { computed } from 'vue';
import { useMarsStore } from '../../stores/marsStore.js';

const store = useMarsStore();

const remainingDistFormatted = computed(() => {
  const m = store.navigationRemainingDistM || 0;
  if (m >= 1000) {
    return `${(m / 1000).toFixed(1)} km`;
  }
  return `${m} m`;
});

const etaFormatted = computed(() => {
  const m = store.navigationRemainingDistM || 0;
  const speed = (store.navigationCurrentSpeedMps || 1.2);
  const secs = m / Math.max(0.1, speed);
  const mins = Math.round(secs / 60);
  if (mins >= 60) {
    const hrs = (mins / 60).toFixed(1);
    return `~ ${hrs} hrs`;
  }
  return `~ ${mins} min`;
});

function togglePause() {
  store.pauseNavigation();
}

function stopNav() {
  store.stopNavigation();
}

function setSpeed(mult) {
  store.setSpeedMultiplier(mult);
}

function toggleCam() {
  store.toggleCameraFollow();
}
</script>

<template>
  <div v-if="store.isNavigating" class="nav-hud-container">
    <!-- Top Google Maps-Style Maneuver Banner -->
    <div class="nav-banner-top neo-card">
      <div class="maneuver-icon-box">
        <svg viewBox="0 0 24 24" class="maneuver-svg">
          <path fill="currentColor" d="M14 6l-3.75 5 2.85 3.8-1.6 1.2L7 10l-6 8h22L14 6z"/>
        </svg>
      </div>

      <div class="maneuver-info">
        <div class="maneuver-dist">In {{ store.navigationNextDistM }} m</div>
        <div class="maneuver-instruction">{{ store.navigationNextManeuver }}</div>
      </div>

      <button class="nav-close-btn" @click="stopNav" title="Exit Navigation">
        <svg viewBox="0 0 24 24" class="close-svg">
          <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </button>
    </div>

    <!-- Bottom Google Maps-Style Driving Bar -->
    <div class="nav-bar-bottom neo-card">
      <div class="nav-metric-group">
        <span class="nav-eta">{{ etaFormatted }}</span>
        <span class="nav-sub">{{ remainingDistFormatted }} &bull; {{ store.navigationCurrentSpeedMps }} m/s</span>
      </div>

      <!-- Controls: Play/Pause, Speed, Camera, End -->
      <div class="nav-controls-row">
        <!-- Play / Pause -->
        <button
          class="nav-btn-icon"
          :class="{ active: !store.isNavigationPaused }"
          @click="togglePause"
          :title="store.isNavigationPaused ? 'Resume Navigation' : 'Pause Navigation'"
        >
          <svg v-if="store.isNavigationPaused" viewBox="0 0 24 24" class="ctrl-svg">
            <path fill="currentColor" d="M8 5v14l11-7z"/>
          </svg>
          <svg v-else viewBox="0 0 24 24" class="ctrl-svg">
            <path fill="currentColor" d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
          </svg>
        </button>

        <!-- Speed Selectors -->
        <div class="speed-selector neo-sunken">
          <button
            v-for="s in [1, 5, 20, 50]"
            :key="s"
            class="speed-btn"
            :class="{ active: store.navigationSpeedMultiplier === s }"
            @click="setSpeed(s)"
          >
            {{ s }}x
          </button>
        </div>

        <!-- Camera Follow Toggle -->
        <button
          class="nav-btn-icon"
          :class="{ active: store.cameraFollowMode }"
          @click="toggleCam"
          :title="store.cameraFollowMode ? 'Chase Cam: Following Rover' : 'Free Cam: Detached'"
        >
          <svg viewBox="0 0 24 24" class="ctrl-svg">
            <circle cx="12" cy="12" r="3.2" fill="currentColor"/>
            <path fill="currentColor" d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
          </svg>
        </button>

        <!-- Exit Navigation -->
        <button class="nav-exit-btn" @click="stopNav" title="Exit Driving Navigation">
          Exit
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.nav-hud-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 100;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
}

/* Top Maneuver Banner */
.nav-banner-top {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 14px;
  background: var(--neo-card-bg);
  border: 1px solid var(--neo-border);
  border-radius: 12px;
  padding: 12px 18px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45), var(--neo-shadow-card);
  max-width: 520px;
  width: 100%;
  animation: slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.maneuver-icon-box {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--neo-green), #059669);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  flex-shrink: 0;
  box-shadow: 0 0 14px rgba(16, 185, 129, 0.4);
}

.maneuver-svg {
  width: 24px;
  height: 24px;
}

.maneuver-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.maneuver-dist {
  font-family: var(--neo-font-mono);
  font-size: 0.96rem;
  font-weight: 800;
  color: var(--neo-text-primary);
}

.maneuver-instruction {
  font-size: 0.82rem;
  font-weight: 500;
  color: var(--neo-text-secondary);
}

.nav-close-btn {
  background: transparent;
  border: none;
  color: var(--neo-text-muted);
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.nav-close-btn:hover {
  color: var(--neo-red);
  background: rgba(239, 68, 68, 0.15);
}

.close-svg {
  width: 20px;
  height: 20px;
}

/* Bottom Driving Bar */
.nav-bar-bottom {
  pointer-events: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  background: var(--neo-card-bg);
  border: 1px solid var(--neo-border);
  border-radius: 14px;
  padding: 12px 22px;
  box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.45), var(--neo-shadow-card);
  max-width: 620px;
  width: 100%;
  animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.nav-metric-group {
  display: flex;
  flex-direction: column;
}

.nav-eta {
  font-family: var(--neo-font-mono);
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--neo-green);
  text-shadow: 0 0 10px rgba(16, 185, 129, 0.35);
}

.nav-sub {
  font-size: 0.78rem;
  color: var(--neo-text-secondary);
}

.nav-controls-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.nav-btn-icon {
  background: var(--neo-card-bg);
  border: 1px solid var(--neo-border);
  color: var(--neo-text-secondary);
  border-radius: 8px;
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: var(--neo-shadow-btn);
  transition: all 0.2s ease;
}

.nav-btn-icon:hover {
  color: var(--neo-cyan);
  border-color: rgba(0, 210, 255, 0.4);
}

.nav-btn-icon.active {
  background: rgba(0, 210, 255, 0.18);
  border-color: var(--neo-cyan);
  color: var(--neo-cyan);
}

.ctrl-svg {
  width: 18px;
  height: 18px;
}

.speed-selector {
  display: flex;
  padding: 3px;
  border-radius: 8px;
  gap: 2px;
}

.speed-btn {
  background: transparent;
  border: none;
  font-family: var(--neo-font-mono);
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--neo-text-muted);
  padding: 4px 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
}

.speed-btn.active {
  background: var(--neo-cyan);
  color: #000000;
  box-shadow: 0 0 8px rgba(0, 210, 255, 0.4);
}

.nav-exit-btn {
  background: var(--neo-red);
  color: #ffffff;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 0 10px rgba(239, 68, 68, 0.4);
  transition: all 0.2s;
}

.nav-exit-btn:hover {
  background: #dc2626;
  box-shadow: 0 0 14px rgba(239, 68, 68, 0.6);
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-16px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
