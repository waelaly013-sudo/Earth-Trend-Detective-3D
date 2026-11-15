# NASA Earth Trend Detective 3D — Full Architecture, User Story & End-to-End User Flow

## 1. Executive Summary & Product Vision
**NASA Earth Trend Detective 3D** is an interactive, browser-based 4D planetary science platform designed for researchers, educators, students, and agro-ecological observers. It provides zero-lag WebGL visualization of 40 years of planetary data (2000–2040), combining empirical NASA satellite observations with predictive CMIP6 SSP2-4.5 AI climate modeling and ground-truth human observer field reports.

---

## 2. Complete System Architecture

### 2.1 Multi-Layered Architecture Diagram
```
+-----------------------------------------------------------------------------------+
|                           CLIENT PRESENTATION TIER                                |
|  +-------------------------------------+  +------------------------------------+  |
|  |     Three.js WebGL 3D Canvas        |  |        React 19 UI & Modals        |  |
|  |  • Hologram Shell Custom Shaders    |  |  • Onboarding Walkthrough           |  |
|  |  • Dynamic Thermal Ripple Shaders   |  |  • Architecture & User Flow Modal  |  |
|  |  • Procedural Albedo / Cloud Maps   |  |  • Sidebar Telemetry Inspector     |  |
|  |  • 60 FPS OrbitControls & Raycaster |  |  • Timeline & 4D Simulation Dock   |  |
|  +-------------------------------------+  +------------------------------------+  |
+------------------------------------------+----------------------------------------+
                                           |
                                           v
+-----------------------------------------------------------------------------------+
|                       STATE & REACTIVITY ORCHESTRATION                            |
|  +-----------------------------------------------------------------------------+  |
|  |  • AuthContext State Machine (User, Mode, Branch, Persistence)              |  |
|  |  • Anomaly Detection Engine (Timeline Milestone Alerts)                    |  |
|  |  • Decoupled Animation Loop (Zero-lag GLSL Uniforms on Timeline Scrubbing) |  |
|  +-----------------------------------------------------------------------------+  |
+------------------------------------------+----------------------------------------+
                                           |
                                           v
+-----------------------------------------------------------------------------------+
|                        DATA & SATELLITE TELEMETRY TIER                            |
|  +---------------------------+  +---------------------------+  +---------------+  |
|  | 2000–2026 Historical      |  | 2027–2040 AI Predictions  |  | Human Ground  |  |
|  | • NASA GISTEMP v4 / MERRA |  | • CMIP6 Ensemble SSP2-4.5 |  | Truth Reports |  |
|  | • MODIS Surface Temps     |  | • Albedo Feedback Loops   |  | • 2022-2026   |  |
|  | • HadISST Sea Surface     |  | • Non-linear Soil Drying  |  | Verified Field|  |
|  +---------------------------+  +---------------------------+  +---------------+  |
+------------------------------------------+----------------------------------------+
                                           |
                                           v
+-----------------------------------------------------------------------------------+
|                        STORAGE & MULTIMODAL INTEGRATIONS                          |
|  • LocalStorage Isolated Security Partitions (User Profile, Field Notes, Saved)  |
|  • Web Speech API (Real-Time Vocalized Climate Telemetry Briefing)                 |
|  • Web Audio API (Procedural Synthesizer Sound Engine for SFX & Alerts)           |
|  • Gemini AI Copilot (Grounded with Google Maps Geospatial Landmark Pinpointing)  |
+-----------------------------------------------------------------------------------+
```

### 2.2 Technical Component Breakdown
1. **WebGL 3D Core (`src/components/EarthGlobe.tsx`)**:
   - Built on Three.js `0.186.x`.
   - Custom `HologramShellShader` calculating cosine scanlines and Fresnel cyan rim radiance.
   - Dynamic vertex displacement shaders generating localized heatwave ripples around inspected coordinates when temperature anomaly breaches +1.5°C.
   - Spherical coordinate raycaster translating screen mouse coordinates `(x, y)` to `(lat, lng)` with sub-degree precision.

2. **Temporal 4D Engine (`src/components/TimelineControlDock.tsx`)**:
   - Scrubbing latency < 16ms achieved by updating GLSL shader uniform floats directly rather than rebuilding meshes or geometries.
   - 40-year timeline: 2000–2026 (Historical NASA observations) and 2027–2040 (AI forward projections).
   - 12-month seasonal orbital cycle updating polar ice extents and monsoons.

3. **Data Branches (`src/types/climate.ts`)**:
   - **Temperature Branch**: Surface thermal departures (°C) relative to 1951-1980 baseline.
   - **Humidity Branch**: Relative humidity departures (RH%) and wet-bulb thresholds.
   - **Wind Circulation Branch**: Kinetic vector velocities (m/s) showing jet stream shifts and low-level jets.

