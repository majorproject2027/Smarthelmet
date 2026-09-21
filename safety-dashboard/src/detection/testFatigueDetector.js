import FatigueDetector from "./fatigueDetector.js";

const detector = new FatigueDetector();

console.log("=================================");
console.log(" CognitiveMesh Fatigue Detector Test");
console.log("=================================");

const testCases = [
  {
    worker_id: "W001",
    heart_rate: 82,
    spo2: 98,
    temperature: 36.7,
    activity_level: 75,
    immobility_sec: 5,
  },

  {
    worker_id: "W004",
    heart_rate: 105,
    spo2: 97,
    temperature: 36.8,
    activity_level: 35,
    immobility_sec: 20,
  },

  {
    worker_id: "W009",
    heart_rate: 105,
    spo2: 91,
    temperature: 37.2,
    activity_level: 25,
    immobility_sec: 35,
  },

  {
    worker_id: "W010",
    heart_rate: 128,
    spo2: 88,
    temperature: 39.2,
    activity_level: 10,
    immobility_sec: 70,
  },
];

for (const input of testCases) {
  const result = detector.detect(input);

  console.log("");
  console.log("---------------------------------");

  console.log(
    `Input: ${input.worker_id}`
  );

  console.log(
    `  HR:          ${input.heart_rate} bpm`
  );

  console.log(
    `  SpO₂:        ${input.spo2}%`
  );

  console.log(
    `  Temperature: ${input.temperature} °C`
  );

  console.log(
    `  Activity:    ${input.activity_level}`
  );

  console.log(
    `  Immobility:  ${input.immobility_sec} sec`
  );

  console.log("");

  console.log(
    `Result:`
  );

  console.log(
    `  Score:       ${result.fatigue_score}`
  );

  console.log(
    `  Status:      ${result.status}`
  );

  console.log(
    `  Severity:    ${result.severity}`
  );

  console.log(
    `  Detected:    ${result.detected}`
  );

  console.log(
    `  Indicators:  ${
      result.indicators.length
        ? result.indicators.join(", ")
        : "None"
    }`
  );

  console.log(
    `  Message:     ${result.message}`
  );
}

console.log("");
console.log("=================================");
console.log(" Expected:");
console.log(" W001 → normal");
console.log(" W004 → warning");
console.log(" W009 → warning/high");
console.log(" W010 → critical");
console.log("=================================");