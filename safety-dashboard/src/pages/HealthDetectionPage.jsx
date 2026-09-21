import React, { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Heart,
  RotateCcw,
  Thermometer,
  UserRound,
} from "lucide-react";
import HealthDetector from "../detection/healthDetector";

const DEMO_READINGS = [
  {
    worker_id: "W001",
    worker_name: "Worker W001",
    heart_rate: 82,
    spo2: 98,
    temperature: 36.7,
  },
  {
    worker_id: "W004",
    worker_name: "Worker W004",
    heart_rate: 108,
    spo2: 97,
    temperature: 36.8,
  },
  {
    worker_id: "W009",
    worker_name: "Worker W009",
    heart_rate: 105,
    spo2: 91,
    temperature: 37.2,
  },
  {
    worker_id: "W010",
    worker_name: "Worker W010",
    heart_rate: 128,
    spo2: 88,
    temperature: 39.2,
  },
];

function resultStyles(status) {
  if (status === "critical") {
    return {
      card: "border-rose-500/50 bg-rose-500/10",
      text: "text-rose-300",
      badge: "bg-rose-500/20 text-rose-300 border-rose-500/40",
      icon: "text-rose-400",
      label: "CRITICAL",
    };
  }

  if (status === "warning") {
    return {
      card: "border-amber-500/50 bg-amber-500/10",
      text: "text-amber-300",
      badge: "bg-amber-500/20 text-amber-300 border-amber-500/40",
      icon: "text-amber-400",
      label: "WARNING",
    };
  }

  return {
    card: "border-emerald-500/40 bg-emerald-500/10",
    text: "text-emerald-300",
    badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    icon: "text-emerald-400",
    label: "NORMAL",
  };
}

function Metric({ label, value, unit }) {
  return (
    <div className="rounded-md border border-slate-700 bg-slate-950/80 p-3">
      <div className="text-[10px] uppercase tracking-widest text-slate-400">
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="font-mono text-lg font-bold text-slate-100">
          {value ?? "—"}
        </span>
        {unit && (
          <span className="text-xs font-medium text-slate-400">{unit}</span>
        )}
      </div>
    </div>
  );
}

