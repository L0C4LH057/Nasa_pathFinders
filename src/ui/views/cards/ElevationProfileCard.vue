<script setup>
import { computed, ref } from 'vue';
import { useMarsStore } from '../../stores/marsStore.js';

const store = useMarsStore();

// Default elevation profile matching Jezero Crater MOLA/HiRISE datum (m)
const DEFAULT_PROFILE = [
  { distance_km: 0.0, elevation_m: -2560, slope_deg: 2.1, lat: 18.435, lon: 77.425 },
  { distance_km: 2.5, elevation_m: -2535, slope_deg: 5.4, lat: 18.445, lon: 77.438 },
  { distance_km: 5.0, elevation_m: -2498, slope_deg: 11.2, lat: 18.456, lon: 77.452 },
  { distance_km: 7.2, elevation_m: -2445, slope_deg: 16.8, lat: 18.468, lon: 77.465 },
  { distance_km: 10.0, elevation_m: -2482, slope_deg: 8.5, lat: 18.479, lon: 77.478 },
  { distance_km: 12.8, elevation_m: -2518, slope_deg: 4.3, lat: 18.490, lon: 77.490 },
];

const points = computed(() => {
  if (store.routeData?.outbound?.points?.length > 1) {
    return store.routeData.outbound.points.map((p) => ({
      distance_km: p.cumulative_dist_m != null ? p.cumulative_dist_m / 1000.0 : 0,
      elevation_m: p.elevation_m ?? -2500,
      slope_deg: p.slope_deg ?? 0,
      lat: p.lat,
      lon: p.lon,
    }));
  }
  return DEFAULT_PROFILE;
});

const maxDist = computed(() => {
  const pts = points.value;
  if (!pts || pts.length === 0) return 12.8;
  const last = pts[pts.length - 1];
  return last?.distance_km > 0 ? last.distance_km : 12.8;
});

const minElevation = computed(() => {
  const pts = points.value;
  if (!pts || pts.length === 0) return -2600;
  return Math.floor(Math.min(...pts.map((p) => p.elevation_m)) - 10);
});
const maxElevation = computed(() => {
  const pts = points.value;
  if (!pts || pts.length === 0) return -2400;
  const max = Math.ceil(Math.max(...pts.map((p) => p.elevation_m)) + 10);
  return max > minElevation.value ? max : minElevation.value + 20;
});

// SVG geometry
const svgWidth = 460;
const svgHeight = 130;
const padLeft = 48;
const padRight = 20;
const padTop = 14;
const padBottom = 26;

const plotWidth = svgWidth - padLeft - padRight;
const plotHeight = svgHeight - padTop - padBottom;

function getX(dist) {
  const denom = maxDist.value || 1.0;
  const d = Math.max(0, dist || 0);
  return padLeft + (d / denom) * plotWidth;
}

function getY(elev) {
  const range = (maxElevation.value - minElevation.value) || 1.0;
  const norm = ((elev ?? minElevation.value) - minElevation.value) / range;
  return padTop + plotHeight * (1 - Math.max(0, Math.min(1, norm)));
}

const pathD = computed(() => {
  const pts = points.value;
  if (!pts || pts.length === 0) return '';
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.distance_km).toFixed(1)} ${getY(p.elevation_m).toFixed(1)}`).join(' ');
});

const areaD = computed(() => {
  const pts = points.value;
  if (!pts || pts.length === 0) return '';
  const firstX = getX(pts[0].distance_km).toFixed(1);
  const lastX = getX(pts[pts.length - 1].distance_km).toFixed(1);
  const bottomY = (padTop + plotHeight).toFixed(1);
  return `${pathD.value} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
});

// Hover Reticle
const hoverPoint = ref(null);
const hoverX = ref(0);
const hoverY = ref(0);

function onMouseMove(event) {
  const svgRect = event.currentTarget.getBoundingClientRect();
  const scaleX = svgRect.width > 0 ? svgWidth / svgRect.width : 1;
  const mouseX = (event.clientX - svgRect.left) * scaleX;
  if (mouseX < padLeft || mouseX > svgWidth - padRight) {
    onMouseLeave();
    return;
  }

  const distNorm = (mouseX - padLeft) / plotWidth;
  const targetDist = distNorm * maxDist.value;

  // Find nearest point
  let closest = points.value[0];
  let minDiff = Infinity;
  for (const p of points.value) {
    const diff = Math.abs(p.distance_km - targetDist);
    if (diff < minDiff) {
      minDiff = diff;
      closest = p;
    }
  }

  hoverPoint.value = closest;
  hoverX.value = getX(closest.distance_km);
  hoverY.value = getY(closest.elevation_m);

  if (window.__marsController?.onProfileHover) {
    window.__marsController.onProfileHover(closest);
  }
}

function onMouseLeave() {
  hoverPoint.value = null;
  if (window.__marsController?.onProfileLeave) {
    window.__marsController.onProfileLeave();
  }
}
</script>

