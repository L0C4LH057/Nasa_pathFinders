# MARS PATHFINDER: Interplanetary Survival Guide
### Jezero Crater EVA Tactical Survival & Route Planning Dossier (ARES-V)
**2026 NASA Space Apps Challenge** | **Location:** Jezero Crater (`18.38° N, 77.58° E`) | **Live Architecture:** Client-Side Web App (GitHub Pages Ready)

---

## 1. Executive Summary & Elevator Pitch

### 30-Second Elevator Pitch (For Quick Introductions)
> *"NASA's Mars Trek lets you look at Mars from orbit—but it doesn't tell an astronaut walking on the surface whether they will survive the walk. **Mars Pathfinder** is an interactive EVA survival and route-planning system for **Jezero Crater**. It combines 7 real NASA orbital and rover datasets—from 25 cm HiRISE imagery and steep cliff maps to Perseverance weather and radiation sensors—with an obstacle-avoiding **A\* pathfinder** and a real **NASA xEMU spacesuit life-support simulator**. Instead of drawing a straight line over a deadly cliff, Mars Pathfinder plots the safest walkable route, tells the astronaut exactly how much oxygen, battery, and radiation dose it will cost, and automatically reroutes them back to shelter if a Solar Storm hits."*

### 2-Minute Presentation Pitch (For Judges & Demos)
> *"When humans land in Jezero Crater, they won't just need a pretty map—they'll need a real-time tactical survival computer. Existing planetary portals like Mars Trek are built for orbital sightseeing, not for an astronaut wearing a pressurized spacesuit in 38% Earth gravity, `-62°C` cold, and `748 Pa` near-vacuum.*
>
> *Our project, **Mars Pathfinder (ARES-V)**, bridges that gap in two seamlessly connected views:*
> 1. *First, a **3D Mars Globe** that you can roll freely 360° in any direction like a real planet in your hand, showing major Martian landmarks and Jezero Crater.*
> 2. *Second, **2D Jezero EVA Mission Control**, overlaid with **7 NASA scientific layers**: HiRISE cliff hazards (`>15°–20°`), THEMIS loose sand traps, CRISM biosignature minerals, MEDA cryogenic cold shadows (`-114.2°C`), Perseverance's actual rover path, science targets, and 10-meter elevation contours.*
>
> *Here is why it matters: if an astronaut wants to walk from Base Camp—or from any rover drop-off point on the map—to a science site like Kodiak Butte or the Carbonate Margin, our **A\* Hazard-Aware Pathfinder** automatically detours around impassable cliffs and sand traps. At the same time, our **xEMU PLSS Life-Support Engine** calculates exact walk time at NASA's `0.80 m/s` Martian pace, metabolic oxygen consumption in liters and kilograms (`20.1 kJ/L O₂`), battery heater drain, and radiation dose (`mSv`). If the astronaut's current oxygen tank isn't enough for a safe round-trip, the system flashes an immediate **ABORT** warning. And if a **Solar Particle Event (SPE)** strikes, one click triggers an emergency return protocol directly back to Base Camp airlock."*

### Why Existing Global Maps Aren't Enough for a Marswalk
| Limitation of Standard Orbital Maps (e.g., Mars Trek) | How Mars Pathfinder Solves It |
|---|---|
| Designed for static viewing, not human traversal | Runs a live **65×65 hazard-aware A\* grid** over Jezero Crater |
| Shows straight-line distance only | Calculates **true Mars-ellipsoid detour distance**, slope, and climb |
| No spacesuit oxygen, battery, or radiation modeling | Integrates **NASA xEMU PLSS** (`530 L / 3,000 psi`) & **NASA-STD-3001** physics |
| Fixed view without emergency response | Includes **Solar Storm (SPE)** automated emergency return-to-airlock routing |

---

## 2. Plain-English Walkthrough of Every Screen Feature (For Presenters)

