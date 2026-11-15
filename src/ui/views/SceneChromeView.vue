<script setup>
import { computed, watch, onMounted, nextTick } from 'vue';
import { useMarsStore } from '../stores/marsStore.js';
import RenderFailure from './panels/RenderFailure.vue';
import DatasetProvenanceModal from './panels/DatasetProvenanceModal.vue';

// Sub-components
import MarsLandingHero from './MarsLandingHero.vue';
import MissionOverviewCard from './cards/MissionOverviewCard.vue';
import AlertsCard from './cards/AlertsCard.vue';
import RouteAnalysisCard from './cards/RouteAnalysisCard.vue';
import ScienceTargetCard from './cards/ScienceTargetCard.vue';
import PharmaceuticalMedicalCard from './cards/PharmaceuticalMedicalCard.vue';
import CrewHealthCard from './cards/CrewHealthCard.vue';
import LifeSupportCard from './cards/LifeSupportCard.vue';
import InCanvasControls from './cards/InCanvasControls.vue';
import DestinationSelector from './cards/DestinationSelector.vue';
import LiveNavigationCard from './cards/LiveNavigationCard.vue';

const store = useMarsStore();

onMounted(() => {
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('theme-light', store.currentTheme === 'light');
  }
});

const activeTab = computed(() => store.activeTab);
const isMaximized = computed(() => store.isCanvasMaximized);
const alerts = computed(() => store.alerts);

function setActiveTab(tab) {
  store.setActiveTab(tab);
}

function resetCamera() {
  if (window.__marsController) {
    window.__marsController.resetCamera();
  }
}

function openProvenance() {
  store.isProvenanceOpen = true;
}

// Watch canvas maximized state to trigger Cesium resize
watch(isMaximized, () => {
  nextTick(() => {
    if (window.__marsController?.viewer) {
      window.__marsController.viewer.resize();
    }
  });
});

onMounted(() => {
  // Attach resize observer to canvas container for crisp WebGL rendering
  const el = document.getElementById('cesiumContainer');
  if (el && window.ResizeObserver) {
    const ro = new ResizeObserver(() => {
      if (window.__marsController?.viewer) {
        window.__marsController.viewer.resize();
        window.__marsController.viewer.scene?.requestRender?.();
      }
    });
    ro.observe(el);
  }
});
</script>

