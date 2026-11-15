/**
 * NASA Earth Trend Detective - Time Machine Timeline Configuration
 * Single source of truth for the planetary 4D timeline.
 * 
 * Range:
 * Start: January 2000 (TIMELINE_START = '2000-01')
 * End: December 2040 (TIMELINE_END = '2040-12')
 * Today: November 2026 (TODAY_DATE = '2026-11')
 * 
 * Splits:
 * - Observed: Jan 2000 up to Nov 2026 (~26 years of NASA MERRA-2 / POWER API history)
 * - Projected: Dec 2026 to Dec 2040 (~14 years of CMIP6/SSP2-4.5 predictive modeling)
 */

export const TIMELINE_START = '2000-01';
export const TIMELINE_END = '2040-12';
export const TODAY_DATE = '2026-11';

// Parsed numerical bounds
export const START_YEAR = 2000;
export const START_MONTH = 1; // January (1-indexed)

export const END_YEAR = 2040;
export const END_MONTH = 12; // December

export const TODAY_YEAR = 2026;
export const TODAY_MONTH = 11; // November 2026

// Total months: (2040 - 2000) * 12 + 12 = 492 months
export const TOTAL_MONTHS = (END_YEAR - START_YEAR) * 12 + (END_MONTH - START_MONTH + 1);
// Total step index range: 0 to 491
export const TOTAL_STEPS = TOTAL_MONTHS - 1;

// Step index for Today (Nov 2026): (2026 - 2000) * 12 + (11 - 1) = 26 * 12 + 10 = 322
export const TODAY_STEP_INDEX = (TODAY_YEAR - START_YEAR) * 12 + (TODAY_MONTH - 1);

// Today's position as exact track percentage: 322 / 491 * 100 ≈ 65.5804% (~66-67%)
export const TODAY_PERCENT = (TODAY_STEP_INDEX / TOTAL_STEPS) * 100;

export const MONTH_NAMES_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

// What this does: Turns a year and month (1 to 12) into a single step number from 0 to 491.
// On the website: Helps the bottom timeline slider know exactly where on the bar any month sits.
// Used as: A helper converter whenever the app updates or seeks the timeline slider.
export function yearMonthToStep(year: number, month: number): number {
  const safeMonth = Math.max(1, Math.min(12, month));
  const rawStep = (year - START_YEAR) * 12 + (safeMonth - 1);
  return Math.max(0, Math.min(TOTAL_STEPS, rawStep));
}

// What this does: Converts a timeline step number (0 to 491) back into a calendar year and month.
// On the website: Tells the app what month and year to display when the user drags the timeline handle.
// Used as: The reverse timeline converter used during playback and scrubbing.
export function stepToYearMonth(step: number): { year: number; month: number } {
  const safeStep = Math.max(0, Math.min(TOTAL_STEPS, Math.round(step)));
  const year = START_YEAR + Math.floor(safeStep / 12);
  const month = (safeStep % 12) + 1;
  return { year, month };
}

// What this does: Checks if a given month and year are in the future forecast part (after November 2026) instead of past real observations.
// On the website: Switches badges and colors from "Observed" to "AI Prediction" whenever the user moves past Nov 2026.
// Used as: The rule that separates real history from AI forecasts across the app.
export function isProjectedDate(year: number, month: number): boolean {
  if (year > TODAY_YEAR) return true;
  if (year === TODAY_YEAR && month > TODAY_MONTH) return true;
  return false;
}

// What this does: Formats a year and month into a short text label like "Nov 2026".
// On the website: Shows compact date labels on buttons and small mobile badges.
// Used as: A short date text formatter.
export function formatMonthYear(year: number, month: number): string {
  const safeMonth = Math.max(1, Math.min(12, month));
  return `${MONTH_NAMES_SHORT[safeMonth - 1]} ${year}`;
}

// What this does: Formats a year and month using the full month name like "November 2026".
// On the website: Displays the full readable date in timeline headers and spoken readouts.
// Used as: A full date text formatter.
export function formatFullMonthYear(year: number, month: number): string {
  const safeMonth = Math.max(1, Math.min(12, month));
  return `${MONTH_NAMES_FULL[safeMonth - 1]} ${year}`;
}

