/**
 * Mann-Kendall Trend Test & Sen's Slope Estimator
 * Rigorous non-parametric statistical testing for NASA Space Apps Challenge
 */

import { MannKendallResult, TimeSeriesPoint } from '../types/climate';

// What this does: A small math helper that calculates a bell-curve probability score.
// On the website: Works quietly behind the scenes to check if a warming trend is real or just random luck.
// Used as: The math helper for `standardNormalCdf` below.
function erf(x: number): number {
  // Constants
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -0.145315202;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x);

  const t = 1.0 / (1.0 + p * absX);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);

  return sign * y;
}

// What this does: Converts a Z-score into a percentage along a standard bell curve.
// On the website: Helps calculate the p-value shown in the stats badge of the sidebar.
// Used as: Step 2 of the statistical trend test.
function standardNormalCdf(z: number): number {
  return 0.5 * (1.0 + erf(z / Math.SQRT2));
}

// What this does: Checks a place's yearly data (2000–2040) to measure whether it is genuinely heating up, cooling down, or staying flat, and how fast per year.
// On the website: Produces the "Trend Direction", "Sen's Slope", and "Statistically Significant (p-value)" numbers shown in the country/hotspot sidebar and reports.
// Used as: The main statistical trend calculator across the whole website.
export function calculateMannKendall(
  data: TimeSeriesPoint[],
  alpha: number = 0.05
): MannKendallResult {
  const n = data.length;
  if (n < 3) {
    return {
      s: 0,
      tau: 0,
      varianceS: 0,
      zScore: 0,
      pValue: 1.0,
      sensSlope: 0,
      isSignificant: false,
      alpha,
      h0Rejected: false,
      trendDirection: 'stable',
      sampleCount: n,
    };
  }

  // 1. Calculate Mann-Kendall S statistic
  let s = 0;
  for (let k = 0; k < n - 1; k++) {
    for (let j = k + 1; j < n; j++) {
      const diff = data[j].value - data[k].value;
      if (diff > 0.000001) s += 1;
      else if (diff < -0.000001) s -= 1;
    }
  }

  // 2. Identify tied groups in values for tie correction in Var(S)
  const valMap = new Map<number, number>();
  for (let i = 0; i < n; i++) {
    const rounded = Math.round(data[i].value * 1000) / 1000;
    valMap.set(rounded, (valMap.get(rounded) || 0) + 1);
  }

  let tieSum = 0;
  valMap.forEach((count) => {
    if (count > 1) {
      tieSum += count * (count - 1) * (2 * count + 5);
    }
  });

  // 3. Compute Variance of S: Var(S) = [n(n-1)(2n+5) - sum(t*(t-1)*(2t+5))] / 18
  const baseVar = (n * (n - 1) * (2 * n + 5) - tieSum) / 18.0;
  const varianceS = Math.max(baseVar, 1.0);
  const stdDev = Math.sqrt(varianceS);

  // 4. Compute Standard Test Statistic Z
  let zScore = 0;
  if (s > 0) {
    zScore = (s - 1) / stdDev;
  } else if (s < 0) {
    zScore = (s + 1) / stdDev;
  } else {
    zScore = 0;
  }

  // 5. Two-tailed p-value
  const cdfVal = standardNormalCdf(Math.abs(zScore));
  const pValue = Math.min(1.0, Math.max(0.00001, 2 * (1.0 - cdfVal)));

  // 6. Kendall's Tau: tau = S / [n(n-1)/2]
  const maxPossiblePairs = (n * (n - 1)) / 2;
  const tau = maxPossiblePairs > 0 ? s / maxPossiblePairs : 0;

  // 7. Sen's Slope Estimator: Median of (x_j - x_k) / (j - k)
  const slopes: number[] = [];
  for (let k = 0; k < n - 1; k++) {
    for (let j = k + 1; j < n; j++) {
      const yearDiff = data[j].year - data[k].year;
      if (yearDiff !== 0) {
        slopes.push((data[j].value - data[k].value) / yearDiff);
      }
    }
  }

  slopes.sort((a, b) => a - b);
  let sensSlope = 0;
  if (slopes.length > 0) {
    const mid = Math.floor(slopes.length / 2);
    if (slopes.length % 2 === 0) {
      sensSlope = (slopes[mid - 1] + slopes[mid]) / 2;
    } else {
      sensSlope = slopes[mid];
    }
  }

  const isSignificant = pValue < alpha;
  const h0Rejected = isSignificant;

  let trendDirection: 'decreasing' | 'increasing' | 'stable' = 'stable';
  if (sensSlope > 0.0001 && isSignificant) {
    trendDirection = 'increasing';
  } else if (sensSlope < -0.0001 && isSignificant) {
    trendDirection = 'decreasing';
  }

  return {
    s,
    tau: Math.round(tau * 1000) / 1000,
    varianceS: Math.round(varianceS * 10) / 10,
    zScore: Math.round(zScore * 100) / 100,
    pValue: pValue < 0.0001 ? 0.00009 : Math.round(pValue * 10000) / 10000,
    sensSlope: Math.round(sensSlope * 10000) / 10000,
    isSignificant,
    alpha,
    h0Rejected,
    trendDirection,
    sampleCount: n,
  };
}
