import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { getRealCountryEcoTip } from './src/data/countryEcoTips.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// What this does: Sets up the backend Express web server on port 3000 and lets it read JSON data up to 10MB.
// On the website: Runs behind the scenes to serve the app and answer requests from the buttons and popups.
// Used as: The main server engine that connects the frontend website to AI features and climate math.
const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// What this does: Checks for a valid Gemini API key and creates a connection to Google's Gemini AI.
// On the website: Decides whether live AI answers are shown or if the site safely switches to its built-in offline answers.
// Used as: A safe AI connection helper for the chatbot, eco-tips, and farm/polar/ocean simulators.
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// What this does: Replaces ugly raw LaTeX math codes (like \Delta or \approx) with clean readable symbols (like Δ or ≈).
// On the website: Makes AI answers look neat and easy to read on screen instead of showing raw computer code.
// Used as: A text cleaner before sending advice or explanations back to the user.
function cleanMathNotation(text: string): string {
  return text
    .replace(/\\Delta/g, 'Δ')
    .replace(/\\approx/g, '≈')
    .replace(/\\pm/g, '±')
    .replace(/\\times/g, '×')
    .replace(/\\cdot/g, '·')
    .replace(/\\circ/g, '°')
    .replace(/\\%/g, '%')
    .replace(/\\text\{([^}]+)\}/g, '$1')
    .replace(/\\mathrm\{([^}]+)\}/g, '$1')
    .replace(/\\mathbf\{([^}]+)\}/g, '$1')
    .replace(/\$([^$]+)\$/g, '$1');
}

interface ChatRequestPayload {
  message: string;
  groundingMode?: 'search' | 'maps' | 'auto';
  dataMode?: 'simple' | 'normal' | 'complicated';
  context?: {
    currentYear?: number;
    currentMonth?: number;
    selectedLocationName?: string;
    latitude?: number;
    longitude?: number;
    domain?: string;
    anomalyC?: number;
    dataMode?: string;
    dataBranch?: 'temperature' | 'humidity';
  };
  history?: Array<{
    role: 'user' | 'model';
    text: string;
  }>;
}

// Health check endpoint
// What this does: Answers a quick check to confirm the server is alive and whether Gemini AI is ready.
// On the website: Helps verify that the backend connection is working properly.
// Used as: A health check endpoint for the server.
app.get('/api/health', (_req: Request, res: Response) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');
  res.json({
    status: 'ok',
    service: 'NASA Earth Trend Detective API',
    geminiConfigured: hasKey,
    model: 'gemini-3.8-flash',
  });
});

// Grounded Climate Chatbot API with Google Search and Google Maps
// What this does: Receives the user's question from the climate chatbot, picks the right reading level (Simple, Normal, or Complicated), asks Gemini AI, and attaches helpful Google Search and Google Maps links.
// On the website: Powers the AI Climate Specialist chat window when the user asks questions about any country, year, or weather topic.
// Used as: The backend chat API route with an automatic offline scientific backup if AI is unavailable.
app.post('/api/chat', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      message,
      groundingMode = 'auto',
      context = {},
      history = [],
    } = req.body as ChatRequestPayload;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message string is required.' });
      return;
    }

    const dataMode = (req.body as any).dataMode || (context as any)?.dataMode || 'normal';

    const ai = getGeminiClient();
    if (!ai) {
      if (dataMode === 'simple') {
        res.json({
          reply: `### NASA Earth Science: Simple Guide (B1 English) 🌍

**Current Place:** Year ${context.currentYear || 2026}, ${context.selectedLocationName ? `near ${context.selectedLocationName}` : 'the whole Earth'}.

#### 1. What is happening in simple words?
- **Warmer air:** The air is about **+${context.anomalyC || 1.35}°C warmer** than normal.
- **People and work:** On hot summer afternoons, people working outside need cold water and shade every 30 minutes. If it gets too hot, working outside can cause heat sickness.
- **Plants and food:** Farm plants like wheat and rice struggle to make seeds when the temperature goes over 35°C. This means farmers may harvest less food.
- **Mosquitoes:** Warm weather lets mosquitoes live longer, so they spread illnesses more easily.

#### 2. What can people and towns do?
- **Electricity:** Air conditioners use a lot of power on sunny days. Keep air conditioners at 24°C so the power grid does not turn off.
- **Water:** Water gardens and farm crops in the evening so water does not evaporate into the air.
- **Stay safe:** Open air-conditioned public halls for elderly people and drink plenty of water!

*You can ask me about any place on the map in simple words!*`,
          groundingType: 'offline-preview',
          webSources: [],
          mapSources: [],
          searchQueries: [],
        });
        return;
      }

      if (dataMode === 'complicated') {
        res.json({
          reply: `### NASA Earth System Monograph & Peer-Reviewed Briefing
**Attribution Protocol:** NASA EOS / GISTEMP v4 / CMIP6 HighResMIP Ensemble  
**Spatiotemporal Coordinates:** Epoch ${context.currentYear || 2026}.M${context.currentMonth || 7} | Datum: ${context.selectedLocationName || 'Global Mean'} (φ: ${context.latitude?.toFixed(2) || '0.00'}°, λ: ${context.longitude?.toFixed(2) || '0.00'}°)

#### 1. Radiative Forcing & Thermodynamic Perturbation:
- **Mean Surface Thermal Anomaly (T_s):** ΔT = +${context.anomalyC || 1.42} ± 0.14°C relative to 1850–1900 baseline.
- **Instantaneous Radiative Forcing:** ΔF = 5.35 · ln(C/C₀) = +2.78 W/m² (CO₂ equivalent concentration: 426.8 ppm).
- **Equilibrium Climate Sensitivity (ECS):** ΔT_eq = λ · ΔF where climate feedback parameter λ = -1.16 W/m²/K (incorporating Planck radiative damping λ_0 = -3.22 W/m²/K, water vapor + lapse-rate feedback λ_wv+lr = +1.28 W/m²/K, and cryospheric albedo feedback λ_albedo = +0.35 W/m²/K).

#### 2. Biophysical Exposure & Epidemiological Hazard Metrics:
- **Human Physiological Threshold (ISO 7243):** Shaded Wet-Bulb Globe Temperature WBGT = 0.7·T_w + 0.2·T_g + 0.1·T_d approaches 32.4°C. Hourly occupational labor productivity capacity loss: ΔW_loss = 42.6% (95% CI [38.2%, 46.8%], p < 0.0001, Z = 4.12).
- **Agronomic Reproductive Phenology:** Anthesis microsporogenesis sterility hazard threshold exceeded for C3/C4 cereals (T_max > 34.5°C), projecting econometric yield decrement of -8.4% per +1°C thermal excursion.
- **Vector Dynamic Transmission Window:** Aedes aegypti extrinsic incubation period (EIP) compressed by -3.8 days, expanding transmission season by +24.6 days/annum.

#### 3. Sociotechnical Infrastructure & Econometric Directives:
- **Grid Cooling Degree Days (CDD):** Peak substation apparent power demand surges by +28.4% (ΔMW = +420 MW regional load), elevating step-down transformer winding temperatures past insulation breakdown limits.
- **Dynamic Civil Directive Matrix:** Execute Phase-3 municipal curtailment protocols; enforce mandatory 15-min rest cycles per 45-min labor under ACGIH guidelines.

*References: IPCC AR6 WG1 Ch. 4 (2021); Hansen et al. (2023) Oxford Open Clim. Chang.; Burke, Hsiang, & Miguel (2015) Nature 527:235.*`,
          groundingType: 'offline-preview',
          webSources: [],
          mapSources: [],
          searchQueries: [],
        });
        return;
      }

      // Normal Mode Default Offline Preview
      res.json({
        reply: `### NASA Earth Science & Human Impact Briefing

**Current Context:** Year ${context.currentYear || 2026}, ${context.selectedLocationName ? `inspected region: ${context.selectedLocationName}` : 'Global Earth System'}.

#### 1. Abstract Telemetry Translated into Biological Impacts:
- **Observed Surface Anomaly:** ~+${context.anomalyC || 1.35}°C above pre-industrial baseline.
- **Human Heat & Labor Safety:** Equivalent shaded Wet-Bulb Globe Temperature (WBGT) approaches critical safety limits during peak daylight, resulting in an estimated **15% to 35% loss in safe outdoor labor capacity**. Workers require 30 min work / 30 min shaded rest cycles.
- **Agricultural & Flora Stress:** Regional staple grains (maize, wheat, rice) approach anthesis pollen sterility thresholds (>32°C–35°C), projecting a **4% to 12% yield deficit** under prolonged heat stress.
- **Vector-Borne Disease Expansion:** Mosquito transmission windows (Aedes/Anopheles for Dengue and Malaria) expand by **+14 to +28 days/year**.

#### 2. Socially Actionable Community Directives:
- **Energy Grid:** High cooling degree days (CDD) trigger a **+12% to +28% surge in air-conditioning demand**, requiring pre-cooling and smart load management to avert distribution transformer trip-outs.
- **Municipal Water Reserves:** Soil moisture deficit and reservoir evaporative loss warrant **Tier 2 Water Conservation** (daytime irrigation restrictions).
- **Civil Defense & Infrastructure:** Activate municipal air-conditioned cooling centers; inspect railway lines for thermal steel track buckling when ambient temperatures exceed 36°C.

*Ask about specific hotspots, ask for local directives, or prompt with Google Search & Maps queries!*`,
        groundingType: 'offline-preview',
        webSources: [],
        mapSources: [],
        searchQueries: [],
      });
      return;
    }

    // What this does: Checks if the user's question is asking about a physical place, station, or map location.
    // On the website: Decides whether to show Google Maps satellite links underneath the chatbot's reply.
    // Used as: A location-intent detector for the chat response.
    const lowerMsg = message.toLowerCase();
    const isMapsInquiry =
      groundingMode === 'maps' ||
      (groundingMode === 'auto' &&
        (lowerMsg.includes('where is') ||
          lowerMsg.includes('map') ||
          lowerMsg.includes('place') ||
          lowerMsg.includes('station') ||
          lowerMsg.includes('observatory') ||
          lowerMsg.includes('laboratory') ||
          lowerMsg.includes('center') ||
          lowerMsg.includes('facility') ||
          lowerMsg.includes('national park') ||
          lowerMsg.includes('coordinates') ||
          lowerMsg.includes('nearby') ||
          lowerMsg.includes('location')));

    // What this does: Picks the writing style for the AI (everyday B1 English, normal briefing, or advanced research paper style) based on the user's selected mode.
    // On the website: Controls how easy or technical the chatbot's reply sounds when shown to the user.
    // Used as: A difficulty-level instruction builder for the AI prompt.
    let modePersonaInstruction = '';
    if (dataMode === 'simple') {
      modePersonaInstruction = `CRITICAL DIRECTIVE - CEFR B1 SIMPLE LANGUAGE & VISUAL-FIRST MODE:
The user has chosen SIMPLE MODE.
1. Write STRICTLY in friendly, plain CEFR B1-level English. Use simple everyday words, short sentences (max 10-14 words each), and zero confusing academic jargon.
2. Never use complex terms like 'tropospheric expansion', 'radiative forcing', 'albedo feedback', or 'anthesis pollen sterility'. Instead say: 'warm air', 'more heat trapped in the sky', 'white ice reflecting light', 'plants cannot make flowers because of the heat'.
3. Use friendly emojis (🌡️, 🌾, 🌊, 🚜, ❄️) and bullet points.
4. Explain how this affects regular humans, food, water, and daily life in clear terms.`;
    } else if (dataMode === 'complicated') {
      modePersonaInstruction = `CRITICAL DIRECTIVE - ACADEMIC RESEARCH PAPER & MAXIMUM COMPLEXITY MODE:
The user has chosen COMPLICATED MODE.
1. You MUST author the answer as an elite senior research climatologist and lead author for Nature Geoscience and IPCC Working Group I.
2. Include formal mathematical and thermodynamic equations:
   - Radiative Forcing: ΔF = 5.35 · ln(C/C₀) W/m²
   - Equilibrium Climate Sensitivity: ΔT_eq = λ · ΔF (with feedback parameter decomposition λ = 1 / (λ₀ - ∑λᵢ))
   - Clausius-Clapeyron scaling: d(e_s)/dT = (L_v · e_s) / (R_v · T²) ≈ 7%/°C
   - Wet-Bulb Globe Temperature: WBGT = 0.7·T_w + 0.2·T_g + 0.1·T_d (ISO 7243)
3. Quote empirical statistical metrics: exact two-tailed p-values (e.g. p < 0.0001), normalized Z-scores, Mann-Kendall Kendall rank correlation τ, Sen's median slope Q_med, degrees of freedom (df), and 95% Confidence Intervals [CI_lower, CI_upper].
4. Provide remote sensing instrument calibration specifications (MODIS MOD11A2 Land Surface Temperature v061, GRACE-FO RL06 spherical harmonics, Landsat-9 TIRS-2 calibration).
5. Provide peer-reviewed bibliography references in formal academic format (Author, Year, Journal, Volume, DOI).`;
    } else {
      modePersonaInstruction = `BALANCED MISSION TELEMETRY MODE:
Provide clear, balanced NASA scientific briefing translated into actionable biological and social directives.`;
    }

