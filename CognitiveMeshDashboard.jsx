import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import {
  LayoutGrid, AlertTriangle, Users, ShieldCheck, Thermometer, Heart, Moon,
  MapPin, Network, BarChart3, History as HistoryIcon, Settings, Wifi,
  RefreshCw, Cloud, CheckCircle2, XCircle, Search, ChevronDown, ArrowLeft,
  Radio, X, PlugZap, Plug, Database,
} from "lucide-react";

/* ============================== demo data ============================== */

const DEMO_WORKERS = [
  { worker_id: "W-482", worker_name: "J. Doe",      role: "Field Tech",   helmet_id: "H-82A", department: "Welding",     zone: "C", status: "critical", lastEvent: "Gas Detected (H2S)", hr: 102, spo2: 96, temp: 31, humidity: 62, gas: 890, co: 12, fatigue: "normal",   lat: 52.5203, lng: 13.4058, ppe: { helmet: true,  vest: true,  gloves: false, goggles: true,  mask: true  } },
  { worker_id: "W-119", worker_name: "A. Smith",    role: "Lead Operator",helmet_id: "H-11B", department: "Assembly",    zone: "A", status: "critical", lastEvent: "Fall Detected",      hr: 108, spo2: 94, temp: 28, humidity: 58, gas: 205, co: 4,  fatigue: "normal",   lat: 52.5192, lng: 13.4042, ppe: { helmet: true,  vest: true,  gloves: true,  goggles: true,  mask: true  } },
  { worker_id: "W-304", worker_name: "M. Lee",      role: "Tech Spec II", helmet_id: "H-44C", department: "Maintenance", zone: "B", status: "warning",  lastEvent: "Missing Vest",       hr: 88,  spo2: 97, temp: 27, humidity: 55, gas: 190, co: 3,  fatigue: "moderate", lat: 52.5197, lng: 13.4051, ppe: { helmet: true,  vest: false, gloves: true,  goggles: true,  mask: true  } },
  { worker_id: "W-221", worker_name: "S. Khan",     role: "Contractor",   helmet_id: "H-99D", department: "Packaging",   zone: "D", status: "warning",  lastEvent: "Elevated HR",        hr: 121, spo2: 96, temp: 29, humidity: 60, gas: 185, co: 2,  fatigue: "normal",   lat: 52.5188, lng: 13.4066, ppe: { helmet: true,  vest: true,  gloves: true,  goggles: true,  mask: true  } },
  { worker_id: "W-829", worker_name: "Marcus Cole",  role: "Tech Spec II", helmet_id: "H-8294", department: "Maintenance", zone: "B", status: "warning", lastEvent: "HR Spike > 120bpm",  hr: 124, spo2: 96, temp: 27, humidity: 55, gas: 195, co: 3,  fatigue: "fatigued", lat: 52.5199, lng: 13.4049, ppe: { helmet: true,  vest: true,  gloves: true,  goggles: true,  mask: true  } },
  { worker_id: "W-331", worker_name: "Elena Jimenez",role: "Lead Operator",helmet_id: "H-3310", department: "Operations", zone: "A", status: "safe",    lastEvent: "Zone Entry",         hr: 79,  spo2: 99, temp: 26, humidity: 52, gas: 180, co: 1,  fatigue: "normal",   lat: 52.5194, lng: 13.4038, ppe: { helmet: true,  vest: true,  gloves: true,  goggles: true,  mask: true  } },
  { worker_id: "W-105", worker_name: "David Kim",    role: "Contractor",  helmet_id: "H-1055", department: "Maintenance", zone: "D", status: "offline", lastEvent: "Shift End / Docked", hr: null, spo2: null, temp: null, humidity: null, gas: null, co: null, fatigue: "normal", lat: 52.5182, lng: 13.407, ppe: { helmet: true,  vest: true,  gloves: true,  goggles: true,  mask: true  } },
];

const DEMO_ALERTS = [
  { id: "1", worker: "W-482", name: "J. Doe",   type: "Gas Detected (H2S)", sev: "critical", zone: "C", time: "14:31:12", status: "active" },
  { id: "2", worker: "W-119", name: "A. Smith", type: "Fall Detected",      sev: "critical", zone: "A", time: "14:28:45", status: "active" },
  { id: "3", worker: "W-304", name: "M. Lee",   type: "Missing Vest",       sev: "high",     zone: "B", time: "14:15:02", status: "active" },
  { id: "4", worker: "W-221", name: "S. Khan",  type: "Elevated HR",        sev: "medium",   zone: "D", time: "13:55:20", status: "active" },
  { id: "5", worker: "W-829", name: "Marcus Cole", type: "Fatigue Alert",   sev: "high",     zone: "B", time: "13:42:01", status: "resolved" },
];

const DEMO_MESH_LOG = [
  { time: "14:02:11", node: "H-094", event: "Connection" },
  { time: "14:01:45", node: "H-112", event: "Handoff" },
  { time: "13:58:22", node: "H-042", event: "Disconnection" },
  { time: "13:55:01", node: "H-088", event: "Connection" },
  { time: "13:42:19", node: "H-017", event: "Disconnection" },
  { time: "13:30:00", node: "H-055", event: "Handoff" },
];

const DEMO_HISTORY = [
  { time: "14:31", date: "Aug 30", worker: "W-482", type: "GAS",     sev: "critical", zone: "C", status: "Active" },
  { time: "14:28", date: "Aug 30", worker: "W-119", type: "FALL",    sev: "critical", zone: "A", status: "Active" },
  { time: "14:15", date: "Aug 30", worker: "W-304", type: "PPE",     sev: "high",     zone: "B", status: "Active" },
  { time: "13:55", date: "Aug 30", worker: "W-221", type: "HEALTH",  sev: "medium",   zone: "D", status: "Active" },
  { time: "13:42", date: "Aug 30", worker: "W-829", type: "FATIGUE", sev: "high",     zone: "B", status: "Resolved" },
];

const DEMO_PPE_COMPLIANCE = [
  { item: "Helmet", pct: 98 }, { item: "Vest", pct: 95 }, { item: "Gloves", pct: 82 },
  { item: "Goggles", pct: 99 }, { item: "Mask", pct: 100 },
];

const DEMO_TREND = [
  { t: "13:31", hr: 79, gas: 190 }, { t: "13:41", hr: 83, gas: 210 }, { t: "13:51", hr: 88, gas: 260 },
  { t: "14:01", hr: 91, gas: 340 }, { t: "14:11", hr: 96, gas: 520 }, { t: "14:21", hr: 99, gas: 710 },
  { t: "14:31", hr: 102, gas: 890 },
];

