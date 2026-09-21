// fatigueDetector.js
// Demo rule-based fatigue detection for CognitiveMesh Smart Helmet

export class FatigueDetector {
  constructor() {
    this.lastResult = null;
  }

  detect({
    worker_id = null,
    heart_rate = null,
    spo2 = null,
    temperature = null,
    activity_level = null,
    immobility_sec = null,
  }) {
    let score = 0;
    const indicators = [];

    /*
     * HEART RATE
     * Demo contribution only.
     */
    if (heart_rate !== null) {
      if (heart_rate >= 120) {
        score += 30;
        indicators.push("Very high heart rate");
      } else if (heart_rate >= 100) {
        score += 20;
        indicators.push("Elevated heart rate");
      }
    }

    /*
     * SPO2
     * Demo contribution only.
     */
    if (spo2 !== null) {
      if (spo2 < 90) {
        score += 25;
        indicators.push("Very low SpO₂");
      } else if (spo2 < 94) {
        score += 15;
        indicators.push("Low SpO₂");
      }
    }

    /*
     * TEMPERATURE
     */
    if (temperature !== null) {
      if (temperature >= 39) {
        score += 20;
        indicators.push("Very high temperature");
      } else if (temperature >= 38) {
        score += 10;
        indicators.push("Elevated temperature");
      }
    }

    /*
     * ACTIVITY LEVEL
     * Expected demo range: 0–100
     * Lower activity can contribute to fatigue score.
     */
    if (activity_level !== null) {
      if (activity_level < 20) {
        score += 20;
        indicators.push("Very low activity");
      } else if (activity_level < 40) {
        score += 10;
        indicators.push("Reduced activity");
      }
    }

    /*
     * IMMOBILITY
     */
    if (immobility_sec !== null) {
      if (immobility_sec >= 60) {
        score += 15;
        indicators.push("Prolonged immobility");
      } else if (immobility_sec >= 30) {
        score += 10;
        indicators.push("Reduced movement");
      }
    }

    // Maximum score = 110, normalize to 100.
    score = Math.min(Math.round((score / 110) * 100), 100);

    let status = "normal";
    let severity = "low";

    if (score >= 70) {
      status = "critical";
      severity = "critical";
    } else if (score >= 50) {
      status = "high";
      severity = "high";
    } else if (score >= 30) {
      status = "warning";
      severity = "medium";
    }

    const result = {
      worker_id,
      heart_rate,
      spo2,
      temperature,
      activity_level,
      immobility_sec,

      fatigue_score: score,
      status,
      severity,

      detected: score >= 30,

      indicators,

      message:
        indicators.length === 0
          ? "Fatigue indicators are within the demo normal range."
          : indicators.join(", "),

      detection_source: "FATIGUE_RULE_ENGINE",
      detected_at: Date.now(),
    };

    this.lastResult = result;

    return result;
  }

  reset() {
    this.lastResult = null;
  }
}

export default FatigueDetector;