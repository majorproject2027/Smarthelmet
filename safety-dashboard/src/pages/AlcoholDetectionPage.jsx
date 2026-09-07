import React, { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";
import {
  WineOff,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap,
  Gauge,
  FlaskConical,
  ShieldCheck,
  Ban,
  ChevronRight,
  RotateCcw,
  Plus,
  X,
} from "lucide-react";

function cls(...args) {
  return args.filter(Boolean).join(" ");
}

export default function AlcoholDetectionPage({
  screenings = [],
  onUpdateScreenings,
  onSelectWorker,
  workers = [],
  onAddOrUpdateWorker,
}) {
  const [selectedScreeningId, setSelectedScreeningId] = useState(
    screenings[0]?.id || null
  );
  const [filterStatus, setFilterStatus] = useState("all");
  const [simMode, setSimMode] = useState("violation"); // cleared, warning, violation
  const [showCustomModal, setShowCustomModal] = useState(false);

  // Custom screening input
  const [customWorkerName, setCustomWorkerName] = useState("");
  const [customWorkerId, setCustomWorkerId] = useState("");
  const [customHelmetId, setCustomHelmetId] = useState("");
  const [customBac, setCustomBac] = useState("0.065");
  const [customTestType, setCustomTestType] = useState("Continuous In-Helmet Sniffer");

  const selectedScreening =
    screenings.find((s) => s.id === selectedScreeningId) || screenings[0] || null;

  const totalTests = screenings.length;
  const violations = screenings.filter((s) => s.status === "violation").length;
  const warnings = screenings.filter((s) => s.status === "warning").length;
  const cleared = screenings.filter((s) => s.status === "cleared").length;
  const passRate = totalTests > 0 ? ((cleared / totalTests) * 100).toFixed(1) : "100.0";

  const filteredScreenings = screenings.filter((s) => {
    if (filterStatus === "all") return true;
    return s.status === filterStatus;
  });

  const handleClearLockout = (id) => {
    const updated = screenings.map((s) =>
      s.id === id
        ? {
            ...s,
            status: "cleared",
            action: "MANUALLY CLEARED: Secondary test passed 0.00%. Equipment interlock released.",
            bac_percent: 0.0,
            raw_ppm: 12,
          }
        : s
    );
    onUpdateScreenings(updated);
  };

  const createScreening = (sc) => {
    const nextList = [sc, ...screenings];
    onUpdateScreenings(nextList);
    setSelectedScreeningId(sc.id);

    if (onAddOrUpdateWorker) {
      onAddOrUpdateWorker({
        worker_id: sc.worker_id,
        worker_name: sc.worker_name,
        role: sc.department || "Operator",
        helmet_id: sc.helmet_id,
        department: sc.department,
        zone: sc.zone,
        status: sc.status === "violation" ? "critical" : sc.status === "warning" ? "warning" : "safe",
        lastEvent: sc.status === "violation" ? "Alcohol Lockout" : sc.status === "warning" ? "Elevated BAC" : "Screening Cleared",
        hr: 82,
        spo2: 98,
        temp: 27,
        humidity: 55,
        gas: 190,
        co: 2,
        fatigue: "normal",
        ppe: { helmet: true, vest: true, gloves: true, goggles: true, mask: true },
        alcohol_sensor: {
          status: sc.status,
          bac: sc.bac_percent,
          raw_ppm: sc.raw_ppm,
          voltage: sc.sensor_voltage_v,
          lockout: sc.status === "violation",
        },
      });
    }
  };

  const handleSimulateTest = () => {
    const defaultWorkers = [
      { name: "Marcus Vance", id: "W-601", helmet: "HLM-201", zone: "D", dept: "Packaging" },
      { name: "Liam O'Connor", id: "W-602", helmet: "HLM-202", zone: "B", dept: "Maintenance" },
      { name: "Aria Stark", id: "W-603", helmet: "HLM-203", zone: "A", dept: "Operations" },
    ];
    const target = workers.length > 0
      ? workers[Math.floor(Math.random() * workers.length)]
      : defaultWorkers[Math.floor(Math.random() * defaultWorkers.length)];

    let bac = 0.0;
    let ppm = 12;
    let voltage = 0.32;
    let status = "cleared";
    let action = "CLEARED: Turnstile Access Granted";

    if (simMode === "warning") {
      bac = 0.024;
      ppm = 105;
      voltage = 1.35;
      status = "warning";
      action = "ELEVATED: Secondary breathalyzer re-test required before heavy equipment operation.";
    } else if (simMode === "violation") {
      bac = 0.072;
      ppm = 360;
      voltage = 2.95;
      status = "violation";
      action = "LOCKOUT INITIATED: Machinery Interlock Activated & Supervisor Alerted";
    }

    const newScreening = {
      id: `ALC-${Math.floor(100 + Math.random() * 900)}`,
      worker_id: target.worker_id || target.id,
      worker_name: target.worker_name || target.name,
      helmet_id: target.helmet_id || target.helmet,
      zone: target.zone || "A",
      department: target.department || target.dept || "General",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      test_type: "Continuous In-Helmet Sniffer",
      bac_percent: bac,
      brac_mg_l: parseFloat((bac * 5).toFixed(2)),
      raw_ppm: ppm,
      sensor_voltage_v: voltage,
      status: status,
      action: action,
      sensor_model: "MQ-3 Ethanol Gas Sensor",
      temp_comp_c: 28.0,
      humidity_comp_pct: 55,
      confidence_score: 97.5,
    };

    createScreening(newScreening);
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customWorkerName.trim() || !customWorkerId.trim()) return;

    const bac = parseFloat(customBac) || 0.0;
    const isViolation = bac >= 0.05;
    const isWarning = bac > 0.01 && bac < 0.05;
    const status = isViolation ? "violation" : isWarning ? "warning" : "cleared";
    const ppm = isViolation ? Math.round(bac * 5000) : isWarning ? 90 : 14;
    const voltage = isViolation ? 2.85 : isWarning ? 1.25 : 0.32;
    const action = isViolation
      ? "LOCKOUT INITIATED: Machinery Interlock Activated & Supervisor Alerted"
      : isWarning
      ? "ELEVATED: Secondary breath verification required"
      : "CLEARED: Turnstile Access Granted";

    const newScreening = {
      id: `ALC-${Math.floor(100 + Math.random() * 900)}`,
      worker_id: customWorkerId.trim(),
      worker_name: customWorkerName.trim(),
      helmet_id: customHelmetId.trim() || `H-${customWorkerId.trim()}`,
      zone: "B",
      department: "Field Operations",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      test_type: customTestType,
      bac_percent: bac,
      brac_mg_l: parseFloat((bac * 5).toFixed(2)),
      raw_ppm: ppm,
      sensor_voltage_v: voltage,
      status: status,
      action: action,
      sensor_model: "MQ-3 Ethanol Gas Sensor",
      temp_comp_c: 27.5,
      humidity_comp_pct: 52,
      confidence_score: 98.2,
    };

    createScreening(newScreening);
    setShowCustomModal(false);
    setCustomWorkerName("");
    setCustomWorkerId("");
    setCustomHelmetId("");
  };

  // Generate dynamic trend for chart
  const trendData = screenings.length > 0
    ? screenings.slice(0, 7).reverse().map((s, idx) => ({
        time: s.timestamp.slice(0, 5),
        avgPpm: s.raw_ppm,
        bac: s.bac_percent,
        test: idx + 1,
      }))
    : [];

  return (
    <div className="flex flex-col gap-5">
      {/* Header & Simulator Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-4 rounded-md">
        <div>
          <div className="flex items-center gap-2">
            <WineOff className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-slate-100 uppercase tracking-wide">
              Alcohol Detection & Sniffer Telemetry
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time breath and ambient vapor screening powered by helmet-integrated MQ-3 gas sensors and turnstile fuel-cell docks.
          </p>
        </div>

        {/* Simulation trigger */}
        <div className="flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-md border border-slate-800 flex-wrap">
          <button
            onClick={() => setShowCustomModal(true)}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-2.5 py-1 rounded text-xs font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Custom Test
          </button>
          <span className="text-[10px] text-slate-400 uppercase font-semibold px-1">
            Simulate:
          </span>
          <select
            value={simMode}
            onChange={(e) => setSimMode(e.target.value)}
            className="bg-slate-900 text-slate-200 text-xs border border-slate-700 rounded px-2 py-1 outline-none font-mono"
          >
            <option value="cleared">0.00% Safe (Passed)</option>
            <option value="warning">0.024% Warning</option>
            <option value="violation">0.072% Lockout</option>
          </select>
          <button
            onClick={handleSimulateTest}
            className="flex items-center gap-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-3 py-1 rounded text-xs font-semibold transition-colors"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Inject Sample
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-900/60 border border-slate-800 rounded-md p-4 flex flex-col">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
            Screenings Today
          </span>
          <span className="text-2xl font-bold font-mono text-slate-100 mt-1">
            {totalTests}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5">
            Turnstile & helmet checks
          </span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-md p-4 flex flex-col border-l-2 border-l-emerald-500">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
            Zero-Tolerance Pass Rate
          </span>
          <span className="text-2xl font-bold font-mono text-emerald-400 mt-1">
            {passRate}%
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5">
            {cleared} / {totalTests} cleared
          </span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-md p-4 flex flex-col border-l-2 border-l-rose-500">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
            Active Lockout Violations
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-rose-400">
              {violations}
            </span>
            {violations > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            )}
          </div>
          <span className="text-[11px] text-rose-400/80 mt-0.5">
            Equipment interlock engaged
          </span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-md p-4 flex flex-col border-l-2 border-l-amber-500">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
            Elevated Warnings
          </span>
          <span className="text-2xl font-bold font-mono text-amber-300 mt-1">
            {warnings}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5">
            Secondary test pending
          </span>
        </div>
      </div>

      {/* Main Grid or Empty State */}
      {screenings.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-md p-10 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center mb-4">
            <WineOff className="w-8 h-8 text-amber-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-100">
            No Alcohol Screenings Recorded
          </h3>
          <p className="text-xs text-slate-400 max-w-md mt-1.5">
            MQ-3 helmet sniffer sensors and turnstile fuel-cell breathalyzers are online in standby mode. Zero-tolerance policy active (0.00% BAC).
          </p>
          <div className="flex items-center gap-3 mt-6">
            <button
              onClick={handleSimulateTest}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-xs py-2 px-4 rounded-md flex items-center gap-2 shadow transition-colors"
            >
              <Zap className="w-4 h-4" /> Simulate Breath Screening
            </button>
            <button
              onClick={() => setShowCustomModal(true)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs py-2 px-4 rounded-md flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" /> Ingest Custom Test
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Trend & Sensor Telemetry (2 cols) */}
          <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-md p-4 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-semibold tracking-wider text-slate-200 uppercase">
                  Shift Alcohol Vapor PPM & BAC Profile
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                MQ-3 Sensor Baseline: ~15 PPM
              </span>
            </div>

            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={trendData}
                  margin={{ top: 10, right: 20, left: -10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="time"
                    tick={{ fill: "#64748b", fontSize: 10 }}
                    axisLine={{ stroke: "#334155" }}
                  />
                  <YAxis
                    tick={{ fill: "#64748b", fontSize: 10 }}
                    axisLine={{ stroke: "#334155" }}
                    domain={[0, 400]}
                    unit=" ppm"
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#090d16",
                      border: "1px solid #334155",
                      borderRadius: "6px",
                      fontSize: "12px",
                    }}
                    labelStyle={{ color: "#94a3b8" }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                  />
                  <ReferenceLine
                    y={50}
                    label={{
                      value: "Warning Threshold (50 PPM)",
                      fill: "#f59e0b",
                      fontSize: 10,
                      position: "top",
                    }}
                    stroke="#f59e0b"
                    strokeDasharray="4 4"
                  />
                  <Line
                    type="monotone"
                    dataKey="avgPpm"
                    name="Ethanol Vapor (PPM)"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ r: 4, fill: "#f59e0b" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Sensor Diagnostics footer */}
            <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-800 text-xs">
              <div className="bg-slate-950/70 p-2.5 rounded border border-slate-800/80">
                <span className="text-[10px] text-slate-500 uppercase block">Sensor Model</span>
                <span className="font-mono text-slate-200 font-semibold">MQ-3 / Fuel Cell</span>
                <span className="text-[10px] text-emerald-400 block mt-0.5">● Heater 5V Active</span>
              </div>
              <div className="bg-slate-950/70 p-2.5 rounded border border-slate-800/80">
                <span className="text-[10px] text-slate-500 uppercase block">Clean Air R₀</span>
                <span className="font-mono text-slate-200 font-semibold">12.4 kΩ</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Zero drift: +0.02%</span>
              </div>
              <div className="bg-slate-950/70 p-2.5 rounded border border-slate-800/80">
                <span className="text-[10px] text-slate-500 uppercase block">Environmental Comp</span>
                <span className="font-mono text-sky-400 font-semibold">28.5°C / 54% RH</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Correction applied</span>
              </div>
            </div>
          </div>

          {/* Selected Screening Spotlight */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-md p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                <div className="flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-amber-400" />
                  <h3 className="text-xs font-semibold tracking-wider text-slate-200 uppercase">
                    Screening Detail
                  </h3>
                </div>
                <span
                  className={cls(
                    "px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase",
                    selectedScreening?.status === "violation"
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse"
                      : selectedScreening?.status === "warning"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  )}
                >
                  {selectedScreening?.status || "UNKNOWN"}
                </span>
              </div>

              {selectedScreening ? (
                <div className="space-y-3">
                  <div className="bg-slate-950/80 p-3 rounded border border-slate-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-slate-100">
                          {selectedScreening.worker_name}
                        </h4>
                        <span className="text-xs text-slate-400 font-mono">
                          ID: {selectedScreening.worker_id} • Helmet:{" "}
                          {selectedScreening.helmet_id}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          const w = workers.find(
                            (item) =>
                              item.worker_id === selectedScreening.worker_id
                          );
                          if (w && onSelectWorker) onSelectWorker(w);
                        }}
                        className="text-[11px] text-sky-400 hover:text-sky-300 underline"
                      >
                        Profile →
                      </button>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      {selectedScreening.test_type}
                    </div>
                  </div>

                  {/* BAC Meter */}
                  <div className="bg-slate-950/80 p-3 rounded border border-slate-800">
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold">
                        Calculated BAC %
                      </span>
                      <span
                        className={cls(
                          "text-xl font-mono font-bold",
                          selectedScreening.bac_percent >= 0.05
                            ? "text-rose-400"
                            : selectedScreening.bac_percent > 0.0
                            ? "text-amber-400"
                            : "text-emerald-400"
                        )}
                      >
                        {selectedScreening.bac_percent.toFixed(3)}%
                      </span>
                    </div>

                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={cls(
                          "h-full rounded-full transition-all",
                          selectedScreening.bac_percent >= 0.05
                            ? "bg-rose-500"
                            : selectedScreening.bac_percent > 0.0
                            ? "bg-amber-400"
                            : "bg-emerald-400"
                        )}
                        style={{
                          width: `${Math.min(
                            100,
                            (selectedScreening.bac_percent / 0.08) * 100
                          )}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-500 mt-1 font-mono">
                      <span>0.00% (Clean)</span>
                      <span>0.02% (Warning)</span>
                      <span className="text-rose-400">0.05% (Limit)</span>
                    </div>
                  </div>

                  {/* Sensor raw outputs */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-950/60 p-2 rounded border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase block">Raw Ethanol PPM</span>
                      <span className="font-mono font-bold text-amber-400">
                        {selectedScreening.raw_ppm} PPM
                      </span>
                    </div>
                    <div className="bg-slate-950/60 p-2 rounded border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase block">Analog Voltage</span>
                      <span className="font-mono font-bold text-slate-200">
                        {selectedScreening.sensor_voltage_v} V
                      </span>
                    </div>
                    <div className="bg-slate-950/60 p-2 rounded border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase block">BrAC mg/L</span>
                      <span className="font-mono text-slate-200">
                        {selectedScreening.brac_mg_l} mg/L
                      </span>
                    </div>
                    <div className="bg-slate-950/60 p-2 rounded border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase block">Confidence</span>
                      <span className="font-mono text-slate-200">
                        {selectedScreening.confidence_score || 98.5}%
                      </span>
                    </div>
                  </div>

                  {/* Automated action notice */}
                  <div
                    className={cls(
                      "text-xs p-2.5 rounded border",
                      selectedScreening.status === "violation"
                        ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
                        : selectedScreening.status === "warning"
                        ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                        : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    )}
                  >
                    <span className="text-[10px] uppercase font-bold block mb-0.5">
                      Protocol Action:
                    </span>
                    {selectedScreening.action}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-500 py-8 text-center">
                  No screening selected
                </div>
              )}
            </div>

            {/* Action buttons */}
            {selectedScreening && (
              <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col gap-2">
                {selectedScreening.status === "violation" && (
                  <button
                    onClick={() => handleClearLockout(selectedScreening.id)}
                    className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold py-2 px-3 rounded text-xs flex items-center justify-center gap-2 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Re-test & Clear Lockout
                  </button>
                )}
                {selectedScreening.status === "cleared" && (
                  <div className="text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded p-2 text-center">
                    ✓ Worker cleared for hazardous machinery operation.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Screenings Log Table */}
      {screenings.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-md">
          <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-semibold tracking-wider text-slate-200 uppercase">
                Alcohol Screening Log ({filteredScreenings.length})
              </h3>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              {["all", "cleared", "warning", "violation"].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={cls(
                    "px-2.5 py-1 rounded text-[11px] font-medium uppercase transition-colors",
                    filterStatus === st
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      : "text-slate-400 hover:text-slate-200 bg-slate-800/40 border border-transparent"
                  )}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] text-slate-500 uppercase tracking-wider bg-slate-950/60">
                  <th className="px-4 py-3 font-medium">Test ID</th>
                  <th className="px-4 py-3 font-medium">Worker</th>
                  <th className="px-4 py-3 font-medium">Helmet</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">BAC %</th>
                  <th className="px-4 py-3 font-medium">Sensor PPM</th>
                  <th className="px-4 py-3 font-medium">Sensor V</th>
                  <th className="px-4 py-3 font-medium">Time</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {filteredScreenings.map((sc) => {
                  const isSelected = sc.id === selectedScreeningId;
                  return (
                    <tr
                      key={sc.id}
                      onClick={() => setSelectedScreeningId(sc.id)}
                      className={cls(
                        "cursor-pointer transition-colors hover:bg-slate-800/40",
                        isSelected && "bg-amber-500/10 border-l-2 border-l-amber-400",
                        sc.status === "violation" && !isSelected && "bg-rose-500/5"
                      )}
                    >
                      <td className="px-4 py-3 font-mono font-semibold text-amber-400">
                        {sc.id}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-200">
                          {sc.worker_name}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          #{sc.worker_id} • {sc.department}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-400">
                        {sc.helmet_id}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {sc.test_type}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cls(
                            "px-2 py-0.5 rounded font-mono font-bold text-[11px]",
                            sc.bac_percent >= 0.05
                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                              : sc.bac_percent > 0.0
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                              : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                          )}
                        >
                          {sc.bac_percent.toFixed(3)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-300">
                        {sc.raw_ppm} ppm
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-400">
                        {sc.sensor_voltage_v} V
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-400">
                        {sc.timestamp}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cls(
                            "px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase",
                            sc.status === "violation"
                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse"
                              : sc.status === "warning"
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                              : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                          )}
                        >
                          {sc.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedScreeningId(sc.id);
                          }}
                          className="text-[11px] text-amber-400 hover:text-amber-300 px-2 py-1 bg-slate-800/80 hover:bg-slate-800 rounded border border-slate-700 transition-colors inline-flex items-center gap-1"
                        >
                          Sensor Data <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Custom Screening */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-md w-full p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <WineOff className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-slate-100 uppercase">
                  Ingest Alcohol Sensor Screening
                </h3>
              </div>
              <button
                onClick={() => setShowCustomModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCustomSubmit} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Worker Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Liam Smith"
                  value={customWorkerName}
                  onChange={(e) => setCustomWorkerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-100 outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Worker ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. W-202"
                    value={customWorkerId}
                    onChange={(e) => setCustomWorkerId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-100 outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Helmet ID</label>
                  <input
                    type="text"
                    placeholder="e.g. H-44D"
                    value={customHelmetId}
                    onChange={(e) => setCustomHelmetId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-100 outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">BAC % Reading</label>
                <input
                  type="number"
                  step="0.001"
                  min="0.000"
                  max="0.300"
                  value={customBac}
                  onChange={(e) => setCustomBac(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-100 outline-none focus:border-amber-500 font-mono"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Limit: 0.00% clean, &gt;0.01% warning, &ge;0.05% lockout violation.
                </span>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Testing Method</label>
                <select
                  value={customTestType}
                  onChange={(e) => setCustomTestType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-100 outline-none focus:border-amber-500"
                >
                  <option value="Continuous In-Helmet Sniffer">Continuous In-Helmet Sniffer</option>
                  <option value="Pre-Shift Turnstile Dock">Pre-Shift Turnstile Dock</option>
                  <option value="Random Breathalyzer Inspection">Random Breathalyzer Inspection</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-amber-600 text-slate-950 font-semibold hover:bg-amber-500 flex items-center gap-1.5"
                >
                  <WineOff className="w-3.5 h-3.5" />
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
