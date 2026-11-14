<script setup>
import { computed } from 'vue';
import { useMarsStore } from '../../stores/marsStore.js';

const store = useMarsStore();

const crew = computed(() => store.crewHealth);
const vitals = computed(() => store.crewHealth.vitals);
</script>

<template>
  <div class="neo-card crew-health-card">
    <div class="neo-card-inner">
      <div class="card-header">
        <div class="header-left">
          <svg viewBox="0 0 24 24" class="header-icon">
            <path fill="currentColor" d="M12 2a5 5 0 1 0 5 5 5 5 0 0 0-5-5zm0 8a3 3 0 1 1 3-3 3 3 0 0 1-3 3zm9 11v-1a7 7 0 0 0-7-7h-4a7 7 0 0 0-7 7v1h2v-1a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v1z"/>
          </svg>
          <h2 class="card-title">Crew Health</h2>
        </div>
      </div>

      <div class="crew-body">
        <!-- Astronaut Portrait & Status -->
        <div class="crew-profile">
          <div class="avatar-wrap neo-sunken">
            <div class="astronaut-helmet">
              <svg viewBox="0 0 64 64" class="helmet-svg">
                <circle cx="32" cy="32" r="28" fill="#151a28" stroke="#334155" stroke-width="2"/>
                <!-- Visor with Gold Reflection -->
                <path d="M16 26c0-6.6 7.2-12 16-12s16 5.4 16 12c0 10-7.2 16-16 16s-16-6-16-16z" fill="#0b0f17" stroke="#eab308" stroke-width="2"/>
                <path d="M20 22c2-3 7-5 12-5 3 0 6 1 8 2.5-3-1-7-1.5-10-1.5-5 0-8 1.5-10 4z" fill="#eab308" opacity="0.6"/>
                <!-- Neck Ring -->
                <rect x="22" y="46" width="20" height="6" rx="2" fill="#475569"/>
              </svg>
            </div>
          </div>
          <div class="crew-name">{{ crew.name }}</div>
          <div class="crew-role">{{ crew.role }}</div>
        </div>

        <!-- Biometrics Vitals Column -->
        <div class="vitals-column">
          <div class="vital-row">
            <div class="vital-lbl-group">
              <span class="vital-tag tag-hr">HR</span>
              <span class="vital-lbl">Heart Rate</span>
            </div>
            <span class="vital-val font-mono">{{ vitals.heartRate }} <span class="unit">bpm</span></span>
          </div>

          <div class="vital-row">
            <div class="vital-lbl-group">
              <span class="vital-tag tag-bp">BP</span>
              <span class="vital-lbl">Blood Pressure</span>
            </div>
            <span class="vital-val font-mono">{{ vitals.bp }} <span class="unit">mmHg</span></span>
          </div>

          <div class="vital-row">
            <div class="vital-lbl-group">
              <span class="vital-tag tag-rr">RR</span>
              <span class="vital-lbl">Resp. Rate</span>
            </div>
            <span class="vital-val font-mono">{{ vitals.respRate }} <span class="unit">br/min</span></span>
          </div>

          <div class="vital-row">
            <div class="vital-lbl-group">
              <span class="vital-tag tag-temp">TEMP</span>
              <span class="vital-lbl">Core Temp</span>
            </div>
            <span class="vital-val font-mono">{{ vitals.temp }} <span class="unit">°C</span></span>
          </div>

          <div class="vital-row">
            <div class="vital-lbl-group">
              <span class="vital-tag tag-spo2">SpO₂</span>
              <span class="vital-lbl">O₂ Saturation</span>
            </div>
            <span class="vital-val font-mono">{{ vitals.spo2 }} <span class="unit">%</span></span>
          </div>
        </div>
      </div>

      <!-- Medical Status Pill at Bottom -->
      <div class="medical-status-footer">
        <span class="status-dot"></span>
        <span class="status-text">Medical Status: {{ crew.status }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.crew-health-card {
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
  color: #38bdf8;
}

.card-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  color: #f8fafc;
  letter-spacing: 0.02em;
}

.crew-body {
  display: flex;
  gap: 14px;
  align-items: center;
}

.crew-profile {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  width: 85px;
  flex-shrink: 0;
}

.avatar-wrap {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 6px;
  padding: 4px;
}

.helmet-svg {
  width: 48px;
  height: 48px;
}

.crew-name {
  font-size: 0.78rem;
  font-weight: 700;
  color: #f1f5f9;
  white-space: nowrap;
}

.crew-role {
  font-size: 0.68rem;
  color: #94a3b8;
}

.vitals-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.vital-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2px 4px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
}

.vital-lbl-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.vital-tag {
  font-family: var(--neo-font-mono, monospace);
  font-size: 0.6rem;
  font-weight: 700;
  padding: 1px 4px;
  border-radius: 3px;
  letter-spacing: 0.04em;
  min-width: 28px;
  text-align: center;
}

.tag-hr { background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); }
.tag-bp { background: rgba(0, 210, 255, 0.15); color: #00d2ff; border: 1px solid rgba(0, 210, 255, 0.3); }
.tag-rr { background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); }
.tag-temp { background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3); }
.tag-spo2 { background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); }

.vital-lbl {
  font-size: 0.72rem;
  color: #94a3b8;
}

.vital-val {
  font-size: 0.76rem;
  font-weight: 600;
  color: #f1f5f9;
}

.font-mono {
  font-family: var(--neo-font-mono, monospace);
}

.unit {
  font-size: 0.66rem;
  color: #64748b;
  font-weight: 400;
}

.medical-status-footer {
  margin-top: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 3px 8px;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: 12px;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 6px rgba(16, 185, 129, 0.7);
}

.status-text {
  font-size: 0.7rem;
  font-weight: 600;
  color: #34d399;
}
</style>
