import { useState, useEffect, useCallback } from "react";

const API_BASE = "/api/v1";
const TOKEN = "3541031f-baf2-4737-a7e8-c66396e5a5e3";
const headers = { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" };

async function apiFetch(path) {
  const res = await fetch(`${API_BASE}${path}`, { headers });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

function extract(obj, keys) {
  if (Array.isArray(obj)) return obj;
  for (const k of keys) if (obj && Array.isArray(obj[k])) return obj[k];
  return [];
}

function formatDate(d) {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt) || dt.getFullYear() < 2000) return "—";
  return dt.toLocaleDateString("is-IS", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function daysSince(d) {
  if (!d) return 999;
  const dt = new Date(d);
  if (isNaN(dt)) return 999;
  return Math.floor((Date.now() - dt.getTime()) / 86400000);
}


function KpiCard({ label, value, sub, accent }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "20px 24px", borderLeft: `4px solid ${accent}`, display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
      <span style={{ fontSize: 32, fontWeight: 700, color: "#111827", lineHeight: 1.1 }}>{value}</span>
      {sub && <span style={{ fontSize: 13, color: "#6b7280" }}>{sub}</span>}
    </div>
  );
}

function StatusBadge({ status }) {
  const cfg = {
    active:       { bg: "#d1fae5", color: "#065f46", label: "Virkt" },
    low_activity: { bg: "#fef3c7", color: "#92400e", label: "Lítil virkni" },
    no_activity:  { bg: "#fee2e2", color: "#991b1b", label: "Engin virkni" },
    healthy:      { bg: "#dbeafe", color: "#1e3a8a", label: "Eðlilegt" },
    warning:      { bg: "#fee2e2", color: "#991b1b", label: "Athugið" },
    issue:        { bg: "#fef3c7", color: "#92400e", label: "Möguleg vandamál" },
  }[status] || { bg: "#f3f4f6", color: "#6b7280", label: status };
  return <span style={{ background: cfg.bg, color: cfg.color, padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600 }}>{cfg.label}</span>;
}

function SectionHeader({ title }) {
  return <h2 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700, color: "#111827" }}>{title}</h2>;
}

function Spinner() {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
      <div style={{ width: 32, height: 32, border: "3px solid #e5e7eb", borderTop: "3px solid #6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    </div>
  );
}

function Pagination({ page, setPage, total, perPage }) {
  const totalPages = Math.ceil(total / perPage);
  if (total <= perPage) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, fontSize: 13 }}>
      <button
        onClick={() => setPage(p => Math.max(0, p - 1))}
        disabled={page === 0}
        style={{ padding: "5px 14px", borderRadius: 7, border: "1px solid #e5e7eb", background: "#fff", cursor: page === 0 ? "not-allowed" : "pointer", color: page === 0 ? "#9ca3af" : "#374151", fontWeight: 600 }}>
        ← Fyrri
      </button>
      <span style={{ color: "#6b7280" }}>Síða {page + 1} af {totalPages}</span>
      <button
        onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
        disabled={page >= totalPages - 1}
        style={{ padding: "5px 14px", borderRadius: 7, border: "1px solid #e5e7eb", background: "#fff", cursor: page >= totalPages - 1 ? "not-allowed" : "pointer", color: page >= totalPages - 1 ? "#9ca3af" : "#374151", fontWeight: 600 }}>
        Næsta →
      </button>
      <span style={{ color: "#9ca3af", marginLeft: 4 }}>{total} samtals</span>
    </div>
  );
}

const thStyle = { textAlign: "left", color: "#9ca3af", fontWeight: 600, fontSize: 11, textTransform: "uppercase", padding: "0 8px 10px 0", letterSpacing: "0.05em" };
const PER_PAGE = 60;

