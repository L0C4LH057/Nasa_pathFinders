<script setup>
import { useMarsStore } from '../stores/marsStore.js';

const store = useMarsStore();

function acknowledge() {
  store.isWelcomeOpen = false;
}
</script>

<template>
  <aside v-if="store.isWelcomeOpen" id="mars-welcome-dialog" role="dialog" aria-modal="true">
    <div class="mars-welcome-card">
      <div class="mars-welcome-header">
        <div class="mars-badge">NASA SPACE APPS CHALLENGE 2026</div>
        <h1>MARS PATHFINDER</h1>
        <p class="mars-sub">Interplanetary Survival Guide: Jezero Crater 3D Traversal Workstation</p>
      </div>

      <div class="mars-welcome-body">
        <p>
          Welcome to <strong>MARS PATHFINDER</strong>, an advanced 3D Martian decision-support console engineered for the <strong>Jezero Crater Western Delta</strong> pilot exploration corridor.
        </p>

        <div class="mars-disclaimer-box">
          <div class="disclaimer-title">MANDATORY PROTOTYPE SAFETY BOUNDARY DISCLAIMER</div>
          <p>
            MARS PATHFINDER is a research, educational, and decision-support prototype. It is <strong>NOT</strong> a flight-certified navigation system, an autonomous rover driving system, a real spacesuit telemetry monitor, a guarantee of astronaut safety, or a substitute for NASA Mission Control. All slope cutoffs, mobility weights, walking speeds, and EVA resource rates are configurable prototype assumptions.
          </p>
        </div>

        <div class="mars-feature-highlights">
          <div class="feature-col">
            <svg viewBox="0 0 24 24" class="feat-svg"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1.8"/><ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>
            <strong>IAU 2015 Mars Ellipsoid</strong>
            <small>Eliminates +87.8% WGS84 Earth distortion</small>
          </div>
          <div class="feature-col">
            <svg viewBox="0 0 24 24" class="feat-svg"><path fill="currentColor" d="M19 15l-6 6-1.42-1.42L15.17 16H4V4h2v10h9.17l-3.59-3.58L13 9l6 6z"/></svg>
            <strong>Dual Pathfinding Engine</strong>
            <small>A* vs. Dijkstra over 25m DTM cost grid</small>
          </div>
          <div class="feature-col">
            <svg viewBox="0 0 24 24" class="feat-svg"><path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/></svg>
            <strong>EVA Resource Estimator</strong>
            <small>Round-trip O2 and Battery with 25% safety reserve</small>
          </div>
        </div>
      </div>

      <div class="mars-welcome-footer">
        <button class="mars-ack-btn" @click="acknowledge">
          ACKNOWLEDGE & ENTER MISSION WORKSTATION
        </button>
      </div>
    </div>
  </aside>
</template>

<style scoped>
#mars-welcome-dialog {
  position: fixed;
  inset: 0;
  background: rgba(7, 5, 4, 0.82);
  backdrop-filter: blur(16px);
  z-index: 999999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.mars-welcome-card {
  background: rgba(18, 14, 12, 0.95);
  border: 1px solid rgba(255, 107, 53, 0.35);
  border-radius: 16px;
  width: 100%;
  max-width: 680px;
  padding: 32px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.85), 0 0 40px rgba(255, 107, 53, 0.2);
  color: #f5f3f0;
  text-align: center;
}

.mars-badge {
  display: inline-block;
  background: rgba(255, 107, 53, 0.15);
  color: #ff6b35;
  border: 1px solid rgba(255, 107, 53, 0.3);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  padding: 3px 10px;
  border-radius: 20px;
  margin-bottom: 12px;
}

.mars-welcome-header h1 {
  font-size: 1.8rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  color: #f5f3f0;
  margin: 0 0 6px 0;
}

.mars-sub {
  color: #c5beba;
  font-size: 0.9rem;
  margin: 0 0 20px 0;
}

.mars-welcome-body p {
  font-size: 0.9rem;
  line-height: 1.5;
  color: #d1c7bd;
  margin-bottom: 20px;
}

.mars-disclaimer-box {
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.35);
  border-radius: 10px;
  padding: 16px;
  text-align: left;
  margin-bottom: 24px;
}

.disclaimer-title {
  color: #ef4444;
  font-weight: 700;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
  margin-bottom: 6px;
}

.mars-disclaimer-box p {
  color: #fca5a5;
  font-size: 0.82rem;
  line-height: 1.45;
  margin: 0;
}

.mars-feature-highlights {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-bottom: 28px;
}

.feature-col {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 8px;
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.feat-svg {
  width: 24px;
  height: 24px;
  color: var(--neo-cyan, #00d2ff);
  margin-bottom: 4px;
}

.feature-col strong {
  font-size: 0.78rem;
  color: #f5f3f0;
}

.feature-col small {
  font-size: 0.68rem;
  color: #8c827a;
  text-align: center;
}

.mars-ack-btn {
  background: #ff6b35;
  color: #070504;
  border: none;
  font-weight: 800;
  font-size: 0.9rem;
  letter-spacing: 0.04em;
  padding: 12px 28px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
}

.mars-ack-btn:hover {
  background: #ffa07a;
  box-shadow: 0 0 20px rgba(255, 107, 53, 0.5);
}
</style>
