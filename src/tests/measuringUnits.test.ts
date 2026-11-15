/**
 * Unit Tests for Climate Measuring Units Conversion System
 * Tests Temperature, Humidity, and Wind Speed formulas, Dual displays, and formatters.
 */

import {
  celsiusToFahrenheit,
  fahrenheitToCelsius,
  celsiusToKelvin,
  kelvinToCelsius,
  formatTemperature,
  formatTemperatureAnomaly,
  calculateDewPoint,
  calculateSpecificHumidity,
  calculateAbsoluteHumidity,
  calculateVaporPressure,
  formatHumidity,
  msToKmh,
  kmhToMs,
  msToMph,
  msToKnots,
  msToBeaufort,
  formatWindSpeed,
} from '../utils/measuringUnits';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function testTemperatureConversions() {
  console.log('Testing Temperature Conversions...');

  // 0°C = 32°F = 273.15 K
  assert(Math.abs(celsiusToFahrenheit(0) - 32) < 0.001, '0°C should be 32°F');
  assert(Math.abs(celsiusToKelvin(0) - 273.15) < 0.001, '0°C should be 273.15 K');
  assert(Math.abs(fahrenheitToCelsius(32) - 0) < 0.001, '32°F should be 0°C');
  assert(Math.abs(kelvinToCelsius(273.15) - 0) < 0.001, '273.15 K should be 0°C');

  // 100°C = 212°F = 373.15 K
  assert(Math.abs(celsiusToFahrenheit(100) - 212) < 0.001, '100°C should be 212°F');
  assert(Math.abs(celsiusToKelvin(100) - 373.15) < 0.001, '100°C should be 373.15 K');

  // Negative values: -40°C = -40°F
  assert(Math.abs(celsiusToFahrenheit(-40) - -40) < 0.001, '-40°C should equal -40°F');

  // Formatters
  const cFormatted = formatTemperature(21.5, 'celsius');
  assert(cFormatted.includes('21.5°C'), `Expected 21.5°C, got ${cFormatted}`);

  const fFormatted = formatTemperature(21.5, 'fahrenheit');
  assert(fFormatted.includes('70.7°F'), `Expected 70.7°F, got ${fFormatted}`);

  const dualFormatted = formatTemperature(21.5, 'dual_c_f');
  assert(dualFormatted.includes('°C') && dualFormatted.includes('°F'), `Expected dual °C & °F, got ${dualFormatted}`);

  // Anomaly formatting
  const diffPos = formatTemperatureAnomaly(1.5, 'fahrenheit');
  assert(diffPos.startsWith('+') && diffPos.includes('2.70°F'), `Expected +2.70°F, got ${diffPos}`);

  console.log('✓ Temperature Conversions Passed');
}

function testHumidityConversions() {
  console.log('Testing Humidity Conversions...');

  // Dew point at 25°C and 50% RH ~ 13.9°C
  const td = calculateDewPoint(25, 50);
  assert(td > 13 && td < 15, `Dew point at 25C/50% should be ~13.9C, got ${td}`);

  // At 100% RH, Dew Point equals ambient temperature
  const td100 = calculateDewPoint(20, 100);
  assert(Math.abs(td100 - 20) < 0.1, `At 100% RH, Td should equal T, got ${td100}`);

  // Specific humidity
  const q = calculateSpecificHumidity(25, 50);
  assert(q > 9 && q < 11, `Specific humidity should be ~10 g/kg, got ${q}`);

  // Absolute humidity
  const ah = calculateAbsoluteHumidity(25, 50);
  assert(ah > 10 && ah < 13, `Absolute humidity should be ~11.5 g/m³, got ${ah}`);

  // Vapor pressure
  const vp = calculateVaporPressure(25, 50);
  assert(vp > 1.4 && vp < 1.8, `Vapor pressure should be ~1.58 kPa, got ${vp}`);

  // Formatters
  const rhFormatted = formatHumidity(65, 20, 'rh_pct');
  assert(rhFormatted.includes('65.0% RH'), `Expected 65.0% RH, got ${rhFormatted}`);

  const dualHumFormatted = formatHumidity(65, 20, 'dual_rh_dew');
  assert(dualHumFormatted.includes('% RH') && dualHumFormatted.includes('Td'), `Expected dual RH & Td, got ${dualHumFormatted}`);

  console.log('✓ Humidity Conversions Passed');
}

function testWindConversions() {
  console.log('Testing Wind Conversions...');

  // 10 m/s = 36 km/h ~ 22.4 mph ~ 19.4 knots
  assert(Math.abs(msToKmh(10) - 36) < 0.1, '10 m/s should be 36 km/h');
  assert(Math.abs(kmhToMs(36) - 10) < 0.1, '36 km/h should be 10 m/s');
  assert(Math.abs(msToMph(10) - 22.4) < 0.1, '10 m/s should be ~22.4 mph');
  assert(Math.abs(msToKnots(10) - 19.4) < 0.1, '10 m/s should be ~19.4 kn');

  // Beaufort scale
  // 0 m/s = Force 0 Calm
  const bft0 = msToBeaufort(0.1);
  assert(bft0.force === 0 && bft0.label === 'Calm', '0.1 m/s should be Calm F0');

  // 10 m/s = Force 5 Fresh Breeze (8.0 - 10.7 m/s)
  const bft5 = msToBeaufort(10);
  assert(bft5.force === 5 && bft5.label === 'Fresh Breeze', `10 m/s should be F5 Fresh Breeze, got ${bft5.force} ${bft5.label}`);

  // 35 m/s = Force 12 Hurricane Force (>= 32.7 m/s)
  const bft12 = msToBeaufort(35);
  assert(bft12.force === 12 && bft12.label === 'Hurricane Force', '35 m/s should be F12 Hurricane Force');

  // Formatters
  const windKmh = formatWindSpeed(10, 'kmh');
  assert(windKmh.includes('36.0 km/h'), `Expected 36.0 km/h, got ${windKmh}`);

  const windMph = formatWindSpeed(10, 'mph');
  assert(windMph.includes('22.4 mph'), `Expected 22.4 mph, got ${windMph}`);

  const windDual = formatWindSpeed(10, 'dual_kmh_mph');
  assert(windDual.includes('km/h') && windDual.includes('mph'), `Expected dual km/h & mph, got ${windDual}`);

  const windBft = formatWindSpeed(10, 'beaufort');
  assert(windBft.includes('Bft 5'), `Expected Bft 5, got ${windBft}`);

  console.log('✓ Wind Conversions Passed');
}

function runAllTests() {
  console.log('=============================================');
  console.log('Running Climate Measuring Units Test Suite...');
  console.log('=============================================');
  testTemperatureConversions();
  testHumidityConversions();
  testWindConversions();
  console.log('=============================================');
  console.log('ALL MEASURING UNIT TESTS PASSED SUCCESSFULLY!');
  console.log('=============================================');
}

runAllTests();