<template>
  <div class="neo-card elevation-profile-card">
    <div class="neo-card-inner">
      <div class="card-header">
        <div class="header-left">
          <svg viewBox="0 0 24 24" class="header-icon">
            <path fill="currentColor" d="M14 6l-3.75 5 2.85 3.8-1.6 1.2L7 10l-6 8h22L14 6z"/>
          </svg>
          <h2 class="card-title">Elevation Profile</h2>
        </div>
        <span class="sub-legend">Δ {{ maxDist.toFixed(1) }} km</span>
      </div>

      <!-- SVG Chart in Sunken Well -->
      <div class="chart-container neo-sunken" @mousemove="onMouseMove" @mouseleave="onMouseLeave">
        <svg :viewBox="`0 0 ${svgWidth} ${svgHeight}`" preserveAspectRatio="none" class="profile-svg">
          <defs>
            <linearGradient id="elevationGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#ff6b35" stop-opacity="0.55"/>
              <stop offset="60%" stop-color="#eab308" stop-opacity="0.25"/>
              <stop offset="100%" stop-color="#10b981" stop-opacity="0.02"/>
            </linearGradient>
            <linearGradient id="strokeGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="#10b981"/>
              <stop offset="45%" stop-color="#ff6b35"/>
              <stop offset="100%" stop-color="#ef4444"/>
            </linearGradient>
          </defs>

          <!-- Horizontal Grid Lines -->
          <line :x1="padLeft" :y1="padTop" :x2="svgWidth - padRight" :y2="padTop" stroke="rgba(255,255,255,0.06)" stroke-dasharray="2 3"/>
          <line :x1="padLeft" :y1="padTop + plotHeight / 2" :x2="svgWidth - padRight" :y2="padTop + plotHeight / 2" stroke="rgba(255,255,255,0.06)" stroke-dasharray="2 3"/>
          <line :x1="padLeft" :y1="padTop + plotHeight" :x2="svgWidth - padRight" :y2="padTop + plotHeight" stroke="rgba(255,255,255,0.06)" stroke-dasharray="2 3"/>

          <!-- Y Axis Labels -->
          <text :x="padLeft - 6" :y="padTop + 4" class="axis-lbl" text-anchor="end">{{ maxElevation }} m</text>
          <text :x="padLeft - 6" :y="padTop + plotHeight / 2 + 3" class="axis-lbl" text-anchor="end">{{ Math.round((maxElevation + minElevation) / 2) }} m</text>
          <text :x="padLeft - 6" :y="padTop + plotHeight" class="axis-lbl" text-anchor="end">{{ minElevation }} m</text>

          <!-- Shaded Area & Line -->
          <path :d="areaD" fill="url(#elevationGrad)"/>
          <path :d="pathD" fill="none" stroke="url(#strokeGrad)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>

          <!-- Start Marker (Green Pin / Dot) -->
          <circle
            v-if="points.length > 0"
            :cx="getX(points[0].distance_km)"
            :cy="getY(points[0].elevation_m)"
            r="5"
            fill="#10b981"
            stroke="#fff"
            stroke-width="1.5"
          />
          <!-- Destination Marker (Red Pin / Dot) -->
          <circle
            v-if="points.length > 0"
            :cx="getX(points[points.length - 1].distance_km)"
            :cy="getY(points[points.length - 1].elevation_m)"
            r="5"
            fill="#ef4444"
            stroke="#fff"
            stroke-width="1.5"
          />

          <!-- Hover Reticle Line and Dot -->
          <g v-if="hoverPoint">
            <line :x1="hoverX" :y1="padTop" :x2="hoverX" :y2="padTop + plotHeight" stroke="#00d2ff" stroke-width="1" stroke-dasharray="3 3"/>
            <circle :cx="hoverX" :cy="hoverY" r="5" fill="#00d2ff" stroke="#ffffff" stroke-width="2"/>
          </g>

          <!-- X Axis Labels -->
          <text :x="getX(0)" :y="svgHeight - 8" class="axis-lbl" text-anchor="start">0 km</text>
          <text :x="getX(maxDist * 0.33)" :y="svgHeight - 8" class="axis-lbl" text-anchor="middle">{{ (maxDist * 0.33).toFixed(1) }} km</text>
          <text :x="getX(maxDist * 0.66)" :y="svgHeight - 8" class="axis-lbl" text-anchor="middle">{{ (maxDist * 0.66).toFixed(1) }} km</text>
          <text :x="getX(maxDist)" :y="svgHeight - 8" class="axis-lbl" text-anchor="end">{{ maxDist.toFixed(1) }} km</text>
        </svg>

        <!-- Hover Tooltip -->
        <div
          v-if="hoverPoint"
          class="hover-tooltip"
          :style="{ left: (hoverX / svgWidth) * 100 + '%', top: Math.max(8, hoverY - 36) + 'px' }"
        >
          <span>{{ hoverPoint.distance_km.toFixed(2) }} km · {{ Math.round(hoverPoint.elevation_m) }} m · {{ (hoverPoint.slope_deg ?? 0).toFixed(1) }}°</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.elevation-profile-card {
  width: 100%;
  height: 100%;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-icon {
  width: 18px;
  height: 18px;
  color: #ff6b35;
}

.card-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  color: #f8fafc;
  letter-spacing: 0.02em;
}

.sub-legend {
  font-family: var(--neo-font-mono, monospace);
  font-size: 0.75rem;
  color: #64748b;
}

.chart-container {
  width: 100%;
  height: 130px;
  position: relative;
  overflow: hidden;
  border-radius: 8px;
}

.profile-svg {
  width: 100%;
  height: 100%;
  display: block;
}

.axis-lbl {
  font-family: var(--neo-font-mono, monospace);
  font-size: 9px;
  fill: #64748b;
}

.hover-tooltip {
  position: absolute;
  transform: translate(-50%, -100%);
  background: #0b0f17;
  color: #00d2ff;
  border: 1px solid rgba(0, 210, 255, 0.4);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.8);
  font-family: var(--neo-font-mono, monospace);
  font-size: 0.72rem;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 4px;
  pointer-events: none;
  white-space: nowrap;
}
</style>