### A. 3D Mars Globe vs. 2D Jezero EVA Mission Control
- **3D Mars Globe (`js/mars-globe.js`):** Click **`3D MARS GLOBE`** in the top bar (or zoom all the way out of the 2D map) to view the full 3D ellipsoid planet. You can drag and roll Mars **360° infinitely in any direction**—over the North Pole, South Pole, and around the far side—just like rolling a ball in your hand. Zooming in on Jezero Crater smoothly transitions into the 2D surface map.
- **2D Jezero EVA Mission Control (`index.html`, `js/app.js`):** Built on NASA's **25 cm/pixel HiRISE** orbital mosaic of Jezero Crater. We chose Jezero Crater because it is the real landing site of **NASA's Perseverance Rover (Mars 2020)** and contains 6 mission-critical landmarks:
  1. **Octavia E. Butler Landing (Base Camp)** (`18.4447° N, 77.4508° E`, `-2,570 m`): Habitat airlock, PLSS oxygen umbilical, and radiation shelter.
  2. **Western Delta Front (Kodiak Butte)** (`18.4280° N, 77.4050° E`, `-2,515 m`): Ancient river delta sandstone layers preserving potential biosignatures.
  3. **Neretva Vallis Inflow Channel** (`18.5150° N, 77.3480° E`, `-2,460 m`): Ancient megaflood river valley breaching Jezero's western rim.
  4. **Carbonate Margin ('Margin Unit')** (`18.4820° N, 77.4050° E`, `-2,490 m`): Shoreline magnesium carbonate (`MgCO₃`) deposits—prime astrobiology target.
  5. **Séítah Dune & Boulder Field** (`18.4320° N, 77.4410° E`, `-2,580 m`): Olivine-rich bedrock surrounded by loose sand ripples (high slip/sink risk).
  6. **Belva Impact Crater Rim** (`18.4680° N, 77.3820° E`, `-2,480 m`): 1-km impact crater exposing deep subsurface rock layers.

### B. The 7 Layered NASA Datasets (Left Sidebar — Pill Toggles & Opacity Sliders)
1. **Red — Slope & Cliff Hazards (`>15°–20°`) | *MRO / HiRISE DTM*:** Highlights steep delta scarps and crater walls (`28°–35°`) where a spacesuit-wearing astronaut risks a fatal fall.
2. **Orange — Thermal Inertia & Sand Traps | *Mars Odyssey / THEMIS*:** Identifies loose, powdery aeolian sand dunes where boots lose traction, increasing walking effort and slip hazard (`5.0x` cost penalty by default).
3. **Teal — Mineralogy & Biosignatures | *MRO / CRISM MTR3*:** Maps scientifically valuable rock units—smectite clays, magnesium carbonates, and olivine—so astronauts know *where* to sample.
4. **Purple — Cold Shadows & GCR Radiation | *Mars 2020 / MEDA & RAD*:** Marks permanently/deeply shadowed zones (`-114.2°C`) that drain suit heaters `+35%` faster, plus exposed high-radiation ridges.
5. **Gold — Perseverance Ground-Truth Path | *Mars 2020 / Rover Nav*:** Shows the actual path driven by NASA's Perseverance rover from Sol 0 to Sol 1324 as a real-world ground-truth reference.
6. **Cyan — Base Camp & Science Targets | *NASA / Jezero Targets*:** Interactive pins for all 6 Jezero sites; clicking any pin lets you set it as **Origin** or **Destination**.
7. **Blue — Topographic 10m Contours | *MGS / MOLA + HiRISE*:** Elevation contour lines showing terrain steepness at a glance.

### C. Smart A\* Obstacle-Avoidance Routing & Flexible Origin
- **No Dangerous Straight Lines:** Instead of connecting Point A to Point B with a naive straight line, our **A\* Pathfinder (`js/pathfinding.js`)** divides the Jezero exploration sector into a **65×65 grid** and evaluates every step's slope, sand trap risk, and cold-shadow exposure. If a steep cliff blocks the direct path, it plots a safe detour (shown in cyan) alongside a dashed red straight-line comparison so judges can *visually see* the hazard being avoided.
- **Flexible Starting Point (Not Fixed to Base Camp):** Using **`Click: Target`** vs **`Click: Origin`** (or the **`⇄` Swap** button), presenters can drop the astronaut anywhere on Jezero Crater—simulating a rover drop-off, a multi-stop traverse, or an emergency return trip back to Base Camp.
- **Live Cost Tuning (`⚙` Button):** Presenters can adjust `Slope Penalty (k)`, `Sand Trap Penalty`, and `Cold Shadow Penalty` in real time to watch the A\* route adapt on screen.

### D. Spacesuit Life-Support Simulator (xEMU PLSS) & Solar Storm (SPE) Mode
- **What is the PLSS?** The **Portable Life Support System** is the astronaut's life-support backpack on NASA's **xEMU** suit. Our model (`js/telemetry.js`) tracks:
  - **Oxygen Supply (`L`, `kg`, `psi`, `%`):** Based on a `530 L` (`0.757 kg`) high-pressure tank at `3,000 psi` feeding a `4.3 psi` pure-oxygen suit loop. The **Current PLSS O₂ Reserve** slider (`10%–100%`) lets you test whether an astronaut mid-EVA has enough oxygen to reach a destination and return (`GO FOR EVA` green, `ONE-WAY ONLY` amber, or `ABORT: O₂ INSUFFICIENT` red).
  - **Suit Battery (`%`):** Models `185 W` nominal heater/avionics drain (`+35%` in cryogenic cold shadow zones).
  - **Walk Time & Distance:** Sums Mars-ellipsoid Haversine distances (`R = 3,389.5 km`) divided by NASA's `0.80 m/s` (`2.88 km/h`) Mars `0.38g` pressurized suit pace, slowed on slopes `> 4°`.
  - **Cumulative Radiation (`mSv`):** Tracks Galactic Cosmic Ray (GCR) exposure (`0.032 mSv/km` baseline against a `50.0 mSv` EVA limit).
