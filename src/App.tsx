/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { NASA_CLIMATE_REGIONS } from './data/nasaClimateData';
import { NASA_HUMIDITY_REGIONS } from './data/nasaHumidityData';
import { NASA_WIND_REGIONS } from './data/nasaWindData';
import { getNasaDatasetForBranch, NASA_INSTRUMENT_REGISTRY } from './data/nasaInstrumentVariables';
import { COUNTRIES_DATABASE, CountryClimateData } from './data/countriesData';
import {
  ClimateRegion,
  EarthDomain,
  GlobeLayers,
  ActiveInspectorItem,
  CriticalAnomalyAlert,
  DataBranch,
} from './types/climate';
import { EarthGlobe } from './components/EarthGlobe';
import { SidebarDataPanel } from './components/SidebarDataPanel';
import { HeaderBar } from './components/HeaderBar';
import { TourModal } from './components/TourModal';
import { ExportReportModal } from './components/ExportReportModal';
import { FeedbackModal } from './components/FeedbackModal';
import { CountrySearchModal } from './components/CountrySearchModal';
import { ImpactInquiryModal } from './components/ImpactInquiryModal';
import { GlossaryModal } from './components/GlossaryModal';
import { ClimateDriversModal } from './components/ClimateDriversModal';
import { CriticalAnomalyToast } from './components/CriticalAnomalyToast';
import { ClimateAlertsModal } from './components/ClimateAlertsModal';
import { ClimateChatbotModal } from './components/ClimateChatbotModal';
import { HumanReportsModal } from './components/HumanReportsModal';
import { UserAuthModal } from './components/UserAuthModal';
import { ComplexityModeModal } from './components/ComplexityModeModal';
import { DownloadAppModal } from './components/DownloadAppModal';
import { DailyEcoAdviceModal } from './components/DailyEcoAdviceModal';
import { FieldNotebookModal } from './components/FieldNotebookModal';
import { MissionGuideModal } from './components/MissionGuideModal';
import { VisualFarmSimulatorModal } from './components/VisualFarmSimulatorModal';
import { GuidanceBanner } from './components/GuidanceBanner';
import { OnboardingWalkthrough } from './components/OnboardingWalkthrough';
import { ArchitectureUserFlowModal } from './components/ArchitectureUserFlowModal';
import { SpaceAlienBuddy } from './components/SpaceAlienBuddy';
import { AlienGuidedTutorial, ALIEN_TUTORIAL_STORAGE_KEY } from './components/AlienGuidedTutorial';
import { ClimateReportDossierModal } from './components/ClimateReportDossierModal';
import { TimelineControlDock } from './components/TimelineControlDock';
import { UnitSelectorModal } from './components/UnitSelectorModal';
import { AuthGateway } from './components/AuthGateway';
import { RegistrationIntroAnimation } from './components/RegistrationIntroAnimation';
import { useAuth } from './context/AuthContext';
import { detectCriticalAnomalyForTimeline } from './utils/anomalyDetector';
import { VoiceAnnouncementHUD, SpokenAnnouncement } from './components/VoiceAnnouncementHUD';
import { generateMonthChangeAnnouncement, speakUtterance, stopSpeaking } from './utils/speechAnnouncer';
import { ImpactScenario } from './data/impactScenarios';
import { soundFx } from './utils/audioSynth';
import { CheckSquare, Square, Layers, Globe, Thermometer, ShieldAlert, X, ChevronDown, ChevronUp, Clock, Sliders } from 'lucide-react';

