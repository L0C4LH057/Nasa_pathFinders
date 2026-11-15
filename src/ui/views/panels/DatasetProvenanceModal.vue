<script setup>
import { ref, onMounted } from 'vue';
import { useMarsStore } from '../../stores/marsStore.js';

const store = useMarsStore();
const datasets = ref([]);
const loading = ref(true);

const FALLBACK_DATASETS = [
  {
    id: 'viking-mdim21',
    title: 'Viking Orbiter MDIM 2.1 Colorized Global Mosaic',
    mission: 'Viking 1 & 2 Orbiters (NASA)',
    instrument: 'Visual Imaging Subsystem (VIS)',
    spatial_resolution: '232 m/px',
    crs: 'IAU_2015:49900',
    pds_product_id: 'VO_MDIM_21_GLOBAL',
    limitations: 'Coarse spatial resolution; legacy 1970s orthorectification.',
    uncertainty_handling: 'Regional visual context basemap only.',
  },
  {
    id: 'mro-ctx-jezero',
    title: 'MRO CTX Jezero Crater Mosaic',
    mission: 'Mars Reconnaissance Orbiter (NASA/JPL/Caltech Murray Lab)',
    instrument: 'Context Camera (CTX)',
    spatial_resolution: '6.0 m/px',
    crs: 'IAU_2015:49900',
    pds_product_id: 'MurrayLab_CTX_V01_Jezero',
    limitations: 'Varying atmospheric dust haze between orbital tracks.',
    uncertainty_handling: 'Draped over DTM terrain to contextualize route corridors.',
  },
  {
    id: 'mro-hirise-jezero-dtm',
    title: 'MRO HiRISE Jezero Crater Western Delta DTM',
    mission: 'Mars Reconnaissance Orbiter (NASA/JPL/Univ of Arizona)',
    instrument: 'High Resolution Imaging Science Experiment (HiRISE)',
    spatial_resolution: '1.0 m/px',
    crs: 'IAU_2015:49900',
    pds_product_id: 'DTEEC_045994_1985_046060_1985_A01',
    limitations: 'Stereo correlation gaps on featureless dune crests; scarp shadowing.',
    uncertainty_handling: 'Primary substrate for Horn slope derivation; uncertainty mask U(v) = 0.0.',
  },
  {
    id: 'mgs-mola-megdr',
    title: 'MGS MOLA Megascience Elevation Model',
    mission: 'Mars Global Surveyor (NASA/GSFC)',
    instrument: 'Mars Orbiter Laser Altimeter (MOLA)',
    spatial_resolution: '463 m/px',
    crs: 'IAU_2015:49900 (MOLA Areoid Datum)',
    pds_product_id: 'MGS-M-MOLA-5-MEGDR-L3-V1.0',
    limitations: 'Coarse footprint (463m) misses meter-scale scarps and boulders.',
    uncertainty_handling: 'Outside HiRISE coverage, terrain uncertainty U(v) = 1.0, incurring high routing penalties.',
  },
  {
    id: 'mro-crism-mineralogy',
    title: 'MRO CRISM Targeted Hyperspectral Mineralogy',
    mission: 'Mars Reconnaissance Orbiter (NASA/JHU-APL)',
    instrument: 'Compact Reconnaissance Imaging Spectrometer for Mars (CRISM)',
    spatial_resolution: '18.0 - 36.0 m/px',
    crs: 'IAU_2015:49900',
    pds_product_id: 'FRT00005C5E_07_IF166L_TRR3',
    limitations: 'Atmospheric CO2 absorption bands; column striping.',
    uncertainty_handling: 'Delineates science targets (carbonates and clays) for excursion objectives.',
  },
  {
    id: 'm2020-perseverance-traverse',
    title: 'Mars 2020 Perseverance Rover Traversed Path & Waypoints',
    mission: 'NASA Mars 2020 Mission (NASA/JPL)',
    instrument: 'Perseverance Rover Navcam / Hazcam / PIXL / SHERLOC',
    spatial_resolution: 'Ground Truth (< 0.01 m)',
    crs: 'IAU_2015:49900',
    pds_product_id: 'M2020_TRAVERSE_SOL_0001_1000',
    limitations: 'Ground track limited to traversed path; does not cover unvisited northern fan.',
    uncertainty_handling: 'Verified ground-truth base camp and sample depots.',
  },
];

