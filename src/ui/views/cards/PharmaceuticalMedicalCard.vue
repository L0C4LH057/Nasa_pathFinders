<script setup>
import { computed } from 'vue';
import { useMarsStore } from '../../stores/marsStore.js';

const store = useMarsStore();

const activeSubCategory = computed(() => store.pharmaInventory.activeCategory);
const item = computed(() => store.pharmaInventory.activeItem);
const belowStock = computed(() => store.pharmaInventory.belowStockCount);

function setSubCategory(cat) {
  store.pharmaInventory.activeCategory = cat;
}
</script>

<template>
  <div class="neo-card pharma-card">
    <div class="neo-card-inner">
      <div class="card-header">
        <div class="header-left">
          <svg viewBox="0 0 24 24" class="header-icon">
            <path fill="currentColor" d="M19 10.5h-5.5V5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v5.5H5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5h5.5V19c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-5.5H19c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5z"/>
          </svg>
          <h2 class="card-title">Pharmaceutical & Medical</h2>
        </div>
      </div>

      <!-- Category Sub-tabs -->
      <div class="subtabs-bar neo-sunken">
        <button
          class="subtab-btn"
          :class="{ active: activeSubCategory === 'inventory' }"
          @click="setSubCategory('inventory')"
        >
          Inventory
        </button>
        <button
          class="subtab-btn"
          :class="{ active: activeSubCategory === 'crew-health' }"
          @click="setSubCategory('crew-health')"
        >
          Crew Health
        </button>
        <button
          class="subtab-btn"
          :class="{ active: activeSubCategory === 'medical-kit' }"
          @click="setSubCategory('medical-kit')"
        >
          Medical Kit
        </button>
      </div>

      <!-- Main Pharma Content -->
      <div v-if="activeSubCategory === 'inventory'" class="pharma-body">
        <div class="item-summary">
          <div class="med-thumb-wrap neo-sunken">
            <svg viewBox="0 0 24 24" class="bottle-svg">
              <path fill="#f59e0b" d="M6 3h12v2H6zm2 3h8v2H8zm-3 3h14c.55 0 1 .45 1 1v11c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2V10c0-.55.45-1 1-1zm3 7h3v-3h2v3h3v2h-3v3h-2v-3H8v-2z"/>
            </svg>
          </div>
          <div class="med-meta">
            <div class="med-title">{{ item.name.split(' ')[0] }}</div>
            <div class="med-spec">{{ item.name.substring(item.name.indexOf(' ') + 1) }}</div>
            <div class="med-batch">Batch: {{ item.batch }}</div>
            <div class="med-expiry">Expiry: {{ item.expiry }}</div>
            <div class="med-stock-tag">In Stock: {{ item.inStock }}</div>
          </div>
        </div>

        <div class="compliance-column">
          <div class="fefo-status">
            <svg viewBox="0 0 24 24" class="fefo-svg"><path fill="currentColor" d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg>
            <span class="fefo-text">FEFO Compliant</span>
          </div>

          <div class="stock-alert-box">
            <svg viewBox="0 0 24 24" class="stock-alert-svg"><path fill="currentColor" d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
            <div class="stock-alert-text">
              <strong>{{ belowStock }} items</strong>
              <span>below minimum stock</span>
            </div>
          </div>

          <button class="view-inventory-link" @click="store.setActiveTab('pharma')">
            View Inventory &rarr;
          </button>
        </div>
      </div>

      <!-- Crew Health Quick Summary -->
      <div v-else-if="activeSubCategory === 'crew-health'" class="subtab-list neo-sunken">
        <div class="subtab-row"><span>Commander</span><span class="font-mono">{{ store.crewHealth.name }}</span></div>
        <div class="subtab-row"><span>Heart Rate / SpO₂</span><span class="font-mono">{{ store.crewHealth.vitals.heartRate }} bpm · {{ store.crewHealth.vitals.spo2 }}%</span></div>
        <div class="subtab-row"><span>Blood Pressure</span><span class="font-mono">{{ store.crewHealth.vitals.bp }} mmHg</span></div>
        <div class="subtab-row"><span>Core Temp</span><span class="font-mono">{{ store.crewHealth.vitals.temp }} °C ({{ store.crewHealth.status }})</span></div>
      </div>

      <!-- EVA Medical Kit Readiness -->
      <div v-else class="subtab-list neo-sunken">
        <div v-for="kit in store.pharmaInventory.medicalKit" :key="kit.name" class="subtab-row">
          <span>{{ kit.name }}</span>
          <span class="font-mono">{{ kit.qty }} · {{ kit.status }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pharma-card {
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
  color: #a855f7;
}

.card-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  color: #f8fafc;
  letter-spacing: 0.02em;
}

.subtabs-bar {
  display: flex;
  padding: 3px;
  border-radius: 8px;
  margin-bottom: 12px;
}

.subtab-btn {
  flex: 1;
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 0.73rem;
  font-weight: 600;
  padding: 4px 6px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.subtab-btn.active {
  background: #151a28;
  color: #00d2ff;
  box-shadow: -2px -2px 6px rgba(255, 255, 255, 0.04), 3px 3px 8px rgba(0, 0, 0, 0.7);
}

.subtab-list {
  padding: 10px 12px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.subtab-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.78rem;
  color: #cbd5e1;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  padding-bottom: 5px;
}

.subtab-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.font-mono {
  font-family: var(--neo-font-mono, monospace);
  color: #38bdf8;
}

.pharma-body {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.item-summary {
  display: flex;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.med-thumb-wrap {
  width: 60px;
  height: 80px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.bottle-svg {
  width: 32px;
  height: 32px;
}

.med-meta {
  flex: 1;
  min-width: 0;
}

.med-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: #f1f5f9;
}

.med-spec {
  font-size: 0.72rem;
  color: #94a3b8;
  margin-bottom: 3px;
}

.med-batch,
.med-expiry {
  font-size: 0.68rem;
  font-family: var(--neo-font-mono, monospace);
  color: #64748b;
  line-height: 1.25;
}

.med-stock-tag {
  display: inline-block;
  margin-top: 5px;
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.3);
  font-size: 0.7rem;
  font-weight: 600;
  padding: 1px 7px;
  border-radius: 4px;
}

.compliance-column {
  width: 140px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex-shrink: 0;
}

.fefo-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #10b981;
}

.fefo-svg {
  width: 14px;
  height: 14px;
  color: #10b981;
  flex-shrink: 0;
}

.stock-alert-box {
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.35);
  border-radius: 6px;
  padding: 5px 7px;
  display: flex;
  gap: 6px;
  align-items: center;
}

.stock-alert-svg {
  width: 16px;
  height: 16px;
  color: #f59e0b;
  flex-shrink: 0;
}

.stock-alert-text {
  font-size: 0.68rem;
  color: #fbbf24;
  line-height: 1.2;
  display: flex;
  flex-direction: column;
}

.view-inventory-link {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 0.74rem;
  font-weight: 600;
  cursor: pointer;
  text-align: right;
  margin-top: 2px;
  padding: 0;
  transition: color 0.15s ease;
}

.view-inventory-link:hover {
  color: #00d2ff;
}
</style>
