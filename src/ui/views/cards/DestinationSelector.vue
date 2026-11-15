<script setup>
import { ref } from 'vue';
import { useMarsStore } from '../../stores/marsStore.js';

const store = useMarsStore();
const isOpen = ref(false);

function selectDestination(id) {
  store.setDestination(id);
  isOpen.value = false;
}
</script>

<template>
  <div class="dest-selector-wrap">
    <button
      class="dest-trigger-btn"
      :class="{ open: isOpen }"
      @click="isOpen = !isOpen"
      title="Select Mars Exploration Destination"
    >
      <svg viewBox="0 0 24 24" class="dest-planet-svg">
        <circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" stroke-width="1.8"/>
        <ellipse cx="12" cy="12" rx="10" ry="3.5" fill="none" stroke="currentColor" stroke-width="1.3" transform="rotate(-20 12 12)"/>
      </svg>
      <span class="dest-name">{{ store.currentDestination.name }}</span>
      <svg viewBox="0 0 24 24" class="chevron-svg" :class="{ rotated: isOpen }">
        <path fill="currentColor" d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
      </svg>
    </button>

    <!-- Floating Dropdown Menu -->
    <div v-if="isOpen" class="dest-dropdown neo-card">
      <div class="dest-dropdown-header">
        <span>Planetary Destinations</span>
        <span class="dest-count">{{ store.destinations.length }} Sites</span>
      </div>

      <div class="dest-list">
        <div
          v-for="d in store.destinations"
          :key="d.id"
          class="dest-item"
          :class="{ active: store.selectedDestinationId === d.id }"
          @click="selectDestination(d.id)"
        >
          <div class="dest-item-main">
            <div class="dest-item-title">{{ d.name }}</div>
            <div class="dest-item-sub">{{ d.subtitle }}</div>
          </div>
          <div class="dest-item-badge">{{ d.category }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dest-selector-wrap {
  position: relative;
  display: inline-block;
}

.dest-trigger-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--neo-card-bg);
  border: 1px solid var(--neo-border);
  border-radius: 8px;
  padding: 6px 14px;
  color: var(--neo-text-primary);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: var(--neo-shadow-btn);
  transition: all 0.2s ease;
}

.dest-trigger-btn:hover {
  border-color: rgba(0, 210, 255, 0.4);
  color: var(--neo-cyan);
}

.dest-trigger-btn.open {
  border-color: var(--neo-cyan);
  background: rgba(0, 210, 255, 0.12);
}

.dest-planet-svg {
  width: 16px;
  height: 16px;
  color: var(--neo-orange);
}

.chevron-svg {
  width: 14px;
  height: 14px;
  color: var(--neo-text-muted);
  transition: transform 0.2s;
}

.chevron-svg.rotated {
  transform: rotate(180deg);
}

/* Floating Dropdown */
.dest-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 320px;
  background: var(--neo-card-bg);
  border: 1px solid var(--neo-border);
  border-radius: 12px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.6), var(--neo-shadow-card);
  z-index: 200;
  overflow: hidden;
  animation: popIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.dest-dropdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  border-bottom: 1px solid var(--neo-border);
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--neo-text-muted);
  letter-spacing: 0.05em;
}

.dest-count {
  font-family: var(--neo-font-mono);
  color: var(--neo-cyan);
}

.dest-list {
  display: flex;
  flex-direction: column;
  padding: 6px;
  gap: 4px;
  max-height: 380px;
  overflow-y: auto;
}

.dest-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  border: 1px solid transparent;
}

.dest-item:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(0, 210, 255, 0.2);
}

.dest-item.active {
  background: rgba(0, 210, 255, 0.14);
  border-color: rgba(0, 210, 255, 0.4);
}

.dest-item-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.dest-item-title {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--neo-text-primary);
}

.dest-item-sub {
  font-size: 0.68rem;
  color: var(--neo-text-muted);
}

.dest-item-badge {
  font-size: 0.64rem;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.06);
  color: var(--neo-text-secondary);
}

.dest-item.active .dest-item-badge {
  background: rgba(0, 210, 255, 0.25);
  color: var(--neo-cyan);
}

@keyframes popIn {
  from { opacity: 0; transform: scale(0.96) translateY(-6px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
</style>
