/**
 * NASA Earth Trend Detective - Real Human Field Reports Modal
 * Displays authentic field reports logged by scientists, indigenous observers,
 * rangers, agronomists, and citizens across past years (2022-2026) and months.
 * Fully adapts presentation dynamically based on selected Data Mode:
 * - Simple: B1 plain English + rich visual meters and icons.
 * - Normal: Balanced field narrative with direct quotes.
 * - Complicated: Academic research paper format with statistical matrices, p-values, and citations.
 * Preserves identical buttons & functions across all modes!
 */

import React, { useState, useMemo } from 'react';
import {
  X,
  Users,
  Calendar,
  Filter,
  Search,
  Bookmark,
  BookmarkCheck,
  Compass,
  PieChart,
  Scale,
  GraduationCap,
  Sparkles,
  MapPin,
  ExternalLink,
  PlusCircle,
  FileText,
  Thermometer,
  Layers,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Share2,
  Check,
  Send,
  AlertTriangle,
} from 'lucide-react';
import { REAL_HUMAN_FIELD_REPORTS, HumanFieldReport } from '../data/humanFieldReports';
import { useAuth } from '../context/AuthContext';
import { DataComplexityMode } from '../types/user';
import { soundFx } from '../utils/audioSynth';

// What this does: Lists the props passed into the Human Field Reports popup.
// On the website: Tells the modal if it is open, which branch is active, and how to fly the globe to a report's location.
// Used as: The TypeScript props contract for HumanReportsModal.
interface HumanReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFlyToCoordinates?: (lat: number, lng: number, year: number, month?: number, locationName?: string) => void;
  onOpenAuthModal?: () => void;
  initialReportId?: string;
  dataBranch?: 'temperature' | 'humidity' | 'wind';
}

// What this does: Stores the dropdown labels for filtering field reports by month.
// On the website: Builds the "Month" dropdown menu in the filter bar.
// Used as: A display label array mapped to month numbers 1–12.
const MONTH_LABELS = [
  'All Months',
  'Jan (01)',
  'Feb (02)',
  'Mar (03)',
  'Apr (04)',
  'May (05)',
  'Jun (06)',
  'Jul (07)',
  'Aug (08)',
  'Sep (09)',
  'Oct (10)',
  'Nov (11)',
  'Dec (12)',
];

// What this does: Lists the topic tags used to filter reports and tag new user reports.
// On the website: Creates the category filter buttons (like Cryosphere, Agriculture, Ocean, Wind).
// Used as: A constant filter and dropdown option list.
const CATEGORIES = ['All', 'Cryosphere', 'Agriculture', 'Ocean', 'Drought', 'Ecology', 'Wind'];