<template>
  <div class="neo-dashboard-root" :class="{ 'canvas-is-maximized': isMaximized }">
    <!-- 3D Mars Landing Hero (AstraMap Integration) -->
    <MarsLandingHero v-if="store.isLandingOpen" />

    <!-- Top Mission Control Navigation Header -->
    <header class="neo-navbar">
      <div class="nav-left">
        <!-- NASA Meatball Logo SVG -->
        <div class="nasa-brand-wrap" @click="resetCamera" title="NASA Mars Exploration">
          <svg viewBox="0 0 100 80" class="nasa-meatball-svg">
            <!-- Blue Sphere -->
            <circle cx="48" cy="40" r="34" fill="#0b3d91"/>
            <!-- White Stars in Sphere -->
            <circle cx="34" cy="28" r="1.2" fill="#fff"/>
            <circle cx="42" cy="22" r="1" fill="#fff"/>
            <circle cx="56" cy="26" r="1.4" fill="#fff"/>
            <circle cx="62" cy="38" r="1.2" fill="#fff"/>
            <circle cx="38" cy="48" r="1" fill="#fff"/>
            <circle cx="52" cy="54" r="1.3" fill="#fff"/>
            <circle cx="28" cy="42" r="0.9" fill="#fff"/>
            <!-- Red Vector Chevron -->
            <path d="M22 62 L48 18 L60 44 L44 48 L76 56" fill="none" stroke="#fc3d21" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>
            <!-- White Orbit Path Ellipse -->
            <ellipse cx="48" cy="40" rx="42" ry="14" fill="none" stroke="#ffffff" stroke-width="2.2" transform="rotate(-28 48 40)"/>
            <!-- NASA Wordmark Text -->
            <text x="48" y="47" font-family="'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="20" fill="#ffffff" text-anchor="middle" letter-spacing="1.5">NASA</text>
          </svg>
          <div class="brand-text-block">
            <h1 class="brand-app-title">MARS PATHFINDER</h1>
            <span class="brand-tagline">Explore &bull; Plan &bull; Monitor &bull; Survive</span>
          </div>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <nav class="nav-center-tabs">
        <button
          class="nav-tab-item"
          :class="{ active: activeTab === 'mission-control' }"
          @click="setActiveTab('mission-control')"
        >
          <svg viewBox="0 0 24 24" class="tab-svg">
            <path fill="currentColor" d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
          </svg>
          <span>Mission Control</span>
        </button>

        <button
          class="nav-tab-item"
          :class="{ active: activeTab === 'pharma' }"
          @click="setActiveTab('pharma')"
        >
          <svg viewBox="0 0 24 24" class="tab-svg">
            <path fill="currentColor" d="M4.5 10.5C3.67 10.5 3 11.17 3 12s.67 1.5 1.5 1.5h15c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5h-15zM10.5 4.5C10.5 3.67 11.17 3 12 3s1.5.67 1.5 1.5v15c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5v-15z"/>
          </svg>
          <span>Pharmaceutical &amp; Medical</span>
        </button>

        <button
          class="nav-tab-item"
          :class="{ active: activeTab === 'life-support' }"
          @click="setActiveTab('life-support')"
        >
          <svg viewBox="0 0 24 24" class="tab-svg">
            <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
          </svg>
          <span>Life-Support</span>
        </button>

        <button
          class="nav-tab-item"
          :class="{ active: activeTab === 'alerts' }"
          @click="setActiveTab('alerts')"
        >
          <svg viewBox="0 0 24 24" class="tab-svg">
            <path fill="currentColor" d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
          </svg>
          <span>Alerts</span>
          <span class="alerts-badge">{{ alerts.length }}</span>
        </button>

        <button
          class="nav-tab-item"
          :class="{ active: activeTab === 'settings' }"
          @click="setActiveTab('settings')"
        >
          <svg viewBox="0 0 24 24" class="tab-svg">
            <path fill="currentColor" d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
          </svg>
          <span>Settings</span>
        </button>
      </nav>

      <!-- Right Actions & Commander Avatar -->
      <div class="nav-right">
        <!-- Mars Destination Selector Dropdown -->
        <DestinationSelector />

        <!-- Theme Toggle: Dark vs Light Cleanroom Lab -->
        <button class="nav-action-btn theme-toggle-btn" @click="store.toggleTheme()" :title="store.currentTheme === 'light' ? 'Switch to Orbital Dark Mode' : 'Switch to Cleanroom Light Mode'">
          <svg v-if="store.currentTheme === 'light'" viewBox="0 0 24 24" class="btn-svg">
            <path fill="currentColor" d="M12.3 2a10 10 0 0 0-.19 20 10.04 10.04 0 0 0 9.89-7.58 1 1 0 0 0-1.21-1.21A8 8 0 1 1 12.3 2z"/>
          </svg>
          <svg v-else viewBox="0 0 24 24" class="btn-svg">
            <circle cx="12" cy="12" r="5" fill="currentColor"/>
            <path stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M12 2v2m0 16v2M4 12H2m20 0h-2m-2.93-7.07l-1.41 1.41m-9.32 9.32l-1.41 1.41m0-12.14l1.41 1.41m9.32 9.32l1.41 1.41"/>
          </svg>
          <span>{{ store.currentTheme === 'light' ? 'Dark' : 'Light' }}</span>
        </button>

        <button class="nav-action-btn orbit-view-btn" @click="store.openLanding()" title="Return to 3D Orbital Globe View">
          <svg viewBox="0 0 24 24" class="btn-svg">
            <circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" stroke-width="1.8"/>
            <ellipse cx="12" cy="12" rx="10" ry="3.5" fill="none" stroke="currentColor" stroke-width="1.3" transform="rotate(-20 12 12)"/>
          </svg>
          <span>Orbit View</span>
        </button>

        <button class="nav-action-btn" @click="openProvenance" title="Planetary Dataset Provenance">
          <svg viewBox="0 0 24 24" class="btn-svg"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8"/><path fill="currentColor" d="M12 17h-1v-5h2v5zm0-7h-1V8h2v2z"/></svg>
          <span>Provenance</span>
        </button>
        <div class="avatar-chip" title="Commander Dr. A. Taylor">
          <div class="avatar-circle">
            <svg viewBox="0 0 24 24" class="avatar-svg">
              <path fill="#f8fafc" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
            </svg>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Dashboard Container -->
    <main class="dashboard-scrollable-area">
      <!-- 1. MISSION CONTROL TAB VIEW (DEFAULT) -->
      <div v-show="activeTab === 'mission-control'" class="tab-view-content">
        <!-- PRIMARY COMMAND DECK: Left Stack | Massively Expanded Map Card | Right Stack -->
        <section class="dashboard-row primary-deck-row" :class="{ 'expanded-layout': isMaximized }">
          <!-- Left Column: Mission Overview & Route Analysis Stack -->
          <div class="deck-col col-left-stack" :class="{ 'hide-when-maximized': isMaximized }">
            <MissionOverviewCard />
            <RouteAnalysisCard />
          </div>

          <!-- Center Column: Massively Expanded 3D Cesium Mars Canvas Viewport -->
          <div class="deck-col col-canvas" :class="{ 'expanded-mode': isMaximized }">
            <div class="neo-canvas-card neo-card">
              <!-- Floating Overlays directly inside Canvas -->
              <InCanvasControls />
              <LiveNavigationCard />

              <!-- Cesium Container Host (Preserves WebGL Instance) -->
              <div id="cesiumContainer" class="cesium-hero-viewport"></div>
            </div>
          </div>

          <!-- Right Column: Environmental Alerts & Science Target Stack -->
          <div class="deck-col col-right-stack" :class="{ 'hide-when-maximized': isMaximized }">
            <AlertsCard />
            <ScienceTargetCard />
          </div>
        </section>

        <!-- BOTTOM ROW: Pharmaceutical & Medical | Crew Health | Life-Support Monitoring -->
        <section class="dashboard-row bottom-row" :class="{ 'hide-when-maximized': isMaximized }">
          <div class="row-col col-pharma">
            <PharmaceuticalMedicalCard />
          </div>

          <div class="row-col col-crew-health">
            <CrewHealthCard />
          </div>

          <div class="row-col col-life-support">
            <LifeSupportCard />
          </div>
        </section>
      </div>

      <!-- 2. PHARMACEUTICAL & MEDICAL EXPANDED VIEW -->
      <div v-show="activeTab === 'pharma'" class="tab-view-content dedicated-tab-panel">
        <div class="dedicated-header">
          <h2>Planetary Pharmaceutical &amp; Medical Dispensary Station</h2>
          <button class="neo-btn" @click="setActiveTab('mission-control')">&larr; Return to Mission Control</button>
        </div>
        <div class="dedicated-grid">
          <div class="grid-left">
            <PharmaceuticalMedicalCard />
          </div>
          <div class="grid-right neo-card">
            <div class="neo-card-inner">
              <h3 class="neo-card-title">FEFO Medical Protocol &amp; Dispensing Manifest</h3>
              <div class="protocol-table-wrap neo-sunken">
                <table class="protocol-table">
                  <thead>
                    <tr>
                      <th>Compound</th>
                      <th>Class</th>
                      <th>Batch</th>
                      <th>Expiry</th>
                      <th>Units</th>
                      <th>Compliance</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Amoxicillin 500mg</td>
                      <td>Antibiotic</td>
                      <td>AMX-2025-047</td>
                      <td>12/2026</td>
                      <td>120</td>
                      <td><span class="badge-fefo">FEFO Verified</span></td>
                    </tr>
                    <tr>
                      <td>Ibuprofen 400mg</td>
                      <td>NSAID / Analgesic</td>
                      <td>IBU-2025-012</td>
                      <td>08/2027</td>
                      <td>350</td>
                      <td><span class="badge-fefo">FEFO Verified</span></td>
                    </tr>
                    <tr>
                      <td>Epinephrine 1mg/mL</td>
                      <td>Emergency Auto-Injector</td>
                      <td>EPI-2024-009</td>
                      <td>03/2026</td>
                      <td>8</td>
                      <td><span class="badge-fefo">FEFO Verified</span></td>
                    </tr>
                    <tr>
                      <td>Dexamethasone 4mg</td>
                      <td>Corticosteroid</td>
                      <td>DEX-2025-091</td>
                      <td>11/2026</td>
                      <td>45</td>
                      <td><span class="badge-fefo">FEFO Verified</span></td>
                    </tr>
                    <tr>
                      <td>Silver Sulfadiazine 1%</td>
                      <td>Burn / Trauma Dressing</td>
                      <td>SSD-2024-088</td>
                      <td>05/2026</td>
                      <td>12</td>
                      <td><span class="badge-fefo">FEFO Verified</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. LIFE-SUPPORT EXPANDED VIEW -->
      <div v-show="activeTab === 'life-support'" class="tab-view-content dedicated-tab-panel">
        <div class="dedicated-header">
          <h2>Environmental Control &amp; Life-Support Systems (ECLSS)</h2>
          <button class="neo-btn" @click="setActiveTab('mission-control')">&larr; Return to Mission Control</button>
        </div>
        <div class="dedicated-grid">
          <div class="grid-left">
            <LifeSupportCard />
          </div>
          <div class="grid-right neo-card">
            <div class="neo-card-inner">
              <h3 class="neo-card-title">Loop Regeneration &amp; Consumable Budgets</h3>
              <div class="eclss-stats-grid">
                <div class="stat-card neo-sunken">
                  <span class="sc-title">MOXIE O₂ Extraction</span>
                  <span class="sc-val">10.2 g/hr</span>
                  <span class="sc-sub">Operational (Purity: 99.8%)</span>
                </div>
                <div class="stat-card neo-sunken">
                  <span class="sc-title">Sabatier CO₂ Reduction</span>
                  <span class="sc-val">94.2%</span>
                  <span class="sc-sub">Water Recovery Active</span>
                </div>
                <div class="stat-card neo-sunken">
                  <span class="sc-title">Greywater Distillation</span>
                  <span class="sc-val">1.8 L/hr</span>
                  <span class="sc-sub">Filtration Nominal</span>
                </div>
                <div class="stat-card neo-sunken">
                  <span class="sc-title">Cabin Radiator Loop</span>
                  <span class="sc-val">21.4 °C</span>
                  <span class="sc-sub">Freon Coolant Circulating</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 4. ALERTS EXPANDED VIEW -->
      <div v-show="activeTab === 'alerts'" class="tab-view-content dedicated-tab-panel">
        <div class="dedicated-header">
          <h2>Mission Incident &amp; Planetary Hazard Triage Console</h2>
          <button class="neo-btn" @click="setActiveTab('mission-control')">&larr; Return to Mission Control</button>
        </div>
        <div class="dedicated-grid">
          <div class="grid-left">
            <AlertsCard />
          </div>
          <div class="grid-right neo-card">
            <div class="neo-card-inner">
              <h3 class="neo-card-title">Standard Emergency Protocols</h3>
              <div class="protocol-steps neo-sunken">
                <div class="step-item">
                  <span class="step-num">1</span>
                  <div class="step-info">
                    <strong>Cabin Thermal Rise (>22°C):</strong>
                    <span>Verify exterior radiator deploy status. Flush heat exchangers and throttle secondary rover avionics.</span>
                  </div>
                </div>
                <div class="step-item">
                  <span class="step-num">2</span>
                  <div class="step-info">
                    <strong>Water Reserve Critical (<20%):</strong>
                    <span>Seal secondary habitat hygiene circuits. Divert closed-loop condenser to priority drinking reservoir.</span>
                  </div>
                </div>
                <div class="step-item">
                  <span class="step-num">3</span>
                  <div class="step-info">
                    <strong>Oxygen Depletion (<15%):</strong>
                    <span>Engage MOXIE maximum cycle. Don emergency pressure suits and isolate habitat sector 3.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 5. SETTINGS TAB VIEW -->
      <div v-show="activeTab === 'settings'" class="tab-view-content dedicated-tab-panel">
        <div class="dedicated-header">
          <h2>Cartographic &amp; Geodetic Settings</h2>
          <button class="neo-btn" @click="setActiveTab('mission-control')">&larr; Return to Mission Control</button>
        </div>
        <div class="settings-wrap neo-card">
          <div class="neo-card-inner">
            <div class="settings-group">
              <h3>Planetary Coordinate Reference System</h3>
              <p>
                Mars Pathfinder operates exclusively on IAU 2015 Mars ellipsoid geodetic datum (<code>IAU_2015:49900</code>).
                Semi-major axis $a = 3,396,190.0\text{ m}$, semi-minor axis $b = 3,376,200.0\text{ m}$.
              </p>
            </div>
            <div class="settings-group">
              <h3>ArcGIS Explore Mars Service Integration</h3>
              <p>
                Connected to Esri Astro Mars servers:
                <br/>
                &bull; <strong>Context Camera (CTX ~5m):</strong> <code>https://astro.arcgis.com/arcgis/rest/services/OnMars/CTX/MapServer</code>
                <br/>
                &bull; <strong>Viking MDIM 2.1 Color:</strong> <code>https://astro.arcgis.com/arcgis/rest/services/OnMars/MDIM/MapServer</code>
              </p>
            </div>
            <div class="settings-group">
              <h3>Autonomous Microservice Engine</h3>
              <p>
                Backend Rust Axum service running on <code>http://127.0.0.1:8081</code> serving Horn's slope algorithm and bi-directional traversal costing.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Global Modals & Render Failure Overlays -->
    <RenderFailure />
    <DatasetProvenanceModal />
  </div>
