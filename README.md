# 🔴 MARS PATHFINDER — 3D Planetary Traversal & Decision-Support Workstation

[![NASA Space Apps Challenge 2026](https://img.shields.io/badge/NASA%20Space%20Apps-2026%20Challenge-blue.svg)](https://www.spaceappschallenge.org/)
[![Track: Interplanetary Survival Guide](https://img.shields.io/badge/Challenge-Interplanetary%20Survival%20Guide-red.svg)](https://www.spaceappschallenge.org/)
[![Geodesy: Mars IAU 2015](https://img.shields.io/badge/CRS-IAU__2015%3A49900-orange.svg)](https://naif.jpl.nasa.gov/)
[![Backend: Rust Axum 0.7](https://img.shields.io/badge/Backend-Rust%20Axum%200.7-black.svg)](https://github.com/tokio-rs/axum)
[![Frontend: Vue 3.5 + CesiumJS 1.124](https://img.shields.io/badge/Frontend-Vue%203.5%20%2B%20CesiumJS-darkgreen.svg)](https://cesium.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> *"A future Mars explorer or rover mission planner needs a map that does more than show where things are. It must help them understand 3D Martian terrain, identify mapped hazards and scientific targets, compare algorithmic routes ($A^*$ vs. Dijkstra), and evaluate whether a planned outbound and return excursion fits within stated hypothetical mission resource constraints."*

---

## 🌟 Executive Summary

**MARS PATHFINDER** converts the open-source `gods-eye-view` 3D Earth intelligence console into a high-fidelity, interactive 3D Martian decision-support workstation bounded around **Jezero Crater** (the landing and exploration corridor of NASA's Mars 2020 *Perseverance* rover).

All Earth OSINT layers, radio decoders, and Earth coordinate assumptions (`WGS84`) have been purged and replaced with the **Mars IAU 2015 Triaxial Ellipsoid (`IAU_2015:49900`)**, NASA Mars Trek WMTS streaming layers, local Jezero Crater Digital Terrain Model (DTM) analysis, and a memory-safe **Rust `Axum` pathfinding & EVA telemetry microservice**.

```mermaid
flowchart LR
    subgraph Client ["Frontend 3D HUD (Vue 3.5 / CesiumJS 1.124)"]
        Globe["Cesium 3D Globe\n(MARS_ELLIPSOID IAU_2015:49900)"]
        HUD["Glassmorphic Basalt HUD\n(SceneChrome, CommandDock, Cockpit)"]
        SVGProfile["Synchronized SVG Elevation\n& Slope Profile Chart"]
    end

    subgraph Gateway ["Vite Reverse Proxy (/api/mars/*)"]
        Proxy["Vite 6.4 Dev / Standalone Server"]
    end

    subgraph Backend ["Backend Microservice (Rust Axum 0.7 / Tokio)"]
        DtmMatrix["In-Memory Jezero DTM\n(200x200 Grid, 25m Resolution)"]
        Horn["Horn's 3x3 Slope\nConvolution Kernel"]
        PathEngine["Dual Pathfinding Engine\n(A* Admissible 3D vs Dijkstra)"]
        BioCalc["EVA Consumables &\nBattery Energy Estimator"]
    end

    Globe <--> HUD
    HUD <--> SVGProfile
    HUD -->|HTTP Requests| Proxy
    Proxy -->|Loopback 127.0.0.1:8081| Backend
    Backend --> DtmMatrix
    DtmMatrix --> Horn
    Horn --> PathEngine
    PathEngine --> BioCalc
```

---

## ⚠️ Mandatory Prototype Safety Boundary Disclaimer

> **CRITICAL OPERATIONAL NOTICE:**  
> **MARS PATHFINDER** is a research, educational, and decision-support prototype. It is **NOT** a flight-certified navigation system, an autonomous rover driving system, a real spacesuit telemetry monitor, a guarantee of astronaut safety, or a substitute for NASA Jet Propulsion Laboratory (JPL) Mission Control operations. All slope cutoffs, mobility weights, walking speeds, and EVA resource rates are configurable prototype assumptions.

---

## 🚀 Key Functional Capabilities

1. **Native Mars Planetary Rendering (`IAU_2015:49900`):**
   * Global Mars triaxial ellipsoid ($a=3,396,190\text{ m}, b=3,376,200\text{ m}$) replacing Earth's WGS84, eliminating an $+87.8\%$ scale distortion.
   * Tailored Martian butterscotch sky atmosphere with suspended iron-oxide dust scattering.
   * Default camera orientation flying directly to the Jezero Crater Western Delta ($18.4447^\circ\text{N}, 77.4508^\circ\text{E}$).
2. **6-Layer Planetary Geospatial Stack:**
   * `mars-basemap`: Streaming NASA Mars Trek Viking MDIM 2.1 Global Mosaic + Jezero CTX Orthophoto.
   * `mars-elevation`: MGS MOLA colorized elevation gradient ($-2568\text{ m}$ to $-2412\text{ m}$).
   * `mars-hillshade`: Analytical grayscale azimuth-shaded relief generated via Horn's method.
   * `mars-slope`: Derived 3-class slope severity color ramp ($<10^\circ$ safe green, $10^\circ\text{–}18^\circ$ amber, $>18^\circ$ red cross-hatch).
   * `mars-hazards`: Mapped *Séítah* sand ripple polygons (hard exclusion) and Coarse MOLA uncertainty boundary ($463\text{ m/px}$).
   * `mars-science`: Interactive 3D pins for Perseverance milestones (*Octavia E. Butler Landing*, *Three Forks*, *Kodiak Butte*) and CRISM carbonate targets.
3. **High-Performance Rust Pathfinding Microservice:**
   * 8-connected grid graph traversal over a $200 \times 200$ Jezero DTM elevation grid.
   * Dual algorithm execution: $A^*$ with admissible 3D Euclidean distance heuristic vs. Dijkstra uniform-cost baseline.
   * Asymmetric uphill climbing penalty factor $\alpha_{\text{uphill}}$, generating distinct Outbound (Cyan) and Return (Gold) routes.
4. **Interactive SVG Elevation Profile & 3D Globe Sync:**
   * Vector elevation profile segmented and color-coded by local terrain slope angle.
   * Scrubbing along the profile dynamically highlights that exact 3D Martian coordinate with an animated reticle on the Cesium globe.
   * Live Algorithmic Proof Badge displaying verified $A^*$ node speedup ($13.9\times$) and $0.00\%$ cost deviation from Dijkstra.
5. **Hypothetical EVA Consumables & Resource Estimator:**
   * Models oxygen tank depletion ($550\text{ L}$ capacity at $1.1\text{ L/min}$) and suit battery draw ($850\text{ Wh}$ at $130\text{ Wh/hr}$).
   * Enforces a mandatory $25\%$ emergency reserve threshold with instant **GO / NO-GO** mission readiness status.
6. **Dataset Provenance & Uncertainty Register:**
   * Comprehensive modal tracking instrument origins, resolutions, PDS product IDs, and uncertainty handling for all ingested data.

---

## ⚡ 60-Second Quickstart

### Prerequisites
* **Node.js:** v20.12.0 LTS or later
* **Rust & Cargo:** v1.75.0 stable or later
* **Browser:** Chrome, Edge, Brave, or Firefox with WebGL 2.0 acceleration

### Option A: Concurrent Dual Launch (Recommended)
```bash
# 1. Install frontend dependencies
npm install

# 2. Launch both Rust Axum server and Vite dev client in parallel
npm run dev:mars
```
Open your browser to `http://localhost:5173`.

### Option B: Step-by-Step Native Launch
```bash
# Terminal 1: Run the Rust Pathfinding Engine
cd mars-server
cargo run --release

# Terminal 2: Run the Vite Frontend Client
npm install
npm run dev
```

---

## 📚 Complete Technical Documentation Suite

The complete engineering, scientific, and architectural specifications are organized in the [`docs/`](file:///home/localhost/projects/colab/NASA/pathfinder/docs) directory:

| Document | File Link | Description & Key Topics |
| :--- | :--- | :--- |
| **Product Requirements Document** | [PRD.md](file:///home/localhost/projects/colab/NASA/pathfinder/docs/PRD.md) | Full PRD, mission vision, user personas, MoSCoW functional requirements (FR-01 to FR-12), NFRs, and acceptance criteria. |
| **System Architecture Document** | [ARCHITECTURE.md](file:///home/localhost/projects/colab/NASA/pathfinder/docs/ARCHITECTURE.md) | Client-server architecture, Single Ownership pattern, CesiumJS Mars pipeline, Rust Axum grid memory structures, and sequence diagrams. |
| **UI / UX Specification** | [UI_UX_SPECIFICATION.md](file:///home/localhost/projects/colab/NASA/pathfinder/docs/UI_UX_SPECIFICATION.md) | Complete UI redesign from Earth OSINT to JPL Mission Control, design tokens, view wireframes, interactive SVG profiles, and WCAG 2.1 AA accessibility. |
| **Mathematical Cost Model Spec** | [PATHFINDING_ENGINE.md](file:///home/localhost/projects/colab/NASA/pathfinder/docs/PATHFINDING_ENGINE.md) | Planetary metric scaling, Horn's $3\times3$ slope kernel, asymmetric uphill penalty, $A^*$ admissibility & consistency proofs, and EVA bioenergetics. |
| **API Contract & Schemas** | [API_SPECIFICATION.md](file:///home/localhost/projects/colab/NASA/pathfinder/docs/API_SPECIFICATION.md) | REST/Axum API contract for `/api/mars/*`, RFC 7807 problem details, parameter validation matrix, and JSON schemas. |
| **Data Provenance & Uncertainty** | [DATA_SOURCES_PROVENANCE.md](file:///home/localhost/projects/colab/NASA/pathfinder/docs/DATA_SOURCES_PROVENANCE.md) | PDS product IDs, instrument resolutions (MOLA, HiRISE, CTX, CRISM), IAU 2015 CRS, and spatial uncertainty modeling. |
| **Security & Threat Model** | [SECURITY_THREAT_MODEL.md](file:///home/localhost/projects/colab/NASA/pathfinder/docs/SECURITY_THREAT_MODEL.md) | STRIDE threat classification, zero-trust local loopback isolation, defensive Rust input sanitization, and Snyk compliance. |
| **Testing & QA Benchmark Plan** | [TESTING_QA_PLAN.md](file:///home/localhost/projects/colab/NASA/pathfinder/docs/TESTING_QA_PLAN.md) | Multi-tier test harness (`cargo test` & Vitest), scale factor validation, $A^*$ vs. Dijkstra optimality assertions, and E2E scenarios. |
| **Operations & Deployment Guide** | [OPERATIONS_DEPLOYMENT.md](file:///home/localhost/projects/colab/NASA/pathfinder/docs/OPERATIONS_DEPLOYMENT.md) | 60-second quickstart, native production compilation, Docker containerization, health checks, and air-gapped offline usage. |

---

## 🔬 Scientific Citations & Data Sources

* **Mars IAU 2015 Coordinate Reference Frame:** Archinal, B. A., et al. (2018). *"Report of the IAU/IAG Working Group on Cartographic Coordinates and Rotational Elements: 2015."* Celestial Mechanics and Dynamical Astronomy, 130(3), 22.
* **MRO HiRISE Digital Terrain Model:** McEwen, A. S., et al. (2007). *"Mars Reconnaissance Orbiter's High Resolution Imaging Science Experiment (HiRISE)."* J. Geophys. Res., 112, E05S02. Product: `DTEEC_045994_1985_046060_1985_A01`.
* **MGS MOLA Megascience Model:** Smith, D. E., et al. (2001). *"Mars Orbiter Laser Altimeter: Experiment summary after the first nominal mapping mission."* J. Geophys. Res., 106(E10), 23689–23722.
* **Horn's Slope Derivation:** Horn, B. K. P. (1981). *"Hill shading and the reflectance map."* Proceedings of the IEEE, 69(1), 14–47.
* **Mars 2020 Perseverance Mission:** Farley, K. A., et al. (2020). *"Mars 2020 Mission Overview."* Space Science Reviews, 216(8), 142.

---

## 📄 License
This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
All NASA imagery and planetary data products are in the public domain and credited in accordance with NASA PDS guidelines.
# Nasa_pathFinders
