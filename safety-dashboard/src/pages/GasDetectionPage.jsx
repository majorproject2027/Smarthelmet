import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  Radio,
  Activity,
  ShieldAlert,
  CheckCircle2,
  User,
  Gauge,
  Clock3,
  MapPin,
  RefreshCw,
} from "lucide-react";

import {
  GasDetector,
  GAS_STATUS,
} from "../detection/gasDetector";

const createEventId = () =>
  `GAS-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

const formatTime = (timestamp) => {
  if (!timestamp) return "--";

  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const statusLabel = (status) => {
  switch (status) {
    case GAS_STATUS.CRITICAL:
      return "CRITICAL";
    case GAS_STATUS.WARNING:
      return "WARNING";
    default:
      return "NORMAL";
  }
};

const statusClasses = (status) => {
  switch (status) {
    case GAS_STATUS.CRITICAL:
      return {
        badge: "bg-red-100 text-red-700 border-red-200",
        card: "border-red-300 bg-red-50",
        text: "text-red-700",
      };

    case GAS_STATUS.WARNING:
      return {
        badge: "bg-yellow-100 text-yellow-700 border-yellow-200",
        card: "border-yellow-300 bg-yellow-50",
        text: "text-yellow-700",
      };

    default:
      return {
        badge: "bg-green-100 text-green-700 border-green-200",
        card: "border-green-300 bg-green-50",
        text: "text-green-700",
      };
  }
};

export default function GasDetectionPage({
  gasEvents = [],
  onUpdateGasEvents,
  workers = [],
  onSelectWorker,
}) {
  const [detector] = useState(() => new GasDetector());

  const [selectedEvent, setSelectedEvent] = useState(null);

  const [filter, setFilter] = useState("all");

  const [showCustomModal, setShowCustomModal] = useState(false);

  const [customGas, setCustomGas] = useState("20");
  const [customWorker, setCustomWorker] = useState("W001");
  const [customWorkerName, setCustomWorkerName] = useState("Worker 001");
  const [customHelmet, setCustomHelmet] = useState("H001");
  const [customZone, setCustomZone] = useState("Zone A");
  const [customDepartment, setCustomDepartment] =
    useState("Production");

  const [detectorMessage, setDetectorMessage] = useState(
    "Gas detector ready"
  );

  /*
   * ------------------------------------------------------------------
   * EVENT CREATION
   * ------------------------------------------------------------------
   */

  const createGasEvent = (result, extraData = {}) => {
    const event = {
      id: createEventId(),

      detection_type: "GAS",

      worker_id: result.worker_id,
      worker_name: result.worker_name,
      helmet_id: result.helmet_id,

      zone: result.zone,
      department: result.department,

      gas_ppm: result.gas_ppm,

      status: result.status,
      severity: result.severity,

      detected: result.detected,

      message: result.message,

      detection_source: result.detection_source,

      timestamp: result.timestamp,

      thresholds: result.thresholds,

      sensor_model: "Demo Gas Sensor",

      notes:
        result.status === GAS_STATUS.CRITICAL
          ? "Critical gas concentration detected by gas detection engine."
          : result.status === GAS_STATUS.WARNING
          ? "Elevated gas concentration detected by gas detection engine."
          : "Gas reading processed successfully.",

      ...extraData,
    };

    const currentEvents = Array.isArray(gasEvents)
      ? gasEvents
      : [];

    if (typeof onUpdateGasEvents === "function") {
      onUpdateGasEvents([event, ...currentEvents]);
    }

    setSelectedEvent(event);

    return event;
  };

  /*
   * ------------------------------------------------------------------
   * PROCESS GAS READING
   * ------------------------------------------------------------------
   */

  const processGasReading = ({
    gas_ppm,
    worker_id,
    worker_name,
    helmet_id,
    zone,
    department,
    source = "GAS_SENSOR",
  }) => {
    try {
      const result = detector.processReading({
        gas_ppm: Number(gas_ppm),

        worker_id,
        worker_name,
        helmet_id,
        zone,
        department,

        timestamp: Date.now(),
      });

      setDetectorMessage(
        `${statusLabel(result.status)} gas condition detected`
      );

      return createGasEvent(result, {
        detection_source: source,
      });
    } catch (error) {
      console.error("Gas detection error:", error);

      setDetectorMessage("Invalid gas sensor reading.");

      return null;
    }
  };

  /*
   * ------------------------------------------------------------------
   * SIMULATE GAS SENSOR
   * ------------------------------------------------------------------
   *
   * This does NOT directly create a fake event.
   *
   * The simulated PPM value is sent through the actual GasDetector.
   */

  const handleSimulateGas = () => {
    const demoReadings = [
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

    const randomReading =
      demoReadings[
        Math.floor(Math.random() * demoReadings.length)
      ];

    processGasReading({
      ...randomReading,
      source: "SIMULATED_GAS_SENSOR",
    });
  };

  /*
   * ------------------------------------------------------------------
   * CUSTOM SENSOR INPUT
   * ------------------------------------------------------------------
   */

  const handleCustomSubmit = (event) => {
    event.preventDefault();

    const gasValue = Number(customGas);

    if (Number.isNaN(gasValue) || gasValue < 0) {
      window.alert("Please enter a valid gas concentration.");
      return;
    }

    const createdEvent = processGasReading({
      gas_ppm: gasValue,

      worker_id: customWorker,
      worker_name: customWorkerName,
      helmet_id: customHelmet,

      zone: customZone,
      department: customDepartment,

      source: "MANUAL_GAS_SENSOR_INPUT",
    });

    if (createdEvent) {
      setShowCustomModal(false);
    }
  };

  /*
   * ------------------------------------------------------------------
   * FILTERING
   * ------------------------------------------------------------------
   */

  const filteredEvents = useMemo(() => {
    const events = Array.isArray(gasEvents)
      ? gasEvents
      : [];

    if (filter === "all") {
      return events;
    }

    return events.filter(
      (event) => event.status === filter
    );
  }, [gasEvents, filter]);

  /*
   * ------------------------------------------------------------------
   * STATISTICS
   * ------------------------------------------------------------------
   */

  const statistics = useMemo(() => {
    const events = Array.isArray(gasEvents)
      ? gasEvents
      : [];

    const normal = events.filter(
      (event) => event.status === GAS_STATUS.NORMAL
    ).length;

    const warning = events.filter(
      (event) => event.status === GAS_STATUS.WARNING
    ).length;

    const critical = events.filter(
      (event) => event.status === GAS_STATUS.CRITICAL
    ).length;

    const detectedEvents = events.filter(
      (event) => event.detected
    ).length;

    return {
      total: events.length,
      normal,
      warning,
      critical,
      detectedEvents,
    };
  }, [gasEvents]);

  /*
   * ------------------------------------------------------------------
   * CURRENT CRITICAL EVENT
   * ------------------------------------------------------------------
   */

  const activeCriticalEvent = useMemo(() => {
    const events = Array.isArray(gasEvents)
      ? gasEvents
      : [];

    return events.find(
      (event) => event.status === GAS_STATUS.CRITICAL
    );
  }, [gasEvents]);

  /*
   * ------------------------------------------------------------------
   * CLEAR EVENTS
   * ------------------------------------------------------------------
   */

  const handleClearEvents = () => {
    if (typeof onUpdateGasEvents === "function") {
      onUpdateGasEvents([]);
    }

    setSelectedEvent(null);
    detector.reset();

    setDetectorMessage("Gas event history cleared");
  };

  /*
   * ------------------------------------------------------------------
   * UI
   * ------------------------------------------------------------------
   */

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* ==========================================================
            CRITICAL ALERT
        ========================================================== */}

        {activeCriticalEvent && (
          <div className="rounded-2xl border-2 border-red-300 bg-red-50 p-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

              <div className="flex items-start gap-4">

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-600 text-white">
                  <ShieldAlert size={25} />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-red-800">
                      CRITICAL GAS ALERT
                    </h2>

                    <span className="animate-pulse rounded-full bg-red-600 px-2 py-1 text-xs font-bold text-white">
                      ACTIVE
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-red-700">
                    {activeCriticalEvent.gas_ppm} PPM detected for{" "}
                    <strong>
                      {activeCriticalEvent.worker_name ||
                        activeCriticalEvent.worker_id ||
                        "Unknown worker"}
                    </strong>
                    .
                  </p>

                  <p className="mt-1 text-xs text-red-600">
                    Zone:{" "}
                    {activeCriticalEvent.zone || "--"}{" "}
                    · Helmet:{" "}
                    {activeCriticalEvent.helmet_id || "--"}
                  </p>
                </div>
              </div>

              <button
                onClick={() =>
                  setSelectedEvent(activeCriticalEvent)
                }
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                View Incident
              </button>

            </div>
          </div>
        )}

        {/* ==========================================================
            HEADER
        ========================================================== */}

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>
            <div className="flex items-center gap-3">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white">
                <Radio size={25} />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Gas Detection
                </h1>

                <p className="text-sm text-slate-500">
                  Real-time gas sensor monitoring and safety
                  event detection
                </p>
              </div>

            </div>
          </div>

          <div className="flex flex-wrap gap-2">

            <button
              onClick={handleSimulateGas}
              className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <RefreshCw size={17} />
              Simulate Gas Reading
            </button>

            <button
              onClick={() => setShowCustomModal(true)}
              className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              <Gauge size={17} />
              Manual Sensor Input
            </button>

          </div>
        </div>

        {/* ==========================================================
            DETECTOR STATUS
        ========================================================== */}

        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">

          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500" />
          </span>

          <span className="text-sm font-medium text-slate-700">
            Gas Detector Online
          </span>

          <span className="text-sm text-slate-400">
            ·
          </span>

          <span className="text-sm text-slate-500">
            {detectorMessage}
          </span>

        </div>

        {/* ==========================================================
            KPI CARDS
        ========================================================== */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">

          {/* Total */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Total Events
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {statistics.total}
                </p>
              </div>

              <div className="rounded-xl bg-slate-100 p-3 text-slate-700">
                <Activity size={22} />
              </div>

            </div>
          </div>

          {/* Normal */}

          <div className="rounded-2xl border border-green-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-green-600">
                  Normal
                </p>

                <p className="mt-2 text-3xl font-bold text-green-700">
                  {statistics.normal}
                </p>
              </div>

              <div className="rounded-xl bg-green-100 p-3 text-green-600">
                <CheckCircle2 size={22} />
              </div>

            </div>
          </div>

          {/* Warning */}

          <div className="rounded-2xl border border-yellow-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-yellow-600">
                  Warning
                </p>

                <p className="mt-2 text-3xl font-bold text-yellow-700">
                  {statistics.warning}
                </p>
              </div>

              <div className="rounded-xl bg-yellow-100 p-3 text-yellow-600">
                <AlertTriangle size={22} />
              </div>

            </div>
          </div>

          {/* Critical */}

          <div className="rounded-2xl border border-red-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-red-600">
                  Critical
                </p>

                <p className="mt-2 text-3xl font-bold text-red-700">
                  {statistics.critical}
                </p>
              </div>

              <div className="rounded-xl bg-red-100 p-3 text-red-600">
                <ShieldAlert size={22} />
              </div>

            </div>
          </div>

          {/* Detected */}

          <div className="rounded-2xl border border-orange-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-orange-600">
                  Detected
                </p>

                <p className="mt-2 text-3xl font-bold text-orange-700">
                  {statistics.detectedEvents}
                </p>
              </div>

              <div className="rounded-xl bg-orange-100 p-3 text-orange-600">
                <Radio size={22} />
              </div>

            </div>
          </div>

        </div>

        {/* ==========================================================
            THRESHOLDS
        ========================================================== */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="mb-4 flex items-center justify-between">

            <div>
              <h2 className="font-bold text-slate-900">
                Gas Detection Thresholds
              </h2>

              <p className="text-sm text-slate-500">
                Current software prototype thresholds
              </p>
            </div>

            <Gauge
              size={22}
              className="text-slate-500"
            />

          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

            <div className="rounded-xl border border-green-200 bg-green-50 p-4">
              <p className="text-xs font-semibold uppercase text-green-600">
                Normal
              </p>

              <p className="mt-1 text-xl font-bold text-green-700">
                &lt; 50 PPM
              </p>

              <p className="mt-1 text-xs text-green-600">
                No gas safety event generated
              </p>
            </div>

            <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
              <p className="text-xs font-semibold uppercase text-yellow-600">
                Warning
              </p>

              <p className="mt-1 text-xl font-bold text-yellow-700">
                50–99 PPM
              </p>

              <p className="mt-1 text-xs text-yellow-600">
                Elevated gas concentration
              </p>
            </div>

            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-xs font-semibold uppercase text-red-600">
                Critical
              </p>

              <p className="mt-1 text-xl font-bold text-red-700">
                ≥ 100 PPM
              </p>

              <p className="mt-1 text-xs text-red-600">
                Critical gas safety event
              </p>
            </div>

          </div>

          <div className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
            <strong>Prototype note:</strong>{" "}
            These thresholds are synthetic demo values for
            CognitiveMesh software testing. They must be calibrated
            against the actual gas sensor, gas type, industrial
            exposure standards, and deployment environment before
            real-world use.
          </div>

        </div>

        {/* ==========================================================
            SELECTED EVENT
        ========================================================== */}

        {selectedEvent && (
          <div
            className={`rounded-2xl border-2 p-5 shadow-sm ${
              statusClasses(selectedEvent.status).card
            }`}
          >

            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

              <div>
                <div className="flex items-center gap-2">

                  <h2 className="text-lg font-bold text-slate-900">
                    Selected Gas Incident
                  </h2>

                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs font-bold ${
                      statusClasses(selectedEvent.status).badge
                    }`}
                  >
                    {statusLabel(selectedEvent.status)}
                  </span>

                </div>

                <p className="mt-1 text-sm text-slate-500">
                  Event ID: {selectedEvent.id}
                </p>
              </div>

              <button
                onClick={() => setSelectedEvent(null)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>

            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">

              {/* Gas */}

              <div className="rounded-xl border border-white/70 bg-white p-4">

                <div className="flex items-center gap-2 text-slate-500">
                  <Gauge size={18} />
                  <span className="text-xs font-semibold uppercase">
                    Gas Concentration
                  </span>
                </div>

                <p
                  className={`mt-2 text-3xl font-bold ${
                    statusClasses(selectedEvent.status).text
                  }`}
                >
                  {selectedEvent.gas_ppm}
                  <span className="ml-1 text-sm">
                    PPM
                  </span>
                </p>

              </div>

              {/* Worker */}

              <div className="rounded-xl border border-white/70 bg-white p-4">

                <div className="flex items-center gap-2 text-slate-500">
                  <User size={18} />
                  <span className="text-xs font-semibold uppercase">
                    Worker
                  </span>
                </div>

                <p className="mt-2 font-bold text-slate-900">
                  {selectedEvent.worker_name ||
                    selectedEvent.worker_id ||
                    "Unknown"}
                </p>

                <p className="text-xs text-slate-500">
                  ID: {selectedEvent.worker_id || "--"}
                </p>

              </div>

              {/* Location */}

              <div className="rounded-xl border border-white/70 bg-white p-4">

                <div className="flex items-center gap-2 text-slate-500">
                  <MapPin size={18} />
                  <span className="text-xs font-semibold uppercase">
                    Location
                  </span>
                </div>

                <p className="mt-2 font-bold text-slate-900">
                  {selectedEvent.zone || "--"}
                </p>

                <p className="text-xs text-slate-500">
                  {selectedEvent.department || "--"}
                </p>

              </div>

              {/* Timestamp */}

              <div className="rounded-xl border border-white/70 bg-white p-4">

                <div className="flex items-center gap-2 text-slate-500">
                  <Clock3 size={18} />
                  <span className="text-xs font-semibold uppercase">
                    Detected At
                  </span>
                </div>

                <p className="mt-2 font-bold text-slate-900">
                  {formatTime(selectedEvent.timestamp)}
                </p>

                <p className="text-xs text-slate-500">
                  Helmet: {selectedEvent.helmet_id || "--"}
                </p>

              </div>

            </div>

            <div className="mt-4 rounded-xl border border-white/70 bg-white p-4">

              <p className="text-xs font-semibold uppercase text-slate-500">
                Detection Message
              </p>

              <p className="mt-1 text-sm font-medium text-slate-800">
                {selectedEvent.message}
              </p>

              <p className="mt-2 text-xs text-slate-500">
                Source:{" "}
                {selectedEvent.detection_source || "GAS_SENSOR"}
              </p>

            </div>

          </div>
        )}

        {/* ==========================================================
            EVENT LOG
        ========================================================== */}

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="flex flex-col gap-4 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between">

            <div>
              <h2 className="font-bold text-slate-900">
                Gas Event Log
              </h2>

              <p className="text-sm text-slate-500">
                Gas readings processed by the detection engine
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">

              <select
                value={filter}
                onChange={(event) =>
                  setFilter(event.target.value)
                }
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-500"
              >
                <option value="all">
                  All Events
                </option>

                <option value={GAS_STATUS.NORMAL}>
                  Normal
                </option>

                <option value={GAS_STATUS.WARNING}>
                  Warning
                </option>

                <option value={GAS_STATUS.CRITICAL}>
                  Critical
                </option>
              </select>

              {gasEvents.length > 0 && (
                <button
                  onClick={handleClearEvents}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Clear
                </button>
              )}

            </div>

          </div>

          {filteredEvents.length === 0 ? (

            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">

              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <Radio size={28} />
              </div>

              <h3 className="mt-4 font-semibold text-slate-800">
                No gas events yet
              </h3>

              <p className="mt-1 max-w-md text-sm text-slate-500">
                Use "Simulate Gas Reading" or "Manual Sensor
                Input" to send a reading through the gas
                detection engine.
              </p>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full min-w-[900px] text-left">

                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">

                  <tr>
                    <th className="px-5 py-3">
                      Time
                    </th>

                    <th className="px-5 py-3">
                      Worker
                    </th>

                    <th className="px-5 py-3">
                      Helmet
                    </th>

                    <th className="px-5 py-3">
                      Zone
                    </th>

                    <th className="px-5 py-3">
                      Gas
                    </th>

                    <th className="px-5 py-3">
                      Status
                    </th>

                    <th className="px-5 py-3">
                      Severity
                    </th>

                    <th className="px-5 py-3">
                      Action
                    </th>
                  </tr>

                </thead>

                <tbody className="divide-y divide-slate-100">

                  {filteredEvents.map((event) => {

                    const classes = statusClasses(
                      event.status
                    );

                    return (
                      <tr
                        key={event.id}
                        className="transition hover:bg-slate-50"
                      >

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {formatTime(event.timestamp)}
                        </td>

                        <td className="px-5 py-4">

                          <div className="font-semibold text-slate-800">
                            {event.worker_name ||
                              event.worker_id ||
                              "--"}
                          </div>

                          <div className="text-xs text-slate-500">
                            {event.worker_id || "--"}
                          </div>

                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {event.helmet_id || "--"}
                        </td>

                        <td className="px-5 py-4">

                          <div className="text-sm font-medium text-slate-700">
                            {event.zone || "--"}
                          </div>

                          <div className="text-xs text-slate-500">
                            {event.department || "--"}
                          </div>

                        </td>

                        <td className="px-5 py-4">

                          <span className="font-bold text-slate-900">
                            {event.gas_ppm}
                          </span>

                          <span className="ml-1 text-xs text-slate-500">
                            PPM
                          </span>

                        </td>

                        <td className="px-5 py-4">

                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${classes.badge}`}
                          >
                            {statusLabel(event.status)}
                          </span>

                        </td>

                        <td className="px-5 py-4 text-sm font-medium capitalize text-slate-700">
                          {event.severity || "--"}
                        </td>

                        <td className="px-5 py-4">

                          <button
                            onClick={() => {
                              setSelectedEvent(event);

                              if (
                                typeof onSelectWorker ===
                                "function"
                              ) {
                                const worker = workers.find(
                                  (item) =>
                                    item.worker_id ===
                                      event.worker_id ||
                                    item.id ===
                                      event.worker_id
                                );

                                if (worker) {
                                  onSelectWorker(worker);
                                }
                              }
                            }}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                          >
                            View
                          </button>

                        </td>

                      </tr>
                    );
                  })}

                </tbody>

              </table>

            </div>
          )}

        </div>

        {/* ==========================================================
            DETECTION FLOW
        ========================================================== */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <h2 className="font-bold text-slate-900">
            Gas Detection Pipeline
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Current software detection flow
          </p>

          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-4">

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-bold uppercase text-slate-400">
                Step 01
              </div>

              <p className="mt-2 font-semibold text-slate-800">
                Gas Sensor
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Reads gas concentration in PPM
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-bold uppercase text-slate-400">
                Step 02
              </div>

              <p className="mt-2 font-semibold text-slate-800">
                GasDetector
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Classifies the reading using configured
                thresholds
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-bold uppercase text-slate-400">
                Step 03
              </div>

              <p className="mt-2 font-semibold text-slate-800">
                Safety Event
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Creates normal, warning, or critical event
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-bold uppercase text-slate-400">
                Step 04
              </div>

              <p className="mt-2 font-semibold text-slate-800">
                Alert Layer
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Ready for backend and smartwatch integration
              </p>
            </div>

          </div>

        </div>

      </div>

      {/* ============================================================
          MANUAL SENSOR MODAL
      ============================================================ */}

      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-slate-200 p-5">

              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Manual Gas Sensor Input
                </h2>

                <p className="text-sm text-slate-500">
                  Send a custom reading through GasDetector
                </p>
              </div>

              <button
                onClick={() =>
                  setShowCustomModal(false)
                }
                className="rounded-lg px-3 py-2 text-slate-500 hover:bg-slate-100"
              >
                ✕
              </button>

            </div>

            <form
              onSubmit={handleCustomSubmit}
              className="space-y-5 p-5"
            >

              {/* Gas */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Gas Concentration (PPM)
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={customGas}
                  onChange={(event) =>
                    setCustomGas(event.target.value)
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-lg font-semibold outline-none focus:border-slate-500"
                  placeholder="Enter gas PPM"
                  required
                />

                <div className="mt-2 flex gap-2 text-xs">

                  <button
                    type="button"
                    onClick={() => setCustomGas("20")}
                    className="rounded-md bg-green-50 px-2 py-1 text-green-700"
                  >
                    20 PPM
                  </button>

                  <button
                    type="button"
                    onClick={() => setCustomGas("65")}
                    className="rounded-md bg-yellow-50 px-2 py-1 text-yellow-700"
                  >
                    65 PPM
                  </button>

                  <button
                    type="button"
                    onClick={() => setCustomGas("120")}
                    className="rounded-md bg-red-50 px-2 py-1 text-red-700"
                  >
                    120 PPM
                  </button>

                </div>

              </div>

              {/* Worker fields */}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Worker ID
                  </label>

                  <input
                    value={customWorker}
                    onChange={(event) =>
                      setCustomWorker(event.target.value)
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
                    placeholder="W001"
                    required
                  />

                </div>

                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Worker Name
                  </label>

                  <input
                    value={customWorkerName}
                    onChange={(event) =>
                      setCustomWorkerName(event.target.value)
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
                    placeholder="Worker 001"
                  />

                </div>

                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Helmet ID
                  </label>

                  <input
                    value={customHelmet}
                    onChange={(event) =>
                      setCustomHelmet(event.target.value)
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
                    placeholder="H001"
                  />

                </div>

                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Zone
                  </label>

                  <input
                    value={customZone}
                    onChange={(event) =>
                      setCustomZone(event.target.value)
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
                    placeholder="Zone A"
                  />

                </div>

                <div className="md:col-span-2">

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Department
                  </label>

                  <input
                    value={customDepartment}
                    onChange={(event) =>
                      setCustomDepartment(event.target.value)
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
                    placeholder="Production"
                  />

                </div>

              </div>

              {/* Preview */}

              <div className="rounded-xl bg-slate-50 p-4">

                <p className="text-xs font-semibold uppercase text-slate-500">
                  Detection Preview
                </p>

                <div className="mt-3 flex items-center justify-between">

                  <span className="text-sm text-slate-600">
                    {customGas || 0} PPM
                  </span>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      Number(customGas) >= 100
                        ? "bg-red-100 text-red-700"
                        : Number(customGas) >= 50
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {Number(customGas) >= 100
                      ? "CRITICAL"
                      : Number(customGas) >= 50
                      ? "WARNING"
                      : "NORMAL"}
                  </span>

                </div>

              </div>

              {/* Buttons */}

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">

                <button
                  type="button"
                  onClick={() =>
                    setShowCustomModal(false)
                  }
                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Process Gas Reading
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}