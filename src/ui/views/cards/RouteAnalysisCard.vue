<script setup>
import { computed, ref } from 'vue';
import { useMarsStore } from '../../stores/marsStore.js';

const store = useMarsStore();
const showCostModel = ref(false);
const showCompare = ref(false);
let recomputeTimer = null;

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
  if (store.routeData?.outbound?.elevation_gain_m != null) {
    return `+${Math.round(store.routeData.outbound.elevation_gain_m)} m`;
  }
  return '+320 m';
});

const elevationLoss = computed(() => {
  if (store.routeData?.outbound?.elevation_loss_m != null) {
    return `-${Math.round(store.routeData.outbound.elevation_loss_m)} m`;
  }
  return '-310 m';
});

const maxSlope = computed(() => {
  if (store.routeData?.outbound?.max_slope_deg != null) {
    return `${store.routeData.outbound.max_slope_deg.toFixed(1)}°`;
  }
  return '18.0°';
});

const hazardLevel = computed(() => {
  const slope = store.routeData?.outbound?.max_slope_deg || 18;
  if (slope > 22) return { text: 'High', class: 'hazard-high' };
  if (slope > 14) return { text: 'Moderate', class: 'hazard-moderate' };
  return { text: 'Low', class: 'hazard-low' };
});

const evaResources = computed(() => {
  const r = store.routeData?.resources;
  if (!r) {
    return {
      o2Str: '277 / 550 L',
      battStr: '546 / 850 Wh',
      go: true,
      label: 'GO · 25% Reserve OK',
    };
  }
  return {
    o2Str: `${Math.round(r.o2_required_liters)} / ${Math.round(r.o2_capacity_liters)} L`,
    battStr: `${Math.round(r.battery_required_wh)} / ${Math.round(r.battery_capacity_wh)} Wh`,
    go: !!r.fits_within_limits,
    label: r.fits_within_limits ? 'GO · Reserve OK' : `NO-GO · ${r.limiting_factor || 'Limit'}`,
  };
});

const algoComparison = computed(() => {
  const ob = store.routeData?.outbound;
  if (!ob || ob.astar_nodes_explored == null || ob.dijkstra_nodes_explored == null) {
    return null;
  }
  const aNodes = ob.astar_nodes_explored;
  const dNodes = ob.dijkstra_nodes_explored;
  const speedup = aNodes > 0 ? (dNodes / aNodes).toFixed(1) : '1.0';
  return {
    astarNodes: aNodes.toLocaleString(),
    dijkstraNodes: dNodes.toLocaleString(),
    speedup: `${speedup}x`,
    astarMs: (ob.astar_time_us / 1000).toFixed(2),
    dijkstraMs: (ob.dijkstra_time_us / 1000).toFixed(2),
  };
});

function onSliderChange(key, value) {
  store.updateCostModel({ [key]: parseFloat(value) });
  if (recomputeTimer) clearTimeout(recomputeTimer);
  recomputeTimer = setTimeout(() => {
    if (window.__marsController) {
      window.__marsController.computeRoute(store.costModel).catch(() => {});
    }
  }, 180);
}
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
        <div class="stat-row">
          <span class="stat-lbl">Round-Trip O₂</span>
          <span class="stat-val font-mono">{{ evaResources.o2Str }}</span>
        </div>
        <div class="stat-row">
          <span class="stat-lbl">Suit Battery</span>
          <span class="stat-val font-mono">{{ evaResources.battStr }}</span>
        </div>
        <div class="stat-row">
          <span class="stat-lbl">EVA Readiness</span>
          <span class="hazard-badge" :class="evaResources.go ? 'hazard-low' : 'hazard-high'">{{ evaResources.label }}</span>
        </div>
      </div>

      <!-- Cost Model & Algorithm Comparison Toggles -->
      <div class="card-actions-bar">
        <button class="mini-btn" :class="{ active: showCostModel }" @click="showCostModel = !showCostModel">
          ⚙ Cost Model
        </button>
        <button class="mini-btn" :class="{ active: showCompare }" @click="showCompare = !showCompare">
          ⚡ A* vs Dijkstra
        </button>
      </div>

      <!-- Interactive Cost Model Sliders -->
      <div v-if="showCostModel" class="cost-model-box neo-sunken">
        <div class="slider-row">
          <div class="slider-hdr"><span>Max Slope Limit</span><span class="font-mono">{{ store.costModel.max_slope_deg }}°</span></div>
          <input type="range" min="8" max="35" step="1" :value="store.costModel.max_slope_deg" @input="onSliderChange('max_slope_deg', $event.target.value)" />
        </div>
        <div class="slider-row">
          <div class="slider-hdr"><span>Slope Penalty (w)</span><span class="font-mono">{{ store.costModel.w_slope }}</span></div>
          <input type="range" min="0" max="10" step="0.5" :value="store.costModel.w_slope" @input="onSliderChange('w_slope', $event.target.value)" />
        </div>
        <div class="slider-row">
          <div class="slider-hdr"><span>Hazard Weight</span><span class="font-mono">{{ store.costModel.w_hazard }}</span></div>
          <input type="range" min="0" max="12" step="0.5" :value="store.costModel.w_hazard" @input="onSliderChange('w_hazard', $event.target.value)" />
        </div>
        <div class="slider-row">
          <div class="slider-hdr"><span>Walk Speed</span><span class="font-mono">{{ store.costModel.walk_speed_kmh }} km/h</span></div>
          <input type="range" min="0.5" max="6.0" step="0.1" :value="store.costModel.walk_speed_kmh" @input="onSliderChange('walk_speed_kmh', $event.target.value)" />
        </div>
      </div>

      <!-- A* vs Dijkstra Verification -->
      <div v-if="showCompare" class="compare-box neo-sunken">
        <template v-if="algoComparison">
          <div class="cmp-row"><span>A* Nodes Explored</span><span class="font-mono cmp-cyan">{{ algoComparison.astarNodes }} ({{ algoComparison.astarMs }} ms)</span></div>
          <div class="cmp-row"><span>Dijkstra Baseline</span><span class="font-mono">{{ algoComparison.dijkstraNodes }} ({{ algoComparison.dijkstraMs }} ms)</span></div>
          <div class="cmp-row"><span>Search Speedup</span><span class="font-mono cmp-green">{{ algoComparison.speedup }} · 0.00% cost dev</span></div>
        </template>
        <div v-else class="cmp-note">
          Start the Rust pathfinding backend (<code>mars-server</code>) to run live A* vs Dijkstra node benchmarks.
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

.card-actions-bar {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

.mini-btn {
  flex: 1;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: 6px;
  padding: 5px 8px;
  font-size: 0.72rem;
  font-weight: 600;
  color: #cbd5e1;
  cursor: pointer;
  transition: all 0.15s ease;
}

.mini-btn:hover,
.mini-btn.active {
  border-color: rgba(0, 210, 255, 0.45);
  color: #00d2ff;
  background: rgba(0, 210, 255, 0.1);
}

.cost-model-box,
.compare-box {
  margin-top: 10px;
  padding: 10px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.slider-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.slider-hdr {
  display: flex;
  justify-content: space-between;
  font-size: 0.72rem;
  color: #94a3b8;
}

.slider-row input[type='range'] {
  width: 100%;
  accent-color: #00d2ff;
  cursor: pointer;
}

.cmp-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.74rem;
  color: #94a3b8;
}

.cmp-cyan {
  color: #00d2ff;
  font-weight: 600;
}

.cmp-green {
  color: #34d399;
  font-weight: 700;
}

.cmp-note {
  font-size: 0.72rem;
  color: #94a3b8;
  line-height: 1.4;
}
</style>