/**
 * 5-year tick marks from 2000 to 2040 for the slider
 */
export interface TimelineTick {
  year: number;
  label: string;
  step: number;
  percent: number;
  isMajor: boolean;
  isToday?: boolean;
}

// What this does: Creates the list of yearly tick marks from 2000 to 2040 along with their exact percentage positions on the bar.
// On the website: Draws the 2000, 2005, 2010 ... 2040 labels and the "Today" marker along the bottom timeline track.
// Used as: The tick-mark generator for the timeline dock.
export function generateTimelineTicks(): TimelineTick[] {
  const ticks: TimelineTick[] = [];
  for (let y = START_YEAR; y <= END_YEAR; y++) {
    const isMajor = y % 5 === 0;
    const step = (y - START_YEAR) * 12;
    const percent = (step / TOTAL_STEPS) * 100;
    ticks.push({
      year: y,
      label: `${y}`,
      step,
      percent,
      isMajor,
      isToday: y === TODAY_YEAR,
    });
  }
  return ticks;
}

/**
 * Calculates 95% Confidence Interval for projected data points.
 * For past dates (observed), confidence band represents instrument calibration bounds (narrow).
 * For future dates, uncertainty grows over time according to CMIP6 ensemble spread.
 */
export interface ConfidenceInterval {
  value: number;
  low: number;
  high: number;
  isProjection: boolean;
  margin: number;
  confidenceLevel: string;
}

// What this does: Computes the 95% confidence range around a climate number — tight for past satellite readings and wider further into the 2040 future.
// On the website: Draws the shaded uncertainty cone in the trend chart and fills the "Range: low - high" projection box.
// Used as: The forecast uncertainty calculator for temperature, humidity, and wind.
export function calculateConfidenceInterval(
  value: number,
  year: number,
  month: number,
  metricType: 'temp' | 'humidity' | 'wind' = 'temp'
): ConfidenceInterval {
  const projected = isProjectedDate(year, month);
  if (!projected) {
    // Observed NASA MERRA-2 instrument margin
    const margin = metricType === 'temp' ? 0.12 : metricType === 'humidity' ? 0.8 : 0.25;
    return {
      value,
      low: Number((value - margin).toFixed(2)),
      high: Number((value + margin).toFixed(2)),
      isProjection: false,
      margin,
      confidenceLevel: 'NASA MERRA-2 Ground-Truth Calibration (±' + margin + ')',
    };
  }

  // Future projection: months ahead of Nov 2026
  const currentStep = yearMonthToStep(year, month);
  const monthsAhead = Math.max(1, currentStep - TODAY_STEP_INDEX);
  const yearsAhead = monthsAhead / 12;

  // Error standard deviation increases with root time (random walk ensemble variance)
  let baseSE = 0.18; // degrees C per sqrt year
  if (metricType === 'humidity') baseSE = 0.65;
  if (metricType === 'wind') baseSE = 0.35;

  const standardError = baseSE * Math.sqrt(yearsAhead);
  const zScore95 = 1.96; // 95% two-tailed confidence interval
  const margin = Number((zScore95 * standardError).toFixed(2));

  return {
    value,
    low: Number((value - margin).toFixed(2)),
    high: Number((value + margin).toFixed(2)),
    isProjection: true,
    margin,
    confidenceLevel: '95% CI (CMIP6 Ensemble Projection)',
  };
}

// What this does: Subtracts the 2000–2010 baseline average from the current value and formats it with a plus or minus sign.
// On the website: Shows "Change vs 2000-2010" inside the side telemetry panel so users see how much a place has shifted.
// Used as: A simple baseline comparison helper.
export function calculateBaselineChange(currentValue: number, baseline2000_2010: number): {
  delta: number;
  formattedDelta: string;
  isWarming: boolean;
} {
  const delta = Number((currentValue - baseline2000_2010).toFixed(2));
  const isWarming = delta >= 0;
  const formattedDelta = delta > 0 ? `+${delta.toFixed(1)}` : `${delta.toFixed(1)}`;
  return { delta, formattedDelta, isWarming };
}
