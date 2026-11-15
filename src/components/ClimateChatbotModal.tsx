/**
 * NASA Earth Trend Detective - Climate & Geospatial AI Chatbot
 * Powered by Gemini 3.8 Flash with Google Search & Google Maps Grounding
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  X,
  Sparkles,
  Search,
  MapPin,
  ExternalLink,
  Globe,
  Loader2,
  Trash2,
  Minimize2,
  Maximize2,
  Layers,
  Compass,
  AlertCircle,
  HelpCircle,
  HeartPulse,
  Sprout,
  Atom,
  Droplets,
} from 'lucide-react';
import { soundFx } from '../utils/audioSynth';
import { ActiveInspectorItem } from '../types/climate';
import { useAuth } from '../context/AuthContext';

// What this does: Defines the shape of a website or map link returned by AI search.
// On the website: Helps show clickable source links under the chatbot's answers.
// Used as: A TypeScript interface for grounding links inside chat messages.
export interface GroundingSource {
  title: string;
  uri: string;
}

// What this does: Defines all the fields stored for a single chat message.
// On the website: Holds the message text, time, sender, and any Google Search or Map links.
// Used as: The TypeScript data type for every message bubble in the chat window.
export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  modelUsed?: string;
  groundingType?: 'search' | 'maps' | 'offline-preview' | 'none';
  webSources?: GroundingSource[];
  mapSources?: GroundingSource[];
  searchQueries?: string[];
}

// What this does: Lists the inputs the chatbot window needs from the main app.
// On the website: Tells the chatbot whether it is open and which year, month, and place are selected.
// Used as: The TypeScript props contract for the ClimateChatbotModal component.
interface ClimateChatbotModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentYear: number;
  currentMonth: number;
  selectedLocation: ActiveInspectorItem | null;
  onFlyToCoordinates?: (lat: number, lng: number, name: string) => void;
}

// What this does: Stores ready-to-click sample climate questions for the user.
// On the website: Displays quick suggestion chips above the chat input bar so users can ask smart questions in one tap.
// Used as: A preset prompt catalog that triggers automatic search or map lookups.
const PRESET_PROMPTS = [
  {
    label: 'Human Heat & Labor Loss',
    query: 'Synthesize the current temperature and anomaly into human biological indicators: safe outdoor labor hours, Wet-Bulb Globe Temperature (WBGT), and municipal cooling center directives.',
    mode: 'auto' as const,
    icon: HeartPulse,
  },
  {
    label: 'Atmospheric Moisture & Wet-Bulb',
    query: 'Explain atmospheric humidity changes: Clausius-Clapeyron expansion (+7%/°C), land relative humidity drying (Byrne & O’Gorman), Vapor Pressure Deficit (VPD), and the 35°C Wet-Bulb threshold.',
    mode: 'auto' as const,
    icon: Droplets,
  },
  {
    label: 'Crop Pollination & Food Security',
    query: 'How does this regional temperature anomaly impact staple cereal crop pollination, flowering sterility, harvest yields, and municipal emergency irrigation?',
    mode: 'auto' as const,
    icon: Sprout,
  },
  {
    label: 'Latest Arctic Ice Data',
    query: 'What causes Arctic sea ice decline and how do NASA satellites monitor polar changes?',
    mode: 'search' as const,
    icon: Search,
  },
  {
    label: 'Mauna Loa CO2 Observatory',
    query: 'Show me the location and details of the Mauna Loa Atmospheric Observatory in Hawaii using Google Maps.',
    mode: 'maps' as const,
    icon: MapPin,
  },
  {
    label: 'Amazon Rainforest Eco-Centers',
    query: 'Locate major rainforest conservation and biodiversity research stations in the Amazon Basin on Google Maps.',
    mode: 'maps' as const,
    icon: MapPin,
  },
  {
    label: 'Planetary Tipping Points',
    query: 'Search recent IPCC and scientific consensus on the 1.5°C Paris Agreement milestone and critical tipping points.',
    mode: 'search' as const,
    icon: Search,
  },
];

// What this does: Creates and manages the floating AI Climate Chatbot window.
// On the website: Opens a chat panel where users can ask climate questions and get answers backed by Google Search and Google Maps.
// Used as: The main interactive AI assistant modal component.
export const ClimateChatbotModal: React.FC<ClimateChatbotModalProps> = ({
  isOpen,
  onClose,
  currentYear,
  currentMonth,
  selectedLocation,
  onFlyToCoordinates,
}) => {
  const { dataMode, dataBranch } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: dataMode === 'simple'
        ? `### Hello! I am your Earth Helper 🌍\n\nI can answer your questions about weather and climate in **easy, simple English**.\n\nAsk me about:\n- **Hot or cold places:** Why is it getting warmer?\n- **Ice and sea water:** Why is polar ice melting?\n- **Animals and plants:** How are trees and farms doing?\n\n*Choose a button below or type a question!*`
        : dataMode === 'complicated'
        ? `### NASA Lead Climatologist & Geospatial AI Copilot Online 🛰️\n\nOperating in **High-Complexity Academic Research Mode**.\n\nAll analytical inquiries synthesize raw satellite radiances, non-parametric rank statistics (Mann-Kendall S, Sen's slope β), formal radiative forcing formulations (ΔF = 5.35 · ln(C/C₀)), planetary boundary layer thermodynamics, and peer-reviewed CMIP6 projections.\n\n*Submit analytical inquiries, coordinate requests, or hypothesis tests below.*`
        : `### Planetary Intelligence Specialist Online 🛰️\n\nI am your **NASA Earth Trend Detective Copilot**, answering your climate and geospatial inquiries directly using **Google Gemini** enhanced with live **Google Search & Google Maps Grounding**.\n\nAsk me anything about Earth's changing climate:\n- 🔬 **Direct Scientific Answers:** Ask any question about atmospheric physics, greenhouse gases, sea level rise, polar ice, or NASA satellite missions.\n- 🌐 **Google Search Data:** Get verified references to recent NASA satellite observations, scientific papers, and environmental datasets.\n- 📍 **Google Maps Grounding:** Locate atmospheric observatories, sensor networks, research stations, and protected ecosystems with direct Google Maps links.\n- 🌍 **Active 3D Telemetry:** Inquire about the currently selected hotspot (${selectedLocation ? selectedLocation.name : `Year ${currentYear}`}) on the globe.\n\n*Transmit any question below or choose a suggested query to get started!*`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      modelUsed: 'Gemini',
      groundingType: 'none',
    },
  ]);

  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [groundingMode, setGroundingMode] = useState<'auto' | 'search' | 'maps'>('auto');
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // What this does: Automatically puts the typing cursor inside the chat box when the window opens.
  // On the website: Lets the user start typing a question right away without clicking the input first.
  // Used as: An auto-focus React effect tied to open and minimize state.
  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  // What this does: Scrolls the chat list down to the newest message whenever a reply arrives.
  // On the website: Keeps the latest question, loading spinner, or AI answer in view automatically.
  // Used as: An auto-scroll effect watching the messages array and loading state.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isOpen) return null;

  // What this does: Sends the user's question plus the selected globe location and year to the backend chat route.
  // On the website: Shows the user's message bubble, displays a loading indicator, and adds the AI reply and source links.
  // Used as: The primary submit handler for both typed messages and quick preset buttons.
  const handleSendMessage = async (textToSend?: string, overrideMode?: 'auto' | 'search' | 'maps') => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    soundFx.playTick();
    setInput('');
    setErrorMessage(null);

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const modeToUse = overrideMode || groundingMode;

      // Prepare context from active Earth globe inspector item
      const context = {
        currentYear,
        currentMonth,
        selectedLocationName: selectedLocation?.name,
        latitude: selectedLocation?.lat,
        longitude: selectedLocation?.lng,
        domain: (selectedLocation as any)?.domain || (selectedLocation as any)?.regionType || 'Global Climate',
        anomalyC: (selectedLocation as any)?.anomalyC || (selectedLocation as any)?.projectedAnomaly2040C,
        dataBranch,
      };

      // Past turns for conversation continuity
      const history = messages
        .filter((m) => m.id !== 'welcome')
        .slice(-6)
        .map((m) => ({
          role: m.role,
          text: m.text,
        }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          groundingMode: modeToUse,
          context,
          history,
          dataMode,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.details || errData.error || `Server returned ${res.status}`);
      }

      const data = await res.json();

      const assistantMessage: ChatMessage = {
        id: `model-${Date.now()}`,
        role: 'model',
        text: data.reply || 'No response generated.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: data.modelUsed || 'Gemini',
        groundingType: data.groundingType,
        webSources: data.webSources || [],
        mapSources: data.mapSources || [],
        searchQueries: data.searchQueries || [],
      };

      setMessages((prev) => [...prev, assistantMessage]);
      soundFx.playPredictionAlert();
    } catch (err: any) {
      console.error('Chat error:', err);
      setErrorMessage(err.message || 'Unable to connect to NASA Gemini Copilot.');
      const fallbackMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        text: `⚠️ **Communication Advisory:** Unable to contact the Gemini ground station.\n\n*Error:* ${err.message || 'Unknown network error'}\n\nPlease check your connection or try another query.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        groundingType: 'none',
      };
      setMessages((prev) => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // What this does: Wipes the current conversation and puts back a fresh reset greeting.
  // On the website: Runs when the user clicks the trash icon in the chatbot header to start a clean chat.
  // Used as: The clear-history button click handler.
  const handleClearChat = () => {
    soundFx.playTick();
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'model',
        text: `### Chat History Reset 🛰️\nReady for new planetary queries with Google Search and Google Maps grounding. Current simulation year: **${currentYear}**.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        groundingType: 'none',
      },
    ]);
  };

  // What this does: Turns raw LaTeX math symbols (like \frac, \Delta, and ^4) into clean readable text and Unicode symbols.
  // On the website: Makes science formulas inside AI replies look neat and easy to read instead of showing raw code tags.
  // Used as: A text sanitizer before rendering chatbot responses.
  const cleanScientificMath = (text: string): string => {
    if (!text) return '';
    let s = text;

    // Fractions: \frac{A}{B} -> (A) / (B)
    s = s.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '($1) / ($2)');
    s = s.replace(/\\sqrt\{([^{}]+)\}/g, '√($1)');

    // Common LaTeX greek letters and physical science operators
    const latexMap: [RegExp, string][] = [
      [/\\Delta\b/g, 'Δ'],
      [/\\delta\b/g, 'δ'],
      [/\\sigma\b/g, 'σ'],
      [/\\alpha\b/g, 'α'],
      [/\\beta\b/g, 'β'],
      [/\\gamma\b/g, 'γ'],
      [/\\lambda\b/g, 'λ'],
      [/\\mu\b/g, 'μ'],
      [/\\pi\b/g, 'π'],
      [/\\theta\b/g, 'θ'],
      [/\\tau\b/g, 'τ'],
      [/\\epsilon\b/g, 'ε'],
      [/\\omega\b/g, 'ω'],
      [/\\Omega\b/g, 'Ω'],
      [/\\partial\b/g, '∂'],
      [/\\nabla\b/g, '∇'],
      [/\\times\b/g, '×'],
      [/\\cdot\b/g, '·'],
      [/\\approx\b/g, '≈'],
      [/\\neq\b/g, '≠'],
      [/\\leq?\b/g, '≤'],
      [/\\geq?\b/g, '≥'],
      [/\\pm\b/g, '±'],
      [/\\mp\b/g, '∓'],
      [/\\infty\b/g, '∞'],
      [/\\to\b|\\rightarrow\b/g, '→'],
      [/\\leftarrow\b/g, '←'],
      [/\\leftrightarrow\b/g, '↔'],
      [/\\sum\b/g, 'Σ'],
      [/\\int\b/g, '∫'],
      [/\\ln\b/g, 'ln'],
      [/\\log\b/g, 'log'],
      [/\\exp\b/g, 'exp'],
      [/\\sin\b/g, 'sin'],
      [/\\cos\b/g, 'cos'],
      [/\\tan\b/g, 'tan'],
      [/\\degree\b|\^\\circ\b/g, '°'],
      [/\\text\{([^}]+)\}/g, '$1'],
      [/\\mathrm\{([^}]+)\}/g, '$1'],
      [/\\mathbf\{([^}]+)\}/g, '$1'],
      [/\\operatorname\{([^}]+)\}/g, '$1'],
    ];

    for (const [re, sym] of latexMap) {
      s = s.replace(re, sym);
    }

    // Exponents and superscripts: ^4, ^{4}, etc.
    s = s.replace(/\^\{?([0-9+\-nNiI]+)\}?/g, (_m, content) => {
      const sups: Record<string, string> = {
        '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
        '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
        '+': '⁺', '-': '⁻', 'n': 'ⁿ', 'i': 'ⁱ',
      };
      return content.split('').map((c: string) => sups[c] || c).join('');
    });

    // Subscripts: _0, _{0}, _{CO2}, etc.
    s = s.replace(/\_\{?([0-9+\-a-zA-Z]+)\}?/g, (_m, content) => {
      const subs: Record<string, string> = {
        '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
        '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
        '+': '₊', '-': '₋',
      };
      if (/^[0-9+\-]+$/.test(content)) {
        return content.split('').map((c: string) => subs[c] || c).join('');
      }
      return `_${content}`;
    });

    // Remove LaTeX math delimiters: $$...$$ and $...$
    s = s.replace(/\$\$([^$]+)\$\$/g, '$1');
    s = s.replace(/\$([^$\n]+)\$/g, '$1');

    // Strip unparsed LaTeX macros / backslashes before words
    s = s.replace(/\\([a-zA-Z]+)/g, '$1');

    return s;
  };

  // What this does: Checks if a single line of text is a scientific formula or physical law.
  // On the website: Decides whether to highlight that line inside a special boxed formula card.
  // Used as: A formatting helper called by renderFormattedText.
  const isEquationLine = (line: string): boolean => {
    const trimmed = line.trim();
    if (trimmed.startsWith('$$') && trimmed.endsWith('$$')) return true;
    if (
      trimmed.startsWith('Equation:') ||
      trimmed.startsWith('Formula:') ||
      trimmed.startsWith('Law:') ||
      trimmed.startsWith('Physical Law:') ||
      trimmed.startsWith('Formulation:')
    ) return true;

    // Check for standard physics equations like E = σ · T⁴ or ΔF = 5.35 · ln(...)
    const equationPatterns = [
      /^[A-Za-zΔσελσω]\s*=\s*[\w\d\.\s\+\-\*\/·×\(\)₀-₉⁰-⁹]+$/,
      /^(?:E|ΔF|WBGT|dP\/dT|F|P|T|Q|λ|I)\s*=\s*/,
      /\b(?:σ\s*·\s*T⁴|ln\(C\/C₀\)|5\.35\s*·\s*ln)/,
    ];
    return equationPatterns.some((pattern) => pattern.test(trimmed));
  };

  // What this does: Splits an AI answer line by line and converts headings, bullets, and equations into styled JSX blocks.
  // On the website: Gives chatbot replies clean headings, bullet lists, and highlighted science equation boxes.
  // Used as: The main message body renderer for model replies.
  const renderFormattedText = (content: string) => {
    const cleanedContent = cleanScientificMath(content);
    const lines = cleanedContent.split('\n');

    return (
      <div className="space-y-1.5 text-xs text-slate-200 leading-relaxed font-sans">
        {lines.map((line, idx) => {
          if (line.startsWith('### ')) {
            return (
              <h4 key={idx} className="text-sm font-bold text-cyan-300 font-mono mt-2 mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>{line.replace('### ', '')}</span>
              </h4>
            );
          }
          if (line.startsWith('## ')) {
            return (
              <h3 key={idx} className="text-base font-bold text-white font-mono mt-2 mb-1 border-b border-slate-700/60 pb-1">
                {line.replace('## ', '')}
              </h3>
            );
          }
          // Standalone scientific equation or physical law card
          if (isEquationLine(line)) {
            const rawEq = line.replace(/^\$\$|\$\$$/g, '').trim();
            const label = rawEq.includes(':') ? rawEq.split(':')[0] : 'Physical Law / Formulation';
            const formula = rawEq.includes(':') ? rawEq.split(':').slice(1).join(':').trim() : rawEq;

            return (
              <div key={idx} className="my-2 p-2.5 rounded-xl bg-slate-900/90 border border-cyan-500/40 shadow-inner shadow-cyan-950/60">
                <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-cyan-300 uppercase tracking-wider mb-1">
                  <Atom className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{label}</span>
                </div>
                <div className="text-xs sm:text-sm font-mono font-bold text-amber-200 tracking-wide bg-slate-950/90 px-3 py-1.5 rounded-lg border border-slate-800 text-center select-all shadow-sm">
                  {formula}
                </div>
              </div>
            );
          }
          if (line.startsWith('- ') || line.startsWith('* ')) {
            const itemText = line.substring(2);
            return (
              <div key={idx} className="flex items-start gap-1.5 pl-2 my-0.5">
                <span className="text-cyan-400 shrink-0 font-bold">•</span>
                <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(itemText) }} />
              </div>
            );
          }
          if (line.trim() === '') {
            return <div key={idx} className="h-1" />;
          }
          return (
            <p key={idx} dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(line) }} />
          );
        })}
      </div>
    );
  };

  // What this does: Converts bold (**text**), italic (*text*), and inline code (`text`) into styled HTML tags.
  // On the website: Highlights important words and terms inside each paragraph or bullet point of a chat reply.
  // Used as: An inline markdown formatter inside renderFormattedText.
  const formatInlineMarkdown = (str: string) => {
    return cleanScientificMath(str)
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="text-slate-300">$1</em>')
      .replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 bg-slate-900 border border-slate-700 rounded font-mono text-[11px] text-cyan-300">$1</code>');
  };

  return (
    <div
      className={`fixed z-40 transition-all duration-300 shadow-2xl flex flex-col ${
        isMinimized
          ? 'bottom-24 right-4 w-72 sm:w-80 h-14 bg-slate-950/95 border border-cyan-500/50 rounded-2xl overflow-hidden'
          : 'bottom-20 sm:bottom-24 right-2 sm:right-6 w-[94vw] sm:w-[480px] md:w-[540px] max-h-[82vh] h-[680px] bg-slate-950/95 border border-cyan-500/40 rounded-2xl backdrop-blur-xl'
      }`}
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-gradient-to-r from-slate-900 via-cyan-950/60 to-slate-900 border-b border-cyan-500/30 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shadow-md shadow-cyan-900/40 border border-cyan-400/40">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold font-heading text-white tracking-wide">
                NASA Climate Detective AI
              </span>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                GEMINI AI COPILOT
              </span>
              <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                dataMode === 'simple'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : dataMode === 'complicated'
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                  : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
              }`}>
                {dataMode === 'simple' ? 'Simple (B1)' : dataMode === 'complicated' ? 'Complicated (Research)' : 'Normal'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Grounding
              </span>
              <span>•</span>
              <span className="text-cyan-300 truncate max-w-[150px]">
                {selectedLocation ? selectedLocation.name : `Year ${currentYear}`}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Clear history */}
          {!isMinimized && (
            <button
              onClick={handleClearChat}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Clear conversation history"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Minimize / Maximize */}
          <button
            onClick={() => {
              soundFx.playTick();
              setIsMinimized(!isMinimized);
            }}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title={isMinimized ? 'Expand Chatbot' : 'Minimize Chatbot'}
          >
            {isMinimized ? <Maximize2 className="w-3.5 h-3.5 text-cyan-400" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Close */}
          <button
            onClick={() => {
              soundFx.playTick();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Close Chatbot"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Body (if not minimized) */}
      {!isMinimized && (
        <>
          {/* Grounding Mode Selector Dock */}
          <div className="px-3 py-1.5 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0 flex-wrap">
            <div className="flex items-center gap-1 text-[11px] font-mono">
              <span className="text-slate-400 mr-1 text-[10px] hidden sm:inline">Grounding:</span>
              <button
                onClick={() => {
                  soundFx.playTick();
                  setGroundingMode('auto');
                }}
                className={`px-2 py-0.5 rounded-md text-[10px] font-mono transition-colors cursor-pointer ${
                  groundingMode === 'auto'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title="Automatically use Google Search for scientific news & Google Maps for facilities/places"
              >
                ⚡ Auto
              </button>
              <button
                onClick={() => {
                  soundFx.playTick();
                  setGroundingMode('search');
                }}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono transition-colors cursor-pointer ${
                  groundingMode === 'search'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title="Force Google Search grounding for latest web data and satellite telemetry"
              >
                <Search className="w-3 h-3 text-blue-400" />
                <span>Search</span>
              </button>
              <button
                onClick={() => {
                  soundFx.playTick();
                  setGroundingMode('maps');
                }}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono transition-colors cursor-pointer ${
                  groundingMode === 'maps'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title="Force Google Maps grounding for research stations, observatories, coordinates, and places"
              >
                <MapPin className="w-3 h-3 text-emerald-400" />
                <span>Maps</span>
              </button>
            </div>

            {/* Context Telemetry Pill */}
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-cyan-400/90 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
              <Globe className="w-3 h-3 text-cyan-400" />
              <span>
                {selectedLocation
                  ? `${selectedLocation.name} (${selectedLocation.lat > 0 ? `${selectedLocation.lat.toFixed(1)}°N` : `${Math.abs(selectedLocation.lat).toFixed(1)}°S`})`
                  : 'Global View'}
              </span>
            </div>
          </div>

          {/* Chat Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 scrollbar-thin scrollbar-thumb-slate-800">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-full`}
                >
                  <div
                    className={`rounded-2xl p-3 max-w-[92%] border transition-all ${
                      isUser
                        ? 'bg-gradient-to-r from-cyan-600 to-blue-700 text-white border-cyan-400/30 rounded-tr-sm shadow-md shadow-cyan-950/40'
                        : 'bg-slate-900/90 text-slate-100 border-slate-800 rounded-tl-sm shadow-lg'
                    }`}
                  >
                    {/* Header info */}
                    <div className="flex items-center justify-between gap-3 text-[10px] font-mono text-slate-400 mb-1.5">
                      <div className="flex items-center gap-1.5 font-semibold text-cyan-300">
                        <span>{isUser ? 'Mission Commander' : 'Planetary AI Specialist'}</span>
                        {!isUser && msg.modelUsed && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] bg-cyan-950/80 text-cyan-400 border border-cyan-500/30 flex items-center gap-1 font-mono">
                            <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
                            <span>Gemini</span>
                          </span>
                        )}
                      </div>
                      <span>{msg.timestamp}</span>
                    </div>

                    {/* Content */}
                    {isUser ? (
                      <p className="text-xs text-white leading-relaxed">{msg.text}</p>
                    ) : (
                      renderFormattedText(msg.text)
                    )}

                    {/* Google Search Grounding Sources */}
                    {msg.webSources && msg.webSources.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-800/80">
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-blue-400 font-bold mb-1.5">
                          <Search className="w-3 h-3 text-blue-400" />
                          <span>Google Search Sources ({msg.webSources.length})</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {msg.webSources.map((src, sIdx) => (
                            <a
                              key={sIdx}
                              href={src.uri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-slate-950/80 hover:bg-blue-950/40 border border-slate-800 hover:border-blue-500/40 text-[11px] text-slate-300 hover:text-blue-300 transition-colors group"
                            >
                              <span className="truncate">{src.title}</span>
                              <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-blue-400 shrink-0" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Google Maps Grounding Sources */}
                    {msg.mapSources && msg.mapSources.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-800/80">
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 font-bold mb-1.5">
                          <MapPin className="w-3 h-3 text-emerald-400" />
                          <span>Google Maps Grounded Locations ({msg.mapSources.length})</span>
                        </div>
                        <div className="space-y-1.5">
                          {msg.mapSources.map((mapSrc, mIdx) => (
                            <div
                              key={mIdx}
                              className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-950/90 border border-emerald-500/30"
                            >
                              <div className="flex items-center gap-2 truncate">
                                <div className="w-6 h-6 rounded-md bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center shrink-0">
                                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                                </div>
                                <span className="text-xs text-emerald-200 font-medium truncate">
                                  {mapSrc.title}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                {mapSrc.uri && (
                                  <a
                                    href={mapSrc.uri}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-500/40 text-[10px] text-emerald-300 font-mono transition-colors"
                                  >
                                    <span>Google Maps</span>
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex flex-col items-start">
                <div className="rounded-2xl rounded-tl-sm p-3 bg-slate-900/90 border border-cyan-500/30 text-slate-200 flex items-center gap-2.5 shadow-lg">
                  <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                  <div className="text-xs font-mono text-cyan-300">
                    {groundingMode === 'maps'
                      ? 'Querying Google Maps Geospatial Grounding...'
                      : groundingMode === 'search'
                      ? 'Grounding with Google Search web telemetry...'
                      : 'Synthesizing with Gemini 3.8 Flash & Grounding...'}
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Presets Carousel */}
          <div className="px-3 py-2 bg-slate-900/60 border-t border-slate-800/80 shrink-0">
            <div className="text-[10px] font-mono text-slate-400 mb-1.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>Suggested Grounded Climate Inquiries:</span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {PRESET_PROMPTS.map((preset, pIdx) => {
                const Icon = preset.icon;
                return (
                  <button
                    key={pIdx}
                    onClick={() => handleSendMessage(preset.query, preset.mode)}
                    disabled={isLoading}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 active:bg-cyan-950/60 border border-slate-800 hover:border-cyan-500/40 text-[10px] font-mono text-slate-300 hover:text-cyan-300 whitespace-nowrap transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                  >
                    <Icon className={`w-3 h-3 ${preset.mode === 'maps' ? 'text-emerald-400' : 'text-blue-400'}`} />
                    <span>{preset.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Message Input Dock */}
          <div className="p-3 bg-slate-950 border-t border-slate-800 shrink-0">
            {errorMessage && (
              <div className="mb-2 p-2 rounded-lg bg-rose-950/60 border border-rose-500/40 text-[11px] text-rose-300 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                <span className="truncate">{errorMessage}</span>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    groundingMode === 'maps'
                      ? 'Search facilities, observatories, or places on Google Maps...'
                      : groundingMode === 'search'
                      ? 'Search latest web climate data, papers, or news...'
                      : 'Ask about climate trends, search live data, or find places...'
                  }
                  disabled={isLoading}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 focus:border-cyan-400 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none transition-colors disabled:opacity-50 font-sans"
                />
              </div>

              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 active:from-cyan-700 active:to-blue-700 disabled:opacity-40 text-white rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-md shadow-cyan-950/40 cursor-pointer shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Transmit</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
};
