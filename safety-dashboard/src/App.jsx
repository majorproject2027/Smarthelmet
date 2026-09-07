import React, { useState } from "react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import {
  LayoutGrid, AlertTriangle, Users, ShieldCheck, Thermometer, Heart, Moon,
  MapPin, Network, BarChart3, History as HistoryIcon, Settings, Wifi,
  RefreshCw, Cloud, CheckCircle2, XCircle, Search, ChevronDown, ArrowLeft,
  Radio, X, PlugZap, Plug, Database, Activity, Wind, AlertCircle, FileText,
  ShieldAlert, WineOff, Gauge, FlaskConical, Plus, Trash2,
} from "lucide-react";
import FallEventsPage from "./pages/FallEventsPage";
import AlcoholDetectionPage from "./pages/AlcoholDetectionPage";
import {
  INITIAL_FALL_EVENTS,
  INITIAL_ALCOHOL_SCREENINGS,
} from "./data/sensorData";

/* ============================== system data (empty initial state) ============================== */

const DEMO_WORKERS = [];
const DEMO_ALERTS = [];
const DEMO_PPE_COMPLIANCE = [];
const DEMO_TREND = [];

function zonePosition(zone, seedKey) {
  const base = { A: [12, 15], B: [58, 15], C: [12, 58], D: [58, 58] }[zone] || [30, 40];
  let h = 0;
  for (const c of String(seedKey)) h = (h * 31 + c.charCodeAt(0)) % 97;
  return { x: base[0] + 8 + (h % 24), y: base[1] + 6 + ((h * 7) % 20) };
}

/* ============================== helpers ================================ */

const SEV = {
  critical: { text: "text-rose-400", dot: "bg-rose-500", border: "border-rose-500/40", bg: "bg-rose-500/10", label: "CRITICAL" },
  high:     { text: "text-orange-400", dot: "bg-orange-500", border: "border-orange-500/40", bg: "bg-orange-500/10", label: "HIGH" },
  medium:   { text: "text-amber-400", dot: "bg-amber-400", border: "border-amber-500/40", bg: "bg-amber-500/10", label: "MEDIUM" },
  normal:   { text: "text-sky-400", dot: "bg-sky-400", border: "border-sky-500/40", bg: "bg-sky-500/10", label: "NORMAL" },
};

const STATUS = {
  safe:     { text: "text-sky-400", dot: "bg-sky-400", pillBg: "bg-sky-500/15", pillText: "text-sky-300", label: "ACTIVE" },
  warning:  { text: "text-orange-400", dot: "bg-orange-400", pillBg: "bg-orange-500/15", pillText: "text-orange-300", label: "WARNING" },
  critical: { text: "text-rose-400", dot: "bg-rose-500", pillBg: "bg-rose-500/20", pillText: "text-rose-300", label: "CRITICAL" },
  offline:  { text: "text-slate-500", dot: "bg-slate-600", pillBg: "bg-slate-700/40", pillText: "text-slate-400", label: "OFFLINE" },
};