- **Solar Storm (SPE) Mode:** Clicking **`SOLAR STORM (SPE)`** simulates a `+48 mSv/hr` Solar Particle Event detected by Perseverance's MEDA/RAD sensors, triggers an emergency alarm modal, and executes an automated A\* return route straight to **Octavia Base Camp Airlock**.

---

## 3. Complete Technology Stack, Languages & Architecture

| Layer | Technology / File | Why It Was Chosen |
|---|---|---|
| **Markup & Layout** | HTML5 (`index.html`) | Clean semantic 3-column Mission Control dashboard, zero build step |
| **Styling & Design** | CSS3 (`css/style.css`), `Inter` & `JetBrains Mono` fonts | `100vh` uncluttered dark-navy aerospace HUD, `12px` cards, SVG ring gauges |
| **Core Logic** | Vanilla ES6 JavaScript (`js/app.js`) | Fast, dependency-light orchestration of map, globe, routing, and HUD |
| **2D Mapping Engine** | **Leaflet.js v1.9.4** | Lightweight, smooth pan/zoom over NASA HiRISE 25 cm tiles & GeoJSON layers |
| **3D Globe Engine** | **Three.js r128** (`js/mars-globe.js`) | Hardware-accelerated 3D Mars ellipsoid with custom **Quaternion Ball-Roll** (zero pole lock) |
| **Pathfinding Engine** | Custom **A\* Grid Solver** (`js/pathfinding.js`) | Real-time `65×65` hazard-aware routing with tunable slope/sand/thermal penalties |
| **Life-Support Physics** | Custom **xEMU PLSS Model** (`js/telemetry.js`) | Implements NASA-STD-3001 metabolic wattage, `20.1 kJ/L` O₂ burn, and `mSv` dose |
| **Tactical Audio** | **Web Audio API** (`js/audio.js`) | Procedural UI clicks, route-plotted chimes, and SPE alarms with zero external audio files |
| **Hosting** | **Static Web / GitHub Pages** | 100% client-side (`index.html` + relative `css/` & `js/` paths); works anywhere with no backend |

---

## 4. Official NASA Data Sources & Scientific Provenance

| Dataset / Standard | Mission / Document | Exact Values / Usage in App |
|---|---|---|
| **Optical Basemap (25 cm/px)** | **MRO / HiRISE** (`USGS Astrogeology WMS`) | Jezero Crater high-resolution surface mosaic |
| **Slope & Cliff Hazards** | **MRO / HiRISE DTM** (`ESP_037130_1985`) & **MGS MOLA** | `28°–35°` Western Delta scarp walls & `10 m` elevation contours |
| **Sand Traps & Traction** | **Mars Odyssey / THEMIS** | Thermal inertia mapping of loose aeolian dunes (`Séítah` & ripple fields) |
| **Mineralogy & Biosignatures** | **MRO / CRISM MTR3** | Smectite clays, Mg-carbonates (`MgCO₃`), olivine cumulates, impact breccia |
| **Weather, Temp & Pressure** | **Mars 2020 / MEDA** (Sol 1324 snapshot) | `-62.4°C` air temp, `-114.2°C` cryo shadow, `748 Pa` pressure, `tau = 0.58` |
| **Radiation Environment** | **Mars 2020 / MEDA & RAD** | `0.24 mSv/day` GCR baseline; `+48.0 mSv/hr` Solar Particle Event (SPE) |
| **Rover Ground Truth** | **Mars 2020 / Perseverance Nav** | Sol 0–1324 traverse polyline across Octavia Butler Landing to Delta |
| **Spacesuit Backpack (PLSS)** | **NASA/TM-20205008709 (xEMU PLSS)** | `8.0 hr` EVA, `530 L` (`0.757 kg`) O₂ tank at `3,000 psi`, `4.3 psi` (`29.6 kPa`) loop |
| **Metabolic Rate & O₂** | **NASA-STD-3001 Vol. 1 & 2 / HIDH** | `293 W` (`1,000 BTU/hr`) nominal load, `20.1 kJ/L O₂` conversion, HR & CO₂ limits |
| **Mars Walking Speed** | **NASA EVA ConOps / MKIII & xEMU Analog** | `0.80 m/s` (`2.88 km/h`) nominal `0.38g` pressurized suit traverse + slope penalty |

