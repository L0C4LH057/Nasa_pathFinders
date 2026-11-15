# MARS PATHFINDER — 10-Slide Pitch Deck & Speaker Script
**2026 NASA Space Apps Challenge** | **Team:** Volunteering Team — Kano, Nigeria  
**Live Demo:** `https://salimmasud.github.io/nasa-challenge--MarsMap-2026/`  
**Formats:** 2-Minute Demo Video (`[0:00–2:00]`) & 5-Minute Live Judge Pitch

---

## Slide 1 — Title & Hook
**Headline:** MARS PATHFINDER: Turning NASA Orbital Data into Astronaut Survival  
**Visual Layout Direction:** Full-bleed dark-navy hero slide with a crisp screenshot of our **3D Mars Globe** centered next to the **Jezero Crater** beacon, NASA badge, and team title (*Volunteering Team — Kano, Nigeria*).

**Slide Bullets (≤10 words each):**
- Real-time EVA survival guide for Jezero Crater (`18.38° N, 77.58° E`).
- Built for astronauts walking in pressurized spacesuits on Mars.
- Connects 7 NASA datasets with live A* hazard routing.
- Volunteering Team — Kano, Nigeria | NASA Space Apps 2026.

**Word-for-Word Speaker Script `[0:00–0:12]` (5-min expansion: ~25s):**
> *"Hello judges! We are the Volunteering Team from Kano, Nigeria. When NASA sends astronauts to Mars, looking at a map from orbit isn't enough—they need to survive the walk. Meet **Mars Pathfinder**, our real-time survival and route-planning guide for Jezero Crater."*

---

## Slide 2 — The Problem (The "Last-Mile" Marswalk Gap)
**Headline:** The "Last-Mile" Marswalk Gap  
**Visual Layout Direction:** Split comparison: Left side shows a straight line drawn across a steep crater cliff; Right side lists 4 stark Martian survival constraints (`-62°C`, `748 Pa`, `0.38g`, `Radiation`).

**Slide Bullets (≤10 words each):**
- Mars Trek shows orbital terrain, not human walking survival.
- Straight-line paths cross deadly `>15°` crater cliffs and sand traps.
- `-62°C` cold, near-vacuum, and radiation threaten every step.
- Limited spacesuit oxygen makes wrong turns fatal.

**Word-for-Word Speaker Script `[0:12–0:24]` (5-min expansion: ~30s):**
> *"Existing tools like Mars Trek are built for orbital sightseeing, not for an astronaut walking on the ground. On Mars, a straight line can take you straight off a 30-degree cliff or trap you in loose sand—while your oxygen runs out in `-62°C` cold and near-vacuum."*

---

## Slide 3 — Our Solution
**Headline:** Mars Pathfinder: Interactive 3D-to-2D EVA Survival System  
**Visual Layout Direction:** Wide screenshot of our **2D Jezero EVA Mission Control** dashboard showing the 3-column layout, left NASA layers, center map, and right xEMU PLSS gauges.

**Slide Bullets (≤10 words each):**
- Seamless transition from 360° 3D Mars Globe to 2D map.
- Built specifically for Perseverance's exploration zone in Jezero Crater.
- Computes safest walkable routes, exact walk time, and oxygen burn.
- Includes one-click Solar Storm emergency return routing.

**Word-for-Word Speaker Script `[0:24–0:36]` (5-min expansion: ~30s):**
> *"So we built **Mars Pathfinder**—a tactical survival computer designed specifically for astronauts at Perseverance's landing site in Jezero Crater. It connects a 360-degree 3D Mars globe directly to a 2D surface Mission Control that plans safe walks and monitors spacesuit life support."*

---

## Slide 4 — Live Product Walkthrough (What Judges See on Screen)
**Headline:** Inside Mission Control: 7 NASA Layers & Target Inspector  
**Visual Layout Direction:** Annotated screenshot of our live app highlighting (1) **3D Mars Globe** button, (2) Left **NASA Mission Layers** pill toggles, and (3) Bottom **Terrain & Science Inspector** showing `Magnesium Carbonate` at `Western Delta`.