function cls(...a) { return a.filter(Boolean).join(" "); }
function initials(name) {
  return String(name || "?").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

/* ================================ atoms ================================= */

function Panel({ title, icon: Icon, right, children, className, plain }) {
  return (
    <div className={cls(!plain && "bg-slate-900/60 border border-slate-800 rounded-md", "flex flex-col", className)}>
      {title && (
        <div className={cls("flex items-center justify-between px-4 py-3", !plain && "border-b border-slate-800", plain && "bg-slate-900/80 border border-slate-800 rounded-t-md")}>
          <div className="flex items-center gap-2">
            {Icon && <Icon className="w-4 h-4 text-sky-400" />}
            <h3 className="text-xs font-semibold tracking-widest text-slate-300 uppercase" style={{ letterSpacing: "0.08em" }}>{title}</h3>
          </div>
          {right}
        </div>
      )}
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
}

function SevText({ sev }) {
  const s = SEV[sev] || SEV.normal;
  return <span className={cls("font-semibold tracking-wide text-xs", s.text)} style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{s.label}</span>;
}

function StatusPill({ status }) {
  const s = STATUS[status] || STATUS.safe;
  return (
    <span className={cls("inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-semibold tracking-wide", s.pillBg, s.pillText)}>
      <span className={cls("w-1.5 h-1.5 rounded-full", s.dot)} />{s.label}
    </span>
  );
}

function Avatar({ name, size = "w-9 h-9", tone = "border-slate-700 text-slate-300" }) {
  return (
    <div className={cls(size, "rounded-md border flex items-center justify-center text-xs font-semibold shrink-0 bg-slate-800/60", tone)} style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
      {initials(name)}
    </div>
  );
}

function ZoneSchematic({ workers, onSelect }) {
  return (
    <div className="grid grid-cols-2 grid-rows-2 gap-2 aspect-[4/3]">
      {["A", "B", "C", "D"].map((z) => (
        <div key={z} className="relative bg-slate-950/80 border border-slate-800 rounded-sm p-2">
          <span className="text-[10px] text-slate-600 tracking-widest uppercase">Z-{z}</span>
          {workers.filter((w) => w.zone === z).map((w) => {
            const s = STATUS[w.status] || STATUS.safe;
            const pos = w._pos || zonePosition(z, w.worker_id);
            const relX = ((pos.x % 40) / 40) * 80 + 10;
            const relY = ((pos.y % 40) / 40) * 70 + 15;
            return (
              <button key={w.worker_id} onClick={() => onSelect && onSelect(w)} style={{ left: `${relX}%`, top: `${relY}%` }} className="absolute -translate-x-1/2 -translate-y-1/2" title={w.worker_id}>
                <span className={cls("block w-2.5 h-2.5 rounded-sm", s.dot, w.status === "critical" && "animate-pulse")} />
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/* ============================ WORKER PROFILE PAGE ============================ */

function WorkerProfilePage({ worker, onBack }) {
  if (!worker) return null;
  const isCritical = worker.status === "critical";

  return (
    <div className="flex flex-col gap-4">
      {/* Top back button */}
      <button onClick={onBack} className="self-start flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-slate-100 bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-md transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to List
      </button>

      {/* Header Banner */}
      <section className={cls(
        "relative overflow-hidden rounded-lg border p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4",
        isCritical ? "bg-rose-950/30 border-rose-500/50" : "bg-slate-900/80 border-slate-800"
      )}>
        {isCritical && <div className="absolute inset-0 bg-rose-500/10 animate-pulse pointer-events-none" />}
        <div className="relative z-10 flex items-center gap-5">
          <Avatar name={worker.worker_name} size="w-16 h-16 text-lg" tone={isCritical ? "border-rose-500/50 text-rose-300" : "border-slate-700 text-sky-400"} />
          <div>
            <h2 className="text-2xl font-bold text-slate-100">{worker.worker_name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs bg-slate-950 border border-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">ID: {worker.worker_id}</span>
              <span className="text-xs bg-slate-950 border border-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">HELMET: {worker.helmet_id}</span>
              <span className="text-xs bg-slate-950 border border-slate-800 text-slate-400 px-2 py-0.5 rounded">{worker.role || worker.department}</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <StatusPill status={worker.status} />
          {isCritical && (
            <div className="bg-rose-500/20 text-rose-300 border border-rose-500/50 px-3 py-2 rounded flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <div>
                <div className="text-[10px] uppercase font-bold text-rose-400 tracking-wider">Alert Event</div>
                <div className="text-xs font-semibold">{worker.lastEvent}</div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Vitals Card */}
        <div className="col-span-1 md:col-span-4 bg-slate-900/60 border border-slate-800 rounded-lg p-4 flex flex-col">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2 mb-3">
            <Heart className="w-4 h-4 text-sky-400" />
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-widest">Vitals</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 flex-1 items-center">
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Heart Rate</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className={cls("text-2xl font-bold font-mono", (worker.hr || 0) > 100 ? "text-rose-400" : "text-sky-400")}>{worker.hr ?? "—"}</span>
                <span className="text-xs text-slate-500">bpm</span>
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">SpO2</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-bold font-mono text-sky-400">{worker.spo2 ?? "—"}</span>
                <span className="text-xs text-slate-500">%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Environment Card */}
        <div className="col-span-1 md:col-span-4 bg-slate-900/60 border border-slate-800 rounded-lg p-4 flex flex-col">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2 mb-3">
            <Wind className="w-4 h-4 text-sky-400" />
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-widest">Environment</h3>
          </div>
          <div className="space-y-2 text-xs flex-1 justify-center flex flex-col">
            <div className="flex justify-between border-b border-slate-800/60 pb-1">
              <span className="text-slate-500">Temp</span>
              <span className="text-slate-200 font-mono">{worker.temp != null ? `${worker.temp}°C` : "—"}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800/60 pb-1">
              <span className="text-slate-500">Humidity</span>
              <span className="text-slate-200 font-mono">{worker.humidity != null ? `${worker.humidity}%` : "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">CO Level</span>
              <span className={cls("font-mono", (worker.co || 0) > 10 ? "text-rose-400 font-bold" : "text-slate-200")}>{worker.co != null ? `${worker.co} ppm` : "—"}</span>
            </div>
          </div>
        </div>

        {/* PPE Checklist */}
        <div className="col-span-1 md:col-span-4 bg-slate-900/60 border border-slate-800 rounded-lg p-4 flex flex-col">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2 mb-3">
            <ShieldCheck className="w-4 h-4 text-sky-400" />
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-widest">PPE Status</h3>
          </div>
          <div className="space-y-2 text-xs flex-1 justify-center flex flex-col">
            {Object.entries(worker.ppe || {}).map(([item, ok]) => (
              <div key={item} className={cls("flex justify-between items-center px-2 py-1 rounded", !ok && "bg-rose-500/10 border border-rose-500/20")}>
                <span className={cls("capitalize", ok ? "text-slate-300" : "text-rose-400 font-semibold")}>{item}</span>
                {ok ? <CheckCircle2 className="w-4 h-4 text-sky-400" /> : <XCircle className="w-4 h-4 text-rose-500" />}
              </div>
            ))}
          </div>
        </div>

        {/* Fall Detection Sensor Telemetry */}
        <div className="col-span-1 md:col-span-6 bg-slate-900/60 border border-slate-800 rounded-lg p-4 flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-widest">Fall Detection Sensor (6-Axis IMU)</h3>
            </div>
            <span className={cls(
              "text-[10px] font-mono px-2 py-0.5 rounded font-semibold uppercase",
              worker.fall_sensor?.status === "critical"
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse"
                : worker.fall_sensor?.status === "resolved"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                : "bg-sky-500/20 text-sky-300 border border-sky-500/40"
            )}>
              {worker.fall_sensor?.status || "STANDBY"}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800/80">
              <span className="text-[10px] text-slate-500 uppercase block">Impact Peak</span>
              <span className="font-mono text-sm font-bold text-slate-200">
                {worker.fall_sensor ? `${worker.fall_sensor.peak_g} G` : "1.0 G"}
              </span>
            </div>
            <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800/80">
              <span className="text-[10px] text-slate-500 uppercase block">Body Tilt</span>
              <span className="font-mono text-sm font-semibold text-slate-200">
                {worker.fall_sensor ? `${worker.fall_sensor.tilt}°` : "5°"}
              </span>
            </div>
            <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800/80">
              <span className="text-[10px] text-slate-500 uppercase block">Posture</span>
              <span className="text-xs font-medium text-amber-300 truncate block">
                {worker.fall_sensor?.posture || "Upright"}
              </span>
            </div>
            <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800/80">
              <span className="text-[10px] text-slate-500 uppercase block">Immobility</span>
              <span className={cls("font-mono text-xs font-bold", worker.fall_sensor?.immobility ? "text-rose-400" : "text-emerald-400")}>
                {worker.fall_sensor?.immobility || "0s (Active)"}
              </span>
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-800/60 text-[11px] text-slate-400 flex justify-between">
            <span>Sensor: MPU-6050 Accelerometer / Gyro</span>
            <span>Threshold: &gt; 3.0 G</span>
          </div>
        </div>

        {/* Alcohol Detection Sensor Telemetry */}
        <div className="col-span-1 md:col-span-6 bg-slate-900/60 border border-slate-800 rounded-lg p-4 flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
            <div className="flex items-center gap-2">
              <WineOff className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-widest">Alcohol Detection (MQ-3 Sniffer)</h3>
            </div>
            <span className={cls(
              "text-[10px] font-mono px-2 py-0.5 rounded font-semibold uppercase",
              worker.alcohol_sensor?.status === "violation"
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse"
                : worker.alcohol_sensor?.status === "warning"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
            )}>
              {worker.alcohol_sensor?.status || "PASS"}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800/80">
              <span className="text-[10px] text-slate-500 uppercase block">Calculated BAC</span>
              <span className={cls(
                "font-mono text-sm font-bold",
                (worker.alcohol_sensor?.bac || 0) >= 0.05 ? "text-rose-400" : (worker.alcohol_sensor?.bac || 0) > 0 ? "text-amber-400" : "text-emerald-400"
              )}>
                {worker.alcohol_sensor?.bac != null ? `${worker.alcohol_sensor.bac.toFixed(3)}%` : "0.000%"}
              </span>
            </div>
            <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800/80">
              <span className="text-[10px] text-slate-500 uppercase block">Sensor Vapor</span>
              <span className="font-mono text-sm font-semibold text-amber-400">
                {worker.alcohol_sensor?.raw_ppm != null ? `${worker.alcohol_sensor.raw_ppm} ppm` : "12 ppm"}
              </span>
            </div>
            <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800/80">
              <span className="text-[10px] text-slate-500 uppercase block">Sensor Voltage</span>
              <span className="font-mono text-sm text-slate-200">
                {worker.alcohol_sensor?.voltage != null ? `${worker.alcohol_sensor.voltage} V` : "0.30 V"}
              </span>
            </div>
            <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800/80">
              <span className="text-[10px] text-slate-500 uppercase block">Machinery Lock</span>
              <span className={cls("text-xs font-semibold", worker.alcohol_sensor?.lockout ? "text-rose-400" : "text-emerald-400")}>
                {worker.alcohol_sensor?.lockout ? "LOCKED OUT" : "PERMITTED"}
              </span>
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-800/60 text-[11px] text-slate-400 flex justify-between">
            <span>Detection: Turnstile Dock & Sniffer</span>
            <span>Zero Tolerance: 0.00%</span>
          </div>
        </div>

        {/* Trends & Activity */}
        <div className="col-span-1 md:col-span-6 flex flex-col gap-4">
          <Panel title="Latest Activity Log" icon={FileText}>
            <div className="p-3 space-y-2 text-xs">
              <div className="p-2.5 bg-slate-950 border-l-2 border-rose-500 rounded-r text-slate-300 flex items-start justify-between">
                <div>
                  <div className="font-semibold text-rose-400">{worker.lastEvent}</div>
                  <div className="text-[11px] text-slate-500">Automated telemetry trigger recorded in Zone {worker.zone}.</div>
                </div>
                <span className="font-mono text-[10px] text-slate-500">14:31:12</span>
              </div>
              <div className="p-2.5 bg-slate-950 border-l-2 border-slate-700 rounded-r text-slate-300 flex items-start justify-between">
                <div>
                  <div>Zone Transition: Sector Entry</div>
                  <div className="text-[11px] text-slate-500">Beacon synced to Helmet #{worker.helmet_id}</div>
                </div>
                <span className="font-mono text-[10px] text-slate-500">13:50:00</span>
              </div>
            </div>
          </Panel>

          <Panel title="24H Telemetry Trends" icon={BarChart3}>
            <div className="p-3 h-36">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={DEMO_TREND} margin={{ top: 6, right: 12, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="t" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={{ stroke: "#334155" }} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} />
                  <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 6, fontSize: 11 }} />
                  <Line type="monotone" dataKey="hr" stroke="#38bdf8" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        {/* Map Location */}
        <div className="col-span-1 md:col-span-6 bg-slate-900/60 border border-slate-800 rounded-lg p-4 flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-sky-400" />
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-widest">Live Sector Location</h3>
            </div>
            <span className="text-xs bg-slate-950 border border-slate-800 text-sky-400 px-2 py-0.5 rounded font-mono">Zone {worker.zone}</span>
          </div>
          <div className="flex-1 min-h-[200px] relative border border-slate-800 rounded overflow-hidden bg-slate-950 flex items-center justify-center">
            {/* Grid graphic overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />
            <div className="relative flex flex-col items-center">
              <div className={cls("w-4 h-4 rounded-full animate-ping absolute", isCritical ? "bg-rose-500" : "bg-sky-400")} />
              <div className={cls("w-4 h-4 rounded-full border-2 border-slate-950 relative z-10", isCritical ? "bg-rose-500" : "bg-sky-400")} />
              <span className="mt-2 text-[10px] bg-slate-900/90 border border-slate-700 text-slate-200 px-2 py-0.5 rounded font-mono shadow">
                {worker.worker_name} ({worker.worker_id})
              </span>
            </div>
            <div className="absolute bottom-2 left-2 flex flex-col gap-1 font-mono text-[10px] text-slate-500">
              <div>LAT: {worker.lat || "52.5200"}° N</div>
              <div>LNG: {worker.lng || "13.4050"}° E</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================ PAGES ================================= */

function OverviewPage({
  workers,
  alerts,
  ppeCompliance,
  onSelectWorker,
  onNavigateTab,
  fallEvents = [],
  alcoholScreenings = [],
}) {
  const safe = workers.filter((w) => w.status === "safe").length;
  const ppeIssues = workers.filter((w) => Object.values(w.ppe).some((v) => !v)).length;
  const activeAlerts = alerts.filter((a) => a.status === "active");
  const fallCount = fallEvents.filter((e) => e.status === "critical").length || activeAlerts.filter((a) => String(a.type).toLowerCase().includes("fall")).length;
  const alcoholLockoutCount = alcoholScreenings.filter((s) => s.status === "violation").length;
  const gasCount = activeAlerts.filter((a) => String(a.type).toLowerCase().includes("gas")).length;
  const telemetryWorker = activeAlerts[0]?.worker || workers[0]?.worker_id;
  const [trendMode, setTrendMode] = useState("hr");

  return (
    <div className="flex flex-col gap-4">
      {/* KPI strip */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-md flex flex-wrap divide-x divide-slate-800">
        <div className="px-5 py-3 flex-1 min-w-[130px]">
          <div className="text-[10px] text-slate-500 uppercase tracking-widest">Total Workers</div>
          <div className="text-2xl font-semibold text-slate-100 tabular-nums font-mono">{workers.length}</div>
        </div>
        <div className="px-5 py-3 flex-1 min-w-[130px]">
          <div className="text-[10px] text-slate-500 uppercase tracking-widest">Safe Workers</div>
          <div className="text-2xl font-semibold text-sky-300 tabular-nums font-mono">{safe}</div>
        </div>
        <div className="px-5 py-3 flex-1 min-w-[130px]">
          <div className="text-[10px] text-slate-500 uppercase tracking-widest">Active Alerts</div>
          <div className="text-2xl font-semibold text-slate-100 tabular-nums flex items-center gap-2 font-mono">
            {activeAlerts.length}{activeAlerts.length > 0 && <AlertTriangle className="w-4 h-4 text-amber-400" />}
          </div>
        </div>
        <div
          onClick={() => onNavigateTab && onNavigateTab("fall-events")}
          className="px-5 py-3 flex-1 min-w-[130px] border-l-2 border-l-rose-500 cursor-pointer hover:bg-rose-500/5 transition-colors group"
          title="Click to view Fall Events"
        >
          <div className="text-[10px] text-slate-500 uppercase tracking-widest flex items-center justify-between">
            <span>Fall Events</span>
            <span className="text-[9px] text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity">View →</span>
          </div>
          <div className="text-2xl font-semibold text-rose-400 tabular-nums font-mono flex items-center gap-2">
            {fallCount}
            {fallCount > 0 && <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />}
          </div>
        </div>
        <div
          onClick={() => onNavigateTab && onNavigateTab("alcohol-detection")}
          className="px-5 py-3 flex-1 min-w-[130px] border-l-2 border-l-amber-500 cursor-pointer hover:bg-amber-500/5 transition-colors group"
          title="Click to view Alcohol Detection"
        >
          <div className="text-[10px] text-slate-500 uppercase tracking-widest flex items-center justify-between">
            <span>Alcohol Lockouts</span>
            <span className="text-[9px] text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity">View →</span>
          </div>
          <div className="text-2xl font-semibold text-amber-400 tabular-nums font-mono flex items-center gap-2">
            {alcoholLockoutCount}
            {alcoholLockoutCount > 0 && <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />}
          </div>
        </div>
        <div className="px-5 py-3 flex-1 min-w-[130px] border-l-2 border-l-orange-500">
          <div className="text-[10px] text-slate-500 uppercase tracking-widest">PPE Violations</div>
          <div className="text-2xl font-semibold text-orange-400 tabular-nums font-mono">{ppeIssues}</div>
        </div>
        <div className="px-5 py-3 flex-1 min-w-[130px]">
          <div className="text-[10px] text-slate-500 uppercase tracking-widest">Gas Events</div>
          <div className="text-2xl font-semibold text-slate-100 tabular-nums font-mono">{gasCount}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
        <div className="flex flex-col gap-4">
          <Panel title="Live Safety Alerts" icon={AlertTriangle}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] text-slate-500 uppercase tracking-wider border-b border-slate-800">
                    <th className="px-4 py-2 font-medium">WID</th>
                    <th className="px-4 py-2 font-medium">Name</th>
                    <th className="px-4 py-2 font-medium">Helmet ID</th>
                    <th className="px-4 py-2 font-medium">Event</th>
                    <th className="px-4 py-2 font-medium">Sev</th>
                    <th className="px-4 py-2 font-medium">Zone</th>
                    <th className="px-4 py-2 font-medium">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {activeAlerts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-xs text-slate-500">
                        <CheckCircle2 className="w-6 h-6 text-slate-700 mx-auto mb-1.5" />
                        No active safety alerts recorded. All sectors normal.
                      </td>
                    </tr>
                  ) : (
                    activeAlerts.map((a) => (
                      <tr key={a.id} onClick={() => { const w = workers.find((x) => x.worker_id === a.worker); w && onSelectWorker(w); }} className="cursor-pointer hover:bg-slate-800/40">
                        <td className="px-4 py-2.5 text-sky-400 font-mono">#{a.worker}</td>
                        <td className="px-4 py-2.5 text-slate-300 font-medium">{a.name}</td>
                        <td className="px-4 py-2.5 text-slate-500 font-mono">{workers.find((w) => w.worker_id === a.worker)?.helmet_id || "—"}</td>
                        <td className="px-4 py-2.5 text-slate-300">{a.type}</td>
                        <td className="px-4 py-2.5"><SevText sev={a.sev} /></td>
                        <td className="px-4 py-2.5 text-slate-400">Z-{a.zone}</td>
                        <td className="px-4 py-2.5 text-slate-500 font-mono">{a.time}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel title={`Telemetry: #${telemetryWorker || "Standby"}`} icon={BarChart3} right={
            <div className="flex gap-1">
              <button onClick={() => setTrendMode("hr")} className={cls("text-[10px] px-2 py-1 rounded border", trendMode === "hr" ? "border-sky-500/40 text-sky-300 bg-sky-500/10" : "border-slate-700 text-slate-500")}>HR</button>
              <button onClick={() => setTrendMode("gas")} className={cls("text-[10px] px-2 py-1 rounded border", trendMode === "gas" ? "border-sky-500/40 text-sky-300 bg-sky-500/10" : "border-slate-700 text-slate-500")}>GAS</button>
            </div>
          }>
            <div className="p-3 h-52 flex flex-col justify-center">
              {telemetryWorker && DEMO_TREND.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={DEMO_TREND} margin={{ top: 6, right: 12, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="t" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={{ stroke: "#334155" }} tickLine={false} />
                    <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 6, fontSize: 12 }} />
                    <Line type="monotone" dataKey={trendMode} stroke={trendMode === "hr" ? "#38bdf8" : "#fb923c"} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-xs text-slate-500 py-12">
                  Awaiting worker connection / telemetry streaming...
                </div>
              )}
            </div>
          </Panel>
        </div>

        <div className="flex flex-col gap-4">
          <Panel title="Sector Schematic" icon={MapPin}>
            <div className="p-3"><ZoneSchematic workers={workers} onSelect={onSelectWorker} /></div>
          </Panel>
          <Panel title="PPE Compliance" icon={ShieldCheck}>
            <div className="p-4 space-y-3">
              {ppeCompliance.length === 0 ? (
                <div className="text-center text-xs text-slate-500 py-6">
                  No PPE compliance data recorded yet.
                </div>
              ) : (
                ppeCompliance.map((p) => (
                  <div key={p.item} className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-500 uppercase tracking-wider w-16 shrink-0">{p.item}</span>
                    <div className="h-1.5 flex-1 bg-slate-800 rounded-full overflow-hidden">
                      <div className={cls("h-full rounded-full", p.pct >= 90 ? "bg-sky-400" : "bg-orange-400")} style={{ width: `${p.pct}%` }} />
                    </div>
                    <span className="text-xs text-slate-300 tabular-nums w-9 text-right font-mono">{p.pct}%</span>
                  </div>
                ))
              )}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function WorkersPage({ workers = [], onSelectWorker, onAddWorker }) {
  const [q, setQ] = useState("");
  const [zone, setZone] = useState("all");
  const [dept, setDept] = useState("all");
  const [statusF, setStatusF] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);

  const [newName, setNewName] = useState("");
  const [newId, setNewId] = useState("");
  const [newHelmet, setNewHelmet] = useState("");
  const [newDept, setNewDept] = useState("Maintenance");
  const [newZone, setNewZone] = useState("A");

  const zones = Array.from(new Set(workers.map((w) => w.zone)));
  const depts = Array.from(new Set(workers.map((w) => w.department)));

  const filtered = workers.filter((w) =>
    (w.worker_name + w.worker_id).toLowerCase().includes(q.toLowerCase()) &&
    (zone === "all" || w.zone === zone) &&
    (dept === "all" || w.department === dept) &&
    (statusF === "all" || w.status === statusF)
  );

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newName.trim() || !newId.trim()) return;
    if (onAddWorker) {
      onAddWorker({
        worker_id: newId.trim(),
        worker_name: newName.trim(),
        role: newDept,
        helmet_id: newHelmet.trim() || `H-${newId.trim()}`,
        department: newDept,
        zone: newZone,
        status: "safe",
        lastEvent: "Turnstile Shift Entry",
        hr: 78,
        spo2: 99,
        temp: 26,
        humidity: 50,
        gas: 180,
        co: 1,
        fatigue: "normal",
        ppe: { helmet: true, vest: true, gloves: true, goggles: true, mask: true },
        fall_sensor: { status: "normal", peak_g: 1.01, drop_m: 0, posture: "Upright", tilt: 5 },
        alcohol_sensor: { status: "cleared", bac: 0.000, raw_ppm: 12, voltage: 0.30, lockout: false },
      });
    }
    setShowAddModal(false);
    setNewName("");
    setNewId("");
    setNewHelmet("");
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Workers Directory</h2>
          <p className="text-xs text-slate-500">Personnel currently registered and monitored across sectors.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="self-start sm:self-auto bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs py-2 px-3.5 rounded flex items-center gap-1.5 shadow transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Register Worker
        </button>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-md p-3 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[220px]">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Search Name/ID</div>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-600 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. Worker Name or ID" className="w-full bg-slate-950 border border-slate-800 rounded pl-8 pr-3 py-1.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-sky-600" />
          </div>
        </div>
        <div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Zone</div>
          <select value={zone} onChange={(e) => setZone(e.target.value)} className="bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-sky-600">
            <option value="all">All Zones</option>
            {zones.map((z) => <option key={z} value={z}>Zone {z}</option>)}
          </select>
        </div>
        <div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Department</div>
          <select value={dept} onChange={(e) => setDept(e.target.value)} className="bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-sky-600">
            <option value="all">All Depts</option>
            {depts.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Status</div>
          <select value={statusF} onChange={(e) => setStatusF(e.target.value)} className="bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-sky-600">
            <option value="all">All Status</option>
            <option value="safe">Active</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
            <option value="offline">Offline</option>
          </select>
        </div>
      </div>

      {workers.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-md p-10 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mb-3">
            <Users className="w-6 h-6 text-slate-500" />
          </div>
          <h3 className="text-base font-bold text-slate-100">No Workers in Directory</h3>
          <p className="text-xs text-slate-400 max-w-sm mt-1">
            System is initialized clean and empty. Register a worker or trigger sensor fall / alcohol events to track personnel.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-4 bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs py-2 px-4 rounded-md flex items-center gap-1.5 shadow"
          >
            <Plus className="w-3.5 h-3.5" /> Register Worker
          </button>
        </div>
      ) : (
        <Panel plain>
          <div className="overflow-x-auto bg-slate-900/60 border border-slate-800 border-t-0 rounded-b-md">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] text-slate-500 uppercase tracking-wider border-b border-slate-800 bg-slate-900/80">
                  <th className="px-4 py-2.5 font-medium">Worker</th>
                  <th className="px-4 py-2.5 font-medium">Helmet ID</th>
                  <th className="px-4 py-2.5 font-medium">Department</th>
                  <th className="px-4 py-2.5 font-medium">Zone</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Last Event</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {filtered.map((w) => (
                  <tr key={w.worker_id} onClick={() => onSelectWorker(w)} className={cls("cursor-pointer hover:bg-slate-800/40 transition-colors", w.status === "critical" && "bg-rose-500/5")}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={w.worker_name} tone={w.status === "critical" ? "border-rose-500/50 text-rose-300" : "border-slate-700 text-slate-300"} />
                        <div>
                          <div className="text-slate-200 font-medium hover:text-sky-400">{w.worker_name}</div>
                          <div className="text-[11px] text-slate-500">{w.role || w.department}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sky-400 font-mono">{w.helmet_id}</td>
                    <td className="px-4 py-3 text-slate-400">{w.department}</td>
                    <td className="px-4 py-3 text-slate-400">{typeof w.zone === "string" && w.zone.length === 1 ? `Zone ${w.zone}` : w.zone}</td>
                    <td className="px-4 py-3"><StatusPill status={w.status} /></td>
                    <td className="px-4 py-3">
                      <div className="text-slate-300 text-xs">{w.lastEvent}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {/* Add Worker Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-md w-full p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-sky-400" />
                <h3 className="text-sm font-bold text-slate-100 uppercase">
                  Register New Worker
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Robert Smith"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-100 outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Worker ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. W-101"
                    value={newId}
                    onChange={(e) => setNewId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-100 outline-none focus:border-sky-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Helmet ID</label>
                  <input
                    type="text"
                    placeholder="e.g. H-101"
                    value={newHelmet}
                    onChange={(e) => setNewHelmet(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-100 outline-none focus:border-sky-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Department</label>
                  <select
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-100 outline-none focus:border-sky-500"
                  >
                    <option value="Maintenance">Maintenance</option>
                    <option value="Welding">Welding</option>
                    <option value="Assembly">Assembly</option>
                    <option value="Operations">Operations</option>
                    <option value="Packaging">Packaging</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Assigned Zone</label>
                  <select
                    value={newZone}
                    onChange={(e) => setNewZone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-100 outline-none focus:border-sky-500"
                  >
                    <option value="A">Zone A</option>
                    <option value="B">Zone B</option>
                    <option value="C">Zone C</option>
                    <option value="D">Zone D</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-sky-600 text-white font-semibold hover:bg-sky-500 flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Save Worker
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function PPEEnvironmentPage({ workers = [], ppeCompliance = [] }) {
  const violations = workers.flatMap((w) => Object.entries(w.ppe || {}).filter(([, v]) => !v).map(([item]) => ({ worker: w.worker_id, item, zone: w.zone })));
  const avg = (key) => { const vals = workers.map((w) => w[key]).filter((v) => v != null); return vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : "—"; };
  const maxGas = workers.length ? Math.max(0, ...workers.map((w) => w.gas || 0)) : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Panel title="PPE Compliance" icon={ShieldCheck}>
        <div className="p-4 space-y-3">
          {ppeCompliance.length === 0 ? (
            <div className="text-center text-xs text-slate-500 py-6">
              No PPE compliance records. Monitoring standby.
            </div>
          ) : (
            ppeCompliance.map((p) => (
              <div key={p.item} className="flex items-center gap-3">
                <span className="text-[11px] text-slate-500 uppercase tracking-wider w-16 shrink-0">{p.item}</span>
                <div className="h-1.5 flex-1 bg-slate-800 rounded-full overflow-hidden">
                  <div className={cls("h-full rounded-full", p.pct >= 90 ? "bg-sky-400" : "bg-orange-400")} style={{ width: `${p.pct}%` }} />
                </div>
                <span className="text-xs text-slate-300 tabular-nums w-9 text-right font-mono">{p.pct}%</span>
              </div>
            ))
          )}
        </div>
      </Panel>
      <Panel title="Environment Overview" icon={Thermometer}>
        <div className="p-4 space-y-4 text-sm text-slate-300">
          <div className="flex justify-between border-b border-slate-800 pb-2">
            <span>Avg Heart Rate</span>
            <span className="font-mono text-sky-400">{avg("hr")} bpm</span>
          </div>
          <div className="flex justify-between border-b border-slate-800 pb-2">
            <span>Avg Temperature</span>
            <span className="font-mono text-sky-400">{avg("temp")} °C</span>
          </div>
          <div className="flex justify-between border-b border-slate-800 pb-2">
            <span>Peak Gas Level</span>
            <span className="font-mono text-orange-400">{maxGas} ppm</span>
          </div>
          <div className="flex justify-between">
            <span>Active PPE Violations</span>
            <span className="font-mono text-rose-400">{violations.length}</span>
          </div>
        </div>
      </Panel>
    </div>
  );
}

/* ================================ MAIN APP ================================= */

export default function App() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [workers, setWorkers] = useState(DEMO_WORKERS); // Empty []
  const [alerts, setAlerts] = useState(DEMO_ALERTS); // Empty []
  const [fallEvents, setFallEvents] = useState(INITIAL_FALL_EVENTS); // Empty []
  const [alcoholScreenings, setAlcoholScreenings] = useState(INITIAL_ALCOHOL_SCREENINGS); // Empty []

  const criticalFalls = fallEvents.filter((e) => e.status === "critical").length;
  const alcoholViolations = alcoholScreenings.filter((s) => s.status === "violation").length;

  const handleAddOrUpdateWorker = (newWorker) => {
    setWorkers((prev) => {
      const idx = prev.findIndex((w) => w.worker_id === newWorker.worker_id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], ...newWorker };
        return next;
      }
      return [newWorker, ...prev];
    });

    if (newWorker.status === "critical" || newWorker.status === "warning") {
      setAlerts((prev) => [
        {
          id: String(Date.now()),
          worker: newWorker.worker_id,
          name: newWorker.worker_name,
          type: newWorker.lastEvent || "Sensor Alert",
          sev: newWorker.status === "critical" ? "critical" : "medium",
          zone: newWorker.zone || "A",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          status: "active",
        },
        ...prev,
      ]);
    }
  };

  const handleClearAll = () => {
    setWorkers([]);
    setAlerts([]);
    setFallEvents([]);
    setAlcoholScreenings([]);
    setSelectedWorker(null);
  };

  const navItems = [
    { id: "overview", label: "Overview", icon: LayoutGrid },
    { id: "workers", label: "Workers", icon: Users },
    { id: "ppe", label: "PPE & Environment", icon: ShieldCheck },
    { id: "fall-events", label: "Fall Events", icon: ShieldAlert, badge: criticalFalls, badgeColor: "bg-rose-500" },
    { id: "alcohol-detection", label: "Alcohol Detection", icon: WineOff, badge: alcoholViolations, badgeColor: "bg-amber-500" },
  ];

  const handleSelectWorker = (worker) => {
    setSelectedWorker(worker);
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900/80 border-r border-slate-800 flex flex-col justify-between shrink-0">
        <div>
          <div className="p-5 border-b border-slate-800 flex items-center gap-2">
            <Radio className="w-5 h-5 text-sky-400" />
            <h1 className="text-sm font-bold tracking-widest text-slate-100 uppercase">CognitiveMesh</h1>
          </div>
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id && !selectedWorker;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSelectedWorker(null);
                  }}
                  className={cls(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                    active
                      ? "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge != null && item.badge > 0 && (
                    <span
                      className={cls(
                        "text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-full text-white shrink-0",
                        item.badgeColor || "bg-rose-500"
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
        <div className="p-3 border-t border-slate-800 flex flex-col gap-2">
          <button
            onClick={handleClearAll}
            className="w-full flex items-center justify-center gap-2 py-1.5 px-2.5 rounded bg-slate-950/60 hover:bg-rose-950/30 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-500/30 text-xs transition-colors"
            title="Reset system to empty clean slate"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All Data</span>
          </button>
          <div className="text-[11px] text-slate-500 flex items-center gap-2 px-1">
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sensors Live</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-6">
        {selectedWorker ? (
          <WorkerProfilePage
            worker={selectedWorker}
            onBack={() => setSelectedWorker(null)}
          />
        ) : (
          <>
            {activeTab === "overview" && (
              <OverviewPage
                workers={workers}
                alerts={alerts}
                ppeCompliance={DEMO_PPE_COMPLIANCE}
                onSelectWorker={handleSelectWorker}
                onNavigateTab={setActiveTab}
                fallEvents={fallEvents}
                alcoholScreenings={alcoholScreenings}
              />
            )}
            {activeTab === "workers" && (
              <WorkersPage
                workers={workers}
                onSelectWorker={handleSelectWorker}
                onAddWorker={handleAddOrUpdateWorker}
              />
            )}
            {activeTab === "ppe" && (
              <PPEEnvironmentPage
                workers={workers}
                ppeCompliance={DEMO_PPE_COMPLIANCE}
              />
            )}
            {activeTab === "fall-events" && (
              <FallEventsPage
                fallEvents={fallEvents}
                onUpdateFallEvents={setFallEvents}
                onSelectWorker={handleSelectWorker}
                workers={workers}
                onAddOrUpdateWorker={handleAddOrUpdateWorker}
              />
            )}
            {activeTab === "alcohol-detection" && (
              <AlcoholDetectionPage
                screenings={alcoholScreenings}
                onUpdateScreenings={setAlcoholScreenings}
                onSelectWorker={handleSelectWorker}
                workers={workers}
                onAddOrUpdateWorker={handleAddOrUpdateWorker}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}