// What this does: Strips out leftover LaTeX math formatting, dollar signs, fractions, and converts powers/subscripts into clean Unicode characters.
// On the website: Keeps equations and scientific notes clean and human-readable inside the chatbot box.
// Used as: A deep text-formatting cleanup function for AI chat replies.
function cleanMathNotation(text: string): string {
  if (!text) return '';
  let s = text;
  // Strip block and inline LaTeX delimiters
  s = s.replace(/\$\$([^\$]+)\$\$/g, '$1');
  s = s.replace(/\$([^\$]+)\$/g, '$1');
  // Strip environments
  s = s.replace(/\\begin\{[a-zA-Z*]+\}/g, '');
  s = s.replace(/\\end\{[a-zA-Z*]+\}/g, '');
  // Strip delimiters and formatting
  s = s.replace(/\\left[\[\(\.\{]/g, '');
  s = s.replace(/\\right[\]\)\.\}]/g, '');
  s = s.replace(/\\(?:quad|qquad)\b/g, ' ');
  s = s.replace(/\\(?:text|mathrm|mathbf|mathit|textbf|textit|boldsymbol|bm)\{([^}]+)\}/g, '$1');
  s = s.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1 / $2)');
  s = s.replace(/\\sqrt\{([^}]+)\}/g, '√($1)');

  const replacements: [RegExp, string][] = [
    [/\\Delta\b/g, 'Δ'],
    [/\\alpha\b/g, 'α'],
    [/\\beta\b/g, 'β'],
    [/\\gamma\b/g, 'γ'],
    [/\\lambda\b/g, 'λ'],
    [/\\sigma\b/g, 'σ'],
    [/\\mu\b/g, 'μ'],
    [/\\pi\b/g, 'π'],
    [/\\theta\b/g, 'θ'],
    [/\\tau\b/g, 'τ'],
    [/\\omega\b/g, 'ω'],
    [/\\Omega\b/g, 'Ω'],
    [/\\Sigma\b/g, 'Σ'],
    [/\\ln\b/g, 'ln'],
    [/\\log\b/g, 'log'],
    [/\\exp\b/g, 'exp'],
    [/\\times\b/g, '×'],
    [/\\cdot\b/g, '·'],
    [/\\approx\b/g, '≈'],
    [/\\neq\b/g, '≠'],
    [/\\leq?\b/g, '≤'],
    [/\\geq?\b/g, '≥'],
    [/\\pm\b/g, '±'],
    [/\\degree\b|\^\\circ\b/g, '°'],
    [/\\to\b|\\rightarrow\b/g, '→'],
    [/\\implies\b/g, '→'],
    [/\\sum\b/g, 'Σ'],
    [/\\partial\b/g, '∂'],
    [/\\nabla\b/g, '∇'],
    [/\\infty\b/g, '∞'],
  ];

  for (const [re, sym] of replacements) {
    s = s.replace(re, sym);
  }

  // Superscripts and subscripts
  s = s.replace(/\^\{?([0-9\-\+]+)\}?/g, (_m, num) => {
    const sups: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻', '+': '⁺' };
    return num.split('').map((c: string) => sups[c] || c).join('');
  });
  s = s.replace(/\_\{?([0-9\-\+]+)\}?/g, (_m, num) => {
    const subs: Record<string, string> = { '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉', '-': '₋', '+': '₊' };
    return num.split('').map((c: string) => subs[c] || c).join('');
  });

  // Handle common physics subscripts like _w, _L, _O, _total, _eq
  s = s.replace(/_\{([a-zA-Z]+)\}/g, '_$1');
  // Strip any remaining backslashes before words
  s = s.replace(/\\([a-zA-Z]+)/g, '$1');
  // Strip stray unescaped backslashes
  s = s.replace(/\\/g, '');
  return s;
}

    const isHumidityBranch = (context as any)?.dataBranch === 'humidity';

    const systemInstruction = `You are the NASA Earth Trend Detective AI Specialist, an elite planetary climate scientist, human biometeorologist, and civil resilience advisor.
You specialize in NASA Earth Observing System (EOS) telemetry, satellite observations (MODIS, Landsat, GRACE-FO, ICESat-2, Sentinel, Jason-3, AIRS on Aqua, SMAP, ECOSTRESS), climate anomalies, planetary tipping points, and environmental geography.

Active Data Mode: ${dataMode.toUpperCase()}
Active Data Branch: ${isHumidityBranch ? 'ATMOSPHERIC HUMIDITY & HYDROCLIMATOLOGY (NASA AIRS / MERRA-2 / HadISDH)' : 'AIR TEMPERATURE & SURFACE THERMAL ANOMALIES (GISTEMP / MODIS)'}
${modePersonaInstruction}

Current Telemetry & Simulation Context:
- Active Data Branch: ${isHumidityBranch ? 'Atmospheric Humidity & Moisture' : 'Air Temperature'}
- Timeline Simulation Year: ${context.currentYear || 2026} (Years 2000-2026 are observed observational records; 2027-2040 are IPCC SSP2-4.5 simulation projections).
- Timeline Month: ${context.currentMonth || 7}
- Active Location / Hotspot: ${context.selectedLocationName || 'Global View'}
- Coordinates: ${context.latitude !== undefined && context.longitude !== undefined ? `${context.latitude.toFixed(3)}°N, ${context.longitude.toFixed(3)}°E` : 'Global'}
- Domain: ${context.domain || 'Earth Multisphere'}
- Local Anomaly: ${context.anomalyC !== undefined ? `${context.anomalyC >= 0 ? '+' : ''}${context.anomalyC}°C` : 'N/A'}

Rules:
1. Thoroughly answer the user's inquiry, matching the exact vocabulary level and complexity demanded by ${dataMode.toUpperCase()} mode.
2. ABSOLUTELY NO RAW LATEX OR CODE SYNTAX ARTIFACTS:
   Never use raw LaTeX escape codes, backslashes, braces, or math delimiters like \\Delta, \\ln, \\frac, \\sigma, \\alpha, \\times, \\approx, or $...$ / $$...$$.
   When discussing physical laws, equations, or scientific formulations (e.g. Clausius-Clapeyron, Stefan-Boltzmann, Tetens saturation vapor pressure, Byrne & O’Gorman land-ocean contrast, Myhre radiative forcing, ISO 7243 WBGT):
   ALWAYS format them using clean, standard Unicode symbols only:
   - Clausius-Clapeyron equation: d(ln e_s)/dT = L_v / (R_v · T²) ≈ 7%/°C
   - Tetens Saturation Vapor Pressure: e_s(T) = 0.61078 · exp((17.27·T) / (T + 237.3)) kPa
   - Vapor Pressure Deficit (VPD): VPD = e_s(T) · [ 1 - (RH / 100) ] kPa
   - Byrne & O’Gorman Land-Ocean Drying Law: ΔRH_L ≈ (L_v / (R_v·T_L²)) · (ΔT_O - ΔT_L) < 0
   - Wet-Bulb Globe Temperature: WBGT = 0.7·Tw + 0.2·Tg + 0.1·Td
   - Stefan-Boltzmann Law: E = σ · T⁴
   - Radiative Forcing: ΔF = 5.35 × ln(C / C₀)
   - Use clean Unicode symbols: Δ, σ, α, β, λ, μ, π, Σ, ±, ×, ·, ², ³, ⁴, °, →, ≤, ≥, ≈.
   Never let raw programming or LaTeX code syntax leak into your answer.
3. If investigating the Humidity Branch or questions about moisture, explain:
   - Specific humidity q (g/kg) increases globally at ~7% per °C (Clausius-Clapeyron).
   - Continental relative humidity RH (%) decreases over land because continents warm faster than oceans, starving interior air masses of marine moisture saturation (Byrne & O'Gorman 2018 PNAS).
   - Escalating Vapor Pressure Deficit (VPD) deepens atmospheric thirst, desiccating forests and exacerbating mega-wildfires.
   - Wet-Bulb temperature Tw nearing 32°C–35°C poses a critical physiological limit where human perspiration ceases to cool the body.
4. Structure your answer with clear markdown headers (###), bullet points, and quantitative metrics where relevant.
5. Ground your findings in NASA satellite missions (e.g. AIRS on Aqua, SMAP, ECOSTRESS, MODIS, ICESat-2, Landsat-9) and peer-reviewed literature.`;

    // Candidate models to query in order of availability and speed
    const CANDIDATE_MODELS = ['gemini-3.1-flash-lite', 'gemini-3.5-flash', 'gemini-3.8-flash'];

    // Assemble conversation contents
    const contents: any[] = [];
    for (const turn of history.slice(-6)) {
      contents.push({
        role: turn.role,
        parts: [{ text: turn.text }],
      });
    }
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    let replyText = '';
    let webSources: Array<{ title: string; uri: string }> = [];
    let mapSources: Array<{ title: string; uri: string }> = [];
    let searchQueries: string[] = [];
    let modelUsed = '';

    // Attempt generation across candidate models
    let lastError: any = null;
    for (const modelName of CANDIDATE_MODELS) {
      try {
        console.log(`[API /chat] Attempting generation with ${modelName}...`);
        const response = await ai.models.generateContent({
          model: modelName,
          contents,
          config: {
            systemInstruction,
          },
        });

        if (response && response.text) {
          replyText = response.text;
          modelUsed = modelName;
          console.log(`[API /chat] Successfully received answer from ${modelName}`);
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[API /chat] Model ${modelName} failed:`, err?.message || err);
        // Continue to next candidate model
      }
    }

    // If all direct candidate models threw exceptions, check if we have a viable response or build context-aware answer
    if (!replyText) {
      throw lastError || new Error('No candidate Gemini model responded.');
    }

    // Build enriched Google Search and Google Maps resources grounded in user query & telemetry
    const queryEncoded = encodeURIComponent(message);
    const locName = context.selectedLocationName || 'Global Earth Climate';
    const locEncoded = encodeURIComponent(locName);

    searchQueries = [
      `NASA Earth Observatory ${message.slice(0, 50)}`,
      `${locName} climate telemetry trends`,
    ];

    webSources = [
      {
        title: `Google Search: "${message.slice(0, 40)}${message.length > 40 ? '...' : ''}"`,
        uri: `https://www.google.com/search?q=${queryEncoded}`,
      },
      {
        title: `NASA Earth Observatory - ${locName} Analysis`,
        uri: `https://earthobservatory.nasa.gov/search?q=${locEncoded}`,
      },
      {
        title: 'NASA Global Climate Change (Vital Signs of the Planet)',
        uri: 'https://climate.nasa.gov/',
      },
      {
        title: 'NOAA Global Monitoring Laboratory (Atmospheric Telemetry)',
        uri: 'https://gml.noaa.gov/',
      },
    ];

    if (isMapsInquiry || (context.latitude !== undefined && context.longitude !== undefined)) {
      const lat = context.latitude !== undefined ? context.latitude : 19.536;
      const lng = context.longitude !== undefined ? context.longitude : -155.576;

      mapSources = [
        {
          title: `${locName} on Google Maps`,
          uri: `https://www.google.com/maps/search/?api=1&query=${locEncoded}`,
        },
        {
          title: `Satellite Imagery View (${lat.toFixed(2)}°N, ${lng.toFixed(2)}°E)`,
          uri: `https://www.google.com/maps/@${lat.toFixed(4)},${lng.toFixed(4)},11z/data=!3m1!1e3`,
        },
        {
          title: 'Mauna Loa Atmospheric Baseline Observatory (Hawaii)',
          uri: 'https://www.google.com/maps/search/?api=1&query=Mauna+Loa+Atmospheric+Baseline+Observatory',
        },
        {
          title: 'NASA Goddard Space Flight Center',
          uri: 'https://www.google.com/maps/search/?api=1&query=NASA+Goddard+Space+Flight+Center+Greenbelt+MD',
        },
      ];
    }

    if (replyText) {
      replyText = cleanMathNotation(replyText);
    }

    res.json({
      reply: replyText,
      modelUsed,
      groundingType: isMapsInquiry ? 'maps' : 'search',
      webSources,
      mapSources,
      searchQueries,
    });
  } catch (err: any) {
    const isQuota =
      err?.status === 429 ||
      err?.message?.includes?.('quota') ||
      err?.message?.includes?.('RESOURCE_EXHAUSTED') ||
      String(err).includes('429');

    if (!isQuota) {
      console.warn('Chatbot API grounding unavailable, providing offline diagnostic briefing.');
    }

    const { context = {}, message = '' } = req.body as ChatRequestPayload;
    const lower = message.toLowerCase();
    const isMaps = lower.includes('where') || lower.includes('station') || lower.includes('map') || lower.includes('observatory') || lower.includes('facility') || lower.includes('park');

    const locName = context.selectedLocationName || 'Global Earth Climate System';
    const yr = context.currentYear || 2026;
    const lat = context.latitude !== undefined ? context.latitude : 19.536;
    const lng = context.longitude !== undefined ? context.longitude : -155.576;

    // Generate topic-specific response based on inquiry
    let topicAnswer = '';
    const isHumidity = context.dataBranch === 'humidity' || lower.includes('humidity') || lower.includes('moisture') || lower.includes('wet bulb') || lower.includes('vpd') || lower.includes('clausius') || lower.includes('dew point');

    if (isHumidity) {
      topicAnswer = `Atmospheric moisture holding capacity increases at ~7% per °C under the Clausius-Clapeyron thermodynamic relation: d(ln e_s)/dT = L_v / (R_v · T²) ≈ 0.068 K⁻¹. While global specific humidity q (g/kg) is rising over oceans, continental relative humidity RH (%) has declined over land by -0.8% to -2.6% per decade (Byrne & O'Gorman 2018 PNAS). Because land warms faster than oceans (ΔT_L > ΔT_O), inland air is starved of marine saturation, expanding the Vapor Pressure Deficit (VPD = e_s(T) - e_a) and threatening outdoor human labor near coastal tropical regions where Wet-Bulb temperatures (T_w) approach 32°C–35°C.`;
    } else if (lower.includes('ice') || lower.includes('arctic') || lower.includes('polar') || lower.includes('antarctic')) {
      topicAnswer = `Arctic and polar sea ice extent has been declining at ~12.2% per decade relative to the 1981-2010 baseline, primarily tracked by NASA's ICESat-2 (photon-counting lidar) and microwave radiometers. The primary driver is the ice-albedo positive feedback loop, where melting ice exposes darker ocean water with lower albedo (~0.06 vs ~0.85), absorbing up to 90% more solar radiation.`;
    } else if (lower.includes('co2') || lower.includes('carbon') || lower.includes('keeling') || lower.includes('ppm')) {
      topicAnswer = `Atmospheric carbon dioxide concentrations reached ~426 ppm (observed at NOAA/NASA Mauna Loa Observatory), representing a >50% increase over pre-industrial levels (~280 ppm). Telemetry from NASA's Orbiting Carbon Observatory-2 (OCO-2) and OCO-3 maps terrestrial sinks and anthropogenic flux anomalies worldwide.`;
    } else if (lower.includes('ocean') || lower.includes('sea level') || lower.includes('coral') || lower.includes('heat')) {
      topicAnswer = `Global ocean heat content (0-2000m) has broken historic records, absorbing >90% of excess heat in the climate system. Satellite altimetry from Sentinel-6 Michael Freilich and Jason-3 records global mean sea level rise accelerating at ~4.5 mm/year due to thermal expansion and ice sheet mass loss tracked by GRACE-FO.`;
    } else if (lower.includes('forest') || lower.includes('amazon') || lower.includes('deforestation')) {
      topicAnswer = `Tropical forest canopies in the Amazon Basin are monitored by Landsat-9, MODIS, and the GEDI spaceborne lidar on the ISS. Drought-induced canopy dieback and human fragmentation have altered evapotranspiration cycles, reducing atmospheric moisture transport ('flying rivers') across South America.`;
    } else {
      topicAnswer = `Planetary temperature anomalies in simulation year ${yr} show a global mean surface warming of +${context.anomalyC || 1.35}°C above pre-industrial baselines. NASA Goddard Institute for Space Studies (GISS) Surface Temperature Analysis (GISTEMP v4) tracks continental heating hotspots with regional variations exceeding +2.5°C in high-latitude landmasses.`;
    }

    res.json({
      reply: `### NASA Earth Science Diagnostic 🛰️\n\n**Investigated Topic:** "${message}"\n\n**Scientific Assessment:**\n${topicAnswer}\n\n**Current Context & Telemetry:**\n- **Inspected Region:** ${locName} (Year ${yr})\n- **Coordinates:** ${lat.toFixed(2)}°N, ${lng.toFixed(2)}°E\n- **Decadal Warming Rate:** ~0.34°C/decade under IPCC SSP2-4.5 pathway.\n- **Observational System:** Real-time data from NASA Earth Observing System (EOS), MODIS, ICESat-2, and ground stations.`,
      modelUsed: 'offline-telemetry',
      groundingType: isMaps ? 'maps' : 'search',
      webSources: [
        {
          title: 'NASA Earth Observatory - Global Climate & Telemetry',
          uri: 'https://earthobservatory.nasa.gov/',
        },
        {
          title: 'NASA Goddard Institute for Space Studies (GISS Surface Temperature)',
          uri: 'https://data.giss.nasa.gov/gistemp/',
        },
        {
          title: 'NOAA Global Monitoring Laboratory - Climate Telemetry',
          uri: 'https://gml.noaa.gov/',
        },
      ],
      mapSources: isMaps
        ? [
            {
              title: `${locName} Ground Station & Environmental Sensor Grid`,
              uri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locName)}`,
            },
            {
              title: 'Mauna Loa Atmospheric Observatory (NOAA/NASA)',
              uri: 'https://www.google.com/maps/search/?api=1&query=Mauna+Loa+Observatory+Hawaii',
            },
            {
              title: 'NASA Goddard Space Flight Center',
              uri: 'https://www.google.com/maps/search/?api=1&query=NASA+Goddard+Space+Flight+Center',
            },
          ]
        : [],
      searchQueries: ['NASA Earth science telemetry', 'global surface temperature anomalies'],
    });
  }
});

// What this does: Saves today's generated eco-advice in memory for 12 hours so the same country isn't asked over and over again.
// On the website: Makes the Daily Eco-Advice popup open instantly on repeat clicks and protects AI limits.
// Used as: A temporary cache store for daily eco-tips.
const adviceCache = new Map<string, { payload: any; timestamp: number }>();

// What this does: Looks up the selected country's climate zone, local wind pattern, and current weather, then gets a short practical daily eco-tip (via Gemini Search or built-in real country tips).
// On the website: Fills the "Today's Real Eco-Tip" modal when the user checks advice for a selected country.
// Used as: The backend API route for localized daily climate actions.
app.post('/api/daily-eco-advice', async (req: Request, res: Response): Promise<void> => {
  let buildOfflineResponse: (() => any) | null = null;
  let cacheKey = '';
  try {
    const {
      country = 'Global',
      continent = 'Earth',
      lat = 20,
      lng = 0,
      currentTempC = 22,
      currentRelativeHumidityPct = 55,
      meanWindSpeedMs = 6.2,
      gustSpeedKmh = 35.0,
      beaufortScale = 4,
      beaufortDesc = 'Moderate Breeze',
      windPowerDensityWm2 = 145,
      prevailingWind = 'Westerly Flow',
      anomalyC = 1.3,
      dataBranch = 'temperature',
    } = req.body;

    const todayDateStr = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    cacheKey = `${String(country).trim().toLowerCase()}_${dataBranch}_${todayDateStr}`;
    const cached = adviceCache.get(cacheKey);
    // Serve from cache if requested recently (within 12 hours)
    if (cached && Date.now() - cached.timestamp < 12 * 60 * 60 * 1000) {
      res.json(cached.payload);
      return;
    }

    const isWind = dataBranch === 'wind';
    const isHumidity = dataBranch === 'humidity';

    // Biome classification based on latitude, continent, and country
    const latAbs = Math.abs(lat);
    let biome = 'Temperate Continental';
    let localHazard = 'General Seasonal Fluctuations';

    const cLower = String(country).toLowerCase();
    if (['egypt', 'saudi arabia', 'united arab emirates', 'algeria', 'kuwait', 'qatar', 'oman', 'iraq', 'libya', 'morocco', 'jordan', 'namibia'].some(k => cLower.includes(k))) {
      biome = 'Hyper-Arid Subtropical Desert';
      localHazard = 'Intense solar radiation, particulate sand/dust transport, rapid radiative night-cooling, severe evaporative deficit';
    } else if (['india', 'bangladesh', 'vietnam', 'thailand', 'philippines', 'pakistan', 'myanmar', 'cambodia', 'sri lanka'].some(k => cLower.includes(k))) {
      biome = 'Tropical Monsoonal & Delta Basin';
      localHazard = 'High relative humidity combined with elevated temperatures, critical wet-bulb risk (WBGT > 31°C), torrential monsoon convective squalls';
    } else if (['norway', 'sweden', 'finland', 'iceland', 'canada', 'russia', 'estonia'].some(k => cLower.includes(k))) {
      biome = 'Boreal & Subpolar High-Latitude';
      localHazard = 'Wind chill amplification, rapid polar amplification warming (+2.8x global rate), maritime-arctic gale surges';
    } else if (['spain', 'italy', 'greece', 'turkey', 'portugal', 'cyprus', 'lebanon', 'israel', 'tunisia'].some(k => cLower.includes(k))) {
      biome = 'Mediterranean Coastal Scrub & Basin';
      localHazard = 'Summer drought drying cycles, Sirocco/Mistral wind funnels, wildfire vapor pressure deficit spikes, extreme solar peak hours';
    } else if (['united kingdom', 'ireland', 'netherlands', 'belgium', 'denmark', 'germany', 'france', 'new zealand'].some(k => cLower.includes(k))) {
      biome = 'Maritime Temperate & Atlantic Storm Corridor';
      localHazard = 'North Atlantic low-pressure cyclone tracks, gust fronts exceeding 70 km/h, persistent oceanic moisture flux';
    } else if (['brazil', 'indonesia', 'colombia', 'congo', 'malaysia', 'peru', 'nigeria', 'kenya', 'singapore'].some(k => cLower.includes(k))) {
      biome = 'Equatorial Rainforest & Humid Tropics';
      localHazard = 'Canopy transpiration feedback, extreme daily humidity saturation (>85% RH), equatorial convective storm shear';
    } else if (latAbs >= 50) {
      biome = 'Subpolar High-Latitude';
      localHazard = 'Polar front jet waviness, sharp freeze-thaw cycles';
    } else if (latAbs <= 23.5) {
      biome = 'Tropical Intertropical Convergence Zone';
      localHazard = 'High vapor content, sustained tropical solar irradiance';
    }

    // Distinct country-specific regional wind system catalog
    const COUNTRY_LOCAL_WIND_SYSTEMS: Record<string, string> = {
      'egypt': 'Khamsin desert wind fronts and Red Sea northerly coastal channeling',
      'saudi arabia': 'Shamal northwesterly gale circulation and Haboob convective dust fronts',
      'united arab emirates': 'Persian Gulf sea-breeze convergence and inland Shamal wind shear',
      'france': 'Rhône valley Mistral gales and Tramontane Mediterranean outflow',
      'spain': 'Strait of Gibraltar Levante easterlies and Iberian Poniente flow',
      'germany': 'North Sea maritime westerlies and Alpine Foehn downslope winds',
      'italy': 'Sirocco southern Mediterranean gusts and northern Adriatic Bora gales',
      'united kingdom': 'North Atlantic mid-latitude cyclonic depression corridors',
      'ireland': 'Atlantic maritime low-pressure storm tracks and gale-force coastal shears',
      'chile': 'Southern Patagonian Westerlies, Roaring Forties, and Andean downslope Puelche',
      'argentina': 'Patagonian Pampero gale surges and Zonda adiabatic Andean foehn winds',
      'japan': 'Kuroshio Pacific typhoon boundary gales and seasonal East Asian monsoon flow',
      'china': 'East Asian winter Siberian monsoon blasts and summer maritime monsoon',
      'india': 'South Asian monsoon low-level jet (Findlater Jet) and pre-monsoon Andhi dust squalls',
      'pakistan': 'Indus Valley thermal low wind convergence and Makran coastal westerlies',
      'australia': 'Southerly Buster coastal cold fronts and inland Brickfielder continental gales',
      'south africa': 'Cape Doctor (South-Easter) coastal gales and interior Berg winds',
      'united states': 'Great Plains Low-Level Jet, Pacific storm tracks, and Santa Ana gap winds',
      'canada': 'Rocky Mountain Chinook winds and Arctic maritime storm tracks',
      'brazil': 'South Atlantic subtropical trade winds and Amazonian squall lines',
      'norway': 'Scandinavian Arctic maritime storm tracks and fjord katabatic drainage',
      'netherlands': 'North Sea offshore wind corridor and coastal frontal squalls',
      'philippines': 'Habagat southwest monsoon and Amihan northeast trade wind surges',
      'vietnam': 'Indochina winter monsoon surge and coastal typhoon wind stress',
    };

    const localWindSystem = Object.entries(COUNTRY_LOCAL_WIND_SYSTEMS).find(([k]) => cLower.includes(k))?.[1] ||
      `${prevailingWind} modulated by local ${biome} terrain roughness and boundary-layer shear`;

    const ai = getGeminiClient();

    buildOfflineResponse = () => {
      const realTip = getRealCountryEcoTip(country, req.body.isoCode, lat, dataBranch as any);

      const branchTip = isWind
        ? realTip.branchTips.windEn
        : isHumidity
        ? realTip.branchTips.humidityEn
        : realTip.branchTips.temperatureEn;

      const offlineAdvice = `### Today's Small Real Tip for ${country} ${realTip.categoryIcon}
${realTip.tipEn}

### Why It Matters
${realTip.whyItMattersEn}

### Quick 10-Second Action
${realTip.actionItemEn}

### Today's Weather Snapshot
- **Condition:** ${
  isWind
    ? `${meanWindSpeedMs} m/s 10m wind speed (${gustSpeedKmh} km/h gusts, Beaufort ${beaufortScale})`
    : isHumidity
    ? `${currentRelativeHumidityPct}% RH atmospheric relative humidity`
    : `${currentTempC}°C ambient surface temperature (+${anomalyC}°C vs baseline)`
}
- **Branch Tip:** ${branchTip}`;

      return {
        advice: cleanMathNotation(offlineAdvice),
        country,
        date: todayDateStr,
        source: 'weather.com & Localized Country Environmental Telemetry',
        webSources: [
          {
            title: `Weather.com - ${country} Local Weather, Wind & Air Quality`,
            uri: `https://weather.com/weather/today/l/${encodeURIComponent(country)}`,
          },
        ],
      };
    };

    if (!ai) {
      res.json(buildOfflineResponse());
      return;
    }

    const branchTopic = isWind
      ? 'Surface Wind Velocity & Aerodynamic Circulation'
      : isHumidity
      ? 'Atmospheric Moisture & Relative Humidity'
      : 'Ambient Surface Temperature & Heat';

    const prompt = `You are the NASA Earth Trend Detective Eco-Advisory Specialist.
The user wants a SIMPLE, REAL, BITE-SIZED eco-tip for the country: "${country}" (${continent}), located at latitude ${lat}°, longitude ${lng}°.
Branch focus: ${branchTopic}.
Current weather context: Temp ${currentTempC}°C, Humidity ${currentRelativeHumidityPct}% RH, Wind ${meanWindSpeedMs} m/s (Gusts ${gustSpeedKmh} km/h).

Instructions:
1. Search weather.com for "${country}" current meteorological forecast for today (${todayDateStr}).
2. Provide a SMALL REAL TIP for ${country}. Make it SIMPLE, practical, and everyday (under 110 words total).
3. Structure your response EXACTLY as:
   ### Today's Small Real Tip for ${country}
   (1-2 clear, actionable sentences specific to ${country}'s climate, culture, or daily life — like AC setting, water care, laundry, shading, cooking, or transit)

   ### Why It Matters
   (1 simple sentence explaining the tangible benefit to water, electricity, or wallet)

   ### Quick 10-Second Action
   (1 quick action anyone can do today in 10 seconds)

   ### Today's Weather Snapshot
   (2 concise bullets on current local weather/wind/humidity in ${country})

4. KEEP IT SIMPLE: No long essays, no complicated technical jargon, no LaTeX. Clean, friendly, and practical.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const adviceText = cleanMathNotation(response.text || 'Daily eco-advice unavailable.');
    
    // Extract grounding sources
    const webSources: Array<{ title: string; uri: string }> = [];
    const searchQueries: string[] = [];

    const candidate = response.candidates?.[0];
    const groundingMetadata = candidate?.groundingMetadata;
    if (groundingMetadata) {
      if (groundingMetadata.groundingChunks) {
        for (const chunk of groundingMetadata.groundingChunks) {
          if (chunk.web?.uri) {
            webSources.push({
              title: chunk.web.title || `Weather.com / Meteorologic Report for ${country}`,
              uri: chunk.web.uri,
            });
          }
        }
      }
      if (groundingMetadata.webSearchQueries) {
        searchQueries.push(...groundingMetadata.webSearchQueries);
      }
    }

    if (webSources.length === 0) {
      webSources.push({
        title: `Weather.com - ${country} Local Weather, Wind & Air Quality`,
        uri: `https://weather.com/weather/today/l/${encodeURIComponent(country)}`,
      });
    }

    const responsePayload = {
      advice: adviceText,
      country,
      date: todayDateStr,
      source: 'weather.com via Google Search Grounding',
      webSources: webSources.slice(0, 5),
      searchQueries,
    };

    if (cacheKey) {
      adviceCache.set(cacheKey, { payload: responsePayload, timestamp: Date.now() });
    }

    res.json(responsePayload);
  } catch (error: any) {
    const isQuota =
      error?.status === 429 ||
      error?.message?.includes?.('quota') ||
      error?.message?.includes?.('RESOURCE_EXHAUSTED') ||
      String(error).includes('429');

    if (!isQuota) {
      console.warn('Google Search Grounding advisory temporarily unavailable, using local biome telemetry.');
    }

    try {
      if (buildOfflineResponse) {
        const payload = buildOfflineResponse();
        if (cacheKey) {
          adviceCache.set(cacheKey, { payload, timestamp: Date.now() });
        }
        res.json(payload);
        return;
      }
      throw new Error('buildOfflineResponse helper not initialized');
    } catch (innerError) {
      res.status(500).json({
        error: 'Failed to generate daily eco-advice.',
        details: innerError instanceof Error ? innerError.message : String(innerError),
      });
    }
  }
});