**Slide Bullets (≤10 words each):**
- Roll Mars 360° infinitely, then zoom into 25 cm HiRISE.
- Toggle 7 NASA layers: cliffs, sand, minerals, weather, contours.
- Click anywhere to inspect CRISM minerals like Magnesium Carbonate.
- Flexible Origin lets astronauts start from any drop-off point.

**Word-for-Word Speaker Script `[0:36–0:50]` (5-min expansion: ~35s):**
> *"Let's look at what's on screen. You can roll our 3D Mars Globe freely 360 degrees in any direction, then zoom into 25-centimeter HiRISE imagery. On the left, astronauts toggle 7 NASA layers—from cliff hazards to biosignature minerals like Magnesium Carbonate—and click anywhere to inspect terrain or set a custom starting point."*

---

## Slide 5 — Smart A\* Hazard-Aware Pathfinding
**Headline:** Smart A\* Routing: Detouring Around Deadly Cliffs & Sand  
**Visual Layout Direction:** Zoomed-in screenshot of the center map showing the **cyan safe A\* route** curving around the red HiRISE cliff wall alongside the dashed red straight-line comparison (`3.05 km`, `+0.5 km` detour, `1h 04m` at `0.38g`).

**Slide Bullets (≤10 words each):**
- 65×65 A* grid blocks impassable `>15°` HiRISE cliff faces.
- Penalizes loose THEMIS sand traps (`5.0x`) and cold shadows.
- Example route: `3.05 km`, `+0.5 km` safety detour, `1h 04m`.
- Live cost sliders let mission planners tune terrain risk.

**Word-for-Word Speaker Script `[0:50–1:04]` (5-min expansion: ~35s):**
> *"Instead of drawing a dangerous straight line, our A\* pathfinder automatically detours around `>15°` HiRISE cliffs and loose THEMIS sand traps. On this real Jezero traverse, it adds a half-kilometer safety detour—`3.05 km` total, taking 1 hour and 4 minutes at Mars `0.38g` gravity—keeping the crew out of danger."*

---

## Slide 6 — Real-Time Spacesuit Life-Support (xEMU PLSS)
**Headline:** Real-Time xEMU PLSS Life-Support & Oxygen Go/No-Go  
**Visual Layout Direction:** Close-up screenshot of the right-hand **Spacesuit Survival HUD** showing the circular **Post-Trip O₂** and **Suit Battery** ring gauges, the **PLSS O₂ Reserve** slider, and the green/red **GO FOR EVA / ABORT** banner.

**Slide Bullets (≤10 words each):**
- Models NASA xEMU PLSS backpack (`530 L / 3,000 psi`).
- Tracks Oxygen Supply, Suit Battery, Radiation, and `4.3 psi` Pressure.
- Computes metabolic O₂ burn (`20.1 kJ/L`) from terrain slope.
- Reserve slider flashes red **ABORT** if round-trip O₂ fails.

**Word-for-Word Speaker Script `[1:04–1:18]` (5-min expansion: ~35s):**
> *"On the right, our xEMU PLSS simulator tracks the astronaut's backpack in real time: Oxygen Supply, Suit Battery, Radiation Dose, and `4.3 psi` Suit Pressure. Using NASA metabolic physics, it calculates exact oxygen burn for the route. If the crew's oxygen reserve is too low for a safe return, it immediately flashes a red ABORT warning."*

---

## Slide 7 — Emergency Response: Solar Storm (SPE) Simulation
**Headline:** One-Click Survival: Solar Storm (SPE) Emergency Reroute  
**Visual Layout Direction:** Screenshot of the **Critical Space Weather Alarm** modal (`+48 mSv/hr`) overlaid on the map with the red emergency A\* return path leading straight back to **Octavia E. Butler Base Camp**.

**Slide Bullets (≤10 words each):**
- Simulates a sudden `+48 mSv/hr` Solar Particle Event.
- Sounds Web Audio alarm and halts scientific sampling immediately.
- Plots fastest cliff-safe return route to Base Camp airlock.
- Updates radiation dose (`mSv`) and crew heart rate live.

