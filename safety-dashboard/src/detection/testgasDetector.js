import {
  GasDetector,
  GAS_STATUS,
} from "./gasDetector.js";

const detector = new GasDetector();

const testReadings = [
  {
    gas_ppm: 20,
    worker_id: "W001",
    worker_name: "Worker 001",
    helmet_id: "H001",
    zone: "Zone A",
    department: "Production",
  },

  {
    gas_ppm: 65,
    worker_id: "W002",
    worker_name: "Worker 002",
    helmet_id: "H002",
    zone: "Zone B",
    department: "Production",
  },

  {
    gas_ppm: 120,
    worker_id: "W007",
    worker_name: "Worker 007",
    helmet_id: "H007",
    zone: "Zone C",
    department: "Chemical",
  },
];

console.log("=================================");
console.log(" CognitiveMesh Gas Detector Test");
console.log("=================================\n");

for (const reading of testReadings) {
  const result = detector.processReading({
    ...reading,
    timestamp: Date.now(),
  });

  console.log("Input:");
  console.log(`  Worker: ${reading.worker_id}`);
  console.log(`  Gas:    ${reading.gas_ppm} PPM`);

  console.log("\nResult:");
  console.log(`  Status:   ${result.status}`);
  console.log(`  Severity: ${result.severity}`);
  console.log(`  Detected: ${result.detected}`);
  console.log(`  Message:  ${result.message}`);

  console.log("\n---------------------------------\n");
}

console.log("Expected:");
console.log(`  20 PPM  → ${GAS_STATUS.NORMAL}`);
console.log(`  65 PPM  → ${GAS_STATUS.WARNING}`);
console.log(`  120 PPM → ${GAS_STATUS.CRITICAL}`);