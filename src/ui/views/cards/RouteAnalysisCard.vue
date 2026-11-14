<script setup>
import { computed } from 'vue';
import { useMarsStore } from '../../stores/marsStore.js';

const store = useMarsStore();

const distance = computed(() => {
  if (store.routeData?.outbound?.points?.length > 0) {
    const last = store.routeData.outbound.points[store.routeData.outbound.points.length - 1];
    if (last.cumulative_dist_m) {
      return `${(last.cumulative_dist_m / 1000.0).toFixed(1)} km`;
    }
  }
  return '12.8 km';
});

const elevationGain = computed(() => {
  if (store.routeData?.outbound?.elevation_gain_m) {
    return `+${Math.round(store.routeData.outbound.elevation_gain_m)} m`;
  }
  return '+320 m';
});

const elevationLoss = computed(() => {
  if (store.routeData?.outbound?.elevation_loss_m) {
    return `-${Math.round(store.routeData.outbound.elevation_loss_m)} m`;
  }
  return '-310 m';
});

const maxSlope = computed(() => {
  if (store.routeData?.outbound?.max_slope_deg) {
    return `${store.routeData.outbound.max_slope_deg.toFixed(1)}°`;
  }
  return '18%';
});

const hazardLevel = computed(() => {
  const slope = store.routeData?.outbound?.max_slope_deg || 18;
  if (slope > 22) return { text: 'High', class: 'hazard-high' };
  if (slope > 14) return { text: 'Moderate', class: 'hazard-moderate' };
  return { text: 'Low', class: 'hazard-low' };
});
</script>

<template>
  <div class="neo-card route-analysis-card">
    <div class="neo-card-inner">
      <div class="card-header">
        <div class="header-left">
          <svg viewBox="0 0 24 24" class="header-icon">
            <path fill="currentColor" d="M19 15l-6 6-1.42-1.42L15.17 16H4V4h2v10h9.17l-3.59-3.58L13 9l6 6z"/>
          </svg>
          <h2 class="card-title">Route Analysis</h2>
        </div>
      </div>

      <div class="stats-list">
        <div class="stat-row">
          <span class="stat-lbl">Distance</span>
          <span class="stat-val font-mono">{{ distance }}</span>
        </div>
        <div class="stat-row">
          <span class="stat-lbl">Elevation Gain</span>
          <span class="stat-val font-mono val-gain">{{ elevationGain }}</span>
        </div>
        <div class="stat-row">
          <span class="stat-lbl">Elevation Loss</span>
          <span class="stat-val font-mono val-loss">{{ elevationLoss }}</span>
        </div>
        <div class="stat-row">
          <span class="stat-lbl">Max Slope</span>
          <span class="stat-val font-mono">{{ maxSlope }}</span>
        </div>
        <div class="stat-row">
          <span class="stat-lbl">Hazard Level</span>
          <span class="hazard-badge" :class="hazardLevel.class">{{ hazardLevel.text }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.route-analysis-card {
  width: 100%;
  height: 100%;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-icon {
  width: 18px;
  height: 18px;
  color: #00d2ff;
}

.card-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  color: #f8fafc;
  letter-spacing: 0.02em;
}

.stats-list {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.stat-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 8px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.015);
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
}

.stat-lbl {
  font-size: 0.8rem;
  color: #94a3b8;
}

.stat-val {
  font-size: 0.85rem;
  font-weight: 600;
  color: #f1f5f9;
}

.font-mono {
  font-family: var(--neo-font-mono, monospace);
}

.val-gain {
  color: #38bdf8;
}

.val-loss {
  color: #f97316;
}

.hazard-badge {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 2px 10px;
  border-radius: 12px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.hazard-moderate {
  background: rgba(245, 158, 11, 0.18);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.4);
  box-shadow: 0 0 8px rgba(245, 158, 11, 0.2);
}

.hazard-low {
  background: rgba(16, 185, 129, 0.18);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.4);
}

.hazard-high {
  background: rgba(239, 68, 68, 0.18);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.4);
}
</style>