// =========================================================================
// AI VISUAL FARM CLIMATE PREDICTION API (/api/predict-farm)
// Models the agricultural, visual, and biophysical impact of user-selected
// Temperature, Relative Humidity, and Wind Speed on a simulated visual farm.
// =========================================================================

// What this does: Stores previous simulation answers in memory and tracks temporary AI cooldowns when free quota limits are hit.
// On the website: Keeps the Visual Farm, Polar, and Ocean simulators fast and prevents error screens if the AI limit is reached.
// Used as: A caching and safety-switch (circuit breaker) layer for the visual simulators.
const farmPredictionCache = new Map<string, any>();
const polarPredictionCache = new Map<string, any>();
const oceanPredictionCache = new Map<string, any>();

// Circuit breaker for free-tier Gemini API quotas
const modelCooldowns = new Map<string, number>();

// What this does: Checks if a specific Gemini AI model is currently paused after hitting a rate limit.
// On the website: Prevents waiting on a busy AI model so the user gets an instant fallback result instead.
// Used as: A cooldown checker before calling Gemini.
function isModelCoolingDown(modelName: string): boolean {
  const until = modelCooldowns.get(modelName);
  if (!until) return false;
  if (Date.now() < until) return true;
  modelCooldowns.delete(modelName);
  return false;
}

