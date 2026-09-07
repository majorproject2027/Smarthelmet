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
  ShieldAlert,
  AlertTriangle,
  Activity,
  CheckCircle2,
  Clock,
  Radio,
  Siren,
  ChevronRight,
  Zap,
  User,
  Plus,
  X,
  AlertOctagon,
  ShieldCheck,
} from "lucide-react";
import { generateFallWaveform } from "../data/sensorData";

function cls(...args) {
  return args.filter(Boolean).join(" ");
}

export default function FallEventsPage({
  fallEvents = [],
  onUpdateFallEvents,
  onSelectWorker,
  workers = [],
  onAddOrUpdateWorker,
}) {
  const [selectedIncidentId, setSelectedIncidentId] = useState(
    fallEvents[0]?.id || null
  );
  const [filterStatus, setFilterStatus] = useState("all");
  const [showCustomModal, setShowCustomModal] = useState(false);

  // Custom sensor input form state
  const [customWorkerName, setCustomWorkerName] = useState("");
  const [customWorkerId, setCustomWorkerId] = useState("");
  const [customHelmetId, setCustomHelmetId] = useState("");
  const [customZone, setCustomZone] = useState("A");
  const [customDepartment, setCustomDepartment] = useState("Operations");
  const [customImpactG, setCustomImpactG] = useState("4.6");
  const [customDropM, setCustomDropM] = useState("1.8");
  const [customPosture, setCustomPosture] = useState("Prone (Lying Down)");

  const selectedIncident =
    fallEvents.find((e) => e.id === selectedIncidentId) || fallEvents[0] || null;

  const totalFalls = fallEvents.length;
  const criticalFalls = fallEvents.filter((e) => e.status === "critical").length;
  const maxImpact = fallEvents.length > 0 ? Math.max(0, ...fallEvents.map((e) => e.impact_g || 0)) : 0;
  const avgDrop = fallEvents.length > 0
    ? (fallEvents.reduce((acc, e) => acc + (e.estimated_drop_m || 0), 0) / fallEvents.length).toFixed(1)
    : "0.0";

  const filteredEvents = fallEvents.filter((e) => {
    if (filterStatus === "all") return true;
    return e.status === filterStatus;
  });

  // Action handlers
  const handleAcknowledge = (id) => {
    const updated = fallEvents.map((e) =>
      e.id === id ? { ...e, status: "dispatched", emergency_dispatched: true, dispatch_unit: "Rapid Medic Unit 1" } : e
    );
    onUpdateFallEvents(updated);
  };

  const handleResolve = (id) => {
    const updated = fallEvents.map((e) =>
      e.id === id ? { ...e, status: "resolved", immobility_sec: 0, posture: "Attended / Safe" } : e
    );
    onUpdateFallEvents(updated);
  };

  const createFallIncident = (fallData) => {
    const nextList = [fallData, ...fallEvents];
    onUpdateFallEvents(nextList);
    setSelectedIncidentId(fallData.id);

    // Sync with workers list if callback provided
    if (onAddOrUpdateWorker) {
      onAddOrUpdateWorker({
        worker_id: fallData.worker_id,
        worker_name: fallData.worker_name,
        role: fallData.department || "Field Worker",
        helmet_id: fallData.helmet_id,
        department: fallData.department,
        zone: fallData.zone,
        status: "critical",
        lastEvent: `Fall Detected (${fallData.impact_g}G)`,
        hr: fallData.heart_rate_at_fall || 112,
        spo2: 95,
        temp: 28,
        humidity: 58,
        gas: 210,
        co: 4,
        fatigue: "normal",
        ppe: { helmet: true, vest: true, gloves: true, goggles: true, mask: true },
        fall_sensor: {
          status: "critical",
          peak_g: fallData.impact_g,
          drop_m: fallData.estimated_drop_m,
          posture: fallData.posture,
          tilt: fallData.tilt_angle_deg,
          immobility: `${fallData.immobility_sec}s`,
        },
      });
    }
  };

  // Trigger quick sensor simulation
  const handleSimulateSensorFall = () => {
    const defaultWorkers = [
      { name: "John Davis", id: "W-501", helmet: "HLM-101", zone: "A", dept: "Rigging & Staging" },
      { name: "Sarah Connor", id: "W-502", helmet: "HLM-102", zone: "B", dept: "Electrical" },
      { name: "Michael Chang", id: "W-503", helmet: "HLM-103", zone: "C", dept: "Welding" },
      { name: "Emma Watson", id: "W-504", helmet: "HLM-104", zone: "D", dept: "Assembly" },
    ];
    const candidate = workers.length > 0
      ? workers[Math.floor(Math.random() * workers.length)]
      : defaultWorkers[Math.floor(Math.random() * defaultWorkers.length)];

    const impact = parseFloat((3.8 + Math.random() * 2.2).toFixed(1));
    const drop = parseFloat((1.2 + Math.random() * 1.6).toFixed(1));
    const freefall = Math.floor(210 + Math.random() * 140);
    const tilt = Math.floor(75 + Math.random() * 15);

    const newFall = {
      id: `FE-${Math.floor(100 + Math.random() * 900)}`,
      worker_id: candidate.worker_id || candidate.id,
      worker_name: candidate.worker_name || candidate.name,
      helmet_id: candidate.helmet_id || candidate.helmet,
      zone: candidate.zone || "A",
      department: candidate.department || candidate.dept || "Maintenance",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      impact_g: impact,
      freefall_ms: freefall,
      estimated_drop_m: drop,
      posture: "Prone (Lying Down)",
      tilt_angle_deg: tilt,
      immobility_sec: 45,
      status: "critical",
      sensor_model: "MPU-6050 6-Axis IMU",
      axis_data: {
        ax: parseFloat((0.8 + Math.random() * 0.5).toFixed(2)),
        ay: parseFloat((impact * 0.9).toFixed(2)),
        az: parseFloat((impact * 0.3).toFixed(2)),
      },
      gyro_data: {
        gx: Math.floor(110 + Math.random() * 90),
        gy: Math.floor(280 + Math.random() * 120),
        gz: Math.floor(60 + Math.random() * 50),
      },
      heart_rate_at_fall: 116,
      emergency_dispatched: false,
      dispatch_unit: "Pending Dispatch",
      notes: `SENSOR ALERT: Tri-axial acceleration spike exceeded threshold (peak: ${impact}G). Worker motionless for 45s in Zone ${candidate.zone || "A"}.`,
    };

    createFallIncident(newFall);
  };

  // Submit custom sensor input
  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customWorkerName.trim() || !customWorkerId.trim()) return;

    const impact = parseFloat(customImpactG) || 4.5;
    const drop = parseFloat(customDropM) || 1.8;

    const newFall = {
      id: `FE-${Math.floor(100 + Math.random() * 900)}`,
      worker_id: customWorkerId.trim(),
      worker_name: customWorkerName.trim(),
      helmet_id: customHelmetId.trim() || `H-${customWorkerId.trim()}`,
      zone: customZone,
      department: customDepartment,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      impact_g: impact,
      freefall_ms: Math.floor(240),
      estimated_drop_m: drop,
      posture: customPosture,
      tilt_angle_deg: 80,
      immobility_sec: 30,
      status: "critical",
      sensor_model: "MPU-6050 6-Axis IMU",
      axis_data: {
        ax: parseFloat((impact * 0.25).toFixed(2)),
        ay: parseFloat((impact * 0.88).toFixed(2)),
        az: parseFloat((impact * 0.32).toFixed(2)),
      },
      gyro_data: { gx: 120, gy: 320, gz: 75 },
      heart_rate_at_fall: 114,
      emergency_dispatched: false,
      dispatch_unit: "Pending Dispatch",
      notes: `SENSOR INGEST: Custom sensor fall detected. Worker ${customWorkerName} fell in Zone ${customZone} with ${impact}G force.`,
    };

    createFallIncident(newFall);
    setShowCustomModal(false);
    setCustomWorkerName("");
    setCustomWorkerId("");
    setCustomHelmetId("");
  };

  const waveformData = generateFallWaveform(selectedIncident?.impact_g || 4.8);

  // Active Critical Falls for Urgent Alert Banner
  const activeCriticalIncident = fallEvents.find((e) => e.status === "critical");

  return (
    <div className="flex flex-col gap-5">
      {/* Top Banner if someone has fallen */}
      {activeCriticalIncident && (
        <div className="bg-rose-950/40 border-2 border-rose-500/80 rounded-lg p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg shadow-rose-950/50 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-500/30 border border-rose-500/60 rounded-full text-rose-300">
              <Siren className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono bg-rose-500 text-white font-bold px-2 py-0.5 rounded">
                  FALL EMERGENCY DETECTED
                </span>
                <span className="text-xs text-rose-300 font-mono">
                  {activeCriticalIncident.timestamp}
                </span>
              </div>
              <h3 className="text-base font-bold text-white mt-1">
                {activeCriticalIncident.worker_name} (#{activeCriticalIncident.worker_id}) has fallen in Zone {activeCriticalIncident.zone}!
              </h3>
              <p className="text-xs text-rose-200/80 mt-0.5">
                Helmet: <span className="font-mono text-white">{activeCriticalIncident.helmet_id}</span> • Impact Force: <span className="font-mono text-white font-bold">{activeCriticalIncident.impact_g} G</span> • Immobility: <span className="font-mono text-white font-bold">{activeCriticalIncident.immobility_sec}s</span> ({activeCriticalIncident.posture})
              </p>
            </div>
          </div>
          <button
            onClick={() => handleAcknowledge(activeCriticalIncident.id)}
            className="w-full md:w-auto bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold py-2.5 px-4 rounded-md flex items-center justify-center gap-2 shadow-md transition-all shrink-0"
          >
            <Siren className="w-4 h-4" />
            Dispatch Emergency Medic
          </button>
        </div>
      )}

      {/* Header & Sensor Ingest Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-4 rounded-md">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <h2 className="text-lg font-bold text-slate-100 uppercase tracking-wide">
              Fall Detection & IMU Sensor Telemetry
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time fall detection monitoring captures worker identity, 6-axis acceleration (G-Force), drop height, and post-fall immobility.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowCustomModal(true)}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Ingest Sensor Data
          </button>
          <button
            onClick={handleSimulateSensorFall}
            className="flex items-center gap-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors shadow-sm"
          >
            <Zap className="w-3.5 h-3.5 text-rose-400" />
            Simulate Fall Trigger
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-900/60 border border-slate-800 rounded-md p-4 flex flex-col">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
            Total Fall Events
          </span>
          <span className="text-2xl font-bold font-mono text-slate-100 mt-1">
            {totalFalls}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5">Recorded by helmet IMU</span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-md p-4 flex flex-col border-l-2 border-l-rose-500">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
            Active Critical Alarms
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-rose-400">
              {criticalFalls}
            </span>
            {criticalFalls > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            )}
          </div>
          <span className="text-[11px] text-rose-400/80 mt-0.5">
            Require emergency response
          </span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-md p-4 flex flex-col border-l-2 border-l-amber-500">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
            Peak Impact Detected
          </span>
          <span className="text-2xl font-bold font-mono text-amber-300 mt-1">
            {maxImpact} G
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5">Threshold: &gt; 3.0 G</span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-md p-4 flex flex-col border-l-2 border-l-sky-500">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
            Avg Drop Height
          </span>
          <span className="text-2xl font-bold font-mono text-sky-400 mt-1">
            {avgDrop} m
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5">
            Derived from freefall duration
          </span>
        </div>
      </div>

      {/* Main Grid: Waveform Analysis + Spotlight (or Empty State) */}
      {fallEvents.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-md p-10 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mb-4">
            <ShieldCheck className="w-8 h-8 text-emerald-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-100">
            No Fall Events Detected
          </h3>
          <p className="text-xs text-slate-400 max-w-md mt-1.5">
            All smart helmet 6-axis IMU sensors are currently active and streaming normal acceleration readings (&lt;1.5G). No workers are currently fallen or immobile.
          </p>
          <div className="flex items-center gap-3 mt-6">
            <button
              onClick={handleSimulateSensorFall}
              className="bg-rose-500 hover:bg-rose-600 text-white font-semibold text-xs py-2 px-4 rounded-md flex items-center gap-2 shadow transition-colors"
            >
              <Zap className="w-4 h-4" /> Trigger Fall Sensor Simulation
            </button>
            <button
              onClick={() => setShowCustomModal(true)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs py-2 px-4 rounded-md flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" /> Ingest Custom Sensor Packet
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Waveform Chart (2 cols) */}
          <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-md p-4 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-sky-400" />
                <h3 className="text-xs font-semibold tracking-wider text-slate-200 uppercase">
                  Impact Waveform Telemetry (6-Axis IMU)
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                Event #{selectedIncident?.id || "—"} • 100Hz Sampling
              </span>
            </div>

            <p className="text-[11px] text-slate-400 mb-2">
              Resultant G-Force (G = √(ax² + ay² + az²)) showing pre-fall motion, zero-gravity freefall duration, sharp deceleration spike, and post-fall rest.
            </p>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={waveformData}
                  margin={{ top: 10, right: 20, left: -10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="t"
                    tick={{ fill: "#64748b", fontSize: 10 }}
                    axisLine={{ stroke: "#334155" }}
                  />
                  <YAxis
                    tick={{ fill: "#64748b", fontSize: 10 }}
                    axisLine={{ stroke: "#334155" }}
                    unit="G"
                    domain={[0, 6]}
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
                    y={3.0}
                    label={{
                      value: "Fall Threshold (3.0G)",
                      fill: "#f43f5e",
                      fontSize: 10,
                      position: "top",
                    }}
                    stroke="#f43f5e"
                    strokeDasharray="4 4"
                  />
                  <Line
                    type="monotone"
                    dataKey="g"
                    name="Resultant G-Force"
                    stroke="#f43f5e"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "#f43f5e" }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="ay"
                    name="Vertical Impact (Ay)"
                    stroke="#38bdf8"
                    strokeWidth={1.5}
                    strokeDasharray="2 2"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="ax"
                    name="Lateral Accel (Ax)"
                    stroke="#fb923c"
                    strokeWidth={1}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-800 text-xs">
              <div className="bg-slate-950/70 p-2 rounded border border-slate-800/80">
                <span className="text-[10px] text-slate-500 uppercase block">Freefall Window</span>
                <span className="font-mono text-sky-400 font-semibold">{selectedIncident?.freefall_ms || 240} ms</span>
                <span className="text-[10px] text-slate-500 block">Weightlessness duration</span>
              </div>
              <div className="bg-slate-950/70 p-2 rounded border border-slate-800/80">
                <span className="text-[10px] text-slate-500 uppercase block">Drop Altitude</span>
                <span className="font-mono text-amber-300 font-semibold">{selectedIncident?.estimated_drop_m || 1.8} m</span>
                <span className="text-[10px] text-slate-500 block">Kinematic drop calculation</span>
              </div>
              <div className="bg-slate-950/70 p-2 rounded border border-slate-800/80">
                <span className="text-[10px] text-slate-500 uppercase block">Post-Fall Immobility</span>
                <span className={cls("font-mono font-semibold", (selectedIncident?.immobility_sec || 0) > 30 ? "text-rose-400 font-bold" : "text-emerald-400")}>
                  {selectedIncident?.immobility_sec ?? 0} sec
                </span>
                <span className="text-[10px] text-slate-500 block">Motionless sensor timer</span>
              </div>
            </div>
          </div>

          {/* Selected Incident Spotlight: WHO HAS FALLEN */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-md p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                <div className="flex items-center gap-2">
                  <Siren className="w-4 h-4 text-rose-400" />
                  <h3 className="text-xs font-semibold tracking-wider text-slate-200 uppercase">
                    Worker Fall Telemetry
                  </h3>
                </div>
                <span
                  className={cls(
                    "px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase",
                    selectedIncident?.status === "critical"
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse"
                      : selectedIncident?.status === "dispatched"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  )}
                >
                  {selectedIncident?.status || "UNKNOWN"}
                </span>
              </div>

              {selectedIncident ? (
                <div className="space-y-3">
                  {/* Worker Identity Card */}
                  <div className="bg-slate-950/90 p-3.5 rounded border border-rose-500/40 shadow">
                    <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider block mb-1">
                      Personnel Who Fell
                    </span>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-base font-bold text-slate-100">
                          {selectedIncident.worker_name}
                        </h4>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">
                          ID: <span className="text-sky-400 font-semibold">{selectedIncident.worker_id}</span> • Helmet:{" "}
                          <span className="text-slate-200 font-semibold">{selectedIncident.helmet_id}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {selectedIncident.department} • Zone {selectedIncident.zone}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const w = workers.find(
                            (item) => item.worker_id === selectedIncident.worker_id
                          );
                          if (w && onSelectWorker) onSelectWorker(w);
                        }}
                        className="text-xs text-sky-400 hover:text-sky-300 underline font-medium"
                      >
                        Profile →
                      </button>
                    </div>
                  </div>

                  {/* Sensor metrics */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase block font-semibold">Impact G-Force</span>
                      <span className="font-mono text-base font-bold text-rose-400">{selectedIncident.impact_g} G</span>
                      <span className="text-[10px] text-slate-500 block">Peak threshold &gt;3.0G</span>
                    </div>
                    <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase block font-semibold">Estimated Drop</span>
                      <span className="font-mono text-base font-bold text-amber-300">{selectedIncident.estimated_drop_m} m</span>
                      <span className="text-[10px] text-slate-500 block">Height drop estimate</span>
                    </div>
                    <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase block font-semibold">Body Posture</span>
                      <span className="text-amber-300 font-semibold text-xs block truncate">{selectedIncident.posture}</span>
                      <span className="text-[10px] text-slate-500 block">{selectedIncident.tilt_angle_deg}° tilt angle</span>
                    </div>
                    <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase block font-semibold">Immobility Timer</span>
                      <span className={cls("font-mono text-base font-bold block", (selectedIncident.immobility_sec || 0) > 30 ? "text-rose-400" : "text-emerald-400")}>
                        {selectedIncident.immobility_sec}s
                      </span>
                      <span className="text-[10px] text-slate-500 block">Post-fall motionless</span>
                    </div>
                  </div>

                  {/* IMU Axis Telemetry */}
                  <div className="bg-slate-950/80 p-3 rounded border border-slate-800 text-xs">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                      Sensor Peak Acceleration Vectors (MPU-6050)
                    </span>
                    <div className="grid grid-cols-3 gap-1.5 font-mono text-[11px] text-slate-300">
                      <div>Ax: {selectedIncident.axis_data?.ax ?? 0}G</div>
                      <div>Ay: {selectedIncident.axis_data?.ay ?? 0}G</div>
                      <div>Az: {selectedIncident.axis_data?.az ?? 0}G</div>
                      <div>Gx: {selectedIncident.gyro_data?.gx ?? 0}°/s</div>
                      <div>Gy: {selectedIncident.gyro_data?.gy ?? 0}°/s</div>
                      <div>Gz: {selectedIncident.gyro_data?.gz ?? 0}°/s</div>
                    </div>
                  </div>

                  <div className="text-xs text-slate-400 bg-slate-950/50 p-2.5 rounded border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold mb-0.5">Sensor Incident Log</span>
                    {selectedIncident.notes || "Telemetry captured from helmet IMU."}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-500 py-8 text-center">
                  No incident selected
                </div>
              )}
            </div>

            {/* Action buttons */}
            {selectedIncident && (
              <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col gap-2">
                {selectedIncident.status === "critical" && (
                  <button
                    onClick={() => handleAcknowledge(selectedIncident.id)}
                    className="w-full bg-rose-600 hover:bg-rose-500 text-white font-semibold py-2 px-3 rounded text-xs flex items-center justify-center gap-2 shadow transition-colors"
                  >
                    <Siren className="w-3.5 h-3.5" /> Dispatch Emergency Medic
                  </button>
                )}
                {selectedIncident.status === "dispatched" && (
                  <button
                    onClick={() => handleResolve(selectedIncident.id)}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 px-3 rounded text-xs flex items-center justify-center gap-2 shadow transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Mark Attended & Safe
                  </button>
                )}
                {selectedIncident.status === "resolved" && (
                  <div className="text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded p-2 text-center">
                    ✓ Incident resolved. Personnel attended and stabilized.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Incident Log Table */}
      {fallEvents.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-md">
          <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-400" />
              <h3 className="text-xs font-semibold tracking-wider text-slate-200 uppercase">
                Fall Incidents Log ({filteredEvents.length})
              </h3>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              {["all", "critical", "dispatched", "resolved"].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={cls(
                    "px-2.5 py-1 rounded text-[11px] font-medium uppercase transition-colors",
                    filterStatus === st
                      ? "bg-sky-500/20 text-sky-300 border border-sky-500/40"
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
                  <th className="px-4 py-3 font-medium">Incident ID</th>
                  <th className="px-4 py-3 font-medium">Fallen Worker</th>
                  <th className="px-4 py-3 font-medium">Helmet ID</th>
                  <th className="px-4 py-3 font-medium">Impact G</th>
                  <th className="px-4 py-3 font-medium">Drop Height</th>
                  <th className="px-4 py-3 font-medium">Posture / Immobility</th>
                  <th className="px-4 py-3 font-medium">Time</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {filteredEvents.map((evt) => {
                  const isSelected = evt.id === selectedIncidentId;
                  return (
                    <tr
                      key={evt.id}
                      onClick={() => setSelectedIncidentId(evt.id)}
                      className={cls(
                        "cursor-pointer transition-colors hover:bg-slate-800/40",
                        isSelected && "bg-sky-500/10 border-l-2 border-l-sky-400",
                        evt.status === "critical" && !isSelected && "bg-rose-500/5"
                      )}
                    >
                      <td className="px-4 py-3 font-mono font-semibold text-sky-400">
                        {evt.id}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-200">
                          {evt.worker_name}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          #{evt.worker_id} • Zone {evt.zone}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-400">
                        {evt.helmet_id}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cls(
                            "px-2 py-0.5 rounded font-mono font-bold text-[11px]",
                            evt.impact_g >= 4.0
                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                              : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                          )}
                        >
                          {evt.impact_g} G
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-300">
                        {evt.estimated_drop_m} m
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-slate-300">{evt.posture}</div>
                        <div
                          className={cls(
                            "text-[10px] font-mono",
                            evt.immobility_sec > 30 ? "text-rose-400 font-bold" : "text-slate-500"
                          )}
                        >
                          Immobile: {evt.immobility_sec}s
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-400">
                        {evt.timestamp}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cls(
                            "px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase",
                            evt.status === "critical"
                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse"
                              : evt.status === "dispatched"
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                              : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                          )}
                        >
                          {evt.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedIncidentId(evt.id);
                          }}
                          className="text-[11px] text-sky-400 hover:text-sky-300 px-2 py-1 bg-slate-800/80 hover:bg-slate-800 rounded border border-slate-700 transition-colors inline-flex items-center gap-1"
                        >
                          Inspect <ChevronRight className="w-3 h-3" />
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

      {/* Modal: Custom Sensor Ingest */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-md w-full p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
                <h3 className="text-sm font-bold text-slate-100 uppercase">
                  Ingest Fall Sensor Telemetry
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
                <label className="block text-slate-400 mb-1">Fallen Worker Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={customWorkerName}
                  onChange={(e) => setCustomWorkerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-100 outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Worker ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. W-102"
                    value={customWorkerId}
                    onChange={(e) => setCustomWorkerId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-100 outline-none focus:border-sky-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Helmet ID</label>
                  <input
                    type="text"
                    placeholder="e.g. H-88A"
                    value={customHelmetId}
                    onChange={(e) => setCustomHelmetId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-100 outline-none focus:border-sky-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Zone Location</label>
                  <select
                    value={customZone}
                    onChange={(e) => setCustomZone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-100 outline-none focus:border-sky-500"
                  >
                    <option value="A">Zone A</option>
                    <option value="B">Zone B</option>
                    <option value="C">Zone C</option>
                    <option value="D">Zone D</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Department</label>
                  <input
                    type="text"
                    placeholder="e.g. Welding"
                    value={customDepartment}
                    onChange={(e) => setCustomDepartment(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-100 outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Impact G-Force (G)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1.0"
                    max="16.0"
                    value={customImpactG}
                    onChange={(e) => setCustomImpactG(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-100 outline-none focus:border-sky-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Drop Height (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="20.0"
                    value={customDropM}
                    onChange={(e) => setCustomDropM(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-100 outline-none focus:border-sky-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Post-Fall Posture</label>
                <select
                  value={customPosture}
                  onChange={(e) => setCustomPosture(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-100 outline-none focus:border-sky-500"
                >
                  <option value="Prone (Lying Down)">Prone (Lying Down)</option>
                  <option value="Supine (On Back)">Supine (On Back)</option>
                  <option value="Sitting / Slumped">Sitting / Slumped</option>
                  <option value="Upright (Recovered)">Upright (Recovered)</option>
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
                  className="px-4 py-1.5 rounded bg-rose-600 text-white font-semibold hover:bg-rose-500 flex items-center gap-1.5"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Record Fall Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
