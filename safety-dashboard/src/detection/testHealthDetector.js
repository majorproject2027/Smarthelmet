import HealthDetector from "./healthDetector.js";

const detector = new HealthDetector();

console.log("=================================");
console.log(" CognitiveMesh Health Detector Test");
console.log("=================================");

// Test 1 — Normal
console.log("\nTEST 1 — Normal Health");

console.log(
  detector.detect({
    worker_id: "W001",
    heart_rate: 82,
    spo2: 98,
    temperature: 36.7,
  })
);

// Test 2 — Elevated heart rate
console.log("\nTEST 2 — Elevated Heart Rate");

console.log(
  detector.detect({
    worker_id: "W004",
    heart_rate: 108,
    spo2: 97,
    temperature: 36.8,
  })
);

// Test 3 — Low SpO2
console.log("\nTEST 3 — Low SpO₂");

console.log(
  detector.detect({
    worker_id: "W009",
    heart_rate: 105,
    spo2: 91,
    temperature: 37.2,
  })
);

// Test 4 — Critical
console.log("\nTEST 4 — Critical Health");

console.log(
  detector.detect({
    worker_id: "W010",
    heart_rate: 128,
    spo2: 88,
    temperature: 39.2,
  })
);

console.log("\n=================================");
console.log(" Health Detector Test Complete");
console.log("=================================");