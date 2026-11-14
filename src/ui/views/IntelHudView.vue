<script setup>
import { computed } from 'vue';
import { useMarsStore } from '../stores/marsStore.js';

const store = useMarsStore();
const entity = computed(() => store.inspectedEntity);

function close() {
  store.setInspectedEntity(null);
}
</script>

<template>
  <aside v-if="entity" id="mars-intel-card" role="region" aria-label="Feature Inspector">
    <div class="intel-card-inner">
      <div class="intel-card-header">
        <div class="intel-category-badge" :data-category="entity.category">
          {{ (entity.category || 'FEATURE').toUpperCase().replace('_', ' ') }}
        </div>
        <button class="intel-close-btn" @click="close" title="Close Inspector">✕</button>
      </div>

      <h3 class="intel-title">{{ entity.name }}</h3>

      <div class="intel-grid">
        <div class="intel-item">
          <span class="intel-label">MISSION</span>
          <span class="intel-val">{{ entity.mission || 'NASA Mars 2020' }}</span>
        </div>
        <div class="intel-item">
          <span class="intel-label">INSTRUMENT</span>
          <span class="intel-val">{{ entity.instrument || 'Science Payload' }}</span>
        </div>
        <div v-if="entity.sol" class="intel-item">
          <span class="intel-label">SOL ENCOUNTER</span>
          <span class="intel-val">Sol {{ entity.sol }}</span>
        </div>
        <div v-if="entity.elevation_m !== undefined" class="intel-item">
          <span class="intel-label">MOLA ELEVATION</span>
          <span class="intel-val">{{ entity.elevation_m }} m</span>
        </div>
      </div>

      <div v-if="entity.significance" class="intel-desc">
        <span class="intel-label">GEOLOGICAL CONTEXT</span>
        <p>{{ entity.significance }}</p>
      </div>

      <div v-if="entity.warning" class="intel-warning-box">
        <span class="warning-title">OPERATIONAL HAZARD NOTICE</span>
        <p>{{ entity.warning }}</p>
      </div>

      <div v-if="entity.pds_url" class="intel-footer">
        <a :href="entity.pds_url" target="_blank" rel="noopener noreferrer" class="intel-pds-btn">
          OPEN OFFICIAL NASA PDS ARCHIVE ↗
        </a>
      </div>
    </div>
  </aside>
</template>

<style scoped>
#mars-intel-card {
  position: fixed;
  top: 70px;
  right: 24px;
  width: 320px;
  z-index: 1000;
  pointer-events: auto;
}

.intel-card-inner {
  background: rgba(18, 14, 12, 0.92);
  border: 1px solid rgba(255, 107, 53, 0.35);
  border-radius: 12px;
  padding: 18px;
  backdrop-filter: blur(12px);
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.7);
  color: #f5f3f0;
}

.intel-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.intel-category-badge {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(255, 107, 53, 0.15);
  color: #ff6b35;
  border: 1px solid rgba(255, 107, 53, 0.3);
}

.intel-category-badge[data-category="hazard_exclusion"] {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.3);
}

.intel-category-badge[data-category="base_camp"] {
  background: rgba(0, 240, 255, 0.15);
  color: #00f0ff;
  border-color: rgba(0, 240, 255, 0.3);
}

.intel-close-btn {
  background: transparent;
  border: none;
  color: #8c827a;
  font-size: 1.1rem;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
}

.intel-close-btn:hover {
  color: #f5f3f0;
}

.intel-title {
  font-size: 1.05rem;
  font-weight: 700;
  margin: 0 0 14px 0;
  color: #f5f3f0;
  line-height: 1.3;
}

.intel-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 14px;
}

.intel-item {
  display: flex;
  flex-direction: column;
}

.intel-label {
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: #8c827a;
  margin-bottom: 2px;
}

.intel-val {
  font-size: 0.8rem;
  font-weight: 600;
  color: #e5dfd8;
  font-family: var(--font-mono);
}

.intel-desc {
  margin-bottom: 14px;
}

.intel-desc p {
  font-size: 0.8rem;
  line-height: 1.45;
  color: #c5beba;
  margin: 4px 0 0 0;
}

.intel-warning-box {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 6px;
  padding: 10px;
  margin-bottom: 14px;
}

.warning-title {
  font-size: 0.68rem;
  font-weight: 700;
  color: #ef4444;
  display: block;
  margin-bottom: 4px;
}

.intel-warning-box p {
  font-size: 0.75rem;
  color: #fca5a5;
  margin: 0;
  line-height: 1.35;
}

.intel-footer {
  margin-top: 6px;
}

.intel-pds-btn {
  display: block;
  text-align: center;
  background: rgba(0, 240, 255, 0.08);
  border: 1px solid rgba(0, 240, 255, 0.3);
  color: #00f0ff;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 8px 12px;
  border-radius: 6px;
  text-decoration: none;
  transition: all 0.2s ease;
}

.intel-pds-btn:hover {
  background: rgba(0, 240, 255, 0.18);
  box-shadow: 0 0 10px rgba(0, 240, 255, 0.3);
}
</style>
