import { FallDetector } from "./fallDetector.js";

const detector = new FallDetector();

const startTime = Date.now();

const testSamples = [
  // 1. Normal walking
  {
    timestamp: startTime,
    ax: 0.1,
    ay: 0.2,
    az: 0.98,
    gx: 5,
    gy: 8,
    gz: 4,
  },

  // 2. Free-fall begins
  {
    timestamp: startTime + 100,
    ax: 0.05,
    ay: 0.03,
    az: 0.10,
    gx: 10,
    gy: 12,
    gz: 8,
  },

  // 3. Strong impact
  {
    timestamp: startTime + 250,
    ax: 2.5,
    ay: 1.5,
    az: 3.5,
    gx: 40,
    gy: 30,
    gz: 25,
  },

  // 4. Worker is now almost motionless
  {
    timestamp: startTime + 1000,
    ax: 0.05,
    ay: 0.03,
    az: 0.05,
    gx: 5,
    gy: 4,
    gz: 3,
  },

  // 5. Still motionless
  {
    timestamp: startTime + 2500,
    ax: 0.04,
    ay: 0.03,
    az: 0.05,
    gx: 4,
    gy: 3,
    gz: 2,
  },

  // 6. Immobility exceeds 3 seconds
  {
    timestamp: startTime + 4500,
    ax: 0.03,
    ay: 0.04,
    az: 0.05,
    gx: 3,
    gy: 2,
    gz: 2,
  },
];

console.log("=================================");
console.log("   FALL DETECTOR TEST");
console.log("=================================");

for (const sample of testSamples) {
  const result = detector.processSample(sample);

  console.log(
    new Date(sample.timestamp).toISOString(),
    result
  );

  if (result.detected) {
    console.log("🚨 FALL DETECTED!");
    console.log("Fall Event:");
    console.log(result.event);
  }
}