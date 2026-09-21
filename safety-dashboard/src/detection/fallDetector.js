// fallDetector.js
// Member 3 - Fall Detection Intelligence
//
// Input:
//   Accelerometer: ax, ay, az (in G)
//   Gyroscope: gx, gy, gz (in degrees/second)
//
// Detection sequence:
//   Free-fall → Impact → Post-impact inactivity
//
// NOTE:
// These thresholds are for our demo system.
// They must be calibrated with real helmet/IMU hardware later.

const DEFAULT_CONFIG = {
  // Acceleration magnitude below this is considered possible free-fall
  freeFallThreshold: 0.6,

  // Acceleration magnitude above this is considered a strong impact
  impactThreshold: 3.0,

  // Movement below this is considered low movement
  immobilityAccelerationThreshold: 0.25,

  // Gyroscope movement below this is considered low rotation
  immobilityGyroThreshold: 25,

  // How long after impact we monitor for immobility
  postImpactWindowMs: 3000,

  // Minimum time between two detected falls
  cooldownMs: 5000,
};

// --------------------------------------------------
// Basic calculations
// --------------------------------------------------

export function calculateAccelerationMagnitude(ax, ay, az) {
  return Math.sqrt(
    ax * ax +
    ay * ay +
    az * az
  );
}

export function calculateGyroMagnitude(gx, gy, gz) {
  return Math.sqrt(
    gx * gx +
    gy * gy +
    gz * gz
  );
}

// Estimate tilt angle from accelerometer values.
// This is most useful when the worker is relatively still.
export function calculateTiltAngle(ax, ay, az) {
  const horizontalAcceleration = Math.sqrt(
    ax * ax +
    ay * ay
  );

  return (
    Math.atan2(
      horizontalAcceleration,
      Math.abs(az)
    ) *
    (180 / Math.PI)
  );
}

// --------------------------------------------------
// Single sample analysis
// --------------------------------------------------

export function analyzeIMUSample(sample, config = DEFAULT_CONFIG) {
  const {
    ax = 0,
    ay = 0,
    az = 0,
    gx = 0,
    gy = 0,
    gz = 0,
    timestamp = Date.now(),
  } = sample;

  const accelerationMagnitude =
    calculateAccelerationMagnitude(ax, ay, az);

  const gyroMagnitude =
    calculateGyroMagnitude(gx, gy, gz);

  const tiltAngle =
    calculateTiltAngle(ax, ay, az);

  const possibleFreeFall =
    accelerationMagnitude <= config.freeFallThreshold;

  const strongImpact =
    accelerationMagnitude >= config.impactThreshold;

  const lowMovement =
    accelerationMagnitude <=
    config.immobilityAccelerationThreshold;

  const lowRotation =
    gyroMagnitude <=
    config.immobilityGyroThreshold;

  const possibleImmobility =
    lowMovement && lowRotation;

  return {
    timestamp,

    ax,
    ay,
    az,

    gx,
    gy,
    gz,

    accelerationMagnitude,
    gyroMagnitude,
    tiltAngle,

    possibleFreeFall,
    strongImpact,
    possibleImmobility,
  };
}

// --------------------------------------------------
// Fall detector
// --------------------------------------------------