</template>

<style scoped>
/* ==========================================================================
   NEOMORPHIC MASTER HUD LAYOUT
   ========================================================================== */

.neo-dashboard-root {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: #090c12;
  color: #f8fafc;
  overflow: hidden;
  font-family: var(--neo-font-sans, 'Inter', sans-serif);
  z-index: 100;
}

/* TOP NAVBAR */
.neo-navbar {
  height: 58px;
  background: #111520;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  flex-shrink: 0;
  z-index: 1000;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.nasa-brand-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  user-select: none;
}

.nasa-meatball-svg {
  width: 48px;
  height: 38px;
  filter: drop-shadow(0 2px 5px rgba(0, 0, 0, 0.6));
}

.brand-text-block {
  display: flex;
  flex-direction: column;
}

.brand-app-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  color: #f8fafc;
  line-height: 1.1;
}

.brand-tagline {
  font-size: 0.65rem;
  letter-spacing: 0.08em;
  color: #94a3b8;
  font-weight: 500;
}

/* NAVIGATION TABS */
.nav-center-tabs {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #090c12;
  padding: 4px;
  border-radius: 10px;
  box-shadow: inset 2px 2px 5px rgba(0, 0, 0, 0.7), inset -1px -1px 3px rgba(255, 255, 255, 0.03);
}