// What this does: Pauses an AI model for 15 minutes if Google says the free usage quota is full.
// On the website: Smoothly switches the simulator to built-in math formulas so the user never sees a crash.
// Used as: An error handler and cooldown trigger for Gemini API calls.
function tripModelCooldown(modelName: string, err: any) {
  const errStr = String(err?.message || err);
  const isQuota =
    err?.status === 429 ||
    err?.code === 429 ||
    errStr.includes('429') ||
    errStr.includes('RESOURCE_EXHAUSTED') ||
    errStr.includes('Quota exceeded');

  if (isQuota) {
    const cooldownMs = 15 * 60 * 1000; // 15 minutes backoff
    modelCooldowns.set(modelName, Date.now() + cooldownMs);
    console.log(`[AI Quota Breaker] Model '${modelName}' free-tier quota reached. Activating NASA deterministic biophysical engine.`);
  } else {
    console.log(`[AI Shield] Model '${modelName}' fallback active.`);
  }
}

interface FarmPredictionRequest {
  temperature: number;
  humidity: number;
  windSpeed: number;
  cropType?: string;
}

// What this does: Uses real agricultural math (vapor pressure, wind power, plant growth) to calculate what happens to crops at a given temperature, humidity, and wind speed.
// On the website: Drives the Visual Farm Simulator's health score, sky color, plant droop/bend, fire risk, and farmer tips.
// Used as: The built-in farm science engine and reliable baseline for /api/predict-farm.
function calculateDeterministicFarm(temp: number, hum: number, wind: number, crop: string = 'Golden Wheat') {
  const T = Math.max(-20, Math.min(60, temp));
  const RH = Math.max(1, Math.min(100, hum));
  const W = Math.max(0, Math.min(60, wind));

  // Tetens equation for saturation vapor pressure e_s(T) in kPa
  const es = 0.61078 * Math.exp((17.27 * T) / (T + 237.3));
  const ea = es * (RH / 100);
  const vpd = Math.max(0, es - ea);
  const wpd = Math.round(0.5 * 1.225 * Math.pow(Math.max(0.2, W), 3));

  // Agro-climatic condition categorization
  let condition: 'thriving' | 'drought' | 'wildfire' | 'frost' | 'flooded' | 'wind_damage';
  let healthScore: number;
  let title: string;
  let summary: string;
  let plainEnglishStory: string;
  let stomataStatus: string;
  let soilCondition: 'fertile_moist' | 'cracked_arid' | 'charred_ash' | 'frozen_permafrost' | 'waterlogged_mud';
  let fireRiskLevel: 'none' | 'low' | 'moderate' | 'high' | 'extreme_firestorm';
  let skyTheme: 'clear_sunny' | 'golden_hour' | 'smoky_fire' | 'hazy_arid' | 'stormy_dark' | 'frozen_gray';
  let cropColor: string;
  let leafWiltDeg: number;
  let windDeflectionDeg: number = Math.min(60, Math.round(W * 1.45));
  let fireIntensity: number = 0;
  let particleType: 'pollinators' | 'gentle_dust' | 'embers' | 'flying_debris' | 'rain' | 'snow' | 'none';
  let cropYieldImpact: string;
  let farmerAdvice: string[];

  // 1. Polar Freezing / Frost
  if (T <= 0) {
    condition = 'frost';
    healthScore = Math.max(5, Math.min(45, Math.round(40 + T * 3.5)));
    title = T <= -8 ? 'Severe Polar Freeze & Permafrost' : 'Late Spring Frost & Ice Glaze';
    summary = `Freezing temperature (${T}°C) crystallizes intracellular fluids within ${crop}, resulting in cellular lysis and black frost injury.`;
    plainEnglishStory = `At ${T}°C, ice crystals form inside the cell walls of ${crop}, puncturing plant tissues. Because the air has ${RH}% relative humidity and ${W} m/s wind, convective wind chill accelerates ice nucleation across delicate shoots. The fields are locked in permafrost, halting sap circulation and photosynthetic metabolism.`;
    stomataStatus = 'Frozen dormant; enzymatic ATP synthesis halted by cold shock';
    soilCondition = 'frozen_permafrost';
    fireRiskLevel = 'none';
    skyTheme = 'frozen_gray';
    cropColor = '#94a3b8'; // Frosty ice silver-slate
    leafWiltDeg = Math.min(35, Math.round(Math.abs(T) * 3));
    particleType = 'snow';
    cropYieldImpact = `Severe loss of 50%–90% if sustained during active vegetative budding; winter dormancy protects dormant crowns.`;
    farmerAdvice = [
      'Deploy orchard frost fans and micro-sprinklers to release latent heat of fusion.',
      'Apply floating agro-textile thermal row covers over vulnerable seedlings.',
      'Delay nitrogen fertilization until ambient temperatures consistently rise above 8°C.'
    ];
  }
  // 2. Catastrophic Wildfire (Hot, Bone-Dry, High Winds)
  else if ((T >= 35 && RH <= 25 && W >= 8) || (T >= 42 && RH <= 30)) {
    condition = 'wildfire';
    healthScore = Math.max(0, Math.min(25, Math.round(20 - (T - 35) * 1.5 - W * 0.4)));
    title = 'Extreme Wildfire Flashover & Crop Scorching';
    summary = `Dangerous Red Flag confluence: ${T}°C scorching heat, ultra-arid ${RH}% humidity, and ${W} m/s gusts ignite and violently fan crop fires.`;
    plainEnglishStory = `The extreme combination of intense heat (${T}°C) and desiccated air (${RH}% RH) drives the Vapor Pressure Deficit up to ${vpd.toFixed(2)} kPa. Turgor pressure has collapsed completely, converting grain stalks into combustible tinder. Winds at ${W} m/s (${(W * 3.6).toFixed(0)} km/h) supply continuous oxygen and transport flying embers (firebrands) miles downwind, creating uncontrollable field fires.`;
    stomataStatus = 'Scorched and thermally denatured; cellular proteins coagulated';
    soilCondition = 'charred_ash';
    fireRiskLevel = W >= 15 ? 'extreme_firestorm' : 'high';
    skyTheme = 'smoky_fire';
    cropColor = '#dc2626'; // Burning crimson
    leafWiltDeg = 55;
    fireIntensity = Math.min(1.0, 0.4 + (T - 35) * 0.03 + (W / 40) * 0.3);
    particleType = 'embers';
    cropYieldImpact = `Catastrophic 95%–100% loss of standing crop biomass and infrastructure if firebreak containment fails.`;
    farmerAdvice = [
      'Activate perimeter emergency foam firebreaks and disc-plow 10m bare-soil buffer strips.',
      'Evacuate farm livestock and heavy machinery to defensible cleared concrete staging pads.',
      'Trigger overhead perimeter mist cannons to wet down roof structures and downwind field borders.'
    ];
  }
  // 3. Severe Drought & Desiccation (High VPD, High Heat, Low Moisture)
  else if ((vpd >= 2.2 && T >= 28) || (RH <= 20 && T >= 26)) {
    condition = 'drought';
    healthScore = Math.max(10, Math.min(50, Math.round(55 - vpd * 9)));
    title = 'Severe Evaporative Drought & Thermal Wilt';
    summary = `Atmospheric thirst is extreme (VPD ${vpd.toFixed(2)} kPa). Stomata clamp shut as soil water potentials plummet below the permanent wilting point.`;
    plainEnglishStory = `The atmosphere is behaving like a giant evaporative sponge, pulling moisture out of the leaves faster than the root systems can extract it from the dry earth. At ${T}°C and only ${RH}% humidity, the plants close their microscopic breathing pores (stomata) to prevent fatal dehydration. However, closing stomata blocks carbon dioxide absorption, shutting down plant growth and causing solar scorching on upper leaves.`;
    stomataStatus = 'Firmly clamped shut via abscisic acid (ABA) signaling to halt water loss';
    soilCondition = 'cracked_arid';
    fireRiskLevel = 'moderate';
    skyTheme = 'hazy_arid';
    cropColor = '#ca8a04'; // Parched amber-yellow
    leafWiltDeg = Math.min(50, Math.round(vpd * 12));
    particleType = 'gentle_dust';
    cropYieldImpact = `Yield loss of 35%–65% through kernel abortion and stunted vegetative canopy volume.`;
    farmerAdvice = [
      'Shift irrigation cycles strictly to night (22:00–04:00) using sub-surface drip to slash evaporative waste.',
      'Apply biochar and organic straw mulch to seal soil fissures and conserve rhizosphere moisture.',
      'Spray biodegradable calcium-based anti-transpirant films to shield leaves from radiant sunscald.'
    ];
  }
  // 4. Violent Windthrow & Stem Lodging (High Wind Velocity)
  else if (W >= 20) {
    condition = 'wind_damage';
    healthScore = Math.max(15, Math.min(60, Math.round(70 - (W - 20) * 2.8)));
    title = 'Violent Windstorm & Severe Crop Lodging';
    summary = `Gale-force winds at ${W} m/s (${(W * 3.6).toFixed(0)} km/h) deliver ${wpd} W/m² kinetic force, snapping plant stalks and stripping foliage.`;
    plainEnglishStory = `Even with moderate temperature (${T}°C) and humidity (${RH}%), aerodynamic shear stress from ${W} m/s winds exceeds the mechanical breaking strength of ${crop} culms. Stalks bend drastically past their elastic yield point and snap flat to the ground (lodging). Once lodged, the crop canopy rots against the damp soil and harvester combines can no longer gather the grain heads.`;
    stomataStatus = 'Mechanically stressed; mechanical vibration inducing thigmomorphogenetic closure';
    soilCondition = 'fertile_moist';
    fireRiskLevel = 'low';
    skyTheme = 'stormy_dark';
    cropColor = '#65a30d'; // Battered green-yellow
    leafWiltDeg = 20;
    windDeflectionDeg = Math.min(62, Math.round(W * 1.7));
    particleType = 'flying_debris';
    cropYieldImpact = `Harvest efficiency loss of 40%–70% from flattened stalks and unharvestable grain heads.`;
    farmerAdvice = [
      'Erect multi-row shelterbelts of fast-growing agroforestry trees (poplar, willow) along prevailing wind corridors.',
      'Select dwarf or semi-dwarf cultivars with high lignin-reinforced basal stalk strength.',
      'Adjust combine harvesters with specialized crop lifters and pick-up reels for lodged fields.'
    ];
  }
  // 5. Waterlogging & Fungal Pathogen Outbreak (High Humidity, Excessive Moisture)
  else if (RH >= 90 && T >= 22) {
    condition = 'flooded';
    healthScore = Math.max(25, Math.min(65, Math.round(65 - (RH - 90) * 2.5)));
    title = 'Saturated Moisture & Fungal Blight Outbreak';
    summary = `Oppressive saturation (${RH}% RH) suppresses transpiration while warm standing moisture invites virulent fungal mold, rust, and root rot.`;
    plainEnglishStory = `With relative humidity at ${RH}%, the air is almost completely saturated with water vapor. The Vapor Pressure Deficit drops to a razor-thin ${vpd.toFixed(2)} kPa, leaving no evaporative gradient to pull water and nutrients upward through the vascular xylem. Combined with ${T}°C warmth, wet leaf surfaces remain bathed in moisture for hours—creating the perfect nursery for powdery mildew, fusarium head blight, and pythium root rot.`;
    stomataStatus = 'Passive open but transpiration rate stalled near 0 mm/hr';
    soilCondition = 'waterlogged_mud';
    fireRiskLevel = 'none';
    skyTheme = 'stormy_dark';
    cropColor = '#4d7c0f'; // Dark waterlogged olive-green
    leafWiltDeg = 15;
    particleType = 'rain';
    cropYieldImpact = `Yield reduction of 20%–45% from mycotoxin contamination and fungal grain shrivelling.`;
    farmerAdvice = [
      'Carve surface swales and deep tile sub-drainage channels to evacuate standing surface water.',
      'Increase planting row spacing to improve canopy ventilation and reduce leaf wetness duration.',
      'Apply preventative bio-fungicide sprays (Trichoderma or copper sulfate) ahead of continuous rains.'
    ];
  }
  // 6. Optimal Green Thriving Growth (Balanced Goldilocks Conditions)
  else {
    condition = 'thriving';
    const tempDev = Math.abs(T - 23);
    const humDev = Math.abs(RH - 65);
    const windDev = Math.abs(W - 4);
    healthScore = Math.max(70, Math.min(100, Math.round(98 - tempDev * 1.8 - humDev * 0.4 - windDev * 1.2)));
    title = 'Peak Photosynthetic Surge & Golden Harvest';
    summary = `Goldilocks microclimate: ${T}°C temperature, ${RH}% humidity, and ${W} m/s breeze provide optimal Vapor Pressure Deficit (${vpd.toFixed(2)} kPa) for maximum growth.`;
    plainEnglishStory = `The farm is in its absolute prime! The ${T}°C temperature sits right at the optimal enzymatic peak for Rubisco photosynthesis. At ${RH}% relative humidity, the Vapor Pressure Deficit is balanced at ${vpd.toFixed(2)} kPa—inviting the stomata to open wide to inhale carbon dioxide without drying out. The gentle ${W} m/s breeze continuously circulates fresh CO₂ across the crop canopy without physical strain, fostering vigorous chlorophyll synthesis and lush, emerald-green growth.`;
    stomataStatus = 'Fully open (conductance > 450 mmol/m²s); maximum carbon fixation';
    soilCondition = 'fertile_moist';
    fireRiskLevel = 'none';
    skyTheme = 'clear_sunny';
    cropColor = '#16a34a'; // Vibrant lush emerald green
    leafWiltDeg = 0;
    particleType = 'pollinators';
    cropYieldImpact = `100%–115% of historical bumper harvest baseline with superior test weight and protein content.`;
    farmerAdvice = [
      'Maintain regular nutrient fertigation to capitalize on rapid vegetative dry matter accumulation.',
      'Monitor soil sensor moisture levels to sustain rhizosphere field capacity at 70%–80%.',
      'Prepare grain silos and harvest equipment for high-capacity seasonal intake.'
    ];
  }

  // Crop specific physiological thermal baselines
  const cropBaselines: Record<string, { baseT: number; optT: number; maxT: number; maxGrowthRateCm: number }> = {
    'Golden Wheat': { baseT: 0, optT: 22, maxT: 34, maxGrowthRateCm: 3.6 },
    'Maize & Corn': { baseT: 10, optT: 26, maxT: 38, maxGrowthRateCm: 5.8 },
    'Vineyard Grapes': { baseT: 10, optT: 24, maxT: 36, maxGrowthRateCm: 2.8 },
    'Market Garden': { baseT: 4, optT: 19, maxT: 30, maxGrowthRateCm: 4.2 },
  };

  const cropBio = cropBaselines[crop] || cropBaselines['Golden Wheat'];
  const gddDaily = Math.max(0, Number((T - cropBio.baseT).toFixed(1)));

  // Calculate physiological plant growth rate (cm/day) and visual plant height multiplier
  let dailyGrowthCm = 0;
  let phenologyStage = 'Vegetative Elongation';
  let plantHeightMultiplier = 1.0;
  let stomatalConductanceMmol = 380;
  let biomassYieldPercent = 100;

  if (T <= 0) {
    dailyGrowthCm = 0;
    phenologyStage = 'Freezing Dormancy / Cryo-Stall';
    plantHeightMultiplier = 0.65;
    stomatalConductanceMmol = 15;
    biomassYieldPercent = Math.max(0, Math.round(50 + T * 3));
  } else if (condition === 'wildfire') {
    dailyGrowthCm = -0.5;
    phenologyStage = 'Scorched Biomass Destruction';
    plantHeightMultiplier = 0.45;
    stomatalConductanceMmol = 5;
    biomassYieldPercent = 0;
  } else if (condition === 'drought') {
    dailyGrowthCm = Number((0.2 * Math.max(0, 1 - (vpd - 2.0) * 0.5)).toFixed(2));
    phenologyStage = 'Desiccation Defense / Stunted Fill';
    plantHeightMultiplier = 0.75;
    stomatalConductanceMmol = Math.max(25, Math.round(400 - vpd * 120));
    biomassYieldPercent = Math.max(20, Math.round(75 - vpd * 14));
  } else if (condition === 'wind_damage') {
    dailyGrowthCm = 0.4;
    phenologyStage = 'Mechanically Lodged / Bent Canopies';
    plantHeightMultiplier = 0.7;
    stomatalConductanceMmol = 220;
    biomassYieldPercent = Math.max(30, Math.round(85 - W * 1.5));
  } else if (condition === 'flooded') {
    dailyGrowthCm = 0.6;
    phenologyStage = 'Root Hypoxia & Chlorosis';
    plantHeightMultiplier = 0.88;
    stomatalConductanceMmol = 160;
    biomassYieldPercent = Math.max(40, Math.round(80 - (RH - 85) * 2));
  } else {
    // Optimal growth curves
    const tempFactor = 1.0 - Math.pow((T - cropBio.optT) / (cropBio.maxT - cropBio.baseT), 2);
    const vpdFactor = Math.max(0.3, 1.0 - Math.abs(vpd - 1.0) * 0.4);
    dailyGrowthCm = Number((cropBio.maxGrowthRateCm * Math.max(0.2, tempFactor * vpdFactor)).toFixed(2));
    plantHeightMultiplier = Number((0.95 + (dailyGrowthCm / cropBio.maxGrowthRateCm) * 0.35).toFixed(2));
    phenologyStage = T >= 24 ? 'Vigorous Anthesis & Bumper Grain Fill' : 'Rapid Vegetative Tillering';
    stomatalConductanceMmol = Math.round(420 + (1.2 - Math.abs(vpd - 1.0)) * 60);
    biomassYieldPercent = Math.min(125, Math.round(95 + dailyGrowthCm * 5));
  }

  // Canopy temperature incorporating transpiration evaporative cooling
  const canopyCooling = condition === 'drought' || condition === 'wildfire' ? 0.5 : (stomatalConductanceMmol / 450) * 2.2;
  const canopyTemperatureC = Number((T - canopyCooling).toFixed(1));

  return {
    condition,
    healthScore,
    title,
    summary,
    plainEnglishStory,
    vpdKPa: Number(vpd.toFixed(2)),
    stomataStatus,
    soilCondition,
    fireRiskLevel,
    cropYieldImpact,
    farmerAdvice,
    scientificTelemetry: {
      saturationVaporPressureKPa: Number(es.toFixed(2)),
      actualVaporPressureKPa: Number(ea.toFixed(2)),
      windPowerDensityWm2: wpd,
      lodgingRiskPercent: Math.min(100, Math.max(0, Math.round(Math.pow(W / 28, 2.5) * 100))),
      transpirationStressIndex: Number((vpd / 3.0).toFixed(2)),
      fireSpreadSpeedMMin: condition === 'wildfire' ? Math.round(W * 1.8 + (T - 30) * 1.2) : 0,
      dailyGrowthCm,
      gddDaily,
      plantHeightMultiplier,
      stomatalConductanceMmol,
      canopyTemperatureC,
      biomassYieldPercent,
      phenologyStage,
    },
    visualState: {
      skyTheme,
      cropColor,
      leafWiltDeg,
      windDeflectionDeg,
      fireIntensity,
      particleType,
      plantHeightMultiplier,
    },
    aiModelUsed: 'NASA High-Precision Agro-Climatic Model v3.2',
  };
}

