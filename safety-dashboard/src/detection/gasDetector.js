/**
 * CognitiveMesh - Gas Detection Engine
 *
 * Processes gas sensor readings and classifies them as:
 * NORMAL / WARNING / CRITICAL
 *
 * NOTE:
 * These thresholds are DEMO thresholds for the software prototype.
 * They must be replaced/calibrated according to the actual gas sensor,
 * gas type, industrial standards, and hardware configuration.
 */

export const GAS_STATUS = {
  NORMAL: "normal",
  WARNING: "warning",
  CRITICAL: "critical",
};

export const DEFAULT_GAS_THRESHOLDS = {
  warningPpm: 50,
  criticalPpm: 100,
};

export class GasDetector {
  constructor(thresholds = DEFAULT_GAS_THRESHOLDS) {
    this.warningPpm = thresholds.warningPpm;
    this.criticalPpm = thresholds.criticalPpm;

    this.lastReading = null;
    this.lastResult = null;
  }

  /**
   * Process one gas sensor reading.
   *
   * @param {Object} reading
   * @param {number} reading.gas_ppm
   * @param {number} [reading.timestamp]
   * @param {string} [reading.worker_id]
   * @param {string} [reading.worker_name]
   * @param {string} [reading.helmet_id]
   * @param {string} [reading.zone]
   * @param {string} [reading.department]
   *
   * @returns {Object} detection result
   */
  processReading(reading) {
    if (!reading || typeof reading.gas_ppm !== "number") {
      throw new Error("Invalid gas reading: gas_ppm must be a number.");
    }

    const gasPpm = Math.max(0, reading.gas_ppm);

    let status;
    let severity;
    let message;

    if (gasPpm >= this.criticalPpm) {
      status = GAS_STATUS.CRITICAL;
      severity = "critical";
      message = "Critical gas concentration detected.";
    } else if (gasPpm >= this.warningPpm) {
      status = GAS_STATUS.WARNING;
      severity = "medium";
      message = "Elevated gas concentration detected.";
    } else {
      status = GAS_STATUS.NORMAL;
      severity = "low";
      message = "Gas concentration is within the demo safe range.";
    }

    const result = {
      detection_type: "GAS",
      detected: status !== GAS_STATUS.NORMAL,

      gas_ppm: Number(gasPpm.toFixed(2)),

      status,
      severity,
      message,

      worker_id: reading.worker_id ?? null,
      worker_name: reading.worker_name ?? null,
      helmet_id: reading.helmet_id ?? null,
      zone: reading.zone ?? null,
      department: reading.department ?? null,

      timestamp: reading.timestamp ?? Date.now(),

      detection_source: "GAS_SENSOR",

      thresholds: {
        warning_ppm: this.warningPpm,
        critical_ppm: this.criticalPpm,
      },
    };

    this.lastReading = reading;
    this.lastResult = result;

    return result;
  }

  /**
   * Reset detector state.
   */
  reset() {
    this.lastReading = null;
    this.lastResult = null;
  }

  /**
   * Get the latest detection result.
   */
  getLastResult() {
    return this.lastResult;
  }
}