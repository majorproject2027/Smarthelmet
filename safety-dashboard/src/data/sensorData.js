/* ==========================================================================
   Sensor Telemetry Data for Fall Detection & Alcohol Screening Sensors
   Empty initial state - values & events captured live from sensors
   ========================================================================== */

export const INITIAL_FALL_EVENTS = [];

export const INITIAL_ALCOHOL_SCREENINGS = [];

export const DEMO_ALCOHOL_TREND = [];

export function generateFallWaveform(peakG = 4.8) {
  const gVal = Number(peakG) || 4.8;
  return [
    { t: "-600ms", g: 1.01, ax: 0.05, ay: 0.98, az: 0.12, note: "Normal Walking" },
    { t: "-500ms", g: 0.99, ax: 0.08, ay: 0.95, az: 0.15, note: "Normal" },
    { t: "-400ms", g: 1.05, ax: 0.12, ay: 1.01, az: 0.10, note: "Trip / Stumble" },
    { t: "-300ms", g: 0.45, ax: 0.22, ay: 0.35, az: 0.15, note: "Freefall Begins" },
    { t: "-200ms", g: 0.15, ax: 0.05, ay: 0.12, az: 0.08, note: "Weightlessness" },
    { t: "-100ms", g: 0.10, ax: 0.02, ay: 0.08, az: 0.05, note: "Freefall Peak" },
    { t: "0ms (Impact)", g: gVal, ax: parseFloat((gVal * 0.25).toFixed(2)), ay: parseFloat((gVal * 0.88).toFixed(2)), az: parseFloat((gVal * 0.32).toFixed(2)), note: `IMPACT (${gVal}G)` },
    { t: "+100ms", g: parseFloat((gVal * 0.44).toFixed(2)), ax: 0.65, ay: 1.85, az: 0.72, note: "Rebound / Bounce" },
    { t: "+200ms", g: 1.25, ax: 0.30, ay: 1.15, az: 0.35, note: "Deceleration" },
    { t: "+300ms", g: 1.01, ax: 0.18, ay: 0.96, az: 0.18, note: "Resting" },
    { t: "+400ms", g: 0.99, ax: 0.12, ay: 0.98, az: 0.05, note: "Zero Motion" },
    { t: "+500ms", g: 1.00, ax: 0.09, ay: 0.99, az: 0.04, note: "Immobility Confirmed" },
  ];
}

export const DEMO_FALL_WAVEFORM = generateFallWaveform(4.8);