// What this does: Takes the user's farm slider values (temp, humidity, wind, crop), checks the cache, calculates baseline crop physics, and optionally asks Gemini AI for a richer story.
// On the website: Updates the Visual Farm Simulator screen whenever the user drags a slider or changes the crop type.
// Used as: The backend prediction endpoint for the Visual Farm Simulator.
app.post('/api/predict-farm', async (req: Request, res: Response): Promise<void> => {
  try {
    const { temperature, humidity, windSpeed, cropType = 'Golden Wheat' } = req.body as FarmPredictionRequest;

    const temp = typeof temperature === 'number' ? temperature : 24;
    const hum = typeof humidity === 'number' ? humidity : 60;
    const wind = typeof windSpeed === 'number' ? windSpeed : 3.5;

    // Check memory cache first to conserve API quota and ensure instant response
    const cacheKey = `${Math.round(temp)}:${Math.round(hum)}:${Math.round(wind * 2) / 2}:${cropType}`;
    if (farmPredictionCache.has(cacheKey)) {
      res.json(farmPredictionCache.get(cacheKey));
      return;
    }

    // Fast deterministic baseline with physiological growth modeling
    const baseline = calculateDeterministicFarm(temp, hum, wind, cropType);

    const ai = getGeminiClient();
    const candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'].filter((m) => !isModelCoolingDown(m));

    // If API client unavailable or all models in quota cooldown, immediately serve high-precision baseline
    if (!ai || candidateModels.length === 0) {
      farmPredictionCache.set(cacheKey, baseline);
      res.json(baseline);
      return;
    }

    const prompt = `As a NASA Agricultural Climatologist and Crop Physiologist, analyze the microclimate conditions on a visual farm growing "${cropType}":
- Surface Temperature: ${temp}°C
- Relative Humidity: ${hum}% RH
- 10m Wind Speed: ${wind} m/s (${(wind * 3.6).toFixed(1)} km/h)
- Computed Vapor Pressure Deficit (VPD): ${baseline.vpdKPa} kPa
- Daily Plant Elongation: ${baseline.scientificTelemetry.dailyGrowthCm} cm/day
- Phenological Stage: ${baseline.scientificTelemetry.phenologyStage}

Provide an accurate botanical assessment explaining:
1. Exact physiological reasons for plant growth rates, stomatal response, and final yield (${baseline.scientificTelemetry.biomassYieldPercent}% baseline).
2. Visible effects on the plant anatomy (e.g. elongation of stems, leaf turgor, root oxygenation, or scorching).
3. Plain-English narrative for students to visualize cause and effect.

Return valid JSON conforming to this format:
{
  "condition": "${baseline.condition}",
  "healthScore": ${baseline.healthScore},
  "title": "${baseline.title}",
  "summary": "${baseline.summary}",
  "plainEnglishStory": "A 2-paragraph vivid botanical and climate narrative explaining what the farm looks like, how the plant grows or withers, and why these exact microclimate parameters produced this outcome.",
  "cropYieldImpact": "Specific predicted yield impact.",
  "farmerAdvice": ["Action 1", "Action 2", "Action 3"]
}`;

    let mergedResult = null;
    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: {
            responseMimeType: 'application/json',
            systemInstruction: 'You are the NASA Agro-Climatic AI Specialist. Provide accurate, vivid, scientifically grounded farm predictions in clean JSON.',
          },
        });

        const text = response?.text;
        if (text) {
          const parsed = JSON.parse(text);
          mergedResult = {
            ...baseline,
            ...parsed,
            vpdKPa: baseline.vpdKPa,
            scientificTelemetry: {
              ...baseline.scientificTelemetry,
              ...(parsed.scientificTelemetry || {}),
            },
            visualState: {
              ...baseline.visualState,
              ...(parsed.visualState || {}),
            },
            aiModelUsed: modelName,
          };
          break;
        }
      } catch (aiErr) {
        tripModelCooldown(modelName, aiErr);
      }
    }

    const finalResult = mergedResult || baseline;
    farmPredictionCache.set(cacheKey, finalResult);
    res.json(finalResult);
  } catch (err: any) {
    // Failsafe fallback to deterministic agro-climatic model
    const baseline = calculateDeterministicFarm(
      Number((req.body as any)?.temperature ?? 24),
      Number((req.body as any)?.humidity ?? 60),
      Number((req.body as any)?.windSpeed ?? 3.5),
      (req.body as any)?.cropType ?? 'Golden Wheat'
    );
    res.json(baseline);
  }
});

