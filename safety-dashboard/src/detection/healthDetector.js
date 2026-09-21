// healthDetector.js

export class HealthDetector {
  constructor() {
    this.lastResult = null;
  }

  detect({
    worker_id = null,
    heart_rate = null,
    spo2 = null,
    temperature = null,
  }) {
    const issues = [];

    // Heart rate — demo thresholds
    if (heart_rate !== null) {
      if (heart_rate >= 120) {
        issues.push("Very high heart rate");
      } else if (heart_rate >= 100) {
        issues.push("Elevated heart rate");
      } else if (heart_rate < 50) {
        issues.push("Low heart rate");
      }
    }

    // SpO2 — demo thresholds
    if (spo2 !== null) {
      if (spo2 < 90) {
        issues.push("Critically low SpO₂");
      } else if (spo2 < 94) {
        issues.push("Low SpO₂");
      }
    }

    // Temperature — demo thresholds
    if (temperature !== null) {
      if (temperature >= 39) {
        issues.push("Very high temperature");
      } else if (temperature >= 38) {
        issues.push("Elevated temperature");
      }
    }

    // Determine severity
    let status = "normal";
    let severity = "low";

    if (
      issues.some(
        (issue) =>
          issue === "Very high heart rate" ||
          issue === "Critically low SpO₂" ||
          issue === "Very high temperature"
      )
    ) {
      status = "critical";
      severity = "critical";
    } else if (issues.length > 0) {
      status = "warning";
      severity = "medium";
    }

    const result = {
      worker_id,
      heart_rate,
      spo2,
      temperature,
      status,
      severity,
      detected: issues.length > 0,
      issues,
      message:
        issues.length === 0
          ? "Health readings are within the demo safe range."
          : issues.join(", "),
      detection_source: "HEALTH_RULE_ENGINE",
      detected_at: Date.now(),
    };

    this.lastResult = result;

    return result;
  }

  reset() {
    this.lastResult = null;
  }
}

export default HealthDetector;