// What this does: This is the main controller component that holds everything together in one place.
// On the website: It controls the 3D Earth, top bar, timeline, side info panel, and every popup window.
// Used as: The central brain of the website so all buttons and screens stay in sync.
export default function App() {
  // What this does: Remembers which country, climate hotspot, or ocean/land point the user clicked.
  // On the website: When it has a value, the side panel slides open to show weather numbers and charts for that spot.
  // Used as: The active place tracker (starts empty so the screen opens cleanly with just the Earth).
  const [selectedLocation, setSelectedLocation] = useState<ActiveInspectorItem | null>(null);

  // What this does: Remembers which Earth zone filter is chosen (All, Cryosphere/Ice, Biosphere/Forests, etc.).
  // On the website: Filters which pins appear on top of the 3D Earth globe.
  // Used as: A topic filter for the climate pins.
  const [selectedDomain, setSelectedDomain] = useState<EarthDomain | 'All'>('All');

  // What this does: Keeps a yes/no list of which NASA hotspot pins are turned on or off.
  // On the website: Lets the user hide or show specific hotspots in the Layers box.
  // Used as: The on/off switchboard for individual climate hotspots.
  const [visibleHotspotIds, setVisibleHotspotIds] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(NASA_CLIMATE_REGIONS.map((r) => [r.id, true]))
  );

  // What this does: Tracks the year (2000 to 2040), month (1 to 12), and whether the timeline is auto-playing.
  // On the website: Moves the timeline bar at the bottom and changes colors/numbers on the 3D Earth (past vs future AI forecast).
  // Used as: The time-travel clock of the website (starts at November 2026, today's date).
  const [year, setYear] = useState<number>(2026);
  const [month, setMonth] = useState<number>(11); // Default November 2026 (Today marker)
  const [isPlayingTimeline, setIsPlayingTimeline] = useState<boolean>(false);
  const isAiPrediction = year > 2026 || (year === 2026 && month > 11);

  // What this does: Controls which visual layers are painted onto the 3D Earth (clouds, night lights, heat colors, glow).
  // On the website: Turns clouds, city lights, pins, and temperature heatmaps on or off on the globe.
  // Used as: The visual map settings for the 3D planet.
  const [layers, setLayers] = useState<GlobeLayers>({
    pins: true,
    heatmaps: true,
    thermalHeatmap: true,
    globalTempHeatmap: true,
    clouds: true,
    nightLights: true,
    aiVectors: true,
    atmosphereGlow: true,
  });

  // What this does: Controls whether the 3D Earth spins by itself and how fast it turns.
  // On the website: Makes the planet slowly spin in space until the user pauses it or changes speed.
  // Used as: The globe spin and speed control.
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [rotationSpeed, setRotationSpeed] = useState<number>(1.0);

  // What this does: Remembers if the floating space alien friend is turned on or hidden, saving the choice in browser storage.
  // On the website: Shows or hides the little animated alien floating near the globe.
  // Used as: A fun helper buddy toggle that remembers what the user picked even after refreshing.
  const [isAlienActive, setIsAlienActive] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nasa_alien_active');
      return saved !== 'false';
    }
    return true;
  });

  // What this does: Flips the floating alien helper between visible and hidden and saves that choice.
  // On the website: Clicking the alien toggle in the timeline dock makes the alien appear or disappear.
  // Used as: The button handler for turning the alien helper on and off.
  const handleToggleAlien = useCallback(() => {
    setIsAlienActive((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('nasa_alien_active', String(next));
      }
      return next;
    });
  }, []);

  // What this does: Stores whether the guided planetary tour is running, which stop we are on, and if it moves automatically.
  // On the website: Shows a tour card that flies the camera from one hotspot to the next around the Earth.
  // Used as: The slideshow controller for the guided globe tour.
  const [isTouring, setIsTouring] = useState<boolean>(false);
  const [tourIndex, setTourIndex] = useState<number>(0);
  const [isAutoAdvancingTour, setIsAutoAdvancingTour] = useState<boolean>(false);

  // What this does: Pulls the logged-in user, reading difficulty (Simple/Normal/Complicated), and climate branch (Temp/Humidity/Wind) from AuthContext.
  // On the website: Keeps the user signed in and switches the whole site's reading level and weather topic.
  // Used as: The bridge to the user's saved account and preferences.
  const { currentUser, dataMode, setDataMode, dataBranch, setDataBranch, hasCompletedOnboarding } = useAuth();

  // What this does: Picks the right list of NASA hotspots (Temperature, Humidity, or Wind) based on what branch is active.
  // On the website: Changes the pins and data on the globe when you switch between Temperature, Humidity, and Wind.
  // Used as: A smart dataset selector so we don't recalculate the list on every tiny screen update.
  const activeDataset = useMemo(() => {
    return getNasaDatasetForBranch(dataBranch, NASA_CLIMATE_REGIONS, NASA_HUMIDITY_REGIONS, NASA_WIND_REGIONS);
  }, [dataBranch]);

  // What this does: Switches the app between Air Temperature, Atmospheric Humidity, and Surface Wind mode.
  // On the website: Plays a soft chime, recolors the globe, and switches all charts and numbers to the new weather topic.
  // Used as: The click handler for the Temperature / Humidity / Wind buttons in the top bar.
  const handleSelectBranch = useCallback((newBranch: DataBranch) => {
    if (newBranch === dataBranch) return;
    soundFx.playTourChime();
    setDataBranch(newBranch);
    const newPool = getNasaDatasetForBranch(newBranch, NASA_CLIMATE_REGIONS, NASA_HUMIDITY_REGIONS, NASA_WIND_REGIONS);
    // Only update selected location if one was already actively inspected
    setSelectedLocation((prev) => (prev ? { type: 'hotspot', ...newPool[0] } : null));
    setVisibleHotspotIds(Object.fromEntries(newPool.map((r) => [r.id, true])));
  }, [dataBranch, setDataBranch]);

  // What this does: A group of true/false switches that open or close each popup window and menu in the app.
  // On the website: Controls which modal dialog (Search, Chatbot, Reports, Notebook, Simulators, Units, etc.) is currently on screen.
  // Used as: All the open/close switches for every popup window on the website.
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState<boolean>(false);
  const [isCountrySearchOpen, setIsCountrySearchOpen] = useState<boolean>(false);
  const [isImpactInquiryOpen, setIsImpactInquiryOpen] = useState<boolean>(false);
  const [isGlossaryOpen, setIsGlossaryOpen] = useState<boolean>(false);
  const [isClimateDriversOpen, setIsClimateDriversOpen] = useState<boolean>(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState<boolean>(false);
  const [isHumanReportsOpen, setIsHumanReportsOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isComplexityModalOpen, setIsComplexityModalOpen] = useState<boolean>(false);
  const [isDownloadAppModalOpen, setIsDownloadAppModalOpen] = useState<boolean>(false);
  const [isTaskbarOpen, setIsTaskbarOpen] = useState<boolean>(true);
  const [isMissionGuideOpen, setIsMissionGuideOpen] = useState<boolean>(false);
  const [isNotebookOpen, setIsNotebookOpen] = useState<boolean>(false);
  const [isDailyAdviceOpen, setIsDailyAdviceOpen] = useState<boolean>(false);
  const [selectedCountryForAdvice, setSelectedCountryForAdvice] = useState<CountryClimateData | null>(() => COUNTRIES_DATABASE[0]);
  const [activeReportIdForModal, setActiveReportIdForModal] = useState<string | undefined>(undefined);
  const [isQuickLayersOpen, setIsQuickLayersOpen] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isVisualFarmOpen, setIsVisualFarmOpen] = useState<boolean>(false);
  const [visualSimulatorEnv, setVisualSimulatorEnv] = useState<'farm' | 'polar'>('farm');
  const [isGuidanceOpen, setIsGuidanceOpen] = useState<boolean>(false);
  const [isOnboardingWalkthroughOpen, setIsOnboardingWalkthroughOpen] = useState<boolean>(false);
  const [isArchitectureModalOpen, setIsArchitectureModalOpen] = useState<boolean>(false);
  const [isClimateReportOpen, setIsClimateReportOpen] = useState<boolean>(false);
  const [isTimelineCollapsed, setIsTimelineCollapsed] = useState<boolean>(false);
  const [isUnitSelectorOpen, setIsUnitSelectorOpen] = useState<boolean>(false);

  // What this does: Controls whether the full-screen Phoenix intro video animation is playing right after login/signup.
  // On the website: Shows the Phoenix video transition before revealing the 3D Earth app.
  // Used as: The screen switch for the post-registration intro animation.
  const [showRegistrationIntro, setShowRegistrationIntro] = useState<boolean>(false);

  // What this does: Controls whether the step-by-step Alien tutorial overlay is open.
  // On the website: Shows the alien flying over buttons and explaining how to use the website.
  // Used as: The switch for the interactive tutorial (starts false so it waits until login + intro finish).
  const [isAlienTutorialOpen, setIsAlienTutorialOpen] = useState<boolean>(false);

  // What this does: Checks if a brand-new user just signed in and opens the welcome walkthrough if nothing else is playing.
  // On the website: Automatically greets first-time users with a short tour once the intro ends.
  // Used as: The automatic first-time welcome trigger.
  useEffect(() => {
    if (currentUser && !hasCompletedOnboarding && !isAlienTutorialOpen && !showRegistrationIntro) {
      setIsOnboardingWalkthroughOpen(true);
    }
  }, [currentUser, hasCompletedOnboarding, isAlienTutorialOpen, showRegistrationIntro]);




  // What this does: Stores the current climate warning popup, whether alerts are muted, and a memory list of alerts already shown.
  // On the website: Shows a small warning banner when the timeline hits a dangerous climate year (like +1.5°C).
  // Used as: The climate danger notification system.
  const [activeAnomalyAlert, setActiveAnomalyAlert] = useState<CriticalAnomalyAlert | null>(null);
  const [alertsMuted, setAlertsMuted] = useState<boolean>(false);
  const [isClimateAlertsModalOpen, setIsClimateAlertsModalOpen] = useState<boolean>(false);
  const firedAnomalyIdsRef = React.useRef<Set<string>>(new Set<string>());

  // What this does: Turns all button click sounds and alert chimes on or off.
  // On the website: Controls whether you hear gentle audio feedback when pressing buttons.
  // Used as: The global sound mute/unmute toggle.
  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundFx.enabled = next;
    if (next) soundFx.playTick();
  };

  // What this does: Watches the selected year and month; if that date matches a famous climate disaster or threshold, it pops up an alert.
  // On the website: Shows a notification card at the bottom-right when scrolling through major climate milestones.
  // Used as: An automatic milestone detector during time travel.
  useEffect(() => {
    if (alertsMuted) return;

    // Detect if this year or month is an anomaly milestone
    const alert = detectCriticalAnomalyForTimeline(year, month);
    if (!alert) return;

    // Debounce: check if we already fired this specific alert in the current timeline pass
    const alertKey = `${alert.id}-${year}`;
    if (firedAnomalyIdsRef.current.has(alertKey)) return;

    firedAnomalyIdsRef.current.add(alertKey);

    // Limit memory set size
    if (firedAnomalyIdsRef.current.size > 50) {
      firedAnomalyIdsRef.current.clear();
      firedAnomalyIdsRef.current.add(alertKey);
    }

    // Set active alert toast
    setActiveAnomalyAlert(alert);

    // Subtle audio chime if sound is enabled
    if (soundEnabled) {
      soundFx.playAnomalyAlert();
    }
  }, [year, month, alertsMuted, soundEnabled]);

  // What this does: Jumps the timeline and the 3D Earth camera straight to the place where a climate alert happened.
  // On the website: Clicking "Inspect" on a climate warning flies the globe to that spot and opens its data card.
  // Used as: The shortcut button handler for inspecting an alert location.
  const handleInspectAnomaly = useCallback((alert: CriticalAnomalyAlert) => {
    // 1. Pause timeline playback if running, so user can inspect without interruption
    setIsPlayingTimeline(false);

    // 2. Set year & month to the anomaly event
    setYear(alert.year);
    if (alert.month) {
      setMonth(alert.month);
    }

    // 3. Find matching hotspot or set location coordinates (smoothly focuses 3D globe camera)
    if (alert.regionId) {
      const matchRegion = NASA_CLIMATE_REGIONS.find((r) => r.id === alert.regionId);
      if (matchRegion) {
        setSelectedLocation({ type: 'hotspot', ...matchRegion });
      }
    } else {
      setSelectedLocation({
        type: 'custom',
        id: alert.id,
        name: alert.locationName,
        lat: alert.lat,
        lng: alert.lng,
        calculatedTempC: 15.6,
        anomalyC: 1.8,
        baselineTempC: 14.0,
        warmingRateDecadeC: 0.35,
        color: '#f43f5e',
        flagEmoji: '🌐',
        famousLandmark: alert.title,
        landmarkIcon: '⚠️',
        temperatureChangeReasons: [
          alert.physicalDriver,
          alert.thresholdBreached,
          alert.summary,
        ],
      });
    }

    // Dismiss toast
    setActiveAnomalyAlert(null);
    soundFx.playTourChime();
  }, []);

  // What this does: Holds the spoken voice summary text and whether the computer voice is talking right now.
  // On the website: Powers the small voice banner that lets you listen to weather updates out loud.
  // Used as: The state for the optional voice narrator (never talks unless you press Listen).
  const [spokenAnnouncement, setSpokenAnnouncement] = useState<SpokenAnnouncement | null>(null);
  const [isSpeakingVoice, setIsSpeakingVoice] = useState<boolean>(false);
  const prevMonthRef = React.useRef<number>(month);

  // What this does: Whenever you switch to a new month, it writes a fresh spoken summary in the background without auto-playing it.
  // On the website: Updates the text inside the voice box so it matches the new month you picked.
  // Used as: The quiet updater for the spoken weather script.
  useEffect(() => {
    // Only react when month actually changes
    if (prevMonthRef.current === month) return;

    const prevM = prevMonthRef.current;
    prevMonthRef.current = month;

    // Immediately stop any currently playing voice when switching months
    stopSpeaking();
    setIsSpeakingVoice(false);

    // Prepare announcement data quietly (Audio does NOT play automatically)
    const announcement = generateMonthChangeAnnouncement(selectedLocation, year, prevM, month);
    setSpokenAnnouncement({ ...announcement, isSpeaking: false });
  }, [month, selectedLocation, year]);

  // What this does: Reads the current month's climate report out loud, or stops talking if it is already speaking.
  // On the website: Runs when you click the Voice / Listen button in the menu or timeline.
  // Used as: The Play/Stop button handler for spoken voice narration.
  const handleTogglePlayVoice = useCallback(() => {
    if (isSpeakingVoice) {
      stopSpeaking();
      setIsSpeakingVoice(false);
      setSpokenAnnouncement((a) => (a ? { ...a, isSpeaking: false } : null));
      return;
    }

    const prevM = month === 1 ? 12 : month - 1;
    const announcement =
      spokenAnnouncement || generateMonthChangeAnnouncement(selectedLocation, year, prevM, month);

    setIsSpeakingVoice(true);
    setSpokenAnnouncement({ ...announcement, isSpeaking: true });

    speakUtterance(announcement.text, {
      onStart: () => {
        setIsSpeakingVoice(true);
        setSpokenAnnouncement((a) => (a ? { ...a, isSpeaking: true } : null));
      },
      onEnd: () => {
        setIsSpeakingVoice(false);
        setSpokenAnnouncement((a) => (a ? { ...a, isSpeaking: false } : null));
      },
      onError: () => {
        setIsSpeakingVoice(false);
        setSpokenAnnouncement((a) => (a ? { ...a, isSpeaking: false } : null));
      },
    });
  }, [isSpeakingVoice, spokenAnnouncement, selectedLocation, year, month]);

  // What this does: Filters the climate hotspots to show only the Earth domain the user picked (or all of them).
  // On the website: Controls which colored pins stay visible on the 3D Earth.
  // Used as: The domain filter list fed into the 3D globe and timeline dock.
  const filteredRegions = useMemo(() => {
    if (selectedDomain === 'All') return activeDataset;
    return activeDataset.filter((r) => r.domain === selectedDomain);
  }, [selectedDomain, activeDataset]);

  // What this does: Plays a gentle futuristic chime the moment the timeline moves past Nov 2026 into future AI predictions.
  // On the website: Gives a subtle sound cue when the user crosses from real history into AI climate forecasting.
  // Used as: An audio marker for entering Prediction mode.
  const prevAiRef = React.useRef(isAiPrediction);
  useEffect(() => {
    if (isAiPrediction && !prevAiRef.current) {
      soundFx.playPredictionAlert();
    }
    prevAiRef.current = isAiPrediction;
  }, [isAiPrediction]);

  // What this does: Automatically jumps to the next hotspot every 8 seconds when the user turns on Tour Auto-Play.
  // On the website: Rotates the globe from one climate hotspot to another like a hands-free documentary.
  // Used as: The timer behind the Auto-Advance switch in the Tour popup.
  useEffect(() => {
    if (!isTouring || !isAutoAdvancingTour) return;

    const timer = setInterval(() => {
      setTourIndex((prev) => {
        const next = (prev + 1) % activeDataset.length;
        setSelectedLocation({ type: 'hotspot', ...activeDataset[next] });
        soundFx.playTourChime();
        return next;
      });
    }, 8000);

    return () => clearInterval(timer);
  }, [isTouring, isAutoAdvancingTour, activeDataset]);

  // What this does: Starts the guided planetary tour at stop #1, or stops the tour if it is already running.
  // On the website: Opens the Tour box at the bottom and flies the 3D Earth to the first hotspot.
  // Used as: The main "Planetary Tour" button handler.
  const handleStartTour = () => {
    if (isTouring) {
      setIsTouring(false);
      setIsAutoAdvancingTour(false);
    } else {
      setIsTouring(true);
      setTourIndex(0);
      setSelectedLocation({ type: 'hotspot', ...activeDataset[0] });
      soundFx.playTourChime();
    }
  };

  // What this does: Moves the guided tour forward one hotspot and flies the camera there.
  // On the website: Triggered by the "Next" button inside the Tour popup.
  // Used as: The next-stop control during the tour.
  const handleTourNext = () => {
    const nextIdx = (tourIndex + 1) % activeDataset.length;
    setTourIndex(nextIdx);
    setSelectedLocation({ type: 'hotspot', ...activeDataset[nextIdx] });
    soundFx.playTourChime();
  };

  // What this does: Moves the guided tour back one hotspot.
  // On the website: Triggered by the "Previous" button inside the Tour popup.
  // Used as: The previous-stop control during the tour.
  const handleTourPrev = () => {
    const prevIdx = (tourIndex - 1 + activeDataset.length) % activeDataset.length;
    setTourIndex(prevIdx);
    setSelectedLocation({ type: 'hotspot', ...activeDataset[prevIdx] });
    soundFx.playTourChime();
  };

  // What this does: Turns off the guided tour and cancels auto-advance.
  // On the website: Closes the Tour popup window.
  // Used as: The close button handler for the Tour.
  const handleTourClose = () => {
    setIsTouring(false);
    setIsAutoAdvancingTour(false);
  };

  // What this does: Flips a 3D Earth visual layer (like clouds, pins, or heat colors) on or off.
  // On the website: Makes that layer appear or disappear immediately on the planet.
  // Used as: The click handler for layer checkboxes in the Layers panel and Timeline menu.
  const handleToggleLayer = (layerKey: keyof GlobeLayers) => {
    setLayers((prev) => {
      const nextVal = !prev[layerKey];
      const updated = { ...prev, [layerKey]: nextVal };
      // Keep thermalHeatmap and globalTempHeatmap in lockstep if either is toggled
      if (layerKey === 'thermalHeatmap' || layerKey === 'globalTempHeatmap') {
        updated.thermalHeatmap = nextVal;
        updated.globalTempHeatmap = nextVal;
      }
      return updated;
    });
  };

  // What this does: Shows or hides one single hotspot pin on the 3D Earth.
  // On the website: Lets the user turn individual places on or off in the Layers list.
  // Used as: The individual hotspot toggle switch.
  const handleToggleHotspot = (hotspotId: string) => {
    setVisibleHotspotIds((prev) => ({
      ...prev,
      [hotspotId]: prev[hotspotId] === false ? true : false,
    }));
  };

  // What this does: Turns ALL hotspot pins on or off at the same time.
  // On the website: Used by the "Select All" / "Clear All" buttons in the layer manager.
  // Used as: The bulk on/off switch for all pins.
  const handleSelectAllHotspots = (enabled: boolean) => {
    setVisibleHotspotIds(
      Object.fromEntries(activeDataset.map((r) => [r.id, enabled]))
    );
  };

  // What this does: Opens the side info panel for a hotspot pin the user clicked on the 3D globe.
  // On the website: Flies the camera to that hotspot and shows its temperature/humidity/wind details.
  // Used as: The click handler for hotspot pins on the 3D planet.
  const handleSelectRegion = (region: ClimateRegion) => {
    setSelectedLocation({ type: 'hotspot', ...region });
  };

  // What this does: Selects a country chosen from Search or the globe and remembers it for daily eco-tips too.
  // On the website: Zooms the 3D globe to that country and opens its full climate report card on the side.
  // Used as: The country picker handler used by Search and Daily Advice.
  const handleSelectCountry = (country: CountryClimateData) => {
    setSelectedLocation({ type: 'country', ...country, color: '#38bdf8' });
    setSelectedCountryForAdvice(country);
  };

  // What this does: Takes any latitude/longitude spot the user clicked on the 3D globe and checks if it is near a real country.
  // On the website: If you click near a country, it opens that country's card; if you click open ocean or remote land, it opens a custom coordinate card.
  // Used as: The globe surface click handler so clicking anywhere on Earth gives useful climate data.
  const handleSelectCoordinates = (lat: number, lng: number) => {
    // Check if close to a country in COUNTRIES_DATABASE
    let closestCountry: CountryClimateData | null = null;
    let minDistance = Infinity;

    for (const c of COUNTRIES_DATABASE) {
      const d = Math.hypot(c.lat - lat, c.lng - lng);
      if (d < minDistance) {
        minDistance = d;
        closestCountry = c;
      }
    }

    if (closestCountry && minDistance < 14.0) {
      setSelectedLocation({ type: 'country', ...closestCountry, color: '#38bdf8' });
      setSelectedCountryForAdvice(closestCountry);
    } else {
      // Custom clicked point on Earth
      setSelectedLocation({
        type: 'custom',
        id: `point-${lat.toFixed(1)}-${lng.toFixed(1)}`,
        name: `Earth Point (${lat >= 0 ? `${lat.toFixed(1)}°N` : `${Math.abs(lat).toFixed(1)}°S`}, ${lng >= 0 ? `${lng.toFixed(1)}°E` : `${Math.abs(lng).toFixed(1)}°W`})`,
        lat,
        lng,
        calculatedTempC: 0,
        anomalyC: 0,
        baselineTempC: 0,
        warmingRateDecadeC: 0.35,
        color: '#f59e0b',
      });
    }
  };

  // What this does: Runs a "What If?" climate scenario by jumping to the scenario's future year and flying to its affected place.
  // On the website: When the user clicks "Simulate" on a What-If card, the globe and timeline jump right into that future scenario.
  // Used as: The launcher for the "What If?" scenario simulator modal.
  const handleSimulateScenario = (scenario: ImpactScenario) => {
    setYear(scenario.approximateYearSSP245);
    if (scenario.associatedHotspotId) {
      const match = NASA_CLIMATE_REGIONS.find((r) => r.id === scenario.associatedHotspotId);
      if (match) {
        setSelectedLocation({ type: 'hotspot', ...match });
      }
    } else if (scenario.associatedRegionCoords) {
      handleSelectCoordinates(scenario.associatedRegionCoords.lat, scenario.associatedRegionCoords.lng);
    }
    setIsImpactInquiryOpen(false);
    soundFx.playPredictionAlert();
  };

  // What this does: Steps to the next hotspot in the list.
  // On the website: Powers the "Next" arrow inside the side data panel.
  // Used as: Quick hotspot-to-hotspot navigation.
  const handleSelectNextHotspot = () => {
    if (!selectedLocation || selectedLocation.type !== 'hotspot') {
      setSelectedLocation({ type: 'hotspot', ...filteredRegions[0] });
      return;
    }
    const curIdx = filteredRegions.findIndex((r) => r.id === selectedLocation.id);
    const nextIdx = (curIdx + 1) % filteredRegions.length;
    setSelectedLocation({ type: 'hotspot', ...filteredRegions[nextIdx] });
  };

  // What this does: Steps to the previous hotspot in the list.
  // On the website: Powers the "Previous" arrow inside the side data panel.
  // Used as: Backward hotspot-to-hotspot navigation.
  const handleSelectPrevHotspot = () => {
    if (!selectedLocation || selectedLocation.type !== 'hotspot') {
      setSelectedLocation({ type: 'hotspot', ...filteredRegions[filteredRegions.length - 1] });
      return;
    }
    const curIdx = filteredRegions.findIndex((r) => r.id === selectedLocation.id);
    const prevIdx = (curIdx - 1 + filteredRegions.length) % filteredRegions.length;
    setSelectedLocation({ type: 'hotspot', ...filteredRegions[prevIdx] });
  };

  // What this does: Clears the selected place so the 3D camera zooms back out to see the whole Earth.
  // On the website: Resets the globe view back to default space orbit.
  // Used as: The "Reset Camera" button handler.
  const handleResetCamera = useCallback(() => {
    setSelectedLocation(null);
  }, []);

  // What this does: Listens for keyboard keys: Left/Right arrows move the year, and Escape closes popups.
  // On the website: Lets desktop users step through years or close panels quickly with their keyboard.
  // Used as: A keyboard shortcut helper.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'ArrowRight') {
        setYear((y) => Math.min(2040, y + 1));
        soundFx.playTick();
      } else if (e.key === 'ArrowLeft') {
        setYear((y) => Math.max(2000, y - 1));
        soundFx.playTick();
      } else if (e.key === 'Escape') {
        setSelectedLocation(null);
        setIsTouring(false);
        setIsReportOpen(false);
        setIsFeedbackOpen(false);
        setIsCountrySearchOpen(false);
        setIsImpactInquiryOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // What this does: Picks the top 4 hotspots from the active branch to show in the small floating Layers box.
  // On the website: Gives a compact quick-toggle list at the bottom-left on desktop screens.
  // Used as: The shortcut data for the quick layers widget.
  const coreFourLayers = useMemo(() => {
    return activeDataset.slice(0, 4).map((r) => ({
      id: r.id,
      label: r.name.length > 24 ? `${r.name.slice(0, 22)}...` : r.name,
      color: r.color,
    }));
  }, [activeDataset]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans text-slate-100 select-none">
      {/* What this does: Draws the big interactive 3D Earth in the middle of the screen.
          On the website: Shows continents, clouds, heatmaps, city lights, pins, and satellites that you can spin and click.
          Used as: The main 3D planet view behind all menus. */}
      <EarthGlobe
        regions={filteredRegions}
        selectedLocation={selectedLocation}
        onSelectRegion={handleSelectRegion}
        onSelectCoordinates={handleSelectCoordinates}
        year={year}
        month={month}
        isAiPrediction={isAiPrediction}
        layers={layers}
        visibleHotspotIds={visibleHotspotIds}
        autoRotate={autoRotate}
        rotationSpeed={rotationSpeed}
        isPlayingTimeline={isPlayingTimeline}
        dataBranch={dataBranch}
      />

      {/* What this does: Renders the top navigation bar and smoothly slides it away if the user wants fullscreen Earth.
          On the website: Shows the NASA logo, Temperature/Humidity/Wind switches, More/Explore/Science/Reports/Mission buttons, Units, and Language button.
          Used as: The main top toolbar of the website. */}
      <div className={`transition-all duration-300 z-20 ${
        isTaskbarOpen ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
      }`}>
        <HeaderBar
          selectedDomain={selectedDomain}
          onSelectDomain={setSelectedDomain}
          onStartTour={handleStartTour}
          isTouring={isTouring}
          onOpenReport={() => setIsReportOpen(true)}
          onOpenFeedback={() => setIsFeedbackOpen(true)}
          onOpenCountrySearch={() => setIsCountrySearchOpen(true)}
          onOpenImpactInquiry={() => setIsImpactInquiryOpen(true)}
          onOpenGlossary={() => setIsGlossaryOpen(true)}
          onOpenClimateAlerts={() => setIsClimateAlertsModalOpen(true)}
          onOpenChatbot={() => setIsChatbotOpen(!isChatbotOpen)}
          isChatbotOpen={isChatbotOpen}
          onOpenHumanReports={() => setIsHumanReportsOpen(true)}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onOpenComplexityMode={() => setIsComplexityModalOpen(true)}
          onOpenDownloadApp={() => setIsDownloadAppModalOpen(true)}
          onOpenNotebook={() => setIsNotebookOpen(true)}
          onOpenMissionGuide={() => setIsMissionGuideOpen(true)}
          onOpenOnboardingWalkthrough={() => setIsOnboardingWalkthroughOpen(true)}
          onOpenDailyAdvice={() => setIsDailyAdviceOpen(true)}
          onOpenVisualPlaces={(place = 'farm') => {
            setVisualSimulatorEnv(place);
            setIsVisualFarmOpen(true);
          }}
          onOpenVisualFarm={() => {
            setVisualSimulatorEnv('farm');
            setIsVisualFarmOpen(true);
          }}
          onOpenVisualPolar={() => {
            setVisualSimulatorEnv('polar');
            setIsVisualFarmOpen(true);
          }}
          isTaskbarOpen={isTaskbarOpen}
          onToggleTaskbar={() => {
            soundFx.playTick();
            setIsTaskbarOpen(!isTaskbarOpen);
          }}
          dataBranch={dataBranch}
          onSelectBranch={handleSelectBranch}
          soundEnabled={soundEnabled}
          onToggleSound={toggleSound}
          onListenToVoice={handleTogglePlayVoice}
          isSpeakingVoice={isSpeakingVoice}
          hotspotCount={filteredRegions.length}
          currentYear={year}
          isAiPrediction={isAiPrediction}
          isGuideSuggested={isGuidanceOpen}
          onShowGuideBanner={() => setIsGuidanceOpen(true)}
          onOpenClimateReport={() => setIsClimateReportOpen(true)}
          onToggleTimeline={() => setIsTimelineCollapsed((c) => !c)}
          onOpenUnits={() => setIsUnitSelectorOpen(true)}
          onOpenAlienTutorial={() => setIsAlienTutorialOpen(true)}
        />
      </div>

      {/* What this does: Shows an optional quick-help banner near the top when the user clicks the "?" help button.
          On the website: Offers quick shortcuts to open the App Guide, Search Countries, or Launch the Walkthrough.
          Used as: The manual Mission Advisory card (stays hidden unless opened by the user). */}
      <GuidanceBanner
        isOpen={isGuidanceOpen && isTaskbarOpen && !isPlayingTimeline && !isAlienTutorialOpen && !showRegistrationIntro && !!currentUser}
        onOpenGuide={() => {
          setIsMissionGuideOpen(true);
          setIsGuidanceOpen(false);
        }}
        onOpenExplore={() => {
          setIsCountrySearchOpen(true);
          setIsGuidanceOpen(false);
        }}
        onOpenWalkthrough={() => {
          setIsOnboardingWalkthroughOpen(true);
          setIsGuidanceOpen(false);
        }}
        onDismiss={() => setIsGuidanceOpen(false)}
      />

      {/* What this does: Appears in the top-left corner ONLY when the user hid the top taskbar.
          On the website: Shows a small "Open Taskbar" button so you are never stuck without menus.
          Used as: The restore button to bring the top bar back. */}
      {!isTaskbarOpen && (
        <div className="fixed top-2 left-2 md:top-3 md:left-3 z-30 flex items-center gap-1.5 md:gap-2">
          <button
            onClick={() => {
              soundFx.playTick();
              setIsTaskbarOpen(true);
            }}
            className="px-2 py-1 md:px-3 md:py-1.5 rounded-lg md:rounded-xl bg-slate-950/90 hover:bg-slate-900 border border-cyan-500/60 hover:border-cyan-400 text-cyan-300 font-mono text-[10px] md:text-xs font-bold shadow-2xl flex items-center gap-1.5 md:gap-2 cursor-pointer transition-all animate-in fade-in duration-200"
            title="Open and restore top taskbar"
          >
            <ChevronDown className="w-3.5 h-3.5 md:w-4 md:h-4 text-cyan-400 animate-bounce" />
            <span>Open Taskbar</span>
            <span className="text-[8.5px] md:text-[9px] px-1 md:px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-700/60 font-mono">
              {NASA_INSTRUMENT_REGISTRY[dataBranch]?.unitSymbol || '°C'}
            </span>
          </button>
        </div>
      )}

      {/* What this does: Shows a small pill at the top center while the timeline is auto-playing through the years.
          On the website: Displays the moving year (like 2029) and a "Stop" button while watching the Earth change over time.
          Used as: The live playback status indicator. */}
      {isPlayingTimeline && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 md:gap-3 px-2.5 py-1.5 md:px-5 md:py-2.5 bg-slate-950/90 backdrop-blur-md border border-cyan-500/50 rounded-full shadow-[0_0_30px_rgba(6,182,212,0.25)] font-mono text-[10px] md:text-xs animate-in fade-in duration-300 whitespace-nowrap">
          <span className="relative flex h-2.5 w-2.5 md:h-3 md:w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 md:h-3 md:w-3 bg-cyan-500"></span>
          </span>
          <div className="flex items-center gap-1.5 md:gap-2">
            <span className="text-slate-300 font-semibold tracking-wide uppercase text-[9.5px] md:text-[11px]">Playback</span>
            <span className="px-2 py-0.5 md:px-2.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-bold text-xs md:text-sm tracking-widest font-mono">
              {year}
            </span>
          </div>
          <span className="text-slate-400 text-[11px] hidden sm:inline">
            {dataBranch === 'wind'
              ? 'Kinetic Circulation & Global Wind Speeds • Pause anytime to inspect'
              : dataBranch === 'humidity'
              ? 'Atmospheric Moisture & Humidity Evolution • Pause anytime to inspect'
              : 'Global Thermal Climate Evolution • Pause anytime to inspect'}
          </span>
          <button
            onClick={() => {
              soundFx.playTick();
              setIsPlayingTimeline(false);
            }}
            className="ml-0.5 md:ml-1 px-2 py-0.5 md:px-2.5 md:py-1 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-[9.5px] md:text-[10px] uppercase transition-colors"
          >
            Stop
          </button>
        </div>
      )}

      {/* What this does: Shows a small floating "Layers" shortcut box in the bottom-left on desktop screens.
          On the website: Lets you quickly turn the heat map or top 4 hotspots on/off, or jump to Find Country.
          Used as: A quick layer-toggle widget on larger screens. */}
      {!isTouring && !isPlayingTimeline && (
        isQuickLayersOpen ? (
          <div className="fixed bottom-24 left-4 z-20 hidden md:flex flex-col gap-1 p-2 bg-slate-950/90 border border-slate-800 rounded-xl shadow-2xl max-w-[210px] font-mono animate-in fade-in duration-150">
            {/* Header with Title, Count & Close Button */}
            <div className="flex items-center justify-between pb-1 border-b border-slate-800 text-[10px]">
              <span className="text-slate-300 font-bold uppercase tracking-wider flex items-center gap-1">
                <Layers className="w-3 h-3 text-cyan-400" />
                <span>Layers</span>
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-cyan-300 font-bold text-[9px]">
                  {Object.values(visibleHotspotIds).filter(Boolean).length}/{activeDataset.length}
                </span>
                <button
                  onClick={() => {
                    soundFx.playTick();
                    setIsQuickLayersOpen(false);
                  }}
                  className="p-0.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Close quick layers panel (collapse down)"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="space-y-0.5">
              {/* Global Temperature / Moisture Anomaly Heatmap Gradient Layer Toggle */}
              <button
                onClick={() => {
                  soundFx.playTick();
                  handleToggleLayer('globalTempHeatmap');
                }}
                className={`w-full px-1.5 py-0.5 rounded text-[10px] flex items-center justify-between transition-colors border ${
                  layers.globalTempHeatmap !== false
                    ? dataBranch === 'humidity'
                      ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-200'
                      : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                    : 'bg-slate-950 text-slate-500 border-slate-900 opacity-60'
                }`}
              >
                <div className="flex items-center gap-1 truncate">
                  <Thermometer className="w-3 h-3 shrink-0 text-rose-400" />
                  <span className="truncate">Global Temp Map</span>
                </div>
                <span className="text-[8px] font-bold">
                  {layers.globalTempHeatmap !== false ? 'ON' : 'OFF'}
                </span>
              </button>

              {coreFourLayers.map((core) => {
                const isVisible = visibleHotspotIds[core.id] !== false;
                return (
                  <button
                    key={core.id}
                    onClick={() => {
                      soundFx.playTick();
                      handleToggleHotspot(core.id);
                    }}
                    className={`w-full px-1.5 py-0.5 rounded text-[10px] flex items-center justify-between transition-colors border ${
                      isVisible
                        ? 'bg-slate-900 border-slate-800 text-slate-200'
                        : 'bg-slate-950 text-slate-500 border-slate-900 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-1 truncate">
                      {isVisible ? (
                        <CheckSquare className="w-3 h-3 shrink-0" style={{ color: core.color }} />
                      ) : (
                        <Square className="w-3 h-3 shrink-0 text-slate-600" />
                      )}
                      <span className="truncate">{core.label}</span>
                    </div>
                    <span className="text-[8px] font-bold text-slate-400">
                      {isVisible ? 'ON' : 'OFF'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Quick Find Country Action */}
            <button
              onClick={() => {
                soundFx.playTick();
                setIsCountrySearchOpen(true);
              }}
              className="w-full mt-0.5 py-1 px-1.5 rounded bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-300 text-[9px] flex items-center justify-center gap-1 transition-colors font-semibold cursor-pointer"
            >
              <Globe className="w-3 h-3" />
              <span>Find Country</span>
            </button>
          </div>
        ) : (
          /* Collapsed Pill Button at bottom-24 */
          <button
            onClick={() => {
              soundFx.playTick();
              setIsQuickLayersOpen(true);
            }}
            className="fixed bottom-24 left-4 z-20 hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-950/90 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-[10px] font-mono text-cyan-300 shadow-xl cursor-pointer transition-all"
            title="Open Quick Layer Toggles"
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-semibold">Layers</span>
            <span className="text-[9px] px-1 rounded bg-slate-900 text-slate-400 border border-slate-800">
              {Object.values(visibleHotspotIds).filter(Boolean).length}
            </span>
          </button>
        )
      )}

      {/* What this does: Draws the bottom timeline bar with the 2000–2040 year slider, purple prediction line, play button, and month picker.
          On the website: Lets the user travel across years and months to compare Past, Present, and Future AI predictions.
          Used as: The main time-travel control bar at the bottom of the screen. */}
      <TimelineControlDock
        year={year}
        onYearChange={setYear}
        month={month}
        onMonthChange={setMonth}
        onListenToVoice={handleTogglePlayVoice}
        isSpeakingVoice={isSpeakingVoice}
        isAiPrediction={isAiPrediction}
        layers={layers}
        onToggleLayer={handleToggleLayer}
        visibleHotspotIds={visibleHotspotIds}
        onToggleHotspot={handleToggleHotspot}
        onSelectAllHotspots={handleSelectAllHotspots}
        regions={filteredRegions}
        autoRotate={autoRotate}
        onToggleAutoRotate={() => setAutoRotate(!autoRotate)}
        rotationSpeed={rotationSpeed}
        onChangeRotationSpeed={setRotationSpeed}
        onResetCamera={handleResetCamera}
        isPlaying={isPlayingTimeline}
        onTogglePlay={setIsPlayingTimeline}
        isCollapsed={isTimelineCollapsed}
        onToggleCollapse={setIsTimelineCollapsed}
        activeLocation={selectedLocation}
        dataBranch={dataBranch}
        dataComplexity={dataMode}
        isAlienActive={isAlienActive}
        onToggleAlien={handleToggleAlien}
        onOpenClimateReport={() => setIsClimateReportOpen(true)}
      />

      {/* What this does: Shows the Guided Planetary Tour card when the user starts a globe tour.
          On the website: Walks the user stop-by-stop through Earth's major hotspots with Next/Back/Auto-Play buttons.
          Used as: The tour narration card overlay. */}
      {isTouring && selectedLocation && (
        <TourModal
          currentStepIndex={tourIndex}
          totalSteps={activeDataset.length}
          region={selectedLocation as unknown as ClimateRegion}
          onNext={handleTourNext}
          onPrev={handleTourPrev}
          onClose={handleTourClose}
          isAutoAdvancing={isAutoAdvancingTour}
          onToggleAutoAdvance={() => setIsAutoAdvancingTour(!isAutoAdvancingTour)}
        />
      )}

      {/* What this does: Opens the detailed country/hotspot side panel whenever the user picks a place on Earth.
          On the website: Shows live temperature, humidity, wind charts, stats, and human impact tips for that place.
          Used as: The main place-inspection panel (automatically hides while timeline video is playing for smooth motion). */}
      {selectedLocation && !isPlayingTimeline && (
        <SidebarDataPanel
          item={selectedLocation}
          onClose={() => setSelectedLocation(null)}
          currentYear={year}
          currentMonth={month}
          onMonthChange={setMonth}
          isAiPrediction={isAiPrediction}
          onSelectNextHotspot={handleSelectNextHotspot}
          onSelectPrevHotspot={handleSelectPrevHotspot}
          onFlyToLocation={() => {
            setSelectedLocation({ ...selectedLocation });
          }}
          onOpenClimateDrivers={() => setIsClimateDriversOpen(true)}
          onOpenClimateAlerts={() => setIsClimateAlertsModalOpen(true)}
          onOpenChatbot={() => setIsChatbotOpen(true)}
          onOpenUnits={() => setIsUnitSelectorOpen(true)}
        />
      )}

      {/* What this does: Shows the spoken voice player bar when a month update is ready or being read out loud.
          On the website: Gives a Play/Stop button to hear the month's temperature comparison spoken aloud.
          Used as: The on-demand audio readout box. */}
      <VoiceAnnouncementHUD
        announcement={spokenAnnouncement}
        onTogglePlay={handleTogglePlayVoice}
        onDismiss={() => {
          stopSpeaking();
          setIsSpeakingVoice(false);
          setSpokenAnnouncement(null);
        }}
      />

      {/* What this does: Pops up a small alert toast when the timeline lands on a major climate warning year.
          On the website: Alerts the user with an "Inspect" button and a "Mute" option.
          Used as: The live climate milestone notification card. */}
      <CriticalAnomalyToast
        alert={activeAnomalyAlert}
        onDismiss={() => setActiveAnomalyAlert(null)}
        onInspect={handleInspectAnomaly}
        alertsMuted={alertsMuted}
        onToggleMuteAlerts={() => {
          soundFx.playTick();
          setAlertsMuted(!alertsMuted);
        }}
        soundEnabled={soundEnabled}
      />

      {/* Below are all the popup windows (modals) and overlays that open when you click buttons in the menus: */}

      {/* Scientific Terms Glossary popup: explains climate terms in simple or detailed language */}
      <GlossaryModal
        isOpen={isGlossaryOpen}
        onClose={() => setIsGlossaryOpen(false)}
      />

      {/* Climate Drivers & Temperature Change Reasons Modal */}
      <ClimateDriversModal
        isOpen={isClimateDriversOpen}
        onClose={() => setIsClimateDriversOpen(false)}
        item={selectedLocation}
        currentYear={year}
        currentMonth={month}
      />

      {/* Country & Place Search Modal */}
      <CountrySearchModal
        isOpen={isCountrySearchOpen}
        onClose={() => setIsCountrySearchOpen(false)}
        onSelectCountry={handleSelectCountry}
        currentYear={year}
      />

      {/* "What Would Happen?" Impact Query & Simulation Modal */}
      <ImpactInquiryModal
        isOpen={isImpactInquiryOpen}
        onClose={() => setIsImpactInquiryOpen(false)}
        onSimulateScenario={handleSimulateScenario}
        currentYear={year}
      />

      {/* User Feedback Modal */}
      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        selectedRegion={selectedLocation ? ({ id: selectedLocation.id, name: selectedLocation.name, lat: selectedLocation.lat, lng: selectedLocation.lng } as unknown as ClimateRegion) : null}
        currentYear={year}
        isAiPrediction={isAiPrediction}
      />

      {/* NASA Space Apps Scientific Report Modal */}
      <ExportReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        regions={activeDataset}
        currentYear={year}
      />

      {/* Critical Climate Anomaly Registry Modal */}
      <ClimateAlertsModal
        isOpen={isClimateAlertsModalOpen}
        onClose={() => setIsClimateAlertsModalOpen(false)}
        onSelectAlert={handleInspectAnomaly}
        currentYear={year}
      />

      {/* NASA Climate & Geospatial AI Copilot Chatbot (Google Search & Google Maps Grounded) */}
      <ClimateChatbotModal
        isOpen={isChatbotOpen}
        onClose={() => setIsChatbotOpen(false)}
        currentYear={year}
        currentMonth={month}
        selectedLocation={selectedLocation}
        onFlyToCoordinates={(lat, lng, name) => {
          setSelectedLocation({
            type: 'custom',
            id: `geo-${Date.now()}`,
            name,
            lat,
            lng,
            calculatedTempC: 15.0,
            anomalyC: 1.3,
            baselineTempC: 13.7,
            warmingRateDecadeC: 0.32,
            color: '#06b6d4',
            flagEmoji: '📍',
            famousLandmark: name,
            temperatureChangeReasons: [
              `Google Maps Geospatial Grounding: Landmark identified at ${lat.toFixed(2)}°, ${lng.toFixed(2)}°`,
              'Microclimate telemetry under regional satellite observations',
              'Localized land-surface temperature feedback and convective circulation',
            ],
          });
        }}
      />

      {/* Real Human Field Reports Registry Modal (Past Years 2022-2026 & Months) */}
      <HumanReportsModal
        isOpen={isHumanReportsOpen}
        onClose={() => {
          setIsHumanReportsOpen(false);
          setActiveReportIdForModal(undefined);
        }}
        initialReportId={activeReportIdForModal}
        dataBranch={dataBranch}
        onFlyToCoordinates={(lat, lng, repYear, repMonth, locName) => {
          setIsPlayingTimeline(false);
          setYear(repYear);
          if (repMonth) setMonth(repMonth);
          setSelectedLocation({
            type: 'custom',
            id: `human-rep-${Date.now()}`,
            name: locName || 'Observer Field Site',
            lat,
            lng,
            calculatedTempC: 16.5,
            anomalyC: 1.5,
            baselineTempC: 15.0,
            warmingRateDecadeC: 0.35,
            color: '#f59e0b',
            flagEmoji: '📍',
            famousLandmark: locName || 'Human Observation Station',
            temperatureChangeReasons: [
              'Empirical field observer verification point',
              'Regional weather station ground-truth calibration',
              'Socioeconomic and biological threshold impact zone',
            ],
          });
        }}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* User Authentication & Saved Data Interface Modal */}
      <UserAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onOpenReportDetails={(reportId) => {
          setActiveReportIdForModal(reportId);
          setIsHumanReportsOpen(true);
        }}
        onOpenComplexityModal={() => setIsComplexityModalOpen(true)}
        onOpenOnboardingWalkthrough={() => setIsOnboardingWalkthroughOpen(true)}
        onOpenArchitectureModal={() => setIsArchitectureModalOpen(true)}
        onRegistrationSuccess={() => setShowRegistrationIntro(true)}
        onReplayIntro={() => setShowRegistrationIntro(true)}
      />

      {/* Choose Data Type Complexity Modal (Simple, Normal, Complicated) */}
      <ComplexityModeModal
        isOpen={isComplexityModalOpen}
        onClose={() => setIsComplexityModalOpen(false)}
        currentMode={dataMode}
        onSelectMode={(mode) => setDataMode(mode)}
      />

      {/* Download & Install on Laptop Modal (PWA, Desktop WebApp, Standalone Launcher) */}
      <DownloadAppModal
        isOpen={isDownloadAppModalOpen}
        onClose={() => setIsDownloadAppModalOpen(false)}
      />

      {/* Daily Weather.com Eco-Advice & Action Tips Modal */}
      <DailyEcoAdviceModal
        isOpen={isDailyAdviceOpen}
        onClose={() => setIsDailyAdviceOpen(false)}
        selectedCountry={selectedCountryForAdvice}
        onSelectCountry={(c) => {
          setSelectedLocation({ type: 'country', ...c, color: '#38bdf8' });
          setSelectedCountryForAdvice(c);
        }}
        dataBranch={dataBranch}
        currentYear={year}
      />

      {/* Scientific Research & Field Observation Notebook Modal */}
      <FieldNotebookModal
        isOpen={isNotebookOpen}
        onClose={() => setIsNotebookOpen(false)}
        activeLocation={selectedLocation}
        currentYear={year}
        currentMonth={month}
        dataBranch={dataBranch}
      />

      {/* NASA Mission Guide & Comprehensive Button Directory Modal */}
      <MissionGuideModal
        isOpen={isMissionGuideOpen}
        onClose={() => setIsMissionGuideOpen(false)}
        onOpenCountrySearch={() => setIsCountrySearchOpen(true)}
        onOpenChatbot={() => setIsChatbotOpen(true)}
        onOpenNotebook={() => setIsNotebookOpen(true)}
        onOpenDailyAdvice={() => setIsDailyAdviceOpen(true)}
        onOpenHumanReports={() => setIsHumanReportsOpen(true)}
        onOpenGlossary={() => setIsGlossaryOpen(true)}
        onOpenOnboardingWalkthrough={() => setIsOnboardingWalkthroughOpen(true)}
        onOpenArchitectureModal={() => setIsArchitectureModalOpen(true)}
        onOpenAlienTutorial={() => setIsAlienTutorialOpen(true)}
        onReplayIntro={() => setShowRegistrationIntro(true)}
      />


      {/* Visual Climate Farm & Polar Cryosphere Simulator */}
      <VisualFarmSimulatorModal
        isOpen={isVisualFarmOpen}
        onClose={() => setIsVisualFarmOpen(false)}
        initialEnvironment={visualSimulatorEnv}
      />

      {/* Interactive Onboarding Walkthrough & Full Tutorial */}
      <OnboardingWalkthrough
        isOpen={isOnboardingWalkthroughOpen}
        onClose={() => setIsOnboardingWalkthroughOpen(false)}
        onOpenArchitectureModal={() => {
          setIsOnboardingWalkthroughOpen(false);
          setIsArchitectureModalOpen(true);
        }}
        onTestToggleGlobeRotate={() => setAutoRotate((prev) => !prev)}
        isAutoRotating={autoRotate}
      />

      {/* Full Architecture, User Story & End-to-End User Flow Modal */}
      <ArchitectureUserFlowModal
        isOpen={isArchitectureModalOpen}
        onClose={() => setIsArchitectureModalOpen(false)}
        onSelectFlowStep={(stepId) => {
          if (stepId === 'auth') setIsAuthModalOpen(true);
          else if (stepId === 'walkthrough') setIsOnboardingWalkthroughOpen(true);
          else if (stepId === 'search') setIsCountrySearchOpen(true);
          else if (stepId === 'drivers') setIsClimateDriversOpen(true);
          else if (stepId === 'human_reports') setIsHumanReportsOpen(true);
          else if (stepId === 'copilot') setIsChatbotOpen(true);
          else if (stepId === 'report') setIsReportOpen(true);
        }}
      />

      {/* Detailed Climate Characteristics Dossier Modal (2000-2040 Reports & Explanations) */}
      <ClimateReportDossierModal
        isOpen={isClimateReportOpen}
        onClose={() => setIsClimateReportOpen(false)}
        year={year}
        month={month}
        onSelectYear={setYear}
        onSelectMonth={setMonth}
      />

      {/* Floating Cosmic Space Alien Buddy (Drifts in space, explodes on click to show a cute simple cloud tip) */}
      <SpaceAlienBuddy
        isEnabled={isAlienActive && !isAlienTutorialOpen && !showRegistrationIntro && !!currentUser}
        onToggleEnabled={setIsAlienActive}
        onReplayTutorial={() => setIsAlienTutorialOpen(true)}
      />

      {/* Interactive Alien Guided Tutorial (Triggers after registration & animation complete) */}
      <AlienGuidedTutorial
        isOpen={isAlienTutorialOpen}
        onClose={() => setIsAlienTutorialOpen(false)}
        onOpenCountrySearch={() => setIsCountrySearchOpen(true)}
        onStartTour={handleStartTour}
      />

      {/* What this does: Shows the Unit Picker popup so users can choose °C/°F/K, km/h/mph, or RH%/Dew Point.
          On the website: Changes measurement units across the whole site immediately.
          Used as: The measurement-unit settings window. */}
      <UnitSelectorModal
        isOpen={isUnitSelectorOpen}
        onClose={() => setIsUnitSelectorOpen(false)}
      />

      {/* What this does: Shows the full-screen Sign-In / Sign-Up screen before entering the app if nobody is logged in yet.
          On the website: Asks the visitor to log in, register with email & password, or continue as a guest.
          Used as: The entry login gateway of the website. */}
      {!currentUser && !showRegistrationIntro && (
        <AuthGateway
          onLoginSuccess={() => {
            setShowRegistrationIntro(true);
          }}
        />
      )}

      {/* What this does: Plays the Phoenix rising intro video right after the user finishes registering/logging in, then fades smoothly into the app and launches the Alien tutorial.
          On the website: Gives a cinematic welcome transition before revealing the 3D Earth.
          Used as: The post-login animated welcome screen. */}
      {showRegistrationIntro && (
        <RegistrationIntroAnimation
          userEmail={currentUser?.email}
          userName={currentUser?.name}
          onComplete={() => {
            setShowRegistrationIntro(false);
            // Tutorial appears after login process and after the end of the animation
            if (localStorage.getItem(ALIEN_TUTORIAL_STORAGE_KEY) !== 'completed') {
              setIsAlienTutorialOpen(true);
            }
          }}
        />
      )}

    </div>
  );
}
