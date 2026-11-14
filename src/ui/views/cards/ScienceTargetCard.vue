<script setup>
import { computed } from 'vue';
import { useMarsStore } from '../../stores/marsStore.js';

const store = useMarsStore();

const target = computed(() => store.scienceTarget);

function inspectTarget() {
  if (window.__marsController && store.scienceTarget) {
    store.setInspectedEntity({
      title: target.value.title,
      description: target.value.subtitle,
      confidence: target.value.confidence,
      elevation: target.value.elevation_m,
    });
  }
}
</script>

<template>
  <div class="neo-card science-target-card">
    <div class="neo-card-inner">
      <div class="card-header">
        <div class="header-left">
          <svg viewBox="0 0 24 24" class="header-icon">
            <path fill="currentColor" d="M19 19v1a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-1l4-5.33V6H8a1 1 0 0 1 0-2h8a1 1 0 0 1 0 2h-1v7.67L19 19zm-8.8-7l-3 4h9.6l-3-4H10.2z"/>
          </svg>
          <h2 class="card-title">Science Target</h2>
        </div>
      </div>

      <div class="target-body">
        <div class="thumb-container neo-sunken">
          <img
            :src="target.image"
            alt="Science Outcrop"
            class="target-img"
            loading="lazy"
            @error="(e) => (e.target.style.display = 'none')"
          />
          <div class="thumb-fallback">
            <svg viewBox="0 0 24 24" class="science-svg-icon"><path fill="currentColor" d="M19 19v1a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-1l4-5.33V6H8a1 1 0 0 1 0-2h8a1 1 0 0 1 0 2h-1v7.67L19 19z"/></svg>
            <span>87%</span>
          </div>
        </div>

        <div class="target-info">
          <h3 class="target-name">{{ target.title }}</h3>
          <p class="target-sub">{{ target.subtitle }}</p>
          <div class="confidence-bar-wrap">
            <div class="confidence-meta">
              <span>Confidence</span>
              <span class="conf-val">{{ target.confidence }}%</span>
            </div>
            <div class="progress-track neo-sunken">
              <div class="progress-fill" :style="{ width: target.confidence + '%' }"></div>
            </div>
          </div>
          <button class="learn-more-btn" @click="inspectTarget">
            Learn More &rarr;
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.science-target-card {
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
  color: #38bdf8;
}

.card-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  color: #f8fafc;
  letter-spacing: 0.02em;
}

.target-body {
  display: flex;
  gap: 14px;
  align-items: center;
}

.thumb-container {
  width: 86px;
  height: 86px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  position: relative;
  background: #080a0f;
  display: flex;
  align-items: center;
  justify-content: center;
}

.target-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  position: absolute;
  top: 0;
  left: 0;
}

.thumb-fallback {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 600;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
}

.science-svg-icon {
  width: 22px;
  height: 22px;
  color: #00d2ff;
}

.target-info {
  flex: 1;
  min-width: 0;
}

.target-name {
  margin: 0 0 3px 0;
  font-size: 0.88rem;
  font-weight: 700;
  color: #f1f5f9;
}

.target-sub {
  margin: 0 0 7px 0;
  font-size: 0.74rem;
  color: #94a3b8;
  line-height: 1.3;
}

.confidence-bar-wrap {
  margin-bottom: 8px;
}

.confidence-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.7rem;
  color: #64748b;
  margin-bottom: 2px;
}

.conf-val {
  color: #00d2ff;
  font-family: var(--neo-font-mono, monospace);
  font-weight: 600;
}

.progress-track {
  height: 5px;
  width: 100%;
  border-radius: 3px;
  overflow: hidden;
  background: #080a0f;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #00d2ff, #10b981);
  border-radius: 3px;
  box-shadow: 0 0 6px rgba(0, 210, 255, 0.5);
}

.learn-more-btn {
  background: transparent;
  border: none;
  color: #00d2ff;
  font-size: 0.78rem;
  font-weight: 600;
  padding: 0;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: transform 0.15s ease;
}

.learn-more-btn:hover {
  transform: translateX(3px);
  color: #38bdf8;
}
</style>
