/**
 * Unit Tests for Time Machine Timeline
 * Tests range limits, Today marker position math, navigation steps, and observed/projected boundary.
 */

import {
  START_YEAR,
  START_MONTH,
  END_YEAR,
  END_MONTH,
  TODAY_YEAR,
  TODAY_MONTH,
  TOTAL_MONTHS,
  TOTAL_STEPS,
  TODAY_STEP_INDEX,
  TODAY_PERCENT,
  yearMonthToStep,
  stepToYearMonth,
  isProjectedDate,
  calculateConfidenceInterval,
  calculateBaselineChange,
} from '../config/timelineConfig';

export function runTimelineTests(): { passed: boolean; results: { name: string; pass: boolean; details?: string }[] } {
  const results: { name: string; pass: boolean; details?: string }[] = [];

  function assert(name: string, condition: boolean, details?: string) {
    results.push({ name, pass: condition, details });
  }

  // 1. Range bounds and total months
  assert('Start Date is Jan 2000', START_YEAR === 2000 && START_MONTH === 1);
  assert('End Date is Dec 2040', END_YEAR === 2040 && END_MONTH === 12);
  assert('Total months is exactly 492 (41 years * 12)', TOTAL_MONTHS === 492);
  assert('Total steps is 491 (0..491)', TOTAL_STEPS === 491);

  // 2. Clamping and step conversion
  const stepStart = yearMonthToStep(2000, 1);
  assert('Jan 2000 maps to step 0', stepStart === 0);

  const stepEnd = yearMonthToStep(2040, 12);
  assert('Dec 2040 maps to step 491', stepEnd === 491);

  const stepClampedMin = yearMonthToStep(1975, 5);
  assert('Years before 2000 clamp to 0', stepClampedMin === 0);

  const stepClampedMax = yearMonthToStep(2055, 8);
  assert('Years after 2040 clamp to 491', stepClampedMax === 491);

  const ymStart = stepToYearMonth(0);
  assert('Step 0 converts back to Jan 2000', ymStart.year === 2000 && ymStart.month === 1);

  const ymEnd = stepToYearMonth(491);
  assert('Step 491 converts back to Dec 2040', ymEnd.year === 2040 && ymEnd.month === 12);

  // 3. Today marker position math
  assert('Today is November 2026', TODAY_YEAR === 2026 && TODAY_MONTH === 11);
  assert('Today step index is exactly 322', TODAY_STEP_INDEX === 322);
  assert(
    'Today position is ~65.6% (roughly 67% from left)',
    Math.abs(TODAY_PERCENT - 65.58) < 0.5,
    `Calculated percent: ${TODAY_PERCENT.toFixed(2)}%`
  );

  // 4. Observed vs Projected switch boundary
  assert('Jan 2000 is Observed', isProjectedDate(2000, 1) === false);
  assert('Oct 2026 is Observed', isProjectedDate(2026, 10) === false);
  assert('Nov 2026 (Today) is Observed', isProjectedDate(2026, 11) === false);
  assert('Dec 2026 (first future month) is Projected', isProjectedDate(2026, 12) === true);
  assert('Jan 2027 is Projected', isProjectedDate(2027, 1) === true);
  assert('Dec 2040 is Projected', isProjectedDate(2040, 12) === true);

  // 5. Navigation step calculations (Arrows, Shift+Arrows, Jumps)
  const current = yearMonthToStep(2026, 11);
  const nextMonthStep = Math.min(TOTAL_STEPS, current + 1);
  const nextMonthYM = stepToYearMonth(nextMonthStep);
  assert('1 month forward from Nov 2026 is Dec 2026', nextMonthYM.year === 2026 && nextMonthYM.month === 12);

  const nextYearStep = Math.min(TOTAL_STEPS, current + 12);
  const nextYearYM = stepToYearMonth(nextYearStep);
  assert('12 months forward (Shift+Arrow) from Nov 2026 is Nov 2027', nextYearYM.year === 2027 && nextYearYM.month === 11);

  // 6. 95% Confidence Interval calculations
  const pastCI = calculateConfidenceInterval(20.0, 2020, 5, 'temp');
  assert('Past date has isProjection: false', pastCI.isProjection === false);

  const future2028CI = calculateConfidenceInterval(20.0, 2028, 1, 'temp');
  const future2040CI = calculateConfidenceInterval(20.0, 2040, 12, 'temp');
  assert('Future date has isProjection: true', future2028CI.isProjection === true);
  assert('Future 2040 has wider uncertainty margin than 2028', future2040CI.margin > future2028CI.margin);
  assert('Future 2040 CI low is less than value', future2040CI.low < 20.0);
  assert('Future 2040 CI high is greater than value', future2040CI.high > 20.0);

  // 7. Baseline comparison (2000-2010 average)
  const baseComp = calculateBaselineChange(22.4, 21.0);
  assert('Baseline change calculates correctly (+1.4)', baseComp.delta === 1.4 && baseComp.isWarming);

  const allPassed = results.every((r) => r.pass);
  return { passed: allPassed, results };
}

// Auto-run if executed directly in node / tsx
if (typeof process !== 'undefined' && process.argv && process.argv[1]?.includes('timeline.test.ts')) {
  const { passed, results } = runTimelineTests();
  console.log(`Timeline Unit Tests: ${passed ? 'ALL PASSED ✅' : 'FAILURES DETECTED ❌'}`);
  results.forEach((r) => console.log(`  ${r.pass ? '✓' : '✗'} ${r.name} ${r.details ? `(${r.details})` : ''}`));
  if (!passed) process.exit(1);
}