---

## 5. Alignment With NASA's 5 Judging Criteria & Global Awards

1. **Impact:** Solves a genuine human-exploration bottleneck—turning raw orbital science into a real-time astronaut survival decision tool (preventing fatal cliff falls, sand entrapment, and oxygen depletion).
2. **Creativity:** Combines an unrestricted **360° Quaternion Ball-Roll 3D Mars Globe** with a **2D tactical HiRISE Mission Control** and an interactive **PLSS Oxygen Go/No-Go Simulator** in a zero-backend web app.
3. **Validity:** Grounded in authentic NASA constants (`NASA-STD-3001`, `NASA/TM-20205008709`, `MEDA Sol 1324`, `HiRISE/CRISM/THEMIS`) with transparent formulas accessible directly in the UI (`How It's Calculated`).
4. **Relevance:** Directly addresses the **2026 NASA Space Apps Challenge** Martian survival & mapping theme using NASA's actual Perseverance landing sector in Jezero Crater.
5. **Presentation:** Clean, uncluttered dark-navy aerospace dashboard (`Inter` typography, color-coded pill toggles, circular SVG PLSS gauges, and one-click **Solar Storm** emergency demonstration).

**Global Award Talking Points:**
- **Best Use of Data:** Synthesizes **7 distinct NASA/USGS/ESA data modalities** into one unified spatial cost grid rather than displaying disconnected static layers.
- **Best Use of Science:** Couples geological target selection (astrobiology biosignatures) directly with human physiology (`20.1 kJ/L` metabolic O₂, `0.38g` biomechanics, and `mSv` radiation dosimetry).
- **Galactic Impact:** Built as an accessible, open-source browser tool that educates students and mission planners alike on what it truly takes to survive a walk on Mars.

---

## 6. Anticipated Judge Q&A Cheat Sheet (For Non-Technical Presenters)

1. **Q: Why can't astronauts just use NASA's Mars Trek?**
   > *"Mars Trek is an orbital map—it shows you what Mars looks like, not whether you can survive walking there. Mars Pathfinder adds hazard-aware A\* routing around steep cliffs and sand traps, plus real spacesuit oxygen, battery, and radiation calculations."*

2. **Q: How do you calculate the oxygen and walk time? Are those numbers made up?**
   > *"No—every number comes from NASA engineering standards. We use NASA's `0.80 m/s` (`2.88 km/h`) pressurized suit pace for Martian gravity (`0.38g`), `NASA-STD-3001` metabolic rates (`293 W` nominal at `20.1 kJ/L O₂`), and the `xEMU PLSS` backpack capacity (`530 L / 0.757 kg` at `3,000 psi`)."*

3. **Q: What happens if an astronaut is already low on oxygen mid-walk?**
   > *"Our **Current PLSS O₂ Reserve** slider simulates any starting oxygen level. If the route requires more oxygen than the astronaut has left, the status immediately switches to **ABORT: O₂ INSUFFICIENT** in red so they don't attempt an unsurvivable walk."*

4. **Q: Why do you have both a 3D Globe and a 2D Map?**
   > *"The 3D Mars Globe gives planetary context—you can roll Mars freely 360° in any direction and see major landmarks like Olympus Mons and Valles Marineris—then zoom into Jezero Crater for crisp 25 cm/pixel 2D tactical pathfinding."*

5. **Q: Does the astronaut always have to start at Base Camp?**
   > *"No! Using **Click: Origin** or the **Swap** button, you can place the astronaut anywhere on Jezero Crater—such as a rover drop-off point—and plan a traverse to another science site or back to Base Camp."*

6. **Q: What does the Solar Storm (SPE) button demonstrate?**
   > *"It simulates a `+48 mSv/hr` Solar Particle Event detected by Perseverance's MEDA/RAD sensors. The system sounds an alarm, aborts science sampling, and plots the fastest cliff-safe A\* route back to the shielded Base Camp airlock."*

7. **Q: What happens if the terrain is too steep or sandy?**
   > *"Cliffs steeper than `15°–20°` are marked impassable in our A\* grid, and loose THEMIS sand dunes carry a `5.0x` cost penalty. You can even tune these penalties live with the `⚙` Cost Tuning sliders and watch the route reroute."*

8. **Q: Does this require heavy servers or expensive software to run?**
   > *"No—it runs 100% in any modern web browser using open web standards (HTML5, JavaScript, Leaflet, Three.js) and can be hosted for free on GitHub Pages."*