function zonePosition(zone, seedKey) {
  const base = { A: [12, 15], B: [58, 15], C: [12, 58], D: [58, 58] }[zone] || [30, 40];
  let h = 0;
  for (const c of String(seedKey)) h = (h * 31 + c.charCodeAt(0)) % 97;
  return { x: base[0] + 8 + (h % 24), y: base[1] + 6 + ((h * 7) % 20) };
}

/* ============================== helpers ================================ */

const SEV = {
  critical: { text: "text-rose-400",   dot: "bg-rose-500",   border: "border-rose-500/40",   bg: "bg-rose-500/10",   label: "CRITICAL" },
  high:     { text: "text-orange-400", dot: "bg-orange-500", border: "border-orange-500/40", bg: "bg-orange-500/10", label: "HIGH" },
  medium:   { text: "text-amber-400",  dot: "bg-amber-400",  border: "border-amber-500/40",  bg: "bg-amber-500/10",  label: "MEDIUM" },
  normal:   { text: "text-sky-400",    dot: "bg-sky-400",    border: "border-sky-500/40",    bg: "bg-sky-500/10",    label: "NORMAL" },
};
function sevOf(raw) {
  const s = String(raw || "").toLowerCase();
  if (s.includes("crit")) return "critical";
  if (s.includes("high")) return "high";
  if (s.includes("med")) return "medium";
  return "normal";
}

const STATUS = {
  safe:     { text: "text-sky-400",   dot: "bg-sky-400",   pillBg: "bg-sky-500/15",   pillText: "text-sky-300",   label: "ACTIVE" },
  warning:  { text: "text-orange-400",dot: "bg-orange-400",pillBg: "bg-orange-500/15",pillText: "text-orange-300",label: "WARNING" },
  critical: { text: "text-rose-400",  dot: "bg-rose-500",  pillBg: "bg-rose-500/20",  pillText: "text-rose-300",  label: "CRITICAL" },
  offline:  { text: "text-slate-500", dot: "bg-slate-600", pillBg: "bg-slate-700/40", pillText: "text-slate-400", label: "OFFLINE" },
};