const HealthDetectionPage = ({
  healthEvents = [],
  onUpdateHealthEvents,
}) => {
  const detector = useMemo(() => new HealthDetector(), []);

  const [workerId, setWorkerId] = useState("W001");
  const [heartRate, setHeartRate] = useState("82");
  const [spo2, setSpo2] = useState("98");
  const [temperature, setTemperature] = useState("36.7");
  const [message, setMessage] = useState(
    "Enter readings and run the health detector."
  );

  const latest = healthEvents[0] || null;
  const latestStyle = latest
    ? resultStyles(latest.status)
    : resultStyles("normal");

  const runDetection = ({
    worker_id = workerId,
    heart_rate = heartRate,
    spo2: oxygen = spo2,
    temperature: temp = temperature,
  } = {}) => {
    const result = detector.detect({
      worker_id,
      heart_rate:
        heart_rate === "" || heart_rate == null
          ? null
          : Number(heart_rate),
      spo2:
        oxygen === "" || oxygen == null ? null : Number(oxygen),
      temperature:
        temp === "" || temp == null ? null : Number(temp),
    });

    const event = {
      ...result,
      id: `HEALTH-${Date.now()}`,
      worker_name: `Worker ${result.worker_id || "Unknown"}`,
      timestamp: new Date(result.detected_at).toLocaleTimeString(),
    };

    const updated = [event, ...healthEvents];
    onUpdateHealthEvents?.(updated);

    setMessage(event.message);
    return event;
  };

  const runDemo = () => {
    let updated = [];

    for (const reading of DEMO_READINGS) {
      const result = detector.detect({
        worker_id: reading.worker_id,
        heart_rate: reading.heart_rate,
        spo2: reading.spo2,
        temperature: reading.temperature,
      });

      updated.push({
        ...result,
        id: `HEALTH-${reading.worker_id}-${Date.now()}`,
        worker_name: reading.worker_name,
        timestamp: new Date(result.detected_at).toLocaleTimeString(),
      });
    }

    onUpdateHealthEvents?.([...updated, ...healthEvents]);
    setMessage("Health demo completed: 4 worker readings processed.");
  };

  const clearResults = () => {
    detector.reset();
    onUpdateHealthEvents?.([]);
    setMessage("Health detector history cleared.");
  };

  return (
    <div className="flex min-h-full flex-col gap-4 bg-slate-950 text-slate-100">
      {/* Header */}
      <section className="rounded-lg border border-slate-800 bg-slate-900/80 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md border border-sky-500/40 bg-sky-500/10">
                <Heart className="h-5 w-5 text-sky-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  Health Detection
                </h1>
                <p className="mt-1 text-sm text-slate-300">
                  Heart rate, SpO₂ and temperature health-rule detection.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={runDemo}
              className="rounded-md border border-sky-400/40 bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-400"
            >
              Run Health Demo
            </button>

            <button
              type="button"
              onClick={clearResults}
              className="rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-slate-700"
            >
              <span className="inline-flex items-center gap-2">
                <RotateCcw className="h-4 w-4" />
                Clear
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Detector input */}
      <section className="rounded-lg border border-slate-800 bg-slate-900/80 p-5">
        <div className="mb-4 flex items-center gap-2">
          <Activity className="h-4 w-4 text-sky-400" />
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-200">
            Manual Health Reading
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-300">
              Worker ID
            </span>
            <input
              value={workerId}
              onChange={(e) => setWorkerId(e.target.value)}
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-mono text-white outline-none placeholder:text-slate-600 focus:border-sky-400"
              placeholder="W001"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-300">
              Heart Rate
            </span>
            <input
              type="number"
              value={heartRate}
              onChange={(e) => setHeartRate(e.target.value)}
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-mono text-white outline-none focus:border-sky-400"
              placeholder="82"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-300">
              SpO₂
            </span>
            <input
              type="number"
              value={spo2}
              onChange={(e) => setSpo2(e.target.value)}
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-mono text-white outline-none focus:border-sky-400"
              placeholder="98"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-300">
              Temperature (°C)
            </span>
            <input
              type="number"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-mono text-white outline-none focus:border-sky-400"
              placeholder="36.7"
            />
          </label>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-300">{message}</p>

          <button
            type="button"
            onClick={() => runDetection()}
            className="rounded-md border border-emerald-400/30 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/25"
          >
            Run Detector
          </button>
        </div>
      </section>

      {/* Latest result */}
      {latest && (
        <section
          className={`rounded-lg border p-5 ${latestStyle.card}`}
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-3">
              {latest.status === "critical" ? (
                <AlertTriangle className={`mt-0.5 h-5 w-5 ${latestStyle.icon}`} />
              ) : latest.status === "warning" ? (
                <AlertTriangle className={`mt-0.5 h-5 w-5 ${latestStyle.icon}`} />
              ) : (
                <CheckCircle2 className={`mt-0.5 h-5 w-5 ${latestStyle.icon}`} />
              )}

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold text-white">
                    Latest Health Result
                  </h2>
                  <span
                    className={`rounded border px-2 py-1 text-[10px] font-bold tracking-widest ${latestStyle.badge}`}
                  >
                    {latestStyle.label}
                  </span>
                </div>

                <p className={`mt-2 text-sm font-medium ${latestStyle.text}`}>
                  {latest.message}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-300">
              <UserRound className="h-4 w-4 text-slate-400" />
              <span className="font-mono">{latest.worker_id}</span>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Metric
              label="Heart Rate"
              value={latest.heart_rate}
              unit="bpm"
            />
            <Metric
              label="SpO₂"
              value={latest.spo2}
              unit="%"
            />
            <Metric
              label="Temperature"
              value={latest.temperature}
              unit="°C"
            />
          </div>

          {latest.issues?.length > 0 && (
            <div className="mt-4 rounded-md border border-slate-700 bg-slate-950/60 p-4">
              <div className="mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-widest text-slate-200">
                  Detected Issues
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {latest.issues.map((issue) => (
                  <span
                    key={issue}
                    className="rounded border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-200"
                  >
                    {issue}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* History */}
      <section className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900/80">
        <div className="border-b border-slate-800 px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-200">
                Detection History
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                {healthEvents.length} health event
                {healthEvents.length === 1 ? "" : "s"} recorded
              </p>
            </div>
          </div>
        </div>

        {healthEvents.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <Activity className="mx-auto h-8 w-8 text-slate-600" />
            <p className="mt-3 text-sm font-medium text-slate-300">
              No health events yet.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Run the demo or enter a manual reading.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-slate-950/80">
                <tr className="border-b border-slate-800">
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Worker
                  </th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Heart Rate
                  </th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    SpO₂
                  </th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Temperature
                  </th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Status
                  </th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Issues
                  </th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Time
                  </th>
                </tr>
              </thead>

              <tbody>
                {healthEvents.map((event) => {
                  const style = resultStyles(event.status);

                  return (
                    <tr
                      key={event.id}
                      className="border-b border-slate-800/80 hover:bg-slate-800/30"
                    >
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-100">
                          {event.worker_name || "Unknown Worker"}
                        </div>
                        <div className="font-mono text-[10px] text-slate-500">
                          {event.worker_id || "—"}
                        </div>
                      </td>

                      <td className="px-4 py-3 font-mono text-sm text-slate-200">
                        {event.heart_rate ?? "—"} bpm
                      </td>

                      <td className="px-4 py-3 font-mono text-sm text-slate-200">
                        {event.spo2 ?? "—"}%
                      </td>

                      <td className="px-4 py-3 font-mono text-sm text-slate-200">
                        {event.temperature ?? "—"}°C
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded border px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${style.badge}`}
                        >
                          {style.label}
                        </span>
                      </td>

                      <td className="max-w-[360px] px-4 py-3">
                        {event.issues?.length ? (
                          <div className="flex flex-wrap gap-1.5">
                            {event.issues.map((issue) => (
                              <span
                                key={issue}
                                className="rounded bg-slate-800 px-2 py-1 text-[11px] font-medium text-slate-300"
                              >
                                {issue}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-emerald-300">
                            No issues detected
                          </span>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-400">
                        {event.timestamp || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Threshold note */}
      <section className="rounded-md border border-slate-800 bg-slate-900/60 p-4">
        <div className="flex items-start gap-3">
          <Thermometer className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" />
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-200">
              Demo Thresholds
            </h3>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              This screen uses the demo thresholds defined in
              <span className="mx-1 font-mono text-slate-300">
                healthDetector.js
              </span>
              and is intended for software demonstration, not medical diagnosis.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HealthDetectionPage;