**Word-for-Word Speaker Script `[1:18–1:30]` (5-min expansion: ~30s):**
> *"And what if space weather turns deadly? One click on **Solar Storm** simulates a `+48 mSv/hr` Solar Particle Event. The system sounds an alarm, cancels science stops, and automatically plots the fastest cliff-safe A\* route back to the shielded Base Camp airlock."*

---

## Slide 8 — Authentic NASA Data & Scientific Rigor
**Headline:** Grounded in 7 Multi-Mission NASA Datasets & Standards  
**Visual Layout Direction:** Clean 2-column visual matrix pairing mission icons (`MRO HiRISE`, `CRISM`, `THEMIS`, `Mars 2020 MEDA/RAD`, `MOLA`, `NASA-STD-3001`, `xEMU PLSS`) with their exact constants.

**Slide Bullets (≤10 words each):**
- **MRO HiRISE & MOLA:** 25 cm imagery, `>15°` cliffs, 10m contours.
- **THEMIS & CRISM:** Sand traction and Carbonate/Clay biosignatures.
- **Mars 2020 MEDA/RAD:** `-62.4°C` air, `-114.2°C` shadows, `0.24 mSv/day`.
- **NASA-STD-3001 & xEMU:** `0.80 m/s` pace, `293 W`, `20.1 kJ/L` O₂.

**Word-for-Word Speaker Script `[1:30–1:42]` (5-min expansion: ~30s):**
> *"Nothing here is guesswork. Every layer and formula comes from authentic NASA sources: MRO HiRISE and MOLA topography, THEMIS sand inertia, CRISM mineralogy, Perseverance MEDA/RAD weather and radiation, and NASA-STD-3001 spacesuit metabolic standards."*

---

## Slide 9 — Technical Architecture & Stack
**Headline:** Zero-Latency Client-Side Architecture on GitHub Pages  
**Visual Layout Direction:** Clean 4-box flow diagram: **NASA/USGS Data Layer** → **A\* Solver & PLSS Physics Engine (Vanilla JS)** → **Dual Renderer (Leaflet 2D + Three.js 3D)** → **Static GitHub Pages Hosting**.

**Slide Bullets (≤10 words each):**
- 100% client-side HTML5, CSS3, and modular Vanilla JavaScript.
- **Leaflet.js** powers 2D HiRISE tiles and 7 GeoJSON overlays.
- **Three.js** renders 3D Mars with unrestricted 360° Quaternion Ball-Roll.
- Zero backend servers—instant global deployment on GitHub Pages.

**Word-for-Word Speaker Script `[1:42–1:50]` (5-min expansion: ~25s):**
> *"Under the hood, Mars Pathfinder is 100% client-side—built with HTML5, CSS3, Leaflet for 2D mapping, Three.js for our 360-degree globe, and custom JavaScript A\* and life-support engines. Zero servers needed, hosted live on GitHub Pages."*

---

## Slide 10 — Mission Impact & Future Roadmap
**Headline:** Scaling From Jezero Crater to Artemis & Mars  
**Visual Layout Direction:** Clean closing slide with a QR/URL banner (`salimmasud.github.io/nasa-challenge--MarsMap-2026/`), 3 roadmap icons (Artemis Lunar South Pole, Live Rover/Suit Telemetry API, Multi-Astronaut Convoy), and team credit (*Volunteering Team — Kano, Nigeria*).

**Slide Bullets (≤10 words each):**
- Ready to adapt for NASA Artemis lunar South Pole EVAs.
- Roadmap: live suit telemetry feeds and multi-astronaut convoy routing.
- Open-source educational and mission-planning tool for global teams.
- Try live: `salimmasud.github.io/nasa-challenge--MarsMap-2026/`

**Word-for-Word Speaker Script `[1:50–2:00]` (5-min expansion: ~30s):**
> *"Our architecture scales directly to NASA's Artemis lunar South Pole missions and future crewed Marswalks—with next steps for live suit telemetry and multi-astronaut routing. Try our live demo at `salimmasud.github.io/nasa-challenge--MarsMap-2026/`. Thank you!"*