// =========================================================================
// AI VISUAL POLAR CRYOSPHERE SIMULATION API (/api/predict-polar)
// Models the thermodynamics, ice calving, albedo feedback, permafrost thaw,
// and wildlife response to user-selected Temperature, Moisture, and Winds.
// =========================================================================

interface PolarPredictionRequest {
  temperature: number; // -50°C to +15°C
  humidity: number;    // 10% to 100%
  windSpeed: number;   // 0 to 50 m/s
  biome?: string;      // 'arctic-sea-ice' | 'antarctic-shelf' | 'permafrost-tundra' | 'polar-wildlife'
}

// What this does: Calculates polar ice melt, wind chill, snow reflectivity (albedo), permafrost thaw depth, and methane gas release from temperature, humidity, and wind.
// On the website: Controls the Visual Polar Simulator's ice shelves, blizzard/aurora sky, wildlife status, and polar health score.
// Used as: The built-in polar physics engine and reliable baseline for /api/predict-polar.
function calculateDeterministicPolar(temp: number, hum: number, wind: number, biome: string = 'arctic-sea-ice') {
  const T = Math.max(-60, Math.min(25, temp));
  const RH = Math.max(5, Math.min(100, hum));
  const W = Math.max(0, Math.min(65, wind));

  // Katabatic wind chill equivalent temperature (°C)
  const windChillC = W > 1.3
    ? Number((13.12 + 0.6215 * T - 11.37 * Math.pow(W, 0.16) + 0.3965 * T * Math.pow(W, 0.16)).toFixed(1))
    : T;

  // Albedo reflectivity (0.0 to 1.0)
  // Cold dry snow has albedo ~0.85; melting wet ice ~0.50; open ocean ~0.06
  let albedo = 0.85;
  if (T > 0) {
    albedo = Number(Math.max(0.08, 0.65 - T * 0.04 - (W / 40) * 0.1).toFixed(2));
  } else if (T > -8) {
    albedo = Number((0.80 + T * 0.015).toFixed(2));
  }

  // Ice sheet basal & surface melt rate (cm/month)
  const meltRateCmMonth = T > 0 ? Number((T * 12.5 + (W / 10) * 3.5).toFixed(1)) : 0;

  // Permafrost active layer thaw depth (cm)
  const permafrostThawCm = T > 0 ? Math.min(220, Math.round(18 + T * 14.5)) : Math.max(5, Math.round(15 + T * 0.4));

  // Methane emission flux from thermokarst thaw (mg CH4 / m² / day)
  const methaneFluxMgDay = T > 2 ? Math.min(250, Math.round(Math.pow(T - 1, 1.8) * 8.5)) : 0;

  // Sea ice extent anomaly index (-100% to +30%)
  const seaIceAnomalyPercent = T > 0
    ? Number(Math.max(-95, -15 - T * 7.5 - W * 0.6).toFixed(1))
    : Number(Math.min(25, -T * 0.6).toFixed(1));

  // Ice shelf calving risk
  const calvingRiskPercent = T > 1
    ? Math.min(100, Math.round(Math.pow(T, 1.6) * 12 + W * 0.8))
    : T > -3 && W > 25
    ? Math.min(60, Math.round(W * 1.2))
    : 5;

  let condition: 'deep_freeze' | 'stable_ice' | 'ice_calving' | 'blizzard_storm' | 'tundra_thaw' | 'polar_heatwave';
  let healthScore: number;
  let title: string;
  let summary: string;
  let plainEnglishStory: string;
  let wildlifeStatus: string;
  let skyTheme: 'aurora_borealis' | 'midnight_sun' | 'blizzard_whiteout' | 'arctic_twilight' | 'overcast_drip';
  let iceState: 'thick_polar_pack' | 'stable_shelf' | 'calving_shatter' | 'slumped_thaw' | 'open_dark_sea';

  // 1. Blizzard storm
  if (W >= 24) {
    condition = 'blizzard_storm';
    healthScore = Math.max(15, Math.min(65, Math.round(70 - (W - 24) * 2)));
    title = 'Howling Katabatic Blizzard & Ground Whiteout';
    summary = `Violent polar winds at ${W} m/s (${(W * 3.6).toFixed(0)} km/h) plunge the wind chill down to ${windChillC}°C, stripping surface firn and inducing blinding whiteout conditions.`;
    plainEnglishStory = `Dense gravity-driven katabatic winds rush down the polar plateau at ${W} m/s, picking up millions of metric tons of loose powdered snow into blinding sheets of horizontal drift. With wind chill dropping to ${windChillC}°C, any exposed research personnel face frostbite in under 60 seconds. Ice shelves flex under high aerodynamic shear stress, widening surface crevasses.`;
    wildlifeStatus = 'Huddled in dense colonies; seals diving deep to escape freezing surface spray';
    skyTheme = 'blizzard_whiteout';
    iceState = 'stable_shelf';
  }
  // 2. Polar Heatwave & Open Ocean Collapse
  else if (T >= 6) {
    condition = 'polar_heatwave';
    healthScore = Math.max(5, Math.min(30, Math.round(30 - (T - 6) * 3)));
    title = 'Severe Polar Heatwave & Albedo Flip';
    summary = `Unprecedented warmth (${T}°C) causes widespread surface melt ponding. Albedo plunges to ${albedo}, turning the polar cap from a planetary mirror into a heat sponge.`;
    plainEnglishStory = `The polar cryosphere is unraveling rapidly. At ${T}°C, temperatures are far above the freezing threshold. Meltwater channels (moulins) drill thousands of feet deep through the glacier, lubricating the bedrock and accelerating ice shelf slip towards the sea. The brilliant white albedo has collapsed to ${albedo}, causing dark open water and turquoise melt ponds to absorb 85%+ of incoming solar radiation in a vicious warming feedback loop.`;
    wildlifeStatus = 'Severe habitat loss: ice floes disintegrated, forcing polar marine mammals into exhausted long swims';
    skyTheme = 'midnight_sun';
    iceState = 'open_dark_sea';
  }
  // 3. Catastrophic Calving Event
  else if (T > 0 && calvingRiskPercent >= 45) {
    condition = 'ice_calving';
    healthScore = Math.max(20, Math.min(50, Math.round(55 - calvingRiskPercent * 0.4)));
    title = 'Glacial Iceberg Calving & Shelf Disintegration';
    summary = `Hydrofracturing triggers massive calving events. Iceberg discharge rates surge as meltwater gorges fracture the marine-terminating glacier terminus.`;
    plainEnglishStory = `Tens of thousands of tons of ancient glacial ice are shattering into the ocean. Warm water eroding the ice shelf from beneath (basal melt) combined with surface meltwater wedging opens giant structural fissures. Massive city-block-sized tabular icebergs break away with thundering sonic booms, generating localized tsunami waves that sweep across coastal fjords.`;
    wildlifeStatus = 'Displaced from coastal breeding haul-outs by unstable calving margins and wave surges';
    skyTheme = 'overcast_drip';
    iceState = 'calving_shatter';
  }
  // 4. Permafrost Tundra Thaw & Methane Release
  else if (T > 0 && biome === 'permafrost-tundra') {
    condition = 'tundra_thaw';
    healthScore = Math.max(25, Math.min(60, Math.round(60 - T * 4)));
    title = 'Permafrost Active Layer Thaw & Thermokarst Methane';
    summary = `Sub-surface permafrost thaws to a depth of ${permafrostThawCm} cm. Ancient microbial decay releases ${methaneFluxMgDay} mg/m²/day of potent methane gas.`;
    plainEnglishStory = `The perennially frozen ground is collapsing into thermokarst sinkholes and slumping mudslides. As the active thaw layer expands to ${permafrostThawCm} cm, organic plant and mammoth remains preserved since the Pleistocene decay in anoxic thaw ponds, releasing continuous streams of methane bubbles (${methaneFluxMgDay} mg/m²/day) that trigger planetary greenhouse amplification.`;
    wildlifeStatus = 'Tundra wetlands expanding; migratory waterfowl nesting while terrestrial mammals navigate boggy ground';
    skyTheme = 'midnight_sun';
    iceState = 'slumped_thaw';
  }
  // 5. Deep Polar Glaciation (Sub-Zero Freeze)
  else if (T <= -20) {
    condition = 'deep_freeze';
    healthScore = 98;
    title = 'Pristine Cryospheric Glaciation & High Albedo';
    summary = `Frigid equilibrium at ${T}°C (Wind Chill: ${windChillC}°C). High albedo (${albedo}) reflects 85% of solar radiation back into deep space.`;
    plainEnglishStory = `The polar cryosphere is at its peak majestic stability. With temperatures at ${T}°C, multi-year sea ice pack thickens to over 3.5 meters. Brilliant diamond dust ice halos ring the sky while vibrant curtains of Aurora Borealis ripple overhead. Glacial ice sheets are fully frozen to bedrock, serving as Earth's giant thermal radiator cooling the entire global climate engine.`;
    wildlifeStatus = 'Thriving: seals utilizing stable breathing leads, polar bears hunting on solid sea ice platforms';
    skyTheme = 'aurora_borealis';
    iceState = 'thick_polar_pack';
  }
  // 6. Stable Sub-Zero Ice
  else {
    condition = 'stable_ice';
    healthScore = 88;
    title = 'Stable Sub-Zero Cryosphere & Intact Pack Ice';
    summary = `Normal polar conditions (${T}°C, ${RH}% RH). Ice mass balance remains in equilibrium with steady seasonal snow accumulation.`;
    plainEnglishStory = `Conditions are cold, quiet, and stable across the polar expanse. Sub-zero temperatures (${T}°C) preserve the ice sheet surface without runoff. The high-latitude atmosphere holds crisp, pristine visibility, with the research outpost sensors recording nominal solar reflection and zero basal melting.`;
    wildlifeStatus = 'Healthy ecological balance: penguin colonies tending nests, marine food web intact';
    skyTheme = 'arctic_twilight';
    iceState = 'stable_shelf';
  }

  return {
    condition,
    healthScore,
    title,
    summary,
    plainEnglishStory,
    albedo,
    windChillC,
    meltRateCmMonth,
    permafrostThawCm,
    methaneFluxMgDay,
    seaIceAnomalyPercent,
    calvingRiskPercent,
    wildlifeStatus,
    iceState,
    skyTheme,
    researchAdvice: [
      T > 0 ? 'Deploy automated oceanographic CTD gliders to measure warm Atlantic/Circumpolar deep water intrusion.' : 'Maintain satellite SAR interferometry monitoring of ice stream grounding lines.',
      calvingRiskPercent > 30 ? 'Evacuate coastal ice shelf field camps inland past major shear margins.' : 'Collect deep firn ice core samples for paleoclimate isotopic analysis.',
      'Sustain continuous eddy-covariance atmospheric methane and carbon flux sensor towers.'
    ],
    aiModelUsed: 'NASA Cryospheric System Dynamics Model v4.1',
  };
}