export default function App() {
  const [loading, setLoading]     = useState(true);
  const [data, setData]           = useState(null);
  const [tab, setTab]             = useState("overview");
  const [projPage, setProjPage]   = useState(0);
  const [empPage, setEmpPage]     = useState(0);
  const [clockPage, setClockPage] = useState(0);
  const [projSearch, setProjSearch] = useState("");
  const [projFilter, setProjFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [empRes, clockRes, projRes] = await Promise.allSettled([
        apiFetch("/general/employee?pageSize=200"),
        apiFetch("/TimeClock/entries?pageSize=500"),
        apiFetch("/project?pageSize=500"),
      ]);
      setData({
        employees: empRes.status   === "fulfilled" ? empRes.value   : null,
        clock:     clockRes.status === "fulfilled" ? clockRes.value : null,
        projects:  projRes.status  === "fulfilled" ? projRes.value  : null,
        errors: [empRes, clockRes, projRes].filter(r => r.status !== "fulfilled").map(r => r.reason?.message),
      });
      setProjPage(0);
      setEmpPage(0);
      setClockPage(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const empList     = extract(data?.employees, ["employees","items","data"]);
  const clockList   = extract(data?.clock,     ["entries","items","data"]);
  const projectList = extract(data?.projects,  ["projects","items","data"]);

  // ── Metrics ──
  const activeEmp     = empList.filter(e => (e.Status ?? 0) === 0);
  const cut30         = Date.now() - 30 * 86400000;
  const recentClock   = clockList.filter(e => new Date(e.Start || 0).getTime() > cut30);
  const clockDates    = clockList.map(e => new Date(e.Start || 0)).filter(d => !isNaN(d) && d.getFullYear() > 2000);
  const latestClock   = clockDates.length ? new Date(Math.max(...clockDates.map(x => x.getTime()))) : null;
  const dSince        = latestClock ? daysSince(latestClock) : 999;
  const activeRecorders = new Set(recentClock.map(e => e.Employee));
  const totalHours    = clockList.reduce((s, e) => s + Number(e.TotalHours || 0), 0);
  const activeProjects = projectList.filter(p => (p.JobStatus ?? 0) === 0);
  const filteredProjects = projectList.filter(p => {
  const matchesSearch =
    (p.Name || "").toLowerCase().includes(projSearch.toLowerCase()) ||
    (p.Number || "").toLowerCase().includes(projSearch.toLowerCase()) ||
    (p.CustomerNameToBill || "").toLowerCase().includes(projSearch.toLowerCase());

  const isActive = (p.JobStatus ?? 0) === 0;

  const matchesFilter =
    projFilter === "all" ||
    (projFilter === "active" && isActive) ||
    (projFilter === "closed" && !isActive);

  return matchesSearch && matchesFilter;
});

  const suspiciousEntries = clockList
    .filter(e => Number(e.TotalHours || 0) > 24)
    .sort((a, b) => Number(b.TotalHours) - Number(a.TotalHours));
  const maxSuspicious = suspiciousEntries.length > 0 ? Math.round(Number(suspiciousEntries[0].TotalHours)) : 0;

  // ── Business logic ──
  let actSt = "active", actNote = "Reglulegar tímaskráningar";
  if (dSince > 30)      { actSt = "no_activity";  actNote = "Engar færslur síðustu 30 daga"; }
  else if (dSince > 14) { actSt = "low_activity"; actNote = `Síðasta færsla fyrir ${dSince} dögum`; }

  const recorderPct = activeEmp.length > 0 ? (activeRecorders.size / activeEmp.length) * 100 : 100;
  let useSt = "active", useNote = "";
  if (recorderPct >= 70)      { useSt = "active";       useNote = "Góð þátttaka — meirihluti skráir tíma"; }
  else if (recorderPct >= 50) { useSt = "low_activity"; useNote = "Undir meðallagi — yfir helmingur skráir"; }
  else if (recorderPct >= 30) { useSt = "issue";        useNote = "Athuga — minnihluti skráir"; }
  else                        { useSt = "no_activity";  useNote = "Mjög lág þátttaka — aðgerð gæti þurft"; }
  const useDetail = `${activeRecorders.size} af ${activeEmp.length} (${Math.round(recorderPct)}%) skráðu síðustu 30 daga`;

  const pctBarColor = recorderPct >= 70 ? "#22c55e" : recorderPct >= 50 ? "#f59e0b" : recorderPct >= 30 ? "#f97316" : "#ef4444";

  // ── Paginated slices ──
  const sortedClock = [...clockList].sort((a, b) => new Date(b.Start || 0) - new Date(a.Start || 0));
  const projSlice   = filteredProjects.slice(projPage * PER_PAGE, projPage * PER_PAGE + PER_PAGE);
  const empSlice    = empList.slice(empPage        * PER_PAGE, empPage   * PER_PAGE + PER_PAGE);
  const clockSlice  = sortedClock.slice(clockPage  * PER_PAGE, clockPage * PER_PAGE + PER_PAGE);

  const tabs = [
    { id: "overview",  label: "Yfirlit" },
    { id: "employees", label: `Starfsmenn (${empList.length})` },
    { id: "clock",     label: `Tímaskráningar (${clockList.length})` },
    { id: "projects",  label: `Verkefni (${projectList.length})` },
  ];

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: "24px 32px", maxWidth: 980, margin: "0 auto", background: "#f9fafb", minHeight: "100vh" }}>
      <style>{`* { box-sizing: border-box; } table { border-collapse: collapse; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, background: "#6366f1", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 16 }}>dk</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#111827" }}>dkPlus Dashboard</h1>
            <p style={{ margin: 0, fontSize: 12, color: "#9ca3af" }}>ERP yfirlit · Demo fyrirtæki · {new Date().toLocaleTimeString("is-IS")}</p>
          </div>
        </div>
        <button onClick={load} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, color: "#374151", cursor: "pointer" }}>↻ Uppfæra</button>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "#e5e7eb", padding: 4, borderRadius: 10, width: "fit-content" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            background: tab === t.id ? "#fff" : "transparent", border: "none", borderRadius: 7,
            padding: "6px 16px", fontSize: 13, fontWeight: tab === t.id ? 700 : 500,
            color: tab === t.id ? "#111827" : "#6b7280", cursor: "pointer",
            boxShadow: tab === t.id ? "0 1px 3px rgba(0,0,0,0.08)" : "none"
          }}>{t.label}</button>
        ))}
      </div>

      {loading && <Spinner />}

      {!loading && data && (
        <>
          {/* ══════════ YFIRLIT ══════════ */}
          {tab === "overview" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

              {/* KPIs */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                <KpiCard label="Starfsmenn"         value={activeEmp.length}      sub={`${empList.length} samtals`}          accent="#6366f1" />
                <KpiCard label="Tímaskráningar"     value={clockList.length}      sub="Tímaskráningar"                    accent="#10b981" />
                <KpiCard label="Skr. síðustu 30 d." value={recentClock.length}    sub={`${Math.round(totalHours)}h samtals`} accent="#f59e0b" />
                <KpiCard label="Virk verkefni"      value={activeProjects.length} sub={`${projectList.length} samtals`}      accent="#3b82f6" />
              </div>

              {/* Stöðumat */}
              <div>
                <SectionHeader title="Stöðumat" />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                  {[
                    { title: "Tímaskráningavirkni", status: actSt, note: actNote, detail: latestClock ? `Síðasta: ${formatDate(latestClock)}` : "Engar skráningar", icon: "⏱" },
                    { title: "Þátttaka starfsmanna", status: useSt, note: useNote, detail: useDetail, icon: "👥" },
                    { title: "Gagnagæði", status: clockList.length > 0 && empList.length > 0 ? "active" : "low_activity", note: "API tenging virk", detail: `${empList.length} starfsm · ${projectList.length} verk · ${clockList.length} skr.`, icon: "✓" },
                  ].map(({ title, status, note, detail, icon }) => {
                    const bg     = { active:"#f0fdf4", low_activity:"#fffbeb", no_activity:"#fef2f2", healthy:"#eff6ff", warning:"#fef2f2", issue:"#fffbeb" }[status] || "#f9fafb";
                    const border = { active:"#86efac", low_activity:"#fcd34d", no_activity:"#fca5a5", healthy:"#93c5fd", warning:"#fca5a5", issue:"#fcd34d" }[status] || "#e5e7eb";
                    return (
                      <div key={title} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 12, padding: "16px 20px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                          <div>
                            <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 700, color: "#374151" }}>{title}</p>
                            <StatusBadge status={status} />
                          </div>
                          <span style={{ fontSize: 22 }}>{icon}</span>
                        </div>
                        <p style={{ margin: "0 0 4px", fontSize: 13, color: "#374151" }}>{note}</p>
                        <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>{detail}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Þátttaka progress bar */}
              <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "20px 24px" }}>
                <SectionHeader title="Þátttaka starfsmanna síðustu 30 daga" />
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
                  <div style={{ flex: 1, background: "#e5e7eb", borderRadius: 999, height: 14 }}>
                    <div style={{ width: `${Math.min(recorderPct, 100)}%`, height: "100%", borderRadius: 999, background: pctBarColor, transition: "width 0.5s ease" }} />
                  </div>
                  <span style={{ fontSize: 20, fontWeight: 800, color: "#111827", minWidth: 56 }}>{Math.round(recorderPct)}%</span>
                </div>
                <div style={{ display: "flex", gap: 20, fontSize: 12, flexWrap: "wrap" }}>
                  <span style={{ color: "#16a34a", fontWeight: 600 }}>🟢 ≥70% Góð þátttaka</span>
                  <span style={{ color: "#d97706", fontWeight: 600 }}>🟡 50–69% Undir meðallagi</span>
                  <span style={{ color: "#ea580c", fontWeight: 600 }}>🟠 30–49% Athuga</span>
                  <span style={{ color: "#dc2626", fontWeight: 600 }}>🔴 &lt;30% Mjög lág</span>
                </div>
              </div>

              {/* Grunsamlegar skráningar */}
              {suspiciousEntries.length > 0 && (
                <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 12, padding: "16px 20px" }}>
                  <SectionHeader title={`⚠️ Grunsamlegar skráningar — yfir 24 tímar (${suspiciousEntries.length})`} />
                  <table style={{ width: "100%", fontSize: 13 }}>
                    <thead><tr>{["Starfsmaður","Upphaf","Lok","Tímar","Verkefni","Athugasemd"].map(h => <th key={h} style={{ ...thStyle, color: "#b91c1c" }}>{h}</th>)}</tr></thead>
                    <tbody>
                      {suspiciousEntries.map((e, i) => (
                        <tr key={i} style={{ borderTop: "1px solid #fecaca" }}>
                          <td style={{ padding: "7px 8px 7px 0", color: "#374151", fontWeight: 700 }}>{e.Employee || "—"}</td>
                          <td style={{ padding: "7px 8px 7px 0", color: "#6b7280" }}>{formatDate(e.Start)}</td>
                          <td style={{ padding: "7px 8px 7px 0", color: "#6b7280" }}>{formatDate(e.End)}</td>
                          <td style={{ padding: "7px 8px 7px 0", color: "#991b1b", fontWeight: 800 }}>{Number(e.TotalHours).toFixed(1)}h</td>
                          <td style={{ padding: "7px 8px 7px 0", color: "#6b7280" }}>{e.Project || "—"}</td>
                          <td style={{ padding: "7px 0", color: "#9ca3af" }}>{e.Comment || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Stærstu verkefni eftir tímaskráningum */}
              <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "20px 24px" }}>
                <SectionHeader title="Verkefni eftir tímaskráningum" />
                {(() => {
                  const projHours = {};
                  clockList.forEach(e => {
                    if (e.Project) projHours[e.Project] = (projHours[e.Project] || 0) + Number(e.TotalHours || 0);
                  });
                  const top = Object.entries(projHours).sort((a, b) => b[1] - a[1]).slice(0, 8);
                  const maxH = top[0]?.[1] || 1;
                  if (top.length === 0) return <p style={{ color: "#9ca3af", fontSize: 13 }}>Engar skráningar</p>;
                  return (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {top.map(([proj, hours]) => {
                        const projInfo = projectList.find(p => p.Number === proj || String(p.Id) === proj);
                        const name = projInfo?.Name || proj;
                        return (
                          <div key={proj}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                              <span style={{ color: "#374151", fontWeight: 600 }}>{name}</span>
                              <span style={{ color: "#6b7280", fontWeight: 700 }}>{Math.round(hours)}h</span>
                            </div>
                            <div style={{ background: "#e5e7eb", borderRadius: 999, height: 8 }}>
                              <div style={{ width: `${(hours / maxH) * 100}%`, height: "100%", borderRadius: 999, background: "#6366f1" }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* Mini tables */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px 20px" }}>
                  <SectionHeader title="Nýjustu skráningar" />
                  <table style={{ width: "100%", fontSize: 13 }}>
                    <thead><tr>{["Starfsm.","Upphaf","Tímar"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                    <tbody>
                      {sortedClock.slice(0, 6).map((e, i) => {
                        const sus = Number(e.TotalHours || 0) > 24;
                        return (
                          <tr key={i} style={{ borderTop: "1px solid #f3f4f6", background: sus ? "#fef9c3" : "transparent" }}>
                            <td style={{ padding: "7px 8px 7px 0", color: "#374151", fontWeight: 500 }}>{e.Employee || "—"}</td>
                            <td style={{ padding: "7px 8px 7px 0", color: "#6b7280" }}>{formatDate(e.Start)}</td>
                            <td style={{ padding: "7px 0", color: sus ? "#b45309" : "#111827", fontWeight: 700 }}>
                              {e.TotalHours != null ? `${Number(e.TotalHours).toFixed(1)}h` : "—"}{sus && " ⚠️"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px 20px" }}>
                  <SectionHeader title="Verkefni" />
                  <table style={{ width: "100%", fontSize: 13 }}>
                    <thead><tr>{["Heiti","Viðskiptavinur","Staða"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                    <tbody>
                      {projectList.slice(0, 6).map((p, i) => (
                        <tr key={i} style={{ borderTop: "1px solid #f3f4f6" }}>
                          <td style={{ padding: "7px 8px 7px 0", color: "#374151", fontWeight: 500 }}>{p.Name || `#${p.Number}`}</td>
                          <td style={{ padding: "7px 8px 7px 0", color: "#6b7280", fontSize: 12 }}>{p.CustomerNameToBill || "—"}</td>
                          <td style={{ padding: "7px 0" }}>
                            <span style={{ background: p.JobStatus === 0 ? "#dbeafe" : "#f3f4f6", color: p.JobStatus === 0 ? "#1e40af" : "#6b7280", padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
                              {p.JobStatus === 0 ? "Virkt" : "Lokið"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {data.errors?.length > 0 && (
                <div style={{ background: "#fef9c3", border: "1px solid #fcd34d", borderRadius: 8, padding: "12px 16px", fontSize: 12, color: "#92400e" }}>
                  <strong>Sumir endpoints svöruðu ekki: </strong>{data.errors.join(" | ")}
                </div>
              )}
            </div>
          )}

          {/* ══════════ STARFSMENN ══════════ */}
          {tab === "employees" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: "#374151", whiteSpace: "nowrap" }}>Þátttaka síðustu 30 daga:</span>
                  <div style={{ flex: 1, background: "#e5e7eb", borderRadius: 999, height: 10 }}>
                    <div style={{ width: `${Math.min(recorderPct, 100)}%`, height: "100%", borderRadius: 999, background: pctBarColor }} />
                  </div>
                  <span style={{ fontWeight: 700, fontSize: 15, whiteSpace: "nowrap" }}>{activeRecorders.size}/{activeEmp.length} ({Math.round(recorderPct)}%)</span>
                </div>
              </div>
              <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "20px 24px" }}>
                <SectionHeader title={`Starfsmenn (${empList.length})`} />
                <table style={{ width: "100%", fontSize: 13 }}>
                  <thead><tr>{["Númer","Nafn","Staða","Skráði síðustu 30 d."].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                  <tbody>
                    {empSlice.map((e, i) => {
                      const recorded = activeRecorders.has(e.Number);
                      return (
                        <tr key={i} style={{ borderTop: "1px solid #f3f4f6" }}>
                          <td style={{ padding: "8px 8px 8px 0", color: "#9ca3af" }}>{e.Number || "—"}</td>
                          <td style={{ padding: "8px 8px 8px 0", color: "#111827", fontWeight: 600 }}>{e.Name || "—"}</td>
                          <td style={{ padding: "8px 8px 8px 0" }}>
                            <span style={{ background: e.Status === 0 ? "#dcfce7" : "#f3f4f6", color: e.Status === 0 ? "#166534" : "#6b7280", padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
                              {e.Status === 0 ? "Virk/ur" : "Óvirk/ur"}
                            </span>
                          </td>
                          <td style={{ padding: "8px 0" }}>
                            <span style={{ background: recorded ? "#dcfce7" : "#fef9c3", color: recorded ? "#166534" : "#92400e", padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
                              {recorded ? "✓ Já" : "✗ Nei"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <Pagination page={empPage} setPage={setEmpPage} total={empList.length} perPage={PER_PAGE} />
              </div>
            </div>
          )}

          {/* ══════════ TÍMASKRÁNINGAR ══════════ */}
          {tab === "clock" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                <KpiCard label="Samtals"          value={clockList.length}              accent="#6366f1" />
                <KpiCard label="Síðustu 30 dagar" value={recentClock.length}           accent="#10b981" />
                <KpiCard label="Heildartímar"     value={`${Math.round(totalHours)}h`} accent="#f59e0b" />
              </div>
              {suspiciousEntries.length > 0 && (
                <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: "12px 16px", fontSize: 13, color: "#991b1b" }}>
                  <strong>⚠️ Athugið: </strong>{suspiciousEntries.length} skráning(ar) með yfir 24 tíma. Hæsta: <strong>{maxSuspicious}h</strong> — starfsmaður {suspiciousEntries[0]?.Employee}. Merktar með gulum bakgrunni.
                </div>
              )}
              <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "20px 24px" }}>
                <SectionHeader title="Tímaskráningar" />
                <table style={{ width: "100%", fontSize: 13 }}>
                  <thead><tr>{["Starfsmaður","Upphaf","Lok","Tímar","Verkefni","Athugasemd"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                  <tbody>
                    {clockSlice.map((e, i) => {
                      const sus = Number(e.TotalHours || 0) > 24;
                      return (
                        <tr key={i} style={{ borderTop: "1px solid #f3f4f6", background: sus ? "#fef9c3" : "transparent" }}>
                          <td style={{ padding: "7px 8px 7px 0", color: "#374151", fontWeight: 600 }}>{e.Employee || "—"}</td>
                          <td style={{ padding: "7px 8px 7px 0", color: "#6b7280", whiteSpace: "nowrap" }}>{formatDate(e.Start)}</td>
                          <td style={{ padding: "7px 8px 7px 0", color: "#6b7280", whiteSpace: "nowrap" }}>{formatDate(e.End)}</td>
                          <td style={{ padding: "7px 8px 7px 0", fontWeight: 700, color: sus ? "#b45309" : "#111827" }}>
                            {e.TotalHours != null ? `${Number(e.TotalHours).toFixed(1)}h` : "—"}{sus && " ⚠️"}
                          </td>
                          <td style={{ padding: "7px 8px 7px 0", color: "#6b7280" }}>{e.Project || "—"}</td>
                          <td style={{ padding: "7px 0", color: "#9ca3af", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.Comment || "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <Pagination page={clockPage} setPage={setClockPage} total={clockList.length} perPage={PER_PAGE} />
              </div>
            </div>
          )}

          {/* ══════════ VERKEFNI ══════════ */}
          {tab === "projects" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                <KpiCard label="Samtals" value={projectList.length}                        accent="#9ca3af" />
                <KpiCard label="Virk"   value={activeProjects.length}                      accent="#3b82f6" />
                <KpiCard label="Lokið"  value={projectList.length - activeProjects.length} accent="#f59e0b" />
              </div>
              <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "20px 24px" }}>
                <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
              <input
                value={projSearch}
                onChange={e => { setProjSearch(e.target.value); setProjPage(0); }}
                placeholder="Leita að verkefni..."
                style={{ flex: 1, minWidth: 200, padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13 }}
              />
              {["all","active","closed"].map((f, i) => (
                <button key={f} onClick={() => { setProjFilter(f); setProjPage(0); }} style={{
                  padding: "6px 14px", borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: "pointer",
                  border: projFilter === f ? "none" : "1px solid #e5e7eb",
                  background: projFilter === f ? "#6366f1" : "#fff",
                  color: projFilter === f ? "#fff" : "#374151",
                }}>{["Öll","Virk","Lokið"][i]}</button>
              ))}
            </div>
                <SectionHeader title="Verkefni" />
            
                <table style={{ width: "100%", fontSize: 13 }}>
                  <thead><tr>{["Númer","Heiti","Viðskiptavinur","Staða","Stofnað"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                  <tbody>
                    {projSlice.map((p, i) => (
                      <tr key={i} style={{ borderTop: "1px solid #f3f4f6" }}>
                        <td style={{ padding: "7px 8px 7px 0", color: "#9ca3af" }}>{p.Number || "—"}</td>
                        <td style={{ padding: "7px 8px 7px 0", color: "#111827", fontWeight: 600 }}>{p.Name || "—"}</td>
                        <td style={{ padding: "7px 8px 7px 0", color: "#6b7280" }}>{p.CustomerNameToBill || "—"}</td>
                        <td style={{ padding: "7px 8px 7px 0" }}>
                          <span style={{ background: p.JobStatus === 0 ? "#dbeafe" : "#f3f4f6", color: p.JobStatus === 0 ? "#1e40af" : "#6b7280", padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
                            {p.JobStatus === 0 ? "Virkt" : "Lokið"}
                          </span>
                        </td>
                        <td style={{ padding: "7px 0", color: "#9ca3af" }}>{formatDate(p.FoundingDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Pagination page={projPage} setPage={setProjPage} total={filteredProjects.length} perPage={PER_PAGE} />
              </div>
            </div>
          )}
        </>
      )}

      <div style={{ marginTop: 32, borderTop: "1px solid #e5e7eb", paddingTop: 16, color: "#9ca3af", fontSize: 11 }}>
        Endpoints: /general/employee · /TimeClock/entries · /project · dkPlus REST API v1
      </div>
    </div>
  );
}