onMounted(async () => {
  try {
    const res = await fetch('/api/mars/provenance');
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const data = await res.json();
      datasets.value = data.datasets || FALLBACK_DATASETS;
    } else {
      datasets.value = FALLBACK_DATASETS;
    }
  } catch {
    datasets.value = FALLBACK_DATASETS;
  } finally {
    loading.value = false;
  }
});

function close() {
  store.isProvenanceOpen = false;
}
</script>

<template>
  <div v-if="store.isProvenanceOpen" class="mars-modal-overlay" @click.self="close">
    <div class="mars-modal-card ui-scroll">
      <div class="mars-modal-header">
        <div>
          <h2>Planetary Dataset Provenance &amp; Uncertainty Register</h2>
          <p class="mars-modal-sub">Cartographic Standards: IAU 2015 Mars Triaxial Ellipsoid (IAU_2015:49900) &amp; MOLA Areoid Datum</p>
        </div>
        <button class="mars-close-btn" @click="close" title="Close Modal">✕</button>
      </div>

      <div class="mars-modal-body">
        <div v-if="loading" class="mars-loading">Loading Dataset Register from Rust Microservice...</div>
        
        <table v-else class="mars-provenance-table">
          <thead>
            <tr>
              <th>Dataset & Mission</th>
              <th>Instrument</th>
              <th>Resolution</th>
              <th>PDS Product ID / Source</th>
              <th>Known Limitations</th>
              <th>Uncertainty Handling</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="ds in datasets" :key="ds.id">
              <td>
                <strong>{{ ds.title }}</strong><br>
                <small class="mars-tag">{{ ds.mission }}</small>
              </td>
              <td>{{ ds.instrument }}</td>
              <td><span class="mars-res-badge">{{ ds.spatial_resolution }}</span></td>
              <td>
                <code>{{ ds.pds_product_id }}</code><br>
                <a :href="ds.source_url" target="_blank" rel="noopener noreferrer" class="mars-link">NASA PDS Archive ↗</a>
              </td>
              <td class="mars-dim-text">{{ ds.limitations }}</td>
              <td><em class="mars-accent-text">{{ ds.uncertainty_handling }}</em></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="mars-modal-footer">
        <button class="mars-btn-primary" @click="close">Close Register</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mars-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(12px);
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.mars-modal-card {
  background: rgba(18, 14, 12, 0.94);
  border: 1px solid rgba(255, 107, 53, 0.4);
  border-radius: 14px;
  width: 100%;
  max-width: 1100px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(255, 107, 53, 0.15);
  color: #f5f3f0;
}

.mars-modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 107, 53, 0.2);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.mars-modal-header h2 {
  font-size: 1.3rem;
  font-weight: 700;
  color: #ff6b35;
  margin: 0 0 4px 0;
}

.mars-modal-sub {
  font-size: 0.8rem;
  color: #a89f91;
  margin: 0;
}

.mars-close-btn {
  background: transparent;
  border: none;
  color: #a89f91;
  font-size: 1.4rem;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
}

.mars-close-btn:hover {
  color: #ff6b35;
}

.mars-modal-body {
  padding: 20px 24px;
  overflow-y: auto;
  flex: 1;
}

.mars-provenance-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
  text-align: left;
}

.mars-provenance-table th {
  background: rgba(255, 107, 53, 0.1);
  color: #ffa07a;
  padding: 10px 12px;
  border-bottom: 2px solid rgba(255, 107, 53, 0.3);
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
}

.mars-provenance-table td {
  padding: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  vertical-align: top;
}

.mars-tag {
  color: #c5beba;
  font-size: 0.75rem;
}

.mars-res-badge {
  background: rgba(0, 240, 255, 0.12);
  color: #00f0ff;
  border: 1px solid rgba(0, 240, 255, 0.3);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: var(--font-mono);
  font-size: 0.75rem;
}

.mars-link {
  color: #00f0ff;
  text-decoration: none;
  font-size: 0.75rem;
}

.mars-link:hover {
  text-decoration: underline;
}

.mars-dim-text {
  color: #8c827a;
  font-size: 0.8rem;
}

.mars-accent-text {
  color: #ffb703;
  font-size: 0.8rem;
}

.mars-modal-footer {
  padding: 14px 24px;
  border-top: 1px solid rgba(255, 107, 53, 0.2);
  display: flex;
  justify-content: flex-end;
}

.mars-btn-primary {
  background: #ff6b35;
  color: #070504;
  border: none;
  font-weight: 700;
  font-size: 0.85rem;
  padding: 8px 18px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.mars-btn-primary:hover {
  background: #ffa07a;
  box-shadow: 0 0 12px rgba(255, 107, 53, 0.5);
}
</style>