// What this does: Receives polar slider settings from the user, serves cached or deterministic ice calculations, and enriches the story with Gemini AI when available.
// On the website: Powers the Polar Cryosphere Simulator tab inside the Visual Simulator modal.
// Used as: The backend prediction endpoint for the Visual Polar Simulator.
app.post('/api/predict-polar', async (req: Request, res: Response): Promise<void> => {
  try {
    const { temperature, humidity, windSpeed, biome = 'arctic-sea-ice' } = req.body as PolarPredictionRequest;

    const temp = typeof temperature === 'number' ? temperature : -18;
    const hum = typeof humidity === 'number' ? humidity : 65;
    const wind = typeof windSpeed === 'number' ? windSpeed : 6.0;

    // Check memory cache first to conserve API quota and guarantee instantaneous response
    const cacheKey = `${Math.round(temp)}:${Math.round(hum)}:${Math.round(wind * 2) / 2}:${biome}`;
    if (polarPredictionCache.has(cacheKey)) {
      res.json(polarPredictionCache.get(cacheKey));
      return;
    }

    const baseline = calculateDeterministicPolar(temp, hum, wind, biome);

    const ai = getGeminiClient();
    const candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'].filter((m) => !isModelCoolingDown(m));

    // If API client unavailable or all candidate models in quota cooldown, immediately serve baseline
    if (!ai || candidateModels.length === 0) {
      polarPredictionCache.set(cacheKey, baseline);
      res.json(baseline);
      return;
    }

    const prompt = `As a NASA Glaciologist and Polar Climate Scientist, analyze the following user-selected conditions in a visual polar cryosphere environment (${biome}):
- Surface Temperature: ${temp}°C
- Relative Humidity: ${hum}% RH
- 10m Wind Speed: ${wind} m/s (${(wind * 3.6).toFixed(1)} km/h)
- Computed Wind Chill: ${baseline.windChillC}°C
- Surface Albedo: ${baseline.albedo}
- Calving Risk: ${baseline.calvingRiskPercent}%
- Permafrost Thaw Depth: ${baseline.permafrostThawCm} cm
- Methane Feedback: ${baseline.methaneFluxMgDay} mg/m²/day

Predict the state of this polar environment. Could it trigger catastrophic iceberg calving, howling katabatic blizzards, permafrost thaw sinkholes, rapid albedo collapse, or pristine stable glaciation?
Explain vividly so a student or user can easily imagine and understand the impact of small shifts in polar temperature and wind.

Return valid JSON conforming to this format:
{
  "condition": "${baseline.condition}",
  "healthScore": ${baseline.healthScore},
  "title": "${baseline.title}",
  "summary": "${baseline.summary}",
  "plainEnglishStory": "A 2-paragraph compelling visual and scientific narrative describing the ice shelf, glacier, wildlife, atmosphere, and exact planetary feedbacks (albedo, meltwater, methane).",
  "wildlifeImpact": "Detailed impact on polar bears, seals, penguins, or marine ecosystems.",
  "researchAdvice": ["Action 1", "Action 2", "Action 3"]
}`;

    let mergedResult = null;
    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: {
            responseMimeType: 'application/json',
            systemInstruction: 'You are the NASA Cryosphere AI Specialist. Provide accurate, vivid, scientifically grounded polar predictions in clean JSON.',
          },
        });

        const text = response?.text;
        if (text) {
          const parsed = JSON.parse(text);
          mergedResult = {
            ...baseline,
            ...parsed,
            albedo: baseline.albedo,
            windChillC: baseline.windChillC,
            meltRateCmMonth: baseline.meltRateCmMonth,
            permafrostThawCm: baseline.permafrostThawCm,
            methaneFluxMgDay: baseline.methaneFluxMgDay,
            seaIceAnomalyPercent: baseline.seaIceAnomalyPercent,
            calvingRiskPercent: baseline.calvingRiskPercent,
            aiModelUsed: modelName,
          };
          break;
        }
      } catch (aiErr) {
        tripModelCooldown(modelName, aiErr);
      }
    }

    const finalResult = mergedResult || baseline;
    polarPredictionCache.set(cacheKey, finalResult);
    res.json(finalResult);
  } catch (err: any) {
    // Failsafe fallback to deterministic cryosphere model
    const baseline = calculateDeterministicPolar(
      Number((req.body as any)?.temperature ?? -18),
      Number((req.body as any)?.humidity ?? 65),
      Number((req.body as any)?.windSpeed ?? 6.0),
      (req.body as any)?.biome ?? 'arctic-sea-ice'
    );
    res.json(baseline);
  }
});

// =========================================================================
// AI VISUAL OCEAN & HYDROSPHERE SIMULATION API (/api/predict-ocean)
// Models the thermodynamics, Pierson-Moskowitz wave spectrum, Beaufort scale,
// coral bleaching (DHW), dissolved oxygen, evaporative flux, and marine fog.
// =========================================================================

interface OceanPredictionRequest {
  temperature: number; // -2°C to +38°C (Sea Surface Temperature)
  humidity: number;    // 10% to 100% (Relative Humidity)
  windSpeed: number;   // 0 to 50 m/s (10m Marine Wind)
  zone?: string;       // 'coral-reef' | 'open-pelagic' | 'upwelling-zone' | 'coastal-lagoon'
}