4. **Adaptive Complexity Engine (`src/types/user.ts`)**:
   - **Simple Mode**: B1 plain language with visual metaphors (e.g., "5 blankets added to Earth").
   - **Normal Mode**: Standard anomalies, decadal rates, and trendlines.
   - **Complicated Mode**: Full radiative forcing calculations ($W/m^2$), p-values, standard deviations, and CMIP6 scenario parameters.

---

## 3. Agile User Stories & Acceptance Criteria

### Persona 1: Dr. Elena Rostova (Senior Cryosphere Scientist)
* **User Story**: "As a climate scientist, I want to scrub the timeline between 2000 and 2040 in the Arctic Sea Ice hotspot and view radiative forcing calculations, so that I can quantify polar amplification thresholds for peer-reviewed academic publications."
* **Acceptance Criteria**:
  1. Hotspot selection focuses camera on Arctic coordinates $(78.2^\circ N, 15.6^\circ E)$ with smooth interpolation.
  2. Complicated mode reveals $W/m^2$ radiative forcing and confidence intervals.
  3. Ability to export a Space Apps Certified Briefing Report with complete mathematical citations.

### Persona 2: Samuel Green (Environmental Studies Student)
* **User Story**: "As an environmental science student, I want to be guided by an interactive onboarding walkthrough and toggle Simple Mode, so that I can understand complex global warming trends through visual metaphors without being overwhelmed by dense jargon."
* **Acceptance Criteria**:
  1. On first login, the Onboarding Walkthrough component automatically launches and explains globe controls and timeline scrubbing.
  2. Simple Mode translates scientific anomalies into intuitive visual analogies.
  3. The Listen button vocalizes monthly climate shifts aloud with clear speech synthesis.

### Persona 3: Maria Santos (Agro-Ecologist & Field Observer)
* **User Story**: "As an agro-forestry specialist, I want to cross-reference satellite humidity and wind telemetry with 2022-2026 human field reports, so that I can advise local farmers on drought resilience and wet-bulb heat thresholds."
* **Acceptance Criteria**:
  1. User can switch easily between Temperature, Humidity, and Wind Circulation data branches.
  2. Inspect verified human field reports from 2022–2026 and save personal notes in the Field Notebook.
  3. Access the Visual Farm Simulator to preview projected crop stress under differing SSP scenarios.

---

## 4. End-to-End User Flow (Start to End)

```
[Start: App First Launch]
           │
           ▼
[Step 1: Authentication Gateway]
  • User enters Email/Password OR clicks 1-Click Demo Persona (Scientist, Student, Farmer) OR Guest.
  • Selects preferred Data Complexity Mode (Simple, Normal, Complicated).
           │
           ▼ (Login Success)
[Step 2: Onboarding Walkthrough Triggered]
  • 6-Step interactive guided orientation:
    - Step 1: Detective Welcome & Mission Objective.
    - Step 2: 3D Globe Navigation (Orbit, Pan, Zoom, Coordinate Picking).
    - Step 3: Timeline & 4D Simulation (Year 2000-2040, Months, Play/Pause).
    - Step 4: Data Layers (Branches: Temp, Humidity, Wind; Heatmaps; Hotspots).
    - Step 5: Ground-Truth Field Reports (2022-2026) & AI Copilot.
    - Step 6: Full Architecture & Flow Map Overview.
           │
           ▼ (Complete or Dismiss)
[Step 3: Planetary Exploration]
  • User navigates 3D Globe with orbit controls.
  • Clicks any country, hotspot, or custom latitude/longitude coordinate.
           │
           ▼
[Step 4: 4D Temporal Scrubbing]
  • User adjusts year slider (2000–2040) or starts continuous 4D playback.
  • Critical Anomaly Radar fires toast alerts on historical records.
  • User clicks "Listen" for spoken audio briefing.
           │
           ▼
[Step 5: Telemetry Inspection & Physical Drivers]
  • Sidebar Data Panel opens with historical charts and decadal rates.
  • Climate Drivers modal details physical mechanics (albedo, jet streams).
           │
           ▼
[Step 6: Field Reports & Personal Notebook]
  • User cross-references satellite data with real human field records (2022–2026).
  • Records timestamped hypotheses in the Field Research Notebook.
           │
           ▼
[Step 7: AI Copilot & Google Maps Grounding]
  • User queries the AI Climate Copilot.
  • Copilot pinpoints landmarks and flies 3D camera to requested regions.
           │
           ▼
[Step 8: Synthesis & Report Export]
  • User generates a NASA Space Apps Certified Briefing Report.
  • Session state, bookmarks, and notes are securely synced to user profile.
[End: Session Complete]
```