.nav-tab-item {
  background: transparent;
  border: 1px solid transparent;
  color: #94a3b8;
  border-radius: 8px;
  padding: 6px 14px;
  font-size: 0.8rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.nav-tab-item:hover {
  color: #f1f5f9;
}

.nav-tab-item.active {
  background: #151a28;
  color: #00d2ff;
  border-color: rgba(0, 210, 255, 0.3);
  box-shadow: -2px -2px 6px rgba(255, 255, 255, 0.04), 4px 4px 10px rgba(0, 0, 0, 0.7);
}

.tab-svg {
  width: 16px;
  height: 16px;
}

.alerts-badge {
  background: #ef4444;
  color: #fff;
  font-size: 0.68rem;
  font-weight: 800;
  padding: 1px 6px;
  border-radius: 10px;
  line-height: 1.2;
}

/* NAV RIGHT */
.nav-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.nav-action-btn {
  background: #151a28;
  color: #f8fafc;
  border: 1px solid rgba(255, 255, 255, 0.07);
  box-shadow: -2px -2px 5px rgba(255, 255, 255, 0.03), 3px 3px 7px rgba(0, 0, 0, 0.6);
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 0.76rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-svg {
  width: 14px;
  height: 14px;
  color: #00d2ff;
}

.nav-action-btn:hover {
  border-color: #00d2ff;
  color: #00d2ff;
}

.avatar-chip {
  cursor: pointer;
}

.avatar-circle {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #151a28;
  border: 1px solid rgba(0, 210, 255, 0.4);
  box-shadow: -2px -2px 5px rgba(255, 255, 255, 0.04), 3px 3px 7px rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-svg {
  width: 20px;
  height: 20px;
  color: #00d2ff;
}

/* SCROLLABLE DASHBOARD */
.dashboard-scrollable-area {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 16px 20px 24px;
}

.tab-view-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 1720px;
  margin: 0 auto;
}

/* DASHBOARD ROWS */
.dashboard-row {
  display: flex;
  gap: 16px;
  width: 100%;
}

/* PRIMARY COMMAND DECK */
.primary-deck-row {
  display: flex;
  gap: 16px;
  width: 100%;
  align-items: stretch;
}

.col-left-stack {
  width: 320px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.col-canvas {
  flex: 1;
  min-width: 600px;
  position: relative;
  display: flex;
  flex-direction: column;
}

.neo-canvas-card {
  width: 100%;
  height: 100%;
  min-height: 720px;
  position: relative;
  border-radius: 14px;
  overflow: hidden;
}

.cesium-hero-viewport {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.col-right-stack {
  width: 320px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* MAXIMIZED CANVAS MODE */
.canvas-is-maximized .col-canvas.expanded-mode {
  position: fixed;
  top: 58px;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: calc(100vh - 58px);
  z-index: 5000;
  border-radius: 0;
}

.canvas-is-maximized .col-canvas.expanded-mode .neo-canvas-card {
  border-radius: 0;
  border: none;
}

.hide-when-maximized {
  display: none !important;
}

/* BOTTOM ROW */
.bottom-row {
  min-height: 200px;
}

.col-pharma {
  width: 380px;
  flex-shrink: 0;
}

.col-crew-health {
  width: 320px;
  flex-shrink: 0;
}

.col-life-support {
  flex: 1;
  min-width: 440px;
}

/* DEDICATED TAB VIEWS (Pharma, Life-Support, Alerts, Settings) */
.dedicated-tab-panel {
  padding: 10px 0;
}

.dedicated-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.dedicated-header h2 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #f8fafc;
  margin: 0;
}

.dedicated-grid {
  display: flex;
  gap: 20px;
}

.grid-left {
  width: 420px;
  flex-shrink: 0;
}

.grid-right {
  flex: 1;
}

.protocol-table-wrap {
  margin-top: 14px;
  overflow-x: auto;
  border-radius: 8px;
}

.protocol-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;
}

.protocol-table th {
  text-align: left;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.03);
  color: #94a3b8;
  font-weight: 600;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.protocol-table td {
  padding: 10px 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
  color: #f1f5f9;
}

.badge-fefo {
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.35);
  border-radius: 4px;
  padding: 2px 8px;
  font-size: 0.72rem;
  font-weight: 600;
}

.eclss-stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
  margin-top: 14px;
}

.stat-card {
  padding: 16px;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
}

.sc-title {
  font-size: 0.8rem;
  color: #94a3b8;
  font-weight: 600;
  margin-bottom: 4px;
}

.sc-val {
  font-size: 1.4rem;
  font-weight: 800;
  color: #00d2ff;
  font-family: var(--neo-font-mono, monospace);
  margin-bottom: 2px;
}

.sc-sub {
  font-size: 0.72rem;
  color: #64748b;
}

.protocol-steps {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px;
  margin-top: 14px;
  border-radius: 8px;
}

.step-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.step-num {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #ef4444;
  color: #fff;
  font-weight: bold;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.step-info {
  display: flex;
  flex-direction: column;
  font-size: 0.8rem;
  line-height: 1.4;
}

.step-info strong {
  color: #f1f5f9;
}

.step-info span {
  color: #94a3b8;
}

.settings-wrap {
  width: 100%;
}

.settings-group {
  margin-bottom: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  padding-bottom: 16px;
}

.settings-group h3 {
  font-size: 0.95rem;
  color: #00d2ff;
  margin: 0 0 8px 0;
}

.settings-group p {
  font-size: 0.82rem;
  color: #cbd5e1;
  line-height: 1.6;
  margin: 0;
}

.settings-group code {
  background: rgba(0, 0, 0, 0.4);
  padding: 2px 6px;
  border-radius: 4px;
  color: #ff6b35;
  font-family: var(--neo-font-mono, monospace);
}
</style>