function cls(...a) { return a.filter(Boolean).join(" "); }
function fmtTime(ts) {
  if (!ts) return "--:--:--";
  const d = new Date(ts);
  if (isNaN(d.getTime())) return String(ts).slice(11, 19) || String(ts);
  return d.toLocaleTimeString("en-GB");
}
function fmtDate(ts) {
  const d = new Date(ts);
  if (isNaN(d.getTime())) return String(ts).slice(0, 10);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function initials(name) {
  return String(name || "?").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

/* ============================ supabase layer ============================ */

const STORAGE_KEY = "supabase-config";

async function sbFetch(config, path) {
  const url = `${config.url.replace(/\/$/, "")}/rest/v1/${path}`;
  const res = await fetch(url, { headers: { apikey: config.key, Authorization: `Bearer ${config.key}`, "Content-Type": "application/json" } });
  if (!res.ok) { const body = await res.text().catch(() => ""); throw new Error(`${res.status} ${res.statusText} - ${path} - ${body.slice(0, 200)}`); }
  return res.json();
}
function latestByWorker(rows) {
  const map = {};
  for (const r of rows) if (r.worker_id && !map[r.worker_id]) map[r.worker_id] = r;
  return map;
}

function useSupabaseData(config, pollMs) {
  const [state, setState] = useState({ status: "idle", error: null, data: null, lastUpdated: null });
  const timer = useRef(null);

  const load = useCallback(async () => {
    if (!config || !config.url || !config.key) { setState({ status: "idle", error: null, data: null, lastUpdated: null }); return; }
    setState((s) => ({ ...s, status: s.data ? "refreshing" : "connecting" }));
    try {
      const [workers, alerts, fallEv, gasEv, fatigueEv, ppeDet, sensors, locations, meshEv] = await Promise.all([
        sbFetch(config, "workers?select=*"),
        sbFetch(config, "alerts?select=*&order=timestamp.desc&limit=150"),
        sbFetch(config, "fall_events?select=*&order=timestamp.desc&limit=200"),
        sbFetch(config, "gas_events?select=*&order=timestamp.desc&limit=200"),
        sbFetch(config, "fatigue_events?select=*&order=timestamp.desc&limit=200"),
        sbFetch(config, "ppe_detections?select=*&order=timestamp.desc&limit=400"),
        sbFetch(config, "sensor_readings?select=*&order=timestamp.desc&limit=500"),
        sbFetch(config, "locations?select=*&order=timestamp.desc&limit=400"),
        sbFetch(config, "mesh_events?select=*&order=timestamp.desc&limit=300"),
      ]);

      const latestSensor = latestByWorker(sensors);
      const latestPpe = latestByWorker(ppeDet);
      const latestLoc = latestByWorker(locations);
      const latestAlertByWorker = {};
      for (const a of alerts) if (String(a.status || "").toLowerCase() !== "resolved" && !latestAlertByWorker[a.worker_id]) latestAlertByWorker[a.worker_id] = a;

      const mergedWorkers = workers.map((w) => {
        const sr = latestSensor[w.worker_id] || {};
        const ppe = latestPpe[w.worker_id];
        const loc = latestLoc[w.worker_id];
        const activeAlert = latestAlertByWorker[w.worker_id];
        const sev = activeAlert ? sevOf(activeAlert.severity) : "normal";
        const status = sev === "critical" ? "critical" : sev === "high" || sev === "medium" ? "warning" : "safe";
        const zone = (loc && loc.zone) || w.zone || "A";
        return {
          worker_id: w.worker_id, worker_name: w.worker_name, role: w.department, helmet_id: w.helmet_id,
          department: w.department, zone, status, lastEvent: activeAlert ? activeAlert.alert_type : "—",
          hr: sr.heart_rate_bpm ?? null, spo2: sr.spo2_pct ?? null, temp: sr.temperature_c ?? null,
          humidity: sr.humidity_pct ?? null, gas: sr.gas_ppm ?? null, co: null, fatigue: "normal",
          lat: (loc && loc.latitude) ?? null, lng: (loc && loc.longitude) ?? null,
          ppe: ppe ? { helmet: !!ppe.helmet, vest: !!ppe.vest, gloves: !!ppe.gloves, goggles: !!ppe.goggles, mask: !!ppe.mask } : { helmet: true, vest: true, gloves: true, goggles: true, mask: true },
          _pos: zonePosition(zone, w.worker_id),
        };
      });
      const fatigueByWorker = latestByWorker(fatigueEv);
      for (const w of mergedWorkers) {
        const fe = fatigueByWorker[w.worker_id];
        if (fe) { const score = Number(fe.fatigue_score); w.fatigue = score >= 70 ? "fatigued" : score >= 40 ? "moderate" : "normal"; }
      }

      const nameOf = (id) => (workers.find((w) => w.worker_id === id) || {}).worker_name || id;
      const zoneOf = (id) => (mergedWorkers.find((w) => w.worker_id === id) || {}).zone || "-";
      const liveAlerts = alerts.map((a) => ({ id: a.alert_id, worker: a.worker_id, name: nameOf(a.worker_id), type: a.alert_type, sev: sevOf(a.severity), zone: zoneOf(a.worker_id), time: fmtTime(a.timestamp), status: String(a.status || "").toLowerCase() === "resolved" ? "resolved" : "active" }));

      const typedEvents = [
        ...fallEv.map((e) => ({ ts: e.timestamp, worker: e.worker_id, type: "FALL", sev: sevOf(e.severity), zone: e.zone || zoneOf(e.worker_id) })),
        ...gasEv.map((e) => ({ ts: e.timestamp, worker: e.worker_id, type: "GAS", sev: sevOf(e.severity), zone: e.zone || zoneOf(e.worker_id) })),
        ...fatigueEv.map((e) => ({ ts: e.timestamp, worker: e.worker_id, type: "FATIGUE", sev: sevOf(e.severity), zone: e.zone || zoneOf(e.worker_id) })),
        ...ppeDet.filter((e) => e.violation).map((e) => ({ ts: e.timestamp, worker: e.worker_id, type: "PPE", sev: sevOf(e.severity), zone: e.zone || zoneOf(e.worker_id) })),
      ].sort((a, b) => new Date(b.ts) - new Date(a.ts));
      const eventHistory = typedEvents.slice(0, 150).map((e) => ({ time: fmtTime(e.ts), date: fmtDate(e.ts), worker: e.worker, type: e.type, sev: e.sev, zone: e.zone, status: "Logged" }));

      const ppeItems = ["helmet", "vest", "gloves", "goggles", "mask"];
      const ppeRows = Object.values(latestPpe);
      const ppeCompliance = ppeItems.map((item) => ({ item: item[0].toUpperCase() + item.slice(1), pct: ppeRows.length ? Math.round((ppeRows.filter((r) => r[item]).length / ppeRows.length) * 100) : 100 }));

      const recentHelmetActivity = {};
      for (const m of meshEv) if (!recentHelmetActivity[m.source_helmet]) recentHelmetActivity[m.source_helmet] = m.timestamp;
      const meshNodes = workers.map((w) => {
        const lastTs = recentHelmetActivity[w.helmet_id];
        const active = lastTs && (Date.now() - new Date(lastTs).getTime()) < 10 * 60 * 1000;
        return { helmet: w.helmet_id, worker: w.worker_id, status: active ? "active" : "offline" };
      });
      const meshLog = meshEv.slice(0, 20).map((m) => ({ time: fmtTime(m.timestamp), node: m.source_helmet, event: m.event_type }));

      setState({ status: "connected", error: null, data: { workers: mergedWorkers, alerts: liveAlerts, meshNodes, meshLog, eventHistory, ppeCompliance }, lastUpdated: new Date() });
    } catch (err) {
      setState((s) => ({ ...s, status: "error", error: String(err.message || err) }));
    }
  }, [config]);

  useEffect(() => {
    load();
    if (timer.current) clearInterval(timer.current);
    if (config && config.url && config.key) timer.current = setInterval(load, pollMs);
    return () => timer.current && clearInterval(timer.current);
  }, [load, pollMs, config]);

  return { ...state, reload: load };
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
            const pos = w._pos || { x: 50, y: 50 };
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

/* ================================ pages ================================= */

function OverviewPage({ workers, alerts, ppeCompliance, onSelectWorker }) {
  const safe = workers.filter((w) => w.status === "safe").length;
  const ppeIssues = workers.filter((w) => Object.values(w.ppe).some((v) => !v)).length;
  const activeAlerts = alerts.filter((a) => a.status === "active");
  const fallCount = activeAlerts.filter((a) => String(a.type).toLowerCase().includes("fall")).length;
  const gasCount = activeAlerts.filter((a) => String(a.type).toLowerCase().includes("gas")).length;
  const telemetryWorker = activeAlerts[0]?.worker || workers[0]?.worker_id;
  const [trendMode, setTrendMode] = useState("hr");

  return (
    <div className="flex flex-col gap-4">
      {/* kpi strip */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-md flex flex-wrap divide-x divide-slate-800">
        <div className="px-5 py-3 flex-1 min-w-[130px]">
          <div className="text-[10px] text-slate-500 uppercase tracking-widest">Total Workers</div>
          <div className="text-2xl font-semibold text-slate-100 tabular-nums" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{workers.length}</div>
        </div>
        <div className="px-5 py-3 flex-1 min-w-[130px]">
          <div className="text-[10px] text-slate-500 uppercase tracking-widest">Safe Workers</div>
          <div className="text-2xl font-semibold text-sky-300 tabular-nums" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{safe}</div>
        </div>
        <div className="px-5 py-3 flex-1 min-w-[130px]">
          <div className="text-[10px] text-slate-500 uppercase tracking-widest flex items-center gap-1">Active Alerts</div>
          <div className="text-2xl font-semibold text-slate-100 tabular-nums flex items-center gap-2" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{activeAlerts.length}{activeAlerts.length > 0 && <AlertTriangle className="w-4 h-4 text-amber-400" />}</div>
        </div>
        <div className="px-5 py-3 flex-1 min-w-[130px] border-l-2 border-l-rose-500">
          <div className="text-[10px] text-slate-500 uppercase tracking-widest">Fall Events</div>
          <div className="text-2xl font-semibold text-rose-400 tabular-nums" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{fallCount}</div>
        </div>
        <div className="px-5 py-3 flex-1 min-w-[130px] border-l-2 border-l-orange-500">
          <div className="text-[10px] text-slate-500 uppercase tracking-widest">PPE Violations</div>
          <div className="text-2xl font-semibold text-orange-400 tabular-nums" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{ppeIssues}</div>
        </div>
        <div className="px-5 py-3 flex-1 min-w-[130px]">
          <div className="text-[10px] text-slate-500 uppercase tracking-widest">Gas Events</div>
          <div className="text-2xl font-semibold text-slate-100 tabular-nums" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{gasCount}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
        <div className="flex flex-col gap-4">
          <Panel title="Live Safety Alerts" icon={AlertTriangle} right={<span className="text-[11px] text-slate-500" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>SYS_TIME: {new Date().toISOString().slice(11, 19)}Z</span>}>
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
                  {activeAlerts.map((a) => (
                    <tr key={a.id} onClick={() => { const w = workers.find((x) => x.worker_id === a.worker); w && onSelectWorker(w); }} className="cursor-pointer hover:bg-slate-800/40">
                      <td className="px-4 py-2.5 text-sky-400" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>#{a.worker}</td>
                      <td className="px-4 py-2.5 text-slate-300">{a.name}</td>
                      <td className="px-4 py-2.5 text-slate-500" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{workers.find((w) => w.worker_id === a.worker)?.helmet_id || "—"}</td>
                      <td className="px-4 py-2.5 text-slate-300">{a.type}</td>
                      <td className="px-4 py-2.5"><SevText sev={a.sev} /></td>
                      <td className="px-4 py-2.5 text-slate-400">Z-{a.zone}</td>
                      <td className="px-4 py-2.5 text-slate-500" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{a.time}</td>
                    </tr>
                  ))}
                  {activeAlerts.length === 0 && <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-600">No active alerts.</td></tr>}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel title={`Telemetry: #${telemetryWorker || "—"}`} icon={BarChart3} right={
            <div className="flex gap-1">
              <button onClick={() => setTrendMode("hr")} className={cls("text-[10px] px-2 py-1 rounded border", trendMode === "hr" ? "border-sky-500/40 text-sky-300 bg-sky-500/10" : "border-slate-700 text-slate-500")}>HR</button>
              <button onClick={() => setTrendMode("gas")} className={cls("text-[10px] px-2 py-1 rounded border", trendMode === "gas" ? "border-sky-500/40 text-sky-300 bg-sky-500/10" : "border-slate-700 text-slate-500")}>GAS</button>
              <span className="text-[10px] px-2 py-1 rounded border border-slate-800 text-slate-600">(1h)</span>
            </div>
          }>
            <div className="p-3 h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={DEMO_TREND} margin={{ top: 6, right: 12, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="t" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={{ stroke: "#334155" }} tickLine={false} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 6, fontSize: 12 }} />
                  <Line type="monotone" dataKey={trendMode} stroke={trendMode === "hr" ? "#38bdf8" : "#fb923c"} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <div className="flex flex-col gap-4">
          <Panel title="Sector Schematic" icon={MapPin}>
            <div className="p-3"><ZoneSchematic workers={workers} onSelect={onSelectWorker} /></div>
          </Panel>
          <Panel title="PPE Compliance (Sector)" icon={ShieldCheck}>
            <div className="p-4 space-y-3">
              {ppeCompliance.map((p) => (
                <div key={p.item} className="flex items-center gap-3">
                  <span className="text-[11px] text-slate-500 uppercase tracking-wider w-16 shrink-0">{p.item}</span>
                  <div className="h-1.5 flex-1 bg-slate-800 rounded-full overflow-hidden">
                    <div className={cls("h-full rounded-full", p.pct >= 90 ? "bg-sky-400" : "bg-orange-400")} style={{ width: `${p.pct}%` }} />
                  </div>
                  <span className="text-xs text-slate-300 tabular-nums w-9 text-right" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{p.pct}%</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function WorkersPage({ workers, onSelectWorker }) {
  const [q, setQ] = useState("");
  const [zone, setZone] = useState("all");
  const [dept, setDept] = useState("all");
  const [statusF, setStatusF] = useState("all");
  const zones = Array.from(new Set(workers.map((w) => w.zone)));
  const depts = Array.from(new Set(workers.map((w) => w.department)));

  const filtered = workers.filter((w) =>
    (w.worker_name + w.worker_id).toLowerCase().includes(q.toLowerCase()) &&
    (zone === "all" || w.zone === zone) &&
    (dept === "all" || w.department === dept) &&
    (statusF === "all" || w.status === statusF)
  );

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-2xl font-semibold text-slate-100 mb-4">Workers Directory</h2>
        <div className="bg-slate-900/60 border border-slate-800 rounded-md p-3 flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[220px]">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Search Name/ID</div>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-600 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. J. Doe or W-829" className="w-full bg-slate-950 border border-slate-800 rounded pl-8 pr-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-sky-600" />
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Zone</div>
            <select value={zone} onChange={(e) => setZone(e.target.value)} className="bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-sky-600">
              <option value="all">All Zones</option>
              {zones.map((z) => <option key={z} value={z}>Zone {z}</option>)}
            </select>
          </div>
          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Department</div>
            <select value={dept} onChange={(e) => setDept(e.target.value)} className="bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-sky-600">
              <option value="all">All Depts</option>
              {depts.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Status</div>
            <select value={statusF} onChange={(e) => setStatusF(e.target.value)} className="bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-sky-600">
              <option value="all">All Status</option>
              <option value="safe">Active</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
              <option value="offline">Offline</option>
            </select>
          </div>
        </div>
      </div>

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
                        <div className="text-slate-200">{w.worker_name}</div>
                        <div className="text-[11px] text-slate-500">{w.role || w.department}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sky-400" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{w.helmet_id}</td>
                  <td className="px-4 py-3 text-slate-400">{w.department}</td>
                  <td className="px-4 py-3 text-slate-400">{typeof w.zone === "string" && w.zone.length === 1 ? `Zone ${w.zone}` : w.zone}</td>
                  <td className="px-4 py-3"><StatusPill status={w.status} /></td>
                  <td className="px-4 py-3">
                    <div className="text-slate-300 text-xs">{w.lastEvent}</div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-600">No workers match these filters.</td></tr>}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function PPEEnvironmentPage({ workers, ppeCompliance }) {
  const violations = workers.flatMap((w) => Object.entries(w.ppe).filter(([, v]) => !v).map(([item]) => ({ worker: w.worker_id, item, zone: w.zone })));
  const avg = (key) => { const vals = workers.map((w) => w[key]).filter((v) => v != null); return vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : "—"; };
  const maxGas = Math.max(0, ...workers.map((w) => w.gas || 0));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Panel title="PPE Compliance" icon={ShieldCheck}>
        <div className="p-4 space-y-3">
          {ppeCompliance.map((p) => (
            <div key={p.item} className="flex items-center gap-3">
              <span className="text-[11px] text-slate-500 uppercase tracking-wider w-16 shrink-0">{p.item}</span>
              <div className="h-2 flex-1 bg-slate-800 rounded-full overflow-hidden">
                <div className={cls("h-full rounded-full", p.pct >= 90 ? "bg-sky-400" : "bg-orange-400")} style={{ width: `${p.pct}%` }} />
              </div>
              <span className="text-xs text-slate-300 tabular-nums w-9 text-right" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{p.pct}%</span>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Current PPE Violations" icon={AlertTriangle}>
        <div className="divide-y divide-slate-800">
          {violations.length === 0 && <div className="px-4 py-6 text-sm text-slate-600 text-center">No violations detected.</div>}
          {violations.map((v, i) => (
            <div key={i} className="px-4 py-2.5 flex items-center gap-3 text-sm">
              <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="text-sky-400 w-16" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{v.worker}</span>
              <span className="text-slate-400 capitalize">No {v.item}</span>
              <span className="ml-auto text-slate-500 text-xs">Zone {v.zone}</span>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Environmental Monitoring" icon={Thermometer} className="lg:col-span-2">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-md p-3">
            <div className="text-[11px] text-slate-500 uppercase tracking-wider">Avg Temp</div>
            <div className="text-2xl font-semibold text-slate-100 tabular-nums" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{avg("temp")}°C</div>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-md p-3">
            <div className="text-[11px] text-slate-500 uppercase tracking-wider">Avg Humidity</div>
            <div className="text-2xl font-semibold text-slate-100 tabular-nums" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{avg("humidity")}%</div>
          </div>
          <div className="bg-slate-950 border border-rose-500/40 rounded-md p-3">
            <div className="text-[11px] text-slate-500 uppercase tracking-wider">Peak Gas</div>
            <div className="text-2xl font-semibold text-rose-400 tabular-nums" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{maxGas} ppm</div>
          </div>
        </div>
      </Panel>
    </div>
  );
}

function HealthFatiguePage({ workers, onSelectWorker }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Panel title="Worker Health" icon={Heart}>
        <div className="divide-y divide-slate-800">
          {workers.map((w) => (
            <button key={w.worker_id} onClick={() => onSelectWorker(w)} className="w-full text-left px-4 py-2.5 flex items-center gap-3 text-sm hover:bg-slate-800/40 transition-colors">
              <Avatar name={w.worker_name} size="w-7 h-7" />
              <span className="text-slate-200 w-28 truncate">{w.worker_name}</span>
              <span className={cls("tabular-nums", w.hr > 110 ? "text-rose-400" : "text-slate-400")} style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{w.hr ?? "—"} bpm</span>
              <span className={cls("tabular-nums", w.spo2 < 95 ? "text-rose-400" : "text-slate-400")} style={{ fontFamily: "'IBM Plex Mono', monospace" }}>SpO₂ {w.spo2 ?? "—"}%</span>
              <span className="ml-auto"><StatusPill status={w.status} /></span>
            </button>
          ))}
        </div>
      </Panel>
      <Panel title="Cognitive / Fatigue Status" icon={Moon}>
        <div className="divide-y divide-slate-800">
          {workers.map((w) => {
            const f = w.fatigue;
            const tone = f === "fatigued" ? SEV.high : f === "moderate" ? SEV.medium : SEV.normal;
            return (
              <button key={w.worker_id} onClick={() => onSelectWorker(w)} className="w-full text-left px-4 py-2.5 flex items-center gap-3 text-sm hover:bg-slate-800/40 transition-colors">
                <span className="text-sky-400 w-20" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{w.worker_id}</span>
                <span className="text-slate-500 flex-1 truncate">{w.worker_name}</span>
                <span className={cls("inline-flex items-center gap-1.5 text-xs font-medium capitalize", tone.text)}><span className={cls("w-1.5 h-1.5 rounded-full", tone.dot)} />{f}</span>
              </button>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}

function LocationPage({ workers, onSelectWorker }) {
  return (
    <Panel title="Site Map" icon={MapPin}>
      <div className="p-4">
        <ZoneSchematic workers={workers} onSelect={onSelectWorker} />
        <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-sky-400" />Safe</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-orange-400" />Warning</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-rose-500" />Critical</span>
          <span className="ml-auto text-slate-600">Positions simulated by zone — connect real coordinates for GPS-accurate placement.</span>
        </div>
      </div>
    </Panel>
  );
}

function MeshPage({ meshNodes, meshLog }) {
  const active = meshNodes.filter((n) => n.status === "active").length;
  const healthLabel = meshNodes.length === 0 ? "UNKNOWN" : (active / meshNodes.length) > 0.9 ? "GOOD" : "DEGRADED";
  const [dots] = useState(() => Array.from({ length: 14 }, (_, i) => ({ x: 8 + ((i * 37) % 84), y: 10 + ((i * 53) % 80), active: i % 5 !== 0 })));
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-2xl font-semibold text-slate-100">Mesh Network Monitor</h2>
        <p className="text-sm text-slate-500 mt-1">Real-time cognitive mesh topology and node status.</p>
      </div>
      <div className="flex flex-wrap gap-8 py-2">
        <div><div className="text-xs text-slate-500 uppercase tracking-wider">Total Helmets</div><div className="text-3xl font-semibold text-slate-100 tabular-nums" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{meshNodes.length}</div></div>
        <div><div className="text-xs text-slate-500 uppercase tracking-wider">Active Nodes</div><div className="text-3xl font-semibold text-sky-400 tabular-nums" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{active}</div></div>
        <div><div className="text-xs text-slate-500 uppercase tracking-wider">Offline Nodes</div><div className="text-3xl font-semibold text-rose-400 tabular-nums" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{meshNodes.length - active}</div></div>
        <div><div className="text-xs text-slate-500 uppercase tracking-wider">Mesh Health</div><div className="text-3xl font-semibold text-slate-100">{healthLabel}</div></div>
        <div><div className="text-xs text-slate-500 uppercase tracking-wider">LoRa Gateway</div><div className="text-3xl font-semibold text-orange-400 flex items-center gap-2"><Wifi className="w-6 h-6" />CONNECTED</div></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
        <Panel title="Topology Map" right={<div className="flex gap-2"><span className="text-[10px] px-2 py-1 rounded border border-sky-500/40 text-sky-300 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-sky-400" />Active</span><span className="text-[10px] px-2 py-1 rounded border border-rose-500/40 text-rose-300 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-rose-500" />Offline</span></div>}>
          <div className="relative h-[420px] p-4">
            {dots.map((d, i) => (
              <span key={i} className={cls("absolute w-2 h-2 rounded-full", d.active ? "bg-sky-400" : "bg-rose-500")} style={{ left: `${d.x}%`, top: `${d.y}%` }} />
            ))}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
              <span className="w-4 h-4 rounded-full bg-sky-400 shadow-[0_0_16px_4px_rgba(56,189,248,0.4)]" />
              <span className="text-[10px] text-slate-500 mt-1">GW-01</span>
            </div>
          </div>
        </Panel>
        <Panel title="Mesh Event Log" icon={Radio}>
          <div className="divide-y divide-slate-800">
            {meshLog.map((m, i) => {
              const t = m.event.toLowerCase().includes("discon") ? "text-rose-400 bg-rose-500/5" : m.event.toLowerCase().includes("handoff") ? "text-orange-400" : "text-sky-400";
              return (
                <div key={i} className={cls("px-4 py-2.5 flex items-center gap-3 text-sm", t.includes("bg-") && t)}>
                  <span className="text-slate-500 tabular-nums w-16" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{m.time}</span>
                  <span className="text-slate-400 w-16" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{m.node}</span>
                  <span className={cls("ml-auto", t.split(" ")[0])}>{m.event}</span>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function HistoryPage({ eventHistory }) {
  const [q, setQ] = useState("");
  const filtered = eventHistory.filter((e) => (e.worker + e.type + e.zone).toLowerCase().includes(q.toLowerCase()));
  return (
    <Panel title="Event History" icon={HistoryIcon} right={<input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search worker, type, zone…" className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-sky-600 w-48" />}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-[10px] text-slate-500 uppercase tracking-wider border-b border-slate-800"><th className="px-4 py-2.5 font-medium">Time</th><th className="px-4 py-2.5 font-medium">Worker</th><th className="px-4 py-2.5 font-medium">Type</th><th className="px-4 py-2.5 font-medium">Severity</th><th className="px-4 py-2.5 font-medium">Zone</th><th className="px-4 py-2.5 font-medium">Status</th></tr></thead>
          <tbody className="divide-y divide-slate-800/70">
            {filtered.map((e, i) => (
              <tr key={i} className="hover:bg-slate-800/30">
                <td className="px-4 py-2.5 text-slate-400 tabular-nums" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{e.date} · {e.time}</td>
                <td className="px-4 py-2.5 text-sky-400" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{e.worker}</td>
                <td className="px-4 py-2.5 text-slate-400">{e.type}</td>
                <td className="px-4 py-2.5"><SevText sev={e.sev} /></td>
                <td className="px-4 py-2.5 text-slate-400">Zone {e.zone}</td>
                <td className="px-4 py-2.5"><span className={cls("text-xs px-2 py-0.5 rounded-full border", e.status === "Active" ? "text-rose-300 border-rose-500/40 bg-rose-500/10" : "text-slate-400 border-slate-700 bg-slate-800/50")}>{e.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function WorkerDetailPage({ worker, onBack }) {
  const [trendKeys, setTrendKeys] = useState({ hr: true, gas: true });
  if (!worker) return null;
  const critical = worker.status === "critical";
  return (
    <div className="flex flex-col gap-4">
      <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 w-fit"><ArrowLeft className="w-3.5 h-3.5" />Back</button>

      <div className={cls("rounded-md border p-4 flex items-center justify-between gap-4 flex-wrap", critical ? "border-rose-500/40 bg-rose-500/5" : "border-slate-800 bg-slate-900/60")}>
        <div className="flex items-center gap-4">
          <Avatar name={worker.worker_name} size="w-16 h-16" tone={critical ? "border-rose-500/50 text-rose-300 text-lg" : "border-slate-700 text-slate-200 text-lg"} />
          <div>
            <div className="text-2xl font-semibold text-slate-100">{worker.worker_name}</div>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>ID: {worker.worker_id}</span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>HELMET: {worker.helmet_id}</span>
            </div>
          </div>
        </div>
        {worker.lastEvent && worker.lastEvent !== "—" && (
          <div className={cls("rounded-md border px-4 py-2.5", critical ? "border-rose-500/50 bg-rose-500/10" : "border-slate-700 bg-slate-800/40")}>
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-400"><AlertTriangle className="w-3.5 h-3.5" />Status {critical ? "Critical" : "Notice"}</div>
            <div className={cls("text-lg font-semibold uppercase", critical ? "text-rose-300" : "text-slate-200")}>{worker.lastEvent}</div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Panel title="Vitals" icon={Heart}>
          <div className="p-4 flex gap-6">
            <div><div className="text-[11px] text-slate-500 uppercase">Heart Rate</div><div className={cls("text-3xl font-semibold tabular-nums", worker.hr > 110 ? "text-rose-400" : "text-slate-100")} style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{worker.hr ?? "—"}<span className="text-sm text-slate-500 ml-1">bpm</span></div></div>
            <div><div className="text-[11px] text-slate-500 uppercase">SpO2</div><div className={cls("text-3xl font-semibold tabular-nums", worker.spo2 < 95 ? "text-rose-400" : "text-sky-400")} style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{worker.spo2 ?? "—"}<span className="text-sm text-slate-500 ml-1">%</span></div></div>
          </div>
        </Panel>
        <Panel title="Environment" icon={Thermometer}>
          <div className="p-4 space-y-2 text-sm">
            <div className="flex justify-between border-b border-dashed border-slate-800 pb-1.5"><span className="text-slate-500">Temp</span><span className="text-slate-200 tabular-nums" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{worker.temp ?? "—"}°C</span></div>
            <div className="flex justify-between border-b border-dashed border-slate-800 pb-1.5"><span className="text-slate-500">Humidity</span><span className="text-slate-200 tabular-nums" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{worker.humidity ?? "—"}%</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Gas / CO</span><span className={cls("tabular-nums flex items-center gap-1", (worker.gas || 0) > 500 ? "text-rose-400" : "text-slate-200")} style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{worker.gas ?? worker.co ?? "—"}{(worker.gas || 0) > 500 && <AlertTriangle className="w-3.5 h-3.5" />}</span></div>
          </div>
        </Panel>
        <Panel title="PPE Status" icon={ShieldCheck}>
          <div className="divide-y divide-slate-800">
            {Object.entries(worker.ppe).map(([item, ok]) => (
              <div key={item} className={cls("flex items-center justify-between px-4 py-2 text-sm", !ok && "bg-rose-500/10")}>
                <span className={cls("capitalize", ok ? "text-slate-300" : "text-rose-300")}>{item}</span>
                {ok ? <CheckCircle2 className="w-4 h-4 text-sky-400" /> : <XCircle className="w-4 h-4 text-rose-400" />}
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="flex flex-col gap-4">
          <Panel title="Latest Activity" icon={HistoryIcon}>
            <div className="divide-y divide-slate-800">
              {worker.lastEvent && worker.lastEvent !== "—" && (
                <div className="px-4 py-2.5 bg-rose-500/10 border-l-2 border-l-rose-500">
                  <div className="text-[11px] text-slate-500 tabular-nums" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>just now</div>
                  <div className="text-sm text-rose-300 font-medium">{worker.lastEvent}</div>
                  <div className="text-xs text-slate-500">Zone {worker.zone} · auto-alert dispatched</div>
                </div>
              )}
              <div className="px-4 py-2.5">
                <div className="text-[11px] text-slate-500 tabular-nums" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>earlier</div>
                <div className="text-sm text-slate-300">Zone check-in — Zone {worker.zone}</div>
              </div>
            </div>
          </Panel>
          <Panel title="24h Trends" icon={BarChart3} right={
            <div className="flex gap-1">
              <button onClick={() => setTrendKeys((s) => ({ ...s, hr: !s.hr }))} className={cls("text-[10px] px-2 py-1 rounded border", trendKeys.hr ? "border-sky-500/40 text-sky-300 bg-sky-500/10" : "border-slate-700 text-slate-500")}>HR</button>
              <button onClick={() => setTrendKeys((s) => ({ ...s, gas: !s.gas }))} className={cls("text-[10px] px-2 py-1 rounded border", trendKeys.gas ? "border-orange-500/40 text-orange-300 bg-orange-500/10" : "border-slate-700 text-slate-500")}>GAS</button>
            </div>
          }>
            <div className="p-3 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={DEMO_TREND} margin={{ top: 6, right: 12, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="t" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={{ stroke: "#334155" }} tickLine={false} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 6, fontSize: 12 }} />
                  {trendKeys.hr && <Line type="monotone" dataKey="hr" stroke="#38bdf8" strokeWidth={2} dot={false} />}
                  {trendKeys.gas && <Line type="monotone" dataKey="gas" stroke="#fb923c" strokeWidth={2} strokeDasharray="4 3" dot={false} />}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel title="Location" icon={MapPin} right={<span className="text-[10px] px-2 py-1 rounded border border-slate-700 text-slate-400">Zone {worker.zone}</span>}>
          <div className="p-4">
            <div className="relative aspect-square bg-slate-950 border border-slate-800 rounded-md overflow-hidden">
              <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
                {["A", "B", "C", "D"].map((z) => (
                  <div key={z} className={cls("border-slate-800/70 flex items-start p-2", (z === "A" || z === "C") && "border-r", (z === "A" || z === "B") && "border-b")}>
                    <span className="text-[10px] text-slate-700 tracking-widest uppercase">Zone {z}</span>
                  </div>
                ))}
              </div>
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                <span className={cls("w-4 h-4 rounded-full border-2 border-slate-950", critical ? "bg-rose-500 animate-pulse" : "bg-sky-400")} />
                <span className="mt-1 text-[10px] bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-slate-300">{initials(worker.worker_name)}</span>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <div className="flex-1 bg-slate-950 border border-slate-800 rounded px-3 py-2"><div className="text-[10px] text-slate-500 uppercase">Lat</div><div className="text-sm text-slate-300 tabular-nums" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{worker.lat ? `${worker.lat.toFixed(4)}° N` : "—"}</div></div>
              <div className="flex-1 bg-slate-950 border border-slate-800 rounded px-3 py-2"><div className="text-[10px] text-slate-500 uppercase">Lng</div><div className="text-sm text-slate-300 tabular-nums" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{worker.lng ? `${worker.lng.toFixed(4)}° E` : "—"}</div></div>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function ConnectionModal({ open, onClose, config, onSave, onDisconnect, status, error, lastUpdated }) {
  const [url, setUrl] = useState(config?.url || "");
  const [key, setKey] = useState(config?.key || "");
  useEffect(() => { setUrl(config?.url || ""); setKey(config?.key || ""); }, [config, open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-md">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <div className="flex items-center gap-2"><Database className="w-4 h-4 text-sky-400" /><h3 className="text-sm font-semibold text-slate-200">Supabase connection</h3></div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <label className="text-[11px] text-slate-500 uppercase tracking-wider">Supabase URL</label>
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://your-project.supabase.co" className="mt-1 w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-sky-600" />
          </div>
          <div>
            <label className="text-[11px] text-slate-500 uppercase tracking-wider">Supabase key (anon / public)</label>
            <input value={key} onChange={(e) => setKey(e.target.value)} type="password" placeholder="eyJhbGciOi..." className="mt-1 w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-sky-600" />
          </div>
          {status === "error" && <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded px-3 py-2">{error}</div>}
          {status === "connected" && <div className="text-xs text-sky-400 bg-sky-500/10 border border-sky-500/30 rounded px-3 py-2 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" />Connected · last updated {lastUpdated ? lastUpdated.toLocaleTimeString("en-GB") : "—"}</div>}
          <div className="flex items-center gap-2 pt-1">
            <button onClick={() => onSave({ url: url.trim(), key: key.trim() })} className="flex-1 bg-sky-500/15 border border-sky-500/40 text-sky-300 rounded px-3 py-2 text-sm font-medium hover:bg-sky-500/25 transition-colors flex items-center justify-center gap-1.5"><PlugZap className="w-4 h-4" />Connect &amp; save</button>
            {config?.url && <button onClick={onDisconnect} className="px-3 py-2 rounded border border-slate-700 text-slate-400 hover:text-slate-200 text-sm">Disconnect</button>}
          </div>
        </div>
      </div>
    </div>
  );
}

const NAV = [
  { key: "overview", label: "Dashboard", icon: LayoutGrid },
  { key: "alerts", label: "Alerts", icon: AlertTriangle },
  { key: "workers", label: "Workers", icon: Users },
  { key: "ppe", label: "PPE Monitoring", icon: ShieldCheck },
  { key: "environment", label: "Environment", icon: Thermometer },
  { key: "health", label: "Health", icon: Heart },
  { key: "fatigue", label: "Fatigue", icon: Moon },
  { key: "location", label: "Location", icon: MapPin },
  { key: "mesh", label: "Mesh Network", icon: Network },
  { key: "analytics", label: "Analytics", icon: BarChart3 },
  { key: "history", label: "Event History", icon: HistoryIcon },
];

export default function CognitiveMeshDashboard() {
  const [page, setPage] = useState("overview");
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [config, setConfig] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = window.storage ? await window.storage.get(STORAGE_KEY, false) : null;
        if (res && res.value) setConfig(JSON.parse(res.value));
      } catch (e) {}
    })();
  }, []);

  const { status, error, data, lastUpdated } = useSupabaseData(config, 8000);

  const saveConfig = useCallback(async (cfg) => {
    setConfig(cfg);
    try { window.storage && (await window.storage.set(STORAGE_KEY, JSON.stringify(cfg), false)); } catch (e) {}
    setModalOpen(false);
  }, []);
  const disconnect = useCallback(async () => {
    try { window.storage && (await window.storage.delete(STORAGE_KEY, false)); } catch (e) {}
    setConfig(null);
    setModalOpen(false);
  }, []);

  const live = status === "connected" && data;
  const workers = live ? data.workers : DEMO_WORKERS.map((w) => ({ ...w, _pos: zonePosition(w.zone, w.worker_id) }));
  const alerts = live ? data.alerts : DEMO_ALERTS;
  const meshNodes = live ? data.meshNodes : DEMO_WORKERS.map((w) => ({ helmet: w.helmet_id, worker: w.worker_id, status: w.status === "offline" ? "offline" : "active" }));
  const meshLog = live ? data.meshLog : DEMO_MESH_LOG;
  const eventHistory = live ? data.eventHistory : DEMO_HISTORY;
  const ppeCompliance = live ? data.ppeCompliance : DEMO_PPE_COMPLIANCE;

  const activeAlertCount = alerts.filter((a) => a.status === "active").length;
  const selectWorker = (w) => { setSelectedWorker(w); setPage("workerDetail"); };
  const connLabel = status === "connected" || status === "refreshing" ? "Connected" : status === "connecting" ? "Connecting…" : status === "error" ? "Connection error" : "Demo data";

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-200" style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap');`}</style>

      <div className="flex">
        <aside className="hidden md:flex flex-col w-60 shrink-0 border-r border-slate-800 bg-slate-950 min-h-screen">
          <div className="px-5 py-5 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-sky-500/10 border border-sky-500/40 flex items-center justify-center"><Network className="w-4 h-4 text-sky-400" /></div>
            <div>
              <div className="text-lg font-bold text-sky-300 leading-none" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>CognitiveMesh</div>
              <div className="text-[11px] text-slate-500 mt-0.5">System Operator</div>
            </div>
          </div>
          <nav className="flex-1 py-2">
            {NAV.map((n) => {
              const Icon = n.icon;
              const activeItem = page === n.key || (page === "workerDetail" && n.key === "workers");
              return (
                <button key={n.key} onClick={() => setPage(n.key)} className={cls("w-full flex items-center gap-2.5 px-5 py-2 text-sm transition-colors", activeItem ? "text-slate-100 bg-slate-800/60" : "text-slate-500 hover:text-slate-300 hover:bg-slate-900")}>
                  <Icon className="w-4 h-4" />{n.label}
                  {n.key === "alerts" && activeAlertCount > 0 && <span className="ml-auto text-[10px] bg-rose-500/20 text-rose-400 rounded-full px-1.5 py-0.5 tabular-nums">{activeAlertCount}</span>}
                </button>
              );
            })}
          </nav>
          <div className="px-5 py-4 border-t border-slate-800">
            <button onClick={() => setPage("settings")} className={cls("w-full flex items-center gap-2.5 text-sm py-1.5", page === "settings" ? "text-slate-100" : "text-slate-500 hover:text-slate-300")}><Settings className="w-4 h-4" />Settings</button>
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur border-b border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
            <div className="text-3xl font-bold text-sky-300" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>CognitiveMesh</div>
            <div className="flex items-center gap-3">
              <span className="text-xs px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-400 hidden sm:inline">SECTOR 01</span>
              <button onClick={() => setModalOpen(true)} title={connLabel} className="text-slate-500 hover:text-slate-300"><Wifi className={cls("w-4 h-4", (status === "connected" || status === "refreshing") && "text-sky-400")} /></button>
              <button onClick={() => setModalOpen(true)} title="Reconnect / refresh" className="text-slate-500 hover:text-slate-300"><RefreshCw className={cls("w-4 h-4", status === "refreshing" && "animate-spin")} /></button>
              <button onClick={() => setModalOpen(true)} title={config ? "Data source" : "Connect Supabase"} className="text-slate-500 hover:text-slate-300">{config ? <Plug className="w-4 h-4" /> : <Cloud className="w-4 h-4" />}</button>
            </div>
          </header>

          <div className="md:hidden flex overflow-x-auto gap-1 px-3 py-2 border-b border-slate-800 bg-slate-900/40">
            {NAV.map((n) => (<button key={n.key} onClick={() => setPage(n.key)} className={cls("shrink-0 px-3 py-1.5 rounded text-xs", page === n.key ? "bg-sky-500/10 text-sky-300" : "text-slate-500")}>{n.label}</button>))}
          </div>

          <main className="p-4 sm:p-6">
            {!live && (
              <div className="mb-4 text-xs text-slate-500 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />Showing demo data — <button onClick={() => setModalOpen(true)} className="text-sky-400 hover:underline">connect Supabase</button> for live readings.
              </div>
            )}
            {page === "overview" && <OverviewPage workers={workers} alerts={alerts} ppeCompliance={ppeCompliance} onSelectWorker={selectWorker} />}
            {page === "alerts" && <HistoryPage eventHistory={alerts.map((a) => ({ time: a.time, date: "", worker: a.worker, type: a.type, sev: a.sev, zone: a.zone, status: a.status === "active" ? "Active" : "Resolved" }))} />}
            {page === "workers" && <WorkersPage workers={workers} onSelectWorker={selectWorker} />}
            {page === "workerDetail" && <WorkerDetailPage worker={selectedWorker} onBack={() => setPage("workers")} />}
            {page === "ppe" && <PPEEnvironmentPage workers={workers} ppeCompliance={ppeCompliance} />}
            {page === "environment" && <PPEEnvironmentPage workers={workers} ppeCompliance={ppeCompliance} />}
            {page === "health" && <HealthFatiguePage workers={workers} onSelectWorker={selectWorker} />}
            {page === "fatigue" && <HealthFatiguePage workers={workers} onSelectWorker={selectWorker} />}
            {page === "location" && <LocationPage workers={workers} onSelectWorker={selectWorker} />}
            {page === "mesh" && <MeshPage meshNodes={meshNodes} meshLog={meshLog} />}
            {page === "analytics" && <HistoryPage eventHistory={eventHistory} />}
            {page === "history" && <HistoryPage eventHistory={eventHistory} />}
            {page === "settings" && (
              <Panel title="Settings" icon={Settings}>
                <div className="p-4">
                  <button onClick={() => setModalOpen(true)} className="bg-sky-500/15 border border-sky-500/40 text-sky-300 rounded px-4 py-2 text-sm font-medium flex items-center gap-2 hover:bg-sky-500/25 transition-colors"><Database className="w-4 h-4" />Manage Supabase connection</button>
                </div>
              </Panel>
            )}
          </main>
        </div>
      </div>

      <ConnectionModal open={modalOpen} onClose={() => setModalOpen(false)} config={config} onSave={saveConfig} onDisconnect={disconnect} status={status} error={error} lastUpdated={lastUpdated} />
    </div>
  );
}