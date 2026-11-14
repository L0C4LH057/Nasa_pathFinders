<script setup>
import { computed } from 'vue';
import { useMarsStore } from '../../stores/marsStore.js';

const store = useMarsStore();

const metrics = computed(() => [
  {
    key: 'oxygen',
    label: 'Oxygen Supply',
    valueStr: `${store.lifeSupport.oxygen.value}%`,
    percent: store.lifeSupport.oxygen.value,
    subtext: store.lifeSupport.oxygen.subtext,
    status: store.lifeSupport.oxygen.status,
    statusType: store.lifeSupport.oxygen.statusType,
    strokeColor: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.5)',
  },
  {
    key: 'co2',
    label: 'CO₂ Production',
    valueStr: `${store.lifeSupport.co2.value}%`,
    percent: (store.lifeSupport.co2.value / store.lifeSupport.co2.max) * 100,
    subtext: store.lifeSupport.co2.subtext,
    status: store.lifeSupport.co2.status,
    statusType: store.lifeSupport.co2.statusType,
    strokeColor: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.5)',
  },
  {
    key: 'water',
    label: 'Water Supply',
    valueStr: `${store.lifeSupport.water.value}%`,
    percent: store.lifeSupport.water.value,
    subtext: store.lifeSupport.water.subtext,
    status: store.lifeSupport.water.status,
    statusType: store.lifeSupport.water.statusType,
    strokeColor: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.5)',
  },
  {
    key: 'pressure',
    label: 'Cabin Pressure',
    valueStr: `${store.lifeSupport.pressure.value} psia`,
    percent: (store.lifeSupport.pressure.value / store.lifeSupport.pressure.max) * 100,
    subtext: store.lifeSupport.pressure.subtext,
    status: store.lifeSupport.pressure.status,
    statusType: store.lifeSupport.pressure.statusType,
    strokeColor: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.5)',
  },
]);

// Circular math: radius 32 -> circumference = 2 * PI * 32 ~= 201.06
const CIRCUMFERENCE = 201.06;

function getDashOffset(percent) {
  const clamped = Math.min(100, Math.max(0, percent));
  return CIRCUMFERENCE - (clamped / 100) * CIRCUMFERENCE;
}
</script>

<template>
  <div class="neo-card life-support-card">
    <div class="neo-card-inner">
      <div class="card-header">
        <div class="header-left">
          <svg viewBox="0 0 24 24" class="header-icon">
            <path fill="currentColor" d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 2.18l7 3.12v4.7c0 4.67-3.13 8.94-7 10.05-3.87-1.11-7-5.38-7-10.05V6.3l7-3.12z"/>
          </svg>
          <h2 class="card-title">Life-Support Monitoring</h2>
        </div>
        <button class="view-details-btn" @click="store.setActiveTab('life-support')">
          View Details &rarr;
        </button>
      </div>

      <!-- 4 Neomorphic Circular Gauges -->
      <div class="gauges-grid">
        <div v-for="m in metrics" :key="m.key" class="gauge-item">
          <div class="gauge-label">{{ m.label }}</div>

          <div class="radial-gauge-container">
            <!-- Background Neomorphic Ring -->
            <div class="gauge-well neo-sunken">
              <svg viewBox="0 0 80 80" class="radial-svg">
                <!-- Track circle -->
                <circle
                  cx="40"
                  cy="40"
                  r="32"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.05)"
                  stroke-width="5"
                />
                <!-- Progress circle -->
                <circle
                  cx="40"
                  cy="40"
                  r="32"
                  fill="none"
                  :stroke="m.strokeColor"
                  stroke-width="5.5"
                  stroke-linecap="round"
                  :stroke-dasharray="CIRCUMFERENCE"
                  :stroke-dashoffset="getDashOffset(m.percent)"
                  :style="{ filter: `drop-shadow(0 0 4px ${m.glowColor})` }"
                  transform="rotate(-90 40 40)"
                  class="progress-circle"
                />
              </svg>

              <!-- Central Knob with readout -->
              <div class="gauge-knob">
                <span class="gauge-val font-mono">{{ m.valueStr }}</span>
              </div>
            </div>
          </div>

          <div class="gauge-subtext">{{ m.subtext }}</div>

          <div class="gauge-status-row">
            <span class="status-dot" :class="'dot-' + m.statusType"></span>
            <span class="status-lbl" :class="'lbl-' + m.statusType">{{ m.status }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.life-support-card {
  width: 100%;
  height: 100%;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-icon {
  width: 18px;
  height: 18px;
  color: #10b981;
}

.card-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  color: #f8fafc;
  letter-spacing: 0.02em;
}

.view-details-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.15s ease;
}

.view-details-btn:hover {
  color: #00d2ff;
}

.gauges-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.gauge-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.gauge-label {
  font-size: 0.74rem;
  font-weight: 600;
  color: #cbd5e1;
  margin-bottom: 6px;
  white-space: nowrap;
}

.radial-gauge-container {
  width: 78px;
  height: 78px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 6px;
}

.gauge-well {
  width: 78px;
  height: 78px;
  border-radius: 50%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.radial-svg {
  width: 78px;
  height: 78px;
  position: absolute;
  top: 0;
  left: 0;
}

.progress-circle {
  transition: stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.gauge-knob {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  background: #111520;
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: -2px -2px 5px rgba(255, 255, 255, 0.04), 3px 3px 7px rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}

.gauge-val {
  font-size: 0.74rem;
  font-weight: 700;
  color: #f8fafc;
  line-height: 1;
  white-space: nowrap;
}

.font-mono {
  font-family: var(--neo-font-mono, monospace);
}

.gauge-subtext {
  font-size: 0.66rem;
  font-family: var(--neo-font-mono, monospace);
  color: #64748b;
  margin-bottom: 4px;
  white-space: nowrap;
}

.gauge-status-row {
  display: flex;
  align-items: center;
  gap: 5px;
}

.status-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
}

.dot-normal {
  background: #10b981;
  box-shadow: 0 0 5px rgba(16, 185, 129, 0.8);
}

.dot-warning {
  background: #f59e0b;
  box-shadow: 0 0 5px rgba(245, 158, 11, 0.8);
}

.status-lbl {
  font-size: 0.68rem;
  font-weight: 600;
}

.lbl-normal {
  color: #34d399;
}

.lbl-warning {
  color: #fbbf24;
}
</style>