// What this does: Renders the Real Human Field Reports window where users read observer stories or submit their own.
// On the website: Shows real field reports tailored to Simple, Normal, or Complicated mode, plus a submission tab.
// Used as: The main field observation browser and community logging modal.
export const HumanReportsModal: React.FC<HumanReportsModalProps> = ({
  isOpen,
  onClose,
  onFlyToCoordinates,
  onOpenAuthModal,
  initialReportId,
  dataBranch,
}) => {
  const {
    currentUser,
    dataMode,
    setDataMode,
    toggleSaveReport,
    isReportSaved,
    saveReportNote,
    getReportNote,
    submitUserReport,
    userSubmittedReports,
  } = useAuth();

  // Filters
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedBranch, setSelectedBranch] = useState<'all' | 'temperature' | 'humidity' | 'wind'>(() => {
    return dataBranch === 'wind' ? 'wind' : 'all';
  });
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'browse' | 'submit'>('browse');

  // Active expanded report for detailed paper view or notes
  const [expandedReportId, setExpandedReportId] = useState<string | null>(initialReportId || null);
  const [editingNoteReportId, setEditingNoteReportId] = useState<string | null>(null);
  const [tempNoteText, setTempNoteText] = useState<string>('');
  const [copiedReportId, setCopiedReportId] = useState<string | null>(null);

  // New report submission form state
  const [subName, setSubName] = useState(currentUser?.name || '');
  const [subEmail, setSubEmail] = useState(currentUser?.email || '');
  const [subRole, setSubRole] = useState('Field Observer');
  const [subYear, setSubYear] = useState<number>(2025);
  const [subMonth, setSubMonth] = useState<number>(7);
  const [subLocation, setSubLocation] = useState('');
  const [subCountry, setSubCountry] = useState('');
  const [subCategory, setSubCategory] = useState<'Cryosphere' | 'Agriculture' | 'Ocean' | 'Drought' | 'Urban' | 'General' | 'Wind'>('Wind');
  const [subText, setSubText] = useState('');
  const [subSuccess, setSubSuccess] = useState(false);

  // What this does: Automatically switches the branch filter to Wind if the user opened this popup from Wind mode.
  // On the website: Highlights wind field reports first when the user is exploring Wind telemetry.
  // Used as: A sync React effect watching dataBranch and isOpen.
  React.useEffect(() => {
    if (dataBranch === 'wind') {
      setSelectedBranch('wind');
    }
  }, [dataBranch, isOpen]);

  // What this does: Expands a specific report automatically if the app passed in an initialReportId.
  // On the website: Opens straight to a chosen report when navigated from elsewhere in the app.
  // Used as: An initial-selection sync effect.
  React.useEffect(() => {
    if (initialReportId) {
      setExpandedReportId(initialReportId);
    }
  }, [initialReportId]);

  // What this does: Filters the full archive of human field reports by year, month, category, branch, and search text.
  // On the website: Updates the visible list of report cards as the user clicks filters or types a keyword.
  // Used as: A memoized filter selector for rendering the report cards.
  const filteredReports = useMemo(() => {
    return REAL_HUMAN_FIELD_REPORTS.filter((rep) => {
      if (selectedYear !== 'all' && rep.year !== selectedYear) return false;
      if (selectedMonth !== 'all' && rep.month !== selectedMonth) return false;
      if (selectedCategory !== 'All' && rep.category !== selectedCategory) return false;
      if (selectedBranch !== 'all' && rep.branch && rep.branch !== 'both' && rep.branch !== selectedBranch) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = rep.normal.headline.toLowerCase().includes(q);
        const matchObserver = rep.observerName.toLowerCase().includes(q);
        const matchLocation = rep.locationName.toLowerCase().includes(q);
        const matchCountry = rep.country.toLowerCase().includes(q);
        const matchSimple = rep.simple.headline.toLowerCase().includes(q);
        const matchPaper = rep.complicated.paperTitle.toLowerCase().includes(q);
        if (!matchTitle && !matchObserver && !matchLocation && !matchCountry && !matchSimple && !matchPaper) {
          return false;
        }
      }
      return true;
    });
  }, [selectedYear, selectedMonth, selectedCategory, selectedBranch, searchQuery]);

  if (!isOpen) return null;

  // What this does: Formats and copies an academic citation string for a field report to the clipboard.
  // On the website: Shows a brief green checkmark on the Share/Copy button so the user knows the citation is copied.
  // Used as: The click handler for the Share button on each report card.
  const handleCopyCitation = (rep: HumanFieldReport) => {
    soundFx.playTick();
    const citation = `${rep.observerName} (${rep.year}). "${rep.complicated.paperTitle}". ${rep.locationName}, ${rep.country}. NASA Earth Trend Field Observations Registry.`;
    navigator.clipboard.writeText(citation);
    setCopiedReportId(rep.id);
    setTimeout(() => setCopiedReportId(null), 2500);
  };

  // What this does: Opens the personal note editor for a report, or prompts guest users to sign in first.
  // On the website: Reveals a text box under the report card where signed-in users can write research notes.
  // Used as: The click handler for the Note and Edit buttons.
  const handleOpenNoteEditor = (repId: string) => {
    soundFx.playTick();
    if (!currentUser && onOpenAuthModal) {
      onOpenAuthModal();
      return;
    }
    setEditingNoteReportId(repId);
    setTempNoteText(getReportNote(repId));
  };

  // What this does: Saves the user's typed personal note to their profile and closes the editor box.
  // On the website: Shows the saved yellow note strip under the report card.
  // Used as: The Save Note button click handler.
  const handleSaveNote = (repId: string) => {
    soundFx.playChime();
    saveReportNote(repId, tempNoteText);
    setEditingNoteReportId(null);
  };

  // What this does: Validates and submits the "Log Your Observation" form to save a new user field report.
  // On the website: Displays a green confirmation banner, saves the report, and switches back to the Browse tab.
  // Used as: The form submit handler on the "Log Your Observation" tab.
  const handleSubmitNewReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subLocation || !subText) return;

    submitUserReport({
      observerName: subName || 'Anonymous Observer',
      observerEmail: subEmail || 'community@earthtrend.nasa.gov',
      role: subRole,
      year: subYear,
      month: subMonth,
      locationName: subLocation,
      country: subCountry || 'Global Territory',
      lat: 0,
      lng: 0,
      category: subCategory,
      observationText: subText,
      observedAnomaly: 'Community Logged Anomaly',
    });

    soundFx.playChime();
    setSubSuccess(true);
    setTimeout(() => {
      setSubSuccess(false);
      setActiveTab('browse');
      setSubText('');
      setSubLocation('');
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-slate-950 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden font-mono flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/90 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/30 to-orange-500/30 border border-amber-400/40 flex items-center justify-center">
              <Users className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                  NASA Human Observation Registry
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  Years 2000–2026
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white font-heading">
                Reports from Real Humans (Past Years 2000–2026 &amp; Months)
              </h2>
            </div>
          </div>

          {/* Quick Data Mode Selector right in the modal header */}
          <div className="flex items-center gap-2">
            <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800 text-[11px]">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 px-2 font-bold hidden md:inline">
                Data Mode:
              </span>
              <button
                onClick={() => {
                  soundFx.playTick();
                  setDataMode('simple');
                }}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  dataMode === 'simple'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Simple Mode: B1 plain English vocabulary + rich visual gauges"
              >
                <PieChart className="w-3.5 h-3.5 text-emerald-400" />
                <span>Simple</span>
              </button>

              <button
                onClick={() => {
                  soundFx.playTick();
                  setDataMode('normal');
                }}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  dataMode === 'normal'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Normal Mode: Balanced mission baseline"
              >
                <Scale className="w-3.5 h-3.5 text-cyan-400" />
                <span>Normal</span>
              </button>

              <button
                onClick={() => {
                  soundFx.playTick();
                  setDataMode('complicated');
                }}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  dataMode === 'complicated'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Complicated Mode: Dense academic research paper format, p-values & citations"
              >
                <GraduationCap className="w-3.5 h-3.5 text-purple-400" />
                <span>Complicated</span>
              </button>
            </div>

            <button
              onClick={() => {
                soundFx.playTick();
                onClose();
              }}
              className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-Header Mode Notice & Tab Navigation */}
        <div className="flex items-center justify-between px-5 py-2.5 border-b border-slate-800 bg-slate-900/60 text-xs flex-wrap gap-2">
          {/* Active Mode Notice */}
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                dataMode === 'simple'
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                  : dataMode === 'complicated'
                  ? 'bg-purple-950/60 text-purple-300 border-purple-500/40'
                  : 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40'
              }`}
            >
              {dataMode === 'simple'
                ? '🎨 Visual & B1 Plain Language Mode Active'
                : dataMode === 'complicated'
                ? '🧪 Academic Research Paper Mode Active'
                : '⚖️ Normal Balanced Mode Active'}
            </span>
            <span className="text-[11px] text-slate-400 font-sans hidden sm:inline">
              (All buttons and tools maintain identical functionality)
            </span>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => {
                soundFx.playTick();
                setActiveTab('browse');
              }}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'browse'
                  ? 'bg-cyan-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Browse Past Reports ({REAL_HUMAN_FIELD_REPORTS.length})
            </button>

            <button
              onClick={() => {
                soundFx.playTick();
                setActiveTab('submit');
              }}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                activeTab === 'submit'
                  ? 'bg-amber-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5 text-amber-300" />
              <span>Log Your Observation</span>
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        {activeTab === 'browse' ? (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {/* Filter Bar: Years, Months, Categories, and Search */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
              {/* Year Filters */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] uppercase font-bold text-slate-400 mr-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Year:</span>
                  </span>
                  {(['all', 2000, 2003, 2007, 2010, 2012, 2015, 2018, 2020, 2022, 2023, 2024, 2025, 2026] as const).map((yr) => (
                    <button
                      key={yr}
                      onClick={() => {
                        soundFx.playTick();
                        setSelectedYear(yr);
                      }}
                      className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        selectedYear === yr
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50'
                          : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {yr === 'all' ? 'All (2000–2026)' : yr}
                    </button>
                  ))}
                </div>

                {/* Month Dropdown */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Month:</span>
                  <select
                    value={selectedMonth}
                    onChange={(e) => {
                      soundFx.playTick();
                      setSelectedMonth(e.target.value === 'all' ? 'all' : Number(e.target.value));
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    {MONTH_LABELS.map((lbl, idx) => (
                      <option key={lbl} value={idx === 0 ? 'all' : idx}>
                        {lbl}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Branch & Categories & Search Bar */}
              <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Branch filter pills */}
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 mr-0.5">Branch:</span>
                    <button
                      onClick={() => {
                        soundFx.playTick();
                        setSelectedBranch('all');
                      }}
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                        selectedBranch === 'all'
                          ? 'bg-slate-700 text-white font-bold'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => {
                        soundFx.playTick();
                        setSelectedBranch('temperature');
                      }}
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                        selectedBranch === 'temperature'
                          ? 'bg-amber-950 text-amber-300 border border-amber-600/50 font-bold'
                          : 'text-slate-400 hover:text-amber-300 hover:bg-slate-800'
                      }`}
                    >
                      <span>🌡️ Temp</span>
                    </button>
                    <button
                      onClick={() => {
                        soundFx.playTick();
                        setSelectedBranch('humidity');
                      }}
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                        selectedBranch === 'humidity'
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-600/50 font-bold'
                          : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800'
                      }`}
                    >
                      <span>💧 Humidity</span>
                    </button>
                    <button
                      onClick={() => {
                        soundFx.playTick();
                        setSelectedBranch('wind');
                      }}
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                        selectedBranch === 'wind'
                          ? 'bg-teal-950 text-teal-300 border border-teal-600/50 font-bold'
                          : 'text-slate-400 hover:text-teal-300 hover:bg-slate-800'
                      }`}
                    >
                      <span>🌬️ Wind</span>
                    </button>
                  </div>

                  <span className="text-slate-700 hidden sm:inline">|</span>

                  {/* Category filter pills */}
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-[10px] uppercase font-bold text-slate-400 mr-1 flex items-center gap-1">
                      <Filter className="w-3 h-3 text-purple-400" />
                      <span>Category:</span>
                    </span>
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => {
                          soundFx.playTick();
                          setSelectedCategory(cat);
                        }}
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                          selectedCategory === cat
                            ? 'bg-purple-950 text-purple-300 border border-purple-600/50 font-bold'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative min-w-[200px]">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search country, observer, or topic..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1 text-xs rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Reports List */}
            {filteredReports.length === 0 ? (
              <div className="p-8 rounded-xl bg-slate-900/40 border border-slate-800 text-center space-y-2">
                <Users className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-slate-300 font-bold">No human field reports match your filters.</p>
                <p className="text-slate-500 text-xs font-sans">
                  Try selecting "All Years" or clearing the search keyword.
                </p>
                <button
                  onClick={() => {
                    setSelectedYear('all');
                    setSelectedMonth('all');
                    setSelectedCategory('All');
                    setSearchQuery('');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-cyan-300 font-semibold cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredReports.map((report) => {
                  const isSaved = isReportSaved(report.id);
                  const isExpanded = expandedReportId === report.id;
                  const currentNote = getReportNote(report.id);

                  return (
                    <div
                      key={report.id}
                      className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all space-y-3.5 shadow-lg"
                    >
                      {/* Top Metadata Row */}
                      <div className="flex items-start justify-between flex-wrap gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xl" title={report.country}>
                              {report.flagEmoji}
                            </span>
                            <span className="font-bold text-white text-sm">
                              {report.locationName}, {report.country}
                            </span>
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300 border border-slate-700 font-mono">
                              {report.dateString}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800/40">
                              {report.category}
                            </span>
                          </div>

                          <div className="text-xs text-slate-400 flex items-center gap-2">
                            <span className="text-slate-200 font-semibold">
                              Observer: {report.observerName}
                            </span>
                            <span>&bull;</span>
                            <span className="text-slate-400">{report.observerRole}</span>
                            <span>&bull;</span>
                            <span className="text-slate-500">{report.institutionOrCommunity}</span>
                          </div>
                        </div>

                        {/* Button Action Bar (EXACT SAME BUTTONS IN ALL MODES) */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* Save to Account / Bookmark Button */}
                          <button
                            onClick={() => {
                              soundFx.playTick();
                              if (!currentUser && onOpenAuthModal) {
                                onOpenAuthModal();
                              } else {
                                toggleSaveReport(report.id);
                              }
                            }}
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                              isSaved
                                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                                : 'bg-slate-950 hover:bg-slate-800 border-slate-700 text-slate-300'
                            }`}
                            title={isSaved ? 'Report saved in your profile' : 'Save this report to your profile'}
                          >
                            {isSaved ? (
                              <BookmarkCheck className="w-3.5 h-3.5 text-cyan-400" />
                            ) : (
                              <Bookmark className="w-3.5 h-3.5 text-slate-400" />
                            )}
                            <span className="hidden sm:inline">{isSaved ? 'Saved' : 'Save'}</span>
                          </button>

                          {/* Add Personal Research Note */}
                          <button
                            onClick={() => handleOpenNoteEditor(report.id)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-colors cursor-pointer"
                            title="Add your personal notes to this report"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                            <span className="hidden sm:inline">Note</span>
                          </button>

                          {/* Fly 3D Globe to Location */}
                          {onFlyToCoordinates && (
                            <button
                              onClick={() => {
                                soundFx.playChime();
                                onFlyToCoordinates(
                                  report.lat,
                                  report.lng,
                                  report.year,
                                  report.month,
                                  report.locationName
                                );
                                onClose();
                              }}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors cursor-pointer shadow-sm"
                              title="Fly the 3D Earth Globe to this observer's exact location"
                            >
                              <Compass className="w-3.5 h-3.5" />
                              <span>Fly To</span>
                            </button>
                          )}

                          {/* Share / Copy Citation */}
                          <button
                            onClick={() => handleCopyCitation(report)}
                            className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                            title="Copy scientific citation for this report"
                          >
                            {copiedReportId === report.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Share2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* MODE CONTENT PRESENTATION */}

                      {/* 1. SIMPLE MODE: B1 Plain English + High Visuals */}
                      {dataMode === 'simple' && (
                        <div className="space-y-3 p-3.5 rounded-xl bg-slate-950/70 border border-emerald-500/30">
                          {/* Visual Headline */}
                          <div className="flex items-start gap-2">
                            <span className="text-xl">📢</span>
                            <div>
                              <h3 className="text-sm font-bold text-white font-sans leading-snug">
                                {report.simple.headline}
                              </h3>
                              <p className="text-[11px] text-emerald-300 mt-1 font-semibold">
                                &rarr; {report.simple.keyTakeaway}
                              </p>
                            </div>
                          </div>

                          {/* Visual Gauges & Infographic Meters (High Visual Element) */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-800">
                            {report.visualGauges.map((gauge, gIdx) => (
                              <div
                                key={gIdx}
                                className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5"
                              >
                                <div className="flex items-center justify-between text-xs">
                                  <span className="flex items-center gap-1 text-slate-300">
                                    <span>{gauge.icon}</span>
                                    <span className="font-bold">{gauge.label}</span>
                                  </span>
                                  <span
                                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                      gauge.level === 'critical'
                                        ? 'bg-rose-950 text-rose-300 border border-rose-700'
                                        : 'bg-amber-950 text-amber-300 border border-amber-700'
                                    }`}
                                  >
                                    {gauge.displayValue}
                                  </span>
                                </div>

                                {/* Visual Progress Bar */}
                                <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                                  <div
                                    className={`h-full rounded-full transition-all duration-700 ${
                                      gauge.level === 'critical'
                                        ? 'bg-gradient-to-r from-orange-500 to-rose-600'
                                        : 'bg-gradient-to-r from-amber-400 to-orange-500'
                                    }`}
                                    style={{ width: `${gauge.value}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* B1 Plain English Bullet Points */}
                          <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                              Simple Story (What The Human Observer Saw):
                            </span>
                            <div className="space-y-1 font-sans text-xs text-slate-200">
                              {report.simple.b1Summary.map((sentence, sIdx) => (
                                <div key={sIdx} className="flex items-start gap-2">
                                  <span className="text-emerald-400 mt-0.5">&bull;</span>
                                  <span>{sentence}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Action for People & Visual Tags */}
                          <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-800 text-[11px]">
                            <div className="flex items-center gap-1.5 text-slate-300 font-sans">
                              <span className="font-bold text-amber-400">Action:</span>
                              <span>{report.simple.actionForPeople}</span>
                            </div>

                            <div className="flex items-center gap-1">
                              {report.simple.visualTags.map((tag, tIdx) => (
                                <span
                                  key={tIdx}
                                  className="text-[9px] px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 2. NORMAL MODE: Balanced Narrative & Human Quotes */}
                      {dataMode === 'normal' && (
                        <div className="space-y-3 p-3.5 rounded-xl bg-slate-950/60 border border-cyan-500/30">
                          <div>
                            <h3 className="text-sm font-bold text-white font-sans leading-snug">
                              {report.normal.headline}
                            </h3>
                            <p className="text-xs text-slate-300 font-sans mt-1.5 leading-relaxed">
                              {report.normal.summary}
                            </p>
                          </div>

                          {/* Observer Quote */}
                          <div className="p-2.5 rounded-lg bg-slate-900/90 border-l-2 border-cyan-400 text-xs italic text-slate-200 font-sans">
                            {report.normal.observerQuote}
                          </div>

                          {/* Field Notes & Local Impact */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1">
                              <span className="text-[10px] uppercase font-bold text-cyan-400 block tracking-wider">
                                Field Measurement Notes
                              </span>
                              <p className="text-slate-300 font-sans leading-relaxed text-[11px]">
                                {report.normal.fieldNotes}
                              </p>
                            </div>

                            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1">
                              <span className="text-[10px] uppercase font-bold text-amber-400 block tracking-wider">
                                Local Societal Impact
                              </span>
                              <p className="text-slate-300 font-sans leading-relaxed text-[11px]">
                                {report.normal.localImpact}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 3. COMPLICATED MODE: Academic Research Paper Structure */}
                      {dataMode === 'complicated' && (
                        <div className="space-y-3.5 p-4 rounded-xl bg-slate-950/90 border border-purple-500/40">
                          {/* Academic Paper Header */}
                          <div className="space-y-1.5 border-b border-slate-800 pb-2.5">
                            <span className="text-[10px] uppercase font-bold tracking-widest text-purple-400">
                              Research Article &bull; Peer-Reviewed Monograph
                            </span>
                            <h3 className="text-sm sm:text-base font-bold text-white font-sans leading-snug">
                              {report.complicated.paperTitle}
                            </h3>
                            <div className="text-[11px] text-slate-400 flex items-center gap-2 flex-wrap">
                              <span className="text-slate-300 font-semibold">
                                {report.complicated.authors.join(', ')}
                              </span>
                              <span>&bull;</span>
                              <span className="text-purple-300 italic">{report.complicated.journalReference}</span>
                            </div>
                          </div>

                          {/* Abstract */}
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                              Abstract:
                            </span>
                            <p className="text-xs text-slate-200 font-sans leading-relaxed text-justify bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                              {report.complicated.abstract}
                            </p>
                          </div>

                          {/* Statistical Significance Block (p-value, Z-score, 95% CI) */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                              <span className="text-[9px] uppercase text-slate-400 font-bold block">
                                p-Value Significance
                              </span>
                              <strong className="text-emerald-400 font-mono text-[11px]">
                                {report.complicated.statisticalAnalysis.pValue}
                              </strong>
                            </div>

                            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                              <span className="text-[9px] uppercase text-slate-400 font-bold block">
                                Mann-Kendall Z
                              </span>
                              <strong className="text-cyan-400 font-mono text-[11px]">
                                {report.complicated.statisticalAnalysis.zScore}
                              </strong>
                            </div>

                            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                              <span className="text-[9px] uppercase text-slate-400 font-bold block">
                                Confidence Interval
                              </span>
                              <strong className="text-amber-400 font-mono text-[10px]">
                                {report.complicated.statisticalAnalysis.confidenceInterval}
                              </strong>
                            </div>

                            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                              <span className="text-[9px] uppercase text-slate-400 font-bold block">
                                Sen's Slope Rate
                              </span>
                              <strong className="text-purple-300 font-mono text-[11px]">
                                {report.complicated.statisticalAnalysis.sensSlope}
                              </strong>
                            </div>
                          </div>

                          {/* Empirical Measurement Matrix */}
                          <div className="space-y-1.5 pt-1">
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                              Empirical Telemetry Matrix:
                            </span>
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-[11px] border border-slate-800 rounded-lg overflow-hidden">
                                <thead className="bg-slate-900 text-slate-400 font-bold">
                                  <tr>
                                    <th className="p-2 border-b border-slate-800">Physical Parameter</th>
                                    <th className="p-2 border-b border-slate-800">Climatological Baseline</th>
                                    <th className="p-2 border-b border-slate-800">Observed Value</th>
                                    <th className="p-2 border-b border-slate-800">Anomaly (&Delta;)</th>
                                    <th className="p-2 border-b border-slate-800">Instrument Error (&plusmn;&sigma;)</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/80 bg-slate-950/60 font-mono">
                                  {report.complicated.empiricalDataMatrix.map((row, rIdx) => (
                                    <tr key={rIdx} className="hover:bg-slate-900/40">
                                      <td className="p-2 font-semibold text-white">{row.parameter}</td>
                                      <td className="p-2 text-slate-400">{row.baseline}</td>
                                      <td className="p-2 text-cyan-300 font-bold">{row.observed}</td>
                                      <td className="p-2 text-rose-400 font-bold">{row.deltaAnomaly}</td>
                                      <td className="p-2 text-slate-400">{row.uncertainty}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Academic References */}
                          <div className="space-y-1 pt-2 border-t border-slate-800/80 text-[10px] text-slate-400">
                            <span className="font-bold text-slate-300 block uppercase">
                              Selected Peer-Reviewed Bibliography:
                            </span>
                            {report.complicated.references.map((ref, rfIdx) => (
                              <div key={rfIdx} className="font-sans text-slate-400">
                                [{rfIdx + 1}] {ref}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Personal Custom Research Note Box (if saved or active) */}
                      {editingNoteReportId === report.id ? (
                        <div className="p-3 rounded-xl bg-slate-950 border border-amber-500/40 space-y-2">
                          <label className="text-[10px] uppercase font-bold text-amber-300 block">
                            Your Personal Observation / Research Note:
                          </label>
                          <textarea
                            rows={3}
                            value={tempNoteText}
                            onChange={(e) => setTempNoteText(e.target.value)}
                            placeholder="Add your own analysis, thesis note, or field reflection here..."
                            className="w-full p-2 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-sans"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setEditingNoteReportId(null)}
                              className="px-3 py-1 rounded bg-slate-800 text-xs text-slate-300 cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSaveNote(report.id)}
                              className="px-3 py-1 rounded bg-amber-600 hover:bg-amber-500 text-xs text-white font-bold cursor-pointer"
                            >
                              Save Note to Profile
                            </button>
                          </div>
                        </div>
                      ) : currentNote ? (
                        <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-amber-300/90 font-sans flex items-start justify-between gap-2">
                          <div>
                            <strong className="font-mono text-[10px] uppercase tracking-wider text-amber-400 block">
                              Your Saved Note:
                            </strong>
                            <span>{currentNote}</span>
                          </div>
                          <button
                            onClick={() => handleOpenNoteEditor(report.id)}
                            className="text-[10px] text-cyan-400 hover:underline shrink-0"
                          >
                            Edit
                          </button>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* SUBMIT NEW REPORT VIEW */
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <form onSubmit={handleSubmitNewReport} className="max-w-2xl mx-auto space-y-4">
              <div className="p-3 rounded-xl bg-slate-900/90 border border-amber-500/30 text-xs text-slate-300 space-y-1">
                <p className="font-bold text-white text-sm">
                  Log a Real Human Observation into the NASA Registry
                </p>
                <p className="text-[11px] text-slate-400 font-sans">
                  Contribute your own field report from recent years (2022-2026). Your report will be saved to your account and preserved across sessions.
                </p>
              </div>

              {subSuccess && (
                <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500 text-emerald-200 text-xs font-bold flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Report submitted and added to your registry!</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Observer Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maria Sanchez"
                    value={subName}
                    onChange={(e) => setSubName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Role / Occupation</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Park Ranger / Student / Farmer"
                    value={subRole}
                    onChange={(e) => setSubRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Year</label>
                  <select
                    value={subYear}
                    onChange={(e) => setSubYear(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                  >
                    {Array.from({ length: 27 }, (_, i) => 2000 + i).map((yr) => (
                      <option key={yr} value={yr}>
                        {yr}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Month</label>
                  <select
                    value={subMonth}
                    onChange={(e) => setSubMonth(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                  >
                    {MONTH_LABELS.slice(1).map((lbl, idx) => (
                      <option key={lbl} value={idx + 1}>
                        {lbl}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Domain Category</label>
                  <select
                    value={subCategory}
                    onChange={(e) => setSubCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                  >
                    {CATEGORIES.slice(1).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Location Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Phoenix, Arizona or Seville"
                    value={subLocation}
                    onChange={(e) => setSubLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Country</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. United States or Spain"
                    value={subCountry}
                    onChange={(e) => setSubCountry(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">
                  What Did You Observe? (Physical &amp; Social Details)
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe the temperature, rain, river changes, crop conditions, or daily life impacts you noticed..."
                  value={subText}
                  onChange={(e) => setSubText(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400 font-sans"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Submit Field Report to Registry</span>
              </button>
            </form>
          </div>
        )}

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-800 bg-slate-900/90 text-xs">
          <div className="flex items-center gap-2 text-slate-400 text-[11px]">
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            <span>Human Field Reports Registry &bull; 2022 to 2026 Archive</span>
          </div>

          <button
            onClick={() => {
              soundFx.playTick();
              onClose();
            }}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
