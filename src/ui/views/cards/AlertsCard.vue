<script setup>
import { computed } from 'vue';
import { useMarsStore } from '../../stores/marsStore.js';

const store = useMarsStore();

const activeAlerts = computed(() => store.alerts);

function onTakeAction(alert) {
  if (alert.id === 'alert-temp') {
    alert.metric = 'Current: 21°C (Regulating...)';
    alert.action = 'Cooling loops increased to 120%.';
  } else if (alert.id === 'alert-water') {
    alert.action = 'Recycling recovery unit engaged (+15% flow).';
  } else if (alert.id === 'alert-o2') {
    alert.action = 'Secondary MOXIE purge valve activated.';
  }
}
</script>

<template>
  <div class="neo-card alerts-card">
    <div class="neo-card-inner">
      <div class="alerts-header">
        <div class="header-left">
          <svg viewBox="0 0 24 24" class="alert-icon-main-svg">
            <path fill="currentColor" d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
          </svg>
          <h2 class="alerts-title">Alerts ({{ activeAlerts.length }})</h2>
        </div>
        <button class="view-all-btn" @click="store.setActiveTab('alerts')">
          View All &rarr;
        </button>
      </div>

      <div class="alerts-list">
        <div
          v-for="item in activeAlerts"
          :key="item.id"
          class="alert-item"
          :class="'alert-' + item.severity"
        >
          <div class="alert-icon-wrap" :class="'icon-' + item.icon">
            <svg v-if="item.icon === 'thermometer'" viewBox="0 0 24 24" class="alert-svg">
              <path fill="currentColor" d="M15 13V5a3 3 0 0 0-6 0v8a5 5 0 1 0 6 0zm-3-10a1 1 0 0 1 1 1v5h-2V4a1 1 0 0 1 1-1zm0 16a3 3 0 0 1-2.82-4H14.82A3 3 0 0 1 12 19z"/>
            </svg>
            <svg v-else-if="item.icon === 'water'" viewBox="0 0 24 24" class="alert-svg">
              <path fill="currentColor" d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
            </svg>
            <span v-else class="o2-badge">O₂</span>
          </div>

          <div class="alert-content">
            <div class="alert-top-row">
              <span class="alert-name">{{ item.title }}</span>
              <span class="alert-time">{{ item.time }}</span>
            </div>
            <div class="alert-metric">{{ item.metric }}</div>
            <div class="alert-action-row">
              <span class="alert-action">{{ item.action }}</span>
              <button class="action-btn" @click="onTakeAction(item)">Act</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.alerts-card {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.alerts-header {
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

.alert-icon-main-svg {
  width: 18px;
  height: 18px;
  color: #ef4444;
}

.alerts-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  color: #f8fafc;
  letter-spacing: 0.02em;
}

.view-all-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.15s ease;
  display: flex;
  align-items: center;
  gap: 4px;
}

.view-all-btn:hover {
  color: #00d2ff;
}

.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
}

.alert-item {
  display: flex;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  background: #0b0f17;
  border: 1px solid rgba(255, 255, 255, 0.04);
  box-shadow: inset 2px 2px 5px rgba(0, 0, 0, 0.7), inset -1px -1px 3px rgba(255, 255, 255, 0.03);
  position: relative;
  transition: all 0.2s ease;
}

.alert-item:hover {
  border-color: rgba(255, 255, 255, 0.09);
  background: #0e131d;
}

.alert-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 10px;
  bottom: 10px;
  width: 3px;
  border-radius: 0 2px 2px 0;
}

.alert-warning::before {
  background: #f59e0b;
  box-shadow: 0 0 8px rgba(245, 158, 11, 0.6);
}

.alert-critical::before {
  background: #ef4444;
  box-shadow: 0 0 8px rgba(239, 68, 68, 0.7);
}

.alert-icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: -2px -2px 6px rgba(255, 255, 255, 0.04), 3px 3px 8px rgba(0, 0, 0, 0.8);
}

.icon-thermometer {
  background: #3b220d;
  color: #f59e0b;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.icon-water {
  background: #2a2512;
  color: #eab308;
  border: 1px solid rgba(234, 179, 8, 0.3);
}

.icon-air {
  background: #3b1016;
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.35);
}

.alert-svg {
  width: 18px;
  height: 18px;
}

.o2-badge {
  font-family: var(--neo-font-mono, monospace);
  font-weight: 800;
  font-size: 0.78rem;
  letter-spacing: -0.05em;
}

.alert-content {
  flex: 1;
  min-width: 0;
}

.alert-top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.alert-name {
  font-size: 0.82rem;
  font-weight: 600;
  color: #f1f5f9;
}

.alert-time {
  font-size: 0.72rem;
  font-family: var(--neo-font-mono, monospace);
  color: #64748b;
}

.alert-metric {
  font-size: 0.74rem;
  color: #94a3b8;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.alert-action-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 4px;
}

.alert-action {
  font-size: 0.71rem;
  color: #64748b;
  font-style: italic;
}

.action-btn {
  background: #151a28;
  color: #00d2ff;
  border: 1px solid rgba(0, 210, 255, 0.3);
  border-radius: 4px;
  font-size: 0.68rem;
  font-weight: 600;
  padding: 1px 7px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.action-btn:hover {
  background: #00d2ff;
  color: #0b0f17;
  box-shadow: 0 0 8px rgba(0, 210, 255, 0.4);
}
</style>