export class FallDetector {
  constructor(config = {}) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    };

    this.reset();
  }

  reset() {
    this.state = "NORMAL";

    this.freeFallStartTime = null;
    this.impactTime = null;

    this.peakImpactG = 0;
    this.maxTiltAngle = 0;

    this.immobilityStartTime = null;

    this.lastFallTime = 0;

    this.lastSample = null;
  }

  processSample(sample) {
    const analyzed = analyzeIMUSample(
      sample,
      this.config
    );

    this.lastSample = analyzed;

    const now = analyzed.timestamp;

    // ----------------------------------------------
    // Prevent duplicate fall events
    // ----------------------------------------------

    if (
      now - this.lastFallTime <
      this.config.cooldownMs
    ) {
      return {
        detected: false,
        state: "COOLDOWN",
        analysis: analyzed,
      };
    }

    // ----------------------------------------------
    // STATE 1: NORMAL
    // ----------------------------------------------

    if (this.state === "NORMAL") {
      if (analyzed.possibleFreeFall) {
        this.state = "FREE_FALL";

        this.freeFallStartTime = now;

        return {
          detected: false,
          state: this.state,
          analysis: analyzed,
        };
      }

      return {
        detected: false,
        state: this.state,
        analysis: analyzed,
      };
    }

    // ----------------------------------------------
    // STATE 2: FREE FALL
    // ----------------------------------------------

    if (this.state === "FREE_FALL") {
      // Track if the worker returned to normal
      // without an impact.
      if (
        analyzed.accelerationMagnitude >
          this.config.freeFallThreshold &&
        analyzed.accelerationMagnitude <
          this.config.impactThreshold
      ) {
        this.state = "NORMAL";
        this.freeFallStartTime = null;

        return {
          detected: false,
          state: this.state,
          analysis: analyzed,
        };
      }

      // Detect impact after free-fall
      if (analyzed.strongImpact) {
        this.state = "IMPACT";

        this.impactTime = now;

        this.peakImpactG =
          analyzed.accelerationMagnitude;

        this.maxTiltAngle =
          analyzed.tiltAngle;

        this.immobilityStartTime = null;

        return {
          detected: false,
          state: this.state,
          analysis: analyzed,
        };
      }

      return {
        detected: false,
        state: this.state,
        analysis: analyzed,
      };
    }

    // ----------------------------------------------
    // STATE 3: IMPACT
    // ----------------------------------------------

    if (this.state === "IMPACT") {
      this.peakImpactG = Math.max(
        this.peakImpactG,
        analyzed.accelerationMagnitude
      );

      this.maxTiltAngle = Math.max(
        this.maxTiltAngle,
        analyzed.tiltAngle
      );

      // Worker is showing very little movement
      if (analyzed.possibleImmobility) {
        if (this.immobilityStartTime === null) {
          this.immobilityStartTime = now;
        }

        const immobilityDuration =
          now - this.immobilityStartTime;

        // Confirm fall if immobile after impact
        if (
          immobilityDuration >=
          this.config.postImpactWindowMs
        ) {
          const event =
            this.createFallEvent(
              analyzed,
              immobilityDuration
            );

          this.lastFallTime = now;

          this.state = "NORMAL";

          return {
            detected: true,
            state: "FALL_CONFIRMED",
            event,
            analysis: analyzed,
          };
        }
      } else {
        this.immobilityStartTime = null;
      }

      // If the worker starts moving again,
      // don't immediately declare a fall.
      if (
        now - this.impactTime >
        this.config.postImpactWindowMs * 2
      ) {
        this.state = "NORMAL";

        return {
          detected: false,
          state: this.state,
          analysis: analyzed,
        };
      }

      return {
        detected: false,
        state: this.state,
        analysis: analyzed,
      };
    }

    return {
      detected: false,
      state: this.state,
      analysis: analyzed,
    };
  }

  // ------------------------------------------------
  // Create event matching our existing UI structure
  // ------------------------------------------------

  createFallEvent(
    analyzed,
    immobilityDuration
  ) {
    const freeFallDuration =
      this.impactTime !== null &&
      this.freeFallStartTime !== null
        ? this.impactTime -
          this.freeFallStartTime
        : 0;

    const severity =
      this.calculateSeverity();

    return {
      worker_id: null,
      worker_name: null,
      helmet_id: null,

      zone: null,
      department: null,

      impact_g: Number(
        this.peakImpactG.toFixed(2)
      ),

      freefall_ms: Math.round(
        freeFallDuration
      ),

      estimated_drop_m:
        this.estimateDropHeight(
          freeFallDuration
        ),

      posture:
        this.getPosture(
          this.maxTiltAngle
        ),

      tilt_angle_deg: Number(
        this.maxTiltAngle.toFixed(1)
      ),

      immobility_sec: Number(
        (immobilityDuration / 1000).toFixed(1)
      ),

      status: severity,

      axis_data: {
        x: analyzed.ax,
        y: analyzed.ay,
        z: analyzed.az,
      },

      gyro_data: {
        x: analyzed.gx,
        y: analyzed.gy,
        z: analyzed.gz,
      },

      heart_rate_at_fall: null,

      detection_source: "IMU_FALL_DETECTOR",

      detected_at: analyzed.timestamp,
    };
  }

  // ------------------------------------------------
  // Severity
  // ------------------------------------------------

  calculateSeverity() {
    if (this.peakImpactG >= 5) {
      return "critical";
    }

    if (this.peakImpactG >= 3) {
      return "high";
    }

    return "medium";
  }

  // ------------------------------------------------
  // Rough demo estimate
  // ------------------------------------------------

  estimateDropHeight(freeFallMs) {
    if (!freeFallMs || freeFallMs <= 0) {
      return 0;
    }

    // h = 1/2 * g * t²
    const g = 9.81;

    const timeSeconds =
      freeFallMs / 1000;

    const height =
      0.5 *
      g *
      timeSeconds *
      timeSeconds;

    return Number(
      height.toFixed(2)
    );
  }

  // ------------------------------------------------
  // Posture estimation
  // ------------------------------------------------

  getPosture(tiltAngle) {
    if (tiltAngle >= 75) {
      return "lying";
    }

    if (tiltAngle >= 45) {
      return "fallen";
    }

    return "upright";
  }
}

// --------------------------------------------------
// Convenience function
// --------------------------------------------------

export function detectFall(
  samples,
  config = {}
) {
  const detector =
    new FallDetector(config);

  let result = null;

  for (const sample of samples) {
    const output =
      detector.processSample(sample);

    if (output.detected) {
      result = output;
      break;
    }
  }

  return result;
}

export default FallDetector;