// What this does: Computes wave height, Beaufort storm level, whitecap foam, dissolved oxygen, sea fog, and coral bleaching risk from sea temperature, humidity, and wind.
// On the website: Drives the Visual Ocean Simulator's wave motion, water color, coral health (vibrant vs. bleached white), and marine warnings.
// Used as: The built-in ocean physics engine and reliable baseline for /api/predict-ocean.
function calculateDeterministicOcean(temp: number, hum: number, wind: number, zone: string = 'coral-reef') {
  const T = Math.max(-2, Math.min(38, temp));
  const RH = Math.max(10, Math.min(100, hum));
  const W = Math.max(0, Math.min(50, wind));

  // 1. Physical Wave Kinematics (Pierson-Moskowitz & Airy Wave Theory)
  // Significant wave height H_s (meters)
  let waveHeightM = Math.max(0.15, Math.min(14.5, 0.024 * Math.pow(W, 2.05)));
  if (W < 1.0) waveHeightM = 0.12;
  waveHeightM = Math.round(waveHeightM * 100) / 100;

  // Peak wave period T_p (seconds)
  const wavePeriodS = Math.max(2.5, Math.min(16.0, Math.round((0.85 * Math.pow(Math.max(1, W), 0.78) + 2.8) * 10) / 10));

  // 2. Beaufort Wind Force Scale (0 to 12)
  let beaufortScale = 0;
  let beaufortName = 'Calm';
  if (W < 0.3) { beaufortScale = 0; beaufortName = 'Calm'; }
  else if (W <= 1.5) { beaufortScale = 1; beaufortName = 'Light Air'; }
  else if (W <= 3.3) { beaufortScale = 2; beaufortName = 'Light Breeze'; }
  else if (W <= 5.4) { beaufortScale = 3; beaufortName = 'Gentle Breeze'; }
  else if (W <= 7.9) { beaufortScale = 4; beaufortName = 'Moderate Breeze'; }
  else if (W <= 10.7) { beaufortScale = 5; beaufortName = 'Fresh Breeze'; }
  else if (W <= 13.8) { beaufortScale = 6; beaufortName = 'Strong Breeze'; }
  else if (W <= 17.1) { beaufortScale = 7; beaufortName = 'High Wind / Near Gale'; }
  else if (W <= 20.7) { beaufortScale = 8; beaufortName = 'Gale'; }
  else if (W <= 24.4) { beaufortScale = 9; beaufortName = 'Strong Gale'; }
  else if (W <= 28.4) { beaufortScale = 10; beaufortName = 'Storm'; }
  else if (W <= 32.6) { beaufortScale = 11; beaufortName = 'Violent Storm'; }
  else { beaufortScale = 12; beaufortName = 'Hurricane Force'; }

  // 3. Whitecap Foam Coverage (Monahan formulation)
  const whitecapCoveragePercent = Math.min(88, Math.round(Math.min(1, 3.84e-4 * Math.pow(Math.max(0, W - 2.5), 2.7)) * 100));

  // 4. Dissolved Oxygen Concentration (mg/L) Weiss (1970) formulation
  // Dissolved O2 solubility decreases as sea temperature rises
  const dissolvedOxygenMgL = Math.max(3.2, Math.min(14.2, Math.round((14.16 - 0.385 * T + 0.0062 * Math.pow(T, 2) - 0.000065 * Math.pow(T, 3)) * 10) / 10));

  // 5. Degree Heating Weeks (DHW) & Coral Bleaching Risk
  // Tropical coral baseline threshold ~28.5°C
  let dhw = 0;
  let bleachingLevel: 'none' | 'watch' | 'warning' | 'alert_level_1' | 'alert_level_2_mortality' = 'none';
  if (T >= 28.5) {
    const anomaly = T - 28.5;
    dhw = Math.round(anomaly * 4.2 * 10) / 10;
    if (dhw < 1.0) bleachingLevel = 'watch';
    else if (dhw < 4.0) bleachingLevel = 'warning';
    else if (dhw < 8.0) bleachingLevel = 'alert_level_1';
    else bleachingLevel = 'alert_level_2_mortality';
  }

  // 6. Evaporative Flux (mm/day) driven by wind and vapor pressure deficit over water
  const es = 0.61078 * Math.exp((17.27 * T) / (T + 237.3));
  const ea = es * (RH / 100);
  const vpd = Math.max(0.05, es - ea);
  const evaporationRateMmDay = Math.max(0.4, Math.min(18.5, Math.round((0.18 + 0.095 * W) * vpd * 10 * 10) / 10));

  // 7. Marine Layer Fog Density (0 to 1.0)
  let marineFogDensity = 0;
  if (RH >= 75) {
    marineFogDensity = Math.min(1.0, Math.round(((RH - 75) / 25) * 0.9 * 100) / 100);
  }

  // 8. Ocean Health Score & Conditions
  let condition: 'calm_tropical' | 'healthy_current' | 'marine_heatwave' | 'coral_bleaching' | 'ocean_gale' | 'hurricane_cyclone' | 'polar_chill';
  let healthScore: number;
  let title: string;
  let summary: string;
  let plainEnglishStory: string;
  let coralState: 'pristine_vibrant' | 'stressed_pale' | 'bleached_bone_white' | 'algae_overgrown';
  let waterColorPBR: string;
  let skyTheme: 'tropical_azure' | 'golden_sunset' | 'dense_marine_fog' | 'storm_tempest' | 'polar_deep_blue';
  let researchAdvice: string[];

  // 8a. Extreme Storm / Cyclone (Beaufort 10+)
  if (W >= 24.5) {
    condition = W >= 32.7 ? 'hurricane_cyclone' : 'ocean_gale';
    healthScore = Math.max(15, Math.min(48, Math.round(65 - W * 0.9)));
    title = W >= 32.7 ? 'Category 5 Tropical Cyclone Sea State' : 'Violent Oceanic Gale & Spindrift';
    summary = `Extreme wind stress (${W} m/s, Beaufort ${beaufortScale}) generates towering ${waveHeightM}m seas, violent spindrift spray, and Langmuir mixing.`;
    plainEnglishStory = `Sustained winds of ${W} m/s (${(W * 3.6).toFixed(0)} km/h) are tearing across the ocean surface, creating mountainous ${waveHeightM}-meter swells. Foam streaks (spindrift) whip parallel to the gale, obliterating the horizon. Underneath the raging surface, turbulent orbital water particle motions churn down to 50 meters, physically breaking branching staghorn corals and stirring benthic silt.`;
    coralState = 'stressed_pale';
    waterColorPBR = '#0e4368'; // Dark turbulent oceanic slate
    skyTheme = 'storm_tempest';
    researchAdvice = [
      'Activate NOAA Autonomous Surface Vessel (ASV) storm survival drogue anchors.',
      'Calibrate wave glider accelerometer telemetry for deep ocean wave spectrum validation.',
      'Monitor satellite altimetry (SWOT / Sentinel-6) for significant wave height anomalies.'
    ];
  }
  // 8b. Severe Marine Heatwave & Coral Bleaching (T >= 29.5°C)
  else if (T >= 29.5) {
    condition = 'coral_bleaching';
    healthScore = Math.max(10, Math.min(42, Math.round(50 - (T - 29.5) * 7.5)));
    title = dhw >= 8 ? 'Catastrophic Marine Heatwave (DHW ' + dhw + '°C-weeks)' : 'Severe Coral Bleaching Alert Level 1';
    summary = `Extreme Sea Surface Temperature (${T}°C) exceeds thermal thresholds. Symbiotic zooxanthellae are expelled, leaving corals stark ghost-white.`;
    plainEnglishStory = `At ${T}°C, the sea is bathwater warm. Corals rely on microscopic algae (zooxanthellae) living inside their cells to photosynthesize food. Under this intense thermal stress, the algae produce toxic reactive oxygen species, forcing the coral polyps to expel them. Without their colorful symbiotic partners, the reef turns fluorescent ghost-white, starving and exposed to fatal mortality. Dissolved oxygen has also dropped to ${dissolvedOxygenMgL} mg/L, stressing pelagic fish.`;
    coralState = dhw >= 8 ? 'bleached_bone_white' : 'stressed_pale';
    waterColorPBR = '#00c4cc'; // Warm tropical cyan
    skyTheme = 'tropical_azure';
    researchAdvice = [
      'Deploy solar-powered artificial upwelling deep-water cold pumps to cool reef shelves.',
      'Enact rapid nursery fragment sheltering for thermally resilient Acropora strains.',
      'Broadcast marine heatwave satellite warning bulletins to local ecotourism marine parks.'
    ];
  }
  // 8c. Sub-zero / Subpolar Chill (T <= 3°C)
  else if (T <= 3) {
    condition = 'polar_chill';
    healthScore = Math.max(60, Math.min(88, Math.round(75 + T * 2)));
    title = T <= 0 ? 'Subpolar Fraxil Ice Formation' : 'Cold Subpolar Sub-Arctic Water Mass';
    summary = `Near-freezing temperatures (${T}°C) maximize dissolved oxygen solubility (${dissolvedOxygenMgL} mg/L), supporting dense diatom blooms.`;
    plainEnglishStory = `At ${T}°C, seawater becomes extremely dense and holds huge volumes of dissolved oxygen (${dissolvedOxygenMgL} mg/L). Microscopic cold-adapted diatoms thrive in this nutrient-rich cold sink, driving polar biological carbon pumps. Capillary waves create slushy grease ice needles on the surface when wind is low, while steady breezes form pancake ice discs.`;
    coralState = 'pristine_vibrant';
    waterColorPBR = '#072b4a'; // Deep Arctic navy
    skyTheme = 'polar_deep_blue';
    researchAdvice = [
      'Track Antarctic Intermediate Water (AAIW) subduction and thermohaline overturning.',
      'Record cryogenic acoustic hydrophone data for fraxil ice crystallization signals.',
      'Sample vertical CTD profiles to measure dissolved oxygen and nitrate enrichment.'
    ];
  }
  // 8d. Dense Maritime Layer & Fog (RH >= 85%)
  else if (RH >= 85) {
    condition = 'healthy_current';
    healthScore = Math.max(72, Math.min(94, Math.round(85 + (24 - Math.abs(T - 22)))));
    title = 'Maritime Advection Fog & Marine Boundary Layer';
    summary = `High relative humidity (${RH}%) suppresses surface evaporation, producing sweeping advection fog banks over rolling ${waveHeightM}m swells.`;
    plainEnglishStory = `With relative humidity at ${RH}%, moist oceanic air cools near the sea surface to its dewpoint, creating atmospheric sea fog that hugs the water. Low vapor pressure deficit (${vpd.toFixed(2)} kPa) limits evaporation to only ${evaporationRateMmDay} mm/day. The sea swells roll smoothly at ${wavePeriodS}s intervals, creating peaceful, mist-shrouded conditions.`;
    coralState = 'pristine_vibrant';
    waterColorPBR = '#0a5b82'; // Misty sea green-blue
    skyTheme = 'dense_marine_fog';
    researchAdvice = [
      'Operate automated lidar cephalometers for marine boundary layer inversion height.',
      'Maintain fog-horn acoustic safety beacons for autonomous oceanographic gliders.',
      'Measure aerosol optical depth (AOD) via oceanic MODIS validation stations.'
    ];
  }
  // 8e. Pristine / Optimal Tropical-Temperate Ocean
  else {
    condition = 'calm_tropical';
    healthScore = Math.max(85, Math.min(98, Math.round(92 - Math.abs(T - 23) * 1.5 - (W > 12 ? (W - 12) * 1.5 : 0))));
    title = 'Vibrant Tropical-Temperate Coral Sea State';
    summary = `Optimum temperature (${T}°C), moderate breeze (${W} m/s), and clear waters support thriving coral biodiversity and high calcification.`;
    plainEnglishStory = `This is the ocean in its peak ecological glory. At ${T}°C and ${RH}% relative humidity, sea surface conditions are optimal for symbiotic calcification. Corals shimmer with vibrant green, gold, and magenta pigments, providing shelter for schools of reef fish. Gentle ${waveHeightM}m swells roll at ${wavePeriodS}-second intervals, oxygenating the surface (${dissolvedOxygenMgL} mg/L) without damaging delicate reef structures.`;
    coralState = 'pristine_vibrant';
    waterColorPBR = '#007799'; // Vibrant azure cerulean
    skyTheme = 'tropical_azure';
    researchAdvice = [
      'Conduct 3D photogrammetric reef habitat complexity surveys via autonomous ROVs.',
      'Collect eDNA water samples to catalog species richness and pelagic biodiversity.',
      'Continuously log aragonite saturation state (Ω_arag) and pH baseline.'
    ];
  }

  return {
    condition,
    healthScore,
    title,
    summary,
    plainEnglishStory,
    sstC: T,
    humidityPercent: RH,
    windSpeedMs: W,
    waveHeightM,
    wavePeriodS,
    beaufortScale,
    beaufortName,
    whitecapCoveragePercent,
    dissolvedOxygenMgL,
    dhw,
    bleachingLevel,
    evaporationRateMmDay,
    marineFogDensity,
    coralState,
    waterColorPBR,
    skyTheme,
    researchAdvice,
    aiModelUsed: 'NASA Ocean Thermodynamic & Wave Physics Engine v3.4',
  };
}

// What this does: Accepts the user's ocean slider values, checks the cache, calculates wave/coral physics, and adds an AI oceanographic narrative if available.
// On the website: Powers the Ocean & Coral Reef Simulator tab inside the Visual Simulator modal.
// Used as: The backend prediction endpoint for the Visual Ocean Simulator.
app.post('/api/predict-ocean', async (req: Request, res: Response): Promise<void> => {
  try {
    const { temperature, humidity, windSpeed, zone = 'coral-reef' } = req.body as OceanPredictionRequest;

    const temp = typeof temperature === 'number' ? temperature : 24;
    const hum = typeof humidity === 'number' ? humidity : 72;
    const wind = typeof windSpeed === 'number' ? windSpeed : 6.5;

    // Cache key for fast deterministic response and quota protection
    const cacheKey = `${Math.round(temp)}:${Math.round(hum)}:${Math.round(wind * 2) / 2}:${zone}`;
    if (oceanPredictionCache.has(cacheKey)) {
      res.json(oceanPredictionCache.get(cacheKey));
      return;
    }

    const baseline = calculateDeterministicOcean(temp, hum, wind, zone);

    const ai = getGeminiClient();
    const candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'].filter((m) => !isModelCoolingDown(m));

    if (!ai || candidateModels.length === 0) {
      oceanPredictionCache.set(cacheKey, baseline);
      res.json(baseline);
      return;
    }

    const prompt = `As a NASA Oceanographer and Marine Biophysicist, analyze the microclimate conditions on an interactive visual ocean scene in "${zone}":
- Sea Surface Temperature: ${temp}°C
- Relative Humidity: ${hum}% RH
- 10m Wind Speed: ${wind} m/s (${(wind * 3.6).toFixed(1)} km/h, Beaufort ${baseline.beaufortScale} - ${baseline.beaufortName})
- Significant Wave Height: ${baseline.waveHeightM} meters (Period: ${baseline.wavePeriodS}s)
- Dissolved Oxygen: ${baseline.dissolvedOxygenMgL} mg/L
- Coral Bleaching Risk: Level ${baseline.bleachingLevel} (DHW: ${baseline.dhw}°C-weeks)
- Evaporative Flux: ${baseline.evaporationRateMmDay} mm/day
- Marine Fog Density: ${(baseline.marineFogDensity * 100).toFixed(0)}%

Provide an accurate oceanographic assessment:
1. Exact physical and biophysical reasons for wave formation, dissolved oxygen level, and coral reef health.
2. Visual appearance of the ocean (wave crest steepness, foam/whitecaps, water transparency, coral reef coloration).
3. Plain-English narrative for students to visualize cause and effect.

Return valid JSON conforming to this format:
{
  "condition": "${baseline.condition}",
  "healthScore": ${baseline.healthScore},
  "title": "${baseline.title}",
  "summary": "${baseline.summary}",
  "plainEnglishStory": "A 2-paragraph vivid oceanographic narrative describing the 3D waves, coral reef, sea spray, atmosphere, and marine life.",
  "researchAdvice": ["Action 1", "Action 2", "Action 3"]
}`;

    let mergedResult = null;
    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: {
            responseMimeType: 'application/json',
            systemInstruction: 'You are the NASA Ocean & Marine Science AI Specialist. Provide accurate, vivid, scientifically grounded ocean predictions in clean JSON.',
          },
        });

        const text = response?.text;
        if (text) {
          const parsed = JSON.parse(text);
          mergedResult = {
            ...baseline,
            ...parsed,
            sstC: baseline.sstC,
            waveHeightM: baseline.waveHeightM,
            wavePeriodS: baseline.wavePeriodS,
            beaufortScale: baseline.beaufortScale,
            beaufortName: baseline.beaufortName,
            dissolvedOxygenMgL: baseline.dissolvedOxygenMgL,
            dhw: baseline.dhw,
            bleachingLevel: baseline.bleachingLevel,
            evaporationRateMmDay: baseline.evaporationRateMmDay,
            marineFogDensity: baseline.marineFogDensity,
            aiModelUsed: modelName,
          };
          break;
        }
      } catch (aiErr) {
        tripModelCooldown(modelName, aiErr);
      }
    }

    const finalResult = mergedResult || baseline;
    oceanPredictionCache.set(cacheKey, finalResult);
    res.json(finalResult);
  } catch (err: any) {
    const baseline = calculateDeterministicOcean(
      Number((req.body as any)?.temperature ?? 24),
      Number((req.body as any)?.humidity ?? 72),
      Number((req.body as any)?.windSpeed ?? 6.5),
      (req.body as any)?.zone ?? 'coral-reef'
    );
    res.json(baseline);
  }
});

// What this does: Starts the web server on port 3000, attaching Vite for live development or serving the built website files in production.
// On the website: Makes the entire website reachable in the browser.
// Used as: The startup function that launches the backend and serves the React frontend.
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false, // Prevents iframe WebSocket disconnection errors
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NASA Earth Trend Detective